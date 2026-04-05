-- Run in Supabase SQL editor or via CLI. Creates profiles + RLS + new-user trigger.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  freelancer_type text,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  subscription_status text not null default 'trial',
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, trial_ends_at)
  values (
    new.id,
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'name',
          ''
        )
      ),
      ''
    ),
    (timezone('utc', now())) + interval '14 days'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
