"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "../_components/field";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setPending(true);

    // If someone else set up the owner while this form was open, the server
    // refuses and its message ("Sign-up is closed.") is shown as is.
    const { error } = await signUp.email({
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    if (error) {
      setError(error.message ?? "Could not set up the account. Try again.");
      setPending(false);
      return;
    }
    router.push("/diary");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field name="name" label="Your name" autoComplete="name" required />
      <Field name="email" label="Email" type="email" autoComplete="email" required />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="At least 8 characters."
        required
      />
      <FormError message={error} />
      <Button type="submit" disabled={pending} className="h-11 px-5 font-semibold">
        {pending ? "Setting up" : "Set up the owner account"}
      </Button>
    </form>
  );
}
