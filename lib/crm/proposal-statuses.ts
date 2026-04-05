export const PROPOSAL_STATUSES = [
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "viewed", label: "Viewed" },
  { id: "accepted", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
] as const;

export type ProposalStatusId = (typeof PROPOSAL_STATUSES)[number]["id"];

export const PROPOSAL_STATUS_IDS: ProposalStatusId[] = PROPOSAL_STATUSES.map(
  (s) => s.id
);

export function isProposalStatus(id: string): id is ProposalStatusId {
  return PROPOSAL_STATUS_IDS.includes(id as ProposalStatusId);
}

export function proposalStatusLabel(id: string): string {
  return PROPOSAL_STATUSES.find((s) => s.id === id)?.label ?? id;
}
