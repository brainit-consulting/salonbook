// The booking steps live in the URL, so every step is a plain link and the
// back button works. This builds those links in one place.
export type BookParams = {
  service?: string;
  stylist?: string;
  day?: string;
  from?: string;
  time?: string;
  notice?: "taken";
};

export function bookHref(params: BookParams = {}): string {
  const q = new URLSearchParams();
  for (const key of ["service", "stylist", "from", "day", "time", "notice"] as const) {
    const value = params[key];
    if (value) q.set(key, value);
  }
  const qs = q.toString();
  return qs ? `/book?${qs}` : "/book";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids come from the URL. Postgres throws on a malformed uuid, so check first. */
export function isId(value: string | undefined): value is string {
  return !!value && UUID.test(value);
}

// Tap targets on a phone: the stock button is 32px high, these are 44px.
export const bigButton = "h-11 px-4 text-base font-semibold";
