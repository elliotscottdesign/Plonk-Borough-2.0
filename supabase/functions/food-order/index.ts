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
        .select("*").in("status", ["new", "preparing", "ready", "card_failed"]).order("created_at", { ascending: true });
      if (error) return json({ error: error.message }, 400);
      // Enrich coded orders with the code's kind/label so the kitchen can colour
      // staff/comp orders differently (deprioritise vs paying customers).
      const orderCodes = [...new Set((data || []).map((o: any) => o.order_code).filter(Boolean))];
      if (orderCodes.length) {
        const { data: cr } = await sb.from("order_codes").select("code,kind,label").in("code", orderCodes);
        const cm: Record<string, any> = Object.fromEntries((cr || []).map((c: any) => [c.code, c]));
        for (const o of (data as any[])) if (o.order_code && cm[o.order_code]) { o.code_kind = cm[o.order_code].kind; o.code_label = cm[o.order_code].label; }
      }
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

    // ── Customer texts: resend "ready", "order received", or a custom reply ─────
    if (action === "resendReady") {   // kitchen — re-send the "food ready" text
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const { data } = await sb.from("food_orders").select("order_no,customer_name,customer_phone").eq("id", clean(b.id, 40)).maybeSingle();
      if (!data?.customer_phone) return json({ error: "No phone number on this order." }, 400);
      const texted = await sendSMS(data.customer_phone, readyMessage(data.order_no, data.customer_name));
      return json({ ok: true, texted });
    }
    if (action === "notifyReceived") {   // called by the webhook on payment — one reassurance text
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const { data } = await sb.from("food_orders").select("order_no,customer_name,customer_phone").eq("id", clean(b.id, 40)).maybeSingle();
      if (!data?.customer_phone) return json({ ok: true, texted: false });
      const texted = await sendSMS(data.customer_phone, `On A Roll 🍔 Order #${data.order_no} received — we're on it! We'll text you the moment it's ready to collect.`);
      return json({ ok: true, texted });
    }
    if (action === "markPaidAtBar") {   // kitchen — a card-failed order was settled at the bar → make it
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const { data, error } = await sb.from("food_orders").update({ paid: true, status: "new" }).eq("id", clean(b.id, 40)).eq("status", "card_failed").select("*").maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, order: data });
    }
    if (action === "sendDueNudges") {   // cron (every minute) — ONE auto-nudge for orders left ready
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString();   // 3 min after ready
      const { data: due } = await sb.from("food_orders")
        .select("id,order_no,customer_phone")
        .eq("status", "ready").is("nudged_at", null).not("ready_at", "is", null).lte("ready_at", cutoff).limit(20);
      let sent = 0;
      for (const o of (due || [])) {
        await sb.from("food_orders").update({ nudged_at: new Date().toISOString() }).eq("id", o.id);   // mark first → never double-nudge
        if (o.customer_phone) { const ok = await sendSMS(o.customer_phone, `⏰ On A Roll: Order #${o.order_no} is ready and waiting — please come to the van to collect it!`); if (ok) sent++; }
      }
      return json({ ok: true, sent });
    }
    if (action === "textCustomer") {   // kitchen — send a custom message (e.g. reply to a note)
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const message = clean(b.message, 300);
      if (!message) return json({ error: "Write a message first." }, 400);
      const { data } = await sb.from("food_orders").select("order_no,customer_phone").eq("id", clean(b.id, 40)).maybeSingle();
      if (!data?.customer_phone) return json({ error: "No phone number on this order." }, 400);
      const texted = await sendSMS(data.customer_phone, `On A Roll (Order #${data.order_no}): ${message}`);
      return json({ ok: true, texted });
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
      if (b.auto_threshold != null) patch.auto_threshold = Math.max(0, parseInt(b.auto_threshold, 10) || 0);   // 0 = auto-pause off
      const { error } = await sb.from("food_settings").update(patch).eq("id", 1);
      if (error) return json({ error: error.message }, 400);
      const e = await getEffective(sb);
      return json({ ok: true, ...e, waiting: await waitingCount(sb) });
    }
    // ── Live stock levels (limiting ingredients) → drives menu availability ──────
    if (action === "getStock") {   // public — the order page + kitchen read this
      const { data } = await sb.from("kitchen_stock_levels").select("*");
      const levels: Record<string, any> = {};
      for (const r of (data || [])) {
        const soldOut = r.override === "sold_out" || (r.override !== "available" && r.count <= 0);
        levels[r.ingredient] = { count: r.count, override: r.override, soldOut, label: r.label };
      }
      return json({ ok: true, levels });
    }
    if (action === "setStock") {   // kitchen — set absolute counts (opening / correction)
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const levels = (b.levels && typeof b.levels === "object") ? b.levels : {};
      for (const [ing, count] of Object.entries(levels)) {
        await sb.from("kitchen_stock_levels").update({ count: Math.max(0, parseInt(String(count), 10) || 0), updated_at: new Date().toISOString() }).eq("ingredient", ing);
      }
      return json({ ok: true });
    }
    if (action === "adjustStock") {   // kitchen — nudge one ingredient by +/- delta
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const ing = clean(b.ingredient, 40), delta = parseInt(String(b.delta), 10) || 0;
      const { data: cur } = await sb.from("kitchen_stock_levels").select("count").eq("ingredient", ing).maybeSingle();
      if (cur) await sb.from("kitchen_stock_levels").update({ count: Math.max(0, cur.count + delta), updated_at: new Date().toISOString() }).eq("ingredient", ing);
      return json({ ok: true });
    }
    if (action === "setStockOverride") {   // kitchen — force sold_out / available / auto(null)
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const ing = clean(b.ingredient, 40);
      const ov = b.override === "sold_out" || b.override === "available" ? b.override : null;
      await sb.from("kitchen_stock_levels").update({ override: ov, updated_at: new Date().toISOString() }).eq("ingredient", ing);
      return json({ ok: true });
    }

    // ── Order codes (party tabs / staff food) — order without a card, tracked ────
    if (action === "listCodes") {   // kitchen — codes + live tab totals
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const { data: codes } = await sb.from("order_codes").select("*").order("created_at", { ascending: false });
      const { data: orders } = await sb.from("food_orders").select("order_code,total_pence,status").not("order_code", "is", null);
      const tally: Record<string, { orders: number; total_pence: number }> = {};
      for (const o of (orders || [])) {
        if (o.status === "cancelled" || o.status === "card_failed") continue;
        const t = (tally[o.order_code] ||= { orders: 0, total_pence: 0 });
        t.orders++; t.total_pence += o.total_pence || 0;
      }
      return json({ ok: true, codes: (codes || []).map((c: any) => ({ ...c, tab: tally[c.code] || { orders: 0, total_pence: 0 } })) });
    }
    if (action === "createCode") {   // kitchen — create a party/staff/comp code
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const code = clean(b.code, 40).toUpperCase().replace(/\s+/g, "");
      if (code.length < 3) return json({ error: "Code needs at least 3 characters." }, 400);
      const kind = ["party", "staff", "comp"].includes(b.kind) ? b.kind : "party";
      const { error } = await sb.from("order_codes").insert({ code, label: clean(b.label, 80) || null, kind });
      if (error) return json({ error: /duplicate/i.test(error.message) ? "That code already exists." : error.message }, 400);
      return json({ ok: true });
    }
    if (action === "setCodeActive") {   // kitchen — open/close a code (close = settle at bar)
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      await sb.from("order_codes").update({ active: !!b.active }).eq("code", clean(b.code, 40).toUpperCase());
      return json({ ok: true });
    }
    if (action === "validateCode") {   // public — customer checks a code before ordering
      const { data: c } = await sb.from("order_codes").select("code,label,kind,active").eq("code", clean(b.code, 40).toUpperCase()).maybeSingle();
      if (!c || !c.active) return json({ ok: true, valid: false });
      return json({ ok: true, valid: true, label: c.label, kind: c.kind });
    }
    if (action === "createCodedOrder") {   // public — place an order on a code (no card)
      const code = clean(b.code, 40).toUpperCase();
      const { data: codeRow } = await sb.from("order_codes").select("*").eq("code", code).maybeSingle();
      if (!codeRow || !codeRow.active) return json({ error: "That code isn't valid — check with staff." }, 403);
      const name = clean(b.name, 80), phone = clean(b.phone, 30);
      if (name.length < 2) return json({ error: "Please enter your name." }, 400);
      const cart = Array.isArray(b.cart) ? b.cart.slice(0, 50) : [];
      if (!cart.length) return json({ error: "Your order is empty." }, 400);
      const eff = await getEffective(sb);
      if (!eff.open) return json({ error: "Ordering is paused right now — please try again shortly.", open: false }, 409);
      // price from the live menu + tally limiting ingredients
      const { data: menu } = await sb.from("menu_catalog").select("sections").eq("id", 1).maybeSingle();
      const idx = new Map<string, any>();
      for (const sec of (Array.isArray(menu?.sections) ? menu!.sections : [])) for (const it of (sec.items || [])) idx.set(String(it.id), it);
      const lineItems: any[] = []; let total = 0; const need: Record<string, number> = {};
      for (const line of cart) {
        const it = idx.get(String(line.id));
        if (!it) return json({ error: "That menu has just changed — please refresh." }, 409);
        const qty = Math.min(20, Math.max(1, parseInt(String(line.qty), 10) || 1));
        const chosen = (it.addons || []).filter((a: any) => (Array.isArray(line.addon_ids) ? line.addon_ids.map(String) : []).includes(String(a.id)));
        const options = chosen.map((a: any) => ({ name: a.name, price_pence: parseInt(a.price_pence, 10) || 0 }));
        const stock = Array.isArray(it.stock) ? it.stock : [];
        total += ((parseInt(it.sell_pence, 10) || 0) + options.reduce((s: number, o: any) => s + o.price_pence, 0)) * qty;
        for (const ing of stock) need[ing] = (need[ing] || 0) + qty;
        lineItems.push({ name: it.name, qty, price_pence: parseInt(it.sell_pence, 10) || 0, options, stock });
      }
      // never oversell + draw down (order is confirmed on placement — no card step)
      if (Object.keys(need).length) {
        const { data: levels } = await sb.from("kitchen_stock_levels").select("*");
        const lvl: Record<string, any> = Object.fromEntries((levels || []).map((r: any) => [r.ingredient, r]));
        for (const [ing, qty] of Object.entries(need)) {
          const r = lvl[ing]; if (!r) continue;
          const soldOut = r.override === "sold_out" || (r.override !== "available" && r.count <= 0);
          const avail = r.override === "available" ? Infinity : r.count;
          if (soldOut || qty > avail) return json({ error: `Sorry — we've run low on ${r.label || ing}. Adjust your order.`, sold_out: ing }, 409);
        }
        for (const [ing, qty] of Object.entries(need)) {
          const { data: cur } = await sb.from("kitchen_stock_levels").select("count").eq("ingredient", ing).maybeSingle();
          if (cur) await sb.from("kitchen_stock_levels").update({ count: Math.max(0, cur.count - qty), updated_at: new Date().toISOString() }).eq("ingredient", ing);
        }
      }
      const { data: row, error } = await sb.from("food_orders").insert({
        customer_name: name, customer_phone: phone, customer_note: clean(b.note, 300) || null,
        items: lineItems, total_pence: total, status: "new", paid: false,
        order_code: code, allergen_note: clean(b.allergen_note, 500) || null,
      }).select("id,order_no").single();
      if (error) return json({ error: error.message }, 400);
      if (phone) await sendSMS(phone, `On A Roll 🍔 Order #${row.order_no} received — we're on it! We'll text you the moment it's ready to collect.`);
      return json({ ok: true, order_id: row.id, order_no: row.order_no, code_label: codeRow.label });
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
