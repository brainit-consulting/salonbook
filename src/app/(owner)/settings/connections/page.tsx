import type { Metadata } from "next";
import Link from "next/link";
import { requireOwner } from "@/lib/auth-guards";
import { MCP_RESOURCE, SCOPE_LABELS } from "@/lib/mcp-resource";
import { PageHeading, SettingsSection } from "@/components/settings/section";
import { CopyAddress } from "@/components/settings/copy-address";
import { ConnectInstructions } from "@/components/settings/connect-instructions";
import { RevokeConnection } from "@/components/settings/revoke-connection";
import { formatWhen } from "@/components/settings/when";
import { listConnections, listRecentAgentCalls } from "./data";

export const metadata: Metadata = { title: "Connected apps" };

const NO_NAME = "An app that gave no name";

export default async function ConnectionsPage() {
  const { user } = await requireOwner();
  const [connections, calls] = await Promise.all([
    listConnections(user.id),
    listRecentAgentCalls(user.id),
  ]);

  return (
    <>
      <PageHeading>Connected apps</PageHeading>

      <div className="grid gap-6">
        <SettingsSection
          title="The salon's connector address"
          description="An AI agent such as Claude needs this address to reach the diary. It is not a secret: nothing can be read until you sign in and approve the app."
        >
          <div className="grid gap-4">
            <CopyAddress value={MCP_RESOURCE} label="Copy the connector address" />
            <ConnectInstructions address={MCP_RESOURCE} />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Apps you have approved"
          description={
            connections.length
              ? "Each name below was chosen by whoever connected, not checked by the salon. Two rows with nearly the same name are two different apps."
              : undefined
          }
        >
          {connections.length === 0 ? (
            <div className="grid gap-4">
              <p>Nothing is connected yet.</p>
              <ConnectInstructions address={MCP_RESOURCE} />
            </div>
          ) : (
            <ul className="border-t">
              {connections.map((c) => (
                <li
                  key={c.consentId}
                  className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold break-words">{c.name ?? NO_NAME}</p>
                    <p className="text-sm text-muted-foreground">
                      Name chosen by whoever connected.
                    </p>
                    <ul className="mt-2 list-disc pl-5">
                      {c.scopes.map((scope) => (
                        // A scope with no label is shown as it is rather than hidden.
                        <li key={scope}>{SCOPE_LABELS[scope] ?? scope}</li>
                      ))}
                    </ul>
                    <p className="figures mt-2 text-sm text-muted-foreground">
                      Approved {formatWhen(c.grantedAt)}
                      <br />
                      {c.lastUsedAt ? `Last used ${formatWhen(c.lastUsedAt)}` : "Never used"}
                    </p>
                  </div>
                  <RevokeConnection consentId={c.consentId} name={c.name ?? NO_NAME} />
                </li>
              ))}
            </ul>
          )}
        </SettingsSection>

        <SettingsSection
          title="What agents did lately"
          description="The last 20 things an agent asked the salon for, newest first."
        >
          {calls.length === 0 ? (
            <p className="max-w-[62ch]">
              Each thing an agent does for you is listed here. Connect one with the address at
              the top of this page, then ask it which times are free tomorrow.
            </p>
          ) : (
            <ul className="figures border-t text-sm">
              {calls.map((call) => (
                <li key={call.id} className="flex flex-wrap justify-between gap-x-4 border-b py-2">
                  <span className="min-w-0 break-all">{call.tool}</span>
                  <span className="text-muted-foreground">
                    {call.ok ? "worked" : "failed"} · {formatWhen(call.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4">
            <Link href="/settings/system" className="underline underline-offset-4">
              See the full log on the System page
            </Link>
          </p>
        </SettingsSection>
      </div>
    </>
  );
}
