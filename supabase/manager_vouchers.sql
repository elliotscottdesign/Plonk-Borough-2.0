-- Manager-issued goodwill vouchers (12 Aug 2026) — additive, no other tables touched.
-- Issued from the staff portal 🎟 Prizes tab by Asst. Manager+; emailed to the
-- customer with the same ND- code / email design as tournament prize vouchers,
-- redeemed through the same list. RLS on with no policies = service-role only.
create table if not exists manager_vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  email text,
  amount_pence int not null,
  reason text,
  issued_by text,          -- manager who sent it (auto from their login)
  created_at timestamptz default now(),
  redeemed_at timestamptz,
  redeemed_by text
);
alter table manager_vouchers enable row level security;
