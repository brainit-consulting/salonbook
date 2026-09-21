import type { Metadata } from "next";
import Link from "next/link";
import { requireOwner } from "@/lib/auth-guards";
import { listServices, listStylists } from "@/lib/salon/catalog";
import { AddStylist } from "./add-stylist";
import { RestoreStylistButton } from "./stylist-buttons";
import { summariseWeek } from "./week";

export const metadata: Metadata = { title: "Stylists" };

export default async function StylistsPage() {
  await requireOwner();
  const [all, services] = await Promise.all([
    listStylists({ includeInactive: true }),
    listServices({ includeInactive: true }),
  ]);
  const working = all.filter((s) => s.active);
  const removed = all.filter((s) => !s.active);
  const options = services.map((s) => ({ id: s.id, name: s.name, active: s.active }));

  // Names in price-list order, leaving out services the salon has removed.
  const servicesOf = (serviceIds: string[]) =>
    services.filter((s) => s.active && serviceIds.includes(s.id)).map((s) => s.name);

  return (
    <div className="w-full max-w-3xl py-2">
      <div className="double-rule flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem]">Stylists</h1>
          <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
            Who clients can book, what each of them does and the week they work.
          </p>
        </div>
        {working.length ? <AddStylist services={options} /> : null}
      </div>

      {working.length ? (
        <ul className="border-t border-border">
          {working.map((stylist) => {
            const names = servicesOf(stylist.serviceIds);
            return (
              <li
                key={stylist.id}
                className="grid gap-x-6 gap-y-1 border-b border-border py-4 sm:grid-cols-[12rem_1fr_auto] sm:items-baseline"
              >
                <Link
                  href={`/stylists/${stylist.id}`}
                  className="text-lg font-semibold underline-offset-4 hover:underline"
                >
                  {stylist.name}
                </Link>
                <div className="min-w-0">
                  <p className="figures text-sm">{summariseWeek(stylist.hours)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {names.length ? names.join(", ") : "No services ticked yet"}
                  </p>
                </div>
                <Link
                  href={`/stylists/${stylist.id}`}
                  className="text-sm underline underline-offset-4"
                >
                  Hours and days off
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="border-y border-border py-6">
          <p className="mb-4 max-w-[62ch]">
            No stylists yet. Add the first one, then set the hours they work so clients can book
            them.
          </p>
          <AddStylist services={options} />
        </div>
      )}

      {removed.length ? (
        <section className="mt-12">
          <h2 className="mb-3 text-xl text-muted-foreground">Removed</h2>
          <ul className="border-t border-border text-muted-foreground">
            {removed.map((stylist) => (
              <li
                key={stylist.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-border py-3"
              >
                <Link
                  href={`/stylists/${stylist.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {stylist.name}
                </Link>
                <RestoreStylistButton id={stylist.id} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
