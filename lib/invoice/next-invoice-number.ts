import type { SupabaseClient } from "@supabase/supabase-js";

/** Next `INV-####` for this user based on existing numbers (not row count). */
export async function nextInvoiceNumber(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: rows } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("user_id", userId);

  let max = 0;
  for (const row of rows ?? []) {
    const m = /^INV-(\d+)$/i.exec(row.invoice_number);
    if (m) {
      max = Math.max(max, parseInt(m[1], 10));
    }
  }
  return `INV-${String(max + 1).padStart(4, "0")}`;
}
