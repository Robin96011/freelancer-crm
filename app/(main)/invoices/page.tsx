import Link from "next/link";
import { redirect } from "next/navigation";

import { AddInvoiceDialog } from "@/components/crm/add-invoice-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { invoiceBadgeLabel, invoiceBadgeVariant } from "@/lib/crm/invoice-display";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceWithClient } from "@/lib/types";

export default async function InvoicesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const [invoicesRes, clientsRes, dealsRes, profileRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, clients ( name )")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("deals").select("id, title, client_id").order("created_at", { ascending: false }),
    supabase.from("profiles").select("currency").eq("id", user.id).maybeSingle(),
  ]);

  if (invoicesRes.error) {
    throw new Error(invoicesRes.error.message);
  }
  if (clientsRes.error) {
    throw new Error(clientsRes.error.message);
  }
  if (dealsRes.error) {
    throw new Error(dealsRes.error.message);
  }

  const rows = (invoicesRes.data ?? []).map((row) => ({
    ...row,
    subtotal: Number(row.subtotal ?? 0),
    tax_rate: Number(row.tax_rate ?? 0),
    total: Number(row.total ?? 0),
  })) as InvoiceWithClient[];

  const clients = clientsRes.data ?? [];
  const deals = dealsRes.data ?? [];
  const defaultCurrency = profileRes.data?.currency ?? "USD";

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {rows.length === 0
              ? "Line items, tax, and payment status."
              : `${rows.length} invoice${rows.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <AddInvoiceDialog
          clients={clients}
          deals={deals}
          defaultCurrency={defaultCurrency}
        />
      </div>

      {rows.length === 0 ? (
        <div className="border-muted-foreground/25 rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">
            No invoices yet. Numbers are assigned as INV-0001, INV-0002, …
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((inv) => (
              <Card key={inv.id}>
                <CardHeader className="space-y-1 p-4 pb-2">
                  <CardTitle className="text-base font-semibold leading-tight">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-primary hover:underline"
                    >
                      {inv.invoice_number}
                    </Link>
                  </CardTitle>
                  <CardDescription>{inv.clients?.name ?? "—"}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2 p-4 pt-0">
                  <Badge variant={invoiceBadgeVariant(inv)}>
                    {invoiceBadgeLabel(inv)}
                  </Badge>
                  <span className="text-sm font-medium tabular-nums">
                    {formatMoney(inv.total, inv.currency || defaultCurrency)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Due {formatDate(inv.due_date)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="hidden sm:table-cell">Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden lg:table-cell">Due</TableHead>
                  <TableHead className="hidden xl:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {inv.clients?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoiceBadgeVariant(inv)}>
                        {invoiceBadgeLabel(inv)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(inv.total, inv.currency || defaultCurrency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden lg:table-cell">
                      {formatDate(inv.due_date)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden xl:table-cell">
                      {formatDate(inv.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
