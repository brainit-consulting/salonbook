// Turning what the owner typed into the whole numbers the catalog stores.

const PRICE = /^(\d{1,5})(?:\.(\d{1,2}))?$/;

/** "45", "45.5", "$45.50" → cents. Done on the digits, so no float rounding. */
export function parsePriceToCents(text: string): number | null {
  const match = PRICE.exec(text.trim().replace(/^\$/, "").trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

/** Cents → the plain "45.50" an edit box starts with. */
export function centsToPriceText(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

export function parseWholeMinutes(text: string): number | null {
  return /^\d{1,3}$/.test(text.trim()) ? Number(text.trim()) : null;
}
