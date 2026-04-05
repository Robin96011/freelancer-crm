import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UpgradePage() {
  return (
    <main className="bg-muted/30 flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Your trial has ended</CardTitle>
          <CardDescription>
            Subscribe to keep using Freelancer CRM. Stripe checkout will be
            connected in a later step ($49/month or $399/year).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            You can still sign out and sign back in after subscribing once
            billing is enabled.
          </p>
          <Button className="w-full" disabled>
            Upgrade with Stripe (coming soon)
          </Button>
        </CardContent>
        <CardFooter className="flex justify-between gap-4 border-t pt-6">
          <SignOutButton />
          <Button variant="link" asChild>
            <Link href="/">Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
