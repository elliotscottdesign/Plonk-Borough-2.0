// Supabase Edge Function: send-newsletter
// Pulls consented subscribers and sends the email via Resend.
// Auth = the `secret` body field (not a Supabase JWT) — deploy with
// `--no-verify-jwt`. Called from the password-gated /marketing page.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { subject, html, secret } = await req.json().catch(() => ({}));
  if (secret !== Deno.env.get("SEND_SECRET")) return json({ error: "unauthorized" }, 401);
  if (!subject || !html) return json({ error: "missing subject or html" }, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  const sb = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: subs, error } = await sb
    .from("subscribers").select("email").eq("consent", true).eq("unsubscribed", false);
  if (error) return json({ error: error.message }, 500);

  const RESEND = Deno.env.get("RESEND_API_KEY")!;
  let sent = 0, failed = 0;
  for (const s of subs ?? []) {
    const unsub = `${url}/functions/v1/unsubscribe?e=${encodeURIComponent(s.email)}`;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "No Dice <hello@nodice.bar>",
        to: s.email,
        subject,
        html: html.replaceAll("{{unsubscribe}}", unsub),
      }),
    });
    r.ok ? sent++ : failed++;
  }
  return json({ sent, failed, total: subs?.length ?? 0 });
});
