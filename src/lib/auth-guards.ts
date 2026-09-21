import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// The session is the only source of who is signed in. Every owner page, every
// server action and every data function behind them calls requireOwner().
// A layout check alone is not enough: layouts do not re-run on client navigation.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** For pages: sends a signed-out visitor to sign-in. */
export async function requireOwner() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/");
  return session;
}

/** For server actions: throws instead of redirecting. */
export async function requireOwnerAction() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") throw new Error("Not signed in as the owner.");
  return session;
}
