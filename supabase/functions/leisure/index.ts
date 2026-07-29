// Supabase Edge Function: leisure  (Leisure Watch — London Fields Lido)
// Deploy with --no-verify-jwt.
//
// Watches the Better (GLL) public booking API for London Fields Lido ADULT swim
// sessions ("Swim For Fitness" = lanes, "Swim For All" = general) and emails the
// founder the moment a slot opens — either a cancellation (was full, now has a
// space) or a fresh weekly release (a session that wasn't on the board before).
//
// Reading availability needs NO login — it's the same public JSON the booking
// website fetches. Booking still happens by hand in the GLL system (payment).
//
// Actions (POST JSON):
//   {action:'live'}                      → live board for the page: open adult
//                                          slots now + watcher on/off + history.
//                                          Public data, no secret.
//   {action:'setEnabled', enabled, secret}→ turn the watcher on/off. Needs secret.
//   {action:'poll', secret}              → the cron heartbeat: scan, diff vs last
//                                          run, email on new openings. Needs secret.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Config ──────────────────────────────────────────────────────────────────
const VENUE = "london-fields-lido";
const VENUE_NAME = "London Fields Lido";
const ACTIVITY = "lido";
const DAYS_AHEAD = 14;                       // Better shows ~14 days for the Lido
const ALERT_TO = "elliot@nodice.bar";
const DETAIL_CAP = 40;                        // cap the long list in a release flood
const BOOK_LINK = (date: string) =>
  `https://bookings.better.org.uk/location/${VENUE}/${ACTIVITY}/${date}/by-time`;
const TIMES_URL = (date: string) =>
  `https://better-admin.org.uk/api/activities/venue/${VENUE}/activity/${ACTIVITY}/v2/times?date=${date}`;
const DATES_URL =
  `https://better-admin.org.uk/api/activities/venue/${VENUE}/activity-category/${ACTIVITY}/dates`;

// Adult sessions only — "Swim For Fitness" (lanes) + "Swim For All" (general).
// Excludes "Swim for Families".
const isAdult = (name: string) => /swim\s+for\s+(fitness|all)\b/i.test(name || "");

// Gentle + human: look like a normal browser hitting the same public endpoint.
const BROWSER_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-GB,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Referer": `https://bookings.better.org.uk/location/${VENUE}/${ACTIVITY}`,
  "Origin": "https://bookings.better.org.uk",
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

// ─── Better API helpers ──────────────────────────────────────────────────────
type Slot = {
  slot_key: string; name: string; date: string;
  starts_at: string; ends_at: string; duration: string; spaces: number;
};

// The bookable dates the Better board is currently showing (today-ish → ~14d).
// Falls back to a generated London-time window if the endpoint hiccups.
async function fetchDates(): Promise<string[]> {
  try {
    const r = await fetch(DATES_URL, { headers: BROWSER_HEADERS });
    if (r.ok) {
      const j = await r.json();
      const arr = Array.isArray(j?.data) ? j.data : [];
      const raws = arr.map((d: any) => d?.raw).filter(Boolean);
      if (raws.length) return raws.slice(0, DAYS_AHEAD);
    }
  } catch { /* fall through */ }
  // Fallback: today (Europe/London) + next DAYS_AHEAD-1 days.
  const todayLon = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/London" }),
  );
  const out: string[] = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(todayLon);
    d.setDate(d.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// All ADULT sessions for one date, normalised.
async function fetchDay(date: string): Promise<Slot[]> {
  const r = await fetch(TIMES_URL(date), { headers: BROWSER_HEADERS });
  if (!r.ok) throw new Error(`times ${date} → ${r.status}`);
  const j = await r.json();
  const arr: any[] = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : []);
  return arr
    .filter((s) => isAdult(s?.name))
    .map((s) => {
      const start = s?.starts_at?.format_24_hour || "";
      return {
        slot_key: `${date}|${s?.name}|${start}`,
        name: s?.name || "",
        date,
        starts_at: start,
        ends_at: s?.ends_at?.format_24_hour || "",
        duration: s?.duration || "",
        spaces: Number(s?.spaces_remaining) || 0,
      } as Slot;
    });
}

// Scan the whole window. Days are fetched with a little spacing so we stay gentle.
async function scanWindow(): Promise<Slot[]> {
  const dates = await fetchDates();
  const all: Slot[] = [];
  for (const d of dates) {
    try {
      const day = await fetchDay(d);
      all.push(...day);
    } catch { /* skip a bad day, keep going */ }
    await new Promise((res) => setTimeout(res, 120));   // ~human spacing between days
  }
  return all;
}

const prettyDate = (date: string) =>
  new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });

// ─── Email ───────────────────────────────────────────────────────────────────
async function emailOpenings(openings: (Slot & { kind: string })[]) {
  const RESEND = Deno.env.get("RESEND_API_KEY");
  if (!RESEND) return false;

  // Group by date for a readable email; cancellations first (more time-sensitive).
  openings.sort((a, b) =>
    (a.kind === b.kind ? 0 : a.kind === "cancellation" ? -1 : 1) ||
    a.date.localeCompare(b.date) || a.starts_at.localeCompare(b.starts_at));

  const shown = openings.slice(0, DETAIL_CAP);
  const extra = openings.length - shown.length;
  const nCanc = openings.filter((o) => o.kind === "cancellation").length;
  const nRel = openings.length - nCanc;

  const rows = shown.map((o) => {
    const tag = o.kind === "cancellation"
      ? `<span style="background:#0E7C66;color:#fff;font-size:10px;letter-spacing:.08em;padding:2px 7px;border-radius:20px;text-transform:uppercase">Cancellation</span>`
      : `<span style="background:#B8892B;color:#fff;font-size:10px;letter-spacing:.08em;padding:2px 7px;border-radius:20px;text-transform:uppercase">New release</span>`;
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #222;color:#fff;font-size:14px;white-space:nowrap">${prettyDate(o.date)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #222;color:#fff;font-size:14px;white-space:nowrap"><strong>${o.starts_at}</strong>–${o.ends_at}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #222;color:#ddd;font-size:13px">${o.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #222;color:#ddd;font-size:13px">${o.spaces} left</td>
      <td style="padding:10px 12px;border-bottom:1px solid #222">${tag}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #222"><a href="${BOOK_LINK(o.date)}" style="background:#B8892B;color:#fff;text-decoration:none;padding:7px 14px;border-radius:7px;font-weight:700;font-size:13px;display:inline-block">Book →</a></td>
    </tr>`;
  }).join("");

  const summary = [
    nCanc ? `${nCanc} cancellation${nCanc > 1 ? "s" : ""}` : "",
    nRel ? `${nRel} new release${nRel > 1 ? "s" : ""}` : "",
  ].filter(Boolean).join(" · ");

  const html = `<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#0A0A0F;color:#fff;padding:28px;border-radius:12px;max-width:640px;margin:auto">
    <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#B8892B;margin:0 0 12px">No Dice · Leisure Watch</p>
    <h1 style="font-size:22px;margin:0 0 4px">🏊 ${openings.length} London Fields Lido slot${openings.length > 1 ? "s" : ""} just opened</h1>
    <p style="font-size:13px;color:#9CA3AF;margin:0 0 18px">${summary} · adult lanes &amp; general swim</p>
    <table style="width:100%;border-collapse:collapse;background:#111;border-radius:10px;overflow:hidden">${rows}</table>
    ${extra > 0 ? `<p style="font-size:13px;color:#9CA3AF;margin:14px 0 0">…and ${extra} more — open the board to see them all.</p>` : ""}
    <p style="font-size:12px;color:#666;margin:20px 0 0">Booking &amp; payment happen in the Better/GLL system — the Book button drops you on the right day. Slots go fast; grab it quick.</p>
    <p style="margin:16px 0 0"><a href="https://team.nodice.bar/leisure" style="color:#B8892B;font-size:12px">Open Leisure Watch →</a></p>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "No Dice <elliot@nodice.bar>",
      to: ALERT_TO,
      subject: `🏊 ${openings.length} Lido slot${openings.length > 1 ? "s" : ""} open${nCanc ? " (incl. cancellation)" : ""} — ${prettyDate(shown[0].date)}${shown[0].starts_at ? " " + shown[0].starts_at : ""}`,
      html,
    }),
  });
  return res.ok;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const SECRET = Deno.env.get("SEND_SECRET");
  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  try {
    // ── Live board for the gated page (public data, no secret) ──────────────
    if (action === "live") {
      const [slots, cfg, alertsRes] = await Promise.all([
        scanWindow(),
        sb.from("leisure_config").select("enabled").eq("id", 1).maybeSingle(),
        sb.from("leisure_alerts").select("kind, name, date, starts_at, spaces_remaining, created_at")
          .order("created_at", { ascending: false }).limit(25),
      ]);
      const open = slots.filter((s) => s.spaces > 0)
        .sort((a, b) => a.date.localeCompare(b.date) || a.starts_at.localeCompare(b.starts_at));
      return json({
        ok: true,
        enabled: cfg?.data?.enabled ?? true,
        openSlots: open.map((s) => ({ ...s, bookUrl: BOOK_LINK(s.date) })),
        checked: slots.length,
        alerts: alertsRes?.data || [],
        checkedAt: new Date().toISOString(),
      });
    }

    // Everything below is secret-gated (page toggle + cron heartbeat).
    if (!SECRET || body?.secret !== SECRET) return json({ error: "unauthorized" }, 401);

    // ── Turn the watcher on/off ─────────────────────────────────────────────
    if (action === "setEnabled") {
      const enabled = !!body.enabled;
      await sb.from("leisure_config")
        .upsert({ id: 1, enabled, updated_at: new Date().toISOString() });
      return json({ ok: true, enabled });
    }

    // ── Cron heartbeat: scan → diff → email on new openings ─────────────────
    if (action === "poll") {
      const { data: cfg } = await sb.from("leisure_config").select("enabled").eq("id", 1).maybeSingle();
      const enabled = cfg?.enabled ?? true;

      const current = await scanWindow();

      // Previous snapshot keyed by slot_key. Page through ALL rows — PostgREST
      // caps a plain select at 1000, and the window holds ~1700+ sessions, so a
      // single select would drop the tail and re-flag those slots as "new" every
      // run (a re-alert storm). Pagination is load-bearing here, not a nicety.
      const prev = new Map<string, number>();
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        const { data: rows, error } = await sb.from("leisure_slots")
          .select("slot_key, spaces_remaining").range(from, from + PAGE - 1);
        if (error) throw error;
        for (const r of rows || []) prev.set(r.slot_key as string, Number(r.spaces_remaining) || 0);
        if (!rows || rows.length < PAGE) break;
      }
      const seeded = prev.size > 0;   // first-ever run: seed only, don't blast alerts

      const openings: (Slot & { kind: string })[] = [];
      if (seeded) {
        for (const cur of current) {
          if (cur.spaces <= 0) continue;
          if (!prev.has(cur.slot_key)) openings.push({ ...cur, kind: "release" });        // brand-new bookable session
          else if (prev.get(cur.slot_key) === 0) openings.push({ ...cur, kind: "cancellation" }); // was full → now free
          // already-open (>0 last time) → not a new event, skip
        }
      }

      // Persist the new snapshot (full replace of the current window).
      const nowISO = new Date().toISOString();
      const upsertRows = current.map((s) => ({
        slot_key: s.slot_key, venue: VENUE, activity: ACTIVITY, name: s.name,
        date: s.date, starts_at: s.starts_at, ends_at: s.ends_at,
        spaces_remaining: s.spaces, updated_at: nowISO,
      }));
      // Chunk upserts to stay well under payload limits.
      for (let i = 0; i < upsertRows.length; i += 200) {
        await sb.from("leisure_slots").upsert(upsertRows.slice(i, i + 200), { onConflict: "slot_key" });
      }
      // Tidy: drop rows for dates that have rolled out of the window (past days).
      const oldestKept = current.reduce((m, s) => (s.date < m ? s.date : m), current[0]?.date || "9999-12-31");
      if (oldestKept !== "9999-12-31") await sb.from("leisure_slots").delete().lt("date", oldestKept);

      let emailed = false;
      if (openings.length && enabled) {
        emailed = await emailOpenings(openings);
        await sb.from("leisure_alerts").insert(openings.map((o) => ({
          kind: o.kind, name: o.name, date: o.date,
          starts_at: o.starts_at, spaces_remaining: o.spaces, emailed,
        })));
      }

      return json({ ok: true, seeded, checked: current.length, openings: openings.length, emailed, enabled });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
