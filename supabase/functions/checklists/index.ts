// Supabase Edge Function: checklists  (bar lane)
// Stores founder edits to the checklists. One row per checklist overrides that
// checklist's whole definition; no row = the app uses the built-in code default.
//   • list  (open read)   → { kitchen: {key:def,…}, shift: {key:def,…} }
//   • save  (SEND_SECRET) → upsert one { system, checklist_key, def }
//   • reset (SEND_SECRET) → delete one override (revert that checklist to code)
// The content isn't sensitive (the defaults already ship in the public bundle), so
// the read is open; only writes are gated. Table: checklist_templates (additive).
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
  try { b = await req.json(); } catch { /* empty body */ }
  const action = b.action as string;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const isAdmin = () => b.secret && b.secret === Deno.env.get("SEND_SECRET");

  try {
    if (action === "list") {
      const { data } = await sb.from("checklist_templates").select("system,checklist_key,def,updated_at,updated_by");
      const out: any = { kitchen: {}, shift: {}, meta: {} };
      for (const r of data || []) {
        if (r.system !== "kitchen" && r.system !== "shift") continue;
        out[r.system][r.checklist_key] = r.def;
        out.meta[`${r.system}:${r.checklist_key}`] = { updated_at: r.updated_at, updated_by: r.updated_by };
      }
      return json({ ok: true, ...out });
    }

    // ── writes: founder only ────────────────────────────────────────────────────
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);

    if (action === "save") {
      const system = String(b.system || "");
      const checklist_key = String(b.checklist_key || "").slice(0, 60);
      const def = b.def;
      if (system !== "kitchen" && system !== "shift") return json({ error: "bad system" }, 400);
      if (!checklist_key) return json({ error: "no checklist_key" }, 400);
      if (!def || typeof def !== "object" || Array.isArray(def)) return json({ error: "bad def" }, 400);
      const { error } = await sb.from("checklist_templates").upsert(
        { system, checklist_key, def, updated_at: new Date().toISOString(), updated_by: String(b.by || "").slice(0, 80) || null },
        { onConflict: "system,checklist_key" },
      );
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "reset") {
      const system = String(b.system || "");
      const checklist_key = String(b.checklist_key || "");
      if (!system || !checklist_key) return json({ error: "missing system/key" }, 400);
      await sb.from("checklist_templates").delete().eq("system", system).eq("checklist_key", checklist_key);
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
