import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProposalDetailForm } from "@/components/crm/proposal-detail-form";
import { createClient } from "@/lib/supabase/server";
import type { ProposalWithRelations } from "@/lib/types";

type Props = { params: { id: string } };

export default async function ProposalDetailPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: row, error } = await supabase
    .from("proposals")
    .select("*, clients ( name ), deals ( title )")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !row) {
    notFound();
  }

  const proposal = {
    ...row,
    total_value: Number(row.total_value ?? 0),
  } as ProposalWithRelations;

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
          href="/proposals"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to proposals
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {proposal.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {proposal.clients?.name ?? "Client"}
          {proposal.deals?.title ? ` · ${proposal.deals.title}` : ""}
        </p>
      </div>

      <ProposalDetailForm
        proposal={proposal}
        clients={clientsRes.data}
        deals={dealsRes.data}
      />
    </div>
  );
}
