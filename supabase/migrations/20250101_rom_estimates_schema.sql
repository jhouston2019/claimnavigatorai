-- ROM Estimates table for logging repair/replacement cost estimates
create table if not exists rom_estimates (
  id uuid primary key default gen_random_uuid(),
  claim_id text,
  category text,
  severity text,
  square_feet numeric,
  estimated_cost numeric,
  ai_explanation text,
  created_at timestamptz default now()
);

create index if not exists idx_rom_estimates_claim_id on rom_estimates(claim_id);
create index if not exists idx_rom_estimates_created_at on rom_estimates(created_at);

commit;

