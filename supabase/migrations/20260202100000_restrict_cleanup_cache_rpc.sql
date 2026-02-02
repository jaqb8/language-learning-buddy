-- Migration: Restrict cleanup_expired_cache RPC
-- Purpose: Limit cleanup execution to service role
-- Date: 2026-02-02

revoke execute on function cleanup_expired_cache() from public;
revoke execute on function cleanup_expired_cache() from anon;
revoke execute on function cleanup_expired_cache() from authenticated;
grant execute on function cleanup_expired_cache() to service_role;
