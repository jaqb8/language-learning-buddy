-- Migration: Enable RLS for analysis_cache
-- Purpose: Satisfy RLS requirement while keeping cache access via RPC only
-- Date: 2026-02-02

alter table analysis_cache enable row level security;

create policy "analysis_cache_select_none"
  on analysis_cache
  for select
  to anon, authenticated
  using (false);

create policy "analysis_cache_insert_none"
  on analysis_cache
  for insert
  to anon, authenticated
  with check (false);

create policy "analysis_cache_update_none"
  on analysis_cache
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "analysis_cache_delete_none"
  on analysis_cache
  for delete
  to anon, authenticated
  using (false);
