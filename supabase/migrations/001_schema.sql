create extension if not exists pgcrypto;

create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  nisn text not null unique,
  token_hash text not null,
  is_admin boolean not null default false,
  name text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references users(id) on delete cascade,
  nisn text not null,
  date date not null,
  status text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, date)
);

create index if not exists idx_attendance_date on attendance(date);
create index if not exists idx_attendance_nisn on attendance(nisn);

create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid,
  actor_nisn text,
  actor_name text,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_audit_logs_actor_id on audit_logs(actor_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);

create table if not exists login_throttle (
  identifier text primary key,
  attempts integer not null default 0,
  first_attempt_at timestamptz not null default timezone('utc', now()),
  blocked_until timestamptz
);

create index if not exists idx_login_throttle_blocked_until on login_throttle(blocked_until);
