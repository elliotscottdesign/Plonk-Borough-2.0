-- Xero connection state (finance lane). One row, ever.
--
-- Holds the refresh token that keeps the connection alive without anyone
-- logging in again. The access token lasts 30 minutes; the refresh token
-- rotates on every use and dies after 60 days of no use — the daily sweep
-- keeps it alive on its own.
create table if not exists xero_auth (
  id            int primary key default 1 check (id = 1),
  tenant_id     text,
  tenant_name   text,
  refresh_token text,
  access_token  text,
  expires_at    timestamptz,
  pending_state text,          -- CSRF guard for the one-time authorise round trip
  connected_at  timestamptz,
  updated_at    timestamptz not null default now()
);
insert into xero_auth (id) values (1) on conflict (id) do nothing;
alter table xero_auth enable row level security;
