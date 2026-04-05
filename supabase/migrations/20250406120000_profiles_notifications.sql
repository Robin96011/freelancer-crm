-- Notification preferences on profiles (Step: Settings page)

alter table public.profiles
  add column if not exists notify_daily_digest boolean not null default false,
  add column if not exists notify_proposal_viewed boolean not null default false,
  add column if not exists notify_invoice_overdue boolean not null default false;

comment on column public.profiles.notify_daily_digest is 'Email: daily follow-up digest';
comment on column public.profiles.notify_proposal_viewed is 'Email: when a proposal is marked viewed';
comment on column public.profiles.notify_invoice_overdue is 'Email: invoice overdue reminder';
