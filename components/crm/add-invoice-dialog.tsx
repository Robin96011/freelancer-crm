"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createInvoiceAction } from "@/lib/actions/invoices";
import { INVOICE_STATUSES } from "@/lib/crm/invoice-statuses";
import { InvoiceLineEditor } from "@/components/crm/invoice-line-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClientOption = { id: string; name: string };
type DealOption = { id: string; title: string; client_id: string };

export function AddInvoiceDialog({
  clients,
  deals,
  defaultCurrency,
}: {
  clients: ClientOption[];
  deals: DealOption[];
  defaultCurrency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const currency = defaultCurrency || "USD";

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
      const result = await createInvoiceAction(formData);
      setOpen(false);
      e.currentTarget.reset();
      setClientId("");
      setTaxRate(0);
      router.push(`/invoices/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">New invoice</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {clients.length === 0 ? (
          <>
            <DialogHeader>
              <DialogTitle>New invoice</DialogTitle>
              <DialogDescription>
                Add a client before creating invoices.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" asChild>
                <Link href="/clients">Go to clients</Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>New invoice</DialogTitle>
              <DialogDescription>
                Line items and tax roll up to the total. Number is assigned
                automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
              <input type="hidden" name="currency" value={currency} />
              <input type="hidden" name="tax_rate" value={String(taxRate)} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="inv-client">Client *</Label>
                  <select
                    id="inv-client"
                    name="client_id"
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                  >
                    <option value="">Select client…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-deal">Deal (optional)</Label>
                  <select
                    id="inv-deal"
                    name="deal_id"
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                    defaultValue=""
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
                  <Label htmlFor="inv-tax">Tax rate (%)</Label>
                  <Input
                    id="inv-tax"
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
                  <Label htmlFor="inv-due">Due date</Label>
                  <Input id="inv-due" name="due_date" type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  name="status"
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                  defaultValue="unpaid"
                >
                  {INVOICE_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <InvoiceLineEditor
                initialLines={[]}
                taxRate={taxRate}
                currency={currency}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create invoice"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
