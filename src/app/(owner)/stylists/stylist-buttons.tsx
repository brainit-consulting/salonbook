"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { setStylistActiveAction } from "./actions";

export function RemoveStylistButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await setStylistActiveAction(id, false);
      if (result.ok) router.push("/stylists");
      else setError(result.error);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Remove {name}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="text-xl">Remove {name}?</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Clients will no longer be able to book {name}. Bookings already made with them stay in
            the diary, so cancel or move any that won&apos;t be kept. You can restore them from the
            stylists page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Keep them</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={remove} disabled={pending}>
            {pending ? "Removing" : "Remove stylist"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RestoreStylistButton({ id }: { id: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function restore() {
    startTransition(async () => {
      const result = await setStylistActiveAction(id, true);
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
