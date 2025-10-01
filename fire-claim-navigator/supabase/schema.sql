create table entitlements (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  credits integer not null default 0
);

-- Claims table for storing user claims
create table claims (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  date_of_loss date not null,
  type_of_loss text not null,
  loss_location jsonb not null,
  insured_name text not null,
  phone_number text not null,
  policy_number text not null,
  insurer text not null,
  status text not null check (status in ('new', 'pending', 'settled', 'disputed', 'litigation')),
  property_type text not null check (property_type in ('residential', 'commercial', 'industrial')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add foreign key constraint (assuming users table exists in Supabase Auth)
-- alter table claims add constraint fk_claims_user_id foreign key (user_id) references auth.users(id) on delete cascade;

-- Create indexes for better performance
create index idx_claims_user_id on claims(user_id);
create index idx_claims_status on claims(status);
create index idx_claims_type_of_loss on claims(type_of_loss);
create index idx_claims_created_at on claims(created_at);

-- Add RLS (Row Level Security) policies
alter table claims enable row level security;

-- Policy to allow users to see only their own claims
create policy "Users can view their own claims" on claims
  for select using (auth.uid() = user_id);

-- Policy to allow users to insert their own claims
create policy "Users can insert their own claims" on claims
  for insert with check (auth.uid() = user_id);

-- Policy to allow users to update their own claims
create policy "Users can update their own claims" on claims
  for update using (auth.uid() = user_id);

-- Policy to allow users to delete their own claims
create policy "Users can delete their own claims" on claims
  for delete using (auth.uid() = user_id);

-- Documents table for storing document metadata
create table documents (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  label text not null,
  description text,
  language text not null check (language in ('en', 'es')),
  template_path text not null,
  sample_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for documents
create index idx_documents_language on documents(language);
create index idx_documents_slug on documents(slug);
create index idx_documents_label on documents(label);

-- Enable RLS for documents (public read access)
alter table documents enable row level security;

-- Policy to allow anyone to read documents (public access)
create policy "Anyone can view documents" on documents
  for select using (true);