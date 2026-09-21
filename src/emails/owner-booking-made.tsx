import { Button, Text } from "react-email";
import type { BookingDetail } from "@/lib/salon/bookings";
import { dayOf, formatDay, formatTime } from "@/lib/salon/time";
import { siteUrl } from "@/lib/site";
import { BookingFacts, Fact, sampleBooking } from "./booking-confirmed";
import { Shell, buttonStyle } from "./shell";

/** How a booking or a cancellation reached the diary, said to the owner. */
export function cameInVia(actor: string | null): string {
  if (actor === "owner") return "Added by you";
  if (actor === "agent") return "By an AI agent";
  return "By the client, online";
}

export function diaryUrl(booking: BookingDetail): string {
  return `${siteUrl}/diary?day=${dayOf(booking.startsAt)}`;
}

export function ownerBookingMadeSubject(booking: BookingDetail): string {
  return `New booking: ${booking.clientName}, ${booking.serviceName} with ${booking.stylistName}, ${formatDay(booking.startsAt, "short")} at ${formatTime(booking.startsAt)}`;
}

export default function OwnerBookingMade({ booking }: { booking: BookingDetail }) {
  return (
    <Shell preview={`${booking.clientName}, ${formatDay(booking.startsAt, "short")} at ${formatTime(booking.startsAt)}`}>
      <Text>{booking.clientName} is booked in.</Text>
      <BookingFacts booking={booking} withPrice />
      <Fact label="Phone" mono>
        {booking.clientPhone}
      </Fact>
      <Fact label="Email">{booking.clientEmail}</Fact>
      <Fact label="How it came in">{cameInVia(booking.source)}</Fact>
      <Button href={diaryUrl(booking)} style={{ ...buttonStyle, display: "inline-block", marginTop: 14 }}>
        Open that day in the diary
      </Button>
    </Shell>
  );
}

OwnerBookingMade.PreviewProps = { booking: sampleBooking };
