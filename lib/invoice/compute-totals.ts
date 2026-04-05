import type { InvoiceLineItem } from "@/lib/types";

export function computeInvoiceTotals(
  lines: InvoiceLineItem[],
  taxRatePercent: number
): { subtotal: number; total: number } {
  const subtotal = lines.reduce(
    (sum, line) => sum + line.quantity * line.unit_price,
    0
  );
  const safeTax = Number.isFinite(taxRatePercent) ? taxRatePercent : 0;
  const total = subtotal * (1 + safeTax / 100);
  return { subtotal, total };
}

export function parseLineItemsJson(raw: string | null | undefined): InvoiceLineItem[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row): InvoiceLineItem | null => {
        if (!row || typeof row !== "object") return null;
        const o = row as Record<string, unknown>;
        const description =
          typeof o.description === "string" ? o.description : "";
        const quantity = Number(o.quantity);
        const unit_price = Number(o.unit_price);
        if (
          !Number.isFinite(quantity) ||
          !Number.isFinite(unit_price) ||
          quantity < 0 ||
          unit_price < 0
        ) {
          return null;
        }
        return { description, quantity, unit_price };
      })
      .filter((x): x is InvoiceLineItem => x !== null);
  } catch {
    return [];
  }
}
