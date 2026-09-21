"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelBookingByToken } from "@/lib/salon/bookings";
import { SalonError } from "@/lib/salon/errors";

export type CancelState = { error?: string };

// The token is the whole of the client's authority here: whoever holds the
// link may cancel. The 24-hour cut-off is enforced inside cancelBookingByToken.
export async function cancelMyBooking(_prev: CancelState, form: FormData): Promise<CancelState> {
  const token = form.get("token");
  if (typeof token !== "string" || !token) return { error: "That link doesn't match a booking." };
  try {
    await cancelBookingByToken(token);
  } catch (err) {
    if (err instanceof SalonError) return { error: err.message };
    throw err;
  }
  const path = `/booking/${encodeURIComponent(token)}`;
  revalidatePath(path);
  redirect(path);
}
