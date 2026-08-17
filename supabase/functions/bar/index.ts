// Supabase Edge Function: bar
// The back end for the BAR page — stock, cost, margin and ordering.
// Talks to the bar_* tables created by supabase/bar_stock_system.sql.
//
// Auth mirrors rota/kitchen exactly:
//   • staff actions  — gated by the member's own portal token (they count stock)
//   • manager/founder actions — gated by SEND_SECRET (money, margins, prices)
//
// EVERY quantity crossing this boundary is converted to the product's base unit
// on the way IN and back to the counting unit on the way OUT. The app never
// has to know about base units, and the database never stores anything else —
// that is the whole reason a case of 24 can't be subtracted from a bottle.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const num = (v: unknown, fb = 0) => (Number.isFinite(+(v as number)) ? +(v as number) : fb);
const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

const staffByToken = async (sb: any, token: unknown) => {
  const t = String(token || "");
  if (!t) return null;
  const { data } = await sb.from("staff").select("*").eq("token", t).limit(1);
  return (data || [])[0] || null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {};
  try { b = await req.json(); } catch { return json({ ok: false, error: "Bad request" }, 400); }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const action = str(b.action, 40);
  const isAdmin = () => b.secret && b.secret === Deno.env.get("SEND_SECRET");
  const me = async () => await staffByToken(sb, b.token);
  // Counting stock is a normal shift job — any signed-in staff member may do it.
  const staffOrAdmin = async () => (isAdmin() ? { name: "Founder" } : await me());

  try {
    // ── The catalogue: what we stock, grouped for the count sheet ───────────
    if (action === "catalogue") {
      if (!(await staffOrAdmin())) return json({ ok: false, error: "Not signed in" }, 403);
      const { data: products } = await sb.from("bar_products")
        .select("id,name,kind,category,count_area,count_unit,count_to_base,order_unit,order_to_base,base_unit,par_base,counted,source,active")
        .eq("active", true).order("category").order("name");
      const { data: suppliers } = await sb.from("bar_suppliers").select("id,name,order_days,delivery_days").eq("active", true).order("name");
      return json({ ok: true, products: products || [], suppliers: suppliers || [] });
    }

    // ── Open (or resume) a stocktake for a date ─────────────────────────────
    // A stocktake is one event; each area is a sheet under it. Resuming is the
    // norm — you count the cellar now and the back bar after close.
    if (action === "openStocktake") {
      const who = await staffOrAdmin();
      if (!who) return json({ ok: false, error: "Not signed in" }, 403);
      const on = str(b.date, 10) || new Date().toISOString().slice(0, 10);
      const area = str(b.area, 40) || "Bar";

      let { data: take } = await sb.from("bar_stocktakes").select("*").eq("taken_on", on).maybeSingle();
      if (!take) {
        const ins = await sb.from("bar_stocktakes").insert({ taken_on: on }).select().single();
        take = ins.data;
      }
      if (take.status === "submitted") return json({ ok: false, error: "That stocktake is already submitted." }, 409);

      let { data: sheet } = await sb.from("bar_stocktake_sheets")
        .select("*").eq("stocktake_id", take.id).eq("area", area).maybeSingle();
      if (!sheet) {
        const ins = await sb.from("bar_stocktake_sheets").insert({
          stocktake_id: take.id, area,
          counted_by: (who as any).id || null, counted_name: (who as any).name || null,
        }).select().single();
        sheet = ins.data;
      }
      const { data: lines } = await sb.from("bar_stocktake_lines")
        .select("product_id,qty,note").eq("sheet_id", sheet.id);
      return json({ ok: true, stocktake: take, sheet, lines: lines || [] });
    }

    // ── Save one counted line (converted to base units here, never in the UI)
    if (action === "saveCount") {
      if (!(await staffOrAdmin())) return json({ ok: false, error: "Not signed in" }, 403);
      const sheetId = str(b.sheetId, 40), productId = str(b.productId, 40);
      if (!sheetId || !productId) return json({ ok: false, error: "Missing sheet or product" }, 400);

      const { data: sheet } = await sb.from("bar_stocktake_sheets").select("id,status").eq("id", sheetId).maybeSingle();
      if (!sheet) return json({ ok: false, error: "Unknown sheet" }, 404);
      if (sheet.status === "submitted") return json({ ok: false, error: "That sheet is submitted — reopen it to change a count." }, 409);

      const { data: p } = await sb.from("bar_products").select("count_to_base").eq("id", productId).maybeSingle();
      if (!p) return json({ ok: false, error: "Unknown product" }, 404);

      const qty = Math.max(0, num(b.qty));
      const qtyBase = qty * num(p.count_to_base, 1);
      await sb.from("bar_stocktake_lines").upsert(
        { sheet_id: sheetId, product_id: productId, qty, qty_base: qtyBase, note: str(b.note, 300) || null },
        { onConflict: "sheet_id,product_id" },
      );
      return json({ ok: true, qty, qty_base: qtyBase });
    }

    // ── Submit a sheet; submit the stocktake when every open sheet is in ────
    if (action === "submitSheet") {
      if (!(await staffOrAdmin())) return json({ ok: false, error: "Not signed in" }, 403);
      const sheetId = str(b.sheetId, 40);
      const { data: sheet } = await sb.from("bar_stocktake_sheets").select("*").eq("id", sheetId).maybeSingle();
      if (!sheet) return json({ ok: false, error: "Unknown sheet" }, 404);

      await sb.from("bar_stocktake_sheets")
        .update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", sheetId);

      const { data: siblings } = await sb.from("bar_stocktake_sheets")
        .select("status").eq("stocktake_id", sheet.stocktake_id);
      const allIn = (siblings || []).every((s: any) => s.status === "submitted");
      if (allIn) {
        await sb.from("bar_stocktakes")
          .update({ status: "submitted", submitted_at: new Date().toISOString() })
          .eq("id", sheet.stocktake_id);
      }
      return json({ ok: true, stocktakeSubmitted: allIn });
    }

    // ── The BAR page headline: what's short, what we're using, what it's worth
    if (action === "summary") {
      if (!(await staffOrAdmin())) return json({ ok: false, error: "Not signed in" }, 403);
      const admin = isAdmin();

      const { data: takes } = await sb.from("bar_stocktakes")
        .select("id,taken_on,status").eq("status", "submitted")
        .order("taken_on", { ascending: false }).limit(2);

      const { data: onHand } = await sb.from("bar_on_hand").select("*");
      const short = (onHand || [])
        .filter((r: any) => r.par_base != null && r.to_order_base > 0)
        .sort((a: any, b: any) => b.to_order_base - a.to_order_base);

      // Money is founder-only, same rule as the rest of the app.
      let value = null, usage = null, variance = null, margins = null;
      if (admin) {
        const { data: v } = await sb.from("bar_stock_value").select("*");
        value = { total: (v || []).reduce((s: number, r: any) => s + num(r.value), 0),
                  uncosted: (v || []).filter((r: any) => !r.costed).length, lines: v || [] };
        const { data: u } = await sb.from("bar_usage_actual").select("*");
        usage = u || [];
        const { data: x } = await sb.from("bar_variance").select("*");
        variance = x || [];
        const { data: m } = await sb.from("bar_margins").select("*");
        margins = m || [];
      }

      const { data: openOrders } = await sb.from("bar_orders")
        .select("id,supplier_id,status,ordered_on,expected_on").in("status", ["sent", "part"]);

      return json({
        ok: true, admin,
        lastCount: takes?.[0] || null,
        prevCount: takes?.[1] || null,
        countsEver: (takes || []).length,
        short, openOrders: openOrders || [],
        value, usage, variance, margins,
      });
    }

    // ── Build a draft order per supplier from what's below par ──────────────
    if (action === "draftOrders") {
      if (!(await staffOrAdmin())) return json({ ok: false, error: "Not signed in" }, 403);
      const { data: onHand } = await sb.from("bar_on_hand").select("*");
      const { data: products } = await sb.from("bar_products")
        .select("id,name,supplier_id,order_unit,order_to_base,pack_cost").eq("active", true);
      const byId: Record<string, any> = {};
      for (const p of products || []) byId[p.id] = p;

      const bySupplier: Record<string, any> = {};
      for (const r of onHand || []) {
        if (!(r.to_order_base > 0)) continue;
        const p = byId[r.product_id];
        if (!p) continue;
        const packs = p.order_to_base > 0 ? Math.ceil(r.to_order_base / p.order_to_base) : null;
        const key = p.supplier_id || "unassigned";
        (bySupplier[key] ||= { supplier_id: p.supplier_id, lines: [], est: 0 });
        bySupplier[key].lines.push({
          product_id: p.id, name: p.name, order_unit: p.order_unit,
          packs, est_cost: packs != null && p.pack_cost != null ? +(packs * p.pack_cost).toFixed(2) : null,
        });
        if (packs != null && p.pack_cost != null) bySupplier[key].est += packs * p.pack_cost;
      }
      return json({ ok: true, orders: Object.values(bySupplier) });
    }

    // ── Log waste / breakage (any staff — it must be frictionless) ──────────
    if (action === "logWaste") {
      const who = await staffOrAdmin();
      if (!who) return json({ ok: false, error: "Not signed in" }, 403);
      const productId = str(b.productId, 40);
      const { data: p } = await sb.from("bar_products").select("count_to_base").eq("id", productId).maybeSingle();
      if (!p) return json({ ok: false, error: "Unknown product" }, 404);
      await sb.from("bar_waste").insert({
        product_id: productId,
        qty_base: Math.max(0, num(b.qty)) * num(p.count_to_base, 1),
        reason: str(b.reason, 20) || "other",
        logged_by: (who as any).name || null,
        note: str(b.note, 300) || null,
      });
      return json({ ok: true });
    }

    // ── Founder: set par / price / supplier on a product ────────────────────
    if (action === "saveProduct") {
      if (!isAdmin()) return json({ ok: false, error: "Not allowed" }, 403);
      const id = str(b.id, 40);
      if (!id) return json({ ok: false, error: "Missing product" }, 400);
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (b.par != null)        patch.par_base   = Math.max(0, num(b.par)) * num(b.count_to_base, 1);
      if (b.pack_cost != null)  patch.pack_cost  = num(b.pack_cost);
      if (b.supplier_id != null) patch.supplier_id = str(b.supplier_id, 40) || null;
      if (b.active != null)     patch.active     = !!b.active;
      if (b.notes != null)      patch.notes      = str(b.notes, 500);
      await sb.from("bar_products").update(patch).eq("id", id);
      return json({ ok: true });
    }

    return json({ ok: false, error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message || e) }, 500);
  }
});
