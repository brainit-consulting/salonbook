import Link from "next/link";
import { requireOwner } from "@/lib/auth-guards";
import { salon } from "@/lib/salon/config";
import { OwnerNav } from "@/components/owner/owner-nav";

// This check keeps a signed-out visitor from seeing the frame. It is not the
// lock: layouts do not re-run on client navigation, so every page and every
// action under here calls requireOwner() itself as well.
export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOwner();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {!session.user.emailVerified && (
        <p className="border-b bg-muted px-4 py-2 text-sm">
          <Link href="/settings/system" className="underline underline-offset-4">
            Confirm your email.
          </Link>{" "}
          A link was written to <span className="figures">{session.user.email}</span>. It is on
          the System page under Emails, because this demo does not send mail.
        </p>
      )}
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-7xl items-baseline justify-between gap-4 px-4 pt-4 pb-3">
          <Link href="/diary" className="font-display text-2xl leading-none tracking-[-0.01em]">
            {salon.name}
          </Link>
          <span className="truncate text-sm text-muted-foreground">{session.user.name}</span>
        </div>
        <OwnerNav />
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
