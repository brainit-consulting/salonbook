import { addDays, dayOf, formatDay, formatMinute, formatTime, minuteOf, WEEKDAYS } from "@/lib/salon/time";

// Reading and describing a stylist's week and days off. No database here, so
// the client forms can use it too.

type Span = { weekday: number; startMinute: number; endMinute: number };

/** "09:30" from a time input → 570. */
export function parseClock(text: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** 570 → "09:30", the value a time input wants. Not for showing to people. */
export function clockText(minute: number): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(minute / 60))}:${p(minute % 60)}`;
}

/**
 * One span per day worked. The form edits one start and one end per day, so a
 * split day is read as first start to last finish.
 */
export function daySpans(hours: Span[]): Span[] {
  const byDay = new Map<number, Span>();
  for (const h of hours) {
    const seen = byDay.get(h.weekday);
    byDay.set(h.weekday, {
      weekday: h.weekday,
      startMinute: Math.min(seen?.startMinute ?? h.startMinute, h.startMinute),
      endMinute: Math.max(seen?.endMinute ?? h.endMinute, h.endMinute),
    });
  }
  return [...byDay.values()].sort((a, b) => a.weekday - b.weekday);
}

const short = (weekday: number) => WEEKDAYS[weekday].slice(0, 3);
const range = (s: Span) => `${formatMinute(s.startMinute)} to ${formatMinute(s.endMinute)}`;

/** "Tue to Sat, 9:00 AM to 5:00 PM" when every day is the same, otherwise day by day. */
export function summariseWeek(hours: Span[]): string {
  const spans = daySpans(hours);
  if (!spans.length) return "No working hours set";

  const first = spans[0];
  const sameHours = spans.every(
    (s) => s.startMinute === first.startMinute && s.endMinute === first.endMinute,
  );
  if (!sameHours) return spans.map((s) => `${short(s.weekday)} ${range(s)}`).join("; ");

  const last = spans[spans.length - 1];
  const unbroken = last.weekday - first.weekday === spans.length - 1;
  const days =
    unbroken && spans.length >= 3
      ? `${short(first.weekday)} to ${short(last.weekday)}`
      : spans.map((s) => short(s.weekday)).join(", ");
  return `${days}, ${range(first)}`;
}

export function describeTimeOff(off: { startsAt: Date; endsAt: Date }): string {
  const startDay = dayOf(off.startsAt);
  const wholeDays = minuteOf(off.startsAt) === 0 && minuteOf(off.endsAt) === 0;
  if (wholeDays) {
    // It ends at midnight, so the last day off is the day before.
    const lastDay = addDays(dayOf(off.endsAt), -1);
    return lastDay === startDay
      ? `${formatDay(startDay)}, all day`
      : `${formatDay(startDay)} to ${formatDay(lastDay)}, all day`;
  }
  if (dayOf(off.endsAt) === startDay)
    return `${formatDay(startDay)}, ${formatTime(off.startsAt)} to ${formatTime(off.endsAt)}`;
  return `${formatDay(startDay)} ${formatTime(off.startsAt)} to ${formatDay(off.endsAt)} ${formatTime(off.endsAt)}`;
}
