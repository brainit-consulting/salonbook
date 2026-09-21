import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { cn } from "cn";
import { requireOwner } from "@/lib/auth-guards";
import { emailConfigured } from "@/lib/email";
import {
  emailStatusWords,
  formatWhen,
  getEmail,
  getSystemChecks,
  linksIn,
  listAgentCalls,
  listChanges,
  listEmails,
} from "@/lib/system-status";
import { Button } from "@/components/ui/button";
import { AgentCallRows } from "@/components/system/agent-call-rows";
import { LiveRefresh } from "@/components/system/live-refresh";
import { sendEmailAgain } from "./actions";

export const metadata: Metadata = { title: "System" };

type Search = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Both switches live in the address so a section can be linked to as it looks:
// ?large=1 for the projector, ?email=ID for one opened message.
function href(state: { large: boolean; email?: string | null }, hash: string) {
  const q = new URLSearchParams();
  if (state.large) q.set("large", "1");
  if (state.email) q.set("email", state.email);
  const query = q.toString();
  return `/settings/system${query ? `?${query}` : ""}#${hash}`;
}

// Links in the saved message are switched off inside the frame: the sandbox
// allows nothing, and a _blank target it may not open goes nowhere. The same
// links are listed under the frame, where they work.
function framed(html: string) {
  const base = '<base target="_blank">';
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + base) : base + html;
}

const sectionLinks = [
  ["setup", "What's set up"],
  ["agent-calls", "Agent calls"],
  ["emails", "Emails"],
  ["changes", "What changed"],
] as const;

const th = "py-2 pr-4 text-left font-semibold whitespace-nowrap";

export default async function SystemPage({ searchParams }: { searchParams: Search }) {
  await requireOwner();

  const params = await searchParams;
  const large = one(params.large) === "1";
  const openId = one(params.email) ?? null;

  const [checks, calls, emails, changes, openEmail] = await Promise.all([
    getSystemChecks(),
    listAgentCalls(100),
    listEmails(100),
    listChanges(200),
    openId ? getEmail(openId) : null,
  ]);
  const links = linksIn(openEmail?.text ?? null);

  return (
    <div className="space-y-14">
      <header>
        <h1 className="text-[1.75rem]">System</h1>
        <p className="mt-2 max-w-[62ch] text-muted-foreground">
          The salon&apos;s app from the inside: what is set up, what AI agents asked it, which
          emails it wrote and what changed.
        </p>
        <nav aria-label="On this page" className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {sectionLinks.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="py-1 underline underline-offset-4">
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section id="setup" aria-labelledby="setup-heading" className="scroll-mt-6">
        <h2 id="setup-heading" className="double-rule text-2xl">
          What&apos;s set up
        </h2>
        <dl className="max-w-3xl">
          {checks.map((check) => (
            <div
              key={check.id}
              className="grid gap-x-6 gap-y-1 border-b border-border py-3 sm:grid-cols-[11rem_1fr]"
            >
              <dt className="font-semibold">{check.name}</dt>
              <dd>
                {/* Email with no key is a normal way to run, so its note is the whole status. */}
                {check.ready ? (
                  <span className="font-semibold">Ready. </span>
                ) : check.optional ? null : (
                  <span className="font-semibold">Not set up yet. </span>
                )}
                <span className={check.ready ? "text-muted-foreground" : undefined}>
                  {check.note}
                </span>
                {check.address && (
                  <span className="figures mt-1 block break-all">{check.address}</span>
                )}
                {!check.ready && check.variable && (
                  <span className="mt-1 block text-sm text-muted-foreground">
                    To set it up, set <span className="figures">{check.variable}</span>.
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="agent-calls" aria-labelledby="agent-calls-heading" className="scroll-mt-6">
        <h2 id="agent-calls-heading" className="double-rule text-2xl">
          Agent calls
        </h2>
        <p className={cn("max-w-[62ch]", large && "text-xl")}>
          Each row is one tool call an AI agent made to this salon: what it asked for, and what
          came back.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1">
          <LiveRefresh />
          <Link
            href={href({ large: !large, email: openId }, "agent-calls")}
            className="py-2 text-sm font-semibold underline underline-offset-4"
          >
            {large ? "Normal type" : "Large type"}
          </Link>
        </div>

        {calls.length === 0 ? (
          <p className="mt-4 border-y border-border py-4">
            No agent has called the salon yet.{" "}
            <Link href="/settings/connections" className="underline underline-offset-4">
              Connect an AI agent
            </Link>
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table
              className={cn(
                "figures w-full min-w-[60rem] border-collapse border-t border-border",
                large ? "text-xl" : "text-base",
              )}
            >
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className={th}>
                    Time
                  </th>
                  <th scope="col" className={th}>
                    Tool
                  </th>
                  <th scope="col" className={th}>
                    Asked for
                  </th>
                  <th scope="col" className={cn(th, "text-right")}>
                    Rows
                  </th>
                  <th scope="col" className={cn(th, "text-right")}>
                    Took
                  </th>
                  <th scope="col" className={th}>
                    Result
                  </th>
                  <th scope="col" className={cn(th, "pr-0")}>
                    Agent
                  </th>
                </tr>
              </thead>
              <AgentCallRows calls={calls} />
            </table>
          </div>
        )}
      </section>

      <section id="emails" aria-labelledby="emails-heading" className="scroll-mt-6">
        <h2 id="emails-heading" className="double-rule text-2xl">
          Emails
        </h2>
        <p className="max-w-[62ch] text-muted-foreground">
          {emailConfigured
            ? "Every email the salon has written, newest first. Open one to read it."
            : "Not sending. Every email the salon writes is saved here instead. Open one to read it and use its links."}
        </p>

        {emails.length === 0 ? (
          <p className="mt-4 border-y border-border py-4">
            Booking confirmations and cancellations will be listed here.{" "}
            <Link href="/" className="underline underline-offset-4">
              Make a booking
            </Link>
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse border-t border-border text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className={th}>
                    To
                  </th>
                  <th scope="col" className={th}>
                    Subject
                  </th>
                  <th scope="col" className={th}>
                    Kind
                  </th>
                  <th scope="col" className={th}>
                    Status
                  </th>
                  <th scope="col" className={cn(th, "pr-0")}>
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email) => {
                  const isOpen = openEmail?.id === email.id;
                  return (
                    <Fragment key={email.id}>
                      <tr
                        id={`email-${email.id}`}
                        className="scroll-mt-6 border-b border-border align-top"
                      >
                        <td className="figures py-2 pr-4 break-all">{email.to}</td>
                        <td className="py-2 pr-4">
                          <Link
                            href={href(
                              { large, email: isOpen ? null : email.id },
                              isOpen ? "emails" : `email-${email.id}`,
                            )}
                            aria-expanded={isOpen}
                            className="underline underline-offset-4"
                          >
                            {email.subject}
                          </Link>
                        </td>
                        <td className="figures py-2 pr-4 whitespace-nowrap">{email.template}</td>
                        <td className="py-2 pr-4">
                          {emailStatusWords(email.status)}
                          {email.error && (
                            <span className="block text-muted-foreground">{email.error}</span>
                          )}
                        </td>
                        <td className="figures py-2 whitespace-nowrap">
                          {formatWhen(email.createdAt)}
                        </td>
                      </tr>
                      {isOpen && openEmail && (
                        <tr className="border-b border-border">
                          <td colSpan={5} className="py-4">
                            <div className="max-w-3xl space-y-4">
                              {openEmail.html ? (
                                <iframe
                                  title={`Email: ${openEmail.subject}`}
                                  srcDoc={framed(openEmail.html)}
                                  sandbox=""
                                  className="h-[32rem] w-full border border-border bg-card"
                                />
                              ) : (
                                <p className="text-muted-foreground">
                                  This email was saved without its message.
                                </p>
                              )}

                              <div>
                                <h3 className="font-semibold">Links in this email</h3>
                                {links.length === 0 ? (
                                  <p className="text-muted-foreground">This email has no links.</p>
                                ) : (
                                  <>
                                    <p className="text-muted-foreground">
                                      Links inside the preview are switched off. These are the
                                      same ones.
                                    </p>
                                    <ul className="mt-1">
                                      {links.map((url) => (
                                        <li key={url} className="border-b border-border py-2">
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="figures break-all underline underline-offset-4"
                                          >
                                            {url}
                                          </a>
                                        </li>
                                      ))}
                                    </ul>
                                  </>
                                )}
                              </div>

                              {openEmail.text && (
                                <details>
                                  <summary className="cursor-pointer py-2 font-semibold">
                                    Plain text version
                                  </summary>
                                  <pre className="figures mt-2 overflow-x-auto border border-border bg-card p-3 text-sm whitespace-pre-wrap">
                                    {openEmail.text}
                                  </pre>
                                </details>
                              )}

                              {emailConfigured &&
                                openEmail.status === "failed" &&
                                openEmail.html && (
                                  <form action={sendEmailAgain}>
                                    <input type="hidden" name="emailId" value={openEmail.id} />
                                    <Button type="submit" variant="outline" className="rounded-sm">
                                      Send again
                                    </Button>
                                  </form>
                                )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="changes" aria-labelledby="changes-heading" className="scroll-mt-6">
        <h2 id="changes-heading" className="double-rule text-2xl">
          What changed
        </h2>
        {changes.length === 0 ? (
          <p className="border-y border-border py-4">
            Bookings, cancellations and changes to services, stylists and hours will be listed
            here.{" "}
            <Link href="/diary" className="underline underline-offset-4">
              Open the diary
            </Link>
          </p>
        ) : (
          <ul className="max-w-4xl border-t border-border">
            {changes.map((change) => (
              <li
                key={change.id}
                className="grid gap-x-6 border-b border-border py-2 sm:grid-cols-[13rem_1fr]"
              >
                <span className="figures text-sm text-muted-foreground sm:pt-0.5">
                  {change.when}
                </span>
                <span>{change.sentence}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
