// Supabase Edge Function: toilet-check  (bar lane)
// 2-hourly toilet-hygiene reminders. While staff are clocked in, a pg_cron poll
// (every 30 min) pushes a "toilet check due" web-push to every clocked-in
// member's phone. The first person to tap "Done" flips this window's row to
// 'done', which stops the pings for everyone until the next 2-hour window.
//
// Auth mirrors the rota/kitchen functions:
//   • staff actions gated by the member's own rota token (staff.token)
//   • manager/cron actions gated by SEND_SECRET (or CRON_SECRET for the cron).
//
// Reads the SAME rota tables for "who's on shift now" (shift_clock, 8am-anchored
// shift day) — no change to them. Writes only the two new bar tables
// (push_subscriptions, toilet_checks — see supabase/toilet_hygiene.sql).
//
// Delivery: DATALESS web push (VAPID auth only, no encrypted payload) — the
// service worker (public/sw.js) shows a fixed reminder on the `push` event. We
// only ever push when the window is still outstanding, so a received push always
// means "still due". This keeps the server crypto to a single ES256 JWT (no
// per-message ECDH/AES payload encryption). Keys/p256dh are stored so we can move
// to payload push later without a re-subscribe.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const enc = (s: string) => new TextEncoder().encode(s);

// ── VAPID (application-server) keys — set as function secrets before deploy ────
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:elliot@nodice.bar";

function b64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}
function bytesToB64url(a: Uint8Array): string {
  let s = "";
  for (const b of a) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Import the VAPID private key (raw d + public x,y → JWK) for ES256 signing.
async function importVapidKey(): Promise<CryptoKey> {
  const pub = b64urlToBytes(VAPID_PUBLIC_KEY);            // 0x04 || x(32) || y(32)
  const x = bytesToB64url(pub.slice(1, 33));
  const y = bytesToB64url(pub.slice(33, 65));
  return await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: VAPID_PRIVATE_KEY, x, y, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}
// One JWT per push-service origin (aud = the endpoint's origin), cached per run.
const jwtCache = new Map<string, string>();
async function vapidJwt(origin: string, key: CryptoKey): Promise<string> {
  const cached = jwtCache.get(origin);
  if (cached) return cached;
  const header = bytesToB64url(enc(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
  const payload = bytesToB64url(enc(JSON.stringify({ aud: origin, exp, sub: VAPID_SUBJECT })));
  const signingInput = `${header}.${payload}`;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc(signingInput)));
  const jwt = `${signingInput}.${bytesToB64url(sig)}`;   // WebCrypto ECDSA sig is raw r||s — exactly JWS ES256
  jwtCache.set(origin, jwt);
  return jwt;
}
// Fire one dataless push. Returns the HTTP status (404/410 ⇒ subscription is dead).
async function sendPush(endpoint: string, key: CryptoKey): Promise<number> {
  const origin = new URL(endpoint).origin;
  const jwt = await vapidJwt(origin, key);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`, TTL: "1800" },
  });
  return res.status;
}

// ── Staff resolve + shift day (verbatim from rota/kitchen) ────────────────────
const staffByToken = async (sb: any, token: unknown) => {
  const t = String(token || "");
  if (!t) return null;
  const { data } = await sb.from("staff").select("*").eq("token", t).limit(1);
  return (data || [])[0] || null;
};
function londonParts(d = new Date()): { h: number; m: number } {
  const p: any = {};
  for (const x of new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d)) p[x.type] = x.value;
  return { h: (parseInt(p.hour, 10) || 0) % 24, m: parseInt(p.minute, 10) || 0 };
}
function londonDateISO(d = new Date()): string {
  const p: any = {};
  for (const x of new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d)) p[x.type] = x.value;
  return `${p.year}-${p.month}-${p.day}`;
}
const SHIFT_DAY_CUTOFF = 8; // 8am — matches rota/kitchen
function shiftDayISO(d = new Date()): string {
  const today = londonDateISO(d);
  if (londonParts(d).h < SHIFT_DAY_CUTOFF) {
    const dt = new Date(today + "T12:00:00Z"); dt.setUTCDate(dt.getUTCDate() - 1);
    return dt.toISOString().slice(0, 10);
  }
  return today;
}
// 2-hour window index within the London clock day (0..11). Because a shift day is
// 8am→8am, the daytime windows (4..11) and the after-midnight ones (0..3) never
// collide within the same shift_day.
function windowIndexNow(d = new Date()): number {
  const { h, m } = londonParts(d);
  return Math.floor((h * 60 + m) / 120);
}
const hh = (n: number) => `${String(((n % 24) + 24) % 24).padStart(2, "0")}:00`;
function windowInfo(wi: number) {
  const startH = wi * 2;
  return { windowIndex: wi, startLabel: hh(startH), endLabel: hh(startH + 2), nextDueLabel: hh(startH + 2) };
}
async function isClockedIn(sb: any, staffId: string, day: string): Promise<boolean> {
  const { data } = await sb.from("shift_clock").select("id").eq("staff_id", staffId).eq("date", day).is("clock_out", null).not("clock_in", "is", null).limit(1).maybeSingle();
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {};
  try { b = await req.json(); } catch { /* empty body */ }
  const action = b.action as string;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const isAdmin = () => b.secret && b.secret === Deno.env.get("SEND_SECRET");
  const isCron = () => isAdmin() || (b.secret && b.secret === Deno.env.get("CRON_SECRET"));

  try {
    // The client fetches the public key so it never has to hardcode it (unauthed, safe).
    if (action === "vapidPublicKey") return json({ ok: true, publicKey: VAPID_PUBLIC_KEY });

    // ── Staff (token-authed): opt in, read status, tick off ─────────────────────
    if (["subscribe", "unsubscribe", "status", "complete"].includes(action)) {
      const me = await staffByToken(sb, b.token);
      if (!me) return json({ error: "Please log in again." }, 401);
      if (me.active === false) return json({ error: "This account is inactive — ask the manager." }, 403);
      const day = shiftDayISO();
      const wi = windowIndexNow();

      if (action === "subscribe") {
        const sub = b.subscription || {};
        const endpoint = String(sub.endpoint || "");
        if (!endpoint) return json({ error: "no endpoint" }, 400);
        const keys = sub.keys || {};
        const { error } = await sb.from("push_subscriptions").upsert({
          staff_id: me.id, endpoint,
          p256dh: keys.p256dh || null, auth: keys.auth || null,
          user_agent: String(b.userAgent || "").slice(0, 300), last_seen: new Date().toISOString(),
        }, { onConflict: "endpoint" });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      if (action === "unsubscribe") {
        const endpoint = String((b.subscription && b.subscription.endpoint) || b.endpoint || "");
        if (endpoint) await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
        return json({ ok: true });
      }

      if (action === "status") {
        const { data: row } = await sb.from("toilet_checks").select("*").eq("shift_day", day).eq("window_index", wi).maybeSingle();
        return json({
          ok: true, day, ...windowInfo(wi),
          done: row?.status === "done",
          doneByName: row?.done_by_name || null,
          doneAt: row?.done_at || null,
          clockedIn: await isClockedIn(sb, me.id, day),
        });
      }

      if (action === "complete") {
        const { data: row } = await sb.from("toilet_checks").select("*").eq("shift_day", day).eq("window_index", wi).maybeSingle();
        if (row?.status === "done") return json({ ok: true, already: true, doneByName: row.done_by_name });
        const { error } = await sb.from("toilet_checks").upsert({
          shift_day: day, window_index: wi, status: "done",
          done_by: me.id, done_by_name: me.name, done_at: new Date().toISOString(),
        }, { onConflict: "shift_day,window_index" });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, doneByName: me.name, ...windowInfo(wi) });
      }
    }

    // ── Cron poll (secret-gated): ping clocked-in staff if the window is due ─────
    if (action === "cron") {
      if (!isCron()) return json({ error: "unauthorized" }, 401);
      if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return json({ error: "VAPID keys not set" }, 500);
      const day = shiftDayISO();
      const wi = windowIndexNow();

      // Who is clocked in right now (open clock on today's shift day)?
      const { data: clocks } = await sb.from("shift_clock").select("staff_id").eq("date", day).is("clock_out", null).not("clock_in", "is", null);
      const staffIds = [...new Set((clocks || []).map((c: any) => c.staff_id))];
      if (!staffIds.length) return json({ ok: true, window: wi, skipped: "nobody clocked in" });

      const { data: row } = await sb.from("toilet_checks").select("*").eq("shift_day", day).eq("window_index", wi).maybeSingle();
      if (row?.status === "done") return json({ ok: true, window: wi, done: true, doneByName: row.done_by_name });

      // Throttle: at most one ping per 40 min, and cap at 4 nudges per window.
      const now = Date.now();
      if (row?.last_ping_at && now - new Date(row.last_ping_at).getTime() < 40 * 60 * 1000) return json({ ok: true, window: wi, throttled: true });
      if ((row?.ping_count || 0) >= 4) return json({ ok: true, window: wi, capped: true });

      const { data: subs } = await sb.from("push_subscriptions").select("endpoint").in("staff_id", staffIds);
      if (!subs || !subs.length) return json({ ok: true, window: wi, clockedIn: staffIds.length, noSubs: true });

      const key = await importVapidKey();
      let sent = 0, gone = 0;
      for (const s of subs) {
        try {
          const st = await sendPush(s.endpoint, key);
          if (st >= 200 && st < 300) sent++;
          else if (st === 404 || st === 410) { gone++; await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint); }
        } catch { /* one dead endpoint never blocks the rest */ }
      }
      // Record the nudge (guarded so a completion racing us is never clobbered).
      if (row) await sb.from("toilet_checks").update({ last_ping_at: new Date().toISOString(), ping_count: (row.ping_count || 0) + 1 }).eq("id", row.id).eq("status", "pending");
      else await sb.from("toilet_checks").insert({ shift_day: day, window_index: wi, status: "pending", last_ping_at: new Date().toISOString(), ping_count: 1 });

      return json({ ok: true, window: wi, clockedIn: staffIds.length, subs: subs.length, sent, gone });
    }

    // ── Manager (founder, SEND_SECRET): compliance log + opt-in count ───────────
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);

    if (action === "toiletLog") {
      const days = Math.max(1, Math.min(60, parseInt(String(b.days)) || 14));
      const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      const { data: checks } = await sb.from("toilet_checks").select("*").gte("shift_day", since).order("shift_day", { ascending: false }).order("window_index", { ascending: false });
      const { data: subs } = await sb.from("push_subscriptions").select("staff_id");
      const enabled = new Set((subs || []).map((s: any) => s.staff_id).filter(Boolean)).size;
      return json({ ok: true, checks: checks || [], enabledPhonesStaff: enabled, totalSubs: (subs || []).length });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
