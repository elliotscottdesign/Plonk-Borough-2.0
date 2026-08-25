-- A receipt and an invoice are matched differently (finance lane).
--
-- A card receipt is same-day: you buy, the card settles a day or two later, so
-- a -1/+5 day window round the receipt date finds the payment.
--
-- A supplier invoice is not. It is issued on terms and paid weeks later --
-- The Drinks Club invoice 0000186745 was raised 11 Aug against a payment on a
-- different day entirely. Searching +5 days from the invoice date would find
-- nothing, every time.
--
-- So the kind decides the window. Amount still has to be exact either way;
-- that is what keeps a match trustworthy.
alter table receipts add column if not exists kind text not null default 'receipt'
  check (kind in ('receipt','invoice'));
alter table receipts add column if not exists doc_ref text;   -- invoice number, for the audit trail

create index if not exists receipts_kind_idx on receipts (kind, status);
