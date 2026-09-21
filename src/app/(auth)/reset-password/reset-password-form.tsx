"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "../_components/field";

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setPending(true);

    const { error } = await authClient.resetPassword({
      newPassword: String(form.get("password") ?? ""),
      token,
    });

    setPending(false);
    if (error) {
      setError(error.message ?? "Could not change the password. Ask for a new link.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p>Your password has been changed.</p>
        <p>
          <Link href="/sign-in" className="text-primary underline underline-offset-4">
            Sign in with the new password
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="At least 8 characters."
        required
      />
      <FormError message={error} />
      <Button type="submit" disabled={pending} className="h-11 px-5 font-semibold">
        {pending ? "Saving" : "Save the new password"}
      </Button>
    </form>
  );
}
