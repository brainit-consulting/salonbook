import { Button, Text } from "react-email";
import type { BookingDetail } from "@/lib/salon/bookings";
import { formatDay, formatTime } from "@/lib/salon/time";
import { BookingFacts, Fact, sampleBooking } from "./booking-confirmed";
import { cameInVia, diaryUrl } from "./owner-booking-made";
import { Shell, buttonStyle } from "./shell";

export function ownerBookingCancelledSubject(booking: BookingDetail): string {
  return `Cancelled: ${booking.clientName}, ${booking.serviceName} with ${booking.stylistName}, ${formatDay(booking.startsAt, "short")} at ${formatTime(booking.startsAt)}`;
}

function cancelledVia(actor: string | null): string {
  if (actor === "owner") return "Cancelled by you";
  return cameInVia(actor);
}

export default function OwnerBookingCancelled({ booking }: { booking: BookingDetail }) {
  return (
    <Shell preview={`${booking.clientName}, ${formatDay(booking.startsAt, "short")} at ${formatTime(booking.startsAt)}`}>
      <Text>{booking.clientName}&apos;s appointment is cancelled. That time is free again.</Text>
      <BookingFacts booking={booking} />
      <Fact label="Phone" mono>
        {booking.clientPhone}
      </Fact>
      <Fact label="How it was cancelled">{cancelledVia(booking.cancelledBy)}</Fact>
      <Button href={diaryUrl(booking)} style={{ ...buttonStyle, display: "inline-block", marginTop: 14 }}>
        Open that day in the diary
      </Button>
    </Shell>
  );
}

OwnerBookingCancelled.PreviewProps = {
  booking: {
    ...sampleBooking,
    status: "cancelled",
    cancelledAt: new Date("2026-09-22T15:30:00Z"),
    cancelledBy: "client",
  } satisfies BookingDetail,
};
