import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import BookingCancelled, { bookingCancelledSubject } from "@/emails/booking-cancelled";
import BookingConfirmed, { bookingConfirmedSubject } from "@/emails/booking-confirmed";
import OwnerBookingCancelled, { ownerBookingCancelledSubject } from "@/emails/owner-booking-cancelled";
import OwnerBookingMade, { ownerBookingMadeSubject } from "@/emails/owner-booking-made";
import type { BookingDetail } from "./bookings";

// The emails a booking owes people. bookings.ts calls these after the booking
// is saved and never waits on the result.

type Send = Parameters<typeof sendEmail>[0];

/** OWNER_NOTIFY_EMAIL if set, otherwise the owner account's own address. */
async function ownerAddress(): Promise<string | null> {
  const fromEnv = process.env.OWNER_NOTIFY_EMAIL?.trim();
  if (fromEnv) return fromEnv;
  const [owner] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.role, "admin"))
    .limit(1);
  return owner?.email ?? null;
}

// One failing send must not stop the other, so nothing here throws.
async function sendAll(sends: Send[]): Promise<void> {
  const results = await Promise.allSettled(sends.map((s) => sendEmail(s)));
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[notify] ${sends[i].template} to ${sends[i].to} failed`, r.reason);
    }
  });
}

async function ownerSend(build: (to: string) => Send): Promise<Send[]> {
  try {
    const to = await ownerAddress();
    // No owner account yet: the client still gets their email.
    return to ? [build(to)] : [];
  } catch (err) {
    console.error("[notify] could not look up the owner's address", err);
    return [];
  }
}

export async function notifyBooked(booking: BookingDetail): Promise<void> {
  await sendAll([
    {
      to: booking.clientEmail,
      subject: bookingConfirmedSubject(booking),
      react: BookingConfirmed({ booking }),
      template: "booking-confirmed",
    },
    ...(await ownerSend((to) => ({
      to,
      subject: ownerBookingMadeSubject(booking),
      react: OwnerBookingMade({ booking }),
      template: "owner-booking-made",
    }))),
  ]);
}

export async function notifyCancelled(booking: BookingDetail): Promise<void> {
  await sendAll([
    {
      to: booking.clientEmail,
      subject: bookingCancelledSubject(booking),
      react: BookingCancelled({ booking }),
      template: "booking-cancelled",
    },
    ...(await ownerSend((to) => ({
      to,
      subject: ownerBookingCancelledSubject(booking),
      react: OwnerBookingCancelled({ booking }),
      template: "owner-booking-cancelled",
    }))),
  ]);
}
