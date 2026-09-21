"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { WEEKDAYS } from "@/lib/salon/time";
import { saveWeekAction } from "../actions";
import { clockText } from "../week";

type Row = { works: boolean; start: string; end: string };

export function WeeklyHours({
  stylistId,
  spans,
}: {
  stylistId: string;
  spans: { weekday: number; startMinute: number; endMinute: number }[];
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    WEEKDAYS.map((_, weekday) => {
      const span = spans.find((s) => s.weekday === weekday);
      // A day switched on for the first time starts at 9 to 5.
      return span
        ? { works: true, start: clockText(span.startMinute), end: clockText(span.endMinute) }
        : { works: false, start: "09:00", end: "17:00" };
    }),
  );
  const [note, setNote] = useState<{ error: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function change(weekday: number, patch: Partial<Row>) {
    setRows((now) => now.map((row, i) => (i === weekday ? { ...row, ...patch } : row)));
    setNote(null);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    const week = rows.flatMap((row, weekday) =>
      row.works ? [{ weekday, start: row.start, end: row.end }] : [],
    );
    startTransition(async () => {
      const result = await saveWeekAction(stylistId, week);
      setNote(
        result.ok ? { error: false, text: "Week saved." } : { error: true, text: result.error },
      );
    });
  }

  return (
    <form onSubmit={save}>
      <ul className="border-t border-border">
        {rows.map((row, weekday) => {
          const day = WEEKDAYS[weekday];
          return (
            <li
              key={day}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-border py-3 sm:grid-cols-[8rem_11rem_1fr]"
            >
              <span className="font-semibold">{day}</span>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={row.works}
                  onCheckedChange={(works) => change(weekday, { works })}
                />
                Works this day
              </label>
              {row.works ? (
                <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                  <Input
                    type="time"
                    aria-label={`${day} start`}
                    className="figures w-32"
                    value={row.start}
                    onChange={(e) => change(weekday, { start: e.target.value })}
                    required
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    aria-label={`${day} end`}
                    className="figures w-32"
                    value={row.end}
                    onChange={(e) => change(weekday, { end: e.target.value })}
                    required
                  />
                </div>
              ) : (
                <span className="col-span-2 text-sm text-muted-foreground sm:col-span-1">
                  Not working
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving" : "Save the week"}
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
