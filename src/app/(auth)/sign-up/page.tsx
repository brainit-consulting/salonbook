import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ownerExists } from "@/lib/owner-exists";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Set up the owner account" };

export default async function SignUpPage() {
  await connection();

  if (await ownerExists()) {
    return (
      <>
        <h1 className="double-rule text-[1.75rem]">Sign-up is closed</h1>
        <p>This salon already has an owner, so no new accounts can be made.</p>
        <p className="mt-4">
          <Link href="/sign-in" className="text-primary underline underline-offset-4">
            Go to owner sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="double-rule text-[1.75rem]">Set up the owner account</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        The first account becomes the salon&rsquo;s owner. Sign-up closes after it.
      </p>
      <SignUpForm />
    </>
  );
}
