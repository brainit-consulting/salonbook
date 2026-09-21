import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>;
}) {
  const { token, error } = await searchParams;
  // Better Auth sends an expired or used link here with ?error=INVALID_TOKEN.
  const usable = typeof token === "string" && token.length > 0 && !error;

  return (
    <>
      <h1 className="double-rule text-[1.75rem]">Choose a new password</h1>
      {usable ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4">
          <p>This reset link has expired or has already been used.</p>
          <p>
            <Link href="/forgot-password" className="text-primary underline underline-offset-4">
              Ask for a new link
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
