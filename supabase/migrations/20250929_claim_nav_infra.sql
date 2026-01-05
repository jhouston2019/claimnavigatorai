-- Claim Navigator Infrastructure Migration
-- Consolidated migration for all new feature tables
-- Run this via Supabase CLI or Dashboard

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- documents table for Document Generator
create table if not exists documents(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  doc_type text not null,
  lang text not null check (lang in ('en','es')),
  input_json jsonb not null,
  html_excerpt text not null,
  pdf_path text not null,
  docx_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists documents_user_created_idx on documents (user_id, created_at desc);
create index if not exists documents_type_lang_idx on documents (doc_type, lang);

-- advisories table for Situational Advisory
create table if not exists advisories(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  input_json jsonb not null,
  output_json jsonb not null,
  lang text not null check (lang in ('en','es')),
  created_at timestamptz not null default now()
);

create index if not exists advisories_user_created_idx on advisories (user_id, created_at desc);
create index if not exists advisories_lang_idx on advisories (lang);

-- maximize guide progress tracking
create table if not exists maximize_claim_progress(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  step_number int not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, step_number)
);

create index if not exists maximize_claim_progress_user_idx on maximize_claim_progress (user_id);
create index if not exists maximize_claim_progress_step_idx on maximize_claim_progress (step_number);

-- tactics usage tracking
create table if not exists tactics_usage(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tactic_number int not null,
  clicked boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists tactics_usage_user_created_idx on tactics_usage (user_id, created_at desc);
create index if not exists tactics_usage_tactic_idx on tactics_usage (tactic_number);

-- advanced tools logs
create table if not exists policy_analyses(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  file_path text,
  summary jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists policy_analyses_user_created_idx on policy_analyses (user_id, created_at desc);

create table if not exists state_rights(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  state text not null,
  claim_type text not null,
  response jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists state_rights_user_created_idx on state_rights (user_id, created_at desc);
create index if not exists state_rights_state_claim_idx on state_rights (state, claim_type);

create table if not exists settlement_comparisons(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  inputs jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists settlement_comparisons_user_created_idx on settlement_comparisons (user_id, created_at desc);

create table if not exists negotiations(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  scenario text not null,
  output jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists negotiations_user_created_idx on negotiations (user_id, created_at desc);
create index if not exists negotiations_scenario_idx on negotiations (scenario);

create table if not exists escalations(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  escalation_type text not null,
  output jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists escalations_user_created_idx on escalations (user_id, created_at desc);
create index if not exists escalations_type_idx on escalations (escalation_type);

create table if not exists financial_calcs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  inputs jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists financial_calcs_user_created_idx on financial_calcs (user_id, created_at desc);

-- user subscription tracking (if not already exists)
create table if not exists user_subscriptions(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_subscriptions_user_idx on user_subscriptions (user_id);
create index if not exists user_subscriptions_stripe_customer_idx on user_subscriptions (stripe_customer_id);
create index if not exists user_subscriptions_stripe_subscription_idx on user_subscriptions (stripe_subscription_id);

-- usage tracking for quota enforcement
create table if not exists usage_tracking(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  feature text not null,
  usage_count int not null default 1,
  month_year text not null, -- format: YYYY-MM
  created_at timestamptz not null default now(),
  unique(user_id, feature, month_year)
);

create index if not exists usage_tracking_user_month_idx on usage_tracking (user_id, month_year);
create index if not exists usage_tracking_feature_idx on usage_tracking (feature);

-- RLS (Row Level Security) policies
-- Enable RLS on all tables
alter table documents enable row level security;
alter table advisories enable row level security;
alter table maximize_claim_progress enable row level security;
alter table tactics_usage enable row level security;
alter table policy_analyses enable row level security;
alter table state_rights enable row level security;
alter table settlement_comparisons enable row level security;
alter table negotiations enable row level security;
alter table escalations enable row level security;
alter table financial_calcs enable row level security;
alter table user_subscriptions enable row level security;
alter table usage_tracking enable row level security;

-- Basic RLS policies (adjust based on your auth system)
-- These assume user_id matches the authenticated user
create policy "Users can view their own documents" on documents
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own documents" on documents
  for insert with check (auth.uid()::text = user_id::text);

create policy "Users can view their own advisories" on advisories
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own advisories" on advisories
  for insert with check (auth.uid()::text = user_id::text);

create policy "Users can view their own maximize progress" on maximize_claim_progress
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own maximize progress" on maximize_claim_progress
  for insert with check (auth.uid()::text = user_id::text);

create policy "Users can view their own tactics usage" on tactics_usage
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own tactics usage" on tactics_usage
  for insert with check (auth.uid()::text = user_id::text);

create policy "Users can view their own policy analyses" on policy_analyses
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own policy analyses" on policy_analyses
  for insert with check (auth.uid()::text = user_id::text);

create policy "Users can view their own state rights" on state_rights
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own state rights" on state_rights
  for insert with check (auth.uid()::text = user_id::text);

create policy "Users can view their own settlement comparisons" on settlement_comparisons
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own settlement comparisons" on settlement_comparisons
  for insert with check (auth.uid()::text = user_id::text);

create policy "Users can view their own negotiations" on negotiations
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own negotiations" on negotiations
  for insert with check (auth.uid()::text = user_id::text);

create policy "Users can view their own escalations" on escalations
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own escalations" on escalations
  for insert with check (auth.uid()::text = user_id::text);

create policy "Users can view their own financial calcs" on financial_calcs
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own financial calcs" on financial_calcs
  for insert with check (auth.uid()::text = user_id::text);

create policy "Users can view their own subscriptions" on user_subscriptions
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own subscriptions" on user_subscriptions
  for insert with check (auth.uid()::text = user_id::text);

create policy "Users can view their own usage tracking" on usage_tracking
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own usage tracking" on usage_tracking
  for insert with check (auth.uid()::text = user_id::text);

-- Create storage bucket for generated documents (run this manually in Supabase Dashboard)
-- The bucket should be created as 'generated-docs' with private access
-- This is done via the Supabase Dashboard → Storage → Create Bucket

-- Add comments for documentation
comment on table documents is 'Generated documents from Document Generator feature';
comment on table advisories is 'Situational advisory responses';
comment on table maximize_claim_progress is 'User progress through Maximize Your Claim guide';
comment on table tactics_usage is 'Insurance tactics feature usage tracking';
comment on table policy_analyses is 'Policy analysis results from Advanced Tools';
comment on table state_rights is 'State-specific rights information';
comment on table settlement_comparisons is 'Settlement comparison results';
comment on table negotiations is 'Negotiation scenario outputs';
comment on table escalations is 'Escalation scenario outputs';
comment on table financial_calcs is 'Financial calculation results';
comment on table user_subscriptions is 'User subscription status tracking';
comment on table usage_tracking is 'Monthly usage tracking for quota enforcement';
