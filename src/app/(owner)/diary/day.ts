import { isDay, today } from "@/lib/salon/time";

// Small helpers the diary pages share for reading and writing their URLs.

export type Search = Record<string, string | string[] | undefined>;

export function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The day in the URL, or today in salon time when it is missing or nonsense. */
export function dayFrom(value: string | string[] | undefined): string {
  const day = one(value);
  return day && isDay(day) ? day : today();
}

export function diaryHref(day: string, showCancelled = false): string {
  return `/diary?day=${day}${showCancelled ? "&cancelled=1" : ""}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Postgres throws on a malformed uuid, so check before asking it. */
export function isId(value: string | undefined): value is string {
  return !!value && UUID.test(value);
}
