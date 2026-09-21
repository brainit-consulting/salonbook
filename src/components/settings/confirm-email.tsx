"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { CONTROL_HEIGHT, FormNote, type Note } from "./field";

const COOLDOWN_SECONDS = 60;

// Only rendered while the address is not confirmed: the endpoint answers an
// already-confirmed address with an error, and that would read as a fault.
export function ConfirmEmail({ email, mailed }: { email: string; mailed: boolean }) {
  const [cooldown, setCooldown] = useState(0);
  const [note, setNote] = useState<Note>(null);

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function write() {
    // Start counting before the answer comes back so a double tap does nothing.
    setCooldown(COOLDOWN_SECONDS);
    await authClient.sendVerificationEmail(
      { email, callbackURL: "/settings/account" },
      {
        onSuccess: () =>
          setNote({
            kind: "done",
            text: mailed
              ? `A new link is on its way to ${email}.`
              : "A new link has been written. It is on the System page under Emails.",
          }),
        onError: (ctx) => {
          const retry = Number(ctx.response?.headers.get("X-Retry-After"));
          setCooldown(retry || COOLDOWN_SECONDS);
          setNote({ kind: "problem", text: "That did not work. Wait a minute and try again." });
        },
      },
    );
  }

  return (
    <div className="grid gap-3">
      <div>
        <Button
          type="button"
          variant="outline"
          className={CONTROL_HEIGHT}
          disabled={cooldown > 0}
          onClick={write}
        >
          {cooldown > 0 ? (
            <>
              Write another in <span className="figures">{cooldown}s</span>
            </>
          ) : (
            "Write me a new confirmation link"
          )}
        </Button>
      </div>
      <FormNote note={note} />
    </div>
  );
}
