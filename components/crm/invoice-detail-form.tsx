"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  deleteInvoiceAction,
  setInvoicePaidAction,
  updateInvoiceAction,
} from "@/lib/actions/invoices";
import { INVOICE_STATUSES } from "@/lib/crm/invoice-statuses";
import { normalizeLineItems } from "@/lib/invoice/normalize-line-items";
import type { InvoiceWithClient } from "@/lib/types";
import { InvoiceLineEditor } from "@/components/crm/invoice-line-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatDateTime, formatMoney, toDateInputValue } from "@/lib/format";

type ClientOption = { id: string; name: string };
type DealOption = { id: string; title: string; client_id: string };

export function InvoiceDetailForm({
  invoice,
  clients,
  deals,
}: {
  invoice: InvoiceWithClient;
  clients: ClientOption[];
  deals: DealOption[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(invoice.client_id);
  const [taxRate, setTaxRate] = useState(Number(invoice.tax_rate ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [paidPending, setPaidPending] = useState(false);

  const lines = useMemo(
    () => normalizeLineItems(invoice.line_items),
    [invoice.line_items]
  );

  const dealChoices = useMemo(
    () => (clientId ? deals.filter((d) => d.client_id === clientId) : []),
    [clientId, deals]
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateInvoiceAction(invoice.id, formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("Delete this invoice permanently?")) return;
    setDeletePending(true);
    setError(null);
    try {
      await deleteInvoiceAction(invoice.id);
      router.push("/invoices");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setDeletePending(false);
    }
  }

  async function togglePaid() {
    setPaidPending(true);
    setError(null);
    try {
      await setInvoicePaidAction(invoice.id, invoice.status !== "paid");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setPaidPending(false);
    }
  }

  const currency = invoice.currency || "USD";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">
            {invoice.invoice_number} · {formatMoney(invoice.total, currency)}{" "}
            total
          </p>
          {invoice.paid_at ? (
            <p className="text-muted-foreground mt-1 text-xs">
              Paid {formatDateTime(invoice.paid_at)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status !== "paid" ? (
            <Button
              type="button"
              onClick={togglePaid}
              disabled={paidPending}
            >
              {paidPending ? "Updating…" : "Mark as paid"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={togglePaid}
              disabled={paidPending}
            >
              {paidPending ? "Updating…" : "Mark as unpaid"}
            </Button>
          )}
        </div>
      </div>

      <form className="space-y-8" onSubmit={onSubmit}>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <input type="hidden" name="currency" value={currency} />
        <input type="hidden" name="tax_rate" value={String(taxRate)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inv-edit-client">Client *</Label>
            <select
              id="inv-edit-client"
              name="client_id"
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-edit-deal">Deal (optional)</Label>
            <select
              id="inv-edit-deal"
              name="deal_id"
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
              defaultValue={invoice.deal_id ?? ""}
              disabled={!clientId}
            >
              <option value="">None</option>
              {dealChoices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inv-edit-tax">Tax rate (%)</Label>
            <Input
              id="inv-edit-tax"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={taxRate}
              onChange={(e) =>
                setTaxRate(Number.parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-edit-due">Due date</Label>
            <Input
              id="inv-edit-due"
              name="due_date"
              type="date"
              defaultValue={toDateInputValue(invoice.due_date)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <select
            name="status"
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
            defaultValue={invoice.status}
          >
            {INVOICE_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <InvoiceLineEditor
          key={invoice.id}
          initialLines={lines.length ? lines : [{ description: "", quantity: 1, unit_price: 0 }]}
          taxRate={taxRate}
          currency={currency}
        />

        <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
          <span>Subtotal {formatMoney(invoice.subtotal, currency)}</span>
          <span>Tax {Number(invoice.tax_rate ?? 0)}%</span>
          <span>Created {formatDate(invoice.created_at)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deletePending}
            onClick={onDelete}
          >
            {deletePending ? "Deleting…" : "Delete invoice"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/invoices">Back to invoices</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
