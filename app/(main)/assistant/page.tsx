import { redirect } from "next/navigation";

import { AiAssistantPanel } from "@/components/crm/ai-assistant-panel";
import { createClient } from "@/lib/supabase/server";

export default async function AssistantPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const configured = Boolean(process.env.ANTHROPIC_API_KEY?.trim());

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Assistant</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Draft emails, summarize clients, and outline proposals using Claude.
          Your inputs are sent to Anthropic only for the request—nothing is
          saved in the CRM database.
        </p>
      </div>

      <AiAssistantPanel configured={configured} />
    </div>
  );
}
