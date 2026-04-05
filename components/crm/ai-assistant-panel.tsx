"use client";

import { useCallback, useState } from "react";
import { Copy, Loader2, Sparkles } from "lucide-react";

import {
  AI_TASK_HINTS,
  AI_TASK_IDS,
  AI_TASK_LABELS,
  type AiTaskId,
} from "@/lib/ai/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AiAssistantPanel({ configured }: { configured: boolean }) {
  const [task, setTask] = useState<AiTaskId>("follow_up_email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const [followUp, setFollowUp] = useState({
    clientName: "",
    company: "",
    context: "",
  });
  const [summary, setSummary] = useState({
    clientName: "",
    tags: "",
    notes: "",
    extra: "",
  });
  const [proposal, setProposal] = useState({ topic: "", notes: "" });
  const [meeting, setMeeting] = useState({
    clientName: "",
    focus: "",
    notes: "",
  });

  const buildPayload = useCallback((): Record<string, string> => {
    switch (task) {
      case "follow_up_email":
        return {
          clientName: followUp.clientName,
          company: followUp.company,
          context: followUp.context,
        };
      case "client_summary":
        return {
          clientName: summary.clientName,
          tags: summary.tags,
          notes: summary.notes,
          extra: summary.extra,
        };
      case "proposal_outline":
        return { topic: proposal.topic, notes: proposal.notes };
      case "meeting_prep":
        return {
          clientName: meeting.clientName,
          focus: meeting.focus,
          notes: meeting.notes,
        };
      default: {
        const _x: never = task;
        return _x;
      }
    }
  }, [task, followUp, summary, proposal, meeting]);

  async function onGenerate() {
    setError(null);
    setOutput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, payload: buildPayload() }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }
      if (!data.text) {
        throw new Error("Empty response");
      }
      setOutput(data.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        {!configured ? (
          <div
            className="border-destructive/50 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm"
            role="status"
          >
            Add <code className="text-xs">ANTHROPIC_API_KEY</code> to{" "}
            <code className="text-xs">.env.local</code> and restart the dev
            server. Optionally set <code className="text-xs">ANTHROPIC_MODEL</code>{" "}
            (defaults to Claude 3.5 Sonnet).
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Task</Label>
          <div className="flex flex-wrap gap-2">
            {AI_TASK_IDS.map((id) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={task === id ? "secondary" : "outline"}
                className={cn(task === id && "ring-ring ring-2")}
                onClick={() => setTask(id)}
              >
                {AI_TASK_LABELS[id]}
              </Button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">{AI_TASK_HINTS[task]}</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Inputs</CardTitle>
            <CardDescription>
              Nothing is stored on the server except the Anthropic API call for
              this request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {task === "follow_up_email" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fu-name">Client name</Label>
                  <Input
                    id="fu-name"
                    value={followUp.clientName}
                    onChange={(e) =>
                      setFollowUp((s) => ({ ...s, clientName: e.target.value }))
                    }
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fu-co">Company (optional)</Label>
                  <Input
                    id="fu-co"
                    value={followUp.company}
                    onChange={(e) =>
                      setFollowUp((s) => ({ ...s, company: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fu-ctx">Context</Label>
                  <textarea
                    id="fu-ctx"
                    value={followUp.context}
                    onChange={(e) =>
                      setFollowUp((s) => ({ ...s, context: e.target.value }))
                    }
                    rows={6}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                    placeholder="Last call, open questions, tone (formal/casual)…"
                  />
                </div>
              </>
            ) : null}

            {task === "client_summary" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sum-name">Client name</Label>
                  <Input
                    id="sum-name"
                    value={summary.clientName}
                    onChange={(e) =>
                      setSummary((s) => ({ ...s, clientName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sum-tags">Tags (comma-separated)</Label>
                  <Input
                    id="sum-tags"
                    value={summary.tags}
                    onChange={(e) =>
                      setSummary((s) => ({ ...s, tags: e.target.value }))
                    }
                    placeholder="lead, enterprise"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sum-notes">Notes</Label>
                  <textarea
                    id="sum-notes"
                    value={summary.notes}
                    onChange={(e) =>
                      setSummary((s) => ({ ...s, notes: e.target.value }))
                    }
                    rows={5}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sum-extra">Extra context (optional)</Label>
                  <textarea
                    id="sum-extra"
                    value={summary.extra}
                    onChange={(e) =>
                      setSummary((s) => ({ ...s, extra: e.target.value }))
                    }
                    rows={3}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                    placeholder="Email snippets, Slack summary…"
                  />
                </div>
              </>
            ) : null}

            {task === "proposal_outline" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pr-topic">Topic / engagement</Label>
                  <Input
                    id="pr-topic"
                    value={proposal.topic}
                    onChange={(e) =>
                      setProposal((s) => ({ ...s, topic: e.target.value }))
                    }
                    placeholder="e.g. 6-week product redesign"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pr-notes">Rough notes</Label>
                  <textarea
                    id="pr-notes"
                    value={proposal.notes}
                    onChange={(e) =>
                      setProposal((s) => ({ ...s, notes: e.target.value }))
                    }
                    rows={8}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                  />
                </div>
              </>
            ) : null}

            {task === "meeting_prep" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mt-name">Client</Label>
                  <Input
                    id="mt-name"
                    value={meeting.clientName}
                    onChange={(e) =>
                      setMeeting((s) => ({ ...s, clientName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mt-focus">Meeting focus</Label>
                  <Input
                    id="mt-focus"
                    value={meeting.focus}
                    onChange={(e) =>
                      setMeeting((s) => ({ ...s, focus: e.target.value }))
                    }
                    placeholder="e.g. Scope review for Phase 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mt-notes">Background notes</Label>
                  <textarea
                    id="mt-notes"
                    value={meeting.notes}
                    onChange={(e) =>
                      setMeeting((s) => ({ ...s, notes: e.target.value }))
                    }
                    rows={6}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
                  />
                </div>
              </>
            ) : null}

            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}

            <Button
              type="button"
              onClick={onGenerate}
              disabled={loading || !configured}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? "Generating…" : "Generate"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="flex min-h-[320px] flex-col lg:min-h-[480px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">Output</CardTitle>
            <CardDescription>
              Review and edit before sending to anyone.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={!output}
            onClick={onCopy}
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied" : "Copy"}
          </Button>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          <textarea
            readOnly
            value={output}
            placeholder={
              configured
                ? "Generated text will appear here."
                : "Configure your API key to generate."
            }
            className="border-input bg-muted/30 placeholder:text-muted-foreground focus-visible:ring-ring min-h-[240px] flex-1 resize-y rounded-md border px-3 py-2 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-1 lg:min-h-0"
          />
        </CardContent>
      </Card>
    </div>
  );
}
