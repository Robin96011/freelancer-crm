"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  AUTH_RATE_LIMIT_MESSAGE,
  MIN_SUBMIT_INTERVAL_MS,
  RATE_LIMIT_COOLDOWN_MS,
  formatWaitLabel,
  isAuthRateLimitError,
  mapAuthErrorForUi,
} from "@/lib/auth-errors";
import { getAuthCallbackUrl } from "@/lib/auth/callback-utils";
import { useCooldownSecondsUntil } from "@/lib/auth/use-cooldown-until";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function safeDecodeQueryParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const authError = searchParams.get("error");
  const confirmed =
    searchParams.get("confirmed") === "1" ||
    searchParams.get("type") === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    authError ? safeDecodeQueryParam(authError) : null
  );
  const [info, setInfo] = useState<string | null>(
    confirmed
      ? "You can sign in now with your email and password."
      : null
  );
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  const lastActionAt = useRef(0);
  const cooldownLeft = useCooldownSecondsUntil(cooldownUntil);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const authBusy = loading || cooldownLeft > 0;

  function enforceSpacing(): boolean {
    const now = Date.now();
    if (cooldownUntil && now < cooldownUntil) {
      return false;
    }
    if (now - lastActionAt.current < MIN_SUBMIT_INTERVAL_MS) {
      setError("Please wait a moment before trying again.");
      setInfo(null);
      return false;
    }
    lastActionAt.current = now;
    return true;
  }

  async function signInWithGoogle() {
    if (!enforceSpacing()) return;
    if (!appUrl) {
      setError("Set NEXT_PUBLIC_APP_URL in .env.local for Google sign-in.");
      lastActionAt.current = 0;
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthCallbackUrl(appUrl, next),
      },
    });
    if (oauthError) {
      const msg = mapAuthErrorForUi(oauthError);
      setError(msg);
      if (isAuthRateLimitError(oauthError)) {
        setCooldownUntil(Date.now() + RATE_LIMIT_COOLDOWN_MS);
      }
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enforceSpacing()) return;

    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      const { data, error: signError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (signError) {
        setError(mapAuthErrorForUi(signError));
        if (isAuthRateLimitError(signError)) {
          setCooldownUntil(Date.now() + RATE_LIMIT_COOLDOWN_MS);
        }
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError(
          "We couldn’t start a session. Confirm your email from the signup message if you haven’t yet, then try again."
        );
        setLoading(false);
        return;
      }

      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(mapAuthErrorForUi(err));
      if (isAuthRateLimitError(err)) {
        setCooldownUntil(Date.now() + RATE_LIMIT_COOLDOWN_MS);
      }
      setLoading(false);
    }
  }

  return (
    <Card className="relative w-full max-w-md overflow-hidden border-0 shadow-lg sm:border">
      {loading ? (
        <div
          className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]"
          aria-hidden
        >
          <div className="flex flex-col items-center gap-2 rounded-lg border bg-card px-6 py-4 shadow-sm">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <span className="text-muted-foreground text-xs font-medium">
              Signing in…
            </span>
          </div>
        </div>
      ) : null}

      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Sign in with your email and password, or continue with Google.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <AuthMessage
            variant="error"
            title={
              error === AUTH_RATE_LIMIT_MESSAGE
                ? "Too many attempts"
                : "Something went wrong"
            }
          >
            <span>{error}</span>
            {cooldownLeft > 0 ? (
              <p className="text-muted-foreground mt-2 text-xs">
                Try again in{" "}
                <span className="text-foreground font-semibold tabular-nums">
                  {formatWaitLabel(cooldownLeft)}
                </span>
                .
              </p>
            ) : null}
          </AuthMessage>
        ) : null}
        {info && !error ? (
          <AuthMessage variant="success" title="Ready to sign in">
            {info}
          </AuthMessage>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={authBusy}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              disabled={authBusy}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={authBusy}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : cooldownLeft > 0 ? (
              `Wait ${formatWaitLabel(cooldownLeft)}`
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card text-muted-foreground px-2">Or</span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={authBusy || !appUrl}
          onClick={signInWithGoogle}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {cooldownLeft > 0 && !loading
            ? `Wait ${formatWaitLabel(cooldownLeft)}`
            : "Continue with Google"}
        </Button>
        {!appUrl ? (
          <p className="text-muted-foreground text-center text-xs">
            Set NEXT_PUBLIC_APP_URL in .env.local for Google sign-in.
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:text-center">
        <span className="text-muted-foreground text-sm">
          No account?{" "}
          <Link href="/auth/signup" className="text-primary font-medium">
            Sign up
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
