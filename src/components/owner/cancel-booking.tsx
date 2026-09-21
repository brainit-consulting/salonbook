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

// The popup is put together here rather than with AlertDialogContent, because
// the stock one blurs the page behind it and centres its text. DESIGN.md
// allows neither.
export function CancelBooking({
  summary,
  cancel,
}: {
  summary: string;
  cancel: () => Promise<{ error: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function confirm() {
    setError(null);
    start(async () => {
      // On success the action redirects to the diary and never returns.
      const result = await cancel();
      if (result?.error) {
        setError(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={
            <Button
              variant="outline"
              size="lg"
              className="border-destructive font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
            />
          }
        >
          Cancel this booking
        </AlertDialogTrigger>
        <AlertDialogPortal>
          <AlertDialogOverlay className="bg-foreground/30 supports-backdrop-filter:backdrop-blur-none" />
          <Primitive.Popup className="fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-3 rounded-sm border bg-popover p-4 text-left text-popover-foreground outline-none">
            <AlertDialogTitle className="text-xl font-normal">Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-pretty">
              {summary} The time goes back on the booking site and the client is told by email.
              This can&apos;t be undone.
            </AlertDialogDescription>
            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialogCancel size="lg" disabled={pending}>
                Keep it
              </AlertDialogCancel>
              <Button
                size="lg"
                onClick={confirm}
                disabled={pending}
                className="bg-destructive font-semibold text-primary-foreground hover:bg-destructive/85"
              >
                {pending ? "Cancelling" : "Cancel the booking"}
              </Button>
            </div>
          </Primitive.Popup>
        </AlertDialogPortal>
      </AlertDialog>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
