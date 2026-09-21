import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth-guards";
import { PageHeading, SettingsSection } from "@/components/settings/section";
import { ProfileForm } from "@/components/settings/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requireOwner();

  return (
    <>
      <PageHeading>Profile</PageHeading>
      <SettingsSection title="Your name">
        <ProfileForm name={session.user.name} />
      </SettingsSection>
    </>
  );
}
