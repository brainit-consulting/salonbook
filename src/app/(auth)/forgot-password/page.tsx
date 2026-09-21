import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="double-rule text-[1.75rem]">Forgot password</h1>
      <ForgotPasswordForm />
      <p className="mt-6 text-sm">
        <Link href="/sign-in" className="underline underline-offset-4">
          Back to owner sign in
        </Link>
      </p>
    </>
  );
}
