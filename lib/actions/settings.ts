"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { FREELANCER_TYPES } from "@/lib/types";

const CURRENCIES = ["USD", "EUR", "GBP"] as const;

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (v == null || typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function isFreelancerType(v: string): boolean {
  return FREELANCER_TYPES.some((x) => x.value === v);
}

export async function updateProfileSettingsAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const full_name = str(formData, "full_name");
  const freelancer_type = str(formData, "freelancer_type");
  const currency = str(formData, "currency")?.toUpperCase();
  const timezone = str(formData, "timezone");

  if (freelancer_type && !isFreelancerType(freelancer_type)) {
    throw new Error("Invalid freelancer type.");
  }
  if (currency && !CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
    throw new Error("Invalid currency.");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name,
      freelancer_type: freelancer_type ?? null,
      currency: currency ?? "USD",
      timezone: timezone ?? "UTC",
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateNotificationSettingsAction(input: {
  notify_daily_digest: boolean;
  notify_proposal_viewed: boolean;
  notify_invoice_overdue: boolean;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      notify_daily_digest: input.notify_daily_digest,
      notify_proposal_viewed: input.notify_proposal_viewed,
      notify_invoice_overdue: input.notify_invoice_overdue,
    },
    { onConflict: "id" }
  );

  if (error) {
    if (
      error.message.includes("notify_daily_digest") ||
      error.message.includes("notify_proposal_viewed") ||
      error.message.includes("notify_invoice_overdue")
    ) {
      throw new Error(
        "Notification columns are missing. Run the latest Supabase migration for settings notifications."
      );
    }
    throw new Error(error.message);
  }

  revalidatePath("/settings");
}

export async function createBillingPortalSessionAction(): Promise<{ url: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!secret || !appUrl) {
    throw new Error("Billing is not configured (Stripe or app URL missing).");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    throw new Error(
      "No Stripe customer on file. Upgrade to Pro first to manage billing."
    );
  }

  const stripe = new Stripe(secret);
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/settings`,
  });

  if (!session.url) {
    throw new Error("Could not start billing portal.");
  }

  return { url: session.url };
}

export async function deleteAccountAction() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    throw new Error(
      "Account deletion is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server."
    );
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(error.message);
  }

  return { ok: true as const };
}
