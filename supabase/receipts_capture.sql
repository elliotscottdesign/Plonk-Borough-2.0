-- No Dice Hackney — phone receipt capture (finance lane)
-- Photo + THREE TYPED FIELDS. Never OCR the date: Hubdoc read two handwritten
-- slips as 2020 instead of 2026 (£69 and £48), one of which hid a whole year's
-- worth of cost in the wrong period.

create table if not exists receipts (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- who filed it. staff_id links to the rota so every receipt has an owner;
  -- tonight's "whose Deliveroo account is this?" took an hour to answer.
  staff_id      uuid,
  staff_name    text,

  -- typed by hand, always
  supplier      text        not null,
  spend_date    date        not null,
  amount        numeric(10,2) not null check (amount > 0),

  -- how it should be treated. 'personal' goes to the director's loan,
  -- 'staff_welfare' is allowable, 'competitor' needs the fields below.
  category      text        not null default 'business'
                check (category in ('business','staff_welfare','personal','competitor')),
  note          text,

  -- competitor check. Filled in AT THE TIME or the claim is just a story.
  comp_item     text,
  comp_price    numeric(10,2),
  our_price     numeric(10,2),
  comp_verdict  text,

  image_path    text,

  -- new -> filed (sent to Xero) -> attached (sat on its bank payment)
  status        text        not null default 'new'
                check (status in ('new','filed','attached','void')),
  filed_at      timestamptz,
  attached_at   timestamptz,
  xero_file_id  text
);

-- the screen lists newest first; the sweep looks for what still needs filing
create index if not exists receipts_date_idx   on receipts (spend_date desc);
create index if not exists receipts_status_idx on receipts (status) where status <> 'attached';
create index if not exists receipts_staff_idx  on receipts (staff_id);

-- match a receipt to a bank line by supplier + amount + a few days either way,
-- because the card settles after the purchase
create index if not exists receipts_match_idx  on receipts (amount, spend_date);

-- Locked down: reached only through the finance edge function using the
-- service key, exactly like the rota tables. No anon access.
alter table receipts enable row level security;
