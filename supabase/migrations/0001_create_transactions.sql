create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  user_id uuid references auth.users(id),
  method text not null check (method in ('card', 'ecocash')),
  amount integer not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  ecocash_phone text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_reference_idx on public.transactions(reference);
create index if not exists transactions_user_id_idx on public.transactions(user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);