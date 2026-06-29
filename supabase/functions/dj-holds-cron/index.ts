// Supabase Edge Function: dj-holds-cron
// Sweeps DJ date holds. Invoked every few minutes by pg_cron (gated by CRON_SECRET).
// A "hold" = a DJ picked an open date and is filling in the details (status='held',
// held_at set). They get 24h. This function:
//   - at 22h (2h before expiry): emails the DJ a one-time "2 hours left" warning.
//   - at 24h: releases the date back to the open marketplace for other DJs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PORTAL = "https://team.nodice.bar/dj";
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return json({ error: "unauthorized" }, 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const RESEND = Deno.env.get("RESEND_API_KEY");
  const nowMs = Date.now();
  const H = 3600 * 1000;
  const nowISO = new Date().toISOString();

  const { data: holds } = await sb.from("dj_slots")
    .select("date, slot, held_at, reminder_sent, dj:djs(dj_name, email, token)")
    .eq("status", "held").not("held_at", "is", null);

  let reminded = 0, released = 0;
  for (const h of holds || []) {
    const age = nowMs - new Date(h.held_at as string).getTime();

    if (age >= 24 * H) {
      // Expired — free the date.
      await sb.from("dj_slots").update({
        status: "open", dj_id: null, dj_id2: null, night_name: null, genre: null, genres: [], subgenres: [],
        promo_track: null, promo_artist: null, promo_ok: false, set_type: null, held_at: null, reminder_sent: false,
        event_image_url: null, updated_at: nowISO,
      }).eq("date", h.date).eq("slot", (h as any).slot || "main").eq("status", "held");
      released++;
      continue;
    }

    if (age >= 22 * H && !h.reminder_sent && RESEND) {
      const email = (h as any).dj?.email, name = (h as any).dj?.dj_name || "there", token = (h as any).dj?.token;
      if (email && token) {
        const link = `${PORTAL}?t=${encodeURIComponent(token)}`;
        const dateStr = new Date(h.date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "No Dice <elliot@nodice.bar>",
            to: email,
            subject: `2 hours left to finish your No Dice night — ${dateStr}`,
            html: `<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#000;color:#fff;padding:28px;border-radius:12px;max-width:520px;margin:auto">
              <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#DA1B33;margin:0 0 14px">No Dice · DJ Portal</p>
              <h1 style="font-size:22px;margin:0 0 12px">2 hours left, ${name}</h1>
              <p style="font-size:15px;line-height:1.6;color:#ddd">You picked <strong style="color:#fff">${dateStr}</strong> but haven't finished the details yet. You've got <strong style="color:#DA1B33">2 hours</strong> left — after that the date goes back on the marketplace for other DJs.</p>
              <p style="margin:22px 0"><a href="${link}" style="background:#DA1B33;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700;display:inline-block">Finish my booking</a></p>
              <p style="font-size:12px;color:#888">Your draft is saved — just pick up where you left off.</p>
            </div>`,
          }),
        });
        reminded++;
      }
      // Mark handled either way (RESEND is available) so we never re-check this hold
      // every run. A held DJ always has an email, but this is safe if one doesn't.
      await sb.from("dj_slots").update({ reminder_sent: true, updated_at: nowISO }).eq("date", h.date).eq("slot", (h as any).slot || "main").eq("status", "held");
    }
  }
  return json({ reminded, released, checked: (holds || []).length });
});
