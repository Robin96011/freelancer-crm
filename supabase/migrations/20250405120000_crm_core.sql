-- CRM core tables + RLS. Run after 20250405000000_profiles.sql

-- ---------- clients ----------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  notes text,
  tags text[] not null default '{}',
  next_follow_up timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists clients_created_at_idx on public.clients (created_at desc);
create index if not exists clients_tags_idx on public.clients using gin (tags);

alter table public.clients enable row level security;

create policy "clients_select_own"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "clients_insert_own"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "clients_update_own"
  on public.clients for update
  using (auth.uid() = user_id);

create policy "clients_delete_own"
  on public.clients for delete
  using (auth.uid() = user_id);

-- ---------- deals ----------
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  value numeric not null default 0,
  currency text not null default 'USD',
  stage text not null default 'lead',
  probability integer not null default 0,
  expected_close date,
  notes text,
  created_at timestamptz not null default now(),
  constraint deals_stage_check check (
    stage in ('lead', 'proposal', 'negotiation', 'won', 'lost')
  ),
  constraint deals_probability_check check (probability >= 0 and probability <= 100)
);

create index if not exists deals_user_id_idx on public.deals (user_id);
create index if not exists deals_client_id_idx on public.deals (client_id);
create index if not exists deals_stage_idx on public.deals (stage);

alter table public.deals enable row level security;

create policy "deals_select_own"
  on public.deals for select
  using (auth.uid() = user_id);

create policy "deals_insert_own"
  on public.deals for insert
  with check (auth.uid() = user_id);

create policy "deals_update_own"
  on public.deals for update
  using (auth.uid() = user_id);

create policy "deals_delete_own"
  on public.deals for delete
  using (auth.uid() = user_id);

-- ---------- proposals ----------
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  deal_id uuid references public.deals (id) on delete set null,
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  content text,
  status text not null default 'draft',
  total_value numeric not null default 0,
  sent_at timestamptz,
  viewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint proposals_status_check check (
    status in ('draft', 'sent', 'viewed', 'accepted', 'rejected')
  )
);

create index if not exists proposals_user_id_idx on public.proposals (user_id);
create index if not exists proposals_client_id_idx on public.proposals (client_id);

alter table public.proposals enable row level security;

create policy "proposals_select_own"
  on public.proposals for select
  using (auth.uid() = user_id);

create policy "proposals_insert_own"
  on public.proposals for insert
  with check (auth.uid() = user_id);

create policy "proposals_update_own"
  on public.proposals for update
  using (auth.uid() = user_id);

create policy "proposals_delete_own"
  on public.proposals for delete
  using (auth.uid() = user_id);

-- ---------- activities ----------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  deal_id uuid references public.deals (id) on delete set null,
  type text not null,
  content text,
  created_at timestamptz not null default now(),
  constraint activities_type_check check (
    type in ('note', 'email', 'call', 'meeting', 'follow_up')
  )
);

create index if not exists activities_user_id_idx on public.activities (user_id);
create index if not exists activities_created_at_idx on public.activities (created_at desc);
create index if not exists activities_client_id_idx on public.activities (client_id);

alter table public.activities enable row level security;

create policy "activities_select_own"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "activities_insert_own"
  on public.activities for insert
  with check (auth.uid() = user_id);

create policy "activities_update_own"
  on public.activities for update
  using (auth.uid() = user_id);

create policy "activities_delete_own"
  on public.activities for delete
  using (auth.uid() = user_id);

-- ---------- invoices ----------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  deal_id uuid references public.deals (id) on delete set null,
  invoice_number text not null,
  line_items jsonb not null default '[]',
  subtotal numeric not null default 0,
  tax_rate numeric not null default 0,
  total numeric not null default 0,
  currency text not null default 'USD',
  status text not null default 'unpaid',
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invoices_status_check check (
    status in ('unpaid', 'paid', 'overdue')
  ),
  constraint invoices_user_invoice_number_unique unique (user_id, invoice_number)
);

create index if not exists invoices_user_id_idx on public.invoices (user_id);
create index if not exists invoices_client_id_idx on public.invoices (client_id);

alter table public.invoices enable row level security;

create policy "invoices_select_own"
  on public.invoices for select
  using (auth.uid() = user_id);

create policy "invoices_insert_own"
  on public.invoices for insert
  with check (auth.uid() = user_id);

create policy "invoices_update_own"
  on public.invoices for update
  using (auth.uid() = user_id);

create policy "invoices_delete_own"
  on public.invoices for delete
  using (auth.uid() = user_id);
