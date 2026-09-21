"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { SignOutButton } from "./sign-out-button";

const pages = [
  { href: "/diary", label: "Diary" },
  { href: "/services", label: "Services" },
  { href: "/stylists", label: "Stylists" },
  { href: "/settings", label: "Settings" },
];

const CONNECTIONS = "/settings/connections";

const link =
  "py-3 underline-offset-[6px] decoration-1 transition-colors duration-100 hover:text-foreground focus-visible:underline focus-visible:outline-none";

export function OwnerNav() {
  const pathname = usePathname();
  const under = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // Connected apps lives under /settings but has its own link on the right.
  const current = (href: string) =>
    href === "/settings" ? under(href) && !under(CONNECTIONS) : under(href);

  return (
    <nav aria-label="Owner pages" className="overflow-x-auto border-t">
      <div className="mx-auto flex w-full max-w-7xl gap-5 px-4 text-sm whitespace-nowrap">
        {pages.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            aria-current={current(p.href) ? "page" : undefined}
            className={cn(
              link,
              current(p.href) ? "font-semibold underline" : "text-muted-foreground",
            )}
          >
            {p.label}
          </Link>
        ))}
        <span className="ml-auto flex gap-5 pl-6 text-muted-foreground">
          <Link
            href={CONNECTIONS}
            aria-current={under(CONNECTIONS) ? "page" : undefined}
            className={cn(link, under(CONNECTIONS) && "font-semibold text-foreground underline")}
          >
            Connected apps
          </Link>
          <Link href="/" className={link}>
            View booking site
          </Link>
          <SignOutButton className={cn(link, "cursor-pointer disabled:opacity-50")} />
        </span>
      </div>
    </nav>
  );
}
