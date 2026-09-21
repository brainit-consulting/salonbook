import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth-guards";
import { getBooking } from "@/lib/salon/bookings";
import {
  dayOf,
  formatDay,
  formatDuration,
  formatMoney,
  formatTime,
} from "@/lib/salon/time";
import { CancelBooking } from "@/components/owner/cancel-booking";
import { cancelBookingAction } from "../../actions";
import { diaryHref, isId } from "../../day";

export const metadata: Metadata = { title: "Booking" };

const madeBy: Record<string, string> = {
  client: "The client, on the booking site",
  owner: "The owner, at the salon",
  agent: "An AI agent",
};

const cancelledBy: Record<string, string> = {
  client: "the client",
  owner: "the owner",
  agent: "an AI agent",
};

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOwner();
  const { id } = await params;
  const booking = isId(id) ? await getBooking(id) : null;
  if (!booking) notFound();

  const day = dayOf(booking.startsAt);
  const cancelled = booking.status === "cancelled";
  const minutes = Math.round((booking.endsAt.getTime() - booking.startsAt.getTime()) / 60000);
  const when = `${formatDay(day)}, ${formatTime(booking.startsAt)}`;

  const rows: [string, React.ReactNode][] = [
    [
      "Service",
      <>
        {booking.serviceName}{" "}
        <span className="figures text-sm text-muted-foreground">
          {formatDuration(minutes)} · {formatMoney(booking.priceCents)}
        </span>
      </>,
    ],
    ["Stylist", booking.stylistName],
    [
      "Time",
      <span className="figures" key="time">
        {when} to {formatTime(booking.endsAt)}
      </span>,
    ],
    ["Client", booking.clientName],
    [
      "Phone",
      <a
        key="phone"
        href={`tel:${booking.clientPhone.replace(/[^\d+]/g, "")}`}
        className="figures underline underline-offset-4"
      >
        {booking.clientPhone}
      </a>,
    ],
    [
      "Email",
      <a
        key="email"
        href={`mailto:${booking.clientEmail}`}
        className="break-all underline underline-offset-4"
      >
        {booking.clientEmail}
      </a>,
    ],
    ["Booked by", madeBy[booking.source] ?? booking.source],
    [
      "Booked on",
      <span className="figures" key="made">
        {formatDay(booking.createdAt, "short")}, {formatTime(booking.createdAt)}
      </span>,
    ],
  ];

  return (
    <div className="max-w-xl">
      <p className="mb-4 text-sm">
        <Link href={diaryHref(day, cancelled)} className="underline underline-offset-4">
          Back to the diary for {formatDay(day, "short")}
        </Link>
      </p>

      <h1 className="double-rule text-[1.75rem]">
        {booking.clientName}, <em>{booking.serviceName}</em>
      </h1>

      {cancelled && (
        <p className="mb-6 border-l-[3px] bg-muted px-3 py-2 text-sm">
          This booking was cancelled
          {booking.cancelledAt && (
            <>
              {" "}
              on{" "}
              <span className="figures">
                {formatDay(booking.cancelledAt, "short")}, {formatTime(booking.cancelledAt)}
              </span>
            </>
          )}
          {booking.cancelledBy && ` by ${cancelledBy[booking.cancelledBy] ?? booking.cancelledBy}`}.
        </p>
      )}

      <dl className={cancelled ? "text-muted-foreground" : undefined}>
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[6.5rem_1fr] gap-3 border-b py-2.5">
            <dt className="text-sm leading-6 font-semibold">{label}</dt>
            <dd className="min-w-0">{value}</dd>
          </div>
        ))}
      </dl>

      {!cancelled && (
        <div className="mt-8">
          <CancelBooking
            summary={`${booking.clientName}, ${booking.serviceName} with ${booking.stylistName}, ${when}.`}
            cancel={cancelBookingAction.bind(null, booking.id)}
          />
        </div>
      )}
    </div>
  );
}
