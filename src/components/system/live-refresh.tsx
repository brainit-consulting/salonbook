"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";

const EVERY_MS = 3000;

/** Re-reads the System page every 3 seconds while the switch is on. */
export function LiveRefresh() {
  const router = useRouter();
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      // A hidden tab has nobody watching it.
      if (document.visibilityState === "visible") router.refresh();
    }, EVERY_MS);
    return () => clearInterval(timer);
  }, [live, router]);

  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
      <Switch checked={live} onCheckedChange={setLive} />
      <span>Live</span>
      <span className="font-normal text-muted-foreground">
        {live ? "checking every 3 seconds" : "paused"}
      </span>
    </label>
  );
}
