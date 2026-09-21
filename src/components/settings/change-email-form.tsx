"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { CONTROL_HEIGHT, Field, FormNote, type Note } from "./field";

export function ChangeEmailForm({ email, mailed }: { email: string; mailed: boolean }) {
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const wanted = newEmail.trim().toLowerCase();
    if (wanted === email.toLowerCase()) {
      return setNote({ kind: "problem", text: "That is already the address on the account." });
    }

    setBusy(true);
    const { error } = await authClient.changeEmail({
      newEmail: wanted,
      callbackURL: "/settings/account",
    });
    setBusy(false);
    if (error) {
      return setNote({ kind: "problem", text: error.message ?? "The address was not changed." });
    }
    // Never "changed": nothing changes until the link is opened.
    setNote({
      kind: "done",
      text: mailed
        ? `A link has gone to ${wanted}. The address changes when that link is opened.`
        : "A link has been written to the System page under Emails. The address changes when that link is opened.",
    });
    setNewEmail("");
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field
        id="new-email"
        label="New email address"
        type="email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <FormNote note={note} />
      <div>
        <Button
          type="submit"
          variant="outline"
          className={CONTROL_HEIGHT}
          disabled={busy || !newEmail.trim()}
        >
          {busy ? "Writing the link" : "Change email"}
        </Button>
      </div>
    </form>
  );
}
