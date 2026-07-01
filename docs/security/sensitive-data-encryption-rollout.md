# Sensitive data encryption rollout

1. Generate two different 32-byte secrets:
   - `openssl rand -base64 32` for `DATA_ENCRYPTION_KEY_V1`
   - `openssl rand -base64 32` for `CACHE_HMAC_KEY_V1`
2. Configure `DATA_ENCRYPTION_KEY_V1`, `CACHE_HMAC_KEY_V1`, and
   `SUPABASE_SECRET_KEY` as Cloudflare Worker Secrets in every environment.
3. Apply `20260701000000_encrypt_sensitive_analysis_data.sql` and deploy the
   dual-read/encrypted-write application.
4. Run `npm run backfill:learning-items-encryption` from a trusted environment
   with `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `DATA_ENCRYPTION_KEY_V1`.
5. Verify that no rows have a null `encrypted_payload`.
6. Copy the SQL file from `supabase/finalization/` into `supabase/migrations/`
   using a new current timestamp, apply it as a new migration, regenerate
   database types, and remove the legacy read path.

Do not rotate or remove version 1 keys until all version 1 payloads have been
reencrypted. Old backups and point-in-time recovery snapshots can contain
plaintext until their retention period expires.
