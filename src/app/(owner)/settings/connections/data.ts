import "server-only";
import { and, desc, eq, inArray, max } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mcpCallLog } from "@/lib/db/schema";

export type Connection = {
  consentId: string;
  clientId: string;
  /** Null when the app registered without a name, or has since been removed. */
  name: string | null;
  scopes: string[];
  grantedAt: Date;
  lastUsedAt: Date | null;
};

/** Every app the owner has approved, newest first. Consents come from Better Auth. */
export async function listConnections(ownerId: string): Promise<Connection[]> {
  const requestHeaders = await headers();
  const consents = await auth.api.getOAuthConsents({ headers: requestHeaders });
  if (!consents.length) return [];

  const clientIds = [...new Set(consents.map((c) => c.clientId))];
  const [names, lastUsed] = await Promise.all([
    Promise.all(
      clientIds.map(async (clientId) => {
        try {
          const client = await auth.api.getOAuthClientPublic({
            query: { client_id: clientId },
            headers: requestHeaders,
          });
          return [clientId, client.client_name?.trim() || null] as const;
        } catch {
          return [clientId, null] as const; // removed or switched off
        }
      }),
    ),
    db
      .select({ clientId: mcpCallLog.clientId, at: max(mcpCallLog.createdAt) })
      .from(mcpCallLog)
      .where(and(eq(mcpCallLog.userId, ownerId), inArray(mcpCallLog.clientId, clientIds)))
      .groupBy(mcpCallLog.clientId),
  ]);

  const nameOf = new Map(names);
  const usedAt = new Map(lastUsed.map((row) => [row.clientId, row.at]));
  return consents
    .map((c) => ({
      consentId: c.id,
      clientId: c.clientId,
      name: nameOf.get(c.clientId) ?? null,
      scopes: c.scopes,
      grantedAt: new Date(c.createdAt),
      lastUsedAt: usedAt.get(c.clientId) ?? null,
    }))
    .sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime());
}

/** The last few things agents did as the owner. The full log is on the System page. */
export async function listRecentAgentCalls(ownerId: string, limit = 20) {
  return db
    .select({
      id: mcpCallLog.id,
      tool: mcpCallLog.tool,
      ok: mcpCallLog.ok,
      createdAt: mcpCallLog.createdAt,
    })
    .from(mcpCallLog)
    .where(eq(mcpCallLog.userId, ownerId))
    .orderBy(desc(mcpCallLog.createdAt))
    .limit(limit);
}
