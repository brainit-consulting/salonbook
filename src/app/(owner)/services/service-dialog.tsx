"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addServiceAction, editServiceAction } from "./actions";
import { centsToPriceText } from "./parse";

type Editing = { id: string; name: string; durationMinutes: number; priceCents: number };

/** Add a service, or edit one when `service` is given. */
export function ServiceDialog({ service }: { service?: Editing }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    // Start each visit from what is saved, not from a half-typed earlier try.
    setName(service?.name ?? "");
    setMinutes(service ? String(service.durationMinutes) : "");
    setPrice(service ? centsToPriceText(service.priceCents) : "");
    setError(null);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const fields = { name, minutes, price };
      const result = service
        ? await editServiceAction(service.id, fields)
        : await addServiceAction(fields);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  const key = service?.id ?? "new";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={<Button variant={service ? "outline" : "default"} size={service ? "sm" : "lg"} />}
      >
        {service ? "Edit" : "Add a service"}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={save} className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {service ? `Edit ${service.name}` : "Add a service"}
            </DialogTitle>
            <DialogDescription>
              Clients see the name, the length and the price when they book.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor={`name-${key}`} className="font-semibold">
              Name
            </Label>
            <Input
              id={`name-${key}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cut and blow-dry"
              maxLength={80}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={`minutes-${key}`} className="font-semibold">
                Length in minutes
              </Label>
              <Input
                id={`minutes-${key}`}
                className="figures"
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="45"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`price-${key}`} className="font-semibold">
                Price in dollars
              </Label>
              <Input
                id={`price-${key}`}
                className="figures"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45.50"
                required
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving" : service ? "Save changes" : "Add service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
