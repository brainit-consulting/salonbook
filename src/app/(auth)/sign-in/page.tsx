import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ownerExists } from "@/lib/owner-exists";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Owner sign in" };

export default async function SignInPage() {
  // Without this the page is built once and the "no owner yet" line goes stale.
  await connection();
  const hasOwner = await ownerExists();

  return (
    <>
      <h1 className="double-rule text-[1.75rem]">Owner sign in</h1>
      {hasOwner ? null : (
        <p className="mb-6 text-sm">
          No owner yet.{" "}
          <Link href="/sign-up" className="text-primary underline underline-offset-4">
            Set up the owner account.
          </Link>
        </p>
      )}
      <SignInForm />
      <p className="mt-6 text-sm">
        <Link href="/forgot-password" className="underline underline-offset-4">
          Forgot your password?
        </Link>
      </p>
    </>
  );
}
