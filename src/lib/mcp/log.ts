import "server-only";
import type { CallToolResult, ServerContext } from "@modelcontextprotocol/server";
import { db } from "@/lib/db";
import { mcpCallLog } from "@/lib/db/schema";
import { SCOPE_LABELS } from "@/lib/mcp-resource";
import { SalonError } from "@/lib/salon/errors";

// What a tool hands back: the data for the agent, and how many rows of the
// salon's data that was, for the call log.
export type ToolOutput = { data: unknown; rows?: number };

function text(value: string, isError = false): CallToolResult {
  return { content: [{ type: "text", text: value }], ...(isError ? { isError: true } : {}) };
}

/**
 * Every tool goes through this. It takes the owner's id from the verified
 * token and never from an argument, checks the scope this one tool needs, and
 * writes the call to mcp_call_log whether it worked or not, reads included.
 */
export function logged<A>(
  tool: string,
  scope: string,
  run: (args: A, userId: string) => Promise<ToolOutput>,
) {
  return async (args: A, ctx: ServerContext): Promise<CallToolResult> => {
    const authInfo = ctx.http?.authInfo;
    const userId = typeof authInfo?.extra?.userId === "string" ? authInfo.extra.userId : "";
    if (!userId) throw new Error("No owner on this token");

    const clientId = authInfo?.clientId || null;
    const startedAt = Date.now();
    // The arguments are stored as given. The call log is shown to the owner.
    const write = (row: { ok: boolean; rowCount?: number; error?: string }) =>
      db.insert(mcpCallLog).values({
        tool,
        userId,
        clientId,
        args: args ?? null,
        ok: row.ok,
        durationMs: Date.now() - startedAt,
        rowCount: row.rowCount ?? null,
        error: row.error ?? null,
      });

    // The route only checks that the connection may read. Whether it may
    // book and cancel is decided here, per tool.
    if (!authInfo?.scopes.includes(scope)) {
      const message = `The owner didn't allow this connection to: ${SCOPE_LABELS[scope] ?? scope}. They can connect again and allow it.`;
      await write({ ok: false, error: message });
      return text(message, true);
    }

    try {
      const { data, rows } = await run(args, userId);
      await write({ ok: true, rowCount: rows });
      return text(JSON.stringify(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await write({ ok: false, error: message });
      // A SalonError is written to be read ("That time isn't free any more"),
      // so the agent gets it as a result it can act on. Anything else is a fault.
      if (error instanceof SalonError) return text(message, true);
      throw error;
    }
  };
}
