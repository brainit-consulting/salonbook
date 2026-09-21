import type { Metadata } from "next";
import Link from "next/link";
import { requireOwner } from "@/lib/auth-guards";
import { emailConfigured } from "@/lib/email";
import { buttonVariants } from "@/components/ui/button";
import { PageHeading, SettingsSection } from "@/components/settings/section";
import { ConfirmEmail } from "@/components/settings/confirm-email";
import { ChangeEmailForm } from "@/components/settings/change-email-form";
import { DeleteAccount } from "@/components/settings/delete-account";
import { CONTROL_HEIGHT } from "@/components/settings/field";
import { cn } from "cn";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { user } = await requireOwner();

  return (
    <>
      <PageHeading>Account</PageHeading>

      <div className="grid gap-6">
        <SettingsSection title="Email">
          <p className="figures break-all">{user.email}</p>
          <p className="mt-1 font-semibold">{user.emailVerified ? "Confirmed" : "Not confirmed"}</p>

          {user.emailVerified ? null : (
            <div className="mt-5 grid gap-3">
              <ConfirmEmail email={user.email} mailed={emailConfigured} />
              {emailConfigured ? null : (
                <p className="max-w-[62ch] text-sm text-muted-foreground">
                  In this demo no mail is sent. The link appears on the{" "}
                  <Link href="/settings/system" className="underline underline-offset-4">
                    System page
                  </Link>{" "}
                  under Emails instead of arriving by mail.
                </p>
              )}
            </div>
          )}
        </SettingsSection>

        <SettingsSection
          title="Change email"
          description={
            emailConfigured
              ? "A link goes to the new address. Nothing changes until that link is opened."
              : "A link for the new address is written to the System page under Emails. Nothing changes until that link is opened."
          }
        >
          <ChangeEmailForm email={user.email} mailed={emailConfigured} />
        </SettingsSection>

        <SettingsSection
          title="Download my data"
          description="One file with your name and email, and the salon's services, stylists and bookings. No passwords and no sign-in tokens are in it."
        >
          <a
            href="/settings/account/download"
            download
            className={cn(buttonVariants({ variant: "outline" }), CONTROL_HEIGHT)}
          >
            Download my data
          </a>
        </SettingsSection>
      </div>

      {/* Real space between the harmless and the permanent. */}
      <SettingsSection
        title="Delete the owner account"
        className="mt-20 border-destructive"
      >
        <ul className="mb-6 grid max-w-[62ch] list-disc gap-1.5 pl-5">
          <li>The owner account is deleted. This cannot be undone.</li>
          <li>Services, stylists and bookings stay as they are.</li>
          <li>Sign-up opens again, and the next person to sign up becomes the owner.</li>
          <li>
            Connected apps are cut off. A pass one already holds can keep working for up to an
            hour.
          </li>
          <li>
            Nothing happens until you open a confirmation link.{" "}
            {emailConfigured
              ? "It is sent to the address above."
              : "It is written to the System page under Emails, and to the server terminal."}
          </li>
        </ul>
        <DeleteAccount email={user.email} mailed={emailConfigured} />
      </SettingsSection>
    </>
  );
}
