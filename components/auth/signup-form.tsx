"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  AUTH_RATE_LIMIT_MESSAGE,
  MIN_SUBMIT_INTERVAL_MS,
  POST_EMAIL_SEND_COOLDOWN_MS,
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

function SignupEmailSent({
  email,
  softCooldownUntil,
}: {
  email: string;
  softCooldownUntil: number;
}) {
  const softLeft = useCooldownSecondsUntil(softCooldownUntil);

  return (
    <Card className="w-full max-w-md border-0 shadow-lg sm:border">
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We sent a confirmation link to{" "}
          <strong className="text-foreground">{email}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AuthMessage variant="success" title="Almost there">
          Open the email from us and click <strong>Confirm</strong>. If you
          don’t see it, check spam or promotions. After confirming, return here
          and sign in.
        </AuthMessage>
        {softLeft > 0 ? (
          <AuthMessage variant="info" title="Please wait">
            To avoid rate limits, wait{" "}
            <span className="font-semibold tabular-nums">
              {formatWaitLabel(softLeft)}
            </span>{" "}
            before trying to sign up again with the same email.
          </AuthMessage>
        ) : null}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<{
    email: string;
    softCooldownUntil: number;
  } | null>(null);
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
      return false;
    }
    lastActionAt.current = now;
    return true;
  }

  async function signUpWithGoogle() {
    if (!enforceSpacing()) return;
    if (!appUrl) {
      setError("Set NEXT_PUBLIC_APP_URL in .env.local for Google sign-in.");
      lastActionAt.current = 0;
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
      },
    });
    if (oauthError) {
      setError(mapAuthErrorForUi(oauthError));
      if (isAuthRateLimitError(oauthError)) {
        setCooldownUntil(Date.now() + RATE_LIMIT_COOLDOWN_MS);
      }
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enforceSpacing()) return;
    if (!appUrl) {
      setError(
        "Set NEXT_PUBLIC_APP_URL in .env.local so confirmation and redirect links work."
      );
      lastActionAt.current = 0;
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(appUrl),
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        setError(mapAuthErrorForUi(signUpError));
        if (isAuthRateLimitError(signUpError)) {
          setCooldownUntil(Date.now() + RATE_LIMIT_COOLDOWN_MS);
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setEmailSent({
        email,
        softCooldownUntil: Date.now() + POST_EMAIL_SEND_COOLDOWN_MS,
      });
      setLoading(false);
    } catch (err) {
      setError(mapAuthErrorForUi(err));
      if (isAuthRateLimitError(err)) {
        setCooldownUntil(Date.now() + RATE_LIMIT_COOLDOWN_MS);
      }
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <SignupEmailSent
        email={emailSent.email}
        softCooldownUntil={emailSent.softCooldownUntil}
      />
    );
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
              Creating your account…
            </span>
          </div>
        </div>
      ) : null}

      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Create your free account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <AuthMessage
            variant="error"
            title={
              error === AUTH_RATE_LIMIT_MESSAGE
                ? "Too many attempts"
                : "Couldn’t create account"
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

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              disabled={authBusy}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              disabled={authBusy}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              At least 8 characters.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={authBusy}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : cooldownLeft > 0 ? (
              `Wait ${formatWaitLabel(cooldownLeft)}`
            ) : (
              "Create account"
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
          onClick={signUpWithGoogle}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {cooldownLeft > 0 && !loading
            ? `Wait ${formatWaitLabel(cooldownLeft)}`
            : "Continue with Google"}
        </Button>
        {!appUrl ? (
          <AuthMessage variant="info">
            Add <code className="text-xs">NEXT_PUBLIC_APP_URL</code> to your{" "}
            <code className="text-xs">.env.local</code> (e.g.{" "}
            http://localhost:3000).
          </AuthMessage>
        ) : null}
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <span className="text-muted-foreground">Already have an account?</span>
        <Link href="/auth/login" className="text-primary ml-1 font-medium">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
