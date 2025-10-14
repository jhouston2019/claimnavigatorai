-- Create claim_metadata table for storing claim information
create table if not exists claim_metadata (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  name text,
  policy_number text,
  claim_number text,
  date_of_loss date,
  insurance_company text,
  phone text,
  email text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create evidence_files table for storing evidence file information
create table if not exists evidence_files (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid references claim_metadata(id) on delete cascade,
  user_id uuid references auth.users(id),
  file_name text not null,
  file_url text,
  file_size bigint,
  file_type text,
  category text not null default 'other',
  tags text[] default '{}',
  ai_summary text,
  notes text,
  is_before_after boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for better performance
create index if not exists idx_claim_metadata_user_id on claim_metadata(user_id);
create index if not exists idx_claim_metadata_claim_number on claim_metadata(claim_number);
create index if not exists idx_evidence_files_claim_id on evidence_files(claim_id);
create index if not exists idx_evidence_files_user_id on evidence_files(user_id);
create index if not exists idx_evidence_files_category on evidence_files(category);
create index if not exists idx_evidence_files_created_at on evidence_files(created_at);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_claim_metadata_updated_at
  before update on claim_metadata
  for each row
  execute function update_updated_at_column();

create trigger update_evidence_files_updated_at
  before update on evidence_files
  for each row
  execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table claim_metadata enable row level security;
alter table evidence_files enable row level security;

-- Create RLS policies for claim_metadata
create policy "Users can view their own claims" on claim_metadata
  for select using (auth.uid() = user_id);

create policy "Users can insert their own claims" on claim_metadata
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own claims" on claim_metadata
  for update using (auth.uid() = user_id);

create policy "Users can delete their own claims" on claim_metadata
  for delete using (auth.uid() = user_id);

-- Create RLS policies for evidence_files
create policy "Users can view their own evidence files" on evidence_files
  for select using (auth.uid() = user_id);

create policy "Users can insert their own evidence files" on evidence_files
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own evidence files" on evidence_files
  for update using (auth.uid() = user_id);

create policy "Users can delete their own evidence files" on evidence_files
  for delete using (auth.uid() = user_id);

-- Create a view for evidence summary statistics
create or replace view evidence_summary as
select 
  cm.id as claim_id,
  cm.claim_number,
  cm.insurance_company,
  cm.date_of_loss,
  count(ef.id) as total_files,
  count(case when ef.category = 'photos' then 1 end) as photo_count,
  count(case when ef.category = 'documents' then 1 end) as document_count,
  count(case when ef.category = 'receipts' then 1 end) as receipt_count,
  count(case when ef.category = 'other' then 1 end) as other_count,
  sum(ef.file_size) as total_size_bytes,
  min(ef.created_at) as first_upload,
  max(ef.created_at) as last_upload
from claim_metadata cm
left join evidence_files ef on cm.id = ef.claim_id
group by cm.id, cm.claim_number, cm.insurance_company, cm.date_of_loss;

-- Grant access to the view
grant select on evidence_summary to authenticated;

-- Create a function to get evidence files by category
create or replace function get_evidence_by_category(claim_uuid uuid, category_filter text default null)
returns table (
  id uuid,
  file_name text,
  file_url text,
  category text,
  tags text[],
  ai_summary text,
  notes text,
  created_at timestamptz
) as $$
begin
  return query
  select 
    ef.id,
    ef.file_name,
    ef.file_url,
    ef.category,
    ef.tags,
    ef.ai_summary,
    ef.notes,
    ef.created_at
  from evidence_files ef
  where ef.claim_id = claim_uuid
    and (category_filter is null or ef.category = category_filter)
  order by ef.created_at desc;
end;
$$ language plpgsql security definer;

-- Grant execute permission on the function
grant execute on function get_evidence_by_category(uuid, text) to authenticated;

