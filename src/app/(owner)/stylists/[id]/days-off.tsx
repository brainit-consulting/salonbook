"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { addTimeOffAction, removeTimeOffAction } from "../actions";

type Upcoming = { id: string; when: string; reason: string | null };

export function DaysOff({
  stylistId,
  stylistName,
  upcoming,
}: {
  stylistId: string;
  stylistName: string;
  upcoming: Upcoming[];
}) {
  return (
    <div className="grid gap-8">
      {upcoming.length ? (
        <ul className="border-t border-border">
          {upcoming.map((off) => (
            <DayOffRow key={off.id} off={off} />
          ))}
        </ul>
      ) : (
        <p className="max-w-[62ch] border-y border-border py-4 text-muted-foreground">
          {stylistName} has no days off coming up. Add one below and clients won&apos;t be offered
          those times.
        </p>
      )}
      <AddDayOff stylistId={stylistId} />
    </div>
  );
}

function DayOffRow({ off }: { off: Upcoming }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await removeTimeOffAction(off.id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-border py-3">
      <span>
        <span className="figures">{off.when}</span>
        {off.reason ? <span className="ml-3 text-muted-foreground">{off.reason}</span> : null}
      </span>
      <span className="inline-flex items-center gap-3">
        {error ? (
          <span role="alert" className="text-sm text-destructive">
            {error}
          </span>
        ) : null}
        <Button variant="ghost" size="sm" onClick={remove} disabled={pending}>
          {pending ? "Removing" : "Remove"}
        </Button>
      </span>
    </li>
  );
}

function AddDayOff({ stylistId }: { stylistId: string }) {
  const [day, setDay] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("13:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      // The date and times go up as typed. The server reads them as salon time.
      const result = await addTimeOffAction(stylistId, { day, allDay, from, to, reason });
      if (result.ok) {
        setDay("");
        setReason("");
        setError(null);
      } else setError(result.error);
    });
  }

  return (
    <form onSubmit={add} className="grid gap-4 border border-border bg-card p-4">
      <h3 className="font-semibold">Add a day off</h3>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="grid gap-1.5">
          <Label htmlFor="off-day" className="font-semibold">
            Date
          </Label>
          <Input
            id="off-day"
            type="date"
            className="figures w-44"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            required
          />
        </div>
        <label className="flex min-h-8 items-center gap-2 text-sm">
          <Switch checked={allDay} onCheckedChange={setAllDay} />
          All day
        </label>
      </div>

      {allDay ? null : (
        <div className="flex items-end gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor="off-from" className="font-semibold">
              From
            </Label>
            <Input
              id="off-from"
              type="time"
              className="figures w-32"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="off-to" className="font-semibold">
              To
            </Label>
            <Input
              id="off-to"
              type="time"
              className="figures w-32"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div className="grid max-w-sm gap-1.5">
        <Label htmlFor="off-reason" className="font-semibold">
          Reason <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="off-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Dentist, holiday, training"
          maxLength={120}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Adding" : "Add day off"}
        </Button>
      </div>
    </form>
  );
}
