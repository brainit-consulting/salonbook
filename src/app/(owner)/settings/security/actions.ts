"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireOwnerAction } from "@/lib/auth-guards";
import type { SettingsResult } from "@/components/settings/result";

// The page never hands session tokens to the browser. The button sends the
// row's id, and the token is looked up here among the owner's own sessions,
// so an id from anywhere else finds nothing.
export async function revokeDeviceAction(sessionId: string): Promise<SettingsResult> {
  const current = await requireOwnerAction();
  if (sessionId === current.session.id) {
    return { ok: false, error: "That is this device. Use Sign out instead." };
  }

  const requestHeaders = await headers();
  const sessions = await auth.api.listSessions({ headers: requestHeaders });
  const target = sessions.find((s) => s.id === sessionId);
  if (!target) return { ok: false, error: "That device is already signed out." };

  await auth.api.revokeSession({ body: { token: target.token }, headers: requestHeaders });
  revalidatePath("/settings/security");
  return { ok: true };
}

export async function signOutEverywhereElseAction(): Promise<SettingsResult> {
  await requireOwnerAction();
  await auth.api.revokeOtherSessions({ headers: await headers() });
  revalidatePath("/settings/security");
  return { ok: true };
}
