import { Button, Section, Text } from "react-email";
import type { BookingDetail } from "@/lib/salon/bookings";
import { salon } from "@/lib/salon/config";
import { formatDay, formatDuration, formatMoney, formatTime } from "@/lib/salon/time";
import { siteUrl } from "@/lib/site";
import { Shell, buttonStyle, quiet, rule } from "./shell";

const figures = { fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 14 } as const;

export function bookingLength(booking: BookingDetail): string {
  return formatDuration(Math.round((booking.endsAt.getTime() - booking.startsAt.getTime()) / 60000));
}

export function bookingConfirmedSubject(booking: BookingDetail): string {
  return `You're booked: ${booking.serviceName} with ${booking.stylistName}, ${formatDay(booking.startsAt, "short")} at ${formatTime(booking.startsAt)}`;
}

/** One "label: value" line. Reads the same in the plain-text version. */
export function Fact({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <Text style={{ margin: "0 0 6px" }}>
      <span style={{ color: quiet }}>{label}: </span>
      <span style={mono ? figures : undefined}>{children}</span>
    </Text>
  );
}

/** The booking itself, shared by all four booking emails. */
export function BookingFacts({ booking, withPrice }: { booking: BookingDetail; withPrice?: boolean }) {
  return (
    <Section style={{ borderTop: `1px solid ${rule}`, borderBottom: `1px solid ${rule}`, padding: "14px 0 8px", margin: "16px 0" }}>
      <Fact label="Service">{booking.serviceName}</Fact>
      <Fact label="Stylist">{booking.stylistName}</Fact>
      <Fact label="Day">{formatDay(booking.startsAt)}</Fact>
      <Fact label="Time" mono>
        {formatTime(booking.startsAt)} Eastern time
      </Fact>
      <Fact label="Length" mono>
        {bookingLength(booking)}
      </Fact>
      {withPrice ? (
        <Fact label="Price" mono>
          {formatMoney(booking.priceCents)}
        </Fact>
      ) : null}
    </Section>
  );
}

export default function BookingConfirmed({ booking }: { booking: BookingDetail }) {
  return (
    <Shell preview={`${formatDay(booking.startsAt)} at ${formatTime(booking.startsAt)} with ${booking.stylistName}`}>
      <Text>Hi {booking.clientName},</Text>
      <Text>Your appointment is in the diary. Here is what we have.</Text>
      <BookingFacts booking={booking} withPrice />
      <Text style={{ margin: "0 0 4px" }}>{salon.address}</Text>
      <Text style={{ ...figures, margin: "0 0 20px" }}>{salon.phone}</Text>
      <Button href={`${siteUrl}/booking/${booking.cancelToken}`} style={buttonStyle}>
        View or cancel your booking
      </Button>
      <Text style={{ color: quiet, fontSize: 13 }}>
        You can cancel online until {salon.cancelCutoffHours} hours before your appointment. After that, please phone
        the salon.
      </Text>
    </Shell>
  );
}

export const sampleBooking: BookingDetail = {
  id: "5b0f3c1e-8d2a-4c77-9a41-2f6e0d9b7c13",
  serviceId: "0d9e5a44-3b1f-4e0a-8c52-7a1b2c3d4e5f",
  stylistId: "a7c2e9f0-1b3d-4f6a-9e8c-5d4b3a2f1e0d",
  startsAt: new Date("2026-09-24T13:00:00Z"),
  endsAt: new Date("2026-09-24T13:45:00Z"),
  clientName: "Dana Whitfield",
  clientPhone: "845-555-0117",
  clientEmail: "dana.whitfield@example.com",
  status: "booked",
  source: "client",
  cancelToken: "pV3n0sQk7yTgR2mWc8ZaLx4HdEu1JbNf",
  cancelledAt: null,
  cancelledBy: null,
  createdAt: new Date("2026-09-21T18:12:00Z"),
  serviceName: "Cut",
  priceCents: 6850,
  stylistName: "Marisol",
};

BookingConfirmed.PreviewProps = { booking: sampleBooking };
