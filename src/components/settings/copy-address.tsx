"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CONTROL_HEIGHT } from "./field";

export function CopyAddress({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard on plain http from another machine. The text can be selected.
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <code className="figures min-w-0 flex-1 overflow-x-auto border bg-background px-3 py-2.5 whitespace-nowrap select-all">
        {value}
      </code>
      <Button
        type="button"
        variant="outline"
        className={CONTROL_HEIGHT}
        onClick={copy}
        aria-label={label}
      >
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </Button>
    </div>
  );
}
