// Food self-order + kitchen tickets — On A Roll food truck.
// - createOrder: the customer's order page posts here after paying (Stripe).
// - listOrders / setStatus: the kitchen display (/ops → Kitchen → 🎫 Orders),
//   founder/SEND_SECRET-gated. Marking an order READY fires the "food ready"
//   SMS via Twilio (reuses the same account/secrets as the tournament call-ups).
// Deploy: supabase functions deploy food-order --no-verify-jwt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SEND_SECRET = Deno.env.get("SEND_SECRET");

// Twilio — same secrets the tournament function already uses.
const TW_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TW_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TW_SMS_FROM = Deno.env.get("TWILIO_SMS_FROM") || "NoDice";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const clean = (v: unknown, n = 200) => (v == null ? "" : String(v)).slice(0, n).trim();

// The pre-programmed "food ready" message (founder brief Aug 2026).
const readyMessage = (orderNo: number, name?: string | null) =>
  `On A Roll 🍔🍟 Order #${orderNo} is READY — come collect it from the van!${name ? ` Thanks ${name}.` : ""}`;

async function sendSMS(to: string, body: string): Promise<boolean> {
  if (!TW_SID || !TW_TOKEN || !to) return false;
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TW_SID}/Messages.json`, {
      method: "POST",
      headers: { "Authorization": "Basic " + btoa(`${TW_SID}:${TW_TOKEN}`), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: TW_SMS_FROM, To: to, Body: body }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// Order page the waitlist "you can order again" text points at (update to the live URL).
const ORDER_URL = "https://nodice.bar/onaroll";

async function activeCount(sb: any): Promise<number> {
  const { count } = await sb.from("food_orders").select("id", { count: "exact", head: true }).in("status", ["new", "preparing", "ready"]);
  return count || 0;
}
// Effective open/paused: paused manually, OR auto-paused when live orders hit the threshold.
async function getEffective(sb: any) {
  const { data: s } = await sb.from("food_settings").select("*").eq("id", 1).maybeSingle();
  const paused = !!s?.paused, auto = !!s?.auto_pause, threshold = s?.auto_threshold ?? 8;
  const active = await activeCount(sb);
  const autoTripped = auto && threshold >= 1 && active >= threshold;   // threshold 0 = auto-pause off
  return { open: !(paused || autoTripped), paused, auto, threshold, active, autoTripped };
}
async function waitingCount(sb: any): Promise<number> {
  const { count } = await sb.from("food_waitlist").select("id", { count: "exact", head: true }).is("notified_at", null);
  return count || 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  let b: any = {};
  try { b = await req.json(); } catch { /* empty body */ }
  const action = String(b.action || "");
  const isAdmin = () => !!(b.secret && SEND_SECRET && b.secret === SEND_SECRET);

  try {
    // ── Customer places a (paid) order from the order page ──────────────────────
    if (action === "createOrder") {
      const items = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
      if (!items.length) return json({ error: "empty order" }, 400);
      const eff0 = await getEffective(sb);
      if (!eff0.open) return json({ error: "Ordering is paused right now — please try again shortly.", open: false }, 409);
      const row = {
        customer_name: clean(b.name, 80) || null,
        customer_phone: clean(b.phone, 30) || null,
        items,
        total_pence: Math.max(0, parseInt(b.total_pence, 10) || 0),
        paid: !!b.payment_ref,
        payment_ref: clean(b.payment_ref, 120) || null,
        allergen_note: clean(b.allergen_note, 500) || null,
        voucher_code: clean(b.voucher_code, 40) || null,
        status: "new",
      };
      const { data, error } = await sb.from("food_orders").insert(row).select("id,order_no").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, id: data.id, order_no: data.order_no });
    }

    // ── Kitchen display: list live orders (founder/ops) ─────────────────────────
    if (action === "listOrders") {
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const { data, error } = await sb.from("food_orders")
        .select("*").in("status", ["new", "preparing", "ready"]).order("created_at", { ascending: true });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, orders: data || [] });
    }

    // ── Kitchen display: advance an order; READY fires the "food ready" SMS once ─
    if (action === "setStatus") {
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const id = clean(b.id, 40);
      const status = clean(b.status, 20);
      if (!id || !["preparing", "ready", "collected", "cancelled"].includes(status))
        return json({ error: "bad request" }, 400);

      const patch: any = { status };
      if (status === "ready") { patch.ready_at = new Date().toISOString(); patch.ready_by = clean(b.by, 60) || null; }
      if (status === "collected") patch.collected_at = new Date().toISOString();

      // Only fire the text when it actually flips to ready (guard against a double-tap
      // texting twice): update to ready only if it isn't ready/collected already.
      const q = sb.from("food_orders").update(patch).eq("id", id);
      const { data, error } = (status === "ready"
        ? await q.not("status", "in", "(ready,collected)").select("*").maybeSingle()
        : await q.select("*").single());
      if (error) return json({ error: error.message }, 400);
      if (status === "ready" && !data) return json({ ok: true, order: null, texted: false, note: "already ready" });

      let texted = false;
      if (status === "ready" && data?.customer_phone) {
        texted = await sendSMS(data.customer_phone, readyMessage(data.order_no, data.customer_name));
      }
      return json({ ok: true, order: data, texted });
    }

    // Kitchen display: full recent order history (all statuses), newest first.
    if (action === "listHistory") {
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      // Return all orders; the kitchen screen splits real orders from abandoned
      // (unpaid, status 'pending') checkouts into separate filters.
      const { data, error } = await sb.from("food_orders")
        .select("*").order("created_at", { ascending: false }).limit(200);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, orders: data || [] });
    }

    // ── Order pause + customer waitlist ──────────────────────────────────────────
    if (action === "getStatus") {   // public — the customer order page reads this
      const e = await getEffective(sb);
      return json({ ok: true, ...e, waiting: await waitingCount(sb) });
    }
    if (action === "setSettings") { // kitchen — pause / auto-pause / threshold
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const patch: any = { updated_at: new Date().toISOString() };
      if (typeof b.paused === "boolean") patch.paused = b.paused;
      if (typeof b.auto_pause === "boolean") patch.auto_pause = b.auto_pause;
      if (b.auto_threshold != null) patch.auto_threshold = Math.max(1, parseInt(b.auto_threshold, 10) || 8);
      const { error } = await sb.from("food_settings").update(patch).eq("id", 1);
      if (error) return json({ error: error.message }, 400);
      const e = await getEffective(sb);
      return json({ ok: true, ...e, waiting: await waitingCount(sb) });
    }
    if (action === "joinWaitlist") { // public — customer leaves their number while paused
      const phone = clean(b.phone, 30);
      if (!phone) return json({ error: "no phone number" }, 400);
      const { data: dupe } = await sb.from("food_waitlist").select("id").eq("phone", phone).is("notified_at", null).maybeSingle();
      if (!dupe) { const { error } = await sb.from("food_waitlist").insert({ phone, name: clean(b.name, 80) || null }); if (error) return json({ error: error.message }, 400); }
      return json({ ok: true });
    }
    if (action === "sendDueWaitlist") { // cron (every minute) — text the next waiter if OPEN
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const e = await getEffective(sb);
      if (!e.open) return json({ ok: true, sent: 0, note: "paused" });
      const { data: next } = await sb.from("food_waitlist").select("*").is("notified_at", null).order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (!next) return json({ ok: true, sent: 0 });
      const texted = await sendSMS(next.phone, `On A Roll 🍔🍟 you can order again! Order here: ${ORDER_URL}`);
      await sb.from("food_waitlist").update({ notified_at: new Date().toISOString() }).eq("id", next.id);
      return json({ ok: true, sent: 1, texted });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
