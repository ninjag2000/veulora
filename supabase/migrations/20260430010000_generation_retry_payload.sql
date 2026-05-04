alter table public.generation_jobs
  add column if not exists active_job_id text;

alter table public.generation_jobs
  add column if not exists request_payload jsonb not null default '{}'::jsonb;

alter table public.generation_jobs
  add column if not exists retry_count integer not null default 0;

alter table public.generation_jobs
  add column if not exists last_error text;

update public.generation_jobs
set active_job_id = coalesce(active_job_id, job_id)
where active_job_id is null;

alter table public.generation_jobs
  alter column active_job_id set not null;
