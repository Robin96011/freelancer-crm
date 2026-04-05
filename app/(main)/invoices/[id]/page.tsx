import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { InvoiceDetailForm } from "@/components/crm/invoice-detail-form";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceWithClient } from "@/lib/types";

type Props = { params: { id: string } };

export default async function InvoiceDetailPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: row, error } = await supabase
    .from("invoices")
    .select("*, clients ( name )")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !row) {
    notFound();
  }

  const invoice = {
    ...row,
    subtotal: Number(row.subtotal ?? 0),
    tax_rate: Number(row.tax_rate ?? 0),
    total: Number(row.total ?? 0),
  } as InvoiceWithClient;

  const [clientsRes, dealsRes] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("deals").select("id, title, client_id").order("created_at", { ascending: false }),
  ]);

  if (clientsRes.error || !clientsRes.data) {
    throw new Error(clientsRes.error?.message ?? "Clients failed to load.");
  }
  if (dealsRes.error || !dealsRes.data) {
    throw new Error(dealsRes.error?.message ?? "Deals failed to load.");
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link
          href="/invoices"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to invoices
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {invoice.invoice_number}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {invoice.clients?.name ?? "Client"}
        </p>
      </div>

      <InvoiceDetailForm
        invoice={invoice}
        clients={clientsRes.data}
        deals={dealsRes.data}
      />
    </div>
  );
}
