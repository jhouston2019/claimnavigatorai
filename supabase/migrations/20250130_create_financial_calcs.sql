-- Create financial_calcs table for storing financial impact calculations
create table if not exists financial_calcs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  inputs jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

-- Create indexes for better performance
create index idx_financial_calcs_user_id on financial_calcs(user_id);
create index idx_financial_calcs_created_at on financial_calcs(created_at);

-- Enable RLS (Row Level Security)
alter table financial_calcs enable row level security;

-- Policy to allow users to see only their own calculations
create policy "Users can view their own financial calculations" on financial_calcs
  for select using (auth.uid() = user_id);

-- Policy to allow users to insert their own calculations
create policy "Users can insert their own financial calculations" on financial_calcs
  for insert with check (auth.uid() = user_id);

-- Policy to allow users to update their own calculations
create policy "Users can update their own financial calculations" on financial_calcs
  for update using (auth.uid() = user_id);

-- Policy to allow users to delete their own calculations
create policy "Users can delete their own financial calculations" on financial_calcs
  for delete using (auth.uid() = user_id);
