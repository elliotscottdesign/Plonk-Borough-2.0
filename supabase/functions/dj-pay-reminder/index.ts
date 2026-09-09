// Supabase Edge Function: dj-pay-reminder
// Friday reminder to the founder: which DJ fees are due to pay TODAY. Invoked by
// pg_cron on Fridays (gated by CRON_SECRET). A night is paid the Friday of the
// week AFTER it was played. This lists confirmed paid sessions whose pay-Friday
// has arrived, whose invoice has LANDED (invoice_received_at set), and that
// aren't paid yet — with the £ amount off each invoice.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "elliot@nodice.bar";
const OPS = "https://team.nodice.bar/ops";
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
const money = (n: any) => "£" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-GB", { maximumFractionDigits: 2 });
const niceDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const esc = (s: any) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" } as any)[c]);
// Pay-Friday = the Friday of the week after the performance (all in UTC so a
// date never rolls a day). e.g. play any day this week → paid next Friday.
function payFridayISO(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const monOffset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - monOffset + 11);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return json({ error: "unauthorized" }, 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const RESEND = Deno.env.get("RESEND_API_KEY");
  const today = new Date().toISOString().slice(0, 10);

  // Confirmed paid sessions with a landed invoice, not yet paid.
  const { data: rowsRaw } = await sb.from("dj_slots")
    .select("date, slot, night_name, invoice_amount, dj:djs(dj_name)")
    .eq("status", "confirmed").eq("kind", "session")
    .not("invoice_received_at", "is", null).is("paid_at", null);
  // Due = pay-Friday has arrived (today or earlier — so nothing slips).
  const due = (rowsRaw || []).filter((r: any) => payFridayISO(r.date) <= today).sort((a: any, b: any) => String(a.date).localeCompare(b.date));
  if (!due.length) return json({ due: 0, emailed: false });

  const total = due.reduce((s: number, r: any) => s + (Number(r.invoice_amount) || 0), 0);
  const li = due.map((r: any) =>
    `<li style="margin-bottom:7px;line-height:1.5"><strong style="color:#fff">${esc(r.dj?.dj_name || "DJ")}</strong> — ${niceDate(r.date)}${r.night_name ? ` ("${esc(r.night_name)}")` : ""} — <strong style="color:#34D399">${r.invoice_amount != null ? money(r.invoice_amount) : "amount TBC"}</strong></li>`
  ).join("");

  let emailed = false;
  if (RESEND) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "No Dice <elliot@nodice.bar>",
        to: ADMIN_EMAIL,
        subject: `💷 DJ fees to pay today — ${due.length} · ${money(total)}`,
        html: `<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#000;color:#fff;padding:28px;border-radius:12px;max-width:560px;margin:auto">
          <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#DA1B33;margin:0 0 14px">No Dice · DJ Payments</p>
          <h1 style="font-size:22px;margin:0 0 12px">Pay these DJs today</h1>
          <p style="font-size:15px;line-height:1.6;color:#ddd">Their invoices have landed and are due (they played the week before). Total <strong style="color:#34D399">${money(total)}</strong>.</p>
          <ul style="font-size:14px;color:#ddd;padding-left:18px">${li}</ul>
          <p style="margin:22px 0"><a href="${OPS}" style="background:#DA1B33;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700;display:inline-block">Open DJ Payments</a></p>
          <p style="font-size:12px;color:#888;line-height:1.5">Tick each one <strong style="color:#bbb">Paid</strong> in DJ Bookings → Payments once you've sent it, so it drops off next week.</p>
          <p style="font-size:11px;color:#777;margin-top:18px">No Dice · 407 Mentmore Terrace, London Fields, E8 3PH</p>
        </div>`,
      }),
    });
    emailed = true;
  }
  return json({ due: due.length, total, emailed });
});
