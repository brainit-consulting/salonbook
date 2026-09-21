import Link from "next/link";
import { salon } from "@/lib/salon/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col px-4 py-10">
      <Link href="/" className="font-display text-2xl leading-none underline-offset-4 hover:underline">
        {salon.name}
      </Link>
      <main className="mt-10">{children}</main>
    </div>
  );
}
