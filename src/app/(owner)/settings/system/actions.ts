"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { requireOwnerAction } from "@/lib/auth-guards";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import { getEmail } from "@/lib/system-status";

// Sends a failed email again from the html saved in email_log. sendEmail()
// needs the React template, which a saved row no longer has, so this posts the
// stored message as it is. The page only offers it when RESEND_API_KEY is set.
export async function sendEmailAgain(formData: FormData) {
  const session = await requireOwnerAction();

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email sending is not set up. Set RESEND_API_KEY first.");

  const row = await getEmail(String(formData.get("emailId") ?? ""));
  if (!row) throw new Error("That email doesn't exist.");
  if (row.status !== "failed" || !row.html) {
    throw new Error("Only a failed email can be sent again.");
  }

  const from = process.env.EMAIL_FROM ?? "Pepper Tree Hair <onboarding@resend.dev>";
  let outcome: { status: "sent"; providerId: string } | { status: "failed"; error: string };
  try {
    const { data, error } = await new Resend(apiKey).emails.send({
      from,
      to: row.to,
      subject: row.subject,
      html: row.html,
      text: row.text ?? undefined,
    });
    outcome = error
      ? { status: "failed", error: error.message }
      : { status: "sent", providerId: data.id };
  } catch (err) {
    outcome = { status: "failed", error: err instanceof Error ? err.message : String(err) };
  }

  await db
    .update(emailLog)
    .set(
      outcome.status === "sent"
        ? { status: "sent", providerId: outcome.providerId, error: null, updatedAt: new Date() }
        : { status: "failed", error: outcome.error, updatedAt: new Date() },
    )
    .where(eq(emailLog.id, row.id));

  if (outcome.status === "sent") {
    await logActivity(
      "email.sent_again",
      { emailId: row.id, subject: row.subject, via: "owner" },
      session.user.id,
    );
  }
  revalidatePath("/settings/system");
}
