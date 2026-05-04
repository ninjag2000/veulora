create table if not exists public.account_credit_lots (
  id uuid primary key default gen_random_uuid(),
  account_id text not null,
  source text not null,
  granted_credits integer not null check (granted_credits > 0),
  remaining_credits integer not null check (remaining_credits >= 0),
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint account_credit_lots_remaining_lte_granted
    check (remaining_credits <= granted_credits)
);

create index if not exists account_credit_lots_account_expires_idx
  on public.account_credit_lots (account_id, expires_at);

create index if not exists account_credit_lots_account_remaining_idx
  on public.account_credit_lots (account_id, remaining_credits);

alter table public.account_credit_lots enable row level security;

alter table public.account_entitlements
  add column if not exists current_credits integer not null default 0;

alter table public.account_entitlements
  add column if not exists daily_free_remaining integer not null default 0;

alter table public.account_entitlements
  add column if not exists next_credit_expiry timestamptz;

create or replace function public.refresh_account_credit_summary(p_account_id text)
returns table (
  current_credits integer,
  next_expiry timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_credits integer;
  v_next_expiry timestamptz;
begin
  update public.account_credit_lots
  set remaining_credits = 0
  where account_id = p_account_id
    and remaining_credits > 0
    and expires_at <= now();

  select
    coalesce(sum(remaining_credits), 0)::integer,
    min(expires_at)
  into v_current_credits, v_next_expiry
  from public.account_credit_lots
  where account_id = p_account_id
    and remaining_credits > 0
    and expires_at > now();

  insert into public.account_entitlements (
    account_id,
    current_credits,
    next_credit_expiry,
    updated_at
  )
  values (
    p_account_id,
    v_current_credits,
    v_next_expiry,
    now()
  )
  on conflict (account_id) do update
    set current_credits = excluded.current_credits,
        next_credit_expiry = excluded.next_credit_expiry,
        updated_at = now();

  return query
    select v_current_credits, v_next_expiry;
end;
$$;

create or replace function public.grant_account_credits(
  p_account_id text,
  p_source text,
  p_granted_credits integer,
  p_granted_at timestamptz default now(),
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  lot_id uuid,
  current_credits integer,
  next_expiry timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lot_id uuid;
  v_expires_at timestamptz;
  v_current_credits integer;
  v_next_expiry timestamptz;
begin
  if p_granted_credits is null or p_granted_credits <= 0 then
    raise exception 'p_granted_credits must be > 0';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(coalesce(p_account_id, ''), 0));

  v_expires_at := p_granted_at + interval '30 days';

  insert into public.account_credit_lots (
    account_id,
    source,
    granted_credits,
    remaining_credits,
    granted_at,
    expires_at,
    metadata
  )
  values (
    p_account_id,
    p_source,
    p_granted_credits,
    p_granted_credits,
    p_granted_at,
    v_expires_at,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_lot_id;

  select summary.current_credits, summary.next_expiry
  into v_current_credits, v_next_expiry
  from public.refresh_account_credit_summary(p_account_id) as summary;

  return query
    select v_lot_id, v_current_credits, v_next_expiry, v_expires_at;
end;
$$;

create or replace function public.consume_account_credits(
  p_account_id text,
  p_amount integer,
  p_source text default 'generation'
)
returns table (
  success boolean,
  consumed_credits integer,
  current_credits integer,
  next_expiry timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available integer;
  v_remaining_to_consume integer;
  v_take integer;
  v_current_credits integer;
  v_next_expiry timestamptz;
  v_row record;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'p_amount must be > 0';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(coalesce(p_account_id, ''), 0));

  update public.account_credit_lots
  set remaining_credits = 0
  where account_id = p_account_id
    and remaining_credits > 0
    and expires_at <= now();

  select coalesce(sum(remaining_credits), 0)::integer
  into v_available
  from public.account_credit_lots
  where account_id = p_account_id
    and remaining_credits > 0
    and expires_at > now();

  if v_available < p_amount then
    select summary.current_credits, summary.next_expiry
    into v_current_credits, v_next_expiry
    from public.refresh_account_credit_summary(p_account_id) as summary;

    return query
      select false, 0, v_current_credits, v_next_expiry;
    return;
  end if;

  v_remaining_to_consume := p_amount;

  for v_row in
    select id, remaining_credits
    from public.account_credit_lots
    where account_id = p_account_id
      and remaining_credits > 0
      and expires_at > now()
    order by expires_at asc, created_at asc
    for update
  loop
    exit when v_remaining_to_consume <= 0;

    v_take := least(v_remaining_to_consume, v_row.remaining_credits);

    update public.account_credit_lots
    set remaining_credits = remaining_credits - v_take
    where id = v_row.id;

    v_remaining_to_consume := v_remaining_to_consume - v_take;
  end loop;

  select summary.current_credits, summary.next_expiry
  into v_current_credits, v_next_expiry
  from public.refresh_account_credit_summary(p_account_id) as summary;

  return query
    select true, p_amount, v_current_credits, v_next_expiry;
end;
$$;

insert into public.account_credit_lots (
  account_id,
  source,
  granted_credits,
  remaining_credits,
  granted_at,
  expires_at,
  metadata
)
select
  e.account_id,
  'legacy_balance_migration',
  e.current_credits,
  e.current_credits,
  now(),
  now() + interval '30 days',
  jsonb_build_object('migrated_at', now())
from public.account_entitlements e
where e.current_credits > 0
  and not exists (
    select 1
    from public.account_credit_lots l
    where l.account_id = e.account_id
      and l.remaining_credits > 0
  );

do $$
declare
  account_row record;
begin
  for account_row in
    select account_id from public.account_entitlements
  loop
    perform 1
    from public.refresh_account_credit_summary(account_row.account_id);
  end loop;
end $$;
