-- Create state_rights table for storing state-specific insurance rights and deadlines
create table if not exists state_rights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  state text not null,
  claim_type text not null,
  response jsonb not null,
  lang text not null check (lang in ('en','es')),
  created_at timestamptz not null default now()
);

-- Add foreign key constraint (assuming users table exists in Supabase Auth)
-- alter table state_rights add constraint fk_state_rights_user_id foreign key (user_id) references auth.users(id) on delete cascade;

-- Create indexes for better performance
create index idx_state_rights_user_id on state_rights(user_id);
create index idx_state_rights_state on state_rights(state);
create index idx_state_rights_claim_type on state_rights(claim_type);
create index idx_state_rights_created_at on state_rights(created_at);

-- Add RLS (Row Level Security) policies
alter table state_rights enable row level security;

-- Policy to allow users to see only their own state rights queries
create policy "Users can view their own state rights" on state_rights
  for select using (auth.uid() = user_id);

-- Policy to allow users to insert their own state rights queries
create policy "Users can insert their own state rights" on state_rights
  for insert with check (auth.uid() = user_id);

-- Policy to allow users to update their own state rights queries
create policy "Users can update their own state rights" on state_rights
  for update using (auth.uid() = user_id);

-- Policy to allow users to delete their own state rights queries
create policy "Users can delete their own state rights" on state_rights
  for delete using (auth.uid() = user_id);
