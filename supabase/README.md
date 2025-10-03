# Supabase Schema & Migrations

## Overview
The SOC-App uses Supabase (PostgreSQL) to store users, attendance records, admin audit logs, and login throttling metadata. Authentication is handled by custom NISN + token hashing inside Next.js server routes, so row level security (RLS) is currently disabled. All privileged operations must run through secured API routes that use the Supabase service role key.

## Running Migrations
1. Open the Supabase project dashboard and navigate to **SQL Editor**.
2. Copy the contents of `supabase/migrations/001_schema.sql` from this repository.
3. Paste into a new SQL query tab and run it. This migrates the core tables (`users`, `attendance`, `audit_logs`, `login_throttle`) and supporting indexes/constraints.
4. Verify the tables appear under **Table Editor**.

## Notes
- The schema creates `users` with unique `nisn`, hashed tokens, and an `is_admin` flag.
- `attendance` references `users`, enforces a unique record per user per date, and is indexed by date and NISN for reporting.
- `login_throttle` tracks failed login attempts per identifier (hashed IP) to rate limit brute-force attacks.
- `audit_logs` records admin actions with optional actor metadata for traceability.
- If you plan to enable Supabase Auth or RLS later, ensure JWT claims include the NISN or user UUID and update the API routes accordingly.
