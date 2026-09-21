import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth-guards";
import { listServices } from "@/lib/salon/catalog";
import { formatDuration, formatMoney } from "@/lib/salon/time";
import { RemoveServiceButton, RestoreServiceButton } from "./service-buttons";
import { ServiceDialog } from "./service-dialog";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  await requireOwner();
  const all = await listServices({ includeInactive: true });
  const offered = all.filter((s) => s.active);
  const removed = all.filter((s) => !s.active);

  return (
    <div className="w-full max-w-3xl py-2">
      <div className="double-rule flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem]">Services</h1>
          <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
            The price list clients book from. The length is how much of the diary a booking takes.
          </p>
        </div>
        {offered.length ? <ServiceDialog /> : null}
      </div>

      {offered.length ? (
        <ul className="border-t border-border">
          {offered.map((service) => (
            <li
              key={service.id}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2 border-b border-border py-3 sm:grid-cols-[1fr_7rem_6rem_auto]"
            >
              <span className="font-semibold">{service.name}</span>
              <span className="figures order-3 text-sm text-muted-foreground sm:order-none">
                {formatDuration(service.durationMinutes)}
              </span>
              <span className="figures text-right">{formatMoney(service.priceCents)}</span>
              <span className="order-4 flex justify-end gap-2 sm:order-none">
                <ServiceDialog
                  service={{
                    id: service.id,
                    name: service.name,
                    durationMinutes: service.durationMinutes,
                    priceCents: service.priceCents,
                  }}
                />
                <RemoveServiceButton id={service.id} name={service.name} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-y border-border py-6">
          <p className="mb-4 max-w-[62ch]">
            The price list is empty. Add the first service so clients have something to book.
          </p>
          <ServiceDialog />
        </div>
      )}

      {removed.length ? (
        <section className="mt-12">
          <h2 className="mb-3 text-xl text-muted-foreground">Removed</h2>
          <ul className="border-t border-border text-muted-foreground">
            {removed.map((service) => (
              <li
                key={service.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-border py-3"
              >
                <span>
                  {service.name}
                  <span className="figures ml-3 text-sm">
                    {formatDuration(service.durationMinutes)} · {formatMoney(service.priceCents)}
                  </span>
                </span>
                <RestoreServiceButton id={service.id} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
