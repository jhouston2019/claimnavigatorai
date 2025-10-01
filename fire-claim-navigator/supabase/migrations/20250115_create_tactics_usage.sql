-- Create tactics_usage table for tracking user interactions with insurance tactics
create table if not exists tactics_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tactic_number int not null,
  clicked boolean not null default true,
  created_at timestamptz not null default now()
);

-- Create index for efficient querying
create index on tactics_usage (user_id, created_at desc);

-- Add comment for documentation
comment on table tactics_usage is 'Tracks user interactions with insurance company tactics accordion and AI assist buttons';
comment on column tactics_usage.tactic_number is 'The tactic number (1-9) that was interacted with';
comment on column tactics_usage.clicked is 'Whether the user clicked on the tactic (expanded) or AI assist button';
