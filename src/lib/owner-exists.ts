import "server-only";
import { count } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

// One salon, one owner: any row in the user table means sign-up is closed.
// This only decides what the pages show. The rule itself is enforced by the
// user.create.before hook in src/lib/auth.ts.
export async function ownerExists(): Promise<boolean> {
  const [row] = await db.select({ n: count() }).from(user);
  return row.n > 0;
}
