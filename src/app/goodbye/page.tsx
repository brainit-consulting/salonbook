import type { Metadata } from "next";
import Link from "next/link";
import { salon } from "@/lib/salon/config";

export const metadata: Metadata = { title: "Account deleted" };

export default function GoodbyePage() {
  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-xl px-4 py-12">
      <h1 className="double-rule text-[1.75rem]">The owner account is deleted</h1>
      <p className="max-w-[62ch]">
        You are signed out, and that email and password no longer open the diary. The
        salon&apos;s services, stylists and bookings are still here, and the next person to
        sign up becomes the owner.
      </p>
      <p className="mt-6">
        <Link href="/" className="font-semibold underline underline-offset-4">
          Back to {salon.name}
        </Link>
      </p>
    </main>
  );
}
