"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddBookingState } from "@/app/(owner)/diary/actions";

const fields = [
  { name: "clientName", label: "Client's name", type: "text", autoComplete: "off" },
  { name: "clientPhone", label: "Phone", type: "tel", autoComplete: "off" },
  { name: "clientEmail", label: "Email", type: "email", autoComplete: "off" },
] as const;

export function NewBookingForm({
  action,
  serviceId,
  stylistId,
  startsAt,
  summary,
}: {
  action: (prev: AddBookingState, form: FormData) => Promise<AddBookingState>;
  serviceId: string;
  stylistId: string;
  /** Empty when the time in the URL is no longer free. */
  startsAt: string;
  summary: string;
}) {
  const [state, submit, pending] = useActionState(action, {});

  return (
    <form action={submit} className="max-w-md space-y-4">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="stylistId" value={stylistId} />
      <input type="hidden" name="startsAt" value={startsAt} />

      {fields.map((f) => (
        <div key={f.name} className="space-y-1.5">
          <Label htmlFor={f.name} className="font-semibold">
            {f.label}
          </Label>
          <Input
            id={f.name}
            name={f.name}
            type={f.type}
            autoComplete={f.autoComplete}
            required
            // React clears the form after an action, so put back what was typed.
            defaultValue={state.values?.[f.name]}
            className="h-10 bg-card"
          />
        </div>
      ))}

      {state.error && (
        <p role="alert" className="border-l-[3px] border-l-destructive pl-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <p className="text-sm text-muted-foreground">{summary}</p>
      <Button type="submit" size="lg" disabled={pending || !startsAt} className="h-10 px-4 font-semibold">
        {pending ? "Adding the booking" : "Add the booking"}
      </Button>
    </form>
  );
}
