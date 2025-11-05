-- Claim stage tracker table
create table if not exists claim_stages (
  id uuid primary key default gen_random_uuid(),
  claim_id text,
  stage_name text,
  description text,
  status text default 'pending',    -- pending | active | complete
  order_index int,
  updated_at timestamptz default now()
);

create index if not exists idx_claim_stages_claim_id on claim_stages(claim_id);
create index if not exists idx_claim_stages_order on claim_stages(claim_id, order_index);

-- Default recommended sequence for property claims
-- Notice of Loss, Inspection Scheduled, Estimate Received,
-- Negotiation, Payment, Closed

commit;

