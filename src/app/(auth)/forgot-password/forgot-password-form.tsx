"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "../_components/field";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setPending(true);

    const { error } = await authClient.requestPasswordReset({
      email: String(form.get("email") ?? ""),
      redirectTo: "/reset-password",
    });

    setPending(false);
    if (error) {
      setError(error.message ?? "Could not ask for a reset link. Try again.");
      return;
    }
    setSent(true);
  }

  // Same words whether or not the address has an account.
  if (sent) {
    return (
      <div className="space-y-4">
        <p>If that address belongs to the owner, a reset link has been made.</p>
        <p className="text-sm text-muted-foreground">
          This demo does not send mail. The link is printed in the server terminal. If you are
          still signed in on another device, it is also on the System page under Emails.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field name="email" label="Email" type="email" autoComplete="email" required />
      <FormError message={error} />
      <Button type="submit" disabled={pending} className="h-11 px-5 font-semibold">
        {pending ? "Asking" : "Get a reset link"}
      </Button>
    </form>
  );
}
