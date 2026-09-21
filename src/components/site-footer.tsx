import Link from "next/link";
import { salon } from "@/lib/salon/config";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">{salon.name}</span>
          <br />A made-up salon for a workshop demo.
        </p>
        <nav aria-label="Footer" className="flex gap-5">
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy
          </Link>
          <Link href="/sign-in" className="underline underline-offset-4 hover:text-foreground">
            Owner sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
