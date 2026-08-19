-- No Dice Hackney — tip payout ledger (finance lane)
--
-- Employment (Allocation of Tips) Act 2023: tips must be passed on in full by
-- the end of the month AFTER they were earned, and the employer must be able
-- to show it happened. Until now there was no record of payment at all — the
-- amounts were known, the paying was not evidenced.
--
-- Two separate facts, deliberately kept apart:
--   paid_at      — the employer's record that it was handed over
--   confirmed_at — the staff member's own acknowledgement that they got it
-- One person's word is a claim. Both is a record.

create table if not exists tip_payouts (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  staff_id      uuid not null,
  staff_name    text,
  month         text not null check (month ~ '^\d{4}-\d{2}$'),
  amount        numeric(10,2) not null check (amount >= 0),

  -- employer side
  paid_at       timestamptz,
  paid_method   text check (paid_method in ('payroll','bank','cash')),
  paid_by       text,
  paid_note     text,

  -- staff side
  confirmed_at  timestamptz,

  -- one row per person per month; marking paid twice is a mistake, not a fact
  unique (staff_id, month)
);

create index if not exists tip_payouts_staff_idx on tip_payouts (staff_id, month desc);
create index if not exists tip_payouts_unpaid_idx on tip_payouts (month) where paid_at is null;

alter table tip_payouts enable row level security;
