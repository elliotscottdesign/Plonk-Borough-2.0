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

// ── Email (Resend) — confirmation to the DJ when their night is signed off ──
const RESEND = Deno.env.get("RESEND_API_KEY");
const PORTAL = "https://team.nodice.bar/dj";
const esc = (s: any) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" } as any)[c]);
const niceDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
async function sendMail(to: string, subject: string, html: string) {
  if (!RESEND || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "No Dice <hello@nodice.bar>", to, subject, html }),
    });
  } catch (_) { /* best-effort — never break the sign-off */ }
}

async function snapshot(sb: any) {
  const { data: djs, error } = await sb.from("djs").select("*").order("dj_name");
  if (error) return json({ error: error.message }, 500);  // e.g. tables not created yet
  const { data: slots } = await sb.from("dj_slots").select("*, dj:djs(id,dj_name,image_url,instagram,genres,format)").order("date");
  return json({ djs: djs || [], slots: slots || [] });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { secret, action, date, slot: slotRaw, id, profile, djId, nightName, dataUrl, list, source } = await req.json().catch(() => ({}));
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
    case "signoff": {
      await sb.from("dj_slots").update({ status: "confirmed", updated_at: now() }).eq("date", date).eq("slot", slot);
      // Confirmation email to the DJ.
      const { data: row } = await sb.from("dj_slots")
        .select("night_name, dj:djs(dj_name,email,token)").eq("date", date).eq("slot", slot).maybeSingle();
      const d = (row as any)?.dj;
      if (d?.email) {
        const dStr = niceDate(date);
        const link = `${PORTAL}?t=${encodeURIComponent(d.token)}`;
        await sendMail(d.email, `You're confirmed at No Dice — ${dStr} 🎉`,
          `<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#000;color:#fff;padding:28px;border-radius:12px;max-width:560px;margin:auto">
            <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#DA1B33;margin:0 0 14px">No Dice · DJ Portal</p>
            <h1 style="font-size:22px;margin:0 0 12px">You're confirmed, ${esc(d.dj_name || "")} 🎉</h1>
            <p style="font-size:15px;line-height:1.6;color:#ddd">Your night on <strong style="color:#fff">${dStr}</strong>${(row as any)?.night_name ? ` ("${esc((row as any).night_name)}")` : ""} is locked in at No Dice, London Fields. See you on the decks.</p>
            <p style="font-size:14px;color:#bbb;line-height:1.6">Need to tweak the details or add artwork? You can still edit it from your portal.</p>
            <p style="margin:22px 0"><a href="${link}" style="background:#DA1B33;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700;display:inline-block">View my booking</a></p>
            <p style="font-size:11px;color:#777;margin-top:18px">No Dice · 407 Mentmore Terrace, London Fields, E8 3PH</p>
          </div>`);
      }
      break;
    }
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
      const st = f.status === "pending" ? "pending" : "vetted";
      const { data, error } = await sb.from("djs").insert({
        dj_name: f.dj_name || "New DJ", real_name: f.real_name || null, genres: f.genres || null,
        instagram: f.instagram || null, format: f.format || null, phone: f.phone || null, email: f.email || null,
        status: st, source: f.source || "manual",
        vetted_at: st === "vetted" ? now() : null,
      }).select("id, token").maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json({ id: data?.id, token: data?.token });
    }
    case "approve":
      await sb.from("djs").update({ status: "vetted", vetted_at: now(), updated_at: now() }).eq("id", id);
      break;
    case "unapprove":
      await sb.from("djs").update({ status: "pending", vetted_at: null, updated_at: now() }).eq("id", id);
      break;
    case "bulkAdd": {
      // Drop a list of contacts in as PENDING (e.g. Instagram handles, a new sheet).
      const rows = (Array.isArray(list) ? list : []).filter((r: any) => r && (r.dj_name || r.instagram)).map((r: any) => ({
        dj_name: String(r.dj_name || (r.instagram || "").replace(/^@/, "") || "New DJ").slice(0, 120),
        real_name: r.real_name || null, genres: r.genres || null, instagram: r.instagram || null,
        format: r.format || null, phone: r.phone || null, email: r.email || null,
        status: "pending", source: source || "manual",
      }));
      if (!rows.length) return json({ added: 0 });
      const { data, error } = await sb.from("djs").insert(rows).select("id");
      if (error) return json({ error: error.message }, 500);
      return json({ added: (data || []).length });
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
