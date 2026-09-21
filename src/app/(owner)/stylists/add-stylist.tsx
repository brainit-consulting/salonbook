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
import { addStylistAction } from "./actions";
import { ServicePicker, type ServiceOption } from "./service-picker";

export function AddStylist({ services }: { services: ServiceOption[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setName("");
    setServiceIds([]);
    setError(null);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await addStylistAction({ name, serviceIds });
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button size="lg" />}>Add a stylist</DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <form onSubmit={save} className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl">Add a stylist</DialogTitle>
            <DialogDescription>
              Clients can book them once they have services and working hours. Hours are set on
              the stylist&apos;s own page.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor="new-stylist-name" className="font-semibold">
              Name
            </Label>
            <Input
              id="new-stylist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
            />
          </div>

          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-sm font-semibold">Services they do</legend>
            <ServicePicker services={services} value={serviceIds} onChange={setServiceIds} />
          </fieldset>

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
              {pending ? "Adding" : "Add stylist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
