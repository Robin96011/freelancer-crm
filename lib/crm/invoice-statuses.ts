export const INVOICE_STATUSES = [
  { id: "unpaid", label: "Unpaid" },
  { id: "paid", label: "Paid" },
  { id: "overdue", label: "Overdue" },
] as const;

export type InvoiceStatusId = (typeof INVOICE_STATUSES)[number]["id"];

export const INVOICE_STATUS_IDS: InvoiceStatusId[] = INVOICE_STATUSES.map(
  (s) => s.id
);

export function isInvoiceStatus(id: string): id is InvoiceStatusId {
  return INVOICE_STATUS_IDS.includes(id as InvoiceStatusId);
}

export function invoiceStatusLabel(id: string): string {
  return INVOICE_STATUSES.find((s) => s.id === id)?.label ?? id;
}
