// Supabase Edge Function: dj-portal
// DJ-facing API. Auth = the DJ's private `token`. Deploy --no-verify-jwt.
//
// POST { token, action, ... }
//   load             → { dj, complete, openSlots:[{date,blocked:[subgenre]}], myBookings }
//   save  {profile}  → update profile (incl. soundcloud/spotify/youtube)
//   photo {dataUrl}  → upload base64 image to storage
//   claim {date, nightName, genres:[], subgenres:[]} → claim an OPEN date, with
//          the genres/sub-genres for that night. A sub-genre booked on the day
//          BEFORE or AFTER is blocked (same day is allowed). Profile must be complete.
//   cancel {date}    → release the DJ's own pending date
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const todayISO = () => new Date().toISOString().slice(0, 10);
const shift = (d: string, n: number) => { const dt = new Date(d + "T00:00:00Z"); dt.setUTCDate(dt.getUTCDate() + n); return dt.toISOString().slice(0, 10); };
const isComplete = (d: any) => !!(d && d.dj_name && d.genres && d.instagram && d.image_url);
const arr = (x: any) => Array.isArray(x) ? x : [];
const pub = (d: any) => ({ id: d.id, dj_name: d.dj_name, real_name: d.real_name, genres: d.genres, instagram: d.instagram, format: d.format, phone: d.phone, email: d.email, image_url: d.image_url, soundcloud: d.soundcloud, spotify: d.spotify, youtube: d.youtube });

async function state(sb: any, id: string) {
  const today = todayISO();
  const { data: me } = await sb.from("djs").select("*").eq("id", id).maybeSingle();
  // booked slots (for adjacency) — from yesterday onward
  const { data: booked } = await sb.from("dj_slots").select("date, subgenres").not("dj_id", "is", null).gte("date", shift(today, -1));
  const map: Record<string, string[]> = {};
  for (const s of booked || []) map[s.date] = arr(s.subgenres);
  const { data: openRows } = await sb.from("dj_slots").select("date").eq("status", "open").gte("date", today).order("date");
  const openSlots = (openRows || []).map((s: any) => ({
    date: s.date,
    blocked: [...new Set([...(map[shift(s.date, -1)] || []), ...(map[shift(s.date, 1)] || [])])],
  }));
  const { data: mine } = await sb.from("dj_slots").select("date,status,night_name,genres,subgenres").eq("dj_id", id).gte("date", today).order("date");
  return json({ dj: pub(me), complete: isComplete(me), openSlots, myBookings: mine || [] });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { token, action, profile, dataUrl, date, nightName, genres, subgenres } = await req.json().catch(() => ({}));
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
      soundcloud: f.soundcloud ?? dj.soundcloud, spotify: f.spotify ?? dj.spotify, youtube: f.youtube ?? dj.youtube,
      updated_at: new Date().toISOString(),
    }).eq("id", dj.id);
    return state(sb, dj.id);
  }

  if (action === "photo") {
    const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl || "");
    if (!m) return json({ error: "bad image" }, 400);
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    const ext = m[1].includes("png") ? "png" : "jpg";
    const up = await sb.storage.from("dj-photos").upload(`${dj.id}.${ext}`, bytes, { contentType: m[1], upsert: true });
    if (up.error) return json({ error: up.error.message }, 500);
    const { data: p } = sb.storage.from("dj-photos").getPublicUrl(`${dj.id}.${ext}`);
    await sb.from("djs").update({ image_url: `${p.publicUrl}?v=${Date.now()}`, updated_at: new Date().toISOString() }).eq("id", dj.id);
    return state(sb, dj.id);
  }

  if (action === "claim") {
    if (!isComplete(dj)) return json({ error: "Finish your profile first" }, 400);
    if (!date) return json({ error: "missing date" }, 400);
    const subs = arr(subgenres);
    // adjacency: sub-genres already booked the day before/after (same day is fine)
    const { data: nb } = await sb.from("dj_slots").select("subgenres").in("date", [shift(date, -1), shift(date, 1)]).not("dj_id", "is", null);
    const blocked = new Set<string>();
    for (const r of nb || []) for (const s of arr(r.subgenres)) blocked.add(s);
    const clash = subs.filter((s: string) => blocked.has(s));
    if (clash.length) return json({ error: `Already booked the night before/after: ${clash.join(", ")}. Pick different sub-genres or another date.`, conflicts: clash }, 409);

    const { data: updated, error } = await sb.from("dj_slots").update({
      dj_id: dj.id, status: "pending", night_name: nightName || null,
      genres: arr(genres), subgenres: subs, genre: subs.join(" / ") || arr(genres).join(" / ") || dj.genres,
      updated_at: new Date().toISOString(),
    }).eq("date", date).eq("status", "open").select("date");
    if (error) return json({ error: error.message }, 500);
    if (!updated || !updated.length) return json({ error: "That date was just taken — pick another." }, 409);
    return state(sb, dj.id);
  }

  if (action === "cancel") {
    await sb.from("dj_slots").update({ dj_id: null, status: "open", night_name: null, genre: null, genres: [], subgenres: [], updated_at: new Date().toISOString() })
      .eq("date", date).eq("dj_id", dj.id).eq("status", "pending");
    return state(sb, dj.id);
  }

  return state(sb, dj.id);
});
