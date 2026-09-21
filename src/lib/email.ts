import type { ReactElement } from "react";
import { Resend } from "resend";
import { render, toPlainText } from "react-email";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";

// The only file that talks to Resend. With no key, nothing is sent: the
// message is rendered, saved to email_log and shown on the system page.
const apiKey = process.env.RESEND_API_KEY;
export const emailConfigured = Boolean(apiKey);

const resend = apiKey ? new Resend(apiKey) : null;
const from = process.env.EMAIL_FROM ?? "Pepper Tree Hair <onboarding@resend.dev>";

type SendArgs = {
  to: string;
  subject: string;
  react: ReactElement;
  template: string;
};

export async function sendEmail({ to, subject, react, template }: SendArgs) {
  const html = await render(react);
  const text = toPlainText(html);

  const [row] = await db
    .insert(emailLog)
    .values({ to, subject, template, status: "pending", html, text })
    .returning({ id: emailLog.id });

  if (!resend) {
    console.info(
      `\n[email] ${subject}\n[email] to: ${to}\n[email] not sent, RESEND_API_KEY is empty. Saved as ${row.id}.\n`,
    );
    await db
      .update(emailLog)
      .set({ status: "logged", updatedAt: new Date() })
      .where(eq(emailLog.id, row.id));
    return { id: row.id };
  }

  try {
    const { data, error } = await resend.emails.send(
      { from, to, subject, html, text },
      { idempotencyKey: `${template}/${row.id}` },
    );
    await db
      .update(emailLog)
      .set(
        error
          ? { status: "failed", error: error.message, updatedAt: new Date() }
          : { status: "sent", providerId: data.id, updatedAt: new Date() },
      )
      .where(eq(emailLog.id, row.id));
  } catch (err) {
    await db
      .update(emailLog)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        updatedAt: new Date(),
      })
      .where(eq(emailLog.id, row.id));
  }

  return { id: row.id };
}
