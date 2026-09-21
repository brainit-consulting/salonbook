"use server";

import { redirect } from "next/navigation";
import { bookHref, isId } from "@/components/booking/links";
import { createBooking } from "@/lib/salon/bookings";
import { SalonError } from "@/lib/salon/errors";
import { dayOf } from "@/lib/salon/time";

export type BookState = {
  error?: string;
  // What they typed, so a refused form comes back filled in.
  values?: { name: string; phone: string; email: string };
};

export async function bookAppointment(_prev: BookState, form: FormData): Promise<BookState> {
  const field = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" ? v : "";
  };
  const serviceId = field("service");
  const stylistId = field("stylist");
  const startsAt = new Date(field("time"));
  const values = { name: field("name"), phone: field("phone"), email: field("email") };

  if (!isId(serviceId) || !isId(stylistId)) redirect("/book");

  let token: string;
  try {
    const booking = await createBooking({
      serviceId,
      stylistId,
      startsAt,
      clientName: values.name,
      clientPhone: values.phone,
      clientEmail: values.email,
      source: "client",
    });
    token = booking.cancelToken;
  } catch (err) {
    if (!(err instanceof SalonError)) throw err;
    // Someone else got there first: back to the times for that day.
    if (err.code === "slot_taken") {
      redirect(
        bookHref({ service: serviceId, stylist: stylistId, day: dayOf(startsAt), notice: "taken" }),
      );
    }
    return { error: err.message, values };
  }
  redirect(`/booking/${token}?new=1`);
}
