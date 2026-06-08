// Supabase Edge Function: import-subscribers
// One-off BULK import of old lists into the subscribers table — Mailchimp
// exports, Design My Night / Plonk Golf booking CSVs, event guest lists, etc.
//
// Why a function (not the public anon key): the anon key is INSERT-only one
// row at a time and can't dedupe. This runs with the SERVICE ROLE and does a
// single INSERT ... ON CONFLICT (email) DO NOTHING, so:
//   • re-running the same import is harmless (no duplicates), and
//   • an email already in the list is NEVER touched — a person who has since
//     unsubscribed is never resurrected, and their existing consent is kept.
//
// Auth = the `secret` body field (reuses SEND_SECRET) — deploy with
// `--no-verify-jwt`. Meant to be called from a trusted machine, not the
// shipped website bundle.
//
// Body: { rows: [{ email, source?, consent?, unsubscribed? }], secret }
//   consent      defaults to true  (set false to store-but-never-email)
//   unsubscribed defaults to false (set true to suppress an opted-out contact)
// Returns: { inserted, skipped, total }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { rows, secret } = await req.json().catch(() => ({}));
  if (secret !== Deno.env.get("SEND_SECRET")) return json({ error: "unauthorized" }, 401);
  if (!Array.isArray(rows) || rows.length === 0) return json({ error: "missing rows" }, 400);

  // Normalise, validate, and dedupe by email (last occurrence wins).
  const byEmail = new Map<string, { email: string; source: string; consent: boolean; unsubscribed: boolean }>();
  for (const r of rows) {
    const email = String(r?.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) continue;
    byEmail.set(email, {
      email,
      source: r?.source ? String(r.source).trim() : "import",
      consent: r?.consent === false ? false : true,        // default true unless explicitly false
      unsubscribed: r?.unsubscribed === true ? true : false, // default false unless explicitly true
    });
  }
  const clean = [...byEmail.values()];
  const total = rows.length;
  if (clean.length === 0) return json({ inserted: 0, skipped: total, total });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // INSERT ... ON CONFLICT (email) DO NOTHING. ignoreDuplicates leaves any
  // pre-existing row exactly as-is (consent + unsubscribed preserved).
  // .select() returns only the rows actually inserted → exact inserted count.
  const { data, error } = await sb
    .from("subscribers")
    .upsert(clean, { onConflict: "email", ignoreDuplicates: true })
    .select("email");
  if (error) return json({ error: error.message }, 500);

  const inserted = data?.length ?? 0;
  return json({ inserted, skipped: total - inserted, total });
});
