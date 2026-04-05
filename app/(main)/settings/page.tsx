import { redirect } from "next/navigation";

import { BillingSettingsCard } from "@/components/settings/billing-settings-card";
import { DangerZoneCard } from "@/components/settings/danger-zone-card";
import { NotificationsSettingsCard } from "@/components/settings/notifications-settings-card";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: row, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !row) {
    throw new Error(error?.message ?? "Profile not found.");
  }

  const profile = row as Profile;

  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const serviceRoleConfigured = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Profile, notifications, billing, and account security.
        </p>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <ProfileSettingsForm
          profile={profile}
          email={user.email ?? ""}
        />

        <NotificationsSettingsCard profile={profile} />

        <BillingSettingsCard
          profile={profile}
          stripeConfigured={stripeConfigured}
        />

        <Separator />

        <DangerZoneCard
          serviceRoleConfigured={serviceRoleConfigured}
        />
      </div>
    </div>
  );
}
