import type { StylistWithDetail } from "@/lib/salon/catalog";
import { WEEKDAYS, formatMinute } from "@/lib/salon/time";

const short = (weekday: number) => WEEKDAYS[weekday].slice(0, 3);

/** "9:00 AM – 5:00 PM", or two ranges for a split day. */
export function formatHours(windows: { startMinute: number; endMinute: number }[]): string {
  return windows.map((w) => `${formatMinute(w.startMinute)} – ${formatMinute(w.endMinute)}`).join(", ");
}

/** One stylist's week, one line per working day, Monday first. */
export function workingDays(stylist: StylistWithDetail): { day: string; hours: string }[] {
  return [1, 2, 3, 4, 5, 6, 0].flatMap((weekday) => {
    const windows = stylist.hours.filter((h) => h.weekday === weekday);
    return windows.length ? [{ day: short(weekday), hours: formatHours(windows) }] : [];
  });
}

/**
 * When the salon is open, worked out from the stylists' hours: the earliest
 * start and latest finish on each weekday. Runs of days with the same hours
 * are folded into one line ("Tue – Fri").
 */
export function openingSummary(stylists: StylistWithDetail[]): { days: string; hours: string }[] {
  const lines: { first: number; last: number; hours: string }[] = [];
  for (const weekday of [1, 2, 3, 4, 5, 6, 0]) {
    const windows = stylists.flatMap((s) => s.hours.filter((h) => h.weekday === weekday));
    const hours = windows.length
      ? formatHours([
          {
            startMinute: Math.min(...windows.map((w) => w.startMinute)),
            endMinute: Math.max(...windows.map((w) => w.endMinute)),
          },
        ])
      : "Closed";
    const prev = lines.at(-1);
    if (prev && prev.hours === hours) prev.last = weekday;
    else lines.push({ first: weekday, last: weekday, hours });
  }
  // No hours set for anyone yet: say nothing rather than "closed all week".
  if (lines.every((l) => l.hours === "Closed")) return [];
  return lines.map((l) => ({
    days: l.first === l.last ? short(l.first) : `${short(l.first)} – ${short(l.last)}`,
    hours: l.hours,
  }));
}
