"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwnerAction } from "@/lib/auth-guards";
import { cancelBooking, createBooking } from "@/lib/salon/bookings";
import { SalonError } from "@/lib/salon/errors";
import { dayOf } from "@/lib/salon/time";
import { diaryHref, isId } from "./day";

export type AddBookingState = {
  error?: string;
  values?: { clientName: string; clientPhone: string; clientEmail: string };
};

export async function addBookingAction(
  _prev: AddBookingState,
  form: FormData,
): Promise<AddBookingState> {
  const session = await requireOwnerAction();

  const text = (name: string) => String(form.get(name) ?? "");
  const values = {
    clientName: text("clientName"),
    clientPhone: text("clientPhone"),
    clientEmail: text("clientEmail"),
  };
  const serviceId = text("serviceId");
  const stylistId = text("stylistId");
  if (!isId(serviceId) || !isId(stylistId))
    return { error: "Pick a service and a stylist first.", values };

  let day: string;
  try {
    const booking = await createBooking({
      serviceId,
      stylistId,
      startsAt: new Date(text("startsAt")),
      ...values,
      source: "owner",
      userId: session.user.id,
    });
    day = dayOf(booking.startsAt);
  } catch (err) {
    if (!(err instanceof SalonError)) throw err;
    // The list of free times on the page is out of date. Draw it again.
    if (err.code === "slot_taken") revalidatePath("/diary/new");
    return { error: err.message, values };
  }

  revalidatePath("/diary");
  redirect(diaryHref(day));
}

export async function cancelBookingAction(id: string): Promise<{ error: string }> {
  const session = await requireOwnerAction();
  if (!isId(id)) return { error: "That booking doesn't exist." };

  let day: string;
  try {
    const booking = await cancelBooking({ id, by: "owner", userId: session.user.id });
    day = dayOf(booking.startsAt);
  } catch (err) {
    if (!(err instanceof SalonError)) throw err;
    return { error: err.message };
  }

  revalidatePath("/diary");
  revalidatePath(`/diary/booking/${id}`);
  redirect(diaryHref(day));
}
