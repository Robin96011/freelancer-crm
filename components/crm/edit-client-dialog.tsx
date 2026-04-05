"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateClientAction } from "@/lib/actions/clients";
import { toDatetimeLocalValue } from "@/lib/format";
import type { Client } from "@/lib/types";
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

export function EditClientDialog({ client }: { client: Client }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const tagsDefault = (client.tags ?? []).join(", ");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateClientAction(client.id, formData);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setFormKey((k) => k + 1);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form key={formKey} onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
            <DialogDescription>
              Update contact details. Tags are comma-separated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor={`edit-name-${client.id}`}>Name *</Label>
              <Input
                id={`edit-name-${client.id}`}
                name="name"
                required
                autoComplete="name"
                defaultValue={client.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-email-${client.id}`}>Email</Label>
              <Input
                id={`edit-email-${client.id}`}
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={client.email ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`edit-phone-${client.id}`}>Phone</Label>
                <Input
                  id={`edit-phone-${client.id}`}
                  name="phone"
                  type="tel"
                  defaultValue={client.phone ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-company-${client.id}`}>Company</Label>
                <Input
                  id={`edit-company-${client.id}`}
                  name="company"
                  defaultValue={client.company ?? ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-tags-${client.id}`}>Tags</Label>
              <Input
                id={`edit-tags-${client.id}`}
                name="tags"
                placeholder="e.g. lead, saas, priority"
                defaultValue={tagsDefault}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-next-${client.id}`}>Next follow-up</Label>
              <Input
                id={`edit-next-${client.id}`}
                name="next_follow_up"
                type="datetime-local"
                defaultValue={toDatetimeLocalValue(client.next_follow_up)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-notes-${client.id}`}>Notes</Label>
              <textarea
                id={`edit-notes-${client.id}`}
                name="notes"
                rows={3}
                defaultValue={client.notes ?? ""}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
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
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
