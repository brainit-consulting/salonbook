"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "../_components/field";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setPending(true);

    // When an AI agent sent the owner here, the URL carries the signed OAuth
    // query. The oauthProviderClient plugin on authClient copies it into this
    // request as oauth_query, and the server answers { redirect: true, url }
    // instead of the usual sign-in body. Better Auth's client follows that url
    // by itself, so the only job here is to stay out of its way.
    const { data, error } = await signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    if (error) {
      setError(error.message ?? "Could not sign in. Try again.");
      setPending(false);
      return;
    }
    // Leave the button disabled: the browser is already on its way to the
    // consent screen or back to the agent.
    if (data?.redirect && data.url) return;

    router.push("/diary");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field name="email" label="Email" type="email" autoComplete="email" required />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
      />
      <FormError message={error} />
      <Button type="submit" disabled={pending} className="h-11 px-5 font-semibold">
        {pending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
