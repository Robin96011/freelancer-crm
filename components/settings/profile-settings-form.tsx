"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateProfileSettingsAction } from "@/lib/actions/settings";
import { COMMON_TIMEZONES } from "@/lib/timezones";
import type { Profile } from "@/lib/types";
import { FREELANCER_TYPES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const CURRENCIES = ["USD", "EUR", "GBP"] as const;

export function ProfileSettingsForm({
  profile,
  email,
}: {
  profile: Profile;
  email: string;
}) {
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [freelancerType, setFreelancerType] = useState(
    profile.freelancer_type ?? ""
  );
  const [currency, setCurrency] = useState(profile.currency ?? "USD");
  const [timezone, setTimezone] = useState(profile.timezone ?? "UTC");

  useEffect(() => {
    setFullName(profile.full_name ?? "");
    setFreelancerType(profile.freelancer_type ?? "");
    setCurrency(profile.currency ?? "USD");
    setTimezone(profile.timezone ?? "UTC");
  }, [profile]);

  const timezoneOptions = useMemo(() => {
    const list: string[] = [...COMMON_TIMEZONES];
    const tz = profile.timezone;
    if (tz && !list.includes(tz)) {
      list.unshift(tz);
    }
    return list;
  }, [profile.timezone]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      fd.set("full_name", fullName);
      fd.set("freelancer_type", freelancerType);
      fd.set("currency", currency);
      fd.set("timezone", timezone);
      try {
        await updateProfileSettingsAction(fd);
        toast.success("Profile saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save profile.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Your name and preferences used across the CRM.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              readOnly
              className="bg-muted"
              aria-describedby="email-hint"
            />
            <p id="email-hint" className="text-muted-foreground text-xs">
              Email is tied to your login. Change it from your auth provider if
              supported.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Freelancer type</Label>
            <Select
              value={freelancerType || "none"}
              onValueChange={(v) => setFreelancerType(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                {FREELANCER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Default currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timezoneOptions.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={pending} className="gap-2">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
