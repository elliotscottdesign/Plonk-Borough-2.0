// Supabase Edge Function: dj-portal
// DJ-facing API. Auth = the DJ's private `token`. Deploy --no-verify-jwt.
//
// Session kinds (by weekday): Thu/Fri/Sat = paid sessions (genre picker,
// adjacent-day rule, ONE per DJ per calendar month). Mon/Tue/Wed = Open Decks
// (unpaid, no genre rules, unlimited, set-type). A promo track (name/link) +
// rights tick are required for EVERY night — it drives the Instagram post.
//
// POST { token, action, ... }
//   load   → { dj, complete, openSlots:[{date,kind,blocked}], myBookings:[{...,blocked}], pastBookings:[...] }
//   save   {profile}
//   photo  {dataUrl}
//   claim  {date, nightName, genres, subgenres, promoTrack, promoOk, setType}
//   edit   {date, nightName, genres, subgenres, promoTrack, promoOk, setType}  (existing booking)
//   cancel {date}
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const todayISO = () => new Date().toISOString().slice(0, 10);
const shift = (d: string, n: number) => { const dt = new Date(d + "T00:00:00Z"); dt.setUTCDate(dt.getUTCDate() + n); return dt.toISOString().slice(0, 10); };
const dow = (d: string) => new Date(d + "T00:00:00Z").getUTCDay();
const isSession = (d: string) => [4, 5, 6].includes(dow(d));
const monthRange = (d: string) => { const dt = new Date(d + "T00:00:00Z"); return { start: new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), 1)).toISOString().slice(0, 10), next: new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 1)).toISOString().slice(0, 10) }; };
const genreCount = (g: any) => String(g || "").split("/").map((x: string) => x.trim()).filter(Boolean).length;
// All fields required except SoundCloud/Spotify/YouTube, and at least 5 genres.
const isComplete = (d: any) => !!(d && d.dj_name && genreCount(d.genres) >= 5 && d.instagram && d.format && d.phone && d.email && d.image_url);
const arr = (x: any) => Array.isArray(x) ? x : [];
const pub = (d: any) => ({ id: d.id, dj_name: d.dj_name, real_name: d.real_name, genres: d.genres, instagram: d.instagram, format: d.format, phone: d.phone, email: d.email, image_url: d.image_url, soundcloud: d.soundcloud, spotify: d.spotify, youtube: d.youtube });

async function state(sb: any, id: string) {
  const today = todayISO();
  const { data: me } = await sb.from("djs").select("*").eq("id", id).maybeSingle();
  const { data: booked } = await sb.from("dj_slots").select("date, subgenres").not("dj_id", "is", null).gte("date", shift(today, -1));
  const map: Record<string, string[]> = {};
  for (const s of booked || []) map[s.date] = arr(s.subgenres);
  // Sub-genres locked for a session date because they're booked the night before/after.
  const neighBlocked = (d: string) => isSession(d) ? [...new Set([...(map[shift(d, -1)] || []), ...(map[shift(d, 1)] || [])])] : [];
  const { data: openRows } = await sb.from("dj_slots").select("date, kind").eq("status", "open").gte("date", today).order("date");
  const openSlots = (openRows || []).map((s: any) => ({
    date: s.date, kind: s.kind || (isSession(s.date) ? "session" : "opendecks"), blocked: neighBlocked(s.date),
  }));
  const cols = "date,status,night_name,genres,subgenres,kind,promo_track,promo_ok,set_type";
  const { data: mine } = await sb.from("dj_slots").select(cols).eq("dj_id", id).gte("date", today).order("date");
  const myBookings = (mine || []).map((b: any) => ({ ...b, blocked: neighBlocked(b.date) }));
  const { data: past } = await sb.from("dj_slots").select(cols).eq("dj_id", id).lt("date", today).order("date", { ascending: false });
  return json({ dj: pub(me), complete: isComplete(me), openSlots, myBookings, pastBookings: past || [] });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { token, action, profile, dataUrl, date, nightName, genres, subgenres, promoTrack, promoOk, setType } = await req.json().catch(() => ({}));
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
    const session = isSession(date);
    const track = (promoTrack || "").trim();
    // A promo track is now required for EVERY night (it drives the Instagram post).
    if (!track) return json({ error: "Add a track (name or link) we'll use to promote your night on Instagram." }, 400);
    if (!promoOk) return json({ error: "Please tick that you have the rights to use the track for promo." }, 400);

    const upd: Record<string, unknown> = {
      dj_id: dj.id, status: "pending", night_name: nightName || null,
      promo_track: track, promo_ok: true, kind: session ? "session" : "opendecks",
      updated_at: new Date().toISOString(),
    };

    if (session) {
      const subs = arr(subgenres);
      if (!subs.length) return json({ error: "Pick at least one sub-genre you'll play." }, 400);
      if (subs.length > 4) return json({ error: "Up to 4 sub-genres per night." }, 400);
      // one paid session per DJ per calendar month
      const { start, next } = monthRange(date);
      const { data: existing } = await sb.from("dj_slots").select("date").eq("dj_id", dj.id).eq("kind", "session").in("status", ["pending", "confirmed"]).gte("date", start).lt("date", next);
      if (existing && existing.length) return json({ error: "You've already got a Thu/Fri/Sat session this month — only one paid session per month. Open Decks (Mon–Wed) are unlimited." }, 409);
      // adjacency: sub-genre booked the day before/after
      const { data: nb } = await sb.from("dj_slots").select("subgenres").in("date", [shift(date, -1), shift(date, 1)]).not("dj_id", "is", null);
      const blocked = new Set<string>();
      for (const r of nb || []) for (const s of arr(r.subgenres)) blocked.add(s);
      const clash = subs.filter((s: string) => blocked.has(s));
      if (clash.length) return json({ error: `Already booked the night before/after: ${clash.join(", ")}. Pick different sub-genres or another date.`, conflicts: clash }, 409);
      upd.genres = arr(genres); upd.subgenres = subs; upd.genre = subs.join(" / "); upd.set_type = null;
    } else {
      // Open Decks — no genre rules, no limit
      upd.genres = []; upd.subgenres = []; upd.genre = null; upd.set_type = setType || "dj_set";
    }

    const { data: updated, error } = await sb.from("dj_slots").update(upd).eq("date", date).eq("status", "open").select("date");
    if (error) return json({ error: error.message }, 500);
    if (!updated || !updated.length) return json({ error: "That date was just taken — pick another." }, 409);
    return state(sb, dj.id);
  }

  if (action === "edit") {
    // Edit an existing booking (pending OR confirmed) live — keeps the date, dj
    // and current status; re-validates promo + sub-genre adjacency.
    if (!date) return json({ error: "missing date" }, 400);
    const { data: existing } = await sb.from("dj_slots").select("date,status,kind").eq("date", date).eq("dj_id", dj.id).maybeSingle();
    if (!existing) return json({ error: "That date isn't one of your bookings." }, 404);
    const session = isSession(date);
    const track = (promoTrack || "").trim();
    if (!track) return json({ error: "Add a track (name or link) we'll use to promote your night on Instagram." }, 400);
    if (!promoOk) return json({ error: "Please tick that you have the rights to use the track for promo." }, 400);

    const upd: Record<string, unknown> = { night_name: nightName || null, promo_track: track, promo_ok: true, updated_at: new Date().toISOString() };
    if (session) {
      const subs = arr(subgenres);
      if (!subs.length) return json({ error: "Pick at least one sub-genre you'll play." }, 400);
      if (subs.length > 4) return json({ error: "Up to 4 sub-genres per night." }, 400);
      // adjacency: a sub-genre booked the day before/after (excludes this date)
      const { data: nb } = await sb.from("dj_slots").select("subgenres").in("date", [shift(date, -1), shift(date, 1)]).not("dj_id", "is", null);
      const blocked = new Set<string>();
      for (const r of nb || []) for (const s of arr(r.subgenres)) blocked.add(s);
      const clash = subs.filter((s: string) => blocked.has(s));
      if (clash.length) return json({ error: `Already booked the night before/after: ${clash.join(", ")}. Pick different sub-genres.`, conflicts: clash }, 409);
      upd.genres = arr(genres); upd.subgenres = subs; upd.genre = subs.join(" / "); upd.set_type = null;
    } else {
      upd.genres = []; upd.subgenres = []; upd.genre = null; upd.set_type = setType || "dj_set";
    }
    await sb.from("dj_slots").update(upd).eq("date", date).eq("dj_id", dj.id);
    return state(sb, dj.id);
  }

  if (action === "cancel") {
    await sb.from("dj_slots").update({ dj_id: null, status: "open", night_name: null, genre: null, genres: [], subgenres: [], promo_track: null, promo_ok: false, set_type: null, updated_at: new Date().toISOString() })
      .eq("date", date).eq("dj_id", dj.id).eq("status", "pending");
    return state(sb, dj.id);
  }

  return state(sb, dj.id);
});
