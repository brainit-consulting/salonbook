import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireOwner } from "@/lib/auth-guards";
import { PageHeading, SettingsSection } from "@/components/settings/section";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { Devices, type Device } from "@/components/settings/devices";
import { deviceName } from "@/components/settings/device-name";
import { formatWhen } from "@/components/settings/when";

export const metadata: Metadata = { title: "Security" };

export default async function SecurityPage() {
  const current = await requireOwner();
  const sessions = await auth.api.listSessions({ headers: await headers() });

  // Tokens stay on the server. The browser gets the row id and words to show.
  const isCurrent = (id: string) => id === current.session.id;
  const devices: Device[] = [...sessions]
    .sort(
      (a, b) =>
        Number(isCurrent(b.id)) - Number(isCurrent(a.id)) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((s) => ({
      id: s.id,
      name: deviceName(s.userAgent),
      ip: s.ipAddress || null,
      started: formatWhen(new Date(s.createdAt)),
      current: isCurrent(s.id),
    }));

  return (
    <>
      <PageHeading>Security</PageHeading>
      <div className="grid gap-6">
        <SettingsSection title="Change password">
          <ChangePasswordForm />
        </SettingsSection>

        <SettingsSection
          title="Devices"
          description="Every phone and computer signed in as the owner. Revoke any you do not know."
        >
          <Devices devices={devices} />
        </SettingsSection>
      </div>
    </>
  );
}
