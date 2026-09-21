"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwnerAction } from "@/lib/auth-guards";
import {
  addTimeOff,
  createStylist,
  type HoursInput,
  getStylist,
  removeTimeOff,
  setStylistActive,
  setWorkingHours,
  updateStylist,
} from "@/lib/salon/catalog";
import { addDays, atMinute, isDay, today } from "@/lib/salon/time";
import { type ActionResult, invalid, salonResult } from "../services/action-result";
import { parseClock } from "./week";

const id = z.uuid();
const stylistFields = z.object({
  name: z.string().max(80),
  serviceIds: z.array(z.uuid()).max(100),
});
const weekFields = z
  .array(z.object({ weekday: z.number().int(), start: z.string(), end: z.string() }))
  .max(7);
const timeOffFields = z.object({
  day: z.string(),
  allDay: z.boolean(),
  from: z.string(),
  to: z.string(),
  reason: z.string().max(120),
});

export type StylistFields = z.input<typeof stylistFields>;
export type WeekFields = z.input<typeof weekFields>;
export type TimeOffFields = z.input<typeof timeOffFields>;

const NO_STYLIST = "That stylist doesn't exist.";

// Stylists and their hours decide what the booking pages and the diary show,
// so the whole site is refreshed rather than a list of paths.
function refresh() {
  revalidatePath("/", "layout");
}

export async function addStylistAction(fields: StylistFields): Promise<ActionResult> {
  const session = await requireOwnerAction();
  const parsed = stylistFields.safeParse(fields);
  if (!parsed.success) return invalid("Check the name and the services.");
  const result = await salonResult(() => createStylist(parsed.data, session.user.id));
  refresh();
  return result;
}

export async function editStylistAction(
  stylistId: string,
  fields: StylistFields,
): Promise<ActionResult> {
  const session = await requireOwnerAction();
  if (!id.safeParse(stylistId).success) return invalid(NO_STYLIST);
  const parsed = stylistFields.safeParse(fields);
  if (!parsed.success) return invalid("Check the name and the services.");
  const result = await salonResult(() => updateStylist(stylistId, parsed.data, session.user.id));
  refresh();
  return result;
}

export async function setStylistActiveAction(
  stylistId: string,
  active: boolean,
): Promise<ActionResult> {
  const session = await requireOwnerAction();
  if (!id.safeParse(stylistId).success) return invalid(NO_STYLIST);
  const result = await salonResult(() =>
    setStylistActive(stylistId, active === true, session.user.id),
  );
  refresh();
  return result;
}

/** One entry per day worked. Days left out are days off. */
export async function saveWeekAction(stylistId: string, week: WeekFields): Promise<ActionResult> {
  const session = await requireOwnerAction();
  if (!id.safeParse(stylistId).success || !(await getStylist(stylistId))) return invalid(NO_STYLIST);
  const parsed = weekFields.safeParse(week);
  if (!parsed.success) return invalid("Check the days and times.");

  const hours: HoursInput[] = [];
  for (const row of parsed.data) {
    const startMinute = parseClock(row.start);
    const endMinute = parseClock(row.end);
    if (startMinute === null || endMinute === null)
      return invalid("Every working day needs a start and an end time.");
    hours.push({ weekday: row.weekday, startMinute, endMinute });
  }
  if (new Set(hours.map((h) => h.weekday)).size !== hours.length)
    return invalid("Each day can only be listed once.");

  const result = await salonResult(() => setWorkingHours(stylistId, hours, session.user.id));
  refresh();
  return result;
}

export async function addTimeOffAction(
  stylistId: string,
  fields: TimeOffFields,
): Promise<ActionResult> {
  const session = await requireOwnerAction();
  if (!id.safeParse(stylistId).success || !(await getStylist(stylistId))) return invalid(NO_STYLIST);
  const parsed = timeOffFields.safeParse(fields);
  if (!parsed.success) return invalid("Check the date and times.");
  const { day, allDay, from, to, reason } = parsed.data;
  if (!isDay(day)) return invalid("Pick a date.");
  if (day < today()) return invalid("Pick today or a later date.");

  // atMinute reads the day as salon time, so 9:00 means 9:00 in Beacon
  // whatever clock the server or the owner's laptop is on.
  let startsAt: Date;
  let endsAt: Date;
  if (allDay) {
    startsAt = atMinute(day, 0);
    endsAt = atMinute(addDays(day, 1), 0);
  } else {
    const fromMinute = parseClock(from);
    const toMinute = parseClock(to);
    if (fromMinute === null || toMinute === null)
      return invalid("Give a from and a to time, or choose all day.");
    startsAt = atMinute(day, fromMinute);
    endsAt = atMinute(day, toMinute);
  }

  const result = await salonResult(() =>
    addTimeOff({ stylistId, startsAt, endsAt, reason }, session.user.id),
  );
  refresh();
  return result;
}

export async function removeTimeOffAction(timeOffId: string): Promise<ActionResult> {
  const session = await requireOwnerAction();
  if (!id.safeParse(timeOffId).success) return invalid("That time off doesn't exist.");
  const result = await salonResult(() => removeTimeOff(timeOffId, session.user.id));
  refresh();
  return result;
}
