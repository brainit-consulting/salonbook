import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

// The salon's own record of what changed: booking.made, service.edited …
// Writes only, never reads. No passwords, tokens or whole payloads in detail.
export async function logActivity(action: string, detail?: unknown, userId?: string | null) {
  await db.insert(activityLog).values({ action, detail, userId: userId ?? null });
}
