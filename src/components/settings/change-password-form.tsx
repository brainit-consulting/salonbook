"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { CONTROL_HEIGHT, Field, FormNote, type Note } from "./field";

const MIN_LENGTH = 8; // Better Auth's own minimum

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // On by default: changing a password usually means someone else might have it.
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword.length < MIN_LENGTH) {
      return setNote({
        kind: "problem",
        text: `The new password needs at least ${MIN_LENGTH} characters.`,
      });
    }

    setBusy(true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: signOutOthers,
    });
    setBusy(false);
    if (error) {
      return setNote({
        kind: "problem",
        text: error.message ?? "The password was not changed. Check the current one.",
      });
    }
    setCurrentPassword("");
    setNewPassword("");
    setNote({
      kind: "done",
      text: signOutOthers
        ? "Password changed. Every other device has been signed out."
        : "Password changed.",
    });
    // The devices list below is drawn on the server.
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field
        id="current-password"
        label="Current password"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      <Field
        id="new-password"
        label="New password"
        hint={`At least ${MIN_LENGTH} characters.`}
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        minLength={MIN_LENGTH}
        required
      />
      <div className="flex items-center gap-3 py-1">
        <Checkbox
          id="sign-out-others"
          checked={signOutOthers}
          onCheckedChange={(checked) => setSignOutOthers(checked === true)}
        />
        <Label htmlFor="sign-out-others" className="leading-snug">
          Sign out every other device
        </Label>
      </div>
      <FormNote note={note} />
      <div>
        <Button
          type="submit"
          className={CONTROL_HEIGHT}
          disabled={busy || !currentPassword || !newPassword}
        >
          {busy ? "Changing" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
