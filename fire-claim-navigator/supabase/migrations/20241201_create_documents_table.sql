-- Create documents table for Document Generator
create table if not exists documents (
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

-- Create index for efficient user queries
create index on documents (user_id, created_at desc);

-- Create index for document type queries
create index on documents (doc_type, created_at desc);

-- Create index for language queries
create index on documents (lang, created_at desc);

-- Add RLS (Row Level Security) policies
alter table documents enable row level security;

-- Policy: Users can only access their own documents
create policy "Users can view own documents" on documents
  for select using (auth.uid() = user_id);

create policy "Users can insert own documents" on documents
  for insert with check (auth.uid() = user_id);

create policy "Users can update own documents" on documents
  for update using (auth.uid() = user_id);

create policy "Users can delete own documents" on documents
  for delete using (auth.uid() = user_id);

-- Create storage bucket for generated documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generated-docs',
  'generated-docs',
  false,
  52428800, -- 50MB limit
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) on conflict (id) do nothing;

-- Create storage policies for generated documents
create policy "Users can upload to own folder" on storage.objects
  for insert with check (
    bucket_id = 'generated-docs' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own files" on storage.objects
  for select using (
    bucket_id = 'generated-docs' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own files" on storage.objects
  for delete using (
    bucket_id = 'generated-docs' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
