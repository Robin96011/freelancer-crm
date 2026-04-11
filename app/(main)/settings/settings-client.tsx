"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  updateNotificationSettingsAction,
  updateProfileSettingsAction,
} from "@/lib/actions/settings";
import { COMMON_TIMEZONES } from "@/lib/timezones";
import type { Profile } from "@/lib/types";
import { FREELANCER_TYPES } from "@/lib/types";

const CURRENCIES = ["USD", "EUR", "GBP"] as const;

export function SettingsClient({
  profile: initial,
  email,
}: {
  profile: Profile;
  email: string;
}) {
  const router = useRouter();
  const [savePending, startSaveTransition] = useTransition();
  const [notifyPending, startNotifyTransition] = useTransition();

  const [fullName, setFullName] = useState(initial.full_name ?? "");
  const [freelancerType, setFreelancerType] = useState(
    initial.freelancer_type ?? ""
  );
  const [currency, setCurrency] = useState(initial.currency ?? "USD");
  const [timezone, setTimezone] = useState(initial.timezone ?? "UTC");

  const [digest, setDigest] = useState(Boolean(initial.notify_daily_digest));
  const [proposalViewed, setProposalViewed] = useState(
    Boolean(initial.notify_proposal_viewed)
  );
  const [invoiceOverdue, setInvoiceOverdue] = useState(
    Boolean(initial.notify_invoice_overdue)
  );

  useEffect(() => {
    setFullName(initial.full_name ?? "");
    setFreelancerType(initial.freelancer_type ?? "");
    setCurrency(initial.currency ?? "USD");
    setTimezone(initial.timezone ?? "UTC");
    setDigest(Boolean(initial.notify_daily_digest));
    setProposalViewed(Boolean(initial.notify_proposal_viewed));
    setInvoiceOverdue(Boolean(initial.notify_invoice_overdue));
  }, [initial]);

  const timezoneOptions = useMemo(() => {
    const list: string[] = [...COMMON_TIMEZONES];
    const tz = initial.timezone;
    if (tz && !list.includes(tz)) {
      list.unshift(tz);
    }
    return list;
  }, [initial.timezone]);

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    startSaveTransition(async () => {
      const fd = new FormData();
      fd.set("full_name", fullName);
      fd.set("freelancer_type", freelancerType);
      fd.set("currency", currency);
      fd.set("timezone", timezone);
      try {
        await updateProfileSettingsAction(fd);
        toast.success("Profile saved");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not save profile."
        );
      }
    });
  }

  function persistNotifications(next: {
    notify_daily_digest: boolean;
    notify_proposal_viewed: boolean;
    notify_invoice_overdue: boolean;
  }) {
    startNotifyTransition(async () => {
      try {
        await updateNotificationSettingsAction(next);
        toast.success("Notification preference saved");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not save preference."
        );
      }
    });
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="space-y-6">
        <div className="border rounded-lg p-4">
          <h2 className="font-medium mb-3">Profile</h2>
          <form onSubmit={saveProfile} className="space-y-2">
            <input
              placeholder="Full name"
              className="w-full p-2 border rounded mb-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              name="full_name"
              autoComplete="name"
            />
            <input
              placeholder="Email"
              className="w-full p-2 border rounded mb-2 bg-muted"
              value={email}
              readOnly
              title="Email comes from your login (auth). Use your account provider to change it."
            />
            <label className="block text-sm text-muted-foreground mb-1">
              Freelancer type
            </label>
            <select
              className="w-full p-2 border rounded mb-2"
              value={freelancerType}
              onChange={(e) => setFreelancerType(e.target.value)}
            >
              <option value="">Not set</option>
              {FREELANCER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Default currency
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Timezone
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={savePending}
              className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
            >
              {savePending ? "Saving…" : "Save"}
            </button>
          </form>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-medium mb-3">Notifications</h2>
          {notifyPending ? (
            <p className="text-sm text-muted-foreground mb-2">Saving…</p>
          ) : null}
          <label className="flex items-center gap-2 mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={digest}
              disabled={notifyPending}
              onChange={(e) => {
                const checked = e.target.checked;
                setDigest(checked);
                persistNotifications({
                  notify_daily_digest: checked,
                  notify_proposal_viewed: proposalViewed,
                  notify_invoice_overdue: invoiceOverdue,
                });
              }}
            />
            Daily follow-up
          </label>
          <label className="flex items-center gap-2 mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={proposalViewed}
              disabled={notifyPending}
              onChange={(e) => {
                const checked = e.target.checked;
                setProposalViewed(checked);
                persistNotifications({
                  notify_daily_digest: digest,
                  notify_proposal_viewed: checked,
                  notify_invoice_overdue: invoiceOverdue,
                });
              }}
            />
            Proposal viewed notification
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={invoiceOverdue}
              disabled={notifyPending}
              onChange={(e) => {
                const checked = e.target.checked;
                setInvoiceOverdue(checked);
                persistNotifications({
                  notify_daily_digest: digest,
                  notify_proposal_viewed: proposalViewed,
                  notify_invoice_overdue: checked,
                });
              }}
            />
            Invoice overdue reminder
          </label>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-medium mb-3">Account</h2>
          <p className="text-sm text-muted-foreground">
            To upgrade your account, contact us via the platform you purchased this from.
          </p>
        </div>
      </div>
    </div>
  );
}
