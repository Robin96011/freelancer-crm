import Link from "next/link";
import { redirect } from "next/navigation";

import { AddClientDialog } from "@/components/crm/add-client-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

function likePattern(raw: string) {
  const escaped = raw
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  return `%${escaped}%`;
}

export default async function ClientsPage({ searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const qRaw = searchParams.q;
  const tagRaw = searchParams.tag;
  const q = typeof qRaw === "string" ? qRaw.trim() : "";
  const tag = typeof tagRaw === "string" ? tagRaw.trim() : "";

  let query = supabase.from("clients").select("*").order("created_at", {
    ascending: false,
  });

  if (q.length > 0) {
    const p = likePattern(q);
    query = query.or(
      `name.ilike.${p},email.ilike.${p},company.ilike.${p}`
    );
  }

  if (tag.length > 0) {
    query = query.contains("tags", [tag]);
  }

  const { data: clients, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const { data: allTagRows } = await supabase
    .from("clients")
    .select("tags");

  const tagSet = new Set<string>();
  allTagRows?.forEach((row) => {
    row.tags?.forEach((t: string) => tagSet.add(t));
  });
  const allTags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));

  const clientRows = (clients ?? []) as Client[];
  const total = clientRows.length;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {total === 0 && !q && !tag
              ? "Manage contacts, tags, and follow-ups."
              : `${total} client${total === 1 ? "" : "s"}${q || tag ? " match your filters" : ""}`}
          </p>
        </div>
        <AddClientDialog />
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <form
          className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center"
          method="get"
          action="/clients"
        >
          <Input
            name="q"
            placeholder="Search name, email, company…"
            defaultValue={q}
            className="flex-1"
          />
          {tag ? <input type="hidden" name="tag" value={tag} /> : null}
          <div className="flex gap-2">
            <Button type="submit" variant="secondary">
              Search
            </Button>
            {q || tag ? (
              <Button variant="outline" asChild>
                <Link href="/clients">Clear</Link>
              </Button>
            ) : null}
          </div>
        </form>
        {allTags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Tags:</span>
            <Button variant={tag ? "outline" : "secondary"} size="sm" asChild>
              <Link href="/clients">All</Link>
            </Button>
            {allTags.map((t) => (
              <Button
                key={t}
                variant={tag === t ? "secondary" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={
                    q
                      ? `/clients?${new URLSearchParams({ q, tag: t }).toString()}`
                      : `/clients?tag=${encodeURIComponent(t)}`
                  }
                >
                  {t}
                </Link>
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {!total ? (
        <div className="border-muted-foreground/25 rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">
            {q || tag
              ? "No clients match your filters."
              : "No clients yet. Add your first client to get started."}
          </p>
          {!q && !tag ? (
            <div className="mt-4 flex justify-center">
              <AddClientDialog />
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {clientRows.map((c) => (
              <Card key={c.id}>
                <CardHeader className="space-y-1 p-4 pb-2">
                  <CardTitle className="text-base font-semibold leading-tight">
                    <Link
                      href={`/clients/${c.id}`}
                      className="text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {[c.company, c.email].filter(Boolean).join(" · ") || "—"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0">
                  {(c.tags?.length ?? 0) > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {(c.tags ?? []).map((t) => (
                        <Badge key={t} variant="secondary">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <p className="text-muted-foreground text-xs">
                    Next follow-up: {formatDate(c.next_follow_up)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Company</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Tags</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Next follow-up
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientRows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        href={`/clients/${c.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {c.company ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {c.email ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags ?? []).slice(0, 4).map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                        {(c.tags?.length ?? 0) > 4 ? (
                          <span className="text-muted-foreground text-xs">
                            +{c.tags!.length - 4}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden xl:table-cell">
                      {formatDate(c.next_follow_up)}
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
