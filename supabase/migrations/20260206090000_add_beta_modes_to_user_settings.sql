-- Migration: Add beta analysis modes setting to user_settings
-- Purpose: Allow users to enable/disable beta analysis modes
-- Date: 2026-02-06

-- ============================================================================
-- Add beta modes flag to user_settings
-- ============================================================================
alter table user_settings
  add column beta_modes_enabled boolean not null default false;

-- ============================================================================
-- Recreate get_user_settings with beta_modes_enabled
-- ============================================================================
drop function if exists get_user_settings();

create or replace function get_user_settings()
returns table(points_enabled boolean, context_enabled boolean, beta_modes_enabled boolean)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select
    coalesce(us.points_enabled, true),
    coalesce(us.context_enabled, true),
    coalesce(us.beta_modes_enabled, false)
  from (select auth.uid() as uid) as u
  left join user_settings us on us.user_id = u.uid;
$$;

revoke execute on function get_user_settings() from public;
grant execute on function get_user_settings() to authenticated;

-- ============================================================================
-- Recreate upsert_user_settings with beta_modes_enabled
-- ============================================================================
drop function if exists upsert_user_settings(boolean, boolean);

create or replace function upsert_user_settings(
  p_points_enabled boolean default null,
  p_context_enabled boolean default null,
  p_beta_modes_enabled boolean default null
)
returns table(points_enabled boolean, context_enabled boolean, beta_modes_enabled boolean)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into user_settings (user_id, points_enabled, context_enabled, beta_modes_enabled, updated_at)
  values (
    auth.uid(),
    coalesce(p_points_enabled, true),
    coalesce(p_context_enabled, true),
    coalesce(p_beta_modes_enabled, false),
    pg_catalog.now()
  )
  on conflict (user_id) do update set
    points_enabled = coalesce(p_points_enabled, user_settings.points_enabled),
    context_enabled = coalesce(p_context_enabled, user_settings.context_enabled),
    beta_modes_enabled = coalesce(p_beta_modes_enabled, user_settings.beta_modes_enabled),
    updated_at = pg_catalog.now();

  return query
    select us.points_enabled, us.context_enabled, us.beta_modes_enabled
    from user_settings us
    where us.user_id = auth.uid();
end;
$$;

revoke execute on function upsert_user_settings(boolean, boolean, boolean) from public;
grant execute on function upsert_user_settings(boolean, boolean, boolean) to authenticated;
