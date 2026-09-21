"use client";

import { Fragment, useState } from "react";
import { cn } from "cn";
import type { AgentCall } from "@/lib/system-status";

const COLUMNS = 7;

/**
 * The body of the agent call table. Rows that were there when the page opened
 * never animate; a row that arrives on a later refresh fades in over 200ms.
 */
export function AgentCallRows({ calls }: { calls: AgentCall[] }) {
  const [hereAtOpen] = useState(() => new Set(calls.map((c) => c.id)));
  const [open, setOpen] = useState<string | null>(null);

  return (
    <tbody>
      {calls.map((call) => {
        const isOpen = open === call.id;
        return (
          <Fragment key={call.id}>
            <tr
              className={cn(
                "border-b border-border align-top",
                !hereAtOpen.has(call.id) &&
                  "transition-opacity duration-200 motion-reduce:transition-none starting:opacity-0",
              )}
            >
              <td className="py-2 pr-4 whitespace-nowrap" title={call.day}>
                {call.time}
              </td>
              <td className="py-2 pr-4 font-semibold whitespace-nowrap">{call.tool}</td>
              <td className="py-2 pr-4">
                {call.args ? (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    title={call.argsFull}
                    onClick={() => setOpen(isOpen ? null : call.id)}
                    className="cursor-pointer text-left break-all underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {call.args}
                  </button>
                ) : (
                  <span className="text-muted-foreground">none</span>
                )}
              </td>
              <td className="py-2 pr-4 text-right whitespace-nowrap">{call.rowCount ?? "-"}</td>
              <td className="py-2 pr-4 text-right whitespace-nowrap">
                {call.durationMs == null ? "-" : `${call.durationMs} ms`}
              </td>
              <td className="py-2 pr-4">
                {call.ok ? "Worked" : `Failed: ${call.error ?? "no reason given"}`}
              </td>
              <td className="py-2 break-all text-muted-foreground">{call.client}</td>
            </tr>
            {isOpen && (
              <tr className="border-b border-border bg-muted">
                <td colSpan={COLUMNS} className="p-3">
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all">
                    {call.argsFull}
                  </pre>
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
    </tbody>
  );
}
