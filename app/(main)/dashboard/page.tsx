import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/data/dashboard";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user.id)
    .maybeSingle();

  const stats = await getDashboardStats(
    supabase,
    user.id,
    profile?.currency ?? "USD"
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Overview of revenue, pipeline, and what needs attention today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Revenue this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {stats.revenueThisMonthLabel}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Won deals created this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Pipeline value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {stats.pipelineValueLabel}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Open stages (lead → negotiation)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Follow-ups due today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {stats.followUpsToday}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Clients with a follow-up date today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Win rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {stats.winRatePercent}%
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Won vs. lost (closed deals)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-medium">Recent activity</h2>
        <Card>
          <CardContent className="p-0">
            {stats.recentActivity.length === 0 ? (
              <p className="text-muted-foreground p-6 text-sm">
                No activity yet. Add clients and log notes to see the feed
                here.
              </p>
            ) : (
              <ul className="divide-y">
                {stats.recentActivity.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {a.type.replace("_", " ")}
                        {a.client_name ? (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            · {a.client_name}
                          </span>
                        ) : null}
                      </p>
                      {a.content ? (
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
                          {a.content}
                        </p>
                      ) : null}
                    </div>
                    <time
                      className="text-muted-foreground shrink-0 text-xs tabular-nums"
                      dateTime={a.created_at}
                    >
                      {formatDateTime(a.created_at)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
