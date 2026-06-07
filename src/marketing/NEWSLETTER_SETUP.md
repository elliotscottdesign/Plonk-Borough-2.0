# Newsletter & members backend — setup (Supabase + Resend)

Deploy-ready. ~20 minutes. Once done, paste 4 values into `src/marketing/data/backend.js` and the Newsletter section goes live (capture sign-ups, see the list, one-click send). Far cheaper than Mailchimp — Resend is free to ~3k emails/mo, then a few £.

## 1. Supabase — table + RLS
In your Supabase project → SQL editor, run:

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

-- Anonymous can ONLY insert (sign up). No anon read/update/delete — the list
-- is never exposed via the public anon key.
create policy "anon can subscribe"
  on public.subscribers for insert to anon with check (true);

-- (Members/loyalty later)
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

## 2. Resend — sender
1. Create a Resend account, **verify the `nodice.bar` domain** (add the DNS records they give you).
2. Create an **API key**.

## 3. Supabase Edge Function — `send-newsletter`
`supabase/functions/send-newsletter/index.ts`:

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { subject, html, secret } = await req.json();
  if (secret !== Deno.env.get("SEND_SECRET"))
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: subs, error } = await sb.from("subscribers").select("email").eq("consent", true).eq("unsubscribed", false);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const RESEND = Deno.env.get("RESEND_API_KEY")!;
  let sent = 0;
  // Resend supports up to 100 recipients per batch call.
  for (const s of subs ?? []) {
    const personalised = html.replace(
      "{{unsubscribe}}",
      `https://nodice.bar/unsubscribe?e=${encodeURIComponent(s.email)}`,
    );
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "No Dice <hello@nodice.bar>", to: s.email, subject, html: personalised }),
    });
    if (r.ok) sent++;
  }
  return new Response(JSON.stringify({ sent, total: subs?.length ?? 0 }), { headers: { "Content-Type": "application/json" } });
});
```

Deploy + set the function secrets:
```bash
supabase functions deploy send-newsletter --no-verify-jwt
supabase secrets set RESEND_API_KEY=re_xxx SEND_SECRET=<make-a-long-random-string>
# SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are provided to functions automatically.
```
*(`--no-verify-jwt` because the page isn't a Supabase-auth user; the `secret` body field is the auth instead.)*

## 4. Wire the front-end
Paste into `src/marketing/data/backend.js`:
```js
export const SUPABASE_URL     = 'https://xxxx.supabase.co'
export const SUPABASE_ANON_KEY= 'eyJ...'                 // Settings → API → anon public
export const NEWSLETTER_FN_URL = 'https://xxxx.supabase.co/functions/v1/send-newsletter'
export const SEND_SECRET       = '<the same long random string>'
```
Commit + push. Done — sign-ups land in Supabase, the Newsletter tab shows the count and the **Send to list** button works.

## Notes
- **Security:** the anon key is insert-only (RLS), so the public key can't read the list. `SEND_SECRET` lives in the (password-gated) marketing bundle — a speed-bump, not Fort Knox; fine for a venue list. Rotate it if needed.
- **Unsubscribe:** the email footer links to `/unsubscribe?e=…`. We'll add a tiny unsubscribe handler (one more edge function) when you're ready.
- **Scale:** sends are sequential for simplicity. Past a few hundred subscribers, switch to Resend's batch endpoint (100/call) — quick change.
- **Members/loyalty:** the `members` table is created above; the loyalty logic (points, tiers, check-in) builds on the same project.
