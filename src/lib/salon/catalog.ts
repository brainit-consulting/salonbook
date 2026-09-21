import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { services, stylistServices, stylists, timeOff, workingHours } from "@/lib/db/schema";
import { logActivity } from "@/lib/activity";
import { SalonError } from "./errors";

// Services, stylists, weekly hours and days off. Pages and agent tools both
// come through here, so there is one set of rules.

export type Service = typeof services.$inferSelect;
export type Stylist = typeof stylists.$inferSelect;
export type WorkingHours = typeof workingHours.$inferSelect;
export type TimeOff = typeof timeOff.$inferSelect;
export type StylistWithDetail = Stylist & { serviceIds: string[]; hours: WorkingHours[] };

export async function listServices(opts: { includeInactive?: boolean } = {}): Promise<Service[]> {
  return db
    .select()
    .from(services)
    .where(opts.includeInactive ? undefined : eq(services.active, true))
    .orderBy(asc(services.sortOrder), asc(services.name));
}

export async function getService(id: string): Promise<Service | null> {
  const [row] = await db.select().from(services).where(eq(services.id, id));
  return row ?? null;
}

export async function listStylists(
  opts: { includeInactive?: boolean; serviceId?: string } = {},
): Promise<StylistWithDetail[]> {
  const rows = await db
    .select()
    .from(stylists)
    .where(opts.includeInactive ? undefined : eq(stylists.active, true))
    .orderBy(asc(stylists.sortOrder), asc(stylists.name));
  if (!rows.length) return [];

  const ids = rows.map((r) => r.id);
  const [links, hours] = await Promise.all([
    db.select().from(stylistServices).where(inArray(stylistServices.stylistId, ids)),
    db
      .select()
      .from(workingHours)
      .where(inArray(workingHours.stylistId, ids))
      .orderBy(asc(workingHours.weekday), asc(workingHours.startMinute)),
  ]);

  const detailed = rows.map((s) => ({
    ...s,
    serviceIds: links.filter((l) => l.stylistId === s.id).map((l) => l.serviceId),
    hours: hours.filter((h) => h.stylistId === s.id),
  }));
  return opts.serviceId
    ? detailed.filter((s) => s.serviceIds.includes(opts.serviceId!))
    : detailed;
}

export async function getStylist(id: string): Promise<StylistWithDetail | null> {
  const all = await listStylists({ includeInactive: true });
  return all.find((s) => s.id === id) ?? null;
}

export type ServiceInput = { name: string; durationMinutes: number; priceCents: number };

function checkService(input: ServiceInput) {
  if (!input.name.trim()) throw new SalonError("invalid", "A service needs a name.");
  if (
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < 5 ||
    input.durationMinutes > 480
  )
    throw new SalonError("invalid", "Length must be between 5 minutes and 8 hours.");
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0)
    throw new SalonError("invalid", "Price can't be negative.");
}

export async function createService(input: ServiceInput, userId: string) {
  checkService(input);
  const [row] = await db
    .insert(services)
    .values({ ...input, name: input.name.trim() })
    .returning();
  await logActivity("service.added", { serviceId: row.id, name: row.name }, userId);
  return row;
}

export async function updateService(id: string, input: ServiceInput, userId: string) {
  checkService(input);
  const [row] = await db
    .update(services)
    .set({ ...input, name: input.name.trim() })
    .where(eq(services.id, id))
    .returning();
  if (!row) throw new SalonError("not_found", "That service doesn't exist.");
  await logActivity("service.edited", { serviceId: id, name: row.name }, userId);
  return row;
}

/** Hides a service from booking. Past bookings keep pointing at it. */
export async function setServiceActive(id: string, active: boolean, userId: string) {
  const [row] = await db.update(services).set({ active }).where(eq(services.id, id)).returning();
  if (!row) throw new SalonError("not_found", "That service doesn't exist.");
  await logActivity(
    active ? "service.restored" : "service.removed",
    { serviceId: id, name: row.name },
    userId,
  );
  return row;
}

export type StylistInput = { name: string; serviceIds: string[] };

export async function createStylist(input: StylistInput, userId: string) {
  if (!input.name.trim()) throw new SalonError("invalid", "A stylist needs a name.");
  const [row] = await db.insert(stylists).values({ name: input.name.trim() }).returning();
  await setStylistServices(row.id, input.serviceIds);
  await logActivity("stylist.added", { stylistId: row.id, name: row.name }, userId);
  return row;
}

export async function updateStylist(id: string, input: StylistInput, userId: string) {
  if (!input.name.trim()) throw new SalonError("invalid", "A stylist needs a name.");
  const [row] = await db
    .update(stylists)
    .set({ name: input.name.trim() })
    .where(eq(stylists.id, id))
    .returning();
  if (!row) throw new SalonError("not_found", "That stylist doesn't exist.");
  await setStylistServices(id, input.serviceIds);
  await logActivity("stylist.edited", { stylistId: id, name: row.name }, userId);
  return row;
}

/** Takes a stylist off the booking pages. Their past bookings stay in the diary. */
export async function setStylistActive(id: string, active: boolean, userId: string) {
  const [row] = await db.update(stylists).set({ active }).where(eq(stylists.id, id)).returning();
  if (!row) throw new SalonError("not_found", "That stylist doesn't exist.");
  await logActivity(
    active ? "stylist.restored" : "stylist.removed",
    { stylistId: id, name: row.name },
    userId,
  );
  return row;
}

async function setStylistServices(stylistId: string, serviceIds: string[]) {
  await db.delete(stylistServices).where(eq(stylistServices.stylistId, stylistId));
  const unique = [...new Set(serviceIds)];
  if (unique.length) {
    await db.insert(stylistServices).values(unique.map((serviceId) => ({ stylistId, serviceId })));
  }
}

export type HoursInput = { weekday: number; startMinute: number; endMinute: number };

/** Replaces a stylist's whole week. Days left out are days they don't work. */
export async function setWorkingHours(stylistId: string, week: HoursInput[], userId: string) {
  for (const h of week) {
    if (h.weekday < 0 || h.weekday > 6)
      throw new SalonError("invalid", "That isn't a day of the week.");
    if (h.startMinute < 0 || h.endMinute > 24 * 60 || h.endMinute <= h.startMinute)
      throw new SalonError("invalid", "Closing time must be after opening time.");
  }
  await db.delete(workingHours).where(eq(workingHours.stylistId, stylistId));
  if (week.length) await db.insert(workingHours).values(week.map((h) => ({ ...h, stylistId })));
  await logActivity("hours.changed", { stylistId, days: week.length }, userId);
}

export async function listTimeOff(
  opts: { stylistId?: string; from?: Date } = {},
): Promise<TimeOff[]> {
  return db
    .select()
    .from(timeOff)
    .where(
      and(
        opts.stylistId ? eq(timeOff.stylistId, opts.stylistId) : undefined,
        opts.from ? gte(timeOff.endsAt, opts.from) : undefined,
      ),
    )
    .orderBy(asc(timeOff.startsAt));
}

export async function addTimeOff(
  input: { stylistId: string; startsAt: Date; endsAt: Date; reason?: string },
  userId: string,
) {
  if (input.endsAt <= input.startsAt)
    throw new SalonError("invalid", "Time off must end after it starts.");
  const [row] = await db
    .insert(timeOff)
    .values({ ...input, reason: input.reason?.trim() || null })
    .returning();
  await logActivity("time_off.added", { stylistId: input.stylistId, timeOffId: row.id }, userId);
  return row;
}

export async function removeTimeOff(id: string, userId: string) {
  const [row] = await db.delete(timeOff).where(eq(timeOff.id, id)).returning();
  if (!row) throw new SalonError("not_found", "That time off doesn't exist.");
  await logActivity("time_off.removed", { stylistId: row.stylistId, timeOffId: id }, userId);
}
