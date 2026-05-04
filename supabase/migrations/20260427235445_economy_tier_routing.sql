create table if not exists public.account_entitlements (
  account_id text primary key,
  is_pro boolean not null default false,
  subscription_plan text,
  updated_at timestamptz not null default now()
);

alter table public.account_entitlements enable row level security;

alter table public.generation_jobs
  add column if not exists tier text not null default 'free';

alter table public.generation_jobs
  add column if not exists requested_model_id text;

alter table public.generation_jobs
  add column if not exists effective_model_id text;

alter table public.generation_jobs
  add column if not exists resolution text;

update public.generation_jobs
set
  requested_model_id = coalesce(requested_model_id, model_id),
  effective_model_id = coalesce(effective_model_id, model_id)
where requested_model_id is null
  or effective_model_id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'generation_jobs_tier_check'
      and conrelid = 'public.generation_jobs'::regclass
  ) then
    alter table public.generation_jobs
      add constraint generation_jobs_tier_check
      check (tier in ('free', 'pro'));
  end if;
end $$;
