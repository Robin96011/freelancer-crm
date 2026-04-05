"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isPipelineStage } from "@/lib/crm/pipeline-stages";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (v == null || typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function createDealAction(formData: FormData) {
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

  const valueRaw = str(formData, "value");
  const value = valueRaw ? Number.parseFloat(valueRaw.replace(",", ".")) : 0;
  if (Number.isNaN(value) || value < 0) {
    throw new Error("Enter a valid amount.");
  }

  const currency = (str(formData, "currency") ?? "USD").toUpperCase().slice(0, 3);
  const stageRaw = str(formData, "stage") ?? "lead";
  if (!isPipelineStage(stageRaw)) {
    throw new Error("Invalid stage.");
  }

  const probRaw = str(formData, "probability");
  let probability = probRaw ? Number.parseInt(probRaw, 10) : 0;
  if (Number.isNaN(probability)) probability = 0;
  probability = Math.min(100, Math.max(0, probability));

  const { error } = await supabase.from("deals").insert({
    user_id: user.id,
    client_id: clientId,
    title,
    value,
    currency,
    stage: stageRaw,
    probability,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

export async function updateDealStageAction(dealId: string, stage: string) {
  if (!isPipelineStage(stage)) {
    throw new Error("Invalid stage.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("deals")
    .update({ stage })
    .eq("id", dealId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}
