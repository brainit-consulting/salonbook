import { requireOwner } from "@/lib/auth-guards";
import { SettingsNav } from "@/components/settings/settings-nav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  // Layouts do not re-run on client navigation, so every page checks again.
  await requireOwner();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:flex-row md:gap-12 md:py-10">
      <SettingsNav />
      <div className="min-w-0 flex-1 md:max-w-2xl">{children}</div>
    </div>
  );
}
