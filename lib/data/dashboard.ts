import type { SupabaseClient } from "@supabase/supabase-js";

import { formatMoney } from "@/lib/format";

export type DashboardActivity = {
  id: string;
  type: string;
  content: string | null;
  created_at: string;
  client_name: string | null;
};

export type DashboardStats = {
  revenueThisMonth: number;
  revenueThisMonthLabel: string;
  pipelineValue: number;
  pipelineValueLabel: string;
  followUpsToday: number;
  winRatePercent: number;
  currency: string;
  recentActivity: DashboardActivity[];
};

function startOfMonthUtc(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

export async function getDashboardStats(
  supabase: SupabaseClient,
  userId: string,
  defaultCurrency: string
): Promise<DashboardStats> {
  const monthStart = startOfMonthUtc().toISOString();

  const [
    wonThisMonth,
    pipelineDeals,
    followUpsRes,
    wonCount,
    lostCount,
    activitiesRaw,
  ] = await Promise.all([
    supabase
      .from("deals")
      .select("value, currency")
      .eq("user_id", userId)
      .eq("stage", "won")
      .gte("created_at", monthStart),
    supabase
      .from("deals")
      .select("value, currency")
      .eq("user_id", userId)
      .in("stage", ["lead", "proposal", "negotiation"]),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .gte("next_follow_up", startOfTodayIso())
      .lte("next_follow_up", endOfTodayIso()),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("stage", "won"),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("stage", "lost"),
    supabase
      .from("activities")
      .select("id, type, content, created_at, client_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const currency = defaultCurrency || "USD";

  const revenueSum =
    wonThisMonth.data?.reduce((acc, row) => acc + Number(row.value ?? 0), 0) ??
    0;

  const pipelineSum =
    pipelineDeals.data?.reduce((acc, row) => acc + Number(row.value ?? 0), 0) ??
    0;

  const won = wonCount.count ?? 0;
  const lost = lostCount.count ?? 0;
  const decided = won + lost;
  const winRatePercent = decided === 0 ? 0 : Math.round((won / decided) * 100);

  const actRows = activitiesRaw.data ?? [];
  const clientIds = Array.from(
    new Set(
      actRows
        .map((r) => r.client_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );
  const clientNameById = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: clientRows } = await supabase
      .from("clients")
      .select("id, name")
      .in("id", clientIds);
    clientRows?.forEach((c) => clientNameById.set(c.id, c.name));
  }

  const recentActivity: DashboardActivity[] = actRows.map((row) => ({
    id: row.id,
    type: row.type,
    content: row.content,
    created_at: row.created_at,
    client_name: row.client_id
      ? clientNameById.get(row.client_id) ?? null
      : null,
  }));

  return {
    revenueThisMonth: revenueSum,
    revenueThisMonthLabel: formatMoney(revenueSum, currency),
    pipelineValue: pipelineSum,
    pipelineValueLabel: formatMoney(pipelineSum, currency),
    followUpsToday: followUpsRes.count ?? 0,
    winRatePercent,
    currency,
    recentActivity,
  };
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfTodayIso(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
