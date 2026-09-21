"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { CONTROL_HEIGHT, Field, FormNote, type Note } from "./field";

export function DeleteAccount({ email, mailed }: { email: string; mailed: boolean }) {
  const [typedEmail, setTypedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  // Typing the address is harder to do by reflex than typing DELETE, and it
  // restates whose account this is.
  const matches = typedEmail.trim().toLowerCase() === email.toLowerCase();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!matches || !password) return;

    setBusy(true);
    const { error } = await authClient.deleteUser({ password, callbackURL: "/goodbye" });
    setBusy(false);
    if (error) {
      return setNote({
        kind: "problem",
        text: error.message ?? "Nothing was deleted. Check the password and try again.",
      });
    }
    setPassword("");
    setNote({
      kind: "done",
      text: mailed
        ? `Nothing is deleted yet. A confirmation link has gone to ${email}. Opening it deletes the account. The link works for one hour.`
        : "Nothing is deleted yet. A confirmation link has been written to the System page under Emails, and to the server terminal. Opening it deletes the account. The link works for one hour.",
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field
        id="delete-email"
        label="Type the account's email address"
        hint={email}
        type="email"
        value={typedEmail}
        onChange={(e) => setTypedEmail(e.target.value)}
        autoComplete="off"
        required
      />
      <Field
        id="delete-password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      <FormNote note={note} />
      <div>
        <Button
          type="submit"
          variant="destructive"
          className={CONTROL_HEIGHT}
          disabled={busy || !matches || !password}
        >
          {busy ? "Writing the link" : "Delete the owner account"}
        </Button>
      </div>
    </form>
  );
}
