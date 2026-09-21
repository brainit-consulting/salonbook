"use client";

import { useState, useTransition } from "react";
import { AlertDialog as Primitive } from "@base-ui/react/alert-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { revokeConnectionAction } from "@/app/(owner)/settings/connections/actions";
import { CONTROL_HEIGHT, FormNote, type Note } from "./field";

export function RevokeConnection({ consentId, name }: { consentId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<Note>(null);

  function revoke() {
    startTransition(async () => {
      const result = await revokeConnectionAction(consentId);
      if (result.ok) setOpen(false);
      else setNote({ kind: "problem", text: result.error });
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" className={CONTROL_HEIGHT} />}>
        Revoke
      </AlertDialogTrigger>
      {/* The stock content blurs the page behind it and centres its text on a
          phone. DESIGN.md allows neither, so the sheet is laid out here. */}
      <AlertDialogPortal>
        <AlertDialogOverlay className="bg-foreground/30 supports-backdrop-filter:backdrop-blur-none" />
        <Primitive.Popup className="fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 border bg-popover p-5 text-popover-foreground outline-none">
          <AlertDialogTitle className="font-display text-2xl font-normal">
            Revoke {name}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-pretty">
            It can no longer renew its access to the salon, and it has to ask you again before
            it can come back. A pass it already holds can keep working for up to an hour. Nothing
            it booked or cancelled is undone.
          </AlertDialogDescription>
          <FormNote note={note} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className={CONTROL_HEIGHT}>Keep it connected</AlertDialogCancel>
            <Button
              variant="destructive"
              className={CONTROL_HEIGHT}
              disabled={pending}
              onClick={revoke}
            >
              {pending ? "Revoking" : "Revoke"}
            </Button>
          </div>
        </Primitive.Popup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
