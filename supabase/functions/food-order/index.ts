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
  `On A Roll 🌭 Order #${orderNo} is READY — come collect it from the van!${name ? ` Thanks ${name}.` : ""}`;

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

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
