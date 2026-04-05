"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createProposalAction } from "@/lib/actions/proposals";
import { PROPOSAL_STATUSES } from "@/lib/crm/proposal-statuses";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClientOption = { id: string; name: string };
type DealOption = { id: string; title: string; client_id: string };

export function AddProposalDialog({
  clients,
  deals,
}: {
  clients: ClientOption[];
  deals: DealOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const dealChoices = useMemo(
    () =>
      clientId
        ? deals.filter((d) => d.client_id === clientId)
        : [],
    [clientId, deals]
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await createProposalAction(formData);
      setOpen(false);
      e.currentTarget.reset();
      setClientId("");
      router.push(`/proposals/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">New proposal</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {clients.length === 0 ? (
          <>
            <DialogHeader>
              <DialogTitle>New proposal</DialogTitle>
              <DialogDescription>
                Add a client first, then you can attach proposals.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" asChild>
                <Link href="/clients">Go to clients</Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>New proposal</DialogTitle>
              <DialogDescription>
                Draft scope and pricing. You can refine the content on the next
                screen.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="prop-client">Client *</Label>
                <select
                  id="prop-client"
                  name="client_id"
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                >
                  <option value="">Select client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-deal">Deal (optional)</Label>
                <select
                  id="prop-deal"
                  name="deal_id"
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                  defaultValue=""
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
              <div className="space-y-2">
                <Label htmlFor="prop-title">Title *</Label>
                <Input id="prop-title" name="title" required placeholder="Proposal title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-total">Total value</Label>
                <Input
                  id="prop-total"
                  name="total_value"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-status">Status</Label>
                <select
                  id="prop-status"
                  name="status"
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                  defaultValue="draft"
                >
                  {PROPOSAL_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-content">Notes / scope</Label>
                <textarea
                  id="prop-content"
                  name="content"
                  rows={5}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                  placeholder="Outline deliverables, timeline, assumptions…"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create proposal"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
