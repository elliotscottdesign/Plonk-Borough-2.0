// Supabase Edge Function: keydates
// Split out of `rota` on 2026-07-31 so the ops / key-dates lane owns its own backend
// and no longer shares a file with rota + kitchen. Founder-gated (SEND_SECRET) CRUD on
// the SAME `venue_events` table rota used — no schema change, existing data untouched.
// Feeds the Key Dates page, the Staff Rota builder and the DJ calendar (alarm markers).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
// Verbatim from rota: trims strings, ignores any extra args (callers pass a length hint
// that was never enforced — keep it that way so behaviour is byte-for-byte identical).
const clean = (v: unknown) => (typeof v === "string" ? v.trim() : v);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {};
  try { b = await req.json(); } catch { /* empty body */ }
  const action = b.action as string;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const isAdmin = () => b.secret && b.secret === Deno.env.get("SEND_SECRET");

  try {
    // Every key-dates action is founder-only.
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);

    // ── Opportunities tracker: festivals, half-terms, fireworks, bank holidays… ──
    if (action === "eventsList") {
      const from = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);   // keep the last 2 weeks visible
      const { data } = await sb.from("venue_events").select("*").or(`start_date.gte.${from},end_date.gte.${from}`).order("start_date");
      return json({ ok: true, events: data || [] });
    }
    if (action === "eventAdd") {
      const start_date = String(b.start_date || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date)) return json({ error: "Pick a date." }, 400);
      const title = clean(b.title, 200);
      if (!title) return json({ error: "Give it a name." }, 400);
      const end_date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.end_date || "")) ? String(b.end_date) : null;
      const { data, error } = await sb.from("venue_events").insert({ start_date, end_date, title, category: clean(b.category, 24) || "other", location: clean(b.location, 120) || null, angle: clean(b.angle, 500) || null, source: "manual" }).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, event: data });
    }
    if (action === "eventUpdate") {
      const id = clean(b.id, 40); if (!id) return json({ error: "no event" }, 400);
      const patch: Record<string, unknown> = {};
      if (b.start_date && /^\d{4}-\d{2}-\d{2}$/.test(String(b.start_date))) patch.start_date = String(b.start_date);
      if ("end_date" in b) patch.end_date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.end_date || "")) ? String(b.end_date) : null;
      if ("title" in b) patch.title = clean(b.title, 200);
      if ("category" in b) patch.category = clean(b.category, 24) || "other";
      if ("location" in b) patch.location = clean(b.location, 120) || null;
      if ("angle" in b) patch.angle = clean(b.angle, 500) || null;
      const { error } = await sb.from("venue_events").update(patch).eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    if (action === "eventDelete") {
      const id = clean(b.id, 40); if (!id) return json({ error: "no event" }, 400);
      await sb.from("venue_events").delete().eq("id", id);
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
