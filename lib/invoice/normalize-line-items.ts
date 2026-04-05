import { parseLineItemsJson } from "@/lib/invoice/compute-totals";
import type { InvoiceLineItem } from "@/lib/types";

export function normalizeLineItems(raw: unknown): InvoiceLineItem[] {
  if (raw == null) return [];
  try {
    return parseLineItemsJson(JSON.stringify(raw));
  } catch {
    return [];
  }
}
