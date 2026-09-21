"use client";

import { useActionState } from "react";
import { cn } from "cn";
import { bookAppointment, type BookState } from "@/app/book/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bigButton } from "./links";

const input = "h-11 bg-card md:text-base";

export function DetailsForm(props: { service: string; stylist: string; time: string }) {
  const [state, action, pending] = useActionState<BookState, FormData>(bookAppointment, {});

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="service" value={props.service} />
      <input type="hidden" name="stylist" value={props.stylist} />
      <input type="hidden" name="time" value={props.time} />

      <div className="space-y-2">
        <Label htmlFor="name" className="font-semibold">
          Your name
        </Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          defaultValue={state.values?.name}
          className={input}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone" className="font-semibold">
          Phone
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          defaultValue={state.values?.phone}
          className={cn(input, "figures")}
        />
        <p className="text-sm text-muted-foreground">
          So the salon can ring you if something changes.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="font-semibold">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
          className={input}
        />
        <p className="text-sm text-muted-foreground">
          Your confirmation goes here, with a link to cancel.
        </p>
      </div>

      {state.error ? (
        <p role="alert" className="border-l-[3px] border-destructive pl-3 text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className={cn(bigButton, "w-full sm:w-auto")}>
        {pending ? "Booking…" : "Book this time"}
      </Button>
    </form>
  );
}
