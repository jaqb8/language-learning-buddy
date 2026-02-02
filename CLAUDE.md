## Project Instructions

- When running in agent mode do not starting dev server yourself, user have it already started.

- When resolving DB related review comments, always create new migrations in `supabase/migrations/` folder. NEVER edit existing migrations.

- New SECURITY DEFINER RPCs in migrations should match the hardened pattern used elsewhere in this repo: set search_path to public, pg_catalog and qualify built-ins (e.g. pg_catalog.now()), and explicitly revoke execute from public then grant execute only to intended roles (e.g. authenticated)
