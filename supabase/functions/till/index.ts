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
