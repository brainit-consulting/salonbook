import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { salon } from "@/lib/salon/config";

// A plain reading page, open to anyone, signed in or not.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="mx-auto w-full max-w-xl px-4 pt-6">
        <Link href="/" className="text-sm font-semibold underline-offset-4 hover:underline">
          {salon.name}
        </Link>
      </header>
      <main className="mx-auto w-full max-w-xl px-4 pt-8 pb-16">{children}</main>
      <SiteFooter />
    </div>
  );
}
