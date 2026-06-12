// Supabase Edge Function: dj-caption
// Writes a punchier, on-brand Instagram caption for a confirmed DJ night using
// Claude (Anthropic). Auth = SEND_SECRET (admin-only, since each call costs ~1p).
// Deploy --no-verify-jwt. Called from the gated /ops → DJ Bookings → Events tab,
// beside the free template caption ("✨ AI rewrite" button).
//
// COST SAFETY: SEND_SECRET ships in the public bundle, so it is NOT a real secret.
// Because this endpoint calls a PAID API, we add server-side rate limits that do
// not depend on that secret — a per-IP burst cap and a global daily budget
// (kill-switch). Worst-case spend is bounded even if the secret leaks. Caps are
// generous for real use and tunable via env (CAPTION_DAILY_CAP / CAPTION_IP_CAP /
// CAPTION_IP_WINDOW_MIN). Backed by public.ai_rate + bump_ai_rate() (dj-schema.sql).
//
// POST { secret, event, template, avoid? }
//   event    → the confirmed slot { dj:{dj_name,instagram,format}, subgenres,
//              night_name, kind, set_type, promo_track }
//   template → the free auto-generated caption (source of truth for date/time/address)
//   avoid    → (optional) the previous AI caption, so "Try again" writes something new
// → { caption }              on success
// → { error, setup? }        setup:true = the Anthropic key isn't set yet
// → { error, rate:true }     a rate/budget limit was hit (429)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const intEnv = (k: string, d: number) => {
  const v = parseInt(Deno.env.get(k) || "", 10);
  return Number.isFinite(v) && v > 0 ? v : d;
};

// No Dice brand voice — music-led neighbourhood bar at London Fields, Hackney.
const SYSTEM = `You are the social voice of No Dice — a music-led neighbourhood bar in London Fields, Hackney (407 Mentmore Terrace, E8 3PH). You write Instagram captions for the bar's DJ nights.

Voice: warm, in-the-know, a little playful — a clued-up local who loves the music, never a marketing department. British English. Avoid tired openers ("Get ready to…", "Don't miss out", "We're thrilled to announce", "Join us as…").

Write ONE Instagram caption for the night described:
- Open with a short, scroll-stopping hook line.
- Name the DJ and tag their Instagram handle if one is given.
- Weave in the genres / vibe naturally — don't just list them.
- Include the day, date, time, and that it's at No Dice, London Fields. Free entry unless told otherwise.
- A few tasteful emojis, not a wall of them.
- Finish with 5–8 hashtags on one line, including #NoDice #LondonFields #Hackney plus genre/format tags.
- Keep it tight: roughly 40–80 words before the hashtags.
- Return ONLY the finished caption text, ready to paste. No preamble, no explanation, no surrounding quotes, no markdown.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const { secret, event, template, avoid } = await req.json().catch(() => ({}));
  if (secret !== Deno.env.get("SEND_SECRET")) return json({ error: "unauthorized" }, 401);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return json({
      setup: true,
      error: "AI captions aren't switched on yet — an Anthropic API key needs to be added as a Supabase secret (ANTHROPIC_API_KEY). The free template caption still works in the meantime.",
    }, 503);
  }

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // ── Rate limit / daily budget (does NOT trust the public secret) ──────────
  const DAILY_CAP = intEnv("CAPTION_DAILY_CAP", 200);     // hard ceiling on calls/day across everyone
  const IP_CAP = intEnv("CAPTION_IP_CAP", 20);            // burst cap per IP per window
  const IP_WINDOW_MIN = intEnv("CAPTION_IP_WINDOW_MIN", 10);

  // bump_ai_rate(bucket, ttl) atomically increments and returns the new count.
  // Fails OPEN (returns 0) if the helper is missing, so a DB hiccup never blocks
  // the founder — the live DB always has it (see dj-schema.sql).
  const bump = async (bucket: string, ttlSeconds: number): Promise<number> => {
    const { data, error } = await sb.rpc("bump_ai_rate", { p_bucket: bucket, p_ttl_seconds: ttlSeconds });
    if (error) { console.warn("ai_rate bump failed:", error.message); return 0; }
    return typeof data === "number" ? data : 0;
  };

  const nowD = new Date();
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const win = Math.floor(nowD.getTime() / (IP_WINDOW_MIN * 60000));
  const ipCount = await bump(`ip:${ip}:${win}`, IP_WINDOW_MIN * 60 + 120);
  if (ipCount > IP_CAP) {
    return json({ rate: true, error: "Too many AI captions in a row — give it a few minutes, or use the free template caption." }, 429);
  }
  const dayCount = await bump(`global:${nowD.toISOString().slice(0, 10)}`, 36 * 3600);
  if (dayCount > DAILY_CAP) {
    return json({ rate: true, error: "Daily AI-caption limit reached — the free template caption still works, or try again tomorrow." }, 429);
  }

  const e = event || {};
  const djName = e?.dj?.dj_name || "TBA";
  const ig = e?.dj?.instagram ? String(e.dj.instagram).split(/[\s/]/)[0] : "";
  const genres = Array.isArray(e?.subgenres) ? e.subgenres.join(" / ") : "";
  const fmt = e?.dj?.format || "";

  const facts = [
    `DJ: ${djName}${ig ? ` (Instagram ${ig})` : ""}`,
    genres ? `Genres / vibe: ${genres}` : "",
    fmt ? `Format: ${fmt}` : "",
    e?.night_name ? `Night name: ${e.night_name}` : "",
    e?.kind === "opendecks" ? "This is an Open Decks night (free, relaxed)" : "This is a paid DJ session",
    e?.set_type ? `Set type: ${e.set_type}` : "",
    e?.promo_track ? `Track to feature: ${e.promo_track}` : "",
  ].filter(Boolean).join("\n");

  const userMsg = `Write the Instagram caption for this No Dice night.

FACTS:
${facts}

The exact date, time and address are in this auto-generated draft — keep them accurate:
"""
${template || ""}
"""${avoid ? `\n\nWrite something clearly different from this previous version:\n"""\n${avoid}\n"""` : ""}

Return ONLY the finished caption.`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 800,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = data?.error?.message || `Anthropic error ${resp.status}`;
      return json({ error: msg }, 502);
    }
    const caption = (data?.content || [])
      .filter((b: any) => b?.type === "text")
      .map((b: any) => b.text)
      .join("")
      .trim();
    if (!caption) return json({ error: "The model returned an empty caption — try again." }, 502);
    return json({ caption });
  } catch (err) {
    return json({ error: (err as Error).message || "Caption request failed" }, 502);
  }
});
