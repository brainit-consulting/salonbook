import Link from "next/link";
import { connection } from "next/server";
import { cn } from "cn";
import { bigButton, bookHref } from "@/components/booking/links";
import { openingSummary } from "@/components/booking/opening";
import { EmptyState, quietLink } from "@/components/booking/client-shell";
import { SiteFooter } from "@/components/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { listServices, listStylists } from "@/lib/salon/catalog";
import { salon } from "@/lib/salon/config";
import { formatDuration, formatMoney } from "@/lib/salon/time";

export default async function Home() {
  // The price list is whatever the owner has set up right now, not what it
  // was when the site was built.
  await connection();
  const [services, stylists] = await Promise.all([listServices(), listStylists()]);
  const opening = openingSummary(stylists);
  const [street, ...town] = salon.address.split(", ");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <main className="mx-auto w-full max-w-xl px-4 pt-10 pb-16">
        {/* The name runs to the left edge of the column. On wide screens the
            address and hours hang beside it, outside the column. */}
        <header className="relative">
          <h1 className="text-[clamp(2.25rem,6vw,4rem)]">{salon.name}</h1>
          <div className="figures mt-4 space-y-3 text-xs leading-relaxed text-muted-foreground lg:absolute lg:top-2 lg:left-full lg:mt-0 lg:ml-10 lg:w-56">
            <address className="not-italic">
              {street}
              <br />
              {town.join(", ")}
              <br />
              <a href={`tel:${salon.phone.replace(/\D/g, "")}`} className="hover:text-foreground">
                {salon.phone}
              </a>
            </address>
            {opening.length ? (
              <dl>
                {opening.map((line) => (
                  <div key={line.days} className="flex gap-3">
                    <dt className="w-20 shrink-0">{line.days}</dt>
                    <dd>{line.hours}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </header>

        <section aria-labelledby="prices" className="mt-12">
          <h2 id="prices" className="double-rule text-[1.75rem]">
            Price list
          </h2>
          {services.length ? (
            <>
              <ul className="border-t">
                {services.map((service) => (
                  <li key={service.id} className="border-b">
                    <Link
                      href={bookHref({ service: service.id })}
                      className="group flex min-h-12 items-baseline gap-3 py-3 transition-colors duration-100 hover:text-primary"
                    >
                      <span className="flex-1 font-semibold">{service.name}</span>
                      <span className="figures text-sm text-muted-foreground">
                        {formatDuration(service.durationMinutes)}
                      </span>
                      <span className="figures w-20 text-right">
                        {formatMoney(service.priceCents)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Pick a service to book it, or start here.
              </p>
              <Link
                href="/book"
                className={cn(buttonVariants(), bigButton, "mt-5 w-full sm:w-auto")}
              >
                Book an appointment
              </Link>
            </>
          ) : (
            <EmptyState
              action={
                <Link href="/sign-in" className={cn(quietLink, "text-sm text-muted-foreground")}>
                  Owner sign in
                </Link>
              }
            >
              The salon has not set up its services yet. Once it has, the price list goes here
              and you can book from it.
            </EmptyState>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
