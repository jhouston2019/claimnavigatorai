create table entitlements (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  credits integer not null default 0
);
