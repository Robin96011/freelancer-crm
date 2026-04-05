"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (v == null || typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function createClientAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const name = str(formData, "name");
  if (!name) {
    throw new Error("Name is required.");
  }

  const tagsRaw = str(formData, "tags") ?? "";
  const tags = tagsRaw
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const followRaw = str(formData, "next_follow_up");
  const next_follow_up =
    followRaw && followRaw.length > 0
      ? new Date(followRaw).toISOString()
      : null;

  const { error } = await supabase.from("clients").insert({
    user_id: user.id,
    name,
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    company: str(formData, "company"),
    notes: str(formData, "notes"),
    tags,
    next_follow_up,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clients");
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const name = str(formData, "name");
  if (!name) {
    throw new Error("Name is required.");
  }

  const tagsRaw = str(formData, "tags") ?? "";
  const tags = tagsRaw
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const followRaw = str(formData, "next_follow_up");
  const next_follow_up =
    followRaw && followRaw.length > 0
      ? new Date(followRaw).toISOString()
      : null;

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      company: str(formData, "company"),
      notes: str(formData, "notes"),
      tags,
      next_follow_up,
    })
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClientAction(clientId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clients");
  redirect("/clients");
}
