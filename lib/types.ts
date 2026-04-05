export type Profile = {
  id: string;
  full_name: string | null;
  freelancer_type: string | null;
  currency: string | null;
  timezone: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  created_at: string | null;
  notify_daily_digest: boolean | null;
  notify_proposal_viewed: boolean | null;
  notify_invoice_overdue: boolean | null;
};

export type Client = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tags: string[] | null;
  next_follow_up: string | null;
  created_at: string;
};

export type Activity = {
  id: string;
  user_id: string;
  client_id: string | null;
  deal_id: string | null;
  type: string;
  content: string | null;
  created_at: string;
};

export type Deal = {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expected_close: string | null;
  notes: string | null;
  created_at: string;
};

/** Deal row from `select('*, clients(name)')`. */
export type DealWithClient = Deal & {
  clients: { name: string } | null;
};

export const FREELANCER_TYPES = [
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "consultant", label: "Consultant" },
  { value: "coach", label: "Coach" },
  { value: "other", label: "Other" },
] as const;

export type Proposal = {
  id: string;
  user_id: string;
  deal_id: string | null;
  client_id: string;
  title: string;
  content: string | null;
  status: string;
  total_value: number;
  sent_at: string | null;
  viewed_at: string | null;
  created_at: string;
};

export type ProposalWithRelations = Proposal & {
  clients: { name: string } | null;
  deals: { title: string } | null;
};

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

export type Invoice = {
  id: string;
  user_id: string;
  client_id: string;
  deal_id: string | null;
  invoice_number: string;
  line_items: InvoiceLineItem[] | unknown;
  subtotal: number;
  tax_rate: number;
  total: number;
  currency: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
};

export type InvoiceWithClient = Invoice & {
  clients: { name: string } | null;
};
