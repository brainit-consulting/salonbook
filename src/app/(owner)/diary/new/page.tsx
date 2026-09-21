import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { requireOwner } from "@/lib/auth-guards";
import { getFreeSlots, type Slot } from "@/lib/salon/availability";
import { listServices, listStylists } from "@/lib/salon/catalog";
import { salon } from "@/lib/salon/config";
import { SalonError } from "@/lib/salon/errors";
import { addDays, formatDay, formatDuration, formatMoney, today } from "@/lib/salon/time";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewBookingForm } from "@/components/owner/new-booking-form";
import { addBookingAction } from "../actions";
import { dayFrom, diaryHref, one, type Search } from "../day";

export const metadata: Metadata = { title: "Add a booking" };

type Choice = { service?: string; stylist?: string; day: string; time?: string };

function href(choice: Choice): string {
  const query = new URLSearchParams();
  if (choice.service) query.set("service", choice.service);
  if (choice.stylist) query.set("stylist", choice.stylist);
  query.set("day", choice.day);
  if (choice.time) query.set("time", choice.time);
  return `/diary/new?${query}`;
}

const option =
  "flex items-baseline gap-3 border bg-card px-3 py-2 text-left text-sm transition-colors duration-100 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
const chosen = "border-foreground bg-secondary font-semibold";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireOwner();
  const query = await searchParams;

  const first = today();
  const last = addDays(first, salon.bookingWindowDays);
  // A day in the past, picked from the diary, has no free times. Start from today.
  const asked = dayFrom(query.day);
  const day = asked < first ? first : asked > last ? last : asked;

  const services = await listServices();
  const service = services.find((s) => s.id === one(query.service));
  const stylists = service ? await listStylists({ serviceId: service.id }) : [];
  const stylist = stylists.find((s) => s.id === one(query.stylist));

  let slots: Slot[] = [];
  let slotsError: string | null = null;
  if (service && stylist) {
    try {
      slots = await getFreeSlots({ serviceId: service.id, stylistId: stylist.id, day });
    } catch (err) {
      if (!(err instanceof SalonError)) throw err;
      slotsError = err.message;
    }
  }
  const askedTime = one(query.time);
  const slot = slots.find((s) => s.startsAt === askedTime);
  const picked = { service: service?.id, stylist: stylist?.id, day };

  return (
    <div className="max-w-3xl">
      <p className="mb-4 text-sm">
        <Link href={diaryHref(day)} className="underline underline-offset-4">
          Back to the diary
        </Link>
      </p>
      <h1 className="double-rule text-[1.75rem]">Add a booking</h1>

      <Step number={1} title="Service">
        {services.length === 0 ? (
          <p className="text-sm">
            There are no services to book yet.{" "}
            <Link href="/services" className="font-semibold underline underline-offset-4">
              Add a service
            </Link>
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.id}>
                <Link
                  href={href({ service: s.id, day })}
                  scroll={false}
                  aria-current={s.id === service?.id ? "true" : undefined}
                  className={cn(option, "justify-between", s.id === service?.id && chosen)}
                >
                  <span>{s.name}</span>
                  <span className="figures shrink-0 text-xs font-normal text-muted-foreground">
                    {formatDuration(s.durationMinutes)} · {formatMoney(s.priceCents)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Step>

      {service && (
        <Step number={2} title="Stylist">
          {stylists.length === 0 ? (
            <p className="text-sm">
              No stylist does {service.name} yet.{" "}
              <Link href="/stylists" className="font-semibold underline underline-offset-4">
                Choose who does it
              </Link>
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {stylists.map((s) => (
                <li key={s.id}>
                  <Link
                    href={href({ service: service.id, stylist: s.id, day })}
                    scroll={false}
                    aria-current={s.id === stylist?.id ? "true" : undefined}
                    className={cn(option, s.id === stylist?.id && chosen)}
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Step>
      )}

      {service && stylist && (
        <Step number={3} title="Day and time">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {day > first && (
              <Link
                href={href({ ...picked, day: addDays(day, -1) })}
                scroll={false}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Previous day
              </Link>
            )}
            {day < last && (
              <Link
                href={href({ ...picked, day: addDays(day, 1) })}
                scroll={false}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Next day
              </Link>
            )}
            <form action="/diary/new" className="flex items-center gap-2">
              <input type="hidden" name="service" value={service.id} />
              <input type="hidden" name="stylist" value={stylist.id} />
              <label htmlFor="booking-day" className="sr-only">
                Day
              </label>
              <Input
                key={day}
                id="booking-day"
                type="date"
                name="day"
                defaultValue={day}
                min={first}
                max={last}
                required
                className="figures h-9 w-auto bg-card"
              />
              <Button type="submit" variant="outline" size="lg">
                Go
              </Button>
            </form>
          </div>

          <p className="mb-3 font-semibold">{formatDay(day)}</p>
          {slotsError ? (
            <p role="alert" className="text-sm text-destructive">
              {slotsError}
            </p>
          ) : slots.length === 0 ? (
            <p className="text-sm">
              {stylist.name} has no free times on {formatDay(day)}.{" "}
              {day < last && (
                <Link
                  href={href({ ...picked, day: addDays(day, 1) })}
                  scroll={false}
                  className="font-semibold underline underline-offset-4"
                >
                  Try the next day
                </Link>
              )}
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {slots.map((s) => (
                <li key={s.startsAt}>
                  <Link
                    href={href({ ...picked, time: s.startsAt })}
                    scroll={false}
                    aria-current={s.startsAt === slot?.startsAt ? "true" : undefined}
                    className={cn(
                      "figures block border px-1 py-2 text-center text-sm transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      s.startsAt === slot?.startsAt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card hover:bg-accent",
                    )}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Step>
      )}

      {/* Shown once a time has been picked, and kept on screen if that time
          goes while the owner is typing, so the client's details are not lost. */}
      {service && stylist && askedTime && (
        <Step number={4} title="Client">
          {!slot && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              That time isn&apos;t free any more. Pick another above.
            </p>
          )}
          <NewBookingForm
            action={addBookingAction}
            serviceId={service.id}
            stylistId={stylist.id}
            startsAt={slot?.startsAt ?? ""}
            summary={
              slot
                ? `${service.name} with ${stylist.name}, ${formatDay(day)} at ${slot.label}.`
                : `${service.name} with ${stylist.name}.`
            }
          />
        </Step>
      )}
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-baseline gap-3 border-b pb-2 text-xl">
        <span className="figures text-xs text-muted-foreground">{number} of 4</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
