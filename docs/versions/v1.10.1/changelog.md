# Language Learning Buddy v1.10.1

## What's New

- **Staging Infrastructure Refresh**: The staging environment now points at the new self-hosted Supabase setup, making test and deployment flows more consistent with the current infrastructure.

## Fixed

- **Database Exposure Warnings**: Tightened Supabase permissions on staging so unnecessary table and RPC exposure is reduced.

## Changed

- **Staging Configuration**: Updated staging Supabase URLs and migration flow to use the self-hosted database directly.
