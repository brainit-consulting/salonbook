"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editStylistAction } from "../actions";
import { ServicePicker, type ServiceOption } from "../service-picker";

export function NameAndServices(props: {
  stylistId: string;
  name: string;
  serviceIds: string[];
  services: ServiceOption[];
}) {
  const [name, setName] = useState(props.name);
  const [serviceIds, setServiceIds] = useState(props.serviceIds);
  const [note, setNote] = useState<{ error: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await editStylistAction(props.stylistId, { name, serviceIds });
      setNote(result.ok ? { error: false, text: "Saved." } : { error: true, text: result.error });
    });
  }

  return (
    <form onSubmit={save} className="grid gap-5">
      <div className="grid max-w-sm gap-1.5">
        <Label htmlFor="stylist-name" className="font-semibold">
          Name
        </Label>
        <Input
          id="stylist-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Services they do</legend>
        <ServicePicker services={props.services} value={serviceIds} onChange={setServiceIds} />
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving" : "Save name and services"}
        </Button>
        {note ? (
          <p
            role={note.error ? "alert" : "status"}
            className={note.error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
          >
            {note.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
