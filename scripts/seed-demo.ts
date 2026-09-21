import "./load-env";

import { randomBytes } from "node:crypto";
import { db } from "../src/lib/db";
import {
  bookings,
  services,
  stylistServices,
  stylists,
  timeOff,
  workingHours,
} from "../src/lib/db/schema";
import { salon } from "../src/lib/salon/config";
import {
  addDays,
  atMinute,
  formatDay,
  formatMinute,
  formatMoney,
  today,
  weekdayOf,
} from "../src/lib/salon/time";

// Sample services, stylists and bookings for Pepper Tree Hair, dated from the
// day this runs. Run it again when the diary looks stale: it clears the
// salon's tables and lays them down fresh. It never touches the owner's
// account, sign-in sessions, connected assistants or the logs.

const SERVICES = {
  womensCut: { name: "Women's cut", durationMinutes: 60, priceCents: 6400 },
  mensCut: { name: "Men's cut", durationMinutes: 30, priceCents: 3800 },
  kidsCut: { name: "Kids' cut", durationMinutes: 30, priceCents: 2600 },
  blowDry: { name: "Blow-dry", durationMinutes: 45, priceCents: 4700 },
  rootTouchUp: { name: "Root touch-up", durationMinutes: 75, priceCents: 9200 },
  fullColour: { name: "Full color", durationMinutes: 120, priceCents: 14500 },
  highlights: { name: "Partial highlights", durationMinutes: 105, priceCents: 13800 },
  conditioning: { name: "Deep conditioning treatment", durationMinutes: 30, priceCents: 3400 },
} as const;
type ServiceKey = keyof typeof SERVICES;

const ALL = Object.keys(SERVICES) as ServiceKey[];
const COLOUR: ServiceKey[] = ["rootTouchUp", "fullColour", "highlights"];

// Weekdays are 0 = Sunday … 6 = Saturday, hours are minutes from midnight.
type StylistKey = "marisol" | "tomasz" | "adaeze";
type StylistSpec = {
  name: string;
  weekdays: number[];
  startMinute: number;
  endMinute: number;
  does: ServiceKey[];
};
const STYLISTS: Record<StylistKey, StylistSpec> = {
  marisol: {
    name: "Marisol Vega",
    weekdays: [2, 3, 4, 5, 6],
    startMinute: 9 * 60,
    endMinute: 17 * 60,
    does: ALL.filter((k) => k !== "kidsCut"),
  },
  tomasz: {
    name: "Tomasz Kowalczyk",
    weekdays: [3, 4, 5, 6, 0],
    startMinute: 10 * 60,
    endMinute: 18 * 60,
    does: ALL.filter((k) => !COLOUR.includes(k)),
  },
  adaeze: {
    name: "Adaeze Okafor",
    weekdays: [1, 2, 4, 5],
    startMinute: 8 * 60 + 30,
    endMinute: 16 * 60 + 30,
    does: ALL,
  },
};
const STYLIST_KEYS = Object.keys(STYLISTS) as StylistKey[];

type Wish = {
  offset: number; // days from today, salon time
  stylist: StylistKey;
  service: ServiceKey;
  minute: number; // preferred start, minutes from midnight
  client: [name: string, phone: string, email: string];
  source?: "owner";
  cancelled?: true;
};

// Yesterday and today only ask for services every stylist does, because on
// those two days the booking goes to whoever is working rather than moving.
const WISHES: Wish[] = [
  { offset: -1, stylist: "tomasz", service: "womensCut", minute: 10 * 60 + 30, client: ["Priya Raghunathan", "(845) 555-0137", "priya.raghunathan@example.com"] },
  { offset: -1, stylist: "adaeze", service: "mensCut", minute: 14 * 60 + 15, client: ["Walt Brennan", "(845) 555-0119", "walt.brennan@example.com"] },

  { offset: 0, stylist: "adaeze", service: "blowDry", minute: 10 * 60, client: ["Ngozi Eze", "(845) 555-0164", "ngozi.eze@example.com"] },
  { offset: 0, stylist: "marisol", service: "womensCut", minute: 11 * 60, client: ["Caroline Whitfield", "(914) 555-0108", "cwhitfield@example.com"] },
  { offset: 0, stylist: "tomasz", service: "mensCut", minute: 12 * 60 + 30, client: ["Dmitri Sokolov", "(845) 555-0171", "dmitri.sokolov@example.com"], source: "owner" },
  { offset: 0, stylist: "adaeze", service: "conditioning", minute: 13 * 60 + 45, client: ["Lucía Fernández", "(845) 555-0126", "lucia.fernandez@example.com"] },
  { offset: 0, stylist: "marisol", service: "womensCut", minute: 15 * 60, client: ["Hannah Goldberg", "(845) 555-0183", "hannah.goldberg@example.com"] },

  { offset: 1, stylist: "adaeze", service: "fullColour", minute: 9 * 60, client: ["Mei-Ling Chou", "(845) 555-0152", "meiling.chou@example.com"] },
  { offset: 2, stylist: "marisol", service: "rootTouchUp", minute: 9 * 60 + 30, client: ["Siobhan Gallagher", "(914) 555-0145", "siobhan.g@example.com"] },
  { offset: 2, stylist: "tomasz", service: "kidsCut", minute: 15 * 60 + 30, client: ["Tobias Lindqvist", "(845) 555-0190", "t.lindqvist@example.com"], cancelled: true },
  { offset: 3, stylist: "adaeze", service: "highlights", minute: 10 * 60 + 15, client: ["Aaliyah Jefferson", "(845) 555-0113", "aaliyah.jefferson@example.com"] },
  { offset: 4, stylist: "tomasz", service: "kidsCut", minute: 11 * 60 + 45, client: ["Rafael Monteiro", "(845) 555-0168", "rafael.monteiro@example.com"] },
  { offset: 5, stylist: "marisol", service: "highlights", minute: 13 * 60, client: ["Beatrice Ainsworth", "(845) 555-0131", "bea.ainsworth@example.com"] },
  { offset: 6, stylist: "tomasz", service: "blowDry", minute: 16 * 60 + 15, client: ["Yusuf Demir", "(845) 555-0157", "yusuf.demir@example.com"] },
];

type Span = { stylist: StylistKey; startsAt: Date; endsAt: Date };

function works(stylist: StylistKey, day: string): boolean {
  return STYLISTS[stylist].weekdays.includes(weekdayOf(day));
}

/** The stylist's first working day on or after `day`. */
function workingDay(stylist: StylistKey, day: string): string {
  let d = day;
  while (!works(stylist, d)) d = addDays(d, 1);
  return d;
}

/**
 * A start time on the 15 minute grid, inside the stylist's hours, clear of
 * everything already placed for them. Tries from the wished time to closing,
 * then from opening, so a wish only fails when the whole day is full.
 */
function findStart(
  stylist: StylistKey,
  day: string,
  wishMinute: number,
  duration: number,
  busy: Span[],
): number | null {
  const { startMinute, endMinute } = STYLISTS[stylist];
  const first = Math.max(wishMinute, startMinute);
  const tries: number[] = [];
  for (let m = first; m + duration <= endMinute; m += salon.slotStepMinutes) tries.push(m);
  for (let m = startMinute; m < first && m + duration <= endMinute; m += salon.slotStepMinutes)
    tries.push(m);

  for (const m of tries) {
    const start = atMinute(day, m);
    const end = atMinute(day, m + duration);
    const clash = busy.some((b) => b.stylist === stylist && b.startsAt < end && b.endsAt > start);
    if (!clash) return m;
  }
  return null;
}

async function main() {
  const first = today();
  const now = new Date();

  // Time off goes down before any booking so bookings are placed around it.
  const dayOff = workingDay("marisol", addDays(first, 3));
  const dentist = workingDay("adaeze", addDays(first, 2));
  const offRows: (Span & { reason: string })[] = [
    { stylist: "marisol", startsAt: atMinute(dayOff, 0), endsAt: atMinute(dayOff, 24 * 60), reason: "Day off" },
    { stylist: "adaeze", startsAt: atMinute(dentist, 13 * 60), endsAt: atMinute(dentist, 15 * 60), reason: "Dentist" },
  ];

  const busy: Span[] = [...offRows];
  const placed: (Wish & { day: string; minute: number; startsAt: Date; endsAt: Date })[] = [];

  for (const wish of WISHES) {
    const duration = SERVICES[wish.service].durationMinutes;
    let stylist = wish.stylist;
    let day = addDays(first, wish.offset);

    if (wish.offset <= 0 && !works(stylist, day)) {
      // Yesterday and today have to stay put, so the booking goes to the
      // stylist working that day with the fewest bookings so far.
      const onShift = STYLIST_KEYS.filter((k) => works(k, day) && STYLISTS[k].does.includes(wish.service));
      if (!onShift.length) throw new Error(`Nobody works on ${day}.`);
      const load = (k: StylistKey) => placed.filter((p) => p.stylist === k && p.day === day).length;
      stylist = onShift.sort((a, b) => load(a) - load(b))[0];
    }

    let minute: number | null = null;
    for (let attempt = 0; attempt < 14 && minute === null; attempt++) {
      day = workingDay(stylist, day);
      minute = findStart(stylist, day, wish.minute, duration, busy);
      if (minute === null) day = addDays(day, 1);
    }
    if (minute === null) throw new Error(`No room for ${wish.client[0]} with ${STYLISTS[stylist].name}.`);

    const span = { stylist, startsAt: atMinute(day, minute), endsAt: atMinute(day, minute + duration) };
    // A cancelled booking frees its time, but keeping it clear here means the
    // diary shows the gap it left.
    busy.push(span);
    placed.push({ ...wish, ...span, day, minute });
  }

  await db.transaction(async (tx) => {
    await tx.delete(bookings);
    await tx.delete(timeOff);
    await tx.delete(workingHours);
    await tx.delete(stylistServices);
    await tx.delete(stylists);
    await tx.delete(services);

    const serviceRows = await tx
      .insert(services)
      .values(ALL.map((k, i) => ({ ...SERVICES[k], sortOrder: i })))
      .returning({ id: services.id });
    const serviceId = Object.fromEntries(ALL.map((k, i) => [k, serviceRows[i].id])) as Record<ServiceKey, string>;

    const stylistRows = await tx
      .insert(stylists)
      .values(STYLIST_KEYS.map((k, i) => ({ name: STYLISTS[k].name, sortOrder: i })))
      .returning({ id: stylists.id });
    const stylistId = Object.fromEntries(STYLIST_KEYS.map((k, i) => [k, stylistRows[i].id])) as Record<StylistKey, string>;

    await tx.insert(stylistServices).values(
      STYLIST_KEYS.flatMap((k) =>
        STYLISTS[k].does.map((s) => ({ stylistId: stylistId[k], serviceId: serviceId[s] })),
      ),
    );
    await tx.insert(workingHours).values(
      STYLIST_KEYS.flatMap((k) =>
        STYLISTS[k].weekdays.map((weekday) => ({
          stylistId: stylistId[k],
          weekday,
          startMinute: STYLISTS[k].startMinute,
          endMinute: STYLISTS[k].endMinute,
        })),
      ),
    );
    await tx.insert(timeOff).values(
      offRows.map((o) => ({
        stylistId: stylistId[o.stylist],
        startsAt: o.startsAt,
        endsAt: o.endsAt,
        reason: o.reason,
      })),
    );

    // Rows go in directly: createBooking refuses past times and would write
    // an email for every one of these.
    await tx.insert(bookings).values(
      placed.map((p, i) => {
        // Booked between two and eight days before the visit, never in the future.
        const madeAt = new Date(
          Math.min(now.getTime(), p.startsAt.getTime()) - (2 + (i % 7)) * 24 * 3_600_000 - i * 41 * 60_000,
        );
        return {
          serviceId: serviceId[p.service],
          stylistId: stylistId[p.stylist],
          startsAt: p.startsAt,
          endsAt: p.endsAt,
          clientName: p.client[0],
          clientPhone: p.client[1],
          clientEmail: p.client[2],
          status: p.cancelled ? "cancelled" : "booked",
          source: p.source ?? "client",
          cancelToken: randomBytes(24).toString("base64url"),
          cancelledAt: p.cancelled ? new Date(now.getTime() - 3 * 3_600_000) : null,
          cancelledBy: p.cancelled ? "client" : null,
          createdAt: madeAt,
        };
      }),
    );
  });

  console.log(`\n${salon.name}: sample data laid down for ${formatDay(first)}.\n`);
  console.log(`  ${ALL.length} services, from ${formatMoney(Math.min(...ALL.map((k) => SERVICES[k].priceCents)))}`);
  console.log(`  ${STYLIST_KEYS.length} stylists: ${STYLIST_KEYS.map((k) => STYLISTS[k].name).join(", ")}`);
  console.log(`  Time off: ${STYLISTS.marisol.name} all day ${formatDay(dayOff, "short")}; ${STYLISTS.adaeze.name} ${formatMinute(13 * 60)} to ${formatMinute(15 * 60)} ${formatDay(dentist, "short")}`);
  console.log(`  ${placed.length} bookings:`);
  for (const p of [...placed].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())) {
    const notes = [p.cancelled && "cancelled", p.source === "owner" && "taken by the owner"].filter(Boolean);
    console.log(
      `    ${formatDay(p.day, "short").padEnd(11)} ${formatMinute(p.minute).padStart(8)}  ${STYLISTS[p.stylist].name.padEnd(17)} ${SERVICES[p.service].name.padEnd(28)} ${p.client[0]}${notes.length ? `  (${notes.join(", ")})` : ""}`,
    );
  }
  console.log("\nNo account was created. Sign up once in the browser to become the owner.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
