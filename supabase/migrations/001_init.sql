-- CatLendar — initial schema
-- Run this in the Supabase SQL editor (or via supabase db push).

-- ─── Events ───────────────────────────────────────────────────────────────────

create table if not exists events (
  id         text        primary key,
  title      text        not null,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  color      text,
  created_at timestamptz not null default now()
);

-- Disable RLS: access is already protected by the passcode middleware.
alter table events disable row level security;

-- ─── Tasks ────────────────────────────────────────────────────────────────────

create table if not exists tasks (
  id         text        primary key,
  label      text        not null,
  color      text        not null default '#c9b8e8',
  completed  boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table tasks disable row level security;
