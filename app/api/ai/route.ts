import { NextResponse } from "next/server";

import { completeClaude } from "@/lib/ai/claude";
import {
  buildSystemPrompt,
  buildUserPrompt,
  isAiTaskId,
  type AiTaskId,
} from "@/lib/ai/tasks";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  return NextResponse.json({ ok: true, configured });
}

type Body = {
  task?: string;
  payload?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return NextResponse.json(
      {
        error:
          "AI is not configured. Add ANTHROPIC_API_KEY to your environment.",
      },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const task = body.task;
  if (!task || !isAiTaskId(task)) {
    return NextResponse.json({ error: "Invalid or missing task" }, { status: 400 });
  }

  const payload =
    body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
      ? body.payload
      : {};

  const taskId = task as AiTaskId;

  try {
    const system = buildSystemPrompt(taskId);
    const userPrompt = buildUserPrompt(taskId, payload);
    const text = await completeClaude({
      system,
      user: userPrompt,
      maxTokens: taskId === "follow_up_email" ? 2048 : 4096,
    });

    return NextResponse.json({ text });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Claude request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
