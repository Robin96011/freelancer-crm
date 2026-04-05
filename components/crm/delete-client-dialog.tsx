"use client";

import { useState, useTransition } from "react";

import { deleteClientAction } from "@/lib/actions/clients";
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

export function DeleteClientDialog({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      await deleteClientAction(clientId);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete client?</DialogTitle>
          <DialogDescription>
            This permanently deletes{" "}
            <span className="text-foreground font-medium">{clientName}</span>. This
            cannot be undone; related deals, proposals, invoices, and activities
            are removed with the client.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Deleting…" : "Delete client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
