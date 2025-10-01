-- Create advisories table for Situational Advisory feature
create table if not exists advisories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  input_json jsonb not null,
  output_json jsonb not null,
  lang text not null check (lang in ('en','es')),
  created_at timestamptz not null default now()
);

-- Create index for efficient user queries
create index on advisories (user_id, created_at desc);

-- Create index for language queries
create index on advisories (lang, created_at desc);

-- Add RLS (Row Level Security) policies
alter table advisories enable row level security;

-- Policy: Users can only access their own advisories
create policy "Users can view own advisories" on advisories
  for select using (auth.uid() = user_id);

create policy "Users can insert own advisories" on advisories
  for insert with check (auth.uid() = user_id);

create policy "Users can update own advisories" on advisories
  for update using (auth.uid() = user_id);

create policy "Users can delete own advisories" on advisories
  for delete using (auth.uid() = user_id);
