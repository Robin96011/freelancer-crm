import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Freelancer CRM
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
          One simple place for clients, pipeline, proposals, and invoices —
          built for solo consultants and freelancers.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/auth/signup">Get started</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth/login">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
