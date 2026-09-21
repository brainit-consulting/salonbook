import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { oauthConsent, user } from "@/lib/db/schema";

/**
 * A token is a signed note that stays valid for up to an hour, whatever
 * happens in the meantime. So a valid token alone is not enough: on every
 * call, check that the owner account still exists and that the owner has not
 * revoked this connection. This is what makes Revoke stop the next call.
 */
export async function connectionStillAllowed(userId: string, clientId: string): Promise<boolean> {
  if (!userId || !clientId) return false;
  const [row] = await db
    .select({ id: oauthConsent.id })
    .from(oauthConsent)
    .innerJoin(user, eq(oauthConsent.userId, user.id))
    .where(
      and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId), eq(user.role, "admin")),
    )
    .limit(1);
  return Boolean(row);
}
