-- ═══════════════════════════════════════════════════════════════════════════
--  BAR — stock, cost, margin & ordering system   ·   No Dice Hackney
--  v2 — 17 Aug 2026. Rewritten after an adversarial review found 20 blockers
--  in v1 (unit conversion, made-not-bought stock, silent £0 costs).
-- ═══════════════════════════════════════════════════════════════════════════
--
--  THE LOOP
--    order → it arrives at a price → we sell → we count what's left
--    → usage & variance fall out → the next order suggests itself
--
--  THE ONE RULE THAT MAKES IT WORK — BASE UNITS
--  v1 subtracted counts from deliveries without converting, so Corona ordered
--  by the case (24) and counted as loose bottles reported 21 used when the
--  truth was 113. Here EVERY quantity is stored in the product's base_unit
--  ('ml' | 'g' | 'each'). Order units and count units are only ever input
--  conveniences, converted on the way in:
--      qty_base = qty × order_to_base   (a case of 24 × 330ml = 7,920 ml)
--      qty_base = qty × count_to_base   (one bottle           =   330 ml)
--
--  THINGS WE MAKE, NOT BUY
--  Ice from the machine, house sugar syrup, fresh lime juice and batched
--  cocktails never appear on an invoice. They are products with source='made'
--  and a prep recipe; their cost comes from their inputs.
--
--  NEVER GUESS A COST
--  v1 coalesced a missing price to zero, which quietly inflates margin. Here
--  an uncosted line makes the whole item's margin NULL and sets costed=false,
--  so the screen must say "not costed" instead of printing a flattering lie.
--
--  Additive only. Nothing existing is dropped or altered. RLS on with no
--  policies = service-role only, reached through the `bar` edge function —
--  the same pattern as the rota / kitchen / tournament functions.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Suppliers ──────────────────────────────────────────────────────────────
create table if not exists bar_suppliers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null unique,
  contact_name   text,
  email          text,
  phone          text,
  account_ref    text,
  order_days     int[] default '{}',        -- 0=Sun … 6=Sat
  delivery_days  int[] default '{}',
  lead_time_days int   default 1,
  min_order      numeric(12,2),
  xero_contact   text,                      -- name in Xero, to match bills
  notes          text,
  active         boolean default true,
  created_at     timestamptz default now()
);

-- ── Products — one catalogue for everything the bar consumes ───────────────
create table if not exists bar_products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  kind          text not null check (kind in
                  ('drink','fresh','ice','consumable','glassware','prep','other')),
  category      text,                       -- Draught, Gin, Wine — groups the count sheet
  source        text not null default 'bought' check (source in ('bought','made')),
  supplier_id   uuid references bar_suppliers(id) on delete set null,
  supplier_code text,

  -- THE canonical unit. Every stored quantity is in this.
  base_unit     text not null check (base_unit in ('ml','g','each')),

  -- How it is BOUGHT (null for source='made')
  order_unit    text,                       -- 'keg','case','bottle','bag','kg','each'
  order_to_base numeric(14,4),              -- base units per order_unit
  pack_cost     numeric(12,2),              -- last price actually paid, ex-VAT, per order_unit

  -- How much of it you can actually serve. Post-mix BIB, prepped fruit and
  -- draught (line losses, foam) all yield less than the pack contains.
  yield_pct     numeric(6,4) not null default 1.0 check (yield_pct > 0 and yield_pct <= 1),

  -- How it is COUNTED (a cellar count is in kegs, a back bar count in bottles)
  count_unit    text,
  count_to_base numeric(14,4),
  count_area    text,                       -- 'Cellar','Back bar','Fridge','Store'
  count_method  text default 'unit' check (count_method in
                  ('unit','tenths','weight','gauge','estimate')),
  counted       boolean default true,

  -- How it is ORDERED — in base units, so there is no ambiguity
  par_base            numeric(14,3),
  reorder_at_base     numeric(14,3),
  usage_per_cover     numeric(14,6),        -- consumables: base units per customer

  till_sku      text,
  active        boolean default true,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  -- A bought product needs a way to convert its pack into base units.
  constraint bar_products_bought_convertible check (
    source <> 'bought' or (order_unit is not null and order_to_base > 0)
  ),
  -- Anything we count needs a way to convert the count into base units.
  constraint bar_products_countable check (
    counted = false or (count_unit is not null and count_to_base > 0)
  )
);
create unique index if not exists bar_products_name_idx on bar_products(lower(name));
create index if not exists bar_products_kind_idx on bar_products(kind) where active;
create index if not exists bar_products_sku_idx  on bar_products(till_sku) where till_sku is not null;

-- ── Prep / production — what we make on site ───────────────────────────────
-- One batch of a made product consumes these inputs and yields makes_base.
create table if not exists bar_prep_recipes (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references bar_products(id) on delete cascade,
  input_product_id uuid not null references bar_products(id) on delete restrict,
  qty_base         numeric(14,4) not null,        -- input consumed per batch
  makes_base       numeric(14,4) not null,        -- output produced per batch
  note             text,
  unique (product_id, input_product_id)
);

-- Every batch actually made. Ice from the machine lands here with no cost and
-- no supplier — which is exactly why it could never be tracked before.
create table if not exists bar_production_log (
  id          uuid primary key default gen_random_uuid(),
  made_on     date not null default current_date,
  product_id  uuid not null references bar_products(id) on delete restrict,
  qty_base    numeric(14,3) not null,
  made_by     text,
  note        text,
  created_at  timestamptz default now()
);
create index if not exists bar_production_idx on bar_production_log(product_id, made_on desc);

-- ── Stocktakes ─────────────────────────────────────────────────────────────
-- A stocktake is ONE event made of several area sheets (cellar, back bar,
-- fridge, store). v1 compared "the two most recent counts", which silently
-- compared the cellar to the back bar. Usage is measured stocktake to
-- stocktake, and only a complete stocktake counts.
create table if not exists bar_stocktakes (
  id           uuid primary key default gen_random_uuid(),
  taken_on     date not null,
  status       text not null default 'open' check (status in ('open','submitted','void')),
  submitted_at timestamptz,
  note         text,
  created_at   timestamptz default now(),
  unique (taken_on)
);
create index if not exists bar_stocktakes_idx on bar_stocktakes(taken_on desc) where status = 'submitted';

create table if not exists bar_stocktake_sheets (
  id            uuid primary key default gen_random_uuid(),
  stocktake_id  uuid not null references bar_stocktakes(id) on delete cascade,
  area          text not null,
  counted_by    uuid,                      -- staff.id — soft ref, staff live in the rota tables
  counted_name  text,
  status        text not null default 'draft' check (status in ('draft','submitted')),
  submitted_at  timestamptz,
  unique (stocktake_id, area)
);

create table if not exists bar_stocktake_lines (
  id          uuid primary key default gen_random_uuid(),
  sheet_id    uuid not null references bar_stocktake_sheets(id) on delete cascade,
  product_id  uuid not null references bar_products(id) on delete cascade,
  qty         numeric(14,3) not null default 0,   -- as counted, in count_unit
  qty_base    numeric(14,3) not null default 0,   -- converted on save
  method      text,                               -- how a part-container was judged
  note        text,
  unique (sheet_id, product_id)
);
create index if not exists bar_stocktake_lines_product_idx on bar_stocktake_lines(product_id);

-- ── Orders & deliveries ────────────────────────────────────────────────────
create table if not exists bar_orders (
  id           uuid primary key default gen_random_uuid(),
  supplier_id  uuid references bar_suppliers(id) on delete set null,
  ordered_on   date,
  expected_on  date,
  received_on  date,
  status       text not null default 'draft'
               check (status in ('draft','sent','part','received','cancelled')),
  total_ex_vat numeric(12,2),
  invoice_ref  text,                        -- ties to the Xero bill
  ordered_by   text,
  note         text,
  created_at   timestamptz default now()
);
create index if not exists bar_orders_idx on bar_orders(status, ordered_on desc);

create table if not exists bar_order_lines (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references bar_orders(id) on delete cascade,
  product_id        uuid not null references bar_products(id) on delete restrict,
  qty_ordered       numeric(14,3) not null default 0,
  qty_received      numeric(14,3),          -- null = not yet checked in
  qty_received_base numeric(14,3),          -- converted on receipt; what usage maths uses
  unit_cost         numeric(12,2),          -- per order_unit, ex-VAT, AS CHARGED
  note              text
);
create index if not exists bar_order_lines_product_idx on bar_order_lines(product_id);

-- ── Price history ──────────────────────────────────────────────────────────
create table if not exists bar_price_history (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references bar_products(id) on delete cascade,
  supplier_id    uuid references bar_suppliers(id) on delete set null,
  unit_cost      numeric(12,2) not null,
  effective_from date not null default current_date,
  source         text default 'order' check (source in ('order','invoice','manual','import')),
  created_at     timestamptz default now()
);
create index if not exists bar_price_hist_idx on bar_price_history(product_id, effective_from desc);

-- Receiving a line at a new price writes history AND updates the product, so
-- margins reprice themselves. In v1 nothing wrote or read this table.
create or replace function bar_capture_price() returns trigger as $$
begin
  if new.unit_cost is not null and new.qty_received is not null
     and (old is null or old.unit_cost is distinct from new.unit_cost
          or old.qty_received is distinct from new.qty_received) then
    if not exists (
      select 1 from bar_price_history h
      where h.product_id = new.product_id and h.unit_cost = new.unit_cost
        and h.effective_from = coalesce((select received_on from bar_orders where id = new.order_id), current_date)
    ) then
      insert into bar_price_history (product_id, supplier_id, unit_cost, effective_from, source)
      select new.product_id, o.supplier_id, new.unit_cost,
             coalesce(o.received_on, current_date), 'order'
      from bar_orders o where o.id = new.order_id;
    end if;
    update bar_products
       set pack_cost = new.unit_cost, updated_at = now()
     where id = new.product_id;
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists bar_order_line_price on bar_order_lines;
create trigger bar_order_line_price
  after insert or update on bar_order_lines
  for each row execute function bar_capture_price();

-- ── Menu & recipes ─────────────────────────────────────────────────────────
create table if not exists bar_menu_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  category   text,
  sell_price numeric(12,2),                 -- inc VAT, what the guest pays
  vat_rate   numeric(5,4) default 0.20,
  till_sku   text,
  active     boolean default true,
  created_at timestamptz default now()
);
create unique index if not exists bar_menu_items_name_idx on bar_menu_items(lower(name));

create table if not exists bar_recipe_lines (
  id           uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references bar_menu_items(id) on delete cascade,
  product_id   uuid not null references bar_products(id) on delete restrict,
  qty_base     numeric(14,4) not null,      -- in the product's base_unit
  note         text,
  unique (menu_item_id, product_id)
);

-- ── Sales ──────────────────────────────────────────────────────────────────
-- Keeps everything the till export gives, including £0 comp lines — a free
-- pint empties a keg exactly as fast as a paid one, and dropping those rows
-- makes the beer look stolen. Keyed with unit_price so the same drink sold at
-- happy-hour and full price are separate rows rather than colliding.
create table if not exists bar_sales_daily (
  id           uuid primary key default gen_random_uuid(),
  sold_on      date not null,
  till_sku     text,
  item_name    text not null,
  menu_item_id uuid references bar_menu_items(id) on delete set null,
  qty          numeric(14,3) not null default 0,
  unit_price   numeric(12,2) not null default 0,   -- inc VAT, as rung
  gross        numeric(12,2) not null default 0,   -- inc VAT after discount
  discount     numeric(12,2) default 0,
  is_comp      boolean generated always as (unit_price = 0) stored,
  order_status text,
  source       text default 'lightspeed',
  imported_at  timestamptz default now(),
  unique (sold_on, item_name, unit_price, source)
);
create index if not exists bar_sales_date_idx on bar_sales_daily(sold_on desc);

-- ── Covers — needed for anything consumed per customer ─────────────────────
-- Straws, napkins and blue roll scale with bodies, not with drinks. Without
-- this table usage_per_cover could never be used at all.
create table if not exists bar_covers (
  id           uuid primary key default gen_random_uuid(),
  on_date      date not null unique,
  covers       int,                          -- people through the door
  transactions int,                          -- till receipts
  source       text default 'lightspeed',
  created_at   timestamptz default now()
);

-- ── Waste & breakage ───────────────────────────────────────────────────────
-- Comps deliberately do NOT belong here — they live on the sales row as
-- is_comp, so a free pint can never be counted twice.
create table if not exists bar_waste (
  id          uuid primary key default gen_random_uuid(),
  happened_on date not null default current_date,
  product_id  uuid references bar_products(id) on delete set null,
  qty_base    numeric(14,3) not null default 0,
  reason      text check (reason in ('breakage','out-of-date','spill','training','line-clean','other')),
  logged_by   text,
  note        text,
  created_at  timestamptz default now()
);
create index if not exists bar_waste_date_idx on bar_waste(happened_on desc);

-- ── RLS: service-role only ─────────────────────────────────────────────────
alter table bar_suppliers        enable row level security;
alter table bar_products         enable row level security;
alter table bar_prep_recipes     enable row level security;
alter table bar_production_log   enable row level security;
alter table bar_stocktakes       enable row level security;
alter table bar_stocktake_sheets enable row level security;
alter table bar_stocktake_lines  enable row level security;
alter table bar_orders           enable row level security;
alter table bar_order_lines      enable row level security;
alter table bar_price_history    enable row level security;
alter table bar_menu_items       enable row level security;
alter table bar_recipe_lines     enable row level security;
alter table bar_sales_daily      enable row level security;
alter table bar_covers           enable row level security;
alter table bar_waste            enable row level security;

-- ═══════════════════════════════════════════════════════════════════════════
--  VIEWS — the answers, computed rather than typed
-- ═══════════════════════════════════════════════════════════════════════════

-- Cost per BASE unit. NULL — never zero — when we don't know.
create or replace view bar_cost_base as
with bought as (
  select p.id as product_id,
         case when p.pack_cost is not null and p.order_to_base > 0
              then p.pack_cost / (p.order_to_base * p.yield_pct) end as cost_per_base
  from bar_products p where p.source = 'bought'
),
made as (
  -- One batch: total input cost ÷ what the batch makes. Inputs must be bought
  -- products (one level of nesting — a prep made from another prep is not
  -- supported and will show as uncosted rather than silently wrong).
  select r.product_id,
         case when bool_and(b.cost_per_base is not null) and max(r.makes_base) > 0
              then sum(r.qty_base * b.cost_per_base) / max(r.makes_base) end as cost_per_base
  from bar_prep_recipes r
  left join bought b on b.product_id = r.input_product_id
  group by r.product_id
)
select p.id as product_id, p.name, p.kind, p.base_unit, p.source,
       coalesce(bo.cost_per_base, ma.cost_per_base)              as cost_per_base,
       (coalesce(bo.cost_per_base, ma.cost_per_base) is not null) as costed
from bar_products p
left join bought bo on bo.product_id = p.id
left join made   ma on ma.product_id = p.id
where p.active;

-- Margin per menu item. If ANY ingredient is uncosted the whole item returns
-- NULL and reports how many lines are missing — the screen must then say
-- "not costed" rather than print a flattering number.
create or replace view bar_margins as
select
  m.id as menu_item_id, m.name, m.category, m.sell_price,
  round(m.sell_price / (1 + m.vat_rate), 2)                    as net_price,
  count(r.id)                                                  as recipe_lines,
  count(r.id) filter (where c.cost_per_base is null)           as unpriced_lines,
  case when count(r.id) > 0 and count(r.id) filter (where c.cost_per_base is null) = 0
       then round(sum(r.qty_base * c.cost_per_base)::numeric, 4) end as recipe_cost,
  case when count(r.id) > 0 and count(r.id) filter (where c.cost_per_base is null) = 0
       then round(((m.sell_price / (1 + m.vat_rate)) - sum(r.qty_base * c.cost_per_base))::numeric, 2) end as gross_profit,
  case when count(r.id) > 0 and count(r.id) filter (where c.cost_per_base is null) = 0
            and m.sell_price > 0
       then round((100 * (((m.sell_price / (1 + m.vat_rate)) - sum(r.qty_base * c.cost_per_base))
                          / (m.sell_price / (1 + m.vat_rate))))::numeric, 1) end as gp_percent
from bar_menu_items m
left join bar_recipe_lines r on r.menu_item_id = m.id
left join bar_cost_base    c on c.product_id   = r.product_id
where m.active
group by m.id, m.name, m.category, m.sell_price, m.vat_rate;

-- What we've got, from the most recent SUBMITTED stocktake (all areas).
create or replace view bar_on_hand as
with last_take as (
  select id, taken_on from bar_stocktakes where status = 'submitted'
  order by taken_on desc limit 1
)
select p.id as product_id, p.name, p.category, p.base_unit, p.par_base,
       coalesce(sum(l.qty_base), 0)                                  as on_hand_base,
       (count(l.id) > 0)                                             as was_counted,
       greatest(p.par_base - coalesce(sum(l.qty_base), 0), 0)        as to_order_base,
       (select taken_on from last_take)                              as counted_on
from bar_products p
left join bar_stocktake_sheets s on s.stocktake_id = (select id from last_take) and s.status = 'submitted'
left join bar_stocktake_lines  l on l.sheet_id = s.id and l.product_id = p.id
where p.active and p.counted
group by p.id, p.name, p.category, p.base_unit, p.par_base;

-- ACTUAL usage between the last two submitted stocktakes.
--   opening + delivered + produced − wasted − closing
-- LEFT JOINs throughout, plus a `complete` flag, so a product missing from one
-- sheet is reported as unknown rather than silently dropped or counted as zero.
create or replace view bar_usage_actual as
with takes as (
  select id, taken_on, row_number() over (order by taken_on desc) rn
  from bar_stocktakes where status = 'submitted'
),
cur as (select id, taken_on from takes where rn = 1),
prv as (select id, taken_on from takes where rn = 2),
counted as (
  select s.stocktake_id, l.product_id, sum(l.qty_base) qty_base
  from bar_stocktake_lines l
  join bar_stocktake_sheets s on s.id = l.sheet_id and s.status = 'submitted'
  group by s.stocktake_id, l.product_id
)
select
  p.id as product_id, p.name, p.kind, p.base_unit,
  (select taken_on from prv) as period_from,
  (select taken_on from cur) as period_to,
  o.qty_base                                   as opened_with,
  coalesce(recv.qty, 0)                        as delivered,
  coalesce(prod.qty, 0)                        as produced,
  coalesce(wst.qty, 0)                         as wasted,
  c.qty_base                                   as closed_with,
  case when o.qty_base is not null and c.qty_base is not null
       then round(o.qty_base + coalesce(recv.qty,0) + coalesce(prod.qty,0)
                  - coalesce(wst.qty,0) - c.qty_base, 3) end as used_base,
  (o.qty_base is not null and c.qty_base is not null) as complete
from bar_products p
left join counted o on o.product_id = p.id and o.stocktake_id = (select id from prv)
left join counted c on c.product_id = p.id and c.stocktake_id = (select id from cur)
left join lateral (
  select sum(ol.qty_received_base) qty from bar_order_lines ol
  join bar_orders ord on ord.id = ol.order_id
  where ol.product_id = p.id
    and ord.received_on >  (select taken_on from prv)
    and ord.received_on <= (select taken_on from cur)
) recv on true
left join lateral (
  select sum(pl.qty_base) qty from bar_production_log pl
  where pl.product_id = p.id
    and pl.made_on >  (select taken_on from prv)
    and pl.made_on <= (select taken_on from cur)
) prod on true
left join lateral (
  select sum(w.qty_base) qty from bar_waste w
  where w.product_id = p.id
    and w.happened_on >  (select taken_on from prv)
    and w.happened_on <= (select taken_on from cur)
) wst on true
where p.active and exists (select 1 from prv);

-- What we SHOULD have used over the same window: sales × recipe.
-- Comps are included deliberately — a free drink still empties the bottle.
create or replace view bar_usage_theoretical as
with takes as (
  select taken_on, row_number() over (order by taken_on desc) rn
  from bar_stocktakes where status = 'submitted'
),
win as (
  select (select taken_on from takes where rn = 2) as from_on,
         (select taken_on from takes where rn = 1) as to_on
)
select
  r.product_id, p.name, p.base_unit,
  (select from_on from win) as period_from,
  (select to_on   from win) as period_to,
  round(sum(s.qty * r.qty_base), 3) as should_use_base
from bar_sales_daily s
join bar_menu_items   m on m.id = s.menu_item_id
join bar_recipe_lines r on r.menu_item_id = m.id
join bar_products     p on p.id = r.product_id
where s.sold_on >  (select from_on from win)
  and s.sold_on <= (select to_on   from win)
group by r.product_id, p.name, p.base_unit;

-- The number this whole system exists to produce: what went missing, in £.
create or replace view bar_variance as
select
  a.product_id, a.name, a.base_unit, a.period_from, a.period_to,
  a.used_base                                                    as actually_used,
  t.should_use_base                                              as should_have_used,
  round(a.used_base - coalesce(t.should_use_base, 0), 3)          as variance_base,
  case when c.cost_per_base is not null
       then round(((a.used_base - coalesce(t.should_use_base,0)) * c.cost_per_base)::numeric, 2) end as variance_cost,
  case when coalesce(t.should_use_base,0) > 0
       then round((100 * (a.used_base - t.should_use_base) / t.should_use_base)::numeric, 1) end as variance_pct,
  a.complete
from bar_usage_actual a
left join bar_usage_theoretical t on t.product_id = a.product_id
left join bar_cost_base         c on c.product_id = a.product_id
where a.complete;

-- Cash sitting on the shelves — and true CoGS needs it (open + buys − close).
create or replace view bar_stock_value as
select h.product_id, h.name, h.category, h.on_hand_base, c.cost_per_base,
       case when c.cost_per_base is not null
            then round((h.on_hand_base * c.cost_per_base)::numeric, 2) end as value,
       c.costed
from bar_on_hand h
left join bar_cost_base c on c.product_id = h.product_id;
