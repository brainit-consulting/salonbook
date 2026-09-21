import { requireOwnerAction } from "@/lib/auth-guards";
import { listBookings, type BookingDetail } from "@/lib/salon/bookings";
import { listServices, listStylists } from "@/lib/salon/catalog";

const PAGE = 200; // listBookings never returns more than this at once

// listBookings is capped, so walk forward from the last start time seen.
// Two stylists can start at the same minute, hence the id check.
async function everyBooking(): Promise<BookingDetail[]> {
  const seen = new Map<string, BookingDetail>();
  let from = new Date(0);
  const to = new Date("9999-01-01T00:00:00Z");
  for (;;) {
    const page = await listBookings({ from, to, includeCancelled: true, limit: PAGE });
    const fresh = page.filter((b) => !seen.has(b.id));
    for (const b of fresh) seen.set(b.id, b);
    if (page.length < PAGE || fresh.length === 0) break;
    from = page[page.length - 1].startsAt;
  }
  return [...seen.values()];
}

export async function GET() {
  let session;
  try {
    session = await requireOwnerAction();
  } catch {
    return new Response("Sign in as the owner to download this.", { status: 401 });
  }

  const [services, stylists, bookings] = await Promise.all([
    listServices({ includeInactive: true }),
    listStylists({ includeInactive: true }),
    everyBooking(),
  ]);

  // Named fields only. The owner's row is never spread into this, so a password
  // hash or a token cannot ride along. cancelToken is left out too: it is the
  // private link that lets its holder cancel the booking.
  const data = {
    exportedAt: new Date().toISOString(),
    owner: {
      name: session.user.name,
      email: session.user.email,
      createdAt: session.user.createdAt,
    },
    services,
    stylists,
    bookings: bookings.map((b) => ({
      id: b.id,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      serviceName: b.serviceName,
      priceCents: b.priceCents,
      stylistName: b.stylistName,
      clientName: b.clientName,
      clientPhone: b.clientPhone,
      clientEmail: b.clientEmail,
      status: b.status,
      source: b.source,
      cancelledAt: b.cancelledAt,
      cancelledBy: b.cancelledBy,
      createdAt: b.createdAt,
    })),
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pepper-tree-hair-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
