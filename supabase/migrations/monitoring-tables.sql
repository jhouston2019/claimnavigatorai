-- Monitoring System Tables Migration
-- Run this SQL in your Supabase SQL editor

-- system_errors
create table if not exists system_errors (
  id bigint generated always as identity primary key,
  function_name text,
  error_message text,
  error_code text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- system_events
create table if not exists system_events (
  id bigint generated always as identity primary key,
  event_type text,
  source text,
  payload jsonb,
  created_at timestamptz default now()
);

-- rate_limit_logs
create table if not exists rate_limit_logs (
  id bigint generated always as identity primary key,
  ip_address text,
  function_name text,
  count int default 1,
  created_at timestamptz default now()
);

-- api_usage_logs
create table if not exists api_usage_logs (
  id bigint generated always as identity primary key,
  function_name text,
  duration_ms int,
  success boolean,
  created_at timestamptz default now()
);

-- ai_cost_tracking
create table if not exists ai_cost_tracking (
  id bigint generated always as identity primary key,
  model text,
  tokens_in int,
  tokens_out int,
  cost_usd numeric,
  created_at timestamptz default now()
);

-- Create indexes for better query performance
create index if not exists idx_system_errors_created_at on system_errors(created_at);
create index if not exists idx_system_events_created_at on system_events(created_at);
create index if not exists idx_rate_limit_logs_created_at on rate_limit_logs(created_at);
create index if not exists idx_api_usage_logs_created_at on api_usage_logs(created_at);
create index if not exists idx_ai_cost_tracking_created_at on ai_cost_tracking(created_at);


