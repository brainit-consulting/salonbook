"use client";

import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { setServiceActiveAction } from "./actions";

export function RemoveServiceButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await setServiceActiveAction(id, false);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>Remove</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="text-xl">Remove {name}?</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Clients will no longer see it when they book. Past bookings keep it, and so do any
            already in the diary. You can restore it from this page at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={remove} disabled={pending}>
            {pending ? "Removing" : "Remove service"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RestoreServiceButton({ id }: { id: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function restore() {
    startTransition(async () => {
      const result = await setServiceActiveAction(id, true);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <span className="inline-flex items-center gap-3">
      {error ? (
        <span role="alert" className="text-sm text-destructive">
          {error}
        </span>
      ) : null}
      <Button variant="outline" size="sm" onClick={restore} disabled={pending}>
        {pending ? "Restoring" : "Restore"}
      </Button>
    </span>
  );
}
