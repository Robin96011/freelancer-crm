import { redirect } from "next/navigation";

import { SettingsClient } from "./settings-client";
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
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  let profile = row as Profile | null;

  if (!profile) {
    const { data: created, error: createError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: null,
          freelancer_type: null,
          currency: "USD",
          timezone: "UTC",
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();
    if (createError || !created) {
      throw new Error(
        createError?.message ?? "Could not initialize settings profile."
      );
    }
    profile = created as Profile;
  }

  return <SettingsClient profile={profile} email={user.email ?? ""} />;
}
