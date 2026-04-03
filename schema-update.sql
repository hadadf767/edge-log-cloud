alter table public.trades add column if not exists trade_time text;
alter table public.trades add column if not exists rating integer;
alter table public.trades add column if not exists plan text;
alter table public.trades add column if not exists mistake text;
