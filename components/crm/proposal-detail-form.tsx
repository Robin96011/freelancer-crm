"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  deleteProposalAction,
  updateProposalAction,
} from "@/lib/actions/proposals";
import { PROPOSAL_STATUSES } from "@/lib/crm/proposal-statuses";
import type { ProposalWithRelations } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClientOption = { id: string; name: string };
type DealOption = { id: string; title: string; client_id: string };

export function ProposalDetailForm({
  proposal,
  clients,
  deals,
}: {
  proposal: ProposalWithRelations;
  clients: ClientOption[];
  deals: DealOption[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(proposal.client_id);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const dealChoices = useMemo(
    () =>
      clientId ? deals.filter((d) => d.client_id === clientId) : [],
    [clientId, deals]
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateProposalAction(proposal.id, formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("Delete this proposal permanently?")) return;
    setDeletePending(true);
    setError(null);
    try {
      await deleteProposalAction(proposal.id);
      router.push("/proposals");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-prop-client">Client *</Label>
          <select
            id="edit-prop-client"
            name="client_id"
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-prop-deal">Deal (optional)</Label>
          <select
            id="edit-prop-deal"
            name="deal_id"
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
            defaultValue={proposal.deal_id ?? ""}
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

      <div className="space-y-2">
        <Label htmlFor="edit-prop-title">Title *</Label>
        <Input
          id="edit-prop-title"
          name="title"
          required
          defaultValue={proposal.title}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-prop-total">Total value</Label>
          <Input
            id="edit-prop-total"
            name="total_value"
            type="number"
            min={0}
            step="0.01"
            defaultValue={Number(proposal.total_value ?? 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-prop-status">Status</Label>
          <select
            id="edit-prop-status"
            name="status"
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
            defaultValue={proposal.status}
          >
            {PROPOSAL_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-prop-content">Scope / notes</Label>
        <textarea
          id="edit-prop-content"
          name="content"
          rows={12}
          defaultValue={proposal.content ?? ""}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[200px] w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
        />
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
        {proposal.sent_at ? (
          <span>Sent: {new Date(proposal.sent_at).toLocaleString()}</span>
        ) : null}
        {proposal.viewed_at ? (
          <span>Viewed: {new Date(proposal.viewed_at).toLocaleString()}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={deletePending}
          onClick={onDelete}
        >
          {deletePending ? "Deleting…" : "Delete proposal"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/proposals">Back to proposals</Link>
        </Button>
      </div>
    </form>
  );
}
