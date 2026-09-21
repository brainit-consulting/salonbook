"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const LINKS = [
  { href: "/settings", label: "Profile" },
  { href: "/settings/account", label: "Account" },
  { href: "/settings/security", label: "Security" },
  { href: "/settings/connections", label: "Connected apps" },
  { href: "/settings/system", label: "System" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings"
      className="-mx-4 flex gap-5 overflow-x-auto border-b px-4 pb-3 md:mx-0 md:w-44 md:shrink-0 md:flex-col md:gap-3 md:overflow-visible md:border-b-0 md:px-0 md:pb-0"
    >
      {LINKS.map((link) => {
        // Profile lives at /settings itself, so it only matches exactly.
        const current =
          link.href === "/settings" ? pathname === "/settings" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "py-1 whitespace-nowrap underline-offset-4 transition-colors duration-100 hover:text-foreground",
              current ? "font-semibold text-foreground underline" : "text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
