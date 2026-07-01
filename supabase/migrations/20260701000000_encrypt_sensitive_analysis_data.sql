-- Prepare application-layer encryption for sensitive analysis data.
-- Existing learning items are backfilled by a trusted application script before
-- the legacy plaintext columns are removed in a later migration.

alter table public.learning_items
  add column encrypted_payload text;

alter table public.learning_items
  alter column original_sentence drop not null,
  alter column corrected_sentence drop not null,
  alter column explanation drop not null;

-- The old cache cannot be migrated safely inside Postgres because the encryption
-- keys intentionally live outside the database.
truncate table public.analysis_cache;

drop function if exists public.get_cached_analysis(text, text, text);
drop function if exists public.set_cached_analysis(text, text, text, text, jsonb);

alter table public.analysis_cache
  drop constraint if exists analysis_cache_text_mode_language_key;

alter table public.analysis_cache
  rename column text_hash to lookup_digest;

alter table public.analysis_cache
  drop column original_text,
  drop column result;

alter table public.analysis_cache
  add column encrypted_result text not null;

alter table public.analysis_cache
  add constraint analysis_cache_lookup_mode_language_key
  unique (lookup_digest, analysis_mode, analysis_language);

create or replace function public.get_cached_analysis(
  p_lookup_digest text,
  p_mode text,
  p_language text
)
returns text
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  cached_result text;
begin
  update public.analysis_cache
  set hit_count = hit_count + 1,
      last_accessed_at = pg_catalog.now()
  where lookup_digest = p_lookup_digest
    and analysis_mode = p_mode
    and analysis_language = p_language
  returning encrypted_result into cached_result;

  return cached_result;
end;
$$;

revoke execute on function public.get_cached_analysis(text, text, text) from public;
revoke execute on function public.get_cached_analysis(text, text, text) from anon;
revoke execute on function public.get_cached_analysis(text, text, text) from authenticated;
grant execute on function public.get_cached_analysis(text, text, text) to service_role;

create or replace function public.set_cached_analysis(
  p_lookup_digest text,
  p_mode text,
  p_language text,
  p_encrypted_result text
)
returns void
language sql
security definer
set search_path = public, pg_catalog
as $$
  insert into public.analysis_cache (
    lookup_digest,
    analysis_mode,
    analysis_language,
    encrypted_result,
    created_at,
    last_accessed_at,
    hit_count
  )
  values (
    p_lookup_digest,
    p_mode,
    p_language,
    p_encrypted_result,
    pg_catalog.now(),
    pg_catalog.now(),
    0
  )
  on conflict (lookup_digest, analysis_mode, analysis_language)
  do update set
    encrypted_result = excluded.encrypted_result,
    last_accessed_at = pg_catalog.now();
$$;

revoke execute on function public.set_cached_analysis(text, text, text, text) from public;
revoke execute on function public.set_cached_analysis(text, text, text, text) from anon;
revoke execute on function public.set_cached_analysis(text, text, text, text) from authenticated;
grant execute on function public.set_cached_analysis(text, text, text, text) to service_role;

revoke all on table public.analysis_cache from anon;
revoke all on table public.analysis_cache from authenticated;
