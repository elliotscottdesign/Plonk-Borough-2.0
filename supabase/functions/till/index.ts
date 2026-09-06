// Supabase Edge Function: till
// Slice 1 of the No Dice till — READ-ONLY. Serves the cost side of the
// catalogue screen: what one ml/each of every stock product costs
// (bar_cost_base) and the margins of any recipes that exist (bar_margins).
//
// This function writes NOTHING. The till lane reads the bar lane's views but
// never redefines them (CLAUDE-TILL.md); everything money-shaped is
// founder-gated with SEND_SECRET, same as the bar summary.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const num = (v: unknown, fb = 0) => (Number.isFinite(+(v as number)) ? +(v as number) : fb);
const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {};
  try { b = await req.json(); } catch { return json({ ok: false, error: "Bad request" }, 400); }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const action = String(b.action ?? "").trim().slice(0, 40);
  const isAdmin = b.secret && b.secret === Deno.env.get("SEND_SECRET");

  try {
    // ── Everything the catalogue screen needs to put GP on every line ───────
    if (action === "catalogue") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);

      // Cost of one base unit (ml / g / each) of every active product.
      const { data: costs } = await sb.from("bar_cost_base")
        .select("product_id,name,kind,base_unit,source,cost_per_base,costed");

      // GP of every recipe that has been typed in (cocktails, food, deals).
      const { data: margins } = await sb.from("bar_margins")
        .select("menu_item_id,name,category,sell_price,net_price,recipe_lines,unpriced_lines,recipe_cost,gross_profit,gp_percent");

      return json({ ok: true, costs: costs || [], margins: margins || [] });
    }

    // ── Vouchers at the till (founder, 21 Aug 2026): customers pay with prize
    //    / goodwill vouchers, redeemed right at the till. Reads and updates the
    //    SAME rows the staff-portal Prizes flow uses (pool_vouchers,
    //    pingpong_vouchers, manager_vouchers) — no schema change, redeemed_at/
    //    redeemed_by set exactly as the rota fn sets them. ───────────────────
    const VOUCHER_TABLES: Record<string, string> = {
      pool: "pool_vouchers", pingpong: "pingpong_vouchers", manager: "manager_vouchers",
    };
    const findVoucher = async (rawCode: string) => {
      const code = String(rawCode || "").trim();
      if (!code) return null;
      for (const [source, table] of Object.entries(VOUCHER_TABLES)) {
        const { data } = await sb.from(table)
          .select("id,code,display_name,amount_pence,redeemed_at,redeemed_by,created_at")
          .ilike("code", code).limit(1);
        if (data && data[0]) return { source, table, v: data[0] };
      }
      return null;
    };

    // Every OUTSTANDING voucher (not yet redeemed), newest first — the till
    // shows the list with owners' names so staff can pick instead of typing.
    if (action === "voucherList") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);
      const out: any[] = [];
      for (const [source, table] of Object.entries(VOUCHER_TABLES)) {
        const { data } = await sb.from(table)
          .select("code,display_name,amount_pence,created_at")
          .is("redeemed_at", null)
          .order("created_at", { ascending: false }).limit(200);
        for (const v of data || []) {
          out.push({ code: v.code, name: v.display_name || "", amount_pence: v.amount_pence, source, created_at: v.created_at });
        }
      }
      out.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      return json({ ok: true, vouchers: out });
    }

    // ── The drawn room (till_settings key 'floor') — shared across tills ────
    if (action === "floorGet") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);
      const { data } = await sb.from("till_settings").select("value,updated_at").eq("key", "floor").maybeSingle();
      return json({ ok: true, floor: data?.value || null, updated_at: data?.updated_at || null });
    }
    if (action === "floorSave") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);
      if (!b.floor || !Array.isArray(b.floor.tables)) return json({ ok: false, error: "Bad floor plan" }, 400);
      await sb.from("till_settings").upsert({ key: "floor", value: b.floor, updated_at: new Date().toISOString() });
      return json({ ok: true });
    }

    // ═══ REAL ORDERS — sessions, shared floor, payments, Z-reads ════════════
    // Training mode: real shared state with money discipline, run alongside
    // Lightspeed. Every money action also lands in the append-only till_events.
    const logEvent = (kind: string, detail: unknown, sessionId?: string | null, orderId?: string | null) =>
      sb.from("till_events").insert({ kind, detail, session_id: sessionId || null, order_id: orderId || null, who: str(b.by, 60) || null });

    const openSession = async () => {
      const { data } = await sb.from("till_sessions").select("*").eq("status", "open")
        .order("opened_at", { ascending: false }).limit(1);
      return (data || [])[0] || null;
    };

    // The whole day's state in one call: the open session + every open order.
    if (action === "dayState") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);
      const s = await openSession();
      let orders: any[] = [];
      if (s) {
        const { data } = await sb.from("till_orders").select("*").eq("session_id", s.id).eq("status", "open");
        orders = data || [];
      }
      return json({ ok: true, session: s, orders });
    }

    if (action === "openDay") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);
      const existing = await openSession();
      if (existing) return json({ ok: false, error: "The day is already open." }, 409);
      const { data: sess, error } = await sb.from("till_sessions").insert({
        opened_by: str(b.by, 60) || null, float_start_pence: Math.max(0, Math.round(num(b.float_pence))),
      }).select().single();
      if (error) return json({ ok: false, error: error.message }, 500);
      await logEvent("open_day", { float_pence: sess.float_start_pence }, sess.id);
      return json({ ok: true, session: sess });
    }

    // Push one order's working state (last write wins per order — one order is
    // only ever rung at one till at a time in practice).
    if (action === "saveOrder") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);
      const o = b.order;
      if (!o || !o.id || !o.kind) return json({ ok: false, error: "Bad order" }, 400);
      const s = await openSession();
      if (!s) return json({ ok: false, error: "The day isn't open." }, 409);
      const { error } = await sb.from("till_orders").upsert({
        id: str(o.id, 40), session_id: s.id, kind: str(o.kind, 10), ref: str(o.ref, 80) || null,
        name: str(o.name, 80) || null, status: "open", disc: o.disc || null, voucher: o.voucher || null,
        lines: Array.isArray(o.lines) ? o.lines : [], total_pence: Math.round(num(o.total_pence)),
        opened_at: o.openedAt || undefined, updated_at: new Date().toISOString(),
      });
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true });
    }

    // Take the money: writes the payment rows, marks the order paid, logs it.
    if (action === "payOrder") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);
      const s = await openSession();
      if (!s) return json({ ok: false, error: "The day isn't open." }, 409);
      const orderId = str(b.orderId, 40);
      const pays = Array.isArray(b.payments) ? b.payments : [];
      for (const p of pays) {
        await sb.from("till_payments").insert({
          session_id: s.id, order_id: orderId, method: str(p.method, 20) || "cash",
          amount_pence: Math.round(num(p.amount_pence)), ref: str(p.ref, 40) || null, taken_by: str(b.by, 60) || null,
        });
      }
      await sb.from("till_orders").update({
        status: "paid", closed_at: new Date().toISOString(), total_pence: Math.round(num(b.total_pence)),
      }).eq("id", orderId);
      await logEvent("pay", { payments: pays, total_pence: Math.round(num(b.total_pence)) }, s.id, orderId);
      return json({ ok: true });
    }

    if (action === "voidOrder") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);
      const s = await openSession();
      const orderId = str(b.orderId, 40);
      await sb.from("till_orders").update({ status: "void", closed_at: new Date().toISOString() }).eq("id", orderId);
      await logEvent("void", { reason: str(b.reason, 200) || null }, s?.id, orderId);
      return json({ ok: true });
    }

    // Close the day: expected cash = float + cash taken; over/short recorded;
    // the Z number is strictly sequential — gaps would show, which is the point.
    if (action === "closeDay") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);
      const s = await openSession();
      if (!s) return json({ ok: false, error: "The day isn't open." }, 409);
      const { data: stillOpen } = await sb.from("till_orders").select("id,ref,name,kind").eq("session_id", s.id).eq("status", "open");
      if ((stillOpen || []).length) {
        return json({ ok: false, error: `${stillOpen!.length} order(s) still open — pay or void them first.`, open: stillOpen }, 409);
      }
      const { data: pays } = await sb.from("till_payments").select("method,amount_pence").eq("session_id", s.id);
      const sum = (m: string) => (pays || []).filter((p: any) => p.method === m).reduce((t: number, p: any) => t + p.amount_pence, 0);
      const cash = sum("cash"), voucher = sum("voucher");
      const counted = Math.round(num(b.counted_pence));
      const expected = s.float_start_pence + cash;
      const { data: zmax } = await sb.from("till_sessions").select("z_number").not("z_number", "is", null)
        .order("z_number", { ascending: false }).limit(1);
      const z = ((zmax || [])[0]?.z_number || 0) + 1;
      const { data: paidOrders } = await sb.from("till_orders").select("total_pence").eq("session_id", s.id).eq("status", "paid");
      const gross = (paidOrders || []).reduce((t: number, o: any) => t + (o.total_pence || 0), 0);
      await sb.from("till_sessions").update({
        status: "closed", closed_at: new Date().toISOString(), closed_by: str(b.by, 60) || null,
        float_counted_pence: counted, expected_cash_pence: expected, over_short_pence: counted - expected, z_number: z,
      }).eq("id", s.id);
      await logEvent("close_day", { z, gross_pence: gross, cash_pence: cash, voucher_pence: voucher, expected_pence: expected, counted_pence: counted }, s.id);
      return json({
        ok: true, z, gross_pence: gross, cash_pence: cash, voucher_pence: voucher,
        float_pence: s.float_start_pence, expected_pence: expected, counted_pence: counted,
        over_short_pence: counted - expected, orders: (paidOrders || []).length,
      });
    }

    if (action === "voucherLookup") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);
      const hit = await findVoucher(b.code);
      if (!hit) return json({ ok: false, error: "No voucher with that code." }, 404);
      const { v, source } = hit;
      return json({ ok: true, voucher: {
        code: v.code, name: v.display_name || "", amount_pence: v.amount_pence,
        source, redeemed_at: v.redeemed_at, redeemed_by: v.redeemed_by,
      } });
    }

    if (action === "voucherRedeem") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);
      const hit = await findVoucher(b.code);
      if (!hit) return json({ ok: false, error: "No voucher with that code." }, 404);
      if (hit.v.redeemed_at) {
        return json({ ok: false, error: `Already redeemed${hit.v.redeemed_by ? ` by ${hit.v.redeemed_by}` : ""} on ${String(hit.v.redeemed_at).slice(0, 10)}.` }, 409);
      }
      await sb.from(hit.table)
        .update({ redeemed_at: new Date().toISOString(), redeemed_by: String(b.by || "Till").slice(0, 80) })
        .eq("id", hit.v.id);
      return json({ ok: true, code: hit.v.code, amount_pence: hit.v.amount_pence });
    }

    if (action === "voucherUnredeem") {
      if (!isAdmin) return json({ ok: false, error: "Not allowed" }, 403);
      const hit = await findVoucher(b.code);
      if (!hit) return json({ ok: false, error: "No voucher with that code." }, 404);
      await sb.from(hit.table).update({ redeemed_at: null, redeemed_by: null }).eq("id", hit.v.id);
      return json({ ok: true });
    }

    return json({ ok: false, error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500);
  }
});
