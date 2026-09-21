"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type ServiceOption = { id: string; name: string; active: boolean };

/** Checkboxes for the services a stylist does. */
export function ServicePicker({
  services,
  value,
  onChange,
}: {
  services: ServiceOption[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  // A removed service stays listed only while this stylist still has it ticked.
  const shown = services.filter((s) => s.active || value.includes(s.id));

  if (!shown.length)
    return (
      <p className="text-sm text-muted-foreground">
        There are no services to tick yet.{" "}
        <Link href="/services" className="text-foreground underline underline-offset-4">
          Add services to the price list
        </Link>
      </p>
    );

  return (
    <ul className="grid gap-x-6 sm:grid-cols-2">
      {shown.map((service) => (
        <li key={service.id} className="border-b border-border">
          <Label className="min-h-11 py-2 font-normal">
            <Checkbox
              checked={value.includes(service.id)}
              onCheckedChange={(checked) =>
                onChange(
                  checked ? [...value, service.id] : value.filter((id) => id !== service.id),
                )
              }
            />
            <span>
              {service.name}
              {service.active ? null : <span className="text-muted-foreground"> (removed)</span>}
            </span>
          </Label>
        </li>
      ))}
    </ul>
  );
}
