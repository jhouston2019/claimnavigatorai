-- Add notes column to claim_stages table
alter table claim_stages add column if not exists notes text;

-- Add index for notes queries (optional, for full-text search if needed)
-- create index if not exists idx_claim_stages_notes on claim_stages using gin(to_tsvector('english', notes));






