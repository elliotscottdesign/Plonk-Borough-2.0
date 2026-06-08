# Newsletter backend — Route A setup (you keep the keys)

Supabase (list) + Resend (sending). ~20 min. You never share a secret key with anyone — you run the steps and paste 4 public-safe values into `src/marketing/data/backend.js`. Far cheaper than Mailchimp.

## 1 · Supabase — tables + RLS
Dashboard → **SQL Editor → New query** → paste → **Run**:

```sql
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text default 'web',
  consent boolean default true,
  unsubscribed boolean default false,
  created_at timestamptz default now()
);
alter table public.subscribers enable row level security;
-- anon can ONLY insert (sign up) — never read the list with the public key
create policy "anon can subscribe" on public.subscribers
  for insert to anon with check (true);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  points int default 0,
  tier text default 'member',
  tags text[] default '{}',
  created_at timestamptz default now()
);
alter table public.members enable row level security;
```

## 2 · Get the 2 Supabase values
Dashboard → **Project Settings → API**: copy the **Project URL** and the **anon `public`** key.

## 3 · Resend — account, key, domain
1. Sign up: https://resend.com
2. **Domains → Add Domain** `nodice.bar` → it shows DNS records → add them at your domain's DNS (registrar / Cloudflare). Wait for "Verified".
3. **API Keys → Create** → copy the `re_…` key (used as a server secret, step 5).

## 4 · Install the Supabase CLI + log in
```bash
brew install supabase/tap/supabase   # macOS (or: npm i -g supabase)
supabase login                        # opens your browser to authorise
```

## 5 · Deploy the two functions (run from the repo root)
The function code is in `supabase/functions/`.
```bash
supabase link --project-ref <YOUR_PROJECT_REF>     # ref is in your project URL
supabase functions deploy send-newsletter --no-verify-jwt
supabase functions deploy unsubscribe     --no-verify-jwt
supabase secrets set RESEND_API_KEY=re_xxxxxxxx SEND_SECRET=$(openssl rand -hex 24)
```
Copy the `SEND_SECRET` value it sets (run `supabase secrets list` if needed — or just generate one yourself and reuse it below).
*(SUPABASE_URL + SERVICE_ROLE_KEY are injected into functions automatically — don't set those.)*

## 6 · Paste 4 values into `src/marketing/data/backend.js`
```js
export const SUPABASE_URL      = 'https://<ref>.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJ...'   // step 2 anon key
export const NEWSLETTER_FN_URL = 'https://<ref>.supabase.co/functions/v1/send-newsletter'
export const SEND_SECRET       = '<the SEND_SECRET from step 5>'
```
Commit + push. Live: sign-ups land in Supabase, **Newsletter → Send to list** works, footer unsubscribe works.

## 7 · Keep the free project awake (separate No Dice project)
A free project sleeps after ~7 days idle, which would break the signup form. The repo already has a daily keep-alive Action — just add two repo secrets (**Settings → Secrets and variables → Actions**), both public-safe:
- `SUPABASE_URL` = your `https://<ref>.supabase.co`
- `SUPABASE_ANON_KEY` = the anon key from Step 2

It pings the project daily so it never pauses. (Until the secrets are set, it no-ops.)

## Notes
- **Security:** anon key is insert-only (RLS) → the public key can't read your list. Service-role + Resend keys live only as Supabase function secrets. `SEND_SECRET` gates the send and is the only thing in the bundle (rotate any time).
- **From address:** `hello@nodice.bar` — must be on the verified domain. Change it in `supabase/functions/send-newsletter/index.ts` if you want a different sender.
- **Scale:** sends are sequential (fine for a few hundred). Past that, switch to Resend's batch endpoint — quick change.
- **Importing old lists** (Mailchimp, Design My Night, events): see [IMPORT_LISTS.md](IMPORT_LISTS.md). Bulk import runs through the `import-subscribers` edge function (service role, dedupes on email, honours unsubscribes) — deployed with `supabase functions deploy import-subscribers --no-verify-jwt`, reuses `SEND_SECRET`.
