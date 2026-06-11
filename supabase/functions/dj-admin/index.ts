// Supabase Edge Function: dj-admin
// Founder-facing API for the live DJ Calendar + Roster. Auth = SEND_SECRET.
// Deploy --no-verify-jwt. Called from the gated /ops DJ Bookings admin.
//
// POST { secret, action, ...payload }
//   load                 → { djs:[...], slots:[...] }   (slots include the joined DJ)
//   open    {date}       → open a date for booking
//   close   {date}       → close an empty (unbooked) open date
//   signoff {date}       → confirm a pending booking (→ main events calendar)
//   unconfirm {date}     → back to pending
//   removeBooking {date} → free the date (back to open, DJ cleared)
//   addDj   {profile}    → create a DJ, returns { token }
//   saveDj  {id,profile} → edit a DJ profile
//   removeDj {id}        → delete a DJ
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const now = () => new Date().toISOString();

async function snapshot(sb: any) {
  const { data: djs, error } = await sb.from("djs").select("*").order("dj_name");
  if (error) return json({ error: error.message }, 500);  // e.g. tables not created yet
  const { data: slots } = await sb.from("dj_slots").select("*, dj:djs(id,dj_name,image_url,instagram,genres,format)").order("date");
  return json({ djs: djs || [], slots: slots || [] });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { secret, action, date, slot: slotRaw, id, profile, djId, nightName, dataUrl } = await req.json().catch(() => ({}));
  const slot = slotRaw || "main";   // session-of-the-day (Saturdays: 'main' evening + 'sat_pm' afternoon)
  if (secret !== Deno.env.get("SEND_SECRET")) return json({ error: "unauthorized" }, 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  switch (action) {
    case "open": {
      const k = [4, 5, 6].includes(new Date(date + "T00:00:00Z").getUTCDay()) ? "session" : "opendecks";
      await sb.from("dj_slots").upsert({ date, slot, status: "open", kind: k }, { onConflict: "date,slot", ignoreDuplicates: true });
      break;
    }
    case "close":
      await sb.from("dj_slots").delete().eq("date", date).eq("slot", slot).eq("status", "open");
      break;
    case "signoff":
      await sb.from("dj_slots").update({ status: "confirmed", updated_at: now() }).eq("date", date).eq("slot", slot);
      break;
    case "unconfirm":
      await sb.from("dj_slots").update({ status: "pending", updated_at: now() }).eq("date", date).eq("slot", slot);
      break;
    case "removeBooking":
      // Free the date AND wipe all booking detail (matches the DJ portal's cancel),
      // including any in-progress 24h hold.
      await sb.from("dj_slots").update({ status: "open", dj_id: null, night_name: null, genre: null, genres: [], subgenres: [], promo_track: null, promo_ok: false, set_type: null, held_at: null, reminder_sent: false, event_image_url: null, updated_at: now() }).eq("date", date).eq("slot", slot);
      break;
    case "book": {
      // Admin manually assigns a DJ. Seed kind + display genres from their profile
      // so the Events view / public feed render; the DJ can refine via their portal.
      const { data: dj } = await sb.from("djs").select("genres").eq("id", djId).maybeSingle();
      const subs = String(dj?.genres || "").split("/").map((x: string) => x.trim()).filter(Boolean).slice(0, 4);
      const k = [4, 5, 6].includes(new Date(date + "T00:00:00Z").getUTCDay()) ? "session" : "opendecks";
      await sb.from("dj_slots").upsert({
        date, slot, dj_id: djId, status: "pending", night_name: nightName || null,
        genre: dj?.genres || null, genres: subs, subgenres: subs, kind: k,
        set_type: k === "opendecks" ? "dj_set" : null, promo_track: null, promo_ok: false,
        event_image_url: null, updated_at: now(),
      }, { onConflict: "date,slot" });
      break;
    }
    case "addDj": {
      const f = profile || {};
      const { data, error } = await sb.from("djs").insert({
        dj_name: f.dj_name || "New DJ", real_name: f.real_name || null, genres: f.genres || null,
        instagram: f.instagram || null, format: f.format || null, phone: f.phone || null, email: f.email || null,
      }).select("id, token").maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json({ id: data?.id, token: data?.token });
    }
    case "saveDj": {
      const f = profile || {};
      await sb.from("djs").update({
        dj_name: f.dj_name, real_name: f.real_name, genres: f.genres, instagram: f.instagram,
        format: f.format, phone: f.phone, email: f.email, image_url: f.image_url,
        soundcloud: f.soundcloud, spotify: f.spotify, youtube: f.youtube, updated_at: now(),
      }).eq("id", id);
      break;
    }
    case "photo": {
      const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl || "");
      if (!m) return json({ error: "bad image" }, 400);
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      const ext = m[1].includes("png") ? "png" : "jpg";
      const up = await sb.storage.from("dj-photos").upload(`${id}.${ext}`, bytes, { contentType: m[1], upsert: true });
      if (up.error) return json({ error: up.error.message }, 500);
      const { data: p } = sb.storage.from("dj-photos").getPublicUrl(`${id}.${ext}`);
      await sb.from("djs").update({ image_url: `${p.publicUrl}?v=${Date.now()}`, updated_at: now() }).eq("id", id);
      break;
    }
    case "removeDj":
      await sb.from("djs").delete().eq("id", id);
      break;
    case "load":
    default:
      break;
  }
  return snapshot(sb);
});
