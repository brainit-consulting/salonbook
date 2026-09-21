import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSession, requireOwner } from "@/lib/auth-guards";
import { SCOPE_LABELS } from "@/lib/mcp-resource";
import { salon } from "@/lib/salon/config";
import { ConsentButtons } from "./consent-buttons";

export const metadata: Metadata = { title: "Allow access" };

type Query = Record<string, string | string[] | undefined>;

function toQueryString(query: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      params.append(key, v);
    }
  }
  return params.toString();
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function ConsentPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;

  // Sign-in has to keep the signed query, or the owner signs in and the
  // app that asked is forgotten. requireOwner() alone would drop it.
  if (!(await getSession())) redirect(`/sign-in?${toQueryString(query)}`);
  const session = await requireOwner();

  const clientId = first(query.client_id);
  const client = clientId
    ? await auth.api
        .getOAuthClientPublic({ query: { client_id: clientId }, headers: await headers() })
        .catch(() => null)
    : null;

  const asked = (first(query.scope) ?? "").split(" ").filter(Boolean);
  const labels = asked.flatMap((scope) => (SCOPE_LABELS[scope] ? [SCOPE_LABELS[scope]] : []));
  const unnamed = asked.length - labels.length;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-4 py-10">
      <Link href="/" className="font-display text-2xl leading-none underline-offset-4 hover:underline">
        {salon.name}
      </Link>

      <main className="mt-10">
        <h1 className="double-rule text-[1.75rem]">Allow access</h1>

        {!client ? (
          <p>
            Nothing is asking for access to the salon right now. Start again from the app you were
            connecting, or{" "}
            <Link href="/diary" className="text-primary underline underline-offset-4">
              go to the diary
            </Link>
            .
          </p>
        ) : (
          <>
            <section className="border-b border-border pb-5">
              <h2 className="text-sm font-semibold">Who is asking</h2>
              <p className="mt-1 font-display text-2xl leading-tight">
                {client.client_name || "An app that gave no name"}
              </p>
              {client.client_uri ? (
                <p className="figures mt-1 text-sm break-all text-muted-foreground">
                  {client.client_uri}
                </p>
              ) : null}
              <p className="mt-2 max-w-[62ch] text-sm text-muted-foreground">
                This name was chosen by whoever is connecting. The salon has not checked it. Only
                allow it if you started this yourself a moment ago.
              </p>
            </section>

            <section className="border-b border-border py-5">
              <h2 className="text-sm font-semibold">What it will be able to do</h2>
              {labels.length || unnamed ? (
                <ul className="mt-2 divide-y divide-border border-y border-border">
                  {labels.map((label) => (
                    <li key={label} className="py-2">
                      {label}
                    </li>
                  ))}
                  {unnamed ? (
                    <li className="py-2">
                      Something else this page can&apos;t put a name to. If in doubt, don&apos;t
                      allow it.
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className="mt-2">
                  It has not asked for anything in the salon, only to confirm you signed in.
                </p>
              )}
            </section>

            <section className="py-5">
              <h2 className="text-sm font-semibold">Whose account it will act as</h2>
              <p className="figures mt-1 break-all">{session.user.email}</p>
              <p className="mt-2 max-w-[62ch] text-sm text-muted-foreground">
                Anything it books or cancels is done as you, the owner, and is written to the
                agent call log. You can take this access away later under Connected apps.
              </p>
            </section>

            <ConsentButtons />
          </>
        )}
      </main>
    </div>
  );
}
