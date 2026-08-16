-- On A Roll menu catalog (Aug 2026) — the single source of truth the founder edits
-- in /ops → Kitchen → 🍔 Menu, and which the customer order page + kitchen screen read.
-- One JSONB doc (the menu is small); prices stored in PENCE. `sell_pence` is inc VAT.
-- items: [{ id, name, sell_pence, cost_pence, img }]; sections: [{ id, name, items:[…] }].
-- RLS ON with no policies = service-role only (the menu edge function uses the service key).

create table if not exists menu_catalog (
  id         int primary key default 1 check (id = 1),   -- single-row doc
  sections   jsonb not null default '[]'::jsonb,
  bundles    jsonb not null default '[]'::jsonb,          -- [{ id, name, burger_id, beer_pence, price_pence, days:[…] }]
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into menu_catalog (id) values (1) on conflict (id) do nothing;

alter table menu_catalog enable row level security;

-- Public bucket for item photos. The `menu` edge fn uploads with the service key
-- (via the uploadPhoto action) and stores the resulting public URL on the item,
-- so the menu doc stays small (URLs, not base64 blobs).
insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', true)
on conflict (id) do nothing;
