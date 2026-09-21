import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { requireOwner } from "@/lib/auth-guards";
import { listBookings, type BookingDetail } from "@/lib/salon/bookings";
import { listStylists, listTimeOff, type StylistWithDetail } from "@/lib/salon/catalog";
import {
  addDays,
  atMinute,
  formatDay,
  formatMinute,
  formatTime,
  minuteOf,
  today,
  weekdayOf,
} from "@/lib/salon/time";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dayFrom, diaryHref, one, type Search } from "./day";

export const metadata: Metadata = { title: "Diary" };

// One hour is 96px tall, so the shortest thing on the grid, a 15 minute
// service, still has room for one line of type.
const PX_PER_MINUTE = 1.6;

type Span = { startMinute: number; endMinute: number };
type Off = Span & { id: string; reason: string | null; allDay: boolean };
type Column = {
  stylist: StylistWithDetail;
  hours: Span[];
  bookings: (BookingDetail & Span)[];
  off: Off[];
};

export default async function DiaryPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireOwner();
  const query = await searchParams;
  const day = dayFrom(query.day);
  const showCancelled = one(query.cancelled) === "1";

  const dayStart = atMinute(day, 0);
  const dayEnd = atMinute(day, 1440);
  const [everyStylist, bookings, timeOff] = await Promise.all([
    listStylists({ includeInactive: true }),
    listBookings({ from: dayStart, to: dayEnd, includeCancelled: showCancelled }),
    listTimeOff({ from: dayStart }),
  ]);

  // A stylist who has left still gets a column on a day they have bookings.
  const stylists = everyStylist.filter(
    (s) => s.active || bookings.some((b) => b.stylistId === s.id),
  );
  const weekday = weekdayOf(day);

  const columns: Column[] = stylists.map((stylist) => ({
    stylist,
    hours: stylist.hours.filter((h) => h.weekday === weekday),
    bookings: bookings
      .filter((b) => b.stylistId === stylist.id)
      .map((b) => {
        const startMinute = minuteOf(b.startsAt);
        const length = Math.round((b.endsAt.getTime() - b.startsAt.getTime()) / 60000);
        return { ...b, startMinute, endMinute: startMinute + length };
      }),
    off: timeOff
      .filter((t) => t.stylistId === stylist.id && t.startsAt < dayEnd && t.endsAt > dayStart)
      .map((t) => {
        const startMinute = t.startsAt <= dayStart ? 0 : minuteOf(t.startsAt);
        const endMinute = t.endsAt >= dayEnd ? 1440 : minuteOf(t.endsAt);
        return {
          id: t.id,
          reason: t.reason,
          startMinute,
          endMinute,
          allDay: startMinute === 0 && endMinute === 1440,
        };
      }),
  }));

  // The grid runs from the earliest start to the latest end of the day's
  // working hours, widened to whole hours and to fit any booking outside them.
  const spans = columns.flatMap((c) => [...c.hours, ...c.bookings]);
  const open = spans.length ? Math.min(...spans.map((s) => s.startMinute)) : 9 * 60;
  const close = spans.length ? Math.max(...spans.map((s) => s.endMinute)) : 17 * 60;
  const gridStart = Math.floor(open / 60) * 60;
  const gridEnd = Math.min(1440, Math.ceil(close / 60) * 60);
  const hourMarks: number[] = [];
  for (let m = gridStart; m <= gridEnd; m += 60) hourMarks.push(m);

  const place = (span: Span) => {
    const start = Math.max(span.startMinute, gridStart);
    const end = Math.min(span.endMinute, gridEnd);
    return {
      top: (start - gridStart) * PX_PER_MINUTE,
      height: Math.max(0, end - start) * PX_PER_MINUTE,
    };
  };

  const live = bookings.filter((b) => b.status === "booked").length;
  const gridColumns = `4.5rem repeat(${columns.length}, minmax(10rem, 1fr))`;
  const dayButton = buttonVariants({ variant: "outline", size: "lg" });

  return (
    <>
      <div className="double-rule flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="text-[1.75rem]">{formatDay(day)}</h1>
        <p className="figures text-sm text-muted-foreground">
          {day} · {live} booked
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link href={diaryHref(addDays(day, -1), showCancelled)} className={dayButton}>
          Previous day
        </Link>
        <Link href={diaryHref(today(), showCancelled)} className={dayButton}>
          Today
        </Link>
        <Link href={diaryHref(addDays(day, 1), showCancelled)} className={dayButton}>
          Next day
        </Link>
        <form action="/diary" className="flex items-center gap-2">
          <label htmlFor="go-to-day" className="sr-only">
            Go to a date
          </label>
          <Input
            key={day}
            id="go-to-day"
            type="date"
            name="day"
            defaultValue={day}
            required
            className="figures h-9 w-auto"
          />
          {showCancelled && <input type="hidden" name="cancelled" value="1" />}
          <Button type="submit" variant="outline" size="lg">
            Go
          </Button>
        </form>
        <Link
          href={`/diary/new?day=${day}`}
          className={cn(buttonVariants({ size: "lg" }), "font-semibold sm:ml-auto")}
        >
          Add a booking
        </Link>
      </div>

      {columns.length === 0 ? (
        <p className="max-w-[62ch]">
          Add your first stylist to start a diary.{" "}
          <Link href="/stylists" className="font-semibold underline underline-offset-4">
            Add a stylist
          </Link>
        </p>
      ) : (
        <>
          {bookings.length === 0 && (
            <p className="mb-4 text-sm text-muted-foreground">
              Nothing is booked for this day yet.
            </p>
          )}

          {/* Desk: one column per stylist, ruled by the hour. */}
          <div className="hidden overflow-x-auto pt-2 md:block">
            <div className="min-w-full" style={{ width: "max-content" }}>
              <div className="grid border-b" style={{ gridTemplateColumns: gridColumns }}>
                <div />
                {columns.map((c) => (
                  <div key={c.stylist.id} className="border-l px-2 pb-2">
                    <p className="font-semibold">{c.stylist.name}</p>
                    <p className="figures text-xs text-muted-foreground">{hoursLabel(c.hours)}</p>
                  </div>
                ))}
              </div>

              <div
                className="relative mt-3 mb-3 grid"
                style={{
                  gridTemplateColumns: gridColumns,
                  height: (gridEnd - gridStart) * PX_PER_MINUTE,
                }}
              >
                {hourMarks.map((m) => (
                  <div
                    key={m}
                    className="pointer-events-none absolute inset-x-0 border-t"
                    style={{ top: (m - gridStart) * PX_PER_MINUTE }}
                  >
                    <span className="figures absolute -top-2 left-0 bg-background pr-2 text-xs leading-4 text-muted-foreground">
                      {formatMinute(m % 1440)}
                    </span>
                  </div>
                ))}

                <div />
                {columns.map((c) => {
                  // With cancelled bookings on show, they take the right half
                  // of the column so they never sit on top of a live one.
                  const split = c.bookings.some((b) => b.status === "cancelled");
                  return (
                    <div key={c.stylist.id} className="relative border-l">
                      {closedSpans(c.hours, gridStart, gridEnd).map((s) => (
                        <div
                          key={s.startMinute}
                          className="absolute inset-x-0 bg-muted/50"
                          style={place(s)}
                        />
                      ))}
                      {c.hours.length === 0 && (
                        <p className="relative px-2 pt-3 text-sm text-muted-foreground">Not in</p>
                      )}
                      {c.off.map((o) => (
                        <div
                          key={o.id}
                          className="absolute inset-x-1 overflow-hidden border border-dashed bg-muted px-2 py-0.5 text-xs leading-4 text-muted-foreground"
                          style={place(o)}
                        >
                          Time off{o.reason ? `: ${o.reason}` : ""}
                        </div>
                      ))}
                      {c.bookings.map((b) => {
                        const cancelled = b.status === "cancelled";
                        return (
                          <Link
                            key={b.id}
                            href={`/diary/booking/${b.id}`}
                            title={`${formatTime(b.startsAt)} ${b.clientName}, ${b.serviceName}`}
                            className={cn(
                              "absolute flex flex-wrap content-start gap-x-2 overflow-hidden border border-l-[3px] bg-card px-2 py-0.5 text-xs leading-4 transition-colors duration-100 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                              cancelled
                                ? "right-1 border-l-border text-muted-foreground line-through"
                                : "left-1 border-l-primary",
                              cancelled && (split ? "left-1/2" : "left-1"),
                              !cancelled && (split ? "right-1/2" : "right-1"),
                            )}
                            style={place(b)}
                          >
                            <span className="figures">{formatTime(b.startsAt)}</span>
                            <span className="font-semibold">{b.clientName}</span>
                            <span className={cn(!cancelled && "text-muted-foreground")}>
                              {b.serviceName}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Phone: the same day as a list, stylist by stylist. */}
          <div className="space-y-8 md:hidden">
            {columns.map((c) => {
              const entries = [
                ...c.bookings.map((b) => ({ at: b.startMinute, booking: b, off: null })),
                ...c.off.map((o) => ({ at: o.startMinute, booking: null, off: o })),
              ].sort((a, b) => a.at - b.at);
              return (
                <section key={c.stylist.id}>
                  <div className="flex items-baseline justify-between gap-4 border-b pb-2">
                    <h2 className="text-xl">{c.stylist.name}</h2>
                    <p className="figures text-xs text-muted-foreground">{hoursLabel(c.hours)}</p>
                  </div>
                  {entries.length === 0 ? (
                    <p className="py-3 text-sm text-muted-foreground">
                      {c.hours.length ? "Nothing booked." : "Not in."}
                    </p>
                  ) : (
                    <ul className="divide-y border-b">
                      {entries.map(({ booking: b, off: o }) =>
                        b ? (
                          <li key={b.id}>
                            <Link
                              href={`/diary/booking/${b.id}`}
                              className={cn(
                                "flex gap-3 border-l-[3px] py-3 pl-3 hover:bg-accent",
                                b.status === "cancelled"
                                  ? "border-l-border text-muted-foreground line-through"
                                  : "border-l-primary",
                              )}
                            >
                              <span className="figures w-[4.75rem] shrink-0 text-sm leading-6">
                                {formatTime(b.startsAt)}
                              </span>
                              <span className="min-w-0">
                                <span className="block font-semibold">{b.clientName}</span>
                                <span className="block text-sm text-muted-foreground">
                                  {b.serviceName}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ) : o ? (
                          <li
                            key={o.id}
                            className="flex gap-3 bg-muted/50 py-3 pl-[15px] text-sm text-muted-foreground"
                          >
                            <span className="figures w-[4.75rem] shrink-0">
                              {o.allDay ? "All day" : formatMinute(o.startMinute)}
                            </span>
                            <span>
                              Time off
                              {o.allDay ? "" : ` until ${formatMinute(o.endMinute % 1440)}`}
                              {o.reason ? `: ${o.reason}` : ""}
                            </span>
                          </li>
                        ) : null,
                      )}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>

          <p className="mt-6 text-sm">
            <Link
              href={diaryHref(day, !showCancelled)}
              className="underline underline-offset-4 hover:text-primary"
            >
              {showCancelled ? "Hide cancelled bookings" : "Show cancelled bookings"}
            </Link>
          </p>
        </>
      )}
    </>
  );
}

function hoursLabel(hours: Span[]): string {
  if (!hours.length) return "Not in";
  return hours
    .map((h) => `${formatMinute(h.startMinute)} to ${formatMinute(h.endMinute % 1440)}`)
    .join(", ");
}

/** The parts of the grid that fall outside a stylist's hours, to be shaded. */
function closedSpans(hours: Span[], gridStart: number, gridEnd: number): Span[] {
  const closed: Span[] = [];
  let cursor = gridStart;
  for (const h of [...hours].sort((a, b) => a.startMinute - b.startMinute)) {
    if (h.startMinute > cursor) closed.push({ startMinute: cursor, endMinute: h.startMinute });
    cursor = Math.max(cursor, h.endMinute);
  }
  if (cursor < gridEnd) closed.push({ startMinute: cursor, endMinute: gridEnd });
  return closed;
}
