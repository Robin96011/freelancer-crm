"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateNotificationSettingsAction } from "@/lib/actions/settings";
import type { Profile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

function toBool(v: boolean | null | undefined): boolean {
  return Boolean(v);
}

export function NotificationsSettingsCard({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [digest, setDigest] = useState(toBool(profile.notify_daily_digest));
  const [proposalViewed, setProposalViewed] = useState(
    toBool(profile.notify_proposal_viewed)
  );
  const [invoiceOverdue, setInvoiceOverdue] = useState(
    toBool(profile.notify_invoice_overdue)
  );

  useEffect(() => {
    setDigest(toBool(profile.notify_daily_digest));
    setProposalViewed(toBool(profile.notify_proposal_viewed));
    setInvoiceOverdue(toBool(profile.notify_invoice_overdue));
  }, [profile]);

  function persist(next: {
    notify_daily_digest: boolean;
    notify_proposal_viewed: boolean;
    notify_invoice_overdue: boolean;
  }) {
    startTransition(async () => {
      try {
        await updateNotificationSettingsAction(next);
        toast.success("Notification preference saved");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not save preference."
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Email alerts (sending requires Resend or another provider to be wired
          in a later step).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {pending ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="notify-digest" className="text-base">
              Daily follow-up digest
            </Label>
            <p className="text-muted-foreground text-sm">
              A morning summary of clients due for follow-up.
            </p>
          </div>
          <Switch
            id="notify-digest"
            checked={digest}
            disabled={pending}
            onCheckedChange={(checked) => {
              setDigest(checked);
              persist({
                notify_daily_digest: checked,
                notify_proposal_viewed: proposalViewed,
                notify_invoice_overdue: invoiceOverdue,
              });
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="notify-proposal" className="text-base">
              Proposal viewed
            </Label>
            <p className="text-muted-foreground text-sm">
              When a proposal status becomes viewed.
            </p>
          </div>
          <Switch
            id="notify-proposal"
            checked={proposalViewed}
            disabled={pending}
            onCheckedChange={(checked) => {
              setProposalViewed(checked);
              persist({
                notify_daily_digest: digest,
                notify_proposal_viewed: checked,
                notify_invoice_overdue: invoiceOverdue,
              });
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="notify-invoice" className="text-base">
              Invoice overdue reminder
            </Label>
            <p className="text-muted-foreground text-sm">
              Reminder when an unpaid invoice passes its due date.
            </p>
          </div>
          <Switch
            id="notify-invoice"
            checked={invoiceOverdue}
            disabled={pending}
            onCheckedChange={(checked) => {
              setInvoiceOverdue(checked);
              persist({
                notify_daily_digest: digest,
                notify_proposal_viewed: proposalViewed,
                notify_invoice_overdue: checked,
              });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
