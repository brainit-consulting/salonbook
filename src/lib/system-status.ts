import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLog, emailLog, mcpCallLog, oauthClient, user } from "@/lib/db/schema";
import { MCP_RESOURCE } from "@/lib/mcp-resource";
import { siteUrl } from "@/lib/site";
import { listStylists } from "@/lib/salon/catalog";
import { salon } from "@/lib/salon/config";
import { formatDay, formatTime } from "@/lib/salon/time";

// What the System page reads. Callers are owner pages and actions that have
// already called requireOwner() themselves.
//
// Hard rule: nothing here returns the value of an environment variable, or
// part of one. Only Boolean(process.env.X), plus the two public addresses
// that lib/site.ts and lib/mcp-resource.ts already publish.

export type Check = {
  id: string;
  name: string;
  ready: boolean;
  /** What the owner reads beside "Ready" or "Not set up yet". */
  note: string;
  /** The NAME of the variable to set, never its value. */
  variable?: string;
  /** A public address worth showing in full. */
  address?: string;
  /** True when "not ready" is an ordinary way to run, not something to fix. */
  optional?: boolean;
};

export async function getSystemChecks(): Promise<Check[]> {
  let database = false;
  try {
    await db.execute(sql`select 1`);
    database = true;
  } catch {
    database = false;
  }

  const emailReady = Boolean(process.env.RESEND_API_KEY);
  const noticesSet = Boolean(process.env.OWNER_NOTIFY_EMAIL);
  const authUrlSet = Boolean(process.env.BETTER_AUTH_URL);
  const publicSet = Boolean(process.env.APP_URL ?? process.env.BETTER_AUTH_URL);
  const secretSet = Boolean(process.env.BETTER_AUTH_SECRET);

  return [
    {
      id: "database",
      name: "Database",
      ready: database,
      note: database
        ? "The salon's bookings, services and stylists can be read and saved."
        : "The app could not reach the database just now.",
      variable: "DATABASE_URL",
    },
    {
      id: "email",
      name: "Email sending",
      ready: emailReady,
      optional: true,
      note: emailReady
        ? "Confirmations and cancellations are sent to clients."
        : "Not sending. Emails are written and saved below.",
      variable: "RESEND_API_KEY",
    },
    {
      id: "notices",
      name: "Owner notices",
      ready: true,
      note: noticesSet
        ? "New bookings and cancellations go to the address in OWNER_NOTIFY_EMAIL."
        : "New bookings and cancellations go to the owner's sign-in address. Set OWNER_NOTIFY_EMAIL to send them somewhere else.",
      variable: "OWNER_NOTIFY_EMAIL",
    },
    {
      id: "agents",
      name: "Agent access",
      ready: authUrlSet,
      note: authUrlSet
        ? "An AI agent such as Claude connects to the salon at this address."
        : "Agents can only connect on this computer until the salon's public address is set.",
      variable: "BETTER_AUTH_URL",
      address: MCP_RESOURCE,
    },
    {
      id: "address",
      name: "Public address",
      ready: publicSet,
      note: publicSet
        ? "Links in emails and the cancel link point here."
        : "Links in emails point at this computer until the salon's public address is set.",
      variable: "APP_URL",
      address: siteUrl,
    },
    {
      id: "secret",
      name: "Sign-in secret",
      ready: secretSet,
      note: secretSet
        ? "The owner's sign-in is protected by a secret only the server knows."
        : "Set a long random value before the salon goes online.",
      variable: "BETTER_AUTH_SECRET",
    },
  ];
}

/** Salon time with seconds, so the room can match a row to the moment it was asked. */
export function formatClock(instant: Date): string {
  return new Intl.DateTimeFormat(salon.locale, {
    timeZone: salon.timezone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(instant);
}

export function formatWhen(instant: Date): string {
  return `${formatDay(instant, "short")}, ${formatTime(instant)}`;
}

const ARGS_LIMIT = 120;

// Plain strings only: these rows cross into a client component.
export type AgentCall = {
  id: string;
  time: string;
  day: string;
  tool: string;
  args: string;
  argsFull: string;
  rowCount: number | null;
  durationMs: number | null;
  ok: boolean;
  error: string | null;
  client: string;
};

export async function listAgentCalls(limit = 100): Promise<AgentCall[]> {
  const rows = await db
    .select({
      id: mcpCallLog.id,
      tool: mcpCallLog.tool,
      args: mcpCallLog.args,
      ok: mcpCallLog.ok,
      durationMs: mcpCallLog.durationMs,
      rowCount: mcpCallLog.rowCount,
      error: mcpCallLog.error,
      clientId: mcpCallLog.clientId,
      clientName: oauthClient.name,
      createdAt: mcpCallLog.createdAt,
    })
    .from(mcpCallLog)
    .leftJoin(oauthClient, eq(oauthClient.clientId, mcpCallLog.clientId))
    .orderBy(desc(mcpCallLog.createdAt))
    .limit(limit);

  return rows.map((r) => {
    const argsFull = r.args == null ? "" : JSON.stringify(r.args);
    return {
      id: r.id,
      time: formatClock(r.createdAt),
      day: formatDay(r.createdAt, "short"),
      tool: r.tool,
      args: argsFull.length > ARGS_LIMIT ? `${argsFull.slice(0, ARGS_LIMIT)}…` : argsFull,
      argsFull: r.args == null ? "" : JSON.stringify(r.args, null, 2),
      rowCount: r.rowCount,
      durationMs: r.durationMs,
      ok: r.ok,
      error: r.error,
      client: r.clientName ?? r.clientId ?? "Unknown agent",
    };
  });
}

export type EmailRow = {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: string;
  error: string | null;
  createdAt: Date;
};

export async function listEmails(limit = 100): Promise<EmailRow[]> {
  // The saved html stays out of the list: one message is loaded when opened.
  return db
    .select({
      id: emailLog.id,
      to: emailLog.to,
      subject: emailLog.subject,
      template: emailLog.template,
      status: emailLog.status,
      error: emailLog.error,
      createdAt: emailLog.createdAt,
    })
    .from(emailLog)
    .orderBy(desc(emailLog.createdAt))
    .limit(limit);
}

export async function getEmail(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db.select().from(emailLog).where(eq(emailLog.id, id)).limit(1);
  return row ?? null;
}

const EMAIL_STATUS: Record<string, string> = {
  pending: "Being sent",
  logged: "Saved, not sent",
  sent: "Sent",
  delivered: "Delivered",
  bounced: "Bounced back",
  complained: "Marked as spam",
  failed: "Failed",
};

export function emailStatusWords(status: string): string {
  return EMAIL_STATUS[status] ?? status;
}

/** The web addresses in a plain-text email, in order, once each. */
export function linksIn(text: string | null): string[] {
  if (!text) return [];
  const found = text.match(/https?:\/\/[^\s<>"')\]]+/g) ?? [];
  return [...new Set(found.map((u) => u.replace(/[.,;:!?]+$/, "")))];
}

export type Change = { id: string; when: string; sentence: string };

type Detail = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" && v ? v : null);

function who(via: string | null, ownerName: string | null): string {
  if (via === "agent") return ownerName ? `an AI agent for ${ownerName}` : "an AI agent";
  if (via === "client") return "a client";
  return ownerName ?? "the owner";
}

function bookingWords(d: Detail): string {
  const startsAt = str(d.startsAt);
  const at = startsAt ? new Date(startsAt) : null;
  const when = at && !Number.isNaN(at.getTime()) ? `, ${formatWhen(at)}` : "";
  return `${str(d.service) ?? "An appointment"} with ${str(d.stylist) ?? "a stylist"}${when}`;
}

/** One activity_log row as a sentence. An action nobody taught this prints as it is. */
export function describeChange(action: string, detail: unknown, ownerName: string | null): string {
  const d: Detail = detail && typeof detail === "object" ? (detail as Detail) : {};
  const by = `(by ${who(str(d.via), ownerName)})`;
  const name = str(d.name) ?? "unnamed";

  switch (action) {
    case "booking.made":
      return `Booked: ${bookingWords(d)} ${by}`;
    case "booking.cancelled":
      return `Cancelled: ${bookingWords(d)} ${by}`;
    case "service.added":
      return `Service added: ${name} ${by}`;
    case "service.edited":
      return `Service changed: ${name} ${by}`;
    case "service.removed":
      return `Service taken off the price list: ${name} ${by}`;
    case "service.restored":
      return `Service put back on the price list: ${name} ${by}`;
    case "stylist.added":
      return `Stylist added: ${name} ${by}`;
    case "stylist.edited":
      return `Stylist changed: ${name} ${by}`;
    case "stylist.removed":
      return `Stylist taken off the booking pages: ${name} ${by}`;
    case "stylist.restored":
      return `Stylist put back on the booking pages: ${name} ${by}`;
    case "hours.changed":
      return `Working hours changed${str(d.stylistName) ? ` for ${str(d.stylistName)}` : ""} ${by}`;
    case "time_off.added":
      return `Time off added${str(d.stylistName) ? ` for ${str(d.stylistName)}` : ""} ${by}`;
    case "time_off.removed":
      return `Time off removed${str(d.stylistName) ? ` for ${str(d.stylistName)}` : ""} ${by}`;
    case "connection.revoked":
      return `AI agent access revoked ${by}`;
    case "email.sent_again":
      return `Email sent again: ${str(d.subject) ?? "a saved message"} ${by}`;
    default:
      return action;
  }
}

export async function listChanges(limit = 200): Promise<Change[]> {
  const rows = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      detail: activityLog.detail,
      ownerName: user.name,
      createdAt: activityLog.createdAt,
    })
    .from(activityLog)
    .leftJoin(user, eq(user.id, activityLog.userId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);

  // hours and time off are logged with a stylist id only, so look the names up once.
  const names = new Map(
    (await listStylists({ includeInactive: true })).map((s) => [s.id, s.name]),
  );

  return rows.map((r) => {
    const d = r.detail && typeof r.detail === "object" ? (r.detail as Detail) : {};
    const stylistId = str(d.stylistId);
    const detail = stylistId ? { ...d, stylistName: names.get(stylistId) } : d;
    return {
      id: r.id,
      when: formatWhen(r.createdAt),
      sentence: describeChange(r.action, detail, r.ownerName),
    };
  });
}
