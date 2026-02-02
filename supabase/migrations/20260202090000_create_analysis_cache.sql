-- Migration: Create analysis_cache table and RPCs
-- Purpose: Global cache for text analyses
-- Date: 2026-02-02

create table analysis_cache (
  id uuid primary key default gen_random_uuid(),
  text_hash text not null,
  analysis_mode text not null,
  original_text text not null,
  result jsonb not null,
  created_at timestamptz not null default pg_catalog.now(),
  last_accessed_at timestamptz not null default pg_catalog.now(),
  hit_count integer not null default 0,
  unique (text_hash, analysis_mode)
);

alter table analysis_cache disable row level security;

create or replace function get_cached_analysis(p_text_hash text, p_mode text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  cached_result jsonb;
begin
  update analysis_cache
  set hit_count = hit_count + 1,
      last_accessed_at = pg_catalog.now()
  where text_hash = p_text_hash
    and analysis_mode = p_mode
  returning result into cached_result;

  return cached_result;
end;
$$;

revoke execute on function get_cached_analysis(text, text) from public;
grant execute on function get_cached_analysis(text, text) to anon;
grant execute on function get_cached_analysis(text, text) to authenticated;

create or replace function set_cached_analysis(
  p_text_hash text,
  p_mode text,
  p_original_text text,
  p_result jsonb
)
returns void
language sql
security definer
set search_path = public, pg_catalog
as $$
  insert into analysis_cache (text_hash, analysis_mode, original_text, result, created_at, last_accessed_at, hit_count)
  values (p_text_hash, p_mode, p_original_text, p_result, pg_catalog.now(), pg_catalog.now(), 0)
  on conflict (text_hash, analysis_mode)
  do update set
    original_text = excluded.original_text,
    result = excluded.result,
    last_accessed_at = pg_catalog.now();
$$;

revoke execute on function set_cached_analysis(text, text, text, jsonb) from public;
grant execute on function set_cached_analysis(text, text, text, jsonb) to anon;
grant execute on function set_cached_analysis(text, text, text, jsonb) to authenticated;

create or replace function cleanup_expired_cache()
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  deleted_count integer;
begin
  delete from analysis_cache
  where last_accessed_at < (pg_catalog.now() - interval '90 days');

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke execute on function cleanup_expired_cache() from public;
grant execute on function cleanup_expired_cache() to anon;
grant execute on function cleanup_expired_cache() to authenticated;
