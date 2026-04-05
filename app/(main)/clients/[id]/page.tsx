import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DeleteClientDialog } from "@/components/crm/delete-client-dialog";
import { EditClientDialog } from "@/components/crm/edit-client-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Activity, Client } from "@/lib/types";

type Props = { params: { id: string } };

export default async function ClientDetailPage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !client) {
    notFound();
  }

  const c = client as Client;

  const { data: activities } = await supabase
    .from("activities")
    .select("*")
    .eq("client_id", params.id)
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link
          href="/clients"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to clients
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {c.company ? <span>{c.company}</span> : null}
          {c.email ? <span>{c.email}</span> : null}
          {c.phone ? <span>{c.phone}</span> : null}
        </div>
        {(c.tags?.length ?? 0) > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {c.tags!.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <EditClientDialog client={c} />
          <DeleteClientDialog clientId={c.id} clientName={c.name} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Next follow-up</p>
              <p className="font-medium">{formatDate(c.next_follow_up)}</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground mb-1">Notes</p>
              <p className="whitespace-pre-wrap">
                {c.notes?.trim() ? c.notes : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Interaction history</CardTitle>
          </CardHeader>
          <CardContent>
            {!activities?.length ? (
              <p className="text-muted-foreground text-sm">
                No logged interactions yet. Activity from emails, calls, and
                notes will appear here in future steps.
              </p>
            ) : (
              <ul className="space-y-4">
                {(activities as Activity[]).map((a) => (
                  <li key={a.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm font-medium capitalize">
                        {a.type.replace("_", " ")}
                      </span>
                      <time
                        className="text-muted-foreground shrink-0 text-xs tabular-nums"
                        dateTime={a.created_at}
                      >
                        {formatDateTime(a.created_at)}
                      </time>
                    </div>
                    {a.content ? (
                      <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm">
                        {a.content}
                      </p>
                    ) : null}
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
