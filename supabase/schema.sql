-- Medora account and personal-library schema
-- Run this file in Supabase SQL Editor for the Medora project.
-- Safe for a browser app: no service-role key is required or stored here.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  item_type text not null default 'topic',
  title text not null,
  subtitle text,
  description text,
  url text,
  created_at timestamptz not null default now(),
  unique (user_id, item_key)
);

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  searched_at timestamptz not null default now()
);

create index if not exists saved_items_user_created_idx
  on public.saved_items (user_id, created_at desc);
create index if not exists search_history_user_searched_idx
  on public.search_history (user_id, searched_at desc);

alter table public.profiles enable row level security;
alter table public.saved_items enable row level security;
alter table public.search_history enable row level security;

drop policy if exists "Profiles: read own" on public.profiles;
create policy "Profiles: read own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Profiles: insert own" on public.profiles;
create policy "Profiles: insert own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Profiles: update own" on public.profiles;
create policy "Profiles: update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Saved items: read own" on public.saved_items;
create policy "Saved items: read own"
  on public.saved_items for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Saved items: insert own" on public.saved_items;
create policy "Saved items: insert own"
  on public.saved_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Saved items: update own" on public.saved_items;
create policy "Saved items: update own"
  on public.saved_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Saved items: delete own" on public.saved_items;
create policy "Saved items: delete own"
  on public.saved_items for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Search history: read own" on public.search_history;
create policy "Search history: read own"
  on public.search_history for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Search history: insert own" on public.search_history;
create policy "Search history: insert own"
  on public.search_history for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Search history: delete own" on public.search_history;
create policy "Search history: delete own"
  on public.search_history for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.medora_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.medora_set_updated_at();

create or replace function public.medora_create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists medora_auth_user_created on auth.users;
create trigger medora_auth_user_created
after insert on auth.users
for each row execute function public.medora_create_profile();

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.saved_items to authenticated;
grant select, insert, delete on public.search_history to authenticated;

-- No anonymous access is granted. RLS policies restrict each row to its owner.
