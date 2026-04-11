"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { createBillingPortalSessionAction } from "@/lib/actions/settings";
import { getPlanLabel, trialDaysRemaining } from "@/lib/settings/billing-display";
import type { Profile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BillingSettingsCard({
  profile,
  stripeConfigured,
}: {
  profile: Profile;
  stripeConfigured: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const plan = getPlanLabel(profile.subscription_status);
  const daysLeft = trialDaysRemaining(profile.trial_ends_at);
  const hasCustomer = Boolean(profile.stripe_customer_id);

  function openPortal() {
    startTransition(async () => {
      try {
        const { url } = await createBillingPortalSessionAction();
        window.location.href = url;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not open billing portal."
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription &amp; billing</CardTitle>
        <CardDescription>
          Your plan and Stripe customer portal when you have a billing account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Current plan</span>
          <Badge variant={plan === "Pro" ? "default" : "secondary"}>
            {plan}
          </Badge>
        </div>

        {plan === "Trial" ? (
          <p className="text-sm">
            <span className="text-muted-foreground">Trial days remaining:</span>{" "}
            <span className="font-medium tabular-nums">{daysLeft}</span>
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" asChild variant="default">
            <Link href="/upgrade">Upgrade to Pro</Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={pending || !stripeConfigured || !hasCustomer}
            onClick={openPortal}
            className="gap-2"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Manage billing
          </Button>
        </div>

        {!stripeConfigured ? (
          <p className="text-muted-foreground text-xs">
            Stripe is not configured on the server (<code className="text-xs">STRIPE_SECRET_KEY</code>
            ).
          </p>
        ) : null}
        {stripeConfigured && !hasCustomer ? (
          <p className="text-muted-foreground text-xs">
            Billing portal is available after you subscribe and a Stripe customer
            ID is stored on your profile.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
