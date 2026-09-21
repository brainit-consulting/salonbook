import { TZDate } from "@date-fns/tz";
import { salon } from "./config";

// Every date and time in the app is salon time (US Eastern), whatever clock
// the server runs on. A "day" is a YYYY-MM-DD string in salon time.

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function isDay(value: string): boolean {
  return DAY.test(value) && !Number.isNaN(atMinute(value, 0).getTime());
}

/** The instant that is `minute` minutes after midnight, salon time, on `day`. */
export function atMinute(day: string, minute: number): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(new TZDate(y, m - 1, d, 0, minute, 0, salon.timezone).getTime());
}

/** The salon-time day an instant falls on. */
export function dayOf(instant: Date): string {
  const z = new TZDate(instant.getTime(), salon.timezone);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${z.getFullYear()}-${p(z.getMonth() + 1)}-${p(z.getDate())}`;
}

export function today(): string {
  return dayOf(new Date());
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return dayOf(new Date(new TZDate(y, m - 1, d + n, 12, 0, 0, salon.timezone).getTime()));
}

/** 0 = Sunday … 6 = Saturday, in salon time. */
export function weekdayOf(day: string): number {
  return new TZDate(atMinute(day, 12 * 60).getTime(), salon.timezone).getDay();
}

/** Minutes after salon-time midnight for an instant. */
export function minuteOf(instant: Date): number {
  const z = new TZDate(instant.getTime(), salon.timezone);
  return z.getHours() * 60 + z.getMinutes();
}

export function formatTime(instant: Date): string {
  return new Intl.DateTimeFormat(salon.locale, {
    timeZone: salon.timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(instant);
}

export function formatDay(day: string | Date, style: "long" | "short" = "long"): string {
  const instant = typeof day === "string" ? atMinute(day, 12 * 60) : day;
  return new Intl.DateTimeFormat(salon.locale, {
    timeZone: salon.timezone,
    weekday: style,
    month: style,
    day: "numeric",
  }).format(instant);
}

export function formatMinute(minute: number): string {
  return formatTime(atMinute("2026-01-05", minute));
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat(salon.locale, {
    style: "currency",
    currency: salon.currency,
  }).format(cents / 100);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
