import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, timeOff } from "@/lib/db/schema";
import { getService, getStylist } from "./catalog";
import { salon } from "./config";
import { SalonError } from "./errors";
import { addDays, atMinute, formatTime, isDay, today, weekdayOf } from "./time";

export type Slot = { startsAt: string; endsAt: string; label: string };

/**
 * The start times still open for one service, with one stylist, on one
 * salon-time day. A time is free when the whole service fits inside the
 * stylist's hours and touches no live booking and no time off.
 */
export async function getFreeSlots(input: {
  serviceId: string;
  stylistId: string;
  day: string;
}): Promise<Slot[]> {
  if (!isDay(input.day)) throw new SalonError("invalid", "Dates look like 2026-09-25.");
  const [service, stylist] = await Promise.all([
    getService(input.serviceId),
    getStylist(input.stylistId),
  ]);
  if (!service || !service.active)
    throw new SalonError("not_found", "That service isn't offered.");
  if (!stylist || !stylist.active)
    throw new SalonError("not_found", "That stylist isn't taking bookings.");
  if (!stylist.serviceIds.includes(service.id))
    throw new SalonError("invalid", `${stylist.name} doesn't do ${service.name}.`);

  const first = today();
  const last = addDays(first, salon.bookingWindowDays);
  if (input.day < first || input.day > last) return [];

  const windows = stylist.hours.filter((h) => h.weekday === weekdayOf(input.day));
  if (!windows.length) return [];

  const dayStart = atMinute(input.day, 0);
  const dayEnd = atMinute(input.day, 24 * 60);
  const [taken, off] = await Promise.all([
    db
      .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt })
      .from(bookings)
      .where(
        and(
          eq(bookings.stylistId, stylist.id),
          eq(bookings.status, "booked"),
          lt(bookings.startsAt, dayEnd),
          gt(bookings.endsAt, dayStart),
        ),
      ),
    db
      .select({ startsAt: timeOff.startsAt, endsAt: timeOff.endsAt })
      .from(timeOff)
      .where(
        and(
          eq(timeOff.stylistId, stylist.id),
          lt(timeOff.startsAt, dayEnd),
          gt(timeOff.endsAt, dayStart),
        ),
      ),
  ]);
  const busy = [...taken, ...off];

  const now = new Date();
  const slots: Slot[] = [];
  for (const w of windows) {
    for (
      let m = w.startMinute;
      m + service.durationMinutes <= w.endMinute;
      m += salon.slotStepMinutes
    ) {
      const start = atMinute(input.day, m);
      const end = atMinute(input.day, m + service.durationMinutes);
      if (start <= now) continue;
      if (busy.some((b) => b.startsAt < end && b.endsAt > start)) continue;
      slots.push({
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        label: formatTime(start),
      });
    }
  }
  return slots;
}
