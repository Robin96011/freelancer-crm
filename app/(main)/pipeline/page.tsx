import { redirect } from "next/navigation";

import { AddDealDialog } from "@/components/crm/add-deal-dialog";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { createClient } from "@/lib/supabase/server";
import type { DealWithClient } from "@/lib/types";

export default async function PipelinePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const [dealsRes, clientsRes, profileRes] = await Promise.all([
    supabase
      .from("deals")
      .select("*, clients ( name )")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("profiles").select("currency").eq("id", user.id).maybeSingle(),
  ]);

  if (dealsRes.error) {
    throw new Error(dealsRes.error.message);
  }
  if (clientsRes.error) {
    throw new Error(clientsRes.error.message);
  }

  const deals = (dealsRes.data ?? []).map((row) => ({
    ...row,
    value: Number(row.value ?? 0),
    probability: Number(row.probability ?? 0),
  })) as DealWithClient[];

  const clientOptions = clientsRes.data ?? [];
  const defaultCurrency = profileRes.data?.currency ?? "USD";

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Drag deals between stages. Values use your profile currency for new
            deals.
          </p>
        </div>
        <AddDealDialog
          clients={clientOptions}
          defaultCurrency={defaultCurrency}
        />
      </div>

      <PipelineBoard deals={deals} />
    </div>
  );
}
