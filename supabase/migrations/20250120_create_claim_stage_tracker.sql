-- Create claim_stage_tracker table for Claim Stage Tracker feature
create table if not exists claim_stage_tracker (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  stage text not null check (stage in ('filed','inspection','offer','appeal','settlement')),
  status text not null check (status in ('not_started','in_progress','completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for efficient user queries
create index on claim_stage_tracker (user_id, created_at desc);

-- Create index for stage queries
create index on claim_stage_tracker (stage, created_at desc);

-- Create index for status queries
create index on claim_stage_tracker (status, created_at desc);

-- Add RLS (Row Level Security) policies
alter table claim_stage_tracker enable row level security;

-- Policy: Users can only access their own stage tracker entries
create policy "Users can view own stage tracker" on claim_stage_tracker
  for select using (auth.uid() = user_id);

create policy "Users can insert own stage tracker" on claim_stage_tracker
  for insert with check (auth.uid() = user_id);

create policy "Users can update own stage tracker" on claim_stage_tracker
  for update using (auth.uid() = user_id);

create policy "Users can delete own stage tracker" on claim_stage_tracker
  for delete using (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_claim_stage_tracker_updated_at
  before update on claim_stage_tracker
  for each row
  execute function update_updated_at_column();
