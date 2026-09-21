"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

// Two buttons of the same weight, both outline. Allowing is not the
// highlighted choice: the owner should read, not follow the colour.
export function ConsentButtons() {
  const [pending, setPending] = useState<"allow" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function answer(accept: boolean) {
    setError(null);
    setPending(accept ? "allow" : "deny");
    // oauthProviderClient adds this page's signed query to the request, so the
    // server knows which app the answer is for. Nothing about it is sent from here.
    const { data, error } = await authClient.oauth2.consent({ accept });
    if (error) {
      setError(
        error.message ?? "That didn't go through. Go back to the app and start connecting again.",
      );
      setPending(null);
      return;
    }
    // Either answer ends with the browser going back to the app that asked.
    const next = (data as { url?: string; redirect_uri?: string } | null) ?? {};
    const url = next.url ?? next.redirect_uri;
    if (url) window.location.assign(url);
  }

  const style = "h-11 flex-1 px-5 font-semibold sm:flex-none sm:min-w-36";

  return (
    <div className="border-t border-border pt-5">
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className={style}
          disabled={pending !== null}
          onClick={() => answer(true)}
        >
          {pending === "allow" ? "Allowing" : "Allow"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className={style}
          disabled={pending !== null}
          onClick={() => answer(false)}
        >
          {pending === "deny" ? "Sending it back" : "Don't allow"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
