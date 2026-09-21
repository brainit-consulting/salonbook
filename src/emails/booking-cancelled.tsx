import { Button, Text } from "react-email";
import type { BookingDetail } from "@/lib/salon/bookings";
import { salon } from "@/lib/salon/config";
import { formatDay, formatTime } from "@/lib/salon/time";
import { siteUrl } from "@/lib/site";
import { BookingFacts, sampleBooking } from "./booking-confirmed";
import { Shell, buttonStyle } from "./shell";

export function bookingCancelledSubject(booking: BookingDetail): string {
  return `Cancelled: ${booking.serviceName} with ${booking.stylistName}, ${formatDay(booking.startsAt, "short")} at ${formatTime(booking.startsAt)}`;
}

export default function BookingCancelled({ booking }: { booking: BookingDetail }) {
  // An agent cancels on the owner's behalf, so to the client it is the salon.
  const byClient = booking.cancelledBy === "client";
  return (
    <Shell preview={byClient ? "You cancelled your appointment" : "The salon cancelled your appointment"}>
      <Text>Hi {booking.clientName},</Text>
      <Text>
        {byClient
          ? "You cancelled this appointment. The time has gone back into the diary."
          : `The salon cancelled this appointment. We're sorry for the change of plan. If you have questions, phone us on ${salon.phone}.`}
      </Text>
      <BookingFacts booking={booking} />
      <Button href={`${siteUrl}/book`} style={buttonStyle}>
        Book another time
      </Button>
    </Shell>
  );
}

BookingCancelled.PreviewProps = {
  booking: {
    ...sampleBooking,
    status: "cancelled",
    cancelledAt: new Date("2026-09-22T15:30:00Z"),
    cancelledBy: "owner",
  } satisfies BookingDetail,
};
