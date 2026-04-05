"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData) {
  const freelancerType = formData.get("freelancer_type");
  if (typeof freelancerType !== "string" || !freelancerType) {
    throw new Error("Choose a freelancer type.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ freelancer_type: freelancerType })
    .eq("id", user.id)
    .select("id");

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (!updated?.length) {
    const trialEnds = new Date();
    trialEnds.setUTCDate(trialEnds.getUTCDate() + 14);
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      freelancer_type: freelancerType,
      currency: "USD",
      timezone: "UTC",
      subscription_status: "trial",
      trial_ends_at: trialEnds.toISOString(),
    });
    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  redirect("/dashboard");
}
