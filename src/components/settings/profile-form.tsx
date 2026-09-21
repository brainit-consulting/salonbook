"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { CONTROL_HEIGHT, Field, FormNote, type Note } from "./field";

export function ProfileForm({ name: savedName }: { name: string }) {
  const router = useRouter();
  const [name, setName] = useState(savedName);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setNote({ kind: "problem", text: "Type a name first." });

    setBusy(true);
    const { error } = await authClient.updateUser({ name: trimmed });
    setBusy(false);
    if (error) {
      return setNote({ kind: "problem", text: error.message ?? "The name was not saved." });
    }
    setNote({ kind: "done", text: "Saved." });
    // The header is drawn on the server, so ask for it again.
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <Field
        id="owner-name"
        label="Your name"
        hint="Shown at the top of the owner pages and used in emails to you."
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
        maxLength={80}
        required
      />
      <FormNote note={note} />
      <div>
        <Button type="submit" className={CONTROL_HEIGHT} disabled={busy || name.trim() === savedName}>
          {busy ? "Saving" : "Save name"}
        </Button>
      </div>
    </form>
  );
}
