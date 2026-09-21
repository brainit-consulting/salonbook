"use client";

import { useActionState } from "react";
import { AlertDialog as Primitive } from "@base-ui/react/alert-dialog";
import { cn } from "cn";
import { cancelMyBooking, type CancelState } from "@/app/booking/[token]/actions";
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
import { bigButton } from "./links";

export function CancelBooking({ token, when }: { token: string; when: string }) {
  const [state, action, pending] = useActionState<CancelState, FormData>(cancelMyBooking, {});

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive" className={cn(bigButton, "w-full sm:w-auto")} />}
      >
        Cancel this booking
      </AlertDialogTrigger>
      {/* Built from the parts rather than AlertDialogContent, which blurs the
          page behind it and centres its text. DESIGN.md allows neither. */}
      <AlertDialogPortal>
        <AlertDialogOverlay className="bg-foreground/30 supports-backdrop-filter:backdrop-blur-none" />
        <Primitive.Popup className="fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-popover p-5 text-popover-foreground outline-none">
          <AlertDialogTitle className="text-2xl font-normal">Cancel this booking?</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Your time on {when} goes back on offer for someone else. This can&apos;t be undone, but
            you can book again.
          </AlertDialogDescription>
          {state.error ? (
            <p role="alert" className="border-l-[3px] border-destructive pl-3 text-destructive">
              {state.error}
            </p>
          ) : null}
          <form action={action} className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <input type="hidden" name="token" value={token} />
            <AlertDialogCancel className={bigButton}>Keep it</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending} className={bigButton}>
              {pending ? "Cancelling…" : "Yes, cancel it"}
            </Button>
          </form>
        </Primitive.Popup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
