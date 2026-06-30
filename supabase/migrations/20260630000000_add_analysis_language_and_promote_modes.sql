-- Add Polish analysis support and promote the former beta modes.
-- Existing analyses are English by default.

alter table public.learning_items
  add column analysis_language text not null default 'en';

alter table public.learning_items
  add constraint learning_items_analysis_language_check
  check (analysis_language in ('en', 'pl'));

update public.learning_items
set analysis_mode = case analysis_mode
  when 'beta_grammar_and_spelling' then 'grammar_and_spelling'
  when 'beta_colloquial_speech' then 'colloquial_speech'
  else analysis_mode
end
where analysis_mode in ('beta_grammar_and_spelling', 'beta_colloquial_speech');

alter table public.analysis_cache
  add column analysis_language text not null default 'en';

alter table public.analysis_cache
  add constraint analysis_cache_analysis_language_check
  check (analysis_language in ('en', 'pl'));

alter table public.analysis_cache
  drop constraint analysis_cache_text_hash_analysis_mode_key;

alter table public.analysis_cache
  add constraint analysis_cache_text_mode_language_key
  unique (text_hash, analysis_mode, analysis_language);

drop function if exists public.get_cached_analysis(text, text);

create or replace function public.get_cached_analysis(
  p_text_hash text,
  p_mode text,
  p_language text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  cached_result jsonb;
begin
  update public.analysis_cache
  set hit_count = hit_count + 1,
      last_accessed_at = pg_catalog.now()
  where text_hash = p_text_hash
    and analysis_mode = p_mode
    and analysis_language = p_language
  returning result into cached_result;

  return cached_result;
end;
$$;

revoke execute on function public.get_cached_analysis(text, text, text) from public;
revoke execute on function public.get_cached_analysis(text, text, text) from anon;
revoke execute on function public.get_cached_analysis(text, text, text) from authenticated;
grant execute on function public.get_cached_analysis(text, text, text) to anon;
grant execute on function public.get_cached_analysis(text, text, text) to authenticated;

drop function if exists public.set_cached_analysis(text, text, text, jsonb);

create or replace function public.set_cached_analysis(
  p_text_hash text,
  p_mode text,
  p_language text,
  p_original_text text,
  p_result jsonb
)
returns void
language sql
security definer
set search_path = public, pg_catalog
as $$
  insert into public.analysis_cache (
    text_hash,
    analysis_mode,
    analysis_language,
    original_text,
    result,
    created_at,
    last_accessed_at,
    hit_count
  )
  values (
    p_text_hash,
    p_mode,
    p_language,
    p_original_text,
    p_result,
    pg_catalog.now(),
    pg_catalog.now(),
    0
  )
  on conflict (text_hash, analysis_mode, analysis_language)
  do update set
    original_text = excluded.original_text,
    result = excluded.result,
    last_accessed_at = pg_catalog.now();
$$;

revoke execute on function public.set_cached_analysis(text, text, text, text, jsonb) from public;
revoke execute on function public.set_cached_analysis(text, text, text, text, jsonb) from anon;
revoke execute on function public.set_cached_analysis(text, text, text, text, jsonb) from authenticated;
grant execute on function public.set_cached_analysis(text, text, text, text, jsonb) to anon;
grant execute on function public.set_cached_analysis(text, text, text, text, jsonb) to authenticated;

drop function if exists public.get_user_settings();
drop function if exists public.upsert_user_settings(boolean, boolean, boolean);

alter table public.user_settings
  drop column beta_modes_enabled;

create or replace function public.get_user_settings()
returns table(points_enabled boolean, context_enabled boolean)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select
    coalesce(us.points_enabled, true),
    coalesce(us.context_enabled, true)
  from (select auth.uid() as uid) as u
  left join public.user_settings us on us.user_id = u.uid;
$$;

revoke execute on function public.get_user_settings() from public;
revoke execute on function public.get_user_settings() from anon;
revoke execute on function public.get_user_settings() from authenticated;
grant execute on function public.get_user_settings() to authenticated;

create or replace function public.upsert_user_settings(
  p_points_enabled boolean default null,
  p_context_enabled boolean default null
)
returns table(points_enabled boolean, context_enabled boolean)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.user_settings (user_id, points_enabled, context_enabled, updated_at)
  values (
    auth.uid(),
    coalesce(p_points_enabled, true),
    coalesce(p_context_enabled, true),
    pg_catalog.now()
  )
  on conflict (user_id) do update set
    points_enabled = coalesce(p_points_enabled, user_settings.points_enabled),
    context_enabled = coalesce(p_context_enabled, user_settings.context_enabled),
    updated_at = pg_catalog.now();

  return query
    select us.points_enabled, us.context_enabled
    from public.user_settings us
    where us.user_id = auth.uid();
end;
$$;

revoke execute on function public.upsert_user_settings(boolean, boolean) from public;
revoke execute on function public.upsert_user_settings(boolean, boolean) from anon;
revoke execute on function public.upsert_user_settings(boolean, boolean) from authenticated;
grant execute on function public.upsert_user_settings(boolean, boolean) to authenticated;
