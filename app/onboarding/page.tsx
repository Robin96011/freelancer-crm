import { completeOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FREELANCER_TYPES } from "@/lib/types";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            What type of freelancer are you? This helps tailor your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={completeOnboarding} className="space-y-6">
            <div className="space-y-3">
              {FREELANCER_TYPES.map((t) => (
                <label
                  key={t.value}
                  className="border-input hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-accent/30 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                  <input
                    type="radio"
                    name="freelancer_type"
                    value={t.value}
                    required
                    className="text-primary focus:ring-ring h-4 w-4"
                  />
                  <span className="text-sm font-medium">{t.label}</span>
                </label>
              ))}
            </div>
<Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
