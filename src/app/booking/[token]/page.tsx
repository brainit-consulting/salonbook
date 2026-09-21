import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "cn";
import { BookingSummary } from "@/components/booking/booking-summary";
import { CancelBooking } from "@/components/booking/cancel-booking";
import { ClientShell, StepHeading } from "@/components/booking/client-shell";
import { bigButton } from "@/components/booking/links";
import { buttonVariants } from "@/components/ui/button";
import { canCancelOnline, getBookingByToken } from "@/lib/salon/bookings";
import { salon } from "@/lib/salon/config";
import { formatDay, formatTime } from "@/lib/salon/time";

export const metadata: Metadata = {
  title: "Your booking",
  // The address of this page is the key to the booking. Keep it out of the
  // Referer header when someone follows a link away from here.
  referrer: "no-referrer",
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Read the clock outside the component: render itself stays pure.
function hasPassed(at: Date): boolean {
  return at.getTime() <= Date.now();
}

export default async function BookingPage({ params, searchParams }: Props) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  const booking = await getBookingByToken(token);
  if (!booking) notFound();

  const cancelled = booking.status === "cancelled";
  const past = hasPassed(booking.startsAt);
  const justBooked = sp.new === "1" && !cancelled;
  const minutes = Math.round((booking.endsAt.getTime() - booking.startsAt.getTime()) / 60000);
  const when = `${formatDay(booking.startsAt)} at ${formatTime(booking.startsAt)}`;
  const tel = `tel:${salon.phone.replace(/\D/g, "")}`;

  const bookAgain = (primary: boolean) => (
    <Link
      href="/book"
      className={cn(
        buttonVariants({ variant: primary ? "default" : "outline" }),
        bigButton,
        "w-full sm:w-auto",
      )}
    >
      Book again
    </Link>
  );

  return (
    <ClientShell>
      <StepHeading>
        {cancelled ? "This booking is cancelled" : justBooked ? "You're booked." : "Your booking"}
      </StepHeading>

      {justBooked ? (
        <p className="mb-6 max-w-[62ch]">
          A confirmation was written to <span className="font-semibold">{booking.clientEmail}</span>
          . This demo writes its emails down and does not send them, so keep this page&apos;s
          address: it is the only way back to your booking.
        </p>
      ) : null}
      {cancelled ? (
        <p className="mb-6 max-w-[62ch]">
          {booking.cancelledBy === "client" ? "You cancelled" : "The salon cancelled"} this
          appointment
          {booking.cancelledAt ? ` on ${formatDay(booking.cancelledAt)}` : ""}. Nobody is expecting
          you.
        </p>
      ) : null}

      <BookingSummary
        serviceName={booking.serviceName}
        stylistName={booking.stylistName}
        startsAt={booking.startsAt}
        durationMinutes={minutes}
        priceCents={booking.priceCents}
        struck={cancelled}
      />
      <p className="mt-3 text-sm text-muted-foreground">
        Booked for {booking.clientName}. {salon.name}, {salon.address}.
      </p>

      <div className="mt-8">
        {cancelled ? (
          bookAgain(true)
        ) : past ? (
          <>
            <p className="mb-4 max-w-[62ch]">This appointment has been and gone.</p>
            {bookAgain(true)}
          </>
        ) : canCancelOnline(booking) ? (
          <>
            <p className="mb-4 max-w-[62ch] text-sm text-muted-foreground">
              You can cancel here up to {salon.cancelCutoffHours} hours before your appointment.
            </p>
            <CancelBooking token={token} when={when} />
          </>
        ) : (
          <p className="max-w-[62ch] border-l-[3px] border-primary pl-3">
            It&apos;s less than {salon.cancelCutoffHours} hours before your appointment, so it
            can&apos;t be cancelled online. Please phone the salon on{" "}
            <a href={tel} className="figures underline underline-offset-4">
              {salon.phone}
            </a>
            .
          </p>
        )}
      </div>
    </ClientShell>
  );
}
