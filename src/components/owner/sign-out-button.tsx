"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function leave() {
    setLeaving(true);
    await signOut();
    router.push("/");
    // The owner layout is cached on the client; this drops it.
    router.refresh();
  }

  return (
    <button type="button" onClick={leave} disabled={leaving} className={className}>
      {leaving ? "Signing out" : "Sign out"}
    </button>
  );
}
