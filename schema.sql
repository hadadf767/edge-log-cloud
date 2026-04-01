create extension if not exists pgcrypto;

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  trade_date date not null,
  direction text not null check (direction in ('Long', 'Short')),
  setup text,
  entry numeric,
  exit numeric,
  quantity numeric,
  pnl numeric not null default 0,
  stop_loss numeric,
  target numeric,
  rr numeric,
  emotion text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_trade_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_trade_updated_at on public.trades;
create trigger set_trade_updated_at
before update on public.trades
for each row execute function public.handle_trade_updated_at();

alter table public.trades enable row level security;

drop policy if exists "users can read their own trades" on public.trades;
create policy "users can read their own trades"
on public.trades for select
using (auth.uid() = user_id);

drop policy if exists "users can insert their own trades" on public.trades;
create policy "users can insert their own trades"
on public.trades for insert
with check (auth.uid() = user_id);

drop policy if exists "users can update their own trades" on public.trades;
create policy "users can update their own trades"
on public.trades for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete their own trades" on public.trades;
create policy "users can delete their own trades"
on public.trades for delete
using (auth.uid() = user_id);
