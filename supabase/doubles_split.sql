-- Doubles prize split (founder rule 6 Aug 2026): each player in a doubles team
-- gets their own half-tab voucher, emailed separately. Bookings collect a
-- second email; vouchers gain a recipient slot (1 = captain, 2 = partner).
alter table tournament_entries add column if not exists partner_name text;
alter table tournament_entries add column if not exists partner_email text;

alter table pool_vouchers add column if not exists recipient smallint not null default 1;
alter table pool_vouchers drop constraint if exists pool_vouchers_pool_tournament_id_place_key;
alter table pool_vouchers add constraint pool_vouchers_run_place_recipient_key unique (pool_tournament_id, place, recipient);

alter table pingpong_vouchers add column if not exists recipient smallint not null default 1;
alter table pingpong_vouchers drop constraint if exists pingpong_vouchers_pingpong_tournament_id_place_key;
alter table pingpong_vouchers add constraint pingpong_vouchers_run_place_recipient_key unique (pingpong_tournament_id, place, recipient);
