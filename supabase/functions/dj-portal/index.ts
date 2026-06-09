// Supabase Edge Function: dj-portal
// The DJ-facing API. Auth = the DJ's private `token` (from their invite link).
// Each DJ can only read/write their OWN profile + bookings. Deploy --no-verify-jwt.
//
// POST { token, action, ...payload }
//   load            → { dj, complete, openSlots, myBookings }
//   save  {profile} → update profile fields
//   photo {dataUrl} → upload base64 image to storage, set image_url
//   claim {date, nightName} → claim an OPEN date (only if profile complete)
//   cancel {date}   → release one of the DJ's own pending dates
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const today = () => new Date().toISOString().slice(0, 10);
const isComplete = (d: any) => !!(d && d.dj_name && d.genres && d.instagram && d.image_url);
const pub = (d: any) => ({ id: d.id, dj_name: d.dj_name, real_name: d.real_name, genres: d.genres, instagram: d.instagram, format: d.format, phone: d.phone, email: d.email, image_url: d.image_url });

async function state(sb: any, id: string) {
  const { data: me } = await sb.from("djs").select("*").eq("id", id).maybeSingle();
  const { data: openSlots } = await sb.from("dj_slots").select("date").eq("status", "open").gte("date", today()).order("date");
  const { data: mine } = await sb.from("dj_slots").select("date,status,night_name,genre").eq("dj_id", id).gte("date", today()).order("date");
  return json({ dj: pub(me), complete: isComplete(me), openSlots: (openSlots || []).map((s: any) => s.date), myBookings: mine || [] });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { token, action, profile, dataUrl, date, nightName } = await req.json().catch(() => ({}));
  if (!token) return json({ error: "missing token" }, 400);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: dj } = await sb.from("djs").select("*").eq("token", token).maybeSingle();
  if (!dj) return json({ error: "invalid link" }, 401);

  if (action === "save") {
    const f = profile || {};
    await sb.from("djs").update({
      dj_name: f.dj_name ?? dj.dj_name, real_name: f.real_name ?? dj.real_name,
      genres: f.genres ?? dj.genres, instagram: f.instagram ?? dj.instagram,
      format: f.format ?? dj.format, phone: f.phone ?? dj.phone, email: f.email ?? dj.email,
      updated_at: new Date().toISOString(),
    }).eq("id", dj.id);
    return state(sb, dj.id);
  }

  if (action === "photo") {
    const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl || "");
    if (!m) return json({ error: "bad image" }, 400);
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    const ext = m[1].includes("png") ? "png" : "jpg";
    const path = `${dj.id}.${ext}`;
    const up = await sb.storage.from("dj-photos").upload(path, bytes, { contentType: m[1], upsert: true });
    if (up.error) return json({ error: up.error.message }, 500);
    const { data: p } = sb.storage.from("dj-photos").getPublicUrl(path);
    const url = `${p.publicUrl}?v=${Date.now()}`;
    await sb.from("djs").update({ image_url: url, updated_at: new Date().toISOString() }).eq("id", dj.id);
    return state(sb, dj.id);
  }

  if (action === "claim") {
    if (!isComplete(dj)) return json({ error: "Finish your profile first" }, 400);
    if (!date) return json({ error: "missing date" }, 400);
    const { data: updated, error } = await sb.from("dj_slots")
      .update({ dj_id: dj.id, status: "pending", night_name: nightName || null, genre: dj.genres, updated_at: new Date().toISOString() })
      .eq("date", date).eq("status", "open").select("date");
    if (error) return json({ error: error.message }, 500);
    if (!updated || !updated.length) return json({ error: "That date was just taken — pick another." }, 409);
    return state(sb, dj.id);
  }

  if (action === "cancel") {
    await sb.from("dj_slots").update({ dj_id: null, status: "open", night_name: null, genre: null, updated_at: new Date().toISOString() })
      .eq("date", date).eq("dj_id", dj.id).eq("status", "pending");
    return state(sb, dj.id);
  }

  return state(sb, dj.id);
});
