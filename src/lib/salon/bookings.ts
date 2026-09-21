import { randomBytes } from "node:crypto";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, services, stylists } from "@/lib/db/schema";
import { logActivity } from "@/lib/activity";
import { getFreeSlots } from "./availability";
import { salon } from "./config";
import { SalonError } from "./errors";
import { notifyBooked, notifyCancelled } from "./notify";
import { dayOf } from "./time";

export type Booking = typeof bookings.$inferSelect;
export type BookingDetail = Booking & {
  serviceName: string;
  priceCents: number;
  stylistName: string;
};
export type Actor = "client" | "owner" | "agent";

function detailQuery() {
  return db
    .select({
      booking: bookings,
      serviceName: services.name,
      priceCents: services.priceCents,
      stylistName: stylists.name,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(stylists, eq(bookings.stylistId, stylists.id));
}

type DetailRow = Awaited<ReturnType<typeof detailQuery>>[number];

function flatten(row: DetailRow): BookingDetail {
  return {
    ...row.booking,
    serviceName: row.serviceName,
    priceCents: row.priceCents,
    stylistName: row.stylistName,
  };
}

export async function getBooking(id: string): Promise<BookingDetail | null> {
  const [row] = await detailQuery().where(eq(bookings.id, id));
  return row ? flatten(row) : null;
}

/** Looks a booking up by the private link from the confirmation email. */
export async function getBookingByToken(token: string): Promise<BookingDetail | null> {
  if (!token) return null;
  const [row] = await detailQuery().where(eq(bookings.cancelToken, token));
  return row ? flatten(row) : null;
}

/** Bookings that start in [from, to), earliest first. Hard cap of 200 rows. */
export async function listBookings(opts: {
  from: Date;
  to: Date;
  stylistId?: string;
  includeCancelled?: boolean;
  limit?: number;
}): Promise<BookingDetail[]> {
  const rows = await detailQuery()
    .where(
      and(
        gte(bookings.startsAt, opts.from),
        lt(bookings.startsAt, opts.to),
        opts.stylistId ? eq(bookings.stylistId, opts.stylistId) : undefined,
        opts.includeCancelled ? undefined : eq(bookings.status, "booked"),
      ),
    )
    .orderBy(asc(bookings.startsAt))
    .limit(Math.min(opts.limit ?? 200, 200));
  return rows.map(flatten);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createBooking(input: {
  serviceId: string;
  stylistId: string;
  startsAt: Date;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  source: Actor;
  userId?: string | null;
}): Promise<BookingDetail> {
  const clientName = input.clientName.trim();
  const clientPhone = input.clientPhone.trim();
  const clientEmail = input.clientEmail.trim().toLowerCase();
  if (!clientName) throw new SalonError("invalid", "We need the client's name.");
  if (clientPhone.replace(/\D/g, "").length < 7)
    throw new SalonError("invalid", "We need a phone number we can call.");
  if (!EMAIL.test(clientEmail))
    throw new SalonError("invalid", "That email address doesn't look right.");
  if (Number.isNaN(input.startsAt.getTime()))
    throw new SalonError("invalid", "That isn't a time.");

  // The time has to be one the salon actually offers: inside the stylist's
  // hours, on the 15-minute grid, in the future, and clear of other bookings.
  const slots = await getFreeSlots({
    serviceId: input.serviceId,
    stylistId: input.stylistId,
    day: dayOf(input.startsAt),
  });
  const slot = slots.find((s) => s.startsAt === input.startsAt.toISOString());
  if (!slot) throw new SalonError("slot_taken", "That time isn't free any more. Pick another.");

  let id: string;
  try {
    const [row] = await db
      .insert(bookings)
      .values({
        serviceId: input.serviceId,
        stylistId: input.stylistId,
        startsAt: new Date(slot.startsAt),
        endsAt: new Date(slot.endsAt),
        clientName,
        clientPhone,
        clientEmail,
        source: input.source,
        cancelToken: randomBytes(24).toString("base64url"),
      })
      .returning({ id: bookings.id });
    id = row.id;
  } catch (err) {
    // 23P01 is the database refusing an overlapping booking: someone else
    // took the slot between the check above and this insert.
    if (pgCode(err) === "23P01") {
      throw new SalonError("slot_taken", "Someone just took that time. Pick another.");
    }
    throw err;
  }

  const booking = (await getBooking(id))!;
  await logActivity(
    "booking.made",
    {
      bookingId: id,
      service: booking.serviceName,
      stylist: booking.stylistName,
      startsAt: slot.startsAt,
      via: input.source,
    },
    input.userId,
  );
  void notifyBooked(booking).catch((e) => console.error("[notify] booked", e));
  return booking;
}

/** Cancels by id. For the owner, and for agents acting as the owner: no cut-off. */
export async function cancelBooking(input: {
  id: string;
  by: Exclude<Actor, "client">;
  userId?: string | null;
}) {
  const booking = await getBooking(input.id);
  if (!booking) throw new SalonError("not_found", "That booking doesn't exist.");
  return cancel(booking, input.by, input.userId);
}

/** Cancels from the client's private link. Refused inside the cut-off. */
export async function cancelBookingByToken(token: string) {
  const booking = await getBookingByToken(token);
  if (!booking) throw new SalonError("not_found", "That link doesn't match a booking.");
  if (booking.status === "booked" && !canCancelOnline(booking)) {
    throw new SalonError(
      "too_late_to_cancel",
      `It's less than ${salon.cancelCutoffHours} hours before your appointment, so please phone the salon on ${salon.phone}.`,
    );
  }
  return cancel(booking, "client", null);
}

export function canCancelOnline(booking: Pick<Booking, "startsAt">): boolean {
  return booking.startsAt.getTime() - Date.now() >= salon.cancelCutoffHours * 60 * 60 * 1000;
}

async function cancel(
  booking: BookingDetail,
  by: Actor,
  userId?: string | null,
): Promise<BookingDetail> {
  if (booking.status === "cancelled")
    throw new SalonError("already_cancelled", "That booking is already cancelled.");
  await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date(), cancelledBy: by })
    .where(eq(bookings.id, booking.id));
  const updated = (await getBooking(booking.id))!;
  await logActivity(
    "booking.cancelled",
    {
      bookingId: booking.id,
      service: booking.serviceName,
      stylist: booking.stylistName,
      startsAt: booking.startsAt.toISOString(),
      via: by,
    },
    userId,
  );
  void notifyCancelled(updated).catch((e) => console.error("[notify] cancelled", e));
  return updated;
}

function pgCode(err: unknown): string | undefined {
  let e: unknown = err;
  for (let i = 0; i < 4 && e && typeof e === "object"; i++) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string") return code;
    e = (e as { cause?: unknown }).cause;
  }
  return undefined;
}
