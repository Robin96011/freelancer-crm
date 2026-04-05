import Anthropic from "@anthropic-ai/sdk";

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  return new Anthropic({ apiKey: key });
}

export function defaultClaudeModel(): string {
  return process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022";
}

function textFromContent(
  blocks: Anthropic.Messages.ContentBlock[]
): string {
  return blocks
    .filter(
      (b): b is Anthropic.Messages.TextBlock => b.type === "text"
    )
    .map((b) => b.text)
    .join("");
}

export async function completeClaude(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const client = getClient();
  const model = defaultClaudeModel();

  const message = await client.messages.create({
    model,
    max_tokens: params.maxTokens ?? 4096,
    system: params.system,
    messages: [{ role: "user", content: params.user }],
  });

  return textFromContent(message.content);
}
