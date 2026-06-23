// Supabase Edge Function: dj-portal
// DJ-facing API. Auth = the DJ's private `token`. Deploy --no-verify-jwt.
//
// Session kinds (by weekday): Thu/Fri/Sat = paid sessions (genre picker,
// adjacent-day rule, ONE per DJ per calendar month). Mon/Tue/Wed = Open Decks
// (unpaid, no genre rules, unlimited, set-type). A promo track (name/link) +
// rights tick are required for EVERY night — it drives the Instagram post.
//
// POST { token, action, ... }
//   load   → { dj, complete, openSlots:[{date,kind,blocked}], myBookings:[{...,blocked}], pastBookings:[...], schedule:[...] }
//   save   {profile}
//   photo  {dataUrl}
//   eventPhoto {date,dataUrl} per-event image (overrides profile photo for that night)
//   removeEventPhoto {date}   drop the per-event image (fall back to profile photo)
//   hold   {date}            reserve an open date off the marketplace (24h to finish)
//   draft  {date, ...}       save partial progress on a held date (no timer reset)
//   claim  {date, nightName, genres, subgenres, promoTrack, promoOk, setType}  (held → pending)
//   edit   {date, nightName, genres, subgenres, promoTrack, promoOk, setType}  (existing booking)
//   cancel {date}            release a held draft or pending request
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

// ── Email notifications (Resend) ──────────────────────────────────────────
// Best-effort: emails never block or fail a booking action. Admin notices go to
// ADMIN_EMAIL (elliot@nodice.bar); DJ notices go to the DJ's own address.
const RESEND = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "elliot@nodice.bar";
const PORTAL = "https://team.nodice.bar/dj";
const OPS = "https://team.nodice.bar/ops";
const niceDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const esc = (s: any) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" } as any)[c]);

function emailShell(kicker: string, heading: string, bodyHtml: string, cta?: { text: string; link: string }) {
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#000;color:#fff;padding:28px;border-radius:12px;max-width:560px;margin:auto">
    <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#DA1B33;margin:0 0 14px">${kicker}</p>
    <h1 style="font-size:22px;margin:0 0 12px">${heading}</h1>
    ${bodyHtml}
    ${cta ? `<p style="margin:22px 0"><a href="${cta.link}" style="background:#DA1B33;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700;display:inline-block">${cta.text}</a></p>` : ""}
    <p style="font-size:11px;color:#777;margin-top:18px">No Dice · 407 Mentmore Terrace, London Fields, E8 3PH</p>
  </div>`;
}
async function sendMail(to: string, subject: string, html: string) {
  if (!RESEND || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "No Dice <elliot@nodice.bar>", to, subject, html }),
    });
  } catch (_) { /* email is best-effort — never break the action */ }
}

// Fire the one-time "signed up" emails the first time a profile becomes complete.
async function maybeSignup(sb: any, before: any, merged: any) {
  if (before.signed_up_at) return;          // already announced once
  if (!isComplete(merged)) return;          // profile not finished yet
  await sb.from("djs").update({ signed_up_at: new Date().toISOString() }).eq("id", before.id);
  const name = merged.dj_name || "A DJ", ig = merged.instagram || "no IG";
  const vetted = !before.status || before.status === "vetted";
  const link = `${PORTAL}?t=${encodeURIComponent(before.token)}`;
  await Promise.allSettled([
    sendMail(merged.email, "You're set up on the No Dice DJ roster 🎧", emailShell(
      "No Dice · DJ Portal", `Welcome, ${esc(name)}`,
      vetted
        ? `<p style="font-size:15px;line-height:1.6;color:#ddd">Your DJ profile is all set. You can now browse open dates and request a night to play at No Dice, London Fields.</p>
           <p style="font-size:14px;line-height:1.6;color:#bbb">Pick a date and you'll have 24 hours to fill in the details, then we'll confirm it.</p>`
        : `<p style="font-size:15px;line-height:1.6;color:#ddd">Thanks for setting up your profile — we've got it. We'll be in touch once you're approved to start booking dates.</p>`,
      vetted ? { text: "Pick a date to play", link } : undefined)),
    sendMail(ADMIN_EMAIL, `New DJ signed up: ${name}`, emailShell(
      "No Dice · DJ Admin", `${esc(name)} just completed their profile`,
      `<p style="font-size:15px;line-height:1.6;color:#ddd">${esc(name)} (${esc(ig)}) has finished their DJ profile${vetted ? " and can now request dates." : " and is awaiting approval."}</p>
       <ul style="font-size:14px;color:#bbb;line-height:1.7">
         <li>Genres: ${esc(merged.genres || "—")}</li>
         <li>Format: ${esc(merged.format || "—")}</li>
         <li>Email: ${esc(merged.email || "—")} · Phone: ${esc(merged.phone || "—")}</li>
       </ul>`,
      { text: "Open DJ Admin", link: OPS })),
  ]);
}

// Fire the "date requested" emails when a DJ submits a booking for sign-off.
async function notifyRequest(dj: any, date: string, info: { session: boolean; nightName?: string; subgenres?: any; setType?: string; promoTrack?: string }) {
  const name = dj.dj_name || "A DJ", ig = dj.instagram || "no IG", dStr = niceDate(date);
  const what = info.session ? (arr(info.subgenres).join(" · ") || "DJ set") : "Open Decks";
  const link = `${PORTAL}?t=${encodeURIComponent(dj.token)}`;
  await Promise.allSettled([
    sendMail(dj.email, `We've got your No Dice date request — ${dStr}`, emailShell(
      "No Dice · DJ Portal", `Request received, ${esc(name)}`,
      `<p style="font-size:15px;line-height:1.6;color:#ddd">Thanks — we've got your request to play <strong style="color:#fff">${dStr}</strong>${info.nightName ? ` ("${esc(info.nightName)}")` : ""}.</p>
       <p style="font-size:14px;color:#bbb;line-height:1.6">${esc(what)}. We'll review it and send a confirmation shortly. You can still edit the details from your portal until then.</p>`,
      { text: "View my booking", link })),
    sendMail(ADMIN_EMAIL, `DJ date request: ${name} — ${dStr}`, emailShell(
      "No Dice · DJ Admin", `${esc(name)} requested ${dStr}`,
      `<p style="font-size:15px;line-height:1.6;color:#ddd">${esc(name)} (${esc(ig)}) has requested a night — it's waiting for your sign-off.</p>
       <ul style="font-size:14px;color:#bbb;line-height:1.7">
         <li>Date: ${dStr}</li>
         <li>${info.session ? "Paid session" : "Open Decks"}${info.nightName ? ` · "${esc(info.nightName)}"` : ""}</li>
         <li>${esc(what)}</li>
         <li>Promo track: ${esc(info.promoTrack || "—")}</li>
       </ul>`,
      { text: "Review & sign off", link: OPS })),
  ]);
}

// Validate an optional back-to-back partner the DJ picked. Returns { partner }
// (the id, or null for solo) or { error }. For sessions, enforces the partner's
// own one-paid-session-per-month limit so a b2b can't double-book them.
async function checkPartner(sb: any, partnerId: any, selfId: string, date: string, session: boolean): Promise<{ partner?: string | null; error?: string }> {
  const pid = String(partnerId || "");
  if (!pid || pid === selfId) return { partner: null };
  const { data: p } = await sb.from("djs").select("id,status").eq("id", pid).maybeSingle();
  if (!p || (p.status && p.status !== "vetted")) return { error: "That back-to-back DJ isn't on the roster yet." };
  if (session) {
    const { start, next } = monthRange(date);
    const { data: ex } = await sb.from("dj_slots").select("date").or(`dj_id.eq.${pid},dj_id2.eq.${pid}`).eq("kind", "session").in("status", ["held", "pending", "confirmed"]).neq("date", date).gte("date", start).lt("date", next);
    if (ex && ex.length) return { error: "That DJ already has a Thu/Fri/Sat session that month — only one paid session per DJ per month." };
  }
  return { partner: pid };
}

async function state(sb: any, id: string) {
  const today = todayISO();
  const { data: me } = await sb.from("djs").select("*").eq("id", id).maybeSingle();
  // Aggregate sub-genres per DATE (across ALL slots that day) for the neighbour rule.
  const { data: booked } = await sb.from("dj_slots").select("date, subgenres").not("dj_id", "is", null).gte("date", shift(today, -1));
  const map: Record<string, string[]> = {};
  for (const s of booked || []) map[s.date] = [...(map[s.date] || []), ...arr(s.subgenres)];
  // Sub-genres locked for a session date because they're booked the night before/after.
  const neighBlocked = (d: string) => isSession(d) ? [...new Set([...(map[shift(d, -1)] || []), ...(map[shift(d, 1)] || [])])] : [];
  const { data: openRows } = await sb.from("dj_slots").select("date, slot, kind").eq("status", "open").gte("date", today).order("date");
  const openSlots = (openRows || []).map((s: any) => ({
    date: s.date, slot: s.slot || "main", kind: s.kind || (isSession(s.date) ? "session" : "opendecks"), blocked: neighBlocked(s.date),
  }));
  const cols = "date,slot,status,night_name,genres,subgenres,kind,promo_track,promo_ok,set_type,held_at,event_image_url,dj_id,dj_id2";
  // Include nights where this DJ is the back-to-back partner (dj_id2), not just primary.
  const meFilter = `dj_id.eq.${id},dj_id2.eq.${id}`;
  const { data: mine } = await sb.from("dj_slots").select(cols).or(meFilter).gte("date", today).order("date");
  const { data: past } = await sb.from("dj_slots").select(cols).or(meFilter).lt("date", today).order("date", { ascending: false });
  // Line-up: every OTHER DJ's upcoming booked night (pending + confirmed). Public
  // fields only — name + Instagram + what/when — never phone/email.
  const { data: sched } = await sb.from("dj_slots")
    .select("date,slot,status,night_name,subgenres,kind,set_type,event_image_url,dj_id2, dj:djs(dj_name,instagram,image_url)")
    .not("dj_id", "is", null).neq("dj_id", id).in("status", ["pending", "confirmed"]).gte("date", today).order("date");

  // Resolve back-to-back partner names (dj_id2 has no FK embed) across all three lists.
  const partnerOf = (b: any) => b.dj_id2 ? (b.dj_id === id ? b.dj_id2 : b.dj_id) : null;
  const pIds = new Set<string>();
  for (const b of [...(mine || []), ...(past || [])]) { const pid = partnerOf(b); if (pid) pIds.add(pid); }
  for (const s of sched || []) if (s.dj_id2) pIds.add(s.dj_id2);
  const pMap: Record<string, any> = {};
  if (pIds.size) { const { data: pd } = await sb.from("djs").select("id,dj_name").in("id", [...pIds]); for (const p of pd || []) pMap[p.id] = p; }
  const withPartner = (b: any) => ({ ...b, slot: b.slot || "main", blocked: neighBlocked(b.date), partner: partnerOf(b) ? (pMap[partnerOf(b)]?.dj_name || null) : null, b2b: !!b.dj_id2 });

  const myBookings = (mine || []).map(withPartner);
  // Drop my own b2b nights from the line-up (they're already in My bookings).
  const schedule = (sched || []).filter((s: any) => s.dj_id2 !== id).map((s: any) => ({
    date: s.date, slot: s.slot || "main", status: s.status, night_name: s.night_name || null, subgenres: arr(s.subgenres),
    kind: s.kind || (isSession(s.date) ? "session" : "opendecks"), set_type: s.set_type || null,
    dj: s.dj?.dj_name || "DJ", dj2: s.dj_id2 ? (pMap[s.dj_id2]?.dj_name || null) : null, b2b: !!s.dj_id2, instagram: s.dj?.instagram || null,
    image: s.event_image_url || s.dj?.image_url || null,   // event image overrides profile
  }));
  // The DJ's own notes to No Dice (so they can see what they've sent + whether
  // it's been read). Degrades to [] if the table isn't created yet.
  const { data: myNotes } = await sb.from("dj_notes").select("id,body,created_at,read_at").eq("dj_id", id).order("created_at", { ascending: false }).limit(30);
  // Roster of other vetted DJs (id + name only) so the DJ can pick a b2b partner.
  const { data: roster } = await sb.from("djs").select("id,dj_name").or("status.eq.vetted,status.is.null").neq("id", id).order("dj_name");
  return json({ dj: pub(me), complete: isComplete(me), openSlots, myBookings, pastBookings: (past || []).map(withPartner), schedule, notes: myNotes || [], roster: roster || [] });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { token, action, profile, dataUrl, date, slot: slotRaw, nightName, genres, subgenres, promoTrack, promoOk, setType, body, dj_id2 } = await req.json().catch(() => ({}));
  const slot = slotRaw || "main";   // which session-of-the-day (Saturdays have 'main' evening + 'sat_pm' afternoon)
  if (!token) return json({ error: "missing token" }, 400);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: dj } = await sb.from("djs").select("*").eq("token", token).maybeSingle();
  if (!dj) return json({ error: "invalid link" }, 401);
  // Un-vetted (pending) DJs may load/set up their profile, but can't book until approved.
  if (dj.status && dj.status !== "vetted" && ["hold", "draft", "claim", "edit", "cancel", "eventPhoto", "removeEventPhoto"].includes(action)) {
    return json({ error: "Your profile is pending approval — you'll be able to book dates once No Dice approves you." }, 403);
  }

  if (action === "save") {
    const f = profile || {};
    const merged = {
      ...dj,
      dj_name: f.dj_name ?? dj.dj_name, real_name: f.real_name ?? dj.real_name,
      genres: f.genres ?? dj.genres, instagram: f.instagram ?? dj.instagram,
      format: f.format ?? dj.format, phone: f.phone ?? dj.phone, email: f.email ?? dj.email,
      soundcloud: f.soundcloud ?? dj.soundcloud, spotify: f.spotify ?? dj.spotify, youtube: f.youtube ?? dj.youtube,
    };
    await sb.from("djs").update({
      dj_name: merged.dj_name, real_name: merged.real_name, genres: merged.genres, instagram: merged.instagram,
      format: merged.format, phone: merged.phone, email: merged.email,
      soundcloud: merged.soundcloud, spotify: merged.spotify, youtube: merged.youtube,
      updated_at: new Date().toISOString(),
    }).eq("id", dj.id);
    await maybeSignup(sb, dj, merged);   // image_url unchanged here — completes if photo already set
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
    const newUrl = `${p.publicUrl}?v=${Date.now()}`;
    await sb.from("djs").update({ image_url: newUrl, updated_at: new Date().toISOString() }).eq("id", dj.id);
    await maybeSignup(sb, dj, { ...dj, image_url: newUrl });   // photo may be the final piece that completes the profile
    return state(sb, dj.id);
  }

  if (action === "eventPhoto") {
    // Per-event artwork for one booking — overrides the DJ's profile photo for
    // that night only (everywhere the event image is shown). Targets a row the
    // DJ owns (held / pending / confirmed).
    if (!date) return json({ error: "missing date" }, 400);
    const { data: owned } = await sb.from("dj_slots").select("date").eq("date", date).eq("slot", slot).eq("dj_id", dj.id).in("status", ["held", "pending", "confirmed"]).maybeSingle();
    if (!owned) return json({ error: "That date isn't one of your bookings." }, 404);
    const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl || "");
    if (!m) return json({ error: "bad image" }, 400);
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    const ext = m[1].includes("png") ? "png" : "jpg";
    const key = `events/${date}-${slot}.${ext}`;
    const up = await sb.storage.from("dj-photos").upload(key, bytes, { contentType: m[1], upsert: true });
    if (up.error) return json({ error: up.error.message }, 500);
    const { data: p } = sb.storage.from("dj-photos").getPublicUrl(key);
    await sb.from("dj_slots").update({ event_image_url: `${p.publicUrl}?v=${Date.now()}`, updated_at: new Date().toISOString() }).eq("date", date).eq("slot", slot).eq("dj_id", dj.id).in("status", ["held", "pending", "confirmed"]);
    return state(sb, dj.id);
  }

  if (action === "removeEventPhoto") {
    // Drop the per-event image → the night falls back to the profile photo.
    if (!date) return json({ error: "missing date" }, 400);
    await sb.from("dj_slots").update({ event_image_url: null, updated_at: new Date().toISOString() }).eq("date", date).eq("slot", slot).eq("dj_id", dj.id).in("status", ["held", "pending", "confirmed"]);
    return state(sb, dj.id);
  }

  if (action === "hold") {
    // DJ picks an open date — reserve it off the marketplace immediately and give
    // them 24h to fill in the details (status='held').
    if (!isComplete(dj)) return json({ error: "Finish your profile first" }, 400);
    if (!date) return json({ error: "missing date" }, 400);
    const session = isSession(date);
    if (session) {
      const { start, next } = monthRange(date);
      const { data: existing } = await sb.from("dj_slots").select("date").or(`dj_id.eq.${dj.id},dj_id2.eq.${dj.id}`).eq("kind", "session").in("status", ["held", "pending", "confirmed"]).gte("date", start).lt("date", next);
      if (existing && existing.length) return json({ error: "You've already got a Thu/Fri/Sat session this month — only one paid session per month. Open Decks (Mon–Wed) are unlimited." }, 409);
    }
    const { data: updated, error } = await sb.from("dj_slots").update({
      dj_id: dj.id, status: "held", kind: session ? "session" : "opendecks",
      held_at: new Date().toISOString(), reminder_sent: false, updated_at: new Date().toISOString(),
    }).eq("date", date).eq("slot", slot).eq("status", "open").select("date");
    if (error) return json({ error: error.message }, 500);
    if (!updated || !updated.length) return json({ error: "That date was just taken — pick another." }, 409);
    return state(sb, dj.id);
  }

  if (action === "draft") {
    // Save partial progress on a held date (no validation) so the DJ can pick it
    // back up within their 24h window. Does NOT reset the timer.
    if (!date) return json({ error: "missing date" }, 400);
    const { data: held } = await sb.from("dj_slots").select("date").eq("date", date).eq("slot", slot).eq("dj_id", dj.id).eq("status", "held").maybeSingle();
    if (!held) return json({ error: "That date isn't being held by you (your hold may have expired)." }, 404);
    const session = isSession(date);
    const subs = arr(subgenres).slice(0, 4);
    const upd: Record<string, unknown> = {
      night_name: nightName || null, promo_track: (promoTrack || "").trim() || null, promo_ok: !!promoOk, updated_at: new Date().toISOString(),
    };
    if (session) { upd.genres = arr(genres); upd.subgenres = subs; upd.genre = subs.join(" / ") || null; upd.set_type = null; }
    else { upd.genres = []; upd.subgenres = []; upd.genre = null; upd.set_type = setType || "dj_set"; }
    upd.dj_id2 = (dj_id2 && dj_id2 !== dj.id) ? dj_id2 : null;   // b2b partner (validated on claim)
    await sb.from("dj_slots").update(upd).eq("date", date).eq("slot", slot).eq("dj_id", dj.id).eq("status", "held");
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
      held_at: null, updated_at: new Date().toISOString(),
    };

    if (session) {
      const subs = arr(subgenres);
      if (!subs.length) return json({ error: "Pick at least one sub-genre you'll play." }, 400);
      if (subs.length > 4) return json({ error: "Up to 4 sub-genres per night." }, 400);
      // one paid session per DJ per calendar month (counts other holds too; not this date)
      const { start, next } = monthRange(date);
      const { data: existing } = await sb.from("dj_slots").select("date").or(`dj_id.eq.${dj.id},dj_id2.eq.${dj.id}`).eq("kind", "session").in("status", ["held", "pending", "confirmed"]).neq("date", date).gte("date", start).lt("date", next);
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

    const pr = await checkPartner(sb, dj_id2, dj.id, date, session);
    if (pr.error) return json({ error: pr.error }, 409);
    upd.dj_id2 = pr.partner;
    // The DJ must be holding this date (they picked it first). Confirms held → pending.
    const { data: updated, error } = await sb.from("dj_slots").update(upd).eq("date", date).eq("slot", slot).eq("status", "held").eq("dj_id", dj.id).select("date");
    if (error) return json({ error: error.message }, 500);
    if (!updated || !updated.length) return json({ error: "Your hold on that date has expired — pick it again from the calendar." }, 409);
    await notifyRequest(dj, date, { session, nightName, subgenres, setType, promoTrack: track });
    return state(sb, dj.id);
  }

  if (action === "edit") {
    // Edit an existing booking (pending OR confirmed) live — keeps the date, dj
    // and current status; re-validates promo + sub-genre adjacency.
    if (!date) return json({ error: "missing date" }, 400);
    const { data: existing } = await sb.from("dj_slots").select("date,status,kind").eq("date", date).eq("slot", slot).eq("dj_id", dj.id).in("status", ["pending", "confirmed"]).maybeSingle();
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
    const pr = await checkPartner(sb, dj_id2, dj.id, date, session);
    if (pr.error) return json({ error: pr.error }, 409);
    upd.dj_id2 = pr.partner;
    await sb.from("dj_slots").update(upd).eq("date", date).eq("slot", slot).eq("dj_id", dj.id);
    return state(sb, dj.id);
  }

  if (action === "cancel") {
    // Release a held draft OR a pending request back to the open marketplace.
    await sb.from("dj_slots").update({ dj_id: null, status: "open", night_name: null, genre: null, genres: [], subgenres: [], promo_track: null, promo_ok: false, set_type: null, held_at: null, reminder_sent: false, event_image_url: null, updated_at: new Date().toISOString() })
      .eq("date", date).eq("slot", slot).eq("dj_id", dj.id).in("status", ["held", "pending"]);
    return state(sb, dj.id);
  }

  if (action === "leaveNote") {
    // The DJ leaves a note for No Dice (the inbound side of the Messages hub).
    // Allowed for pending DJs too — messaging shouldn't wait on approval.
    const text = String(body || "").trim();
    if (!text) return json({ error: "Write a message first." }, 400);
    await sb.from("dj_notes").insert({ dj_id: dj.id, body: text.slice(0, 2000) });
    // Best-effort heads-up to the admin — never blocks the note.
    await sendMail(ADMIN_EMAIL, `New note from ${dj.dj_name || "a DJ"}`, emailShell(
      "No Dice · DJ Admin", `${esc(dj.dj_name || "A DJ")} left you a note`,
      `<p style="font-size:15px;line-height:1.6;color:#ddd;white-space:pre-wrap">${esc(text)}</p>`,
      { text: "Open Messages", link: OPS }));
    return state(sb, dj.id);
  }

  return state(sb, dj.id);
});
