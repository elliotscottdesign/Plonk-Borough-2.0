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

    return json({ ok: false, error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500);
  }
});
