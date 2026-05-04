create table if not exists public.generation_jobs (
  job_id text primary key,
  model_id text not null,
  mode text not null check (mode in ('image', 'video')),
  account_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists generation_jobs_account_created_idx
  on public.generation_jobs (account_id, created_at desc);

alter table public.generation_jobs enable row level security;

create table if not exists public.generation_rate_limits (
  bucket_key text primary key,
  account_id text not null,
  ip_address text,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists generation_rate_limits_account_window_idx
  on public.generation_rate_limits (account_id, window_start desc);

alter table public.generation_rate_limits enable row level security;
