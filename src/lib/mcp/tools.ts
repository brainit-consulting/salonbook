import "server-only";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { getFreeSlots } from "@/lib/salon/availability";
import {
  cancelBooking,
  createBooking,
  listBookings,
  type BookingDetail,
} from "@/lib/salon/bookings";
import { listServices, listStylists, type WorkingHours } from "@/lib/salon/catalog";
import { salon } from "@/lib/salon/config";
import { SalonError } from "@/lib/salon/errors";
import {
  addDays,
  atMinute,
  dayOf,
  formatDay,
  formatDuration,
  formatMinute,
  formatMoney,
  formatTime,
  isDay,
  WEEKDAYS,
} from "@/lib/salon/time";
import { logged } from "./log";

const READ = "bookings:read";
const WRITE = "bookings:write";
const MAX_DAYS = 31;

const day = (what: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .describe(`${what}, as YYYY-MM-DD in salon time (US Eastern).`);

// Lax on purpose: any id the database handed out passes, anything else is
// stopped here instead of reaching a query as a malformed uuid.
const id = (what: string) => z.guid().describe(what);

function hoursInWords(hours: WorkingHours[]): string[] {
  return hours.map(
    (h) => `${WEEKDAYS[h.weekday]} ${formatMinute(h.startMinute)} to ${formatMinute(h.endMinute)}`,
  );
}

// Every time goes out twice: words for the person, ISO for the next tool call.
function bookingForAgent(b: BookingDetail) {
  return {
    bookingId: b.id,
    status: b.status,
    clientName: b.clientName,
    clientPhone: b.clientPhone,
    service: b.serviceName,
    stylist: b.stylistName,
    price: formatMoney(b.priceCents),
    when: `${formatDay(b.startsAt)}, ${formatTime(b.startsAt)} to ${formatTime(b.endsAt)}`,
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt.toISOString(),
    bookedBy: b.source,
  };
}

export function registerTools(server: McpServer) {
  server.registerTool(
    "list_services_and_stylists",
    {
      title: "List services and stylists",
      description:
        "Lists what the salon offers (each service with its length and price) and who works there (each stylist with the services they do and their weekly hours). Use it to answer questions about the salon, and to get the serviceId and stylistId the other tools need.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    logged("list_services_and_stylists", READ, async () => {
      const [services, stylists] = await Promise.all([listServices(), listStylists()]);
      const names = new Map(services.map((s) => [s.id, s.name]));
      return {
        rows: services.length + stylists.length,
        data: {
          salon: { name: salon.name, phone: salon.phone, timezone: salon.timezone },
          services: services.map((s) => ({
            serviceId: s.id,
            name: s.name,
            length: formatDuration(s.durationMinutes),
            durationMinutes: s.durationMinutes,
            price: formatMoney(s.priceCents),
          })),
          stylists: stylists.map((s) => ({
            stylistId: s.id,
            name: s.name,
            services: s.serviceIds.flatMap((sid) => {
              const name = names.get(sid);
              return name ? [{ serviceId: sid, name }] : [];
            }),
            weeklyHours: hoursInWords(s.hours),
          })),
        },
      };
    }),
  );

  server.registerTool(
    "find_free_times",
    {
      title: "Find free times",
      description:
        "Lists the start times still open for one service with one stylist on one day. Use it before booking, or to answer when someone can be fitted in. serviceId and stylistId come from list_services_and_stylists. An empty list means the stylist is off, full, or the day is outside the booking window.",
      inputSchema: z.object({
        serviceId: id("A serviceId from list_services_and_stylists."),
        stylistId: id("A stylistId from list_services_and_stylists."),
        day: day("The day to look at"),
      }),
      annotations: { readOnlyHint: true },
    },
    logged("find_free_times", READ, async (input) => {
      const slots = await getFreeSlots(input);
      return {
        rows: slots.length,
        data: {
          day: input.day,
          dayInWords: formatDay(input.day),
          freeTimes: slots.map((s) => ({ time: s.label, startsAt: s.startsAt, endsAt: s.endsAt })),
        },
      };
    }),
  );

  server.registerTool(
    "list_bookings",
    {
      title: "List bookings in the diary",
      description: `Lists appointments in the salon's diary between two days, earliest first, with the client's name and phone, the service, the stylist and the time. Use it to answer who is coming in, and to find a bookingId before cancelling. Covers at most ${MAX_DAYS} days per call.`,
      inputSchema: z.object({
        from: day("First day to include"),
        to: day("Last day to include. Leave out for just the one day").optional(),
        stylistId: id("Only this stylist's bookings.").optional(),
        includeCancelled: z
          .boolean()
          .default(false)
          .describe("Also list bookings that were cancelled."),
        limit: z.number().int().min(1).max(100).default(50),
      }),
      annotations: { readOnlyHint: true },
    },
    logged("list_bookings", READ, async ({ from, to, stylistId, includeCancelled, limit }) => {
      const last = to ?? from;
      if (!isDay(from) || !isDay(last))
        throw new SalonError("invalid", "Dates look like 2026-09-25.");
      if (last < from) throw new SalonError("invalid", "The last day is before the first day.");
      if (last > addDays(from, MAX_DAYS - 1))
        throw new SalonError("invalid", `Ask for ${MAX_DAYS} days or fewer at a time.`);

      // One extra row tells us whether the diary holds more than we return.
      const found = await listBookings({
        from: atMinute(from, 0),
        to: atMinute(addDays(last, 1), 0),
        stylistId,
        includeCancelled,
        limit: limit + 1,
      });
      const rows = found.slice(0, limit);
      const more = found.length > limit;
      return {
        rows: rows.length,
        data: {
          from,
          to: last,
          bookings: rows.map(bookingForAgent),
          more,
          ...(more
            ? { next: `There are more. Ask again from ${dayOf(rows[rows.length - 1].startsAt)}.` }
            : {}),
        },
      };
    }),
  );

  server.registerTool(
    "book_appointment",
    {
      title: "Book an appointment",
      description:
        "Books one client in for one service with one stylist, and emails the client a confirmation. startsAt must be a startsAt value returned by find_free_times. The client's name, phone number and email address are all needed: if any is missing, ask the person for it rather than making one up.",
      inputSchema: z.object({
        serviceId: id("A serviceId from list_services_and_stylists."),
        stylistId: id("A stylistId from list_services_and_stylists."),
        startsAt: z.iso
          .datetime({ offset: true })
          .describe("The start time, copied from a find_free_times result."),
        clientName: z.string().min(1).max(120),
        clientPhone: z.string().min(7).max(40),
        clientEmail: z.email().max(200),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    logged("book_appointment", WRITE, async (input, userId) => {
      const booking = await createBooking({
        ...input,
        startsAt: new Date(input.startsAt),
        source: "agent",
        userId,
      });
      return { rows: 1, data: { booked: bookingForAgent(booking) } };
    }),
  );

  server.registerTool(
    "cancel_booking",
    {
      title: "Cancel a booking",
      description:
        "Cancels one appointment in the diary and frees the time. The client is told by email. This can't be undone: a cancelled booking has to be booked again. bookingId must come from a list_bookings result, so look the booking up first and check it is the right client and time.",
      inputSchema: z.object({
        bookingId: id("A bookingId from list_bookings."),
      }),
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    logged("cancel_booking", WRITE, async ({ bookingId }, userId) => {
      const booking = await cancelBooking({ id: bookingId, by: "agent", userId });
      return { rows: 1, data: { cancelled: bookingForAgent(booking) } };
    }),
  );
}
