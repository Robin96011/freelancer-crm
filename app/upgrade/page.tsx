import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function UpgradePage() {
  return (
    <main className="bg-muted/30 flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Upgrade your account</CardTitle>
          <CardDescription>
            Contact us to get full access to Freelancer CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Reach out via the platform you purchased this from and we will
            activate your account within 24 hours.
          </p>
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
