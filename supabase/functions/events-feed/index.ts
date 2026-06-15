// Supabase Edge Function: events-feed
// PUBLIC, read-only feed of CONFIRMED upcoming DJ nights (no auth) — the single
// source the customer nodice.bar events page can fetch (and the team view / IG
// captions read the same shape). Only public DJ fields are exposed.
// GET (or POST) → [{ date, weekday, start, end, kind, dj, image, instagram, night_name, genres, set_type, promo_track }]
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const SESSIONS: Record<number, { day: string; start: string; end: string; kind: string }> = {
  1: { day: "Monday", start: "19:00", end: "23:00", kind: "opendecks" },
  2: { day: "Tuesday", start: "19:00", end: "23:00", kind: "opendecks" },
  3: { day: "Wednesday", start: "19:00", end: "23:00", kind: "opendecks" },
  4: { day: "Thursday", start: "19:00", end: "23:00", kind: "session" },
  5: { day: "Friday", start: "20:00", end: "00:00", kind: "session" },
  6: { day: "Saturday", start: "20:00", end: "00:00", kind: "session" },   // slot 'main' = Saturday evening
};
// Slots that aren't the day's 'main' session carry their own times.
const SLOT_TIMES: Record<string, { day: string; start: string; end: string; kind: string }> = {
  sat_pm: { day: "Saturday", start: "16:00", end: "20:00", kind: "session" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb.from("dj_slots")
    .select("date,slot,night_name,subgenres,kind,set_type,promo_track,event_image_url, dj:djs(dj_name,image_url,instagram,format)")
    .eq("status", "confirmed").neq("suspended", true).gte("date", today).order("date");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  const events = (data || []).map((s: any) => {
    const slot = s.slot || "main";
    const sess = (slot !== "main" && SLOT_TIMES[slot]) ? SLOT_TIMES[slot] : (SESSIONS[new Date(s.date + "T00:00:00Z").getUTCDay()] || {});
    return {
      date: s.date, slot, weekday: sess.day, start: sess.start, end: sess.end, kind: s.kind || sess.kind,
      dj: s.dj?.dj_name || null, image: s.event_image_url || s.dj?.image_url || null, instagram: s.dj?.instagram || null,
      format: s.dj?.format || null,
      night_name: s.night_name || null, genres: Array.isArray(s.subgenres) ? s.subgenres : [],
      set_type: s.set_type || null, promo_track: s.promo_track || null,
    };
  });
  return new Response(JSON.stringify(events), { headers: { ...cors, "Content-Type": "application/json" } });
});
