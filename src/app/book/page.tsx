import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "cn";
import { BookingSummary } from "@/components/booking/booking-summary";
import {
  ClientShell,
  EmptyState,
  StepHeading,
  quietLink,
} from "@/components/booking/client-shell";
import { DetailsForm } from "@/components/booking/details-form";
import { bigButton, bookHref, isId } from "@/components/booking/links";
import { workingDays } from "@/components/booking/opening";
import { buttonVariants } from "@/components/ui/button";
import { getFreeSlots } from "@/lib/salon/availability";
import {
  getService,
  getStylist,
  listServices,
  listStylists,
  type Service,
  type StylistWithDetail,
} from "@/lib/salon/catalog";
import { salon } from "@/lib/salon/config";
import {
  addDays,
  dayOf,
  formatDay,
  formatDuration,
  formatMoney,
  isDay,
  today,
  weekdayOf,
} from "@/lib/salon/time";

export const metadata: Metadata = { title: "Book an appointment" };

type Search = Promise<Record<string, string | string[] | undefined>>;

// How many days the picker shows at once, and how far it looks for a free day.
const PICKER_DAYS = 14;

export default async function BookPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const param = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  // Every id from the URL is looked up. A bad one goes back a step.
  const serviceId = param("service");
  if (!serviceId) return <ServiceStep />;
  const service = isId(serviceId) ? await getService(serviceId) : null;
  if (!service || !service.active) redirect(bookHref());

  const stylistId = param("stylist");
  if (!stylistId) return <StylistStep service={service} />;
  const stylist = isId(stylistId) ? await getStylist(stylistId) : null;
  if (!stylist || !stylist.active || !stylist.serviceIds.includes(service.id))
    redirect(bookHref({ service: service.id }));

  const time = param("time");
  if (time) return <DetailsStep service={service} stylist={stylist} time={time} />;

  return (
    <TimeStep
      service={service}
      stylist={stylist}
      day={param("day")}
      from={param("from")}
      taken={param("notice") === "taken"}
    />
  );
}

function ServiceRow({ service }: { service: Service }) {
  return (
    <li className="border-b">
      <Link
        href={bookHref({ service: service.id })}
        className="flex min-h-12 items-baseline gap-3 py-3 transition-colors duration-100 hover:text-primary"
      >
        <span className="flex-1 font-semibold">{service.name}</span>
        <span className="figures text-sm text-muted-foreground">
          {formatDuration(service.durationMinutes)}
        </span>
        <span className="figures w-20 text-right">{formatMoney(service.priceCents)}</span>
      </Link>
    </li>
  );
}

async function ServiceStep() {
  const services = await listServices();
  return (
    <ClientShell>
      <StepHeading step={1}>Pick a service</StepHeading>
      {services.length ? (
        <ul className="border-t">
          {services.map((s) => (
            <ServiceRow key={s.id} service={s} />
          ))}
        </ul>
      ) : (
        <EmptyState
          action={
            <Link href="/sign-in" className={cn(quietLink, "text-sm text-muted-foreground")}>
              Owner sign in
            </Link>
          }
        >
          The salon has not set up its services yet, so there is nothing to book.
        </EmptyState>
      )}
    </ClientShell>
  );
}

async function StylistStep({ service }: { service: Service }) {
  const stylists = await listStylists({ serviceId: service.id });
  return (
    <ClientShell>
      <StepHeading step={2}>Pick a stylist</StepHeading>
      <Chosen
        line={
          <>
            {service.name}
            <span className="figures text-sm text-muted-foreground">
              {" "}
              · {formatDuration(service.durationMinutes)} · {formatMoney(service.priceCents)}
            </span>
          </>
        }
        changeHref={bookHref()}
        changeLabel="Change service"
      />
      {stylists.length ? (
        <ul className="border-t">
          {stylists.map((s) => {
            const days = workingDays(s);
            return (
              <li key={s.id} className="border-b">
                <Link
                  href={bookHref({ service: service.id, stylist: s.id })}
                  className="block py-4 transition-colors duration-100 hover:text-primary"
                >
                  <span className="font-semibold">{s.name}</span>
                  {days.length ? (
                    <span className="figures mt-1.5 grid gap-0.5 text-xs text-muted-foreground">
                      {days.map((d) => (
                        <span key={d.day} className="flex gap-3">
                          <span className="w-8">{d.day}</span>
                          <span>{d.hours}</span>
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="mt-1 block text-sm text-muted-foreground">
                      No working days set yet.
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          action={
            <Link href={bookHref()} className={quietLink}>
              Pick another service
            </Link>
          }
        >
          Nobody at the salon is set up to do {service.name} yet.
        </EmptyState>
      )}
    </ClientShell>
  );
}

async function TimeStep(props: {
  service: Service;
  stylist: StylistWithDetail;
  day?: string;
  from?: string;
  taken: boolean;
}) {
  const { service, stylist } = props;
  const ids = { serviceId: service.id, stylistId: stylist.id };
  const first = today();
  const last = addDays(first, salon.bookingWindowDays);
  const workdays = new Set(stylist.hours.map((h) => h.weekday));
  const bookable = (d: string | undefined): d is string =>
    !!d && isDay(d) && d >= first && d <= last;
  const works = (d: string) => workdays.has(weekdayOf(d));

  // A day from the URL that is malformed, outside the booking window or not
  // one of the stylist's days is dropped, and the first offered day is used.
  let day = bookable(props.day) && works(props.day) ? props.day : undefined;
  let from = bookable(props.from) ? props.from : first;
  if (day && (day < from || day > addDays(from, PICKER_DAYS - 1))) from = day;

  const days = Array.from({ length: PICKER_DAYS }, (_, i) => addDays(from, i)).filter(
    (d) => d <= last && works(d),
  );
  day ??= days[0];

  const slots = day ? await getFreeSlots({ ...ids, day }) : [];

  // Nothing left on this day: look ahead for the next one with a free time.
  // Only working days cost a lookup, and the search stops at the first hit.
  let nextFree: string | undefined;
  if (day && !slots.length) {
    for (let i = 1; i <= PICKER_DAYS && !nextFree; i++) {
      const d = addDays(day, i);
      if (d > last) break;
      if (!works(d)) continue;
      if ((await getFreeSlots({ ...ids, day: d })).length) nextFree = d;
    }
  }

  const base = { service: service.id, stylist: stylist.id };
  const weekBack = addDays(from, -7);
  const earlier = from > first ? (weekBack < first ? first : weekBack) : null;
  const later = addDays(from, 7) <= last ? addDays(from, 7) : null;

  return (
    <ClientShell>
      <StepHeading step={3}>Pick a day and a time</StepHeading>
      <Chosen
        line={
          <>
            {service.name} with {stylist.name}
            <span className="figures text-sm text-muted-foreground">
              {" "}
              · {formatDuration(service.durationMinutes)} · {formatMoney(service.priceCents)}
            </span>
          </>
        }
        changeHref={bookHref({ service: service.id })}
        changeLabel="Change stylist"
      />

      {props.taken ? (
        <p role="alert" className="mb-6 border-l-[3px] border-destructive pl-3 text-destructive">
          That time isn&apos;t free any more. Pick another.
        </p>
      ) : null}

      {!workdays.size ? (
        <EmptyState
          action={
            <Link href={bookHref({ service: service.id })} className={quietLink}>
              Pick another stylist
            </Link>
          }
        >
          {stylist.name} has no working days set yet, so there are no times to offer.
        </EmptyState>
      ) : (
        <>
          <nav aria-label="Days" className="border-y py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              {earlier ? (
                <Link href={bookHref({ ...base, from: earlier })} className={quietLink}>
                  Previous week
                </Link>
              ) : (
                <span />
              )}
              {later ? (
                <Link href={bookHref({ ...base, from: later })} className={quietLink}>
                  Next week
                </Link>
              ) : null}
            </div>
            {days.length ? (
              <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {days.map((d) => {
                  const [weekday, date] = formatDay(d, "short").split(", ");
                  return (
                    <li key={d}>
                      <Link
                        href={bookHref({ ...base, from, day: d })}
                        aria-current={d === day ? "date" : undefined}
                        className={cn(
                          buttonVariants({ variant: d === day ? "default" : "outline" }),
                          "h-auto w-full flex-col gap-0 py-2 font-semibold",
                        )}
                      >
                        <span>{weekday}</span>
                        <span className="figures text-xs font-normal">{date}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {stylist.name} isn&apos;t working in these two weeks.
              </p>
            )}
          </nav>

          {day ? (
            <section aria-labelledby="times" className="mt-8">
              <h2 id="times" className="mb-4 text-2xl">
                {formatDay(day)}
              </h2>
              {slots.length ? (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((slot) => (
                    <li key={slot.startsAt}>
                      <Link
                        href={bookHref({ ...base, time: slot.startsAt })}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "figures h-11 w-full text-sm",
                        )}
                      >
                        {slot.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  action={
                    nextFree ? (
                      <Link
                        href={bookHref({ ...base, day: nextFree })}
                        className={cn(buttonVariants({ variant: "outline" }), bigButton)}
                      >
                        See {formatDay(nextFree)}
                      </Link>
                    ) : (
                      <Link href={bookHref({ service: service.id })} className={quietLink}>
                        Pick another stylist
                      </Link>
                    )
                  }
                >
                  No times left with {stylist.name} on this day.
                  {nextFree ? ` The next day with a free time is ${formatDay(nextFree)}.` : null}
                </EmptyState>
              )}
            </section>
          ) : null}
        </>
      )}
    </ClientShell>
  );
}

async function DetailsStep(props: { service: Service; stylist: StylistWithDetail; time: string }) {
  const { service, stylist } = props;
  const base = { service: service.id, stylist: stylist.id };

  // The time has to be one still on offer. A made-up time goes back to the
  // day picker; a real one that has gone goes back with the reason.
  const at = new Date(props.time);
  if (Number.isNaN(at.getTime())) redirect(bookHref(base));
  const day = dayOf(at);
  const slots = await getFreeSlots({ serviceId: service.id, stylistId: stylist.id, day });
  const slot = slots.find((s) => s.startsAt === at.toISOString());
  if (!slot) redirect(bookHref({ ...base, day, notice: "taken" }));

  return (
    <ClientShell>
      <StepHeading step={3}>Check it and add your details</StepHeading>
      <BookingSummary
        serviceName={service.name}
        stylistName={stylist.name}
        startsAt={at}
        durationMinutes={service.durationMinutes}
        priceCents={service.priceCents}
      />
      <p className="mt-3 text-sm">
        <Link href={bookHref({ ...base, day })} className={quietLink}>
          Change the time
        </Link>
      </p>
      <DetailsForm service={service.id} stylist={stylist.id} time={slot.startsAt} />
      <p className="mt-6 max-w-[62ch] text-sm text-muted-foreground">
        You pay at the salon. You can cancel online up to {salon.cancelCutoffHours} hours before
        your appointment.
      </p>
    </ClientShell>
  );
}

/** What has been picked so far, with the way back to change it. */
function Chosen(props: { line: React.ReactNode; changeHref: string; changeLabel: string }) {
  return (
    <p className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span>{props.line}</span>
      <Link href={props.changeHref} className={cn(quietLink, "text-sm")}>
        {props.changeLabel}
      </Link>
    </p>
  );
}
