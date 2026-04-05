/** Allowed AI tasks — must match API route validation. */
export const AI_TASK_IDS = [
  "follow_up_email",
  "client_summary",
  "proposal_outline",
  "meeting_prep",
] as const;

export type AiTaskId = (typeof AI_TASK_IDS)[number];

export function isAiTaskId(id: string): id is AiTaskId {
  return AI_TASK_IDS.includes(id as AiTaskId);
}

export const AI_TASK_LABELS: Record<AiTaskId, string> = {
  follow_up_email: "Follow-up email",
  client_summary: "Client summary",
  proposal_outline: "Proposal outline",
  meeting_prep: "Meeting prep",
};

export const AI_TASK_HINTS: Record<AiTaskId, string> = {
  follow_up_email:
    "Polite follow-up referencing your last touchpoint and a clear next step.",
  client_summary:
    "Short bullets: who they are, goals, risks, and suggested next actions.",
  proposal_outline:
    "Structured sections: context, scope, deliverables, timeline, investment.",
  meeting_prep:
    "Agenda bullets, questions to ask, and objectives for the conversation.",
};

const MAX_INPUT_CHARS = 14_000;

export function clampContext(raw: string): string {
  const t = raw.trim();
  if (t.length <= MAX_INPUT_CHARS) return t;
  return `${t.slice(0, MAX_INPUT_CHARS)}\n\n[…truncated]`;
}

export function buildSystemPrompt(task: AiTaskId): string {
  const base =
    "You are a concise assistant for a solo freelancer using a CRM. Write in clear, professional English. Do not invent facts; if context is missing, say what is missing briefly. No markdown title unless the user asks for a document.";
  const byTask: Record<AiTaskId, string> = {
    follow_up_email:
      "Output a ready-to-send email: subject line on first line as 'Subject: …', then blank line, then body. Keep under ~200 words unless context demands more.",
    client_summary:
      "Use markdown bullet lists. Keep to one screen if possible.",
    proposal_outline:
      "Use clear headings (##) and bullets. Focus on scoping and clarity, not legalese.",
    meeting_prep:
      "Use short bullets grouped under small headings (##).",
  };
  return `${base}\n\n${byTask[task]}`;
}

export function buildUserPrompt(
  task: AiTaskId,
  payload: Record<string, unknown>
): string {
  const safe = (k: string) => {
    const v = payload[k];
    return typeof v === "string" ? clampContext(v) : "";
  };

  switch (task) {
    case "follow_up_email":
      return [
        "Draft a follow-up email.",
        `Client name: ${safe("clientName") || "(not provided)"}`,
        payload.company ? `Company: ${safe("company")}` : "",
        "Context (notes, last conversation, goal):",
        safe("context") || "(no context provided)",
      ]
        .filter(Boolean)
        .join("\n");

    case "client_summary":
      return [
        "Summarize this client for internal use.",
        `Name: ${safe("clientName") || "(not provided)"}`,
        `Tags: ${safe("tags") || "—"}`,
        "Notes:",
        safe("notes") || "(none)",
        payload.extra ? `Extra context:\n${safe("extra")}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    case "proposal_outline":
      return [
        "Create a proposal outline.",
        `Topic / engagement: ${safe("topic") || "(not provided)"}`,
        "Rough notes or requirements:",
        safe("notes") || "(none)",
      ]
        .filter(Boolean)
        .join("\n");

    case "meeting_prep":
      return [
        "Prepare for a client meeting.",
        `Client: ${safe("clientName") || "(not provided)"}`,
        `Meeting focus: ${safe("focus") || "(not provided)"}`,
        "Background notes:",
        safe("notes") || "(none)",
      ]
        .filter(Boolean)
        .join("\n");
  }
}
