import { SalonError } from "@/lib/salon/errors";

// What every owner action on these pages hands back to its form. A SalonError
// is a message the owner can act on, so it is shown; anything else is a fault
// and is left to throw.
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function salonResult(work: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await work();
    return { ok: true };
  } catch (err) {
    if (err instanceof SalonError) return { ok: false, error: err.message };
    throw err;
  }
}

export function invalid(error: string): ActionResult {
  return { ok: false, error };
}
