// On A Roll menu catalog — read/write the single menu doc.
// - getMenu: public (the customer order page + kitchen screen read it).
// - saveMenu: founder/SEND_SECRET-gated (the /ops → Kitchen → 🍔 Menu editor).
// Deploy: supabase functions deploy menu --no-verify-jwt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SEND_SECRET = Deno.env.get("SEND_SECRET");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  let b: any = {};
  try { b = await req.json(); } catch { /* empty */ }
  const action = String(b.action || "");
  const isAdmin = () => !!(b.secret && SEND_SECRET && b.secret === SEND_SECRET);

  try {
    if (action === "getMenu") {
      const { data, error } = await sb.from("menu_catalog").select("sections,bundles,vat_registered,updated_at").eq("id", 1).maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, sections: data?.sections || [], bundles: data?.bundles || [], vat_registered: !!data?.vat_registered, updated_at: data?.updated_at || null });
    }

    if (action === "saveMenu") {
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const sections = Array.isArray(b.sections) ? b.sections : [];
      const bundles = Array.isArray(b.bundles) ? b.bundles : [];
      // Basic bound: keep the doc sane (the menu is small).
      if (JSON.stringify({ sections, bundles }).length > 800_000) return json({ error: "menu too large" }, 400);
      const { error } = await sb.from("menu_catalog")
        .upsert({ id: 1, sections, bundles, vat_registered: !!b.vat_registered, updated_at: new Date().toISOString(), updated_by: String(b.by || "").slice(0, 60) || null });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // Upload an item photo to the public menu-photos bucket; returns its URL so the
    // menu doc stores a small URL rather than a base64 blob.
    if (action === "uploadPhoto") {
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const m = String(b.dataUrl || "").match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
      if (!m) return json({ error: "bad image" }, 400);
      const contentType = m[1];
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      if (bytes.length > 3_000_000) return json({ error: "image too big (max 3MB)" }, 400);
      const path = `${crypto.randomUUID()}.${(contentType.split("/")[1] || "jpg").replace(/[^\w]/g, "")}`;
      const up = await sb.storage.from("menu-photos").upload(path, bytes, { contentType, upsert: false });
      if (up.error) return json({ error: up.error.message }, 400);
      const { data } = sb.storage.from("menu-photos").getPublicUrl(path);
      return json({ ok: true, url: data.publicUrl });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
