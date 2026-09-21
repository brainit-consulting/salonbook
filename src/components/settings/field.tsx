"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

// Tall enough for a thumb on a phone, tighter on a desk screen.
export const CONTROL_HEIGHT = "h-11 px-4 md:h-9";

export function Field({
  label,
  hint,
  className,
  id,
  ...props
}: React.ComponentProps<"input"> & { label: string; hint?: string; id: string }) {
  return (
    <div className="grid max-w-md gap-2">
      <Label htmlFor={id} className="font-semibold">
        {label}
      </Label>
      <Input
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn("h-11 bg-background md:h-9", className)}
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type Note = { kind: "done" | "problem"; text: string } | null;

/** The line under a form that says what happened. Words, not colour alone. */
export function FormNote({ note }: { note: Note }) {
  if (!note) return null;
  return (
    <p
      role={note.kind === "problem" ? "alert" : "status"}
      className={cn(
        "max-w-[62ch] border-l-[3px] pl-3 text-sm",
        note.kind === "problem" ? "border-destructive text-destructive" : "border-primary",
      )}
    >
      {note.text}
    </p>
  );
}
