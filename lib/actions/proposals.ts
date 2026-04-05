"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isProposalStatus } from "@/lib/crm/proposal-statuses";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (v == null || typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function num(formData: FormData, key: string): number {
  const raw = str(formData, key);
  if (raw == null) return 0;
  const n = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export async function createProposalAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const title = str(formData, "title");
  if (!title) {
    throw new Error("Title is required.");
  }

  const clientId = str(formData, "client_id");
  if (!clientId) {
    throw new Error("Client is required.");
  }

  const dealId = str(formData, "deal_id");
  const statusRaw = str(formData, "status") ?? "draft";
  if (!isProposalStatus(statusRaw)) {
    throw new Error("Invalid status.");
  }

  const total_value = num(formData, "total_value");
  if (total_value < 0) {
    throw new Error("Amount cannot be negative.");
  }

  const now = new Date().toISOString();
  const insert: Record<string, unknown> = {
    user_id: user.id,
    client_id: clientId,
    deal_id: dealId,
    title,
    content: str(formData, "content"),
    status: statusRaw,
    total_value,
  };

  if (statusRaw === "sent") {
    insert.sent_at = now;
  }
  if (statusRaw === "viewed") {
    insert.sent_at = insert.sent_at ?? now;
    insert.viewed_at = now;
  }

  const { data: created, error } = await supabase
    .from("proposals")
    .insert(insert)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/proposals");
  revalidatePath("/dashboard");
  return { id: created.id as string };
}

export async function updateProposalAction(
  proposalId: string,
  formData: FormData
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("proposals")
    .select("status, sent_at, viewed_at")
    .eq("id", proposalId)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !existing) {
    throw new Error("Proposal not found.");
  }

  const title = str(formData, "title");
  if (!title) {
    throw new Error("Title is required.");
  }

  const clientId = str(formData, "client_id");
  if (!clientId) {
    throw new Error("Client is required.");
  }

  const statusRaw = str(formData, "status") ?? "draft";
  if (!isProposalStatus(statusRaw)) {
    throw new Error("Invalid status.");
  }

  const total_value = num(formData, "total_value");
  if (total_value < 0) {
    throw new Error("Amount cannot be negative.");
  }

  const prev = existing as { status: string; sent_at: string | null; viewed_at: string | null };
  const updates: Record<string, unknown> = {
    client_id: clientId,
    deal_id: str(formData, "deal_id"),
    title,
    content: str(formData, "content"),
    status: statusRaw,
    total_value,
  };

  const now = new Date().toISOString();
  if (statusRaw === "sent" && prev.status !== "sent") {
    updates.sent_at = now;
  }
  if (statusRaw === "viewed" && prev.status !== "viewed") {
    if (!prev.sent_at && !updates.sent_at) {
      updates.sent_at = now;
    }
    updates.viewed_at = now;
  }

  const { error } = await supabase
    .from("proposals")
    .update(updates)
    .eq("id", proposalId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath("/dashboard");
}

export async function deleteProposalAction(proposalId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("proposals")
    .delete()
    .eq("id", proposalId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/proposals");
  revalidatePath("/dashboard");
}
