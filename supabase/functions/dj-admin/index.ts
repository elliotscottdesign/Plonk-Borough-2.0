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
  const { data: slots } = await sb.from("dj_slots").select("*, dj:djs(id,dj_name,image_url,instagram,genres)").order("date");
  return json({ djs: djs || [], slots: slots || [] });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { secret, action, date, id, profile, djId, nightName } = await req.json().catch(() => ({}));
  if (secret !== Deno.env.get("SEND_SECRET")) return json({ error: "unauthorized" }, 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  switch (action) {
    case "open": {
      const k = [4, 5, 6].includes(new Date(date + "T00:00:00Z").getUTCDay()) ? "session" : "opendecks";
      await sb.from("dj_slots").upsert({ date, status: "open", kind: k }, { onConflict: "date", ignoreDuplicates: true });
      break;
    }
    case "close":
      await sb.from("dj_slots").delete().eq("date", date).eq("status", "open");
      break;
    case "signoff":
      await sb.from("dj_slots").update({ status: "confirmed", updated_at: now() }).eq("date", date);
      break;
    case "unconfirm":
      await sb.from("dj_slots").update({ status: "pending", updated_at: now() }).eq("date", date);
      break;
    case "removeBooking":
      await sb.from("dj_slots").update({ status: "open", dj_id: null, night_name: null, genre: null, updated_at: now() }).eq("date", date);
      break;
    case "book": {
      const { data: dj } = await sb.from("djs").select("genres").eq("id", djId).maybeSingle();
      await sb.from("dj_slots").upsert({ date, dj_id: djId, status: "pending", night_name: nightName || null, genre: dj?.genres || null, updated_at: now() }, { onConflict: "date" });
      break;
    }
    case "addDj": {
      const f = profile || {};
      const { data, error } = await sb.from("djs").insert({
        dj_name: f.dj_name || "New DJ", real_name: f.real_name || null, genres: f.genres || null,
        instagram: f.instagram || null, format: f.format || null, phone: f.phone || null, email: f.email || null,
      }).select("token").maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json({ token: data?.token });
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
    case "removeDj":
      await sb.from("djs").delete().eq("id", id);
      break;
    case "load":
    default:
      break;
  }
  return snapshot(sb);
});
