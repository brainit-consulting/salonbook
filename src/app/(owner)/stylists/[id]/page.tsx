import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth-guards";
import { getStylist, listServices, listTimeOff } from "@/lib/salon/catalog";
import { RemoveStylistButton, RestoreStylistButton } from "../stylist-buttons";
import { daySpans, describeTimeOff } from "../week";
import { DaysOff } from "./days-off";
import { NameAndServices } from "./name-and-services";
import { WeeklyHours } from "./weekly-hours";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await requireOwner();
  const stylist = await getStylist((await params).id);
  return { title: stylist?.name ?? "Stylists" };
}

export default async function StylistPage({ params }: Props) {
  await requireOwner();
  const { id } = await params;
  const stylist = await getStylist(id);
  if (!stylist) notFound();

  const [services, timeOff] = await Promise.all([
    listServices({ includeInactive: true }),
    listTimeOff({ stylistId: stylist.id, from: new Date() }),
  ]);

  return (
    <div className="w-full max-w-3xl py-2">
      <Link href="/stylists" className="text-sm underline underline-offset-4">
        All stylists
      </Link>
      <h1 className="mt-3 mb-8 text-[2.25rem]">{stylist.name}</h1>

      {stylist.active ? null : (
        <div className="mb-10 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
          <p className="text-muted-foreground">
            {stylist.name} has been removed, so clients can&apos;t book them.
          </p>
          <RestoreStylistButton id={stylist.id} />
        </div>
      )}

      <section className="mb-14">
        <h2 className="double-rule text-[1.75rem]">Name and services</h2>
        <NameAndServices
          stylistId={stylist.id}
          name={stylist.name}
          serviceIds={stylist.serviceIds}
          services={services.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
        />
      </section>

      <section className="mb-14">
        <h2 className="double-rule text-[1.75rem]">Weekly hours</h2>
        <p className="mb-4 max-w-[62ch] text-sm text-muted-foreground">
          These hours repeat every week. For a single day away, add a day off below instead.
        </p>
        <WeeklyHours stylistId={stylist.id} spans={daySpans(stylist.hours)} />
      </section>

      <section className="mb-14">
        <h2 className="double-rule text-[1.75rem]">Days off</h2>
        <DaysOff
          stylistId={stylist.id}
          stylistName={stylist.name}
          upcoming={timeOff.map((off) => ({
            id: off.id,
            when: describeTimeOff(off),
            reason: off.reason,
          }))}
        />
      </section>

      {stylist.active ? (
        <section>
          <h2 className="double-rule text-[1.75rem]">Remove stylist</h2>
          <p className="mb-4 max-w-[62ch] text-sm text-muted-foreground">
            Takes {stylist.name} off the booking pages. Bookings they already have stay in the
            diary.
          </p>
          <RemoveStylistButton id={stylist.id} name={stylist.name} />
        </section>
      ) : null}
    </div>
  );
}
