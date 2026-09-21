import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { salon } from "@/lib/salon/config";

/** The frame round the booking pages: the salon's name back to the price list, one column, the footer. */
export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="mx-auto w-full max-w-xl px-4 pt-6">
        <Link href="/" className="font-display text-2xl leading-none hover:text-primary">
          {salon.name}
        </Link>
      </header>
      <main className="mx-auto w-full max-w-xl px-4 pt-10 pb-16">{children}</main>
      <SiteFooter />
    </div>
  );
}

/**
 * A step heading. On wide screens the step number hangs in the left margin,
 * outside the text column (DESIGN.md section 4).
 */
export function StepHeading({ step, children }: { step?: number; children: React.ReactNode }) {
  return (
    <div className="relative">
      {step ? (
        <p className="figures mb-2 text-sm text-muted-foreground lg:absolute lg:top-2 lg:right-full lg:mr-10 lg:mb-0 lg:whitespace-nowrap">
          {step} of 3
        </p>
      ) : null}
      <h1 className="double-rule text-[1.75rem]">{children}</h1>
    </div>
  );
}

/** An empty list: one sentence and one action. */
export function EmptyState({ children, action }: { children: React.ReactNode; action: React.ReactNode }) {
  return (
    <div className="border-y py-6">
      <p className="max-w-[62ch]">{children}</p>
      <p className="mt-3">{action}</p>
    </div>
  );
}

export const quietLink = "underline underline-offset-4 hover:text-primary";
