-- Migration: Reduce Supabase security linter exposure warnings
-- Purpose: Remove direct table grants that are not required by the app and
-- explicitly remove anon access from RPCs intended only for signed-in users.

-- These tables are accessed through SECURITY DEFINER RPCs, not directly from
-- the client. Keeping direct grants makes them visible in GraphQL introspection.
revoke all on table public.analysis_cache from anon;
revoke all on table public.analysis_cache from authenticated;

revoke all on table public.anonymous_daily_usage from anon;
revoke all on table public.anonymous_daily_usage from authenticated;

revoke all on table public.user_points from anon;
revoke all on table public.user_points from authenticated;

revoke all on table public.user_settings from anon;
revoke all on table public.user_settings from authenticated;

-- learning_items is used directly by the authenticated Supabase client, so keep
-- authenticated table grants. Anonymous users should not discover it via GraphQL.
revoke all on table public.learning_items from anon;

-- These RPCs require auth.uid() and are intended only for signed-in users.
revoke execute on function public.get_analysis_stats() from anon;
revoke execute on function public.get_user_settings() from anon;
revoke execute on function public.record_analysis(boolean) from anon;
revoke execute on function public.reset_analysis_stats() from anon;
revoke execute on function public.upsert_user_settings(boolean, boolean, boolean) from anon;

grant execute on function public.get_analysis_stats() to authenticated;
grant execute on function public.get_user_settings() to authenticated;
grant execute on function public.record_analysis(boolean) to authenticated;
grant execute on function public.reset_analysis_stats() to authenticated;
grant execute on function public.upsert_user_settings(boolean, boolean, boolean) to authenticated;
