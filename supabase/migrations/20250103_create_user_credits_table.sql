-- Create user_credits table for tracking user credits
create table if not exists user_credits (
  user_id uuid references auth.users(id) on delete cascade,
  credits int default 0,
  updated_at timestamp default now()
);

-- Create index for better performance
create index if not exists idx_user_credits_user_id on user_credits(user_id);

-- Enable RLS (Row Level Security)
alter table user_credits enable row level security;

-- Policy to allow users to see only their own credits
create policy "Users can view their own credits" on user_credits
  for select using (auth.uid() = user_id);

-- Policy to allow users to update their own credits
create policy "Users can update their own credits" on user_credits
  for update using (auth.uid() = user_id);

-- Policy to allow service role to manage all credits
create policy "Service role can manage all credits" on user_credits
  for all using (auth.role() = 'service_role');

-- Add comment
comment on table user_credits is 'User credit tracking for AI response generation';

