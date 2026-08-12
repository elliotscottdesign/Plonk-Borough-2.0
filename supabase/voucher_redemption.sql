-- Voucher redemption (founder brief 12 Aug 2026): when a winner claims their
-- bar tab, the code gets marked redeemed — once only, with who took it.
-- Additive columns on both engines' voucher tables; existing rows untouched
-- (they simply show as outstanding until marked).
alter table pool_vouchers     add column if not exists redeemed_at timestamptz;
alter table pool_vouchers     add column if not exists redeemed_by text;
alter table pingpong_vouchers add column if not exists redeemed_at timestamptz;
alter table pingpong_vouchers add column if not exists redeemed_by text;
