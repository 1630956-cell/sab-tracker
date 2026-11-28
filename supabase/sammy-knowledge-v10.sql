-- Sammy V10 database hardening and cache namespace migration.
-- Run once in Supabase SQL Editor. Safe to re-run.

-- The V9 server now uses v9: keys. Preserve old V8 rows where no V9 row exists.
update public.sammy_knowledge as old_row
set question_key = regexp_replace(old_row.question_key, '^v8:', 'v9:')
where old_row.question_key like 'v8:%'
  and not exists (
    select 1 from public.sammy_knowledge as current_row
    where current_row.question_key = regexp_replace(old_row.question_key, '^v8:', 'v9:')
  );

-- Preserve persistent AI cache rows under the new namespace. Expired rows remain expired.
update public.answer_cache as old_row
set prompt = regexp_replace(old_row.prompt, '^v8:', 'v9:')
where old_row.prompt like 'v8:%'
  and not exists (
    select 1 from public.answer_cache as current_row
    where current_row.prompt = regexp_replace(old_row.prompt, '^v8:', 'v9:')
  );

-- Keep lookups bounded and make pending-correction review faster.
create index if not exists sammy_knowledge_verified_updated_idx
  on public.sammy_knowledge (verified, updated_at desc);
create index if not exists sammy_knowledge_expiry_idx
  on public.sammy_knowledge (expires_at)
  where expires_at is not null;
create index if not exists sammy_knowledge_suggestions_status_created_idx
  on public.sammy_knowledge_suggestions (status, created_at desc);
create index if not exists answer_cache_expiry_idx
  on public.answer_cache (expires_at);

-- Reject blank/oversized rows even if a future server action has a validation bug.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sammy_knowledge_answer_nonblank') then
    alter table public.sammy_knowledge
      add constraint sammy_knowledge_answer_nonblank check (length(trim(answer)) between 1 and 4000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sammy_suggestion_lengths_valid') then
    alter table public.sammy_knowledge_suggestions
      add constraint sammy_suggestion_lengths_valid
      check (length(trim(question)) between 4 and 1000 and length(trim(suggested_answer)) between 2 and 2000);
  end if;
end $$;

-- Review pending suggestions in Supabase Table Editor; never auto-promote suggestions.
-- No browser-facing admin endpoint is created by this migration.

-- Read-only review views for administrators using the Supabase dashboard.
create or replace view public.sammy_pending_corrections as
select id, question, suggested_answer, status, created_at
from public.sammy_knowledge_suggestions
where status = 'pending'
order by created_at desc;

create or replace view public.sammy_expiring_knowledge as
select question_key, answer, source_label, source_url, verified_at, expires_at
from public.sammy_knowledge
where verified = true
  and expires_at is not null
order by expires_at asc;

revoke all on public.sammy_pending_corrections from anon, authenticated;
revoke all on public.sammy_expiring_knowledge from anon, authenticated;
grant select on public.sammy_pending_corrections to service_role;
grant select on public.sammy_expiring_knowledge to service_role;
