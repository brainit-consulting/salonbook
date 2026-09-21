"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireOwnerAction } from "@/lib/auth-guards";
import { logActivity } from "@/lib/activity";
import type { SettingsResult } from "@/components/settings/result";

export async function revokeConnectionAction(consentId: string): Promise<SettingsResult> {
  const session = await requireOwnerAction();
  const requestHeaders = await headers();

  // Better Auth checks the consent belongs to the signed-in owner.
  let clientId: string;
  try {
    const consent = await auth.api.getOAuthConsent({
      query: { id: consentId },
      headers: requestHeaders,
    });
    clientId = consent.clientId;
  } catch {
    return { ok: false, error: "That connection is already gone." };
  }

  await auth.api.deleteOAuthConsent({ body: { id: consentId }, headers: requestHeaders });

  // delete-consent removes the consent row and nothing else (read in
  // @better-auth/oauth-provider 1.7.5): the app's refresh token would go on
  // fetching new access tokens. The package's /oauth2/revoke needs the app's own
  // credentials and the token itself, which the owner never has. So do what its
  // internal invalidateRefreshFamily does, through Better Auth's own adapter.
  // A signed access token already handed out cannot be recalled: it is checked
  // without the database and runs out by itself, within an hour.
  const { adapter } = await auth.$context;
  const mine = [
    { field: "clientId", value: clientId },
    { field: "userId", value: session.user.id },
  ];
  await adapter.deleteMany({ model: "oauthAccessToken", where: mine });
  await adapter.deleteMany({ model: "oauthRefreshToken", where: mine });

  await logActivity("connection.revoked", { clientId }, session.user.id);
  revalidatePath("/settings/connections");
  return { ok: true };
}
