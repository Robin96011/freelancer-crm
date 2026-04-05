"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { computeInvoiceTotals, parseLineItemsJson } from "@/lib/invoice/compute-totals";
import { nextInvoiceNumber } from "@/lib/invoice/next-invoice-number";
import { isInvoiceStatus } from "@/lib/crm/invoice-statuses";
import type { InvoiceLineItem } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (v == null || typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function parseLines(formData: FormData): InvoiceLineItem[] {
  const raw = str(formData, "line_items");
  const lines = parseLineItemsJson(raw ?? undefined);
  return lines.filter((l) => l.description.trim().length > 0);
}

export async function createInvoiceAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const clientId = str(formData, "client_id");
  if (!clientId) {
    throw new Error("Client is required.");
  }

  const lines = parseLines(formData);
  if (lines.length === 0) {
    throw new Error("Add at least one line item with description.");
  }

  const taxRaw = str(formData, "tax_rate");
  const tax_rate = taxRaw ? Number.parseFloat(taxRaw.replace(",", ".")) : 0;
  if (!Number.isFinite(tax_rate) || tax_rate < 0 || tax_rate > 100) {
    throw new Error("Tax rate must be between 0 and 100.");
  }

  const { subtotal, total } = computeInvoiceTotals(lines, tax_rate);
  const currency = (str(formData, "currency") ?? "USD").toUpperCase().slice(0, 3);

  const dueRaw = str(formData, "due_date");
  const due_date = dueRaw && dueRaw.length > 0 ? dueRaw : null;

  const statusRaw = str(formData, "status") ?? "unpaid";
  if (!isInvoiceStatus(statusRaw)) {
    throw new Error("Invalid status.");
  }

  const invoice_number = await nextInvoiceNumber(supabase, user.id);

  const { data: created, error } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      client_id: clientId,
      deal_id: str(formData, "deal_id"),
      invoice_number,
      line_items: lines,
      subtotal,
      tax_rate,
      total,
      currency,
      status: statusRaw,
      due_date,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { id: created.id as string };
}

export async function updateInvoiceAction(invoiceId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const lines = parseLines(formData);
  if (lines.length === 0) {
    throw new Error("Add at least one line item with description.");
  }

  const taxRaw = str(formData, "tax_rate");
  const tax_rate = taxRaw ? Number.parseFloat(taxRaw.replace(",", ".")) : 0;
  if (!Number.isFinite(tax_rate) || tax_rate < 0 || tax_rate > 100) {
    throw new Error("Tax rate must be between 0 and 100.");
  }

  const { subtotal, total } = computeInvoiceTotals(lines, tax_rate);
  const dueRaw = str(formData, "due_date");
  const due_date = dueRaw && dueRaw.length > 0 ? dueRaw : null;

  const statusRaw = str(formData, "status") ?? "unpaid";
  if (!isInvoiceStatus(statusRaw)) {
    throw new Error("Invalid status.");
  }

  const updates: Record<string, unknown> = {
    client_id: str(formData, "client_id"),
    deal_id: str(formData, "deal_id"),
    line_items: lines,
    subtotal,
    tax_rate,
    total,
    status: statusRaw,
    due_date,
  };

  if (statusRaw === "paid") {
    updates.paid_at = new Date().toISOString();
  } else {
    updates.paid_at = null;
  }

  const { error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
}

export async function deleteInvoiceAction(invoiceId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function setInvoicePaidAction(invoiceId: string, paid: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("invoices")
    .update({
      status: paid ? "paid" : "unpaid",
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
}
