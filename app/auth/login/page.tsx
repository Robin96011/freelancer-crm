import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="bg-muted/30 flex min-h-screen items-center justify-center p-6">
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">Loading sign-in…</p>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
