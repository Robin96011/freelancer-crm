export const PIPELINE_STAGES = [
  { id: "lead", label: "Lead" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[number]["id"];

export const PIPELINE_STAGE_IDS: PipelineStageId[] = PIPELINE_STAGES.map(
  (s) => s.id
);

export function isPipelineStage(id: string): id is PipelineStageId {
  return PIPELINE_STAGE_IDS.includes(id as PipelineStageId);
}

export function stageLabel(id: PipelineStageId): string {
  return PIPELINE_STAGES.find((s) => s.id === id)?.label ?? id;
}
