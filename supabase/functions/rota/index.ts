// Supabase Edge Function: rota
// No Dice staff rota system. One function, `action`-routed (like help-out):
//   • Founder/admin actions are gated by SEND_SECRET (the /ops "Rota" screen).
//   • Staff actions are gated by the staff member's own token (issued at login).
// Slice 1: staff roster CRUD + staff login. Availability + shift-picking land in
// later slices on the same function.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Public shape of a staff row — never leak the password, and keep pay/hours
// (hourly_rate, target_hours) founder-only so they never reach a staff portal.
const publicStaff = (s: any) => {
  if (!s) return null;
  const { password, hourly_rate, target_hours, employment_type, ...rest } = s;
  return { ...rest, has_password: !!password };
};

// Founder-only shape — like publicStaff but KEEPS the plaintext password (speed-bump
// security; the founder relays it or shares the passwordless login link) AND the
// pay/hours fields the /ops week-overview needs. Only used under the SEND_SECRET gate.
const adminStaff = (s: any) => (s ? { ...publicStaff(s), password: s?.password || null, hourly_rate: s?.hourly_rate ?? null, target_hours: s?.target_hours ?? null, employment_type: s?.employment_type ?? null } : null);
// £/h and hours-a-week parsers (founder input). Blank/invalid → null; sane caps.
const cleanRate = (v: unknown) => { if (v === "" || v == null) return null; const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.min(1000, Math.round(n * 100) / 100) : null; };
// A target of 0 (or blank/invalid) means "no target" — never a real 0-hour goal.
const cleanHours = (v: unknown) => { if (v === "" || v == null) return null; const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.min(168, Math.round(n * 10) / 10) : null; };
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Casual"];

// Resolve the logged-in staff member from their portal token (issued at login).
const staffByToken = async (sb: any, token: unknown) => {
  const t = String(token || "");
  if (!t) return null;
  const { data } = await sb.from("staff").select("*").eq("token", t).limit(1);
  return (data || [])[0] || null;
};

// ── Email (Resend) — founder alerts + the "shift back on the board" broadcast ──
const RESEND = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "elliot@nodice.bar";
const OPS_URL = "https://team.nodice.bar/ops";
const PORTAL_URL = "https://team.nodice.bar/rota";
const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" } as Record<string, string>)[c]);
const niceDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
// Minutes-from-midnight → '6pm' / '1am' (mirror of src/rota/shifts.js fmtMin). Used to
// auto-name a custom shift when the founder doesn't give it one.
const fmtMinTs = (m: number) => { const t = ((m % 1440) + 1440) % 1440; let h = Math.floor(t / 60); const mm = t % 60; const ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12; return `${h}${mm ? ":" + String(mm).padStart(2, "0") : ""}${ap}`; };
// Validate/normalise a custom shift's start & end (minutes-from-midnight). end ≤ start
// means it finishes the next day. Returns {start,end} or {error}. Shared by add/edit.
const toMinOfDay = (v: unknown) => { const n = parseInt(String(v)); return Number.isFinite(n) ? ((n % 1440) + 1440) % 1440 : null; };
const normalizeShiftTimes = (sv: unknown, ev: unknown): { start: number; end: number } | { error: string } => {
  const start = toMinOfDay(sv);
  let end = toMinOfDay(ev);
  if (start === null || end === null) return { error: "Set a start and end time." };
  if (end <= start) end += 1440;
  const dur = end - start;
  if (dur < 60) return { error: "That shift is under an hour — check the times." };
  if (dur > 18 * 60) return { error: "That shift is over 18 hours — check the times." };
  return { start, end };
};
const cleanShiftLabel = (v: unknown, start: number, end: number) => (String(v || "").replace(/\s+/g, " ").trim().slice(0, 60)) || `${fmtMinTs(start)}–${fmtMinTs(end)}`;
async function sendMail(to: string, subject: string, html: string) {
  if (!RESEND || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "No Dice <elliot@nodice.bar>", to, subject, html }),
    });
  } catch (_) { /* best-effort — never break the action */ }
}
const emailShell = (heading: string, bodyHtml: string, cta?: { href: string; label: string }) =>
  `<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#000;color:#fff;padding:28px;border-radius:12px;max-width:560px;margin:auto">
    <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#DA1B33;margin:0 0 14px">No Dice · Rota</p>
    <h1 style="font-size:22px;margin:0 0 12px">${heading}</h1>
    ${bodyHtml}
    ${cta ? `<p style="margin:22px 0"><a href="${cta.href}" style="background:#DA1B33;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700;display:inline-block">${cta.label}</a></p>` : ""}
    <p style="font-size:11px;color:#777;margin-top:18px">No Dice · 407 Mentmore Terrace, London Fields, E8 3PH</p>
  </div>`;

const ROLES = ["Bar Staff", "Supervisor", "Asst. Manager", "Manager"];
const clean = (v: unknown) => (typeof v === "string" ? v.trim() : v);

// Bar-team shift patterns — MINUTES from the shift date's midnight (next-day ends
// exact: 00:00=1440, 01:00=1500). Mon–Thu one open-to-close; Fri/Sat/Sun split.
// Keep in sync with src/rota/shifts.js. (Manager/supervisor patterns: later.)
const SHIFT_PATTERNS: Record<number, { key: string; label: string; start: number; end: number; role: string }[]> = {
  1: [{ key: "full", label: "Open–Close", start: 840, end: 1440, role: "bar" }],
  2: [{ key: "full", label: "Open–Close", start: 840, end: 1440, role: "bar" }],
  3: [{ key: "full", label: "Open–Close", start: 840, end: 1440, role: "bar" }],
  4: [{ key: "full", label: "Open–Close", start: 840, end: 1440, role: "bar" }],
  5: [{ key: "open", label: "Open", start: 660, end: 1080, role: "bar" }, { key: "close", label: "Close", start: 1080, end: 1500, role: "bar" }],
  6: [{ key: "open", label: "Open", start: 660, end: 1080, role: "bar" }, { key: "close", label: "Close", start: 1080, end: 1500, role: "bar" }],
  0: [{ key: "open", label: "Open", start: 660, end: 1050, role: "bar" }, { key: "close", label: "Close", start: 1050, end: 1440, role: "bar" }],
};
const dow = (d: string) => new Date(d + "T00:00:00Z").getUTCDay();
const shiftsForDate = (d: string) => SHIFT_PATTERNS[dow(d)] || [];
const todayISO = () => new Date().toISOString().slice(0, 10);
const clampHead = (v: unknown, dflt: number) => Math.max(1, Math.min(20, parseInt(String(v)) || dflt));

// Abilities + role hierarchy (mirror of src/rota/roles.js). Higher rank covers lower.
const ABILITY_KEYS = ["bar", "kitchen", "foh", "golf"];
const ROLE_RANK: Record<string, number> = { "Bar Staff": 1, "Supervisor": 2, "Asst. Manager": 3, "Manager": 4 };
const staffRank = (role: unknown) => ROLE_RANK[String(role || "")] || 1;
const cleanAbilities = (v: unknown) => Array.isArray(v) ? v.filter((x) => ABILITY_KEYS.includes(String(x))) : [];
const cleanInterests = (v: unknown) => Array.isArray(v) ? [...new Set(v.map((x) => String(x).trim().slice(0, 60)).filter(Boolean))].slice(0, 30) : [];

// Onboarding gate (mirror of src/rota/statement.js). The calendar stays locked
// until the statement is signed + all payroll / right-to-work details are in.
const SOI_VERSION = "2026-07";
const onboardingOk = (s: any, docKinds: Set<string>) => !!(
  s?.soi_signed_at && s?.name && s?.phone && s?.address && s?.dob &&
  s?.emergency_name && s?.emergency_phone && s?.ni_number &&
  s?.bank_name && s?.bank_sort && s?.bank_account &&
  docKinds.has("passport") && docKinds.has("rtw"));

// ── Venue presence (geofence + venue-wifi) ───────────────────────────────────
// A soft DETERRENT so staff clock in AT the bar, not from bed. It never blocks an
// honest punch unless the founder turns on 'block' mode AND the phone is clearly
// far away. Config = the single-row venue_presence table (id=1). If that table
// doesn't exist yet (setup SQL not pasted), every check returns 'off' and clock-in
// behaves exactly as before — so this can ship before the founder sets it up.
const EARTH_M = 6_371_000;
function metresBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = Math.PI / 180;
  const φ1 = aLat * rad, φ2 = bLat * rad;
  const dφ = (bLat - aLat) * rad, dλ = (bLng - aLng) * rad;
  const h = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * EARTH_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
// The caller's public IP. Parsed the SAME way for matching AND for learning, so the
// venue wifi always matches itself regardless of which x-forwarded-for hop is "real".
function callerIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0].trim();
  return first || req.headers.get("x-real-ip") || null;
}
async function venueConfig(sb: any) {
  try {
    const { data, error } = await sb.from("venue_presence").select("*").eq("id", 1).maybeSingle();
    if (error) return null;   // table missing / not set up yet → feature off
    return data || null;
  } catch { return null; }
}
// Decide a punch's presence. NEVER throws. Returns { label, allow, distance }:
//   label ∈ 'off' | 'wifi' | 'gps' | 'off-site' | 'unverified'
//   allow is false ONLY when mode='block' AND the fix is clearly far from the venue.
async function checkPresence(sb: any, ip: string | null, fix: any) {
  const cfg = await venueConfig(sb);
  if (!cfg || !cfg.enabled) return { label: "off", allow: true, distance: null };
  if (ip && cfg.venue_ip && ip === cfg.venue_ip) return { label: "wifi", allow: true, distance: null };
  const lat = fix && typeof fix.lat === "number" ? fix.lat : null;
  const lng = fix && typeof fix.lng === "number" ? fix.lng : null;
  if (lat != null && lng != null && cfg.venue_lat != null && cfg.venue_lng != null) {
    const acc = Number(fix.accuracy ?? 9999);
    const radius = Number(cfg.radius_m || 150);
    const d = metresBetween(lat, lng, Number(cfg.venue_lat), Number(cfg.venue_lng));
    if (acc <= 200 && d - acc < radius) return { label: "gps", allow: true, distance: Math.round(d) };            // at the venue
    if (acc <= 200 && d - acc > 1000) return { label: "off-site", allow: cfg.mode !== "block", distance: Math.round(d) };  // clearly elsewhere
    return { label: "unverified", allow: true, distance: Math.round(d) };   // borderline / poor accuracy
  }
  return { label: "unverified", allow: true, distance: null };   // no usable fix, no wifi match
}

// ── Shift day (8am-anchored, London time) ────────────────────────────────────
// A "shift day" runs 8am → 8am the next morning, so a late shift that ends after
// midnight still belongs to the day it STARTED. This lets staff clock OUT of last
// night's shift at 2am (it's still "yesterday" until 8am), and only see the next
// day's shifts from 8am. Clocking keys on this, not the raw calendar date.
const SHIFT_DAY_CUTOFF = 8;   // 8am
function londonHour(d = new Date()): number {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false }).format(d);
  return (parseInt(h, 10) || 0) % 24;
}
function londonDateISO(d = new Date()): string {
  const p: any = {};
  for (const x of new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d)) p[x.type] = x.value;
  return `${p.year}-${p.month}-${p.day}`;
}
function shiftDayISO(d = new Date()): string {
  const today = londonDateISO(d);
  if (londonHour(d) < SHIFT_DAY_CUTOFF) {                 // before 8am → still yesterday's shift day
    const dt = new Date(today + "T12:00:00Z"); dt.setUTCDate(dt.getUTCDate() - 1);
    return dt.toISOString().slice(0, 10);
  }
  return today;
}

// Auto-sign-out: close any of a staffer's OPEN clocks that belong to an EARLIER shift
// day (they forgot, and the 8am cut-off has passed). Sets clock_out to the best estimate
// (clock-in + their rostered length that day, else +8h), leaves approved=false and flags
// auto_out=true so the founder reviews it. Idempotent — safe to call on every load.
async function autoCloseStale(sb: any, staffId: string) {
  const sd = shiftDayISO();
  const { data: open } = await sb.from("shift_clock").select("*").eq("staff_id", staffId).is("clock_out", null).not("clock_in", "is", null);
  const stale = (open || []).filter((c: any) => c.date < sd);
  if (!stale.length) return;
  const { data: claims } = await sb.from("staff_shift_claims").select("shift_id").eq("staff_id", staffId);
  const shiftIds = (claims || []).map((c: any) => c.shift_id);
  for (const c of stale) {
    let durMin = 8 * 60;   // fallback if we can't find their rostered shift
    if (shiftIds.length) {
      const { data: shs } = await sb.from("staff_shifts").select("start_min,end_min").eq("date", c.date).in("id", shiftIds);
      if (shs && shs.length) durMin = Math.max(...shs.map((s: any) => Math.max(60, s.end_min - s.start_min)));
    }
    const endMs = new Date(c.clock_in).getTime() + durMin * 60_000;
    const patch: any = { clock_out: new Date(endMs).toISOString(), approved: false, auto_out: true };
    let r = await sb.from("shift_clock").update(patch).eq("id", c.id);
    if (r.error) await sb.from("shift_clock").update({ clock_out: new Date(endMs).toISOString(), approved: false }).eq("id", c.id);   // auto_out column missing → still close it
  }
}
// A staffer's currently-open clock (clock_in set, no clock_out), most recent first.
async function openClockOf(sb: any, staffId: string) {
  const { data } = await sb.from("shift_clock").select("*").eq("staff_id", staffId).is("clock_out", null).not("clock_in", "is", null).order("clock_in", { ascending: false }).limit(1).maybeSingle();
  return data || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {};
  try { b = await req.json(); } catch { /* empty body */ }
  const action = b.action as string;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const isAdmin = () => b.secret && b.secret === Deno.env.get("SEND_SECRET");
  const clientIp = callerIp(req);   // for the venue-presence (wifi) check

  try {
    // ── Staff login: NAME + password → their profile + token ───────────────────
    // One credential for every door — the same name + password the /today hub uses
    // when you tap your name. Accepts a first name OR a full name, case-insensitive.
    if (action === "login") {
      const typed = String(b.name || b.email || "").trim().toLowerCase();
      const pw = String(b.password || "");
      if (!typed || !pw) return json({ error: "Enter your name and password." }, 400);
      const { data: all } = await sb.from("staff").select("*");
      const matches = (all || []).filter((s: any) => {
        const full = String(s.name || "").trim().toLowerCase();
        return !!full && (full === typed || full.split(/\s+/)[0] === typed);
      });
      if (matches.length === 0) return json({ error: "Name not recognised — check the spelling with your manager." }, 401);
      // If more than one person goes by that name, tell them apart by the password.
      const s = matches.length === 1 ? matches[0] : matches.filter((m: any) => (m.password || "") === pw)[0];
      if (matches.length > 1 && !s) return json({ error: "More than one person goes by that name — type your full name (first + last)." }, 409);
      if (!s || (s.password || "") !== pw) return json({ error: "Name or password not recognised." }, 401);
      if (s.active === false) return json({ error: "This account is inactive — ask the manager." }, 403);
      return json({ ok: true, staff: publicStaff(s), token: s.token });
    }

    // ── Daily hub: who's rostered TODAY + their clock status (public — the shared
    //    WhatsApp link opens this before anyone signs in). First names + times only. ──
    if (action === "todayRoster") {
      const today = shiftDayISO();   // 8am-anchored, so after-midnight still shows tonight's roster
      const { data: shifts } = await sb.from("staff_shifts").select("id,start_min,end_min").eq("date", today);
      const sids = (shifts || []).map((s: any) => s.id);
      const byShift: Record<string, any> = {}; for (const s of shifts || []) byShift[s.id] = s;
      const { data: claims } = sids.length ? await sb.from("staff_shift_claims").select("staff_id,shift_id").in("shift_id", sids) : { data: [] };
      const staffIds = [...new Set((claims || []).map((c: any) => c.staff_id))];
      const { data: staff } = staffIds.length ? await sb.from("staff").select("id,name,active").in("id", staffIds) : { data: [] };
      const { data: clocks } = staffIds.length ? await sb.from("shift_clock").select("staff_id,clock_in,clock_out").eq("date", today).in("staff_id", staffIds) : { data: [] };
      const clockBy: Record<string, any> = {}; for (const c of clocks || []) clockBy[c.staff_id] = c;
      const nameBy: Record<string, any> = {}; for (const s of staff || []) if (s.active !== false) nameBy[s.id] = s.name;
      // Per staff: earliest start + latest end across their shifts today.
      const span: Record<string, { start: number; end: number }> = {};
      for (const c of claims || []) {
        const sh = byShift[c.shift_id]; if (!sh || !(c.staff_id in nameBy)) continue;
        const cur = span[c.staff_id];
        span[c.staff_id] = cur ? { start: Math.min(cur.start, sh.start_min), end: Math.max(cur.end, sh.end_min) } : { start: sh.start_min, end: sh.end_min };
      }
      const roster = Object.keys(span).map((id) => ({
        staffId: id, name: nameBy[id], first: String(nameBy[id] || "").split(" ")[0],
        start_min: span[id].start, end_min: span[id].end,
        clockIn: clockBy[id]?.clock_in || null, clockOut: clockBy[id]?.clock_out || null,
      })).sort((a, b) => a.start_min - b.start_min || a.first.localeCompare(b.first));
      return json({ ok: true, date: today, roster });
    }

    // ── Daily hub sign-in: tap your name + password → your token (no email needed). ──
    if (action === "clockLogin") {
      const { data } = await sb.from("staff").select("*").eq("id", String(b.staffId || "")).maybeSingle();
      if (!data) return json({ error: "Couldn't find you — reload the page." }, 404);
      if (data.active === false) return json({ error: "This account is inactive — ask the manager." }, 403);
      if (!data.password) return json({ error: "You don't have a password yet — ask the manager to set you one." }, 400);
      if (String(b.password || "") !== data.password) return json({ error: "Wrong password — try again." }, 401);
      return json({ ok: true, staff: publicStaff(data), token: data.token });
    }

    // ── Public self sign-up (shareable link carries the join code) ──────────────
    if (action === "signup") {
      if (String(b.code || "") !== (Deno.env.get("SIGNUP_CODE") || "NODICE")) {
        return json({ error: "This sign-up link isn't valid any more — ask the manager for the current one." }, 403);
      }
      const name = clean(b.name);
      const email = String(b.email || "").trim().toLowerCase();
      const pw = String(b.password || "");
      if (!name || String(name).length < 2) return json({ error: "Enter your full name." }, 400);
      if (!/.+@.+\..+/.test(email)) return json({ error: "Enter a valid email address." }, 400);
      if (pw.length < 4) return json({ error: "Choose a password (at least 4 characters)." }, 400);
      const { data, error } = await sb.from("staff").insert({ name, email, password: pw, role: "Bar Staff", active: true }).select("*").single();
      if (error) return json({ error: /duplicate/i.test(error.message) ? "That email is already registered — try logging in instead." : error.message }, 400);
      return json({ ok: true, staff: publicStaff(data), token: data.token });
    }

    // ── Staff portal: load own profile by token ────────────────────────────────
    if (action === "me") {
      const token = String(b.token || "");
      if (!token) return json({ error: "no token" }, 400);
      const { data } = await sb.from("staff").select("*").eq("token", token).limit(1);
      const s = (data || [])[0];
      if (!s) return json({ error: "not found" }, 404);
      // Server-authoritative active gate (a deactivated account's token must not resolve —
      // clients rely on `me` for the single-sign-on hub bridge, so enforce it here too).
      if (s.active === false) return json({ error: "This account is inactive — ask the manager." }, 403);
      return json({ ok: true, staff: publicStaff(s) });
    }

    // ── Training doc override for a module (founder edits). Not sensitive; the
    //    frontend merges this over the built-in seed. Loaded lazily per module. ──
    if (action === "getTrainingDoc") {
      const key = String(b.moduleKey || "").slice(0, 60);
      if (!key) return json({ error: "no module" }, 400);
      const { data } = await sb.from("training_docs").select("content,updated_at").eq("module_key", key).maybeSingle();
      return json({ ok: true, content: data?.content || null, updated_at: data?.updated_at || null });
    }

    // ── Menus — list (no data, lightweight) + fetch one (data). Public. ────────
    if (action === "menus") {
      const { data } = await sb.from("menus").select("id,title,kind,created_at").eq("active", true).order("created_at", { ascending: false });
      return json({ ok: true, menus: data || [] });
    }
    if (action === "getMenu") {
      const id = String(b.id || "");
      if (!id) return json({ error: "no id" }, 400);
      const { data } = await sb.from("menus").select("title,kind,data").eq("id", id).maybeSingle();
      if (!data) return json({ error: "not found" }, 404);
      return json({ ok: true, ...data });
    }

    // ── Staff portal (token-authed): the logged-in member's own view + actions ──
    if (["myState", "saveProfile", "saveAvailability", "claimShift", "releaseShift", "getChecklist", "saveChecklist", "completeTraining", "uncompleteTraining", "signStatement", "uploadDoc", "addShiftNote", "deleteShiftNote", "clockIn", "clockOut"].includes(action)) {
      const me = await staffByToken(sb, b.token);
      if (!me) return json({ error: "Please log in again." }, 401);
      // A deactivated member's personal link must stop working too — the same
      // block password login enforces (a magic link can't be a back door in).
      if (me.active === false) return json({ error: "This account is inactive — ask the manager." }, 403);

      if (action === "myState") {
        await autoCloseStale(sb, me.id);                   // close any forgotten prior shift before reading state
        const today = shiftDayISO();                       // 8am-anchored operating day
        const pastFrom = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);   // ~90 days of shift history
        const noteFrom = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);   // last week's handovers
        const noteTo = new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10);      // + upcoming briefings
        const [{ data: shifts }, { data: av }, { data: train }, { data: myDocs }, { data: notes }, { data: clocks }] = await Promise.all([
          sb.from("staff_shifts").select("*").gte("date", pastFrom).order("date"),   // past + future (past filtered to mine below)
          sb.from("staff_availability").select("month,data").eq("staff_id", me.id),
          sb.from("training_completions").select("item_key").eq("staff_id", me.id),
          sb.from("staff_documents").select("kind").eq("staff_id", me.id),
          sb.from("shift_notes").select("*").gte("date", noteFrom).lte("date", noteTo).order("created_at", { ascending: false }),
          sb.from("shift_clock").select("*").eq("staff_id", me.id).gte("date", pastFrom).order("date"),   // their clock history
        ]);
        const docKinds = new Set((myDocs || []).map((d: any) => d.kind));
        const ids = (shifts || []).map((s: any) => s.id);
        const { data: claims } = ids.length
          ? await sb.from("staff_shift_claims").select("shift_id,staff_id,source").in("shift_id", ids)
          : { data: [] };
        const filled: Record<string, number> = {}; const mine = new Set<string>(); const mineAdmin = new Set<string>();
        for (const c of claims || []) { filled[c.shift_id] = (filled[c.shift_id] || 0) + 1; if (c.staff_id === me.id) { mine.add(c.shift_id); if (c.source === "admin") mineAdmin.add(c.shift_id); } }
        const availability: Record<string, any> = {};
        for (const r of av || []) availability[r.month] = r.data || {};
        // Future: their OWN shifts + genuinely-open ones (not every colleague's
        // per-person block, which would flood the portal). Past: only their own —
        // their history, so they can see rostered vs actual clocked times.
        const clockList = clocks || [];
        const visibleShifts = (shifts || []).filter((s: any) =>
          mine.has(s.id) || (s.date >= today && (filled[s.id] || 0) < (s.headcount || 1)));
        return json({
          ok: true, staff: publicStaff(me), availability,
          shifts: visibleShifts.map((s: any) => ({ ...s, filled: filled[s.id] || 0, mine: mine.has(s.id), assigned: mineAdmin.has(s.id) })),
          training: (train || []).map((t: any) => t.item_key),
          docs: { passport: docKinds.has("passport"), rtw: docKinds.has("rtw") },
          notes: notes || [],
          // Banner clock = an OPEN shift (whichever day it started, so it persists past
          // midnight until they clock out) else this shift day's row.
          clock: clockList.find((c: any) => c.clock_in && !c.clock_out) || clockList.find((c: any) => c.date === today) || null,
          clocks: clockList,                                              // full clock history (past-shift actuals)
          rosteredToday: (shifts || []).some((s: any) => s.date === today && mine.has(s.id)),
          // Kitchen food-safety gate: show the Kitchen checklists only for a kitchen-
          // trained member who's on a KITCHEN shift today. shiftId ties runs to the shift.
          kitchen: {
            isKitchen: (me.abilities || []).includes("kitchen"),
            shiftId: ((shifts || []).find((s: any) => s.date === today && (s.ability || "bar") === "kitchen" && mine.has(s.id)) || {}).id || null,
            date: today,
          },
          soi_version: SOI_VERSION,
        });
      }

      if (action === "saveProfile") {
        // Staff edit their OWN contact, next-of-kin + onboarding/payroll details.
        // Role/skills/abilities/training/password/active stay founder-controlled.
        const patch: any = {};
        for (const k of ["name", "phone", "address", "emergency_name", "emergency_phone", "emergency_relation",
          "dob", "ni_number", "bank_name", "bank_sort", "bank_account"]) {
          if (k in b) patch[k] = clean(b[k]) || null;
        }
        if ("interests" in b) patch.interests = cleanInterests(b.interests);
        // Their own login email — normalise + validate; the unique index means a
        // clash with another member returns a friendly message, not a raw error.
        if ("email" in b) {
          const email = String(b.email || "").trim().toLowerCase();
          if (email && !/.+@.+\..+/.test(email)) return json({ error: "Enter a valid email address (like you@email.com)." }, 400);
          patch.email = email || null;
        }
        if (!Object.keys(patch).length) return json({ error: "nothing to save" }, 400);
        const { error } = await sb.from("staff").update(patch).eq("id", me.id);
        if (error) return json({ error: /duplicate/i.test(error.message) ? "That email is already used by another team member — check it's yours." : error.message }, 400);
        return json({ ok: true, staff: publicStaff({ ...me, ...patch }) });
      }

      // Staff leave a handover note on a day's shift (the next team reads it).
      if (action === "addShiftNote") {
        const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date)) ? String(b.date) : todayISO();
        const body = String(b.body || "").trim().slice(0, 1000);
        if (!body) return json({ error: "Write a note first." }, 400);
        const { data, error } = await sb.from("shift_notes")
          .insert({ date, staff_id: me.id, author_name: me.name, body, kind: "handover" }).select("*").single();
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, note: data });
      }
      // Staff may delete their OWN note only.
      if (action === "deleteShiftNote") {
        if (!b.id) return json({ error: "no note" }, 400);
        const { error } = await sb.from("shift_notes").delete().eq("id", b.id).eq("staff_id", me.id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      // Clock in — stamps the real start time for this shift day (first tap wins).
      // Records presence (wifi/GPS) so off-site punches are flagged. Staff must sign OUT
      // of any earlier open shift first — we auto-close a forgotten one so they're never stuck.
      if (action === "clockIn") {
        await autoCloseStale(sb, me.id);                     // sign out a forgotten prior shift first
        const day = shiftDayISO();
        // If a shift is already OPEN (this or any day), you're already on — return it.
        // Checked BEFORE the presence gate so a re-tap never shows a misleading "not at venue".
        const openNow = await openClockOf(sb, me.id);
        if (openNow) return json({ ok: true, clock: openNow, alreadyOpen: true });
        // Already did (and finished) this shift day → return it, don't start a second.
        const { data: existing } = await sb.from("shift_clock").select("*").eq("staff_id", me.id).eq("date", day).maybeSingle();
        if (existing?.clock_in) return json({ ok: true, clock: existing });
        const pres = await checkPresence(sb, clientIp, b.fix);
        if (!pres.allow) return json({ error: "You're not at the venue yet. Head inside and tap again, or ask your manager to start your shift." }, 403);
        const base: any = { staff_id: me.id, date: day, clock_in: new Date().toISOString(), approved: false };
        const rich = pres.label === "off" ? base
          : { ...base, ip: clientIp, lat: b.fix?.lat ?? null, lng: b.fix?.lng ?? null, accuracy_m: b.fix?.accuracy ?? null, presence: pres.label };
        let up = await sb.from("shift_clock").insert(rich).select("*").single();
        if (up.error && rich !== base) up = await sb.from("shift_clock").insert(base).select("*").single();   // presence columns missing → base insert
        if (up.error) {   // unique (staff_id,date) race — a parallel tap won; return that row
          const { data: row } = await sb.from("shift_clock").select("*").eq("staff_id", me.id).eq("date", day).maybeSingle();
          if (row) return json({ ok: true, clock: row });
          return json({ error: up.error.message }, 400);
        }
        return json({ ok: true, clock: up.data, presence: pres.label });
      }
      // Clock out — closes the OPEN shift (whichever day it started), so a 2am clock-out
      // ends last night's shift, not a non-existent "today" row. Idempotent: a repeat tap
      // returns the finished row without overwriting the time or un-approving it. Records
      // presence for the flag, but NEVER blocks — no one can be left unable to end a shift.
      if (action === "clockOut") {
        const open = await openClockOf(sb, me.id);
        if (!open) {
          const { data: done } = await sb.from("shift_clock").select("*").eq("staff_id", me.id).eq("date", shiftDayISO()).maybeSingle();
          if (done?.clock_out) return json({ ok: true, clock: done });   // already finished — idempotent
          return json({ error: "Start your shift first." }, 400);
        }
        const pres = await checkPresence(sb, clientIp, b.fix);
        const base: any = { clock_out: new Date().toISOString(), approved: false };
        const rich = pres.label === "off" ? base : { ...base, presence_out: pres.label };
        let up = await sb.from("shift_clock").update(rich).eq("id", open.id).select("*").single();
        if (up.error && rich !== base) up = await sb.from("shift_clock").update(base).eq("id", open.id).select("*").single();
        if (up.error) return json({ error: up.error.message }, 400);
        return json({ ok: true, clock: up.data, presence: pres.label });
      }

      if (action === "saveAvailability") {
        const month = String(b.month || "");
        if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: "bad month" }, 400);
        const raw = (b.data && typeof b.data === "object" && !Array.isArray(b.data)) ? b.data : {};
        // Model: everyone's available by default; we store ONLY the days a member
        // marked OFF, as { unavailable: true }. Sanitise hard — keep only valid
        // YYYY-MM-DD keys in this month whose entry is an explicit off-mark, cap the
        // count, drop anything else. Critically this means a legacy { available:true }
        // mark (or any stray value) the client might still send is DROPPED, never
        // flipped into an off-day — so nothing meaningful is lost and no available
        // day is silently turned unavailable.
        const data: Record<string, any> = {};
        let n = 0;
        for (const k of Object.keys(raw)) {
          if (n >= 40) break;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !k.startsWith(month + "-")) continue;
          const v = raw[k];
          if (v && typeof v === "object" && !Array.isArray(v) && v.unavailable === true) { data[k] = { unavailable: true }; n++; }
        }
        // What this member had marked off BEFORE this save — so we can tell the founder
        // exactly which NEW day(s) they've just taken off (and only email about those).
        const { data: prevAv } = await sb.from("staff_availability").select("data").eq("staff_id", me.id).eq("month", month).maybeSingle();
        const prevData = (prevAv?.data || {}) as Record<string, any>;
        const prevOffSet = new Set(Object.keys(prevData).filter((k) => prevData[k]?.unavailable === true));
        // Availability is just "days I can't work" — purely an input the founder uses
        // when building the rota. It is independent of who's rostered, so a member can
        // freely mark/un-mark any day and it never adds or removes an actual shift.
        const { error } = await sb.from("staff_availability")
          .upsert({ staff_id: me.id, month, data, updated_at: new Date().toISOString() }, { onConflict: "staff_id,month" });
        if (error) return json({ error: error.message }, 400);
        // Founder alert — fires for each NEW day off, naming the exact date and flagging
        // anything happening that day from the Key Dates tracker, so the founder sees the
        // clash at a glance. (Clearing a day, or re-saving with nothing new, sends nothing.)
        const newOff = Object.keys(data).filter((k) => !prevOffSet.has(k)).sort();
        if (newOff.length > 0 && RESEND) {
          const monthEnd = month + "-31";
          const { data: evs } = await sb.from("venue_events").select("start_date,end_date,title,location,category").lte("start_date", monthEnd).order("start_date");
          const eventsOn = (d: string) => (evs || []).filter((e: any) => e.start_date <= d && (e.end_date ? e.end_date >= d : e.start_date === d));
          const fmtDay = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
          const li = newOff.map((d) => {
            const es = eventsOn(d);
            const ev = es.length
              ? `<br><span style="color:#F59E0B;font-size:13px">⚠️ On this day: ${es.map((e: any) => esc(e.title) + (e.location ? ` — ${esc(e.location)}` : "")).join(" · ")}</span>`
              : `<br><span style="color:#888;font-size:12px">Nothing flagged in the Key Dates tracker.</span>`;
            return `<li style="margin:8px 0"><strong style="color:#fff">${esc(fmtDay(d))}</strong>${ev}</li>`;
          }).join("");
          const subject = newOff.length === 1 ? `${me.name} is off ${fmtDay(newOff[0])}` : `${me.name} marked ${newOff.length} days off`;
          await sendMail(ADMIN_EMAIL, subject,
            emailShell(`${esc(me.name)} updated their availability`,
              `<p style="color:#ccc;line-height:1.6"><strong style="color:#fff">${esc(me.name)}</strong> marked ${newOff.length === 1 ? "this day" : "these days"} off — the rota builder will work around ${newOff.length === 1 ? "it" : "them"}:</p><ul style="color:#ccc;padding-left:18px;line-height:1.5">${li}</ul>`,
              { href: OPS_URL, label: "Open the rota" }));
        }
        return json({ ok: true });
      }

      if (action === "claimShift") {
        if (me.active === false) return json({ error: "Your account is inactive — ask the manager." }, 403);
        // Onboarding gate (all rostered roles) — statement signed + payroll / right-to-work in.
        if (["Bar Staff", "Supervisor", "Asst. Manager", "Manager"].includes(me.role)) {
          const { data: myDocs } = await sb.from("staff_documents").select("kind").eq("staff_id", me.id);
          if (!onboardingOk(me, new Set((myDocs || []).map((d: any) => d.kind)))) return json({ error: "Finish your onboarding first — sign the statement and complete your details to unlock shifts." }, 403);
        }
        const { data: shift } = await sb.from("staff_shifts").select("id,date,label,ability,min_rank").eq("id", b.shiftId).maybeSingle();
        if (!shift) return json({ error: "That shift is no longer available — refresh." }, 404);
        // Eligibility: right ability + role at or above the shift's level (the founder
        // can still assign it to anyone as an override).
        const needAb = shift.ability || "bar";
        if (!(me.abilities || []).includes(needAb)) return json({ error: `That shift needs ${needAb} training — ask the manager to add it to your profile.` }, 403);
        if (staffRank(me.role) < (shift.min_rank || 1)) return json({ error: "That shift is for a higher position — the manager can assign it to you if needed." }, 403);
        // Available by default — block only if they've explicitly marked this day off.
        const { data: avRow } = await sb.from("staff_availability").select("data").eq("staff_id", me.id).eq("month", shift.date.slice(0, 7)).maybeSingle();
        if (avRow?.data?.[shift.date]?.unavailable === true) return json({ error: "You've marked yourself off that day — clear it on the Availability tab first, then grab the shift." }, 409);
        // Capacity is enforced atomically by the enforce_shift_headcount trigger.
        const { error } = await sb.from("staff_shift_claims").insert({ shift_id: b.shiftId, staff_id: me.id, status: "claimed", source: "staff" });
        if (error) {
          const m = (error.message || "").toLowerCase();
          if (m.includes("shift_full")) return json({ error: "That shift just filled up — try another." }, 409);
          if (m.includes("duplicate")) return json({ error: "You're already on that shift." }, 409);
          return json({ error: "Couldn't grab that shift — refresh and try again." }, 400);
        }
        // Tell the founder, with a link to the rota overview.
        await sendMail(ADMIN_EMAIL, `${me.name} took a shift — ${niceDate(shift.date)}`,
          emailShell(`${esc(me.name)} grabbed a shift`,
            `<p style="color:#ccc;line-height:1.6"><strong style="color:#fff">${esc(me.name)}</strong> took the <strong style="color:#fff">${esc(shift.label || "shift")}</strong> on <strong style="color:#fff">${niceDate(shift.date)}</strong>. Log in to see the rota and what still needs covering.</p>`,
            { href: OPS_URL, label: "See the rota overview" }));
        return json({ ok: true });
      }

      if (action === "releaseShift") {
        const { data: sh } = await sb.from("staff_shifts").select("date,label,ability,min_rank").eq("id", b.shiftId).maybeSingle();
        // A manager-assigned (admin) shift isn't self-service — the staffer can't drop
        // it (and we must not fire the "back on the board" broadcast for it).
        const { data: myClaim } = await sb.from("staff_shift_claims").select("source").eq("shift_id", b.shiftId).eq("staff_id", me.id).maybeSingle();
        if (myClaim?.source === "admin") return json({ error: "The manager put you on this shift — message them if you can't make it." }, 403);
        const { error } = await sb.from("staff_shift_claims").delete().eq("shift_id", b.shiftId).eq("staff_id", me.id);
        if (error) return json({ error: error.message }, 400);
        // Back on the board → broadcast to ELIGIBLE staff (right ability + rank) + tell the founder.
        if (sh) {
          const subject = `A ${sh.label || "shift"} is back on the board — ${niceDate(sh.date)}`;
          const html = emailShell(`Shift available: ${esc(sh.label)} · ${niceDate(sh.date)}`,
            `<p style="color:#ccc;line-height:1.6">A <strong style="color:#fff">${esc(sh.label || "shift")}</strong> on <strong style="color:#fff">${niceDate(sh.date)}</strong> has just opened up — first to grab it gets it.</p>`,
            { href: PORTAL_URL, label: "Log in to take the shift" });
          const { data: team } = await sb.from("staff").select("email,abilities,role").eq("active", true).neq("id", me.id);
          const eligible = (team || []).filter((t: any) => (t.abilities || []).includes(sh.ability || "bar") && staffRank(t.role) >= (sh.min_rank || 1));
          for (const t of eligible) if (t.email) await sendMail(t.email, subject, html);
          await sendMail(ADMIN_EMAIL, `Shift dropped — ${niceDate(sh.date)} needs covering`,
            emailShell(`${esc(me.name)} dropped a shift`,
              `<p style="color:#ccc;line-height:1.6"><strong style="color:#fff">${esc(me.name)}</strong> cancelled the <strong style="color:#fff">${esc(sh.label || "shift")}</strong> on <strong style="color:#fff">${niceDate(sh.date)}</strong>. It's back on the board — the team's been notified.</p>`,
              { href: OPS_URL, label: "See the rota" }));
        }
        return json({ ok: true });
      }

      // ── Shift checklists: load / save today's (opening|during|closing) ────────
      if (action === "getChecklist") {
        const date = String(b.date || ""), key = String(b.key || "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !key) return json({ error: "bad date or checklist" }, 400);
        const { data } = await sb.from("checklist_submissions").select("*").eq("date", date).eq("checklist_key", key).maybeSingle();
        return json({ ok: true, submission: data || null });
      }

      if (action === "saveChecklist") {
        const date = String(b.date || ""), key = String(b.key || "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !key) return json({ error: "bad date or checklist" }, 400);
        // One task toggle → atomic jsonb merge (concurrent-safe shared sheet).
        if (b.toggle && typeof b.toggle === "object" && !Array.isArray(b.toggle)) {
          const item = String(b.toggle.item || "").slice(0, 400);
          if (!item) return json({ error: "no item" }, 400);
          const { error } = await sb.rpc("checklist_toggle", { p_date: date, p_key: key, p_staff: me.id, p_item: item, p_on: !!b.toggle.on });
          if (error) return json({ error: error.message }, 400);
          return json({ ok: true });
        }
        // Note + submit (submit is sticky server-side).
        const { error } = await sb.rpc("checklist_meta", { p_date: date, p_key: key, p_staff: me.id, p_note: clean(b.note) || null, p_submit: !!b.submit });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      // ── Training: mark a module or a cocktail complete / undo ─────────────────
      if (action === "completeTraining") {
        const item = String(b.itemKey || "").slice(0, 120);
        if (!item) return json({ error: "no item" }, 400);
        const { error } = await sb.from("training_completions").upsert({ staff_id: me.id, item_key: item }, { onConflict: "staff_id,item_key", ignoreDuplicates: true });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      if (action === "uncompleteTraining") {
        const item = String(b.itemKey || "").slice(0, 120);
        if (!item) return json({ error: "no item" }, 400);
        const { error } = await sb.from("training_completions").delete().eq("staff_id", me.id).eq("item_key", item);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      // ── Onboarding: sign the statement of intent + upload documents ────────────
      if (action === "signStatement") {
        const sig = clean(b.signature);
        if (!sig || String(sig).length < 2) return json({ error: "Type your full name to sign." }, 400);
        const { error } = await sb.from("staff").update({ soi_signed_at: new Date().toISOString(), soi_signature: sig, soi_version: SOI_VERSION }).eq("id", me.id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }
      if (action === "uploadDoc") {
        const kind = b.kind === "rtw" ? "rtw" : b.kind === "passport" ? "passport" : "";
        const data = String(b.data || "");
        if (!kind) return json({ error: "bad document type" }, 400);
        if (!data.startsWith("data:")) return json({ error: "Pick a file to upload." }, 400);
        if (data.length > 6_000_000) return json({ error: "That file's too big — keep it under ~4MB." }, 413);
        const { error } = await sb.from("staff_documents").upsert({ staff_id: me.id, kind, data, uploaded_at: new Date().toISOString() }, { onConflict: "staff_id,kind" });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

    }

    // ── Everything below is founder-only ───────────────────────────────────────
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);

    if (action === "admin") {
      const { data: staff } = await sb.from("staff").select("*").order("name");
      return json({ ok: true, staff: (staff || []).map(adminStaff), roles: ROLES });
    }

    if (action === "addStaff") {
      const name = clean(b.name);
      if (!name) return json({ error: "Name is required." }, 400);
      const row: any = {
        name,
        email: clean(b.email) || null,
        phone: clean(b.phone) || null,
        address: clean(b.address) || null,
        emergency_name: clean(b.emergency_name) || null,
        emergency_phone: clean(b.emergency_phone) || null,
        emergency_relation: clean(b.emergency_relation) || null,
        role: clean(b.role) || null,
        skills: Array.isArray(b.skills) ? b.skills : [],
        abilities: cleanAbilities(b.abilities),
        training_status: clean(b.training_status) || null,
        training_notes: clean(b.training_notes) || null,
        feedback_notes: clean(b.feedback_notes) || null,
        work_rules: clean(b.work_rules) || null,
        password: clean(b.password) || null,
        active: b.active !== false,
        hourly_rate: cleanRate(b.hourly_rate),
        target_hours: cleanHours(b.target_hours),
        employment_type: EMPLOYMENT_TYPES.includes(String(b.employment_type)) ? String(b.employment_type) : null,
      };
      const { data, error } = await sb.from("staff").insert(row).select("*").single();
      if (error) return json({ error: /duplicate/i.test(error.message) ? "That email is already used by another team member." : error.message }, 400);
      return json({ ok: true, staff: adminStaff(data) });
    }

    if (action === "saveStaff") {
      const id = b.id;
      if (!id) return json({ error: "no id" }, 400);
      const patch: any = {};
      // Only apply fields that were actually sent, so a partial save never nulls the rest.
      for (const k of ["name", "email", "phone", "address", "emergency_name", "emergency_phone",
        "emergency_relation", "role", "training_status", "training_notes", "feedback_notes",
        "work_rules", "dob", "ni_number", "bank_name", "bank_sort", "bank_account"]) {
        if (k in b) patch[k] = clean(b[k]) || null;
      }
      if ("skills" in b) patch.skills = Array.isArray(b.skills) ? b.skills : [];
      if ("abilities" in b) patch.abilities = cleanAbilities(b.abilities);
      if ("interests" in b) patch.interests = cleanInterests(b.interests);
      if ("active" in b) patch.active = !!b.active;
      if ("hourly_rate" in b) patch.hourly_rate = cleanRate(b.hourly_rate);       // management-only pay
      if ("target_hours" in b) patch.target_hours = cleanHours(b.target_hours);   // hours/week they want
      if ("employment_type" in b) patch.employment_type = EMPLOYMENT_TYPES.includes(String(b.employment_type)) ? String(b.employment_type) : null;
      // Password only changes when a non-empty value is sent (blank = leave as-is).
      if ("password" in b && clean(b.password)) patch.password = clean(b.password);
      const { data, error } = await sb.from("staff").update(patch).eq("id", id).select("*").single();
      if (error) return json({ error: /duplicate/i.test(error.message) ? "That email is already used by another team member." : error.message }, 400);
      return json({ ok: true, staff: adminStaff(data) });
    }

    if (action === "removeStaff") {
      const id = b.id;
      if (!id) return json({ error: "no id" }, 400);
      const { error } = await sb.from("staff").delete().eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ── Founder: add / delete a management note on a day (pops up for staff) ────
    if (action === "addDayNote") {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date)) ? String(b.date) : todayISO();
      const body = String(b.body || "").trim().slice(0, 1000);
      if (!body) return json({ error: "Write a note first." }, 400);
      const { data, error } = await sb.from("shift_notes")
        .insert({ date, staff_id: null, author_name: clean(b.author_name) || "Management", body, kind: "manager" }).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, note: data });
    }
    if (action === "deleteDayNote") {
      if (!b.id) return json({ error: "no note" }, 400);
      const { error } = await sb.from("shift_notes").delete().eq("id", b.id);   // founder can delete any note
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ── Founder: adjust / approve a person's clocked hours for a day ────────────
    if (action === "setClock") {
      const staffId = String(b.staffId || "");
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date)) ? String(b.date) : "";
      if (!staffId || !date) return json({ error: "missing staff or date" }, 400);
      const patch: Record<string, unknown> = {};
      if ("clock_in" in b) patch.clock_in = b.clock_in || null;     // ISO timestamp or null
      if ("clock_out" in b) patch.clock_out = b.clock_out || null;
      if ("approved" in b) patch.approved = !!b.approved;
      if (!Object.keys(patch).length) return json({ error: "nothing to set" }, 400);
      const { data, error } = await sb.from("shift_clock")
        .upsert({ staff_id: staffId, date, ...patch }, { onConflict: "staff_id,date" }).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, clock: data });
    }

    // ── Email a staff member their personal login link (Resend). The link carries
    //    their token, so tapping it logs them straight in — no password needed. ──
    if (action === "remindStaff") {
      const id = b.id;
      if (!id) return json({ error: "no id" }, 400);
      const { data } = await sb.from("staff").select("*").eq("id", id).limit(1);
      const s = (data || [])[0];
      if (!s) return json({ error: "not found" }, 404);
      if (s.active === false) return json({ error: "This person is inactive — reactivate them first to send a login." }, 400);
      if (!s.email) return json({ error: "No email on file for this person — add one first." }, 400);
      if (!RESEND) return json({ error: "Email isn't switched on yet (RESEND_API_KEY not set)." }, 400);
      const link = `${PORTAL_URL}?t=${s.token}`;
      const first = esc(String(s.name || "there").split(" ")[0]);
      await sendMail(
        s.email,
        "Your No Dice staff login",
        emailShell(
          `Hi ${first} 👋`,
          `<p style="font-size:15px;line-height:1.6;color:#ddd">Here's your personal login for the No Dice staff portal. Tap the button below to go straight in — no password needed.</p>
           <p style="font-size:13px;line-height:1.6;color:#999">Inside you can set the days you're free, pick up shifts, work through your training and finish your onboarding.</p>
           <p style="font-size:12px;line-height:1.6;color:#777">Keep this link private — it logs in as you. Lost it? Ask the manager to send it again.</p>`,
          { href: link, label: "Open my staff portal" },
        ),
      );
      return json({ ok: true, email: s.email });
    }

    // ── Venue clock-in lock config (founder, secret-gated) ─────────────────────
    // Read the current setup (null config = setup SQL not pasted yet).
    if (action === "getVenueConfig" && isAdmin()) {
      const cfg = await venueConfig(sb);
      return json({ ok: true, config: cfg, ready: cfg !== null });
    }
    // Save any config field (toggle on/off, mode warn|block, IP, radius, coords).
    if (action === "setVenueConfig" && isAdmin()) {
      const patch: any = { updated_at: new Date().toISOString() };
      const src = b.config || {};
      for (const k of ["enabled", "mode", "venue_ip", "venue_ip6", "venue_lat", "venue_lng", "radius_m"]) {
        if (src[k] !== undefined) patch[k] = src[k] === "" ? null : src[k];
      }
      const { data, error } = await sb.from("venue_presence").upsert({ id: 1, ...patch }, { onConflict: "id" }).select("*").single();
      if (error) return json({ error: "Couldn't save — have you run the setup SQL yet? (" + error.message + ")" }, 400);
      return json({ ok: true, config: data });
    }
    // Pin the venue to wherever the founder is standing now (do this inside the bar):
    // sets the GPS point + optionally captures the current egress IP as the venue wifi,
    // and turns the feature on in flag-only mode.
    if (action === "setVenueLocation" && isAdmin()) {
      const fix = b.fix || {};
      if (typeof fix.lat !== "number" || typeof fix.lng !== "number") return json({ error: "No location yet — allow location access, stand inside the venue, and try again." }, 400);
      const cfg0 = await venueConfig(sb);
      const patch: any = {
        id: 1, venue_lat: fix.lat, venue_lng: fix.lng,
        radius_m: b.radius_m || cfg0?.radius_m || 150,
        enabled: b.enabled !== undefined ? b.enabled : true,
        mode: b.mode || cfg0?.mode || "warn",
        updated_at: new Date().toISOString(),
      };
      if (b.alsoSetIp && clientIp) {
        patch.venue_ip = clientIp;
        patch.ip_history = [...((cfg0?.ip_history) || []), { ip: clientIp, at: new Date().toISOString() }].slice(-20);
      }
      const { data, error } = await sb.from("venue_presence").upsert(patch, { onConflict: "id" }).select("*").single();
      if (error) return json({ error: "Couldn't save — have you run the setup SQL yet? (" + error.message + ")" }, 400);
      return json({ ok: true, config: data, capturedIp: b.alsoSetIp ? clientIp : null });
    }
    // Dry-run: "does the system think I'm at the venue right now?" — never writes.
    if (action === "testPresence" && isAdmin()) {
      const pres = await checkPresence(sb, clientIp, b.fix);
      return json({ ok: true, ...pres, ip: clientIp });
    }

    // ── AI-rota rules (founder, secret-gated) — editable hours/staffing/holidays ─
    if (action === "getRotaRules" && isAdmin()) {
      const { data } = await sb.from("rota_rules").select("data").eq("id", 1).maybeSingle();
      const rules = data?.data && Object.keys(data.data).length ? data.data : null;
      return json({ ok: true, rules });
    }
    if (action === "setRotaRules" && isAdmin()) {
      // Store the founder's full rules object (or {} to fall back to engine defaults).
      const data = (b.rules && typeof b.rules === "object" && !Array.isArray(b.rules)) ? b.rules : {};
      const { data: saved, error } = await sb.from("rota_rules")
        .upsert({ id: 1, data, updated_at: new Date().toISOString() }, { onConflict: "id" }).select("data").single();
      if (error) return json({ error: "Couldn't save the rules — have you run the setup SQL? (" + error.message + ")" }, 400);
      const rules = saved?.data && Object.keys(saved.data).length ? saved.data : null;
      return json({ ok: true, rules });
    }

    // ── Founder edits a staffer's availability (secret-gated) ──────────────────
    // Same shape/sanitising as the staff-side saveAvailability, but keyed to any
    // staffId. The founder can fill in / correct anyone's "days I can work".
    if (action === "setStaffAvailability" && isAdmin()) {
      const staffId = String(b.staffId || "");
      const month = String(b.month || "");
      if (!staffId) return json({ error: "no staff" }, 400);
      if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: "bad month" }, 400);
      const raw = (b.data && typeof b.data === "object" && !Array.isArray(b.data)) ? b.data : {};
      // Same off-only model as saveAvailability: store ONLY explicit { unavailable:true }
      // days; drop anything else (incl. legacy { available:true }) so an available day
      // is never silently flipped off and nothing meaningful is deleted.
      const data: Record<string, any> = {};
      let n = 0;
      for (const k of Object.keys(raw)) {
        if (n >= 40) break;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !k.startsWith(month + "-")) continue;
        const v = raw[k];
        if (v && typeof v === "object" && !Array.isArray(v) && v.unavailable === true) { data[k] = { unavailable: true }; n++; }
      }
      const { error } = await sb.from("staff_availability")
        .upsert({ staff_id: staffId, month, data, updated_at: new Date().toISOString() }, { onConflict: "staff_id,month" });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ── Rota (founder view): staff + upcoming shifts + who's on them ───────────
    if (action === "load") {
      // Auto-sign-out anyone who forgot to clock out on an earlier shift day, so the
      // founder's hours/wages reflect real (auto-closed, unapproved) figures.
      {
        const sd = shiftDayISO();
        const { data: staleOpen } = await sb.from("shift_clock").select("staff_id").is("clock_out", null).not("clock_in", "is", null).lt("date", sd);
        for (const sid of [...new Set((staleOpen || []).map((c: any) => c.staff_id))]) await autoCloseStale(sb, sid);
      }
      // Include the recent past (~6 months) so the week overview counts the whole
      // current week (not just today-onward) and can look back at past weeks' spend.
      const windowStart = new Date(Date.now() - 183 * 86400000).toISOString().slice(0, 10);
      const noteFrom = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
      const [{ data: staff }, { data: shifts }, { data: claims }, { data: training }, { data: docs }, { data: notes }, { data: clocks }, { data: availability }, { data: rulesRow }] = await Promise.all([
        sb.from("staff").select("*").order("name"),
        sb.from("staff_shifts").select("*").gte("date", windowStart).order("date"),
        sb.from("staff_shift_claims").select("*"),
        sb.from("training_completions").select("staff_id,item_key"),
        sb.from("staff_documents").select("staff_id,kind,uploaded_at"),   // which docs each has (no data)
        sb.from("shift_notes").select("*").gte("date", noteFrom).order("created_at", { ascending: false }),
        sb.from("shift_clock").select("*").gte("date", windowStart),
        sb.from("staff_availability").select("staff_id,month,data"),
        sb.from("rota_rules").select("data").eq("id", 1).maybeSingle(),   // AI-rota rules (null/{} = venue defaults)
      ]);
      const ids = new Set((shifts || []).map((s: any) => s.id));
      const rotaRules = rulesRow?.data && Object.keys(rulesRow.data).length ? rulesRow.data : null;
      return json({
        ok: true, roles: ROLES,
        staff: (staff || []).map(adminStaff),
        shifts: shifts || [],
        claims: (claims || []).filter((c: any) => ids.has(c.shift_id)),   // claims on the loaded shifts
        training: training || [],   // all completions — for per-staff progress in the admin
        docs: docs || [],           // which staff have uploaded passport / rtw
        notes: notes || [],         // shift notes board (recent + upcoming)
        clocks: clocks || [],       // actual clock in/out per staff per day
        availability: availability || [],   // each member's marked-available days (AI rota input)
        rotaRules,                  // founder-edited AI-rota rules (null → engine defaults)
      });
    }

    // ── Founder: recent checklist submissions (Operations view) ───────────────
    if (action === "checklistLog") {
      const days = Math.max(1, Math.min(90, parseInt(String(b.days)) || 21));
      const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      const { data: subs } = await sb.from("checklist_submissions").select("*").gte("date", since).order("date", { ascending: false });
      const ids = [...new Set((subs || []).map((s: any) => s.staff_id).filter(Boolean))];
      const { data: names } = ids.length ? await sb.from("staff").select("id,name").in("id", ids) : { data: [] };
      const nameOf: Record<string, string> = {};
      for (const s of names || []) nameOf[s.id] = s.name;
      return json({ ok: true, submissions: (subs || []).map((s: any) => ({ ...s, staff_name: s.staff_id ? nameOf[s.staff_id] || null : null })) });
    }

    // ── Founder: all training completions (staff × item matrix) ───────────────
    if (action === "trainingLog") {
      const { data: comps } = await sb.from("training_completions").select("staff_id,item_key,completed_at");
      return json({ ok: true, completions: comps || [] });
    }

    // ── Founder: save / reset a training document override ─────────────────────
    if (action === "saveTrainingDoc") {
      const key = String(b.moduleKey || "").slice(0, 60);
      const content = (b.content && typeof b.content === "object" && !Array.isArray(b.content)) ? b.content : null;
      if (!key || !content) return json({ error: "missing module or content" }, 400);
      if (JSON.stringify(content).length > 900_000) return json({ error: "Too big — use fewer / smaller images." }, 413);
      const { error } = await sb.from("training_docs").upsert({ module_key: key, content, updated_at: new Date().toISOString() }, { onConflict: "module_key" });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    if (action === "resetTrainingDoc") {
      const key = String(b.moduleKey || "").slice(0, 60);
      if (!key) return json({ error: "no module" }, 400);
      const { error } = await sb.from("training_docs").delete().eq("module_key", key);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ── Founder: upload / delete a menu ───────────────────────────────────────
    if (action === "addMenu") {
      const title = clean(b.title);
      const data = String(b.data || "");
      const kind = b.kind === "image" ? "image" : "pdf";
      if (!title || !data.startsWith("data:")) return json({ error: "Give it a title and pick a file." }, 400);
      if (data.length > 6_000_000) return json({ error: "That file's too big — keep menus under ~4MB." }, 413);
      const { error } = await sb.from("menus").insert({ title, kind, data });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    if (action === "deleteMenu") {
      if (!b.id) return json({ error: "no id" }, 400);
      const { error } = await sb.from("menus").delete().eq("id", b.id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ── Founder: view a staff member's uploaded document (passport / right-to-work) ──
    if (action === "getDoc") {
      if (!b.staffId || !b.kind) return json({ error: "missing" }, 400);
      const { data } = await sb.from("staff_documents").select("data,kind,uploaded_at").eq("staff_id", b.staffId).eq("kind", b.kind).maybeSingle();
      if (!data) return json({ error: "not uploaded" }, 404);
      return json({ ok: true, ...data });
    }

    // ── Release a whole month of shifts from the fixed patterns ────────────────
    if (action === "releaseMonth" || action === "openDay") {
      const headcount = clampHead(b.headcount, 2);
      const today = todayISO();
      let dates: string[] = [];
      if (action === "openDay") {
        if (!b.date) return json({ error: "no date" }, 400);
        dates = [String(b.date)];
      } else {
        const m = String(b.month || "").match(/^(\d{4})-(\d{2})$/);
        if (!m) return json({ error: "Pick a month like 2026-08." }, 400);
        const yr = +m[1], mo = +m[2];
        const daysIn = new Date(Date.UTC(yr, mo, 0)).getUTCDate();
        for (let d = 1; d <= daysIn; d++) dates.push(`${yr}-${m[2]}-${String(d).padStart(2, "0")}`);
      }
      const rows: any[] = [];
      for (const date of dates) {
        if (date < today) continue;   // never open a past date
        for (const s of shiftsForDate(date)) {
          rows.push({ date, shift_key: s.key, label: s.label, position: s.label, role: s.role, ability: s.role || "bar", min_rank: 1, start_min: s.start, end_min: s.end, status: "open", headcount });
        }
      }
      if (rows.length) {
        const { error } = await sb.from("staff_shifts").upsert(rows, { onConflict: "date,shift_key", ignoreDuplicates: true });
        if (error) return json({ error: error.message }, 400);
      }
      return json({ ok: true, opened: rows.length });
    }

    // ── Build a custom shift on a day — any start/end time, staffing & role ────
    //    (the founder isn't limited to the fixed Open/Close patterns). An end time
    //    at or before the start means it finishes the next day, e.g. 6pm→1am.
    if (action === "addShift") {
      const date = String(b.date || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "Pick a valid date." }, 400);
      // Past dates ARE allowed — the founder edits historical rosters. Editing the
      // rostered plan never touches the actual clock records (those are keyed separately).
      const t = normalizeShiftTimes(b.start_min, b.end_min);
      if ("error" in t) return json({ error: t.error }, 400);
      const { start, end } = t;
      const ability = ABILITY_KEYS.includes(String(b.ability)) ? String(b.ability) : "bar";
      const min_rank = Math.max(1, Math.min(4, parseInt(String(b.min_rank)) || 1));
      const headcount = clampHead(b.headcount, 1);
      const label = cleanShiftLabel(b.label, start, end);
      const shift_key = "custom:" + crypto.randomUUID().slice(0, 8);   // unique per (date, shift_key)
      const { data, error } = await sb.from("staff_shifts").insert({
        date, shift_key, label, position: label, role: ability, ability, min_rank,
        start_min: start, end_min: end, status: "open", headcount,
      }).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, shift: data });
    }

    // ── Edit an existing shift's times / name (assignments are kept) ───────────
    if (action === "editShift") {
      if (!b.shiftId) return json({ error: "no shift" }, 400);
      const t = normalizeShiftTimes(b.start_min, b.end_min);
      if ("error" in t) return json({ error: t.error }, 400);
      const patch: Record<string, unknown> = { start_min: t.start, end_min: t.end };
      if ("label" in b) { const lbl = cleanShiftLabel(b.label, t.start, t.end); patch.label = lbl; patch.position = lbl; }
      const { data, error } = await sb.from("staff_shifts").update(patch).eq("id", b.shiftId).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, shift: data });
    }

    // ── Save a whole day's roster from the drag grid (full replace) ───────────
    //    Each block = one person's shift (headcount 1, that person assigned). The
    //    replace_day_roster() DB function does the delete + re-insert in ONE
    //    transaction, so a failed insert can't leave the day empty. Times are
    //    absolute minutes-from-the-date's-midnight (next-day > 1440), NOT wrapped.
    if (action === "saveDayRoster") {
      const date = String(b.date || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "Pick a valid date." }, 400);
      // Past dates ARE allowed — the founder edits historical rosters and saves them.
      // This replaces the rostered plan only; the actual clock-in/out records are untouched.
      const blocks = Array.isArray(b.blocks) ? b.blocks : [];
      // Clearing a whole day to nobody is destructive (hard delete, no undo). Only do
      // it when the caller explicitly asks (allowClear) — guards against an accidental
      // empty save (e.g. a mis-generated AI concept) wiping a populated day.
      if (blocks.length === 0 && b.allowClear !== true) return json({ error: "That would clear the whole day. If you mean to empty it, do it from the Rota grid's Clear day." }, 400);
      const payload: any[] = [];
      for (const bl of blocks) {
        const staffId = String((bl || {}).staffId || "");
        const start = Math.round(Number((bl || {}).start_min));
        const end = Math.round(Number((bl || {}).end_min));
        if (!staffId) return json({ error: "Every shift needs a team member." }, 400);
        if (!Number.isFinite(start) || !Number.isFinite(end)) return json({ error: "A shift has bad times." }, 400);
        const dur = end - start;
        if (dur < 30) return json({ error: "A shift must be at least 30 minutes." }, 400);
        if (dur > 18 * 60) return json({ error: "A shift can't be over 18 hours." }, 400);
        if (start < 0 || end > 1680) return json({ error: "Shift times are out of range." }, 400);   // ≤ 04:00 next day
        payload.push({ staff_id: staffId, start_min: start, end_min: end, label: "Shift" });
      }
      const { error } = await sb.rpc("replace_day_roster", { p_date: date, p_blocks: payload });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, count: payload.length });
    }

    // ── Delete a released shift (cascades its claims) ──────────────────────────
    if (action === "closeShift") {
      if (!b.shiftId) return json({ error: "no shift" }, 400);
      const { error } = await sb.from("staff_shifts").delete().eq("id", b.shiftId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ── Set how many bar staff a shift needs ───────────────────────────────────
    if (action === "setHeadcount") {
      if (!b.shiftId) return json({ error: "no shift" }, 400);
      const hc = clampHead(b.headcount, 1);
      const { error } = await sb.from("staff_shifts").update({ headcount: hc }).eq("id", b.shiftId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, headcount: hc });
    }

    // ── Set a shift's requirement: which ability + minimum role to take it ─────
    if (action === "setShiftReq") {
      if (!b.shiftId) return json({ error: "no shift" }, 400);
      const patch: Record<string, unknown> = {};
      if ("ability" in b) patch.ability = ABILITY_KEYS.includes(String(b.ability)) ? b.ability : "bar";
      if ("min_rank" in b) patch.min_rank = Math.max(1, Math.min(4, parseInt(String(b.min_rank)) || 1));
      if (!Object.keys(patch).length) return json({ error: "nothing to set" }, 400);
      const { error } = await sb.from("staff_shifts").update(patch).eq("id", b.shiftId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ── Founder assigns a staff member to a shift ─────────────────────────────
    // Capacity is enforced atomically by the enforce_shift_headcount DB trigger
    // (race-safe), so we just validate the person and translate the errors.
    if (action === "assignShift") {
      if (!b.shiftId || !b.staffId) return json({ error: "missing shift or staff" }, 400);
      const { data: sm } = await sb.from("staff").select("id,active").eq("id", b.staffId).maybeSingle();
      if (!sm) return json({ error: "That team member no longer exists — reload the rota." }, 404);
      if (sm.active === false) return json({ error: "That team member is inactive." }, 400);
      const { error } = await sb.from("staff_shift_claims").insert({ shift_id: b.shiftId, staff_id: b.staffId, status: "claimed", source: "admin" });
      if (error) {
        const m = (error.message || "").toLowerCase();
        if (m.includes("shift_full")) return json({ error: "This shift is full — raise the headcount first." }, 409);
        if (m.includes("duplicate")) return json({ error: "They're already on this shift." }, 409);
        return json({ error: "Couldn't assign — reload the rota and try again." }, 400);   // don't leak raw DB text
      }
      return json({ ok: true });
    }

    // ── Founder removes a staff member from a shift ────────────────────────────
    if (action === "unassignShift") {
      if (!b.shiftId || !b.staffId) return json({ error: "missing shift or staff" }, 400);
      const { error } = await sb.from("staff_shift_claims").delete().eq("shift_id", b.shiftId).eq("staff_id", b.staffId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
