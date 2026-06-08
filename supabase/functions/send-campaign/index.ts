// Supabase Edge Function: send-campaign
// CONTROLLED, batched sender for the one-off re-introduction / reactivation
// campaign to the HELD list (old Plonk/Mailchimp contacts, consent=false).
//
// Unlike send-newsletter (which blasts everyone with consent=true at once),
// this sends to an EXPLICIT list of emails passed in the request, so the
// caller controls batch size and ordering (most-engaged + most-recent first)
// and can warm the domain gently. Each email gets:
//   {{confirm}}     → the "Yes, keep me in" link (confirm-optin) that flips
//                     the recipient to consent=true (joins the active list)
//   {{unsubscribe}} → the standard one-click opt-out (unsubscribe)
//
// Sends are spaced ~550ms apart to stay under Resend's ~2/sec rate limit.
// Keep batches <= ~100 so the function finishes well inside its time budget.
//
// Auth = the `secret` body field (reuses SEND_SECRET). Deploy with
// `--no-verify-jwt`. Triggered only from a trusted machine, never the bundle.
//
// Body: { emails: string[], subject, html, secret }
// Returns: { sent, failed, total, failures: string[] }
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { emails, subject, html, secret } = await req.json().catch(() => ({}));
  if (secret !== Deno.env.get("SEND_SECRET")) return json({ error: "unauthorized" }, 401);
  if (!subject || !html) return json({ error: "missing subject or html" }, 400);
  if (!Array.isArray(emails) || emails.length === 0) return json({ error: "missing emails" }, 400);

  // Normalise + dedupe the batch.
  const list = [...new Set(
    emails.map((e: unknown) => String(e ?? "").trim().toLowerCase()).filter((e) => EMAIL_RE.test(e)),
  )];

  const url = Deno.env.get("SUPABASE_URL")!;
  const RESEND = Deno.env.get("RESEND_API_KEY")!;
  let sent = 0, failed = 0;
  const failures: string[] = [];

  for (const email of list) {
    const enc = encodeURIComponent(email);
    const confirm = `${url}/functions/v1/confirm-optin?e=${enc}`;
    const unsub = `${url}/functions/v1/unsubscribe?e=${enc}`;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "No Dice <hello@nodice.bar>",
          to: email,
          subject,
          html: html.replaceAll("{{confirm}}", confirm).replaceAll("{{unsubscribe}}", unsub),
        }),
      });
      if (r.ok) { sent++; } else { failed++; failures.push(email); }
    } catch (_e) {
      failed++; failures.push(email);
    }
    await sleep(550); // respect Resend ~2/sec rate limit
  }

  return json({ sent, failed, total: list.length, failures });
});
