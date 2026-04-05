import Link from "next/link";
import { redirect } from "next/navigation";

import { AddProposalDialog } from "@/components/crm/add-proposal-dialog";
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
import { proposalStatusLabel } from "@/lib/crm/proposal-statuses";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ProposalWithRelations } from "@/lib/types";

export default async function ProposalsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const [proposalsRes, clientsRes, dealsRes, profileRes] = await Promise.all([
    supabase
      .from("proposals")
      .select("*, clients ( name ), deals ( title )")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("deals").select("id, title, client_id").order("created_at", { ascending: false }),
    supabase.from("profiles").select("currency").eq("id", user.id).maybeSingle(),
  ]);

  if (proposalsRes.error) {
    throw new Error(proposalsRes.error.message);
  }
  if (clientsRes.error) {
    throw new Error(clientsRes.error.message);
  }
  if (dealsRes.error) {
    throw new Error(dealsRes.error.message);
  }

  const rows = (proposalsRes.data ?? []).map((row) => ({
    ...row,
    total_value: Number(row.total_value ?? 0),
  })) as ProposalWithRelations[];

  const clients = clientsRes.data ?? [];
  const deals = dealsRes.data ?? [];
  const defaultCurrency = profileRes.data?.currency ?? "USD";

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {rows.length === 0
              ? "Scope, pricing, and status for each offer."
              : `${rows.length} proposal${rows.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <AddProposalDialog clients={clients} deals={deals} />
      </div>

      {rows.length === 0 ? (
        <div className="border-muted-foreground/25 rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">
            No proposals yet. Create one to track sends and decisions.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((p) => (
              <Card key={p.id}>
                <CardHeader className="space-y-1 p-4 pb-2">
                  <CardTitle className="text-base font-semibold leading-tight">
                    <Link
                      href={`/proposals/${p.id}`}
                      className="text-primary hover:underline"
                    >
                      {p.title}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {p.clients?.name ?? "—"}
                    {p.deals?.title ? ` · ${p.deals.title}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2 p-4 pt-0">
                  <Badge variant="secondary">
                    {proposalStatusLabel(p.status)}
                  </Badge>
                  <span className="text-sm tabular-nums">
                    {formatMoney(p.total_value, defaultCurrency)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(p.created_at)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Client</TableHead>
                  <TableHead className="hidden lg:table-cell">Deal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="hidden xl:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/proposals/${p.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {p.clients?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden lg:table-cell">
                      {p.deals?.title ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {proposalStatusLabel(p.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(p.total_value, defaultCurrency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden xl:table-cell">
                      {formatDate(p.created_at)}
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
