import { invoiceStatusLabel } from "@/lib/crm/invoice-statuses";

export function invoiceBadgeLabel(inv: {
  status: string;
  due_date: string | null;
}): string {
  if (inv.status === "paid") return "Paid";
  if (inv.status === "overdue") return "Overdue";
  if (inv.status === "unpaid" && inv.due_date) {
    const due = new Date(inv.due_date);
    if (Number.isNaN(due.getTime())) return invoiceStatusLabel(inv.status);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    if (due < today) return "Overdue";
  }
  return invoiceStatusLabel(inv.status);
}

export function invoiceBadgeVariant(
  inv: { status: string; due_date: string | null }
): "default" | "secondary" | "destructive" | "outline" {
  const label = invoiceBadgeLabel(inv);
  if (label === "Paid") return "secondary";
  if (label === "Overdue") return "destructive";
  return "outline";
}
