"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createDealAction } from "@/lib/actions/deals";
import { PIPELINE_STAGES } from "@/lib/crm/pipeline-stages";
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

export function AddDealDialog({
  clients,
  defaultCurrency,
}: {
  clients: ClientOption[];
  defaultCurrency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createDealAction(formData);
      setOpen(false);
      e.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  const currency = defaultCurrency || "USD";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">New deal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {clients.length === 0 ? (
          <>
            <DialogHeader>
              <DialogTitle>New deal</DialogTitle>
              <DialogDescription>
                Add at least one client before you can create a deal.
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
              <DialogTitle>New deal</DialogTitle>
              <DialogDescription>
                Link a deal to a client and track it on the board.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
              <input type="hidden" name="currency" value={currency} />
              <div className="space-y-2">
                <Label htmlFor="deal-client">Client *</Label>
                <select
                  id="deal-client"
                  name="client_id"
                  required
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select client…
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deal-title">Title *</Label>
                <Input
                  id="deal-title"
                  name="title"
                  required
                  placeholder="e.g. Website redesign"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="deal-value">Value</Label>
                  <Input
                    id="deal-value"
                    name="value"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-probability">Win %</Label>
                  <Input
                    id="deal-probability"
                    name="probability"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deal-stage">Stage</Label>
                <select
                  id="deal-stage"
                  name="stage"
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                  defaultValue="lead"
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
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
                {pending ? "Creating…" : "Create deal"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
