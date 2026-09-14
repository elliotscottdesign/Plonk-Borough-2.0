// Food self-order + kitchen tickets — On A Roll food truck.
// - createOrder: the customer's order page posts here after paying (Stripe).
// - listOrders / setStatus: the kitchen display (/ops → Kitchen → 🎫 Orders),
//   founder/SEND_SECRET-gated. Marking an order READY fires the "food ready"
//   SMS via Twilio (reuses the same account/secrets as the tournament call-ups).
// Deploy: supabase functions deploy food-order --no-verify-jwt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SEND_SECRET = Deno.env.get("SEND_SECRET");

// Twilio — same secrets the tournament function already uses.
const TW_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TW_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TW_SMS_FROM = Deno.env.get("TWILIO_SMS_FROM") || "NoDice";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const clean = (v: unknown, n = 200) => (v == null ? "" : String(v)).slice(0, n).trim();

// UK/international mobile → E.164 for Twilio. Leaves an already-+ number (e.g.
// Ukraine +380…) alone; turns a bare UK 07… into +44…. Twilio rejects numbers
// without a country code ("not a valid phone number"), so every send goes
// through this first.
function normalisePhone(raw: string): string {
  const s = String(raw || "").replace(/[^\d+]/g, "");
  if (s.startsWith("+")) return s;
  if (s.startsWith("07") && s.length === 11) return "+44" + s.slice(1);
  if (s.startsWith("447")) return "+" + s;
  if (s.startsWith("44")) return "+" + s;
  return s;
}

// The pre-programmed "food ready" message (founder brief Aug 2026).
const readyMessage = (orderNo: number, name?: string | null) =>
  `On A Roll 🍔🍟 Order #${orderNo} is READY — come collect it from the van!${name ? ` Thanks ${name}.` : ""}`;

async function sendSMS(to: string, body: string): Promise<boolean> {
  const To = normalisePhone(to);   // rescue any raw 07… stored before we normalised at intake
  if (!TW_SID || !TW_TOKEN || !To) return false;
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TW_SID}/Messages.json`, {
      method: "POST",
      headers: { "Authorization": "Basic " + btoa(`${TW_SID}:${TW_TOKEN}`), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: TW_SMS_FROM, To, Body: body }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// Email fallback (Resend) — for customers who leave an email instead of a phone.
const RESEND = Deno.env.get("RESEND_API_KEY");
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND || !to) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "On A Roll <elliot@nodice.bar>", to, subject, html }),
    });
    return r.ok;
  } catch { return false; }
}
const emailShell = (heading: string, body: string) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:22px;color:#15305c"><div style="font-family:Impact,sans-serif;font-size:34px;color:#e0231b;letter-spacing:.5px">On A Roll</div><h2 style="margin:10px 0 12px">${heading}</h2><div style="font-size:15px;line-height:1.6">${body}</div><p style="color:#999;font-size:12px;margin-top:22px">No Dice · London Fields</p></div>`;
// Notify the customer by whichever channel they left: phone → SMS, else email.
async function notifyCustomer(o: any, smsText: string, emailSubject: string, emailHtml: string): Promise<boolean> {
  if (o.customer_phone) return await sendSMS(o.customer_phone, smsText);
  if (o.customer_email) return await sendEmail(o.customer_email, emailSubject, emailHtml);
  return false;
}
const readyEmail = (o: any) => emailShell(`Order #${o.order_no} is ready! 🍔🍟`, `Come and collect it from the van${o.customer_name ? `, ${o.customer_name}` : ""} — see you in a sec!`);
const receivedEmail = (o: any) => emailShell(`Order #${o.order_no} received ✓`, `We're on it! We'll email you the moment it's ready to collect from the van.`);

// Order page the waitlist "you can order again" text points at (update to the live URL).
const ORDER_URL = "https://nodice.bar/onaroll";

async function activeCount(sb: any): Promise<number> {
  const { count } = await sb.from("food_orders").select("id", { count: "exact", head: true }).in("status", ["new", "preparing", "ready"]);
  return count || 0;
}
// Current wall-clock minutes-since-midnight in London (handles BST/GMT automatically).
function londonMinutes(): number {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const h = Number(p.find((x) => x.type === "hour")?.value ?? "0");
  const m = Number(p.find((x) => x.type === "minute")?.value ?? "0");
  return (h % 24) * 60 + m;
}
function hhmmToMin(s?: string | null): number | null {
  const mt = /^(\d{1,2}):(\d{2})$/.exec(String(s || "").trim());
  return mt ? Number(mt[1]) * 60 + Number(mt[2]) : null;
}

// ── Service report (used by the Report view AND the daily/weekly emails) ─────────
const LON = { timeZone: "Europe/London" } as const;
const ymdFmt = new Intl.DateTimeFormat("en-CA", { ...LON, year: "numeric", month: "2-digit", day: "2-digit" });
const londonYmd = (d = new Date()) => ymdFmt.format(d);   // 'YYYY-MM-DD' in London
// UTC instant of London-local midnight for a YYYY-MM-DD (BST/GMT-safe).
function londonMidnightUtcMs(ymd: string): number {
  const [y, mo, da] = ymd.split("-").map(Number);
  const naive = Date.UTC(y, mo - 1, da, 0, 0, 0);
  const offAt = (ms: number) => {
    const p = new Intl.DateTimeFormat("en-GB", { ...LON, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(new Date(ms));
    const g = (t: string) => Number(p.find((x) => x.type === t)?.value || "0");
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - ms;
  };
  return naive - offAt(naive - offAt(naive));
}
const addDaysYmd = (ymd: string, n: number) => londonYmd(new Date(londonMidnightUtcMs(ymd) + n * 86400000));
const gbp = (p: number) => "£" + (p / 100).toFixed(2);

// Aggregate every real order in [fromYmd, toYmd] (inclusive, London days).
async function buildReport(sb: any, fromYmd: string, toYmd: string) {
  const startMs = londonMidnightUtcMs(fromYmd);
  const endMs = londonMidnightUtcMs(addDaysYmd(toYmd, 1));
  const { data } = await sb.from("food_orders").select("*")
    .gte("created_at", new Date(startMs).toISOString()).lt("created_at", new Date(endMs).toISOString());
  const rows = data || [];
  const card = rows.filter((o: any) => o.paid && !o.order_code);           // real Stripe sales
  const tabs = rows.filter((o: any) => o.order_code);                       // party/staff tabs (no card)
  const abandoned = rows.filter((o: any) => o.status === "pending" && !o.paid);   // started, never paid
  const failed = rows.filter((o: any) => o.status === "card_failed");       // card declined
  const real = [...card, ...tabs];
  const revenue = card.reduce((s: number, o: any) => s + (o.total_pence || 0), 0);   // incl tips
  const tips = card.reduce((s: number, o: any) => s + (o.tip_pence || 0), 0);
  const tabTotal = tabs.reduce((s: number, o: any) => s + (o.total_pence || 0), 0);
  // avg cook time (created → ready) over real orders that were marked ready
  const cooked = real.filter((o: any) => o.ready_at && o.created_at);
  const avgCookSec = cooked.length ? Math.round(cooked.reduce((s: number, o: any) => s + (new Date(o.ready_at).getTime() - new Date(o.created_at).getTime()), 0) / cooked.length / 1000) : null;
  // item breakdown (qty + gross incl. add-ons) across real orders
  const items: Record<string, { qty: number; pence: number }> = {};
  for (const o of real) for (const li of (Array.isArray(o.items) ? o.items : [])) {
    const nm = String(li.name || "item").trim(); const qty = parseInt(li.qty, 10) || 1;
    const unit = (parseInt(li.price_pence, 10) || 0) + (Array.isArray(li.options) ? li.options.reduce((s: number, x: any) => s + (parseInt(x.price_pence, 10) || 0), 0) : 0);
    (items[nm] ||= { qty: 0, pence: 0 }); items[nm].qty += qty; items[nm].pence += unit * qty;
  }
  const itemList = Object.entries(items).map(([name, v]) => ({ name, qty: v.qty, pence: v.pence })).sort((a, b) => b.qty - a.qty);
  // orders by London day (for multi-day ranges)
  const byDay: Record<string, { orders: number; pence: number }> = {};
  for (const o of card) { const d = londonYmd(new Date(o.created_at)); (byDay[d] ||= { orders: 0, pence: 0 }); byDay[d].orders++; byDay[d].pence += o.total_pence || 0; }
  const days = Object.entries(byDay).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date < b.date ? -1 : 1);
  return {
    from: fromYmd, to: toYmd,
    orders: card.length, revenue_pence: revenue, tips_pence: tips,
    avg_order_pence: card.length ? Math.round(revenue / card.length) : 0,
    avg_cook_sec: avgCookSec,
    tab_orders: tabs.length, tab_total_pence: tabTotal,
    abandoned: abandoned.length, card_failed: failed.length,
    items: itemList, days,
  };
}

// London weekday (Mon=0…Sun=6) + hour(0-23) for an instant.
function londonHourDow(d: Date): [number, number] {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", hour: "2-digit", hour12: false }).formatToParts(d);
  const wd = p.find((x) => x.type === "weekday")?.value || "Mon";
  const hr = Number(p.find((x) => x.type === "hour")?.value || "0") % 24;
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return [map[wd] ?? 0, hr];
}
const lineRev = (li: any) => ((parseInt(li.price_pence, 10) || 0) + (Array.isArray(li.options) ? li.options.reduce((s: number, o: any) => s + (parseInt(o.price_pence, 10) || 0), 0) : 0)) * (parseInt(li.qty, 10) || 1);

// The "orange" kitchen crew: staff by ROLE, not by shift. Every shift is rostered
// "bar", but Kitchen / Barback people (and anyone kitchen-abled who isn't a
// manager) are the kitchen team — the founder's orange labels. Their rostered/
// clocked hours are what we count as kitchen labour + the heatmap overlay.
async function kitchenStaffIds(sb: any): Promise<string[]> {
  const { data } = await sb.from("staff").select("id, role, abilities");
  return (data || []).filter((s: any) =>
    s.role === "Kitchen / Barback" ||
    (Array.isArray(s.abilities) && s.abilities.includes("kitchen") && s.role !== "Manager" && s.role !== "Asst. Manager")
  ).map((s: any) => s.id);
}
// Shifts in [f,t] that a kitchen-team member actually claimed (any shift label).
async function kitchenClaimedShifts(sb: any, f: string, t: string, kIds: string[]) {
  if (!kIds.length) return { shifts: [], claims: [] };
  const { data: all } = await sb.from("staff_shifts").select("id, date, start_min, end_min").gte("date", f).lte("date", t);
  const ids = (all || []).map((s: any) => s.id);
  const { data: claims } = ids.length ? await sb.from("staff_shift_claims").select("shift_id, staff_id, status").in("shift_id", ids).in("staff_id", kIds) : { data: [] };
  const claimed = new Set((claims || []).map((c: any) => c.shift_id));
  return { shifts: (all || []).filter((s: any) => claimed.has(s.id)), claims: claims || [] };
}

// Food 360 — the rich report. Speed + peaks always; money block only when asked
// (the client asks after the 888999 gate). Money uses per-item cost SNAPSHOTS
// stamped at order time (Phase 1); pre-snapshot lines fall back to the current
// menu cost, flagged "estimated".
async function buildReport360(sb: any, fromYmd: string, toYmd: string, withMoney: boolean) {
  const startMs = londonMidnightUtcMs(fromYmd), endMs = londonMidnightUtcMs(addDaysYmd(toYmd, 1));
  const { data } = await sb.from("food_orders").select("*").gte("created_at", new Date(startMs).toISOString()).lt("created_at", new Date(endMs).toISOString());
  const rows = data || [];
  // Split coded orders into STAFF MEALS (kind 'staff' — a perk, cost only, never a
  // sale) vs PARTY tabs (kind party/comp — real sales settled at the bar).
  const { data: codeRows } = await sb.from("order_codes").select("code, kind");
  const kindByCode: Record<string, string> = {};
  for (const c of (codeRows || [])) kindByCode[String(c.code)] = String(c.kind || "");
  const card = rows.filter((o: any) => o.paid && !o.order_code);
  const coded = rows.filter((o: any) => o.order_code);
  const staffMeals = coded.filter((o: any) => kindByCode[o.order_code] === "staff");
  const partyTabs = coded.filter((o: any) => kindByCode[o.order_code] !== "staff");
  const tabs = partyTabs;                        // "tabs" now means party/comp only
  const sales = [...card, ...partyTabs];         // everything that's a real sale
  const real = [...card, ...coded];              // everything the KITCHEN cooked (for speed/heatmap)
  const itemsOf = (o: any) => Array.isArray(o.items) ? o.items : [];
  const cogsOf = (list: any[], costByName: Record<string, number>) => {
    let c = 0, est = 0; const pi: Record<string, { qty: number; rev: number; cost: number; est: boolean }> = {};
    for (const o of list) for (const li of itemsOf(o)) {
      const nm = String(li.name || "item").trim(), qty = parseInt(li.qty, 10) || 1;
      let unit = li.cost_pence, isEst = false;
      if (unit == null) { unit = costByName[nm] ?? 0; isEst = true; est++; } else unit = parseInt(unit, 10) || 0;
      const optCost = Array.isArray(li.options) ? li.options.reduce((s: number, x: any) => s + (x.cost_pence != null ? (parseInt(x.cost_pence, 10) || 0) : 0), 0) : 0;
      const cost = (unit + optCost) * qty; c += cost;
      (pi[nm] ||= { qty: 0, rev: 0, cost: 0, est: false }); pi[nm].qty += qty; pi[nm].rev += lineRev(li); pi[nm].cost += cost; if (isEst) pi[nm].est = true;
    }
    return { cogs: c, est, pi };
  };

  // ── Speed ──
  const secsBetween = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 1000;
  const cookRows = real.filter((o: any) => o.ready_at && o.created_at);
  const cookSecs = cookRows.map((o: any) => secsBetween(o.created_at, o.ready_at)).filter((s: number) => s >= 0).sort((a: number, b: number) => a - b);
  const pctl = (arr: number[], p: number) => arr.length ? arr[Math.min(arr.length - 1, Math.floor((arr.length - 1) * p))] : null;
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : null;
  const prep = real.filter((o: any) => o.preparing_at && o.created_at && o.ready_at);
  const queueSecs = prep.map((o: any) => secsBetween(o.created_at, o.preparing_at)).filter((s: number) => s >= 0);
  const cookOnlySecs = prep.map((o: any) => secsBetween(o.preparing_at, o.ready_at)).filter((s: number) => s >= 0);
  // per-item cook time (order cook time attributed to each item in it — approximate)
  const ic: Record<string, { sum: number; n: number }> = {};
  for (const o of cookRows) { const sec = secsBetween(o.created_at, o.ready_at); for (const li of itemsOf(o)) { const nm = String(li.name || "item").trim(); (ic[nm] ||= { sum: 0, n: 0 }); ic[nm].sum += sec; ic[nm].n++; } }
  const perItemCook = Object.entries(ic).map(([name, v]) => ({ name, avg_sec: Math.round(v.sum / v.n), n: v.n })).sort((a, b) => b.avg_sec - a.avg_sec);

  // ── Peaks: orders by hour + day-of-week × hour heatmap (real orders) ──
  const byHour = Array(24).fill(0);
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const o of real) { const [dow, hr] = londonHourDow(new Date(o.created_at)); byHour[hr]++; heat[dow][hr]++; }
  // Rostered KITCHEN coverage for the overlay — shifts worked by the kitchen team
  // (Kitchen / Barback role, the founder's "orange" staff), TIMES only (no pay), so
  // it stays operational-tier. Every shift is labelled "bar", so we go by the person.
  const dowOfYmd = (ymd: string) => { const [y, mo, da] = ymd.split("-").map(Number); return (new Date(Date.UTC(y, mo - 1, da)).getUTCDay() + 6) % 7; };
  const { shifts: kshifts } = await kitchenClaimedShifts(sb, fromYmd, toYmd, await kitchenStaffIds(sb));
  const rostered = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const s of kshifts) {
    const dow = dowOfYmd(s.date);
    const h0 = Math.max(0, Math.floor((s.start_min ?? 0) / 60)), h1 = Math.min(23, Math.ceil((s.end_min ?? 0) / 60) - 1);
    for (let h = h0; h <= h1; h++) rostered[dow][h]++;
  }

  const revenue = card.reduce((s: number, o: any) => s + (o.total_pence || 0), 0);
  const tips = card.reduce((s: number, o: any) => s + (o.tip_pence || 0), 0);
  const base: any = {
    from: fromYmd, to: toYmd,
    orders: card.length, revenue_pence: revenue, tips_pence: tips,
    avg_order_pence: card.length ? Math.round(revenue / card.length) : 0,
    tab_orders: partyTabs.length, tab_total_pence: partyTabs.reduce((s: number, o: any) => s + (o.total_pence || 0), 0),
    staff_meals: staffMeals.length,
    abandoned: rows.filter((o: any) => o.status === "pending" && !o.paid).length,
    card_failed: rows.filter((o: any) => o.status === "card_failed").length,
    speed: {
      served: cookRows.length,
      cook_median_sec: pctl(cookSecs, 0.5), cook_p90_sec: pctl(cookSecs, 0.9),
      queue_avg_sec: avg(queueSecs), cook_avg_sec: avg(cookOnlySecs), split_n: prep.length,
      per_item: perItemCook,
    },
    peaks: { by_hour: byHour, heat, rostered },
  };
  if (!withMoney) return base;

  // ── Money ──
  const { data: menu } = await sb.from("menu_catalog").select("sections, vat_registered").eq("id", 1).maybeSingle();
  const vat = !!menu?.vat_registered;
  const costByName: Record<string, number> = {};
  for (const sec of (menu?.sections || [])) for (const it of (sec.items || [])) costByName[String(it.name || "").trim()] = parseInt(it.cost_pence, 10) || 0;
  const salesC = cogsOf(sales, costByName);              // COGS + per-item over SALES only (card + party tabs)
  const staffC = cogsOf(staffMeals, costByName);         // staff meals valued at COST (a perk, not a sale)
  const partyRevenue = partyTabs.reduce((s: number, o: any) => s + (o.total_pence || 0), 0);
  const foodRevenue = (revenue - tips) + partyRevenue;   // card food (ex-tips) + party-tab sales
  const revExVat = vat ? Math.round(foodRevenue / 1.2) : foodRevenue;
  const gm = revExVat - salesC.cogs;
  const perItem = Object.entries(salesC.pi).map(([name, v]) => ({ name, qty: v.qty, revenue_pence: v.rev, cost_pence: v.cost, gp_pct: v.rev ? Math.round((v.rev - v.cost) / v.rev * 1000) / 10 : 0, estimated: v.est })).sort((a, b) => b.revenue_pence - a.revenue_pence);
  base.money = {
    vat_registered: vat,
    revenue_incl_vat_pence: foodRevenue, revenue_ex_vat_pence: revExVat,
    cogs_pence: salesC.cogs, gross_margin_pence: gm, gross_margin_pct: revExVat ? Math.round(gm / revExVat * 1000) / 10 : 0,
    estimated_lines: salesC.est + staffC.est, items: perItem,
    staff_meals_count: staffMeals.length, staff_meals_cost_pence: staffC.cogs,
  };
  return base;
}

function reportEmailHtml(r: any, title: string, money?: any): string {
  const mmss = (s: number | null) => s == null ? "—" : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  const rowsHtml = r.items.map((it: any) => `<tr><td style="padding:4px 10px 4px 0">${it.qty}×</td><td style="padding:4px 10px 4px 0">${it.name}</td><td style="padding:4px 0;text-align:right">${gbp(it.pence)}</td></tr>`).join("");
  const daysHtml = r.days.length > 1 ? `<h3 style="margin:18px 0 6px;font-size:14px">By day</h3><table style="font-size:13px;border-collapse:collapse">${r.days.map((d: any) => `<tr><td style="padding:3px 12px 3px 0">${d.date}</td><td style="padding:3px 0;text-align:right">${d.orders} orders · ${gbp(d.pence)}</td></tr>`).join("")}</table>` : "";
  // Money block — emails go to the founder only, so full margin detail is fine here.
  const moneyHtml = money ? `<h3 style="margin:18px 0 6px;font-size:14px">💷 Margin</h3>
    <table style="width:100%;border-collapse:collapse;font-size:15px">
      <tr><td style="padding:5px 0">Revenue ${money.vat_registered ? "(ex-VAT)" : ""} · food only</td><td style="text-align:right;font-weight:700">${gbp(money.revenue_ex_vat_pence)}</td></tr>
      <tr><td style="padding:5px 0">Food cost (COGS)</td><td style="text-align:right">${gbp(money.cogs_pence)}</td></tr>
      <tr><td style="padding:5px 0">Gross margin</td><td style="text-align:right;font-weight:800;color:#1f8a4d">${gbp(money.gross_margin_pence)} (${money.gross_margin_pct}%)</td></tr>
    </table>${money.estimated_lines ? `<div style="color:#b8860b;font-size:11px;margin-top:4px">${money.estimated_lines} older line(s) use today's menu cost (estimated).</div>` : ""}` : "";
  return `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:520px;color:#111">
    <h2 style="margin:0 0 2px;color:#e0231b">On A Roll — ${title}</h2>
    <div style="color:#666;font-size:13px;margin-bottom:14px">${r.from === r.to ? r.from : `${r.from} → ${r.to}`}</div>
    <table style="width:100%;border-collapse:collapse;font-size:15px;margin-bottom:8px">
      <tr><td style="padding:6px 0">💷 <b>Revenue (card)</b></td><td style="text-align:right;font-weight:800">${gbp(r.revenue_pence)}</td></tr>
      <tr><td style="padding:6px 0">🧾 Paid orders</td><td style="text-align:right">${r.orders}</td></tr>
      <tr><td style="padding:6px 0">📊 Average order</td><td style="text-align:right">${gbp(r.avg_order_pence)}</td></tr>
      <tr><td style="padding:6px 0">💛 Tips (kitchen)</td><td style="text-align:right">${gbp(r.tips_pence)}</td></tr>
      <tr><td style="padding:6px 0">⏱ Avg cook time</td><td style="text-align:right">${mmss(r.avg_cook_sec)}</td></tr>
      ${r.tab_orders ? `<tr><td style="padding:6px 0">🎟 Tabs (party/staff)</td><td style="text-align:right">${r.tab_orders} · ${gbp(r.tab_total_pence)}</td></tr>` : ""}
      <tr><td style="padding:6px 0">🛒 Abandoned checkouts</td><td style="text-align:right">${r.abandoned}</td></tr>
      <tr><td style="padding:6px 0">❌ Card failed</td><td style="text-align:right">${r.card_failed}</td></tr>
    </table>
    ${moneyHtml}
    <h3 style="margin:18px 0 6px;font-size:14px">What sold</h3>
    <table style="font-size:14px;border-collapse:collapse">${rowsHtml || '<tr><td style="color:#888">No sales.</td></tr>'}</table>
    ${daysHtml}
    <div style="color:#999;font-size:11px;margin-top:20px">On A Roll · No Dice Hackney · automated report</div>
  </div>`;
}

// Effective open/paused: closed outside service hours (default 22:00), OR paused
// manually, OR auto-paused when live orders hit the threshold. `reason` says which.
async function getEffective(sb: any) {
  const { data: s } = await sb.from("food_settings").select("*").eq("id", 1).maybeSingle();
  const paused = !!s?.paused, auto = !!s?.auto_pause, threshold = s?.auto_threshold ?? 8;
  const closeStr = s?.close_hhmm || "22:00", openStr = s?.open_hhmm || "";
  const nowMin = londonMinutes(), closeMin = hhmmToMin(closeStr), openMin = hhmmToMin(openStr);
  const outsideHours = (closeMin != null && nowMin >= closeMin) || (openMin != null && nowMin < openMin);
  const active = await activeCount(sb);
  const autoTripped = auto && threshold >= 1 && active >= threshold;   // threshold 0 = auto-pause off
  const open = !(outsideHours || paused || autoTripped);
  const reason = outsideHours ? "closed" : paused ? "paused" : autoTripped ? "busy" : null;
  return { open, paused, auto, threshold, active, autoTripped, outsideHours, reason, close_hhmm: closeStr, open_hhmm: openStr };
}
async function waitingCount(sb: any): Promise<number> {
  const { count } = await sb.from("food_waitlist").select("id", { count: "exact", head: true }).is("notified_at", null);
  return count || 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  let b: any = {};
  try { b = await req.json(); } catch { /* empty body */ }
  const action = String(b.action || "");
  const isAdmin = () => !!(b.secret && SEND_SECRET && b.secret === SEND_SECRET);

  try {
    // ── Customer places a (paid) order from the order page ──────────────────────
    if (action === "createOrder") {
      const items = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
      if (!items.length) return json({ error: "empty order" }, 400);
      const eff0 = await getEffective(sb);
      if (!eff0.open) return json({ error: "Ordering is paused right now — please try again shortly.", open: false }, 409);
      const row = {
        customer_name: clean(b.name, 80) || null,
        customer_phone: normalisePhone(clean(b.phone, 30)) || null,
        items,
        total_pence: Math.max(0, parseInt(b.total_pence, 10) || 0),
        paid: !!b.payment_ref,
        payment_ref: clean(b.payment_ref, 120) || null,
        allergen_note: clean(b.allergen_note, 500) || null,
        voucher_code: clean(b.voucher_code, 40) || null,
        status: "new",
      };
      const { data, error } = await sb.from("food_orders").insert(row).select("id,order_no").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, id: data.id, order_no: data.order_no });
    }

    // ── Kitchen display: list live orders (founder/ops) ─────────────────────────
    if (action === "listOrders") {
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const { data, error } = await sb.from("food_orders")
        .select("*").in("status", ["new", "preparing", "ready", "card_failed"]).order("created_at", { ascending: true });
      if (error) return json({ error: error.message }, 400);
      // Enrich coded orders with the code's kind/label so the kitchen can colour
      // staff/comp orders differently (deprioritise vs paying customers).
      const orderCodes = [...new Set((data || []).map((o: any) => o.order_code).filter(Boolean))];
      if (orderCodes.length) {
        const { data: cr } = await sb.from("order_codes").select("code,kind,label").in("code", orderCodes);
        const cm: Record<string, any> = Object.fromEntries((cr || []).map((c: any) => [c.code, c]));
        for (const o of (data as any[])) if (o.order_code && cm[o.order_code]) { o.code_kind = cm[o.order_code].kind; o.code_label = cm[o.order_code].label; }
      }
      return json({ ok: true, orders: data || [] });
    }

    // ── Kitchen display: advance an order; READY fires the "food ready" SMS once ─
    if (action === "setStatus") {
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const id = clean(b.id, 40);
      const status = clean(b.status, 20);
      if (!id || !["preparing", "ready", "collected", "cancelled"].includes(status))
        return json({ error: "bad request" }, 400);

      const patch: any = { status };
      // Stamp preparing_at the first time a ticket is tapped to "preparing" so the
      // report can split QUEUE time (order → started) from COOK time (started → ready).
      if (status === "preparing") patch.preparing_at = new Date().toISOString();
      if (status === "ready") { patch.ready_at = new Date().toISOString(); patch.ready_by = clean(b.by, 60) || null; }
      if (status === "collected") patch.collected_at = new Date().toISOString();

      // Only fire the text when it actually flips to ready (guard against a double-tap
      // texting twice): update to ready only if it isn't ready/collected already.
      const q = sb.from("food_orders").update(patch).eq("id", id);
      const { data, error } = (status === "ready"
        ? await q.not("status", "in", "(ready,collected)").select("*").maybeSingle()
        : await q.select("*").single());
      if (error) return json({ error: error.message }, 400);
      if (status === "ready" && !data) return json({ ok: true, order: null, texted: false, note: "already ready" });

      let texted = false;
      if (status === "ready" && (data?.customer_phone || data?.customer_email)) {
        texted = await notifyCustomer(data, readyMessage(data.order_no, data.customer_name), `Your On A Roll order #${data.order_no} is ready!`, readyEmail(data));
      }
      return json({ ok: true, order: data, texted });
    }

    // Kitchen display: full recent order history (all statuses), newest first.
    if (action === "listHistory") {
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      // Return all orders; the kitchen screen splits real orders from abandoned
      // (unpaid, status 'pending') checkouts into separate filters.
      const { data, error } = await sb.from("food_orders")
        .select("*").order("created_at", { ascending: false }).limit(200);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, orders: data || [] });
    }

    // ── Tip ledger: running total of On A Roll card tips, banked by service night ─
    // Every paid order carries tip_pence (100% to the kitchen). We group by the
    // London calendar date (the truck closes at 10pm, so a night = one date), so
    // the total accumulates night after night and never resets.
    if (action === "tipLedger") {   // kitchen
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const { data, error } = await sb.from("food_orders").select("created_at, tip_pence").eq("paid", true).gt("tip_pence", 0);
      if (error) return json({ error: error.message }, 400);
      const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" });
      const byDate: Record<string, { pence: number; orders: number }> = {};
      let total = 0;
      for (const o of (data || [])) {
        const d = fmt.format(new Date(o.created_at));
        (byDate[d] ||= { pence: 0, orders: 0 });
        byDate[d].pence += o.tip_pence || 0; byDate[d].orders += 1; total += o.tip_pence || 0;
      }
      const today = fmt.format(new Date());
      const nights = Object.entries(byDate).map(([date, v]) => ({ date, pence: v.pence, orders: v.orders })).sort((a, b) => a.date < b.date ? 1 : -1);
      return json({ ok: true, total_pence: total, night_count: nights.length, tonight_pence: byDate[today]?.pence || 0, tonight_orders: byDate[today]?.orders || 0, nights: nights.slice(0, 90) });
    }

    // ── Service report for a date range (drives the Report view in Orders) ───────
    if (action === "report") {   // kitchen
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const to = /^\d{4}-\d{2}-\d{2}$/.test(String(b.to)) ? String(b.to) : londonYmd();
      const from = /^\d{4}-\d{2}-\d{2}$/.test(String(b.from)) ? String(b.from) : to;
      const r = await buildReport(sb, from <= to ? from : to, from <= to ? to : from);
      return json({ ok: true, report: r });
    }

    // Food 360 — rich report. Pass money:true (client does so only after the 888999
    // gate) to include the money block. Speed + peaks come back either way.
    if (action === "report360") {   // kitchen
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const to = /^\d{4}-\d{2}-\d{2}$/.test(String(b.to)) ? String(b.to) : londonYmd();
      const from = /^\d{4}-\d{2}-\d{2}$/.test(String(b.from)) ? String(b.from) : to;
      const r = await buildReport360(sb, from <= to ? from : to, from <= to ? to : from, b.money === true);
      return json({ ok: true, report: r });
    }

    // Raw rota data for the MONEY tier's kitchen-labour calc. The client runs the
    // pay maths through src/rota/pay.js (single source of truth — never reimplement:
    // the Finances WagesLive shortcut disagrees with payroll). Kitchen labour = the
    // shifts CLAIMED BY the kitchen team (Kitchen / Barback role, the "orange" staff),
    // since every shift is labelled "bar" — so we identify by the person, not the shift.
    if (action === "kitchenHours") {   // kitchen (money tier)
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const to = /^\d{4}-\d{2}-\d{2}$/.test(String(b.to)) ? String(b.to) : londonYmd();
      const from = /^\d{4}-\d{2}-\d{2}$/.test(String(b.from)) ? String(b.from) : to;
      const [f, t] = from <= to ? [from, to] : [to, from];
      const kIds = await kitchenStaffIds(sb);
      const { shifts, claims } = await kitchenClaimedShifts(sb, f, t, kIds);
      const { data: clocks } = kIds.length ? await sb.from("shift_clock").select("staff_id, date, clock_in, clock_out").in("staff_id", kIds).gte("date", f).lte("date", t) : { data: [] };
      const { data: staff } = kIds.length ? await sb.from("staff").select("id, name, hourly_rate").in("id", kIds) : { data: [] };
      return json({ ok: true, from: f, to: t, shifts, claims, clocks: clocks || [], staff: staff || [] });
    }

    // ── Daily / weekly report EMAIL to the founder (cron-triggered) ──────────────
    if (action === "emailReport") {   // cron
      const period = b.period === "week" ? "week" : "day";
      const today = londonYmd();
      const from = period === "week" ? addDaysYmd(today, -6) : today;
      const r = await buildReport(sb, from, today);
      if (r.orders === 0 && r.tab_orders === 0 && r.abandoned === 0) return json({ ok: true, skipped: "no activity" });
      const money = (await buildReport360(sb, from, today, true)).money;   // founder-only email → full margin detail is fine
      const title = period === "week" ? "This week" : "Today";
      const subj = `On A Roll — ${title}: ${gbp(r.revenue_pence)} · ${r.orders} orders${money ? ` · ${money.gross_margin_pct}% GM` : ""}${r.avg_cook_sec != null ? ` · avg ${Math.round(r.avg_cook_sec / 60)}m cook` : ""}`;
      const sent = await sendEmail("elliot@nodice.bar", subj, reportEmailHtml(r, title, money));
      return json({ ok: true, sent, period, from, to: today });
    }

    // ── Customer texts: resend "ready", "order received", or a custom reply ─────
    if (action === "resendReady") {   // kitchen — re-send the "food ready" message (SMS or email)
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const { data } = await sb.from("food_orders").select("order_no,customer_name,customer_phone,customer_email").eq("id", clean(b.id, 40)).maybeSingle();
      if (!data?.customer_phone && !data?.customer_email) return json({ error: "No phone or email on this order." }, 400);
      const texted = await notifyCustomer(data, readyMessage(data.order_no, data.customer_name), `Your On A Roll order #${data.order_no} is ready!`, readyEmail(data));
      return json({ ok: true, texted });
    }
    if (action === "notifyReceived") {   // called by the webhook on payment — one reassurance message
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const { data } = await sb.from("food_orders").select("order_no,customer_name,customer_phone,customer_email").eq("id", clean(b.id, 40)).maybeSingle();
      if (!data || (!data.customer_phone && !data.customer_email)) return json({ ok: true, texted: false });
      const texted = await notifyCustomer(data, `On A Roll 🍔 Order #${data.order_no} received — we're on it! We'll message you the moment it's ready to collect.`, `Order #${data.order_no} received`, receivedEmail(data));
      return json({ ok: true, texted });
    }
    if (action === "markPaidAtBar") {   // kitchen — a card-failed order was settled at the bar → make it
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const { data, error } = await sb.from("food_orders").update({ paid: true, status: "new" }).eq("id", clean(b.id, 40)).eq("status", "card_failed").select("*").maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, order: data });
    }
    if (action === "sendDueNudges") {   // cron (every minute) — ONE auto-nudge for orders left ready
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString();   // 3 min after ready
      const { data: due } = await sb.from("food_orders")
        .select("id,order_no,customer_name,customer_phone,customer_email")
        .eq("status", "ready").is("nudged_at", null).not("ready_at", "is", null).lte("ready_at", cutoff).limit(20);
      let sent = 0;
      for (const o of (due || [])) {
        await sb.from("food_orders").update({ nudged_at: new Date().toISOString() }).eq("id", o.id);   // mark first → never double-nudge
        const ok = await notifyCustomer(o, `⏰ On A Roll: Order #${o.order_no} is ready and waiting — please come to the van to collect it!`, `Reminder — Order #${o.order_no} is ready`, emailShell(`Order #${o.order_no} is still waiting ⏰`, `Your food's ready and getting cold — please come to the van to collect it!`));
        if (ok) sent++;
      }
      return json({ ok: true, sent });
    }
    if (action === "textCustomer") {   // kitchen — send a custom message (e.g. reply to a note)
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const message = clean(b.message, 300);
      if (!message) return json({ error: "Write a message first." }, 400);
      const { data } = await sb.from("food_orders").select("order_no,customer_phone").eq("id", clean(b.id, 40)).maybeSingle();
      if (!data?.customer_phone) return json({ error: "No phone number on this order." }, 400);
      const texted = await sendSMS(data.customer_phone, `On A Roll (Order #${data.order_no}): ${message}`);
      return json({ ok: true, texted });
    }

    // ── Order pause + customer waitlist ──────────────────────────────────────────
    if (action === "getStatus") {   // public — the customer order page reads this
      const e = await getEffective(sb);
      return json({ ok: true, ...e, waiting: await waitingCount(sb) });
    }
    if (action === "setSettings") { // kitchen — pause / auto-pause / threshold
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const patch: any = { updated_at: new Date().toISOString() };
      if (typeof b.paused === "boolean") patch.paused = b.paused;
      if (typeof b.auto_pause === "boolean") patch.auto_pause = b.auto_pause;
      if (b.auto_threshold != null) patch.auto_threshold = Math.max(0, parseInt(b.auto_threshold, 10) || 0);   // 0 = auto-pause off
      if (typeof b.close_hhmm === "string") patch.close_hhmm = /^\d{1,2}:\d{2}$/.test(b.close_hhmm.trim()) ? b.close_hhmm.trim() : "22:00";
      if (typeof b.open_hhmm === "string") patch.open_hhmm = /^\d{1,2}:\d{2}$/.test(b.open_hhmm.trim()) ? b.open_hhmm.trim() : null;   // blank = no opening restriction
      const { error } = await sb.from("food_settings").update(patch).eq("id", 1);
      if (error) return json({ error: error.message }, 400);
      const e = await getEffective(sb);
      return json({ ok: true, ...e, waiting: await waitingCount(sb) });
    }
    // ── Live stock levels (limiting ingredients) → drives menu availability ──────
    if (action === "getStock") {   // public — the order page + kitchen read this
      const { data } = await sb.from("kitchen_stock_levels").select("*");
      const levels: Record<string, any> = {};
      for (const r of (data || [])) {
        const soldOut = r.override === "sold_out" || (r.override !== "available" && r.count <= 0);
        levels[r.ingredient] = { count: r.count, override: r.override, soldOut, label: r.label };
      }
      return json({ ok: true, levels });
    }
    if (action === "setStock") {   // kitchen — set absolute counts (opening / correction)
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const levels = (b.levels && typeof b.levels === "object") ? b.levels : {};
      for (const [ing, count] of Object.entries(levels)) {
        await sb.from("kitchen_stock_levels").update({ count: Math.max(0, parseInt(String(count), 10) || 0), updated_at: new Date().toISOString() }).eq("ingredient", ing);
      }
      return json({ ok: true });
    }
    if (action === "adjustStock") {   // kitchen — nudge one ingredient by +/- delta
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const ing = clean(b.ingredient, 40), delta = parseInt(String(b.delta), 10) || 0;
      const { data: cur } = await sb.from("kitchen_stock_levels").select("count").eq("ingredient", ing).maybeSingle();
      if (cur) await sb.from("kitchen_stock_levels").update({ count: Math.max(0, cur.count + delta), updated_at: new Date().toISOString() }).eq("ingredient", ing);
      return json({ ok: true });
    }
    if (action === "setStockOverride") {   // kitchen — force sold_out / available / auto(null)
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const ing = clean(b.ingredient, 60);
      const ov = b.override === "sold_out" || b.override === "available" ? b.override : null;
      await sb.from("kitchen_stock_levels").update({ override: ov, updated_at: new Date().toISOString() }).eq("ingredient", ing);
      return json({ ok: true });
    }

    // Make sure every menu item is represented on the stock sheet. Given a list of
    // { ingredient, label } (built from the live menu), create a stock row for any
    // that's missing — new rows start "available" (count 0 = unlimited until staff
    // set a count or force sold-out), so a new dish works immediately AND can be
    // stock-controlled like every other product. Per-item rows keep their label in
    // sync with the dish name. Idempotent.
    if (action === "ensureStock") {   // kitchen
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const rows = Array.isArray(b.rows) ? b.rows : [];
      const { data: existing } = await sb.from("kitchen_stock_levels").select("ingredient,label");
      const have = new Map((existing || []).map((r: any) => [r.ingredient, r.label]));
      let created = 0, relabelled = 0;
      for (const r of rows) {
        const ing = clean(r?.ingredient, 60); if (!ing) continue;
        const label = clean(r?.label, 80) || ing;
        if (!have.has(ing)) {
          await sb.from("kitchen_stock_levels").insert({ ingredient: ing, label, count: 0, override: "available", updated_at: new Date().toISOString() });
          have.set(ing, label); created++;
        } else if (ing.startsWith("itm_") && label && have.get(ing) !== label) {
          await sb.from("kitchen_stock_levels").update({ label, updated_at: new Date().toISOString() }).eq("ingredient", ing);
          relabelled++;
        }
      }
      return json({ ok: true, created, relabelled });
    }

    // ── Order codes (party tabs / staff food) — order without a card, tracked ────
    if (action === "listCodes") {   // kitchen — codes + live tab totals
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const { data: codes } = await sb.from("order_codes").select("*").order("created_at", { ascending: false });
      const { data: orders } = await sb.from("food_orders").select("order_code,total_pence,status").not("order_code", "is", null);
      const tally: Record<string, { orders: number; total_pence: number }> = {};
      for (const o of (orders || [])) {
        if (o.status === "cancelled" || o.status === "card_failed") continue;
        const t = (tally[o.order_code] ||= { orders: 0, total_pence: 0 });
        t.orders++; t.total_pence += o.total_pence || 0;
      }
      return json({ ok: true, codes: (codes || []).map((c: any) => ({ ...c, tab: tally[c.code] || { orders: 0, total_pence: 0 } })) });
    }
    if (action === "createCode") {   // kitchen — create a party/staff/comp code
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const code = clean(b.code, 40).toUpperCase().replace(/\s+/g, "");
      if (code.length < 3) return json({ error: "Code needs at least 3 characters." }, 400);
      const kind = ["party", "staff", "comp"].includes(b.kind) ? b.kind : "party";
      const { error } = await sb.from("order_codes").insert({ code, label: clean(b.label, 80) || null, kind });
      if (error) return json({ error: /duplicate/i.test(error.message) ? "That code already exists." : error.message }, 400);
      return json({ ok: true });
    }
    if (action === "setCodeActive") {   // kitchen — open/close a code (close = settle at bar)
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      await sb.from("order_codes").update({ active: !!b.active }).eq("code", clean(b.code, 40).toUpperCase());
      return json({ ok: true });
    }
    if (action === "validateCode") {   // public — customer checks a code before ordering
      const { data: c } = await sb.from("order_codes").select("code,label,kind,active").eq("code", clean(b.code, 40).toUpperCase()).maybeSingle();
      if (!c || !c.active) return json({ ok: true, valid: false });
      return json({ ok: true, valid: true, label: c.label, kind: c.kind });
    }
    if (action === "createCodedOrder") {   // public — place an order on a code (no card)
      const code = clean(b.code, 40).toUpperCase();
      const { data: codeRow } = await sb.from("order_codes").select("*").eq("code", code).maybeSingle();
      if (!codeRow || !codeRow.active) return json({ error: "That code isn't valid — check with staff." }, 403);
      const name = clean(b.name, 80), phone = normalisePhone(clean(b.phone, 30));
      const emailC = clean(b.email, 120);
      const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailC) ? emailC : "";
      if (name.length < 2) return json({ error: "Please enter your name." }, 400);
      if (!phone && !email) return json({ error: "Leave a mobile or an email so we can tell you it's ready." }, 400);
      const cart = Array.isArray(b.cart) ? b.cart.slice(0, 50) : [];
      if (!cart.length) return json({ error: "Your order is empty." }, 400);
      const eff = await getEffective(sb);
      if (!eff.open) return json({ error: "Ordering is paused right now — please try again shortly.", open: false }, 409);
      // price from the live menu + tally limiting ingredients
      const { data: menu } = await sb.from("menu_catalog").select("sections").eq("id", 1).maybeSingle();
      const idx = new Map<string, any>();
      for (const sec of (Array.isArray(menu?.sections) ? menu!.sections : [])) for (const it of (sec.items || [])) { if (it.archived) continue; idx.set(String(it.id), it); }   // archived items can't be ordered
      const lineItems: any[] = []; let total = 0; const need: Record<string, number> = {};
      for (const line of cart) {
        const it = idx.get(String(line.id));
        if (!it) return json({ error: "That menu has just changed — please refresh." }, 409);
        const qty = Math.min(20, Math.max(1, parseInt(String(line.qty), 10) || 1));
        const chosen = (it.addons || []).filter((a: any) => (Array.isArray(line.addon_ids) ? line.addon_ids.map(String) : []).includes(String(a.id)));
        // Stamp cost_pence at order time (snapshot) so realised margin is exact even if the menu is re-priced later.
        const options = chosen.map((a: any) => ({ name: a.name, price_pence: parseInt(a.price_pence, 10) || 0, cost_pence: parseInt(a.cost_pence, 10) || 0 }));
        const stock = Array.isArray(it.stock) ? it.stock : [];
        total += ((parseInt(it.sell_pence, 10) || 0) + options.reduce((s: number, o: any) => s + o.price_pence, 0)) * qty;
        for (const ing of stock) need[ing] = (need[ing] || 0) + qty;
        lineItems.push({ name: it.name, qty, price_pence: parseInt(it.sell_pence, 10) || 0, cost_pence: parseInt(it.cost_pence, 10) || 0, options, stock });
      }
      // never oversell + draw down (order is confirmed on placement — no card step)
      if (Object.keys(need).length) {
        const { data: levels } = await sb.from("kitchen_stock_levels").select("*");
        const lvl: Record<string, any> = Object.fromEntries((levels || []).map((r: any) => [r.ingredient, r]));
        for (const [ing, qty] of Object.entries(need)) {
          const r = lvl[ing]; if (!r) continue;
          const soldOut = r.override === "sold_out" || (r.override !== "available" && r.count <= 0);
          const avail = r.override === "available" ? Infinity : r.count;
          if (soldOut || qty > avail) return json({ error: `Sorry — we've run low on ${r.label || ing}. Adjust your order.`, sold_out: ing }, 409);
        }
        for (const [ing, qty] of Object.entries(need)) {
          const { data: cur } = await sb.from("kitchen_stock_levels").select("count").eq("ingredient", ing).maybeSingle();
          if (cur) await sb.from("kitchen_stock_levels").update({ count: Math.max(0, cur.count - qty), updated_at: new Date().toISOString() }).eq("ingredient", ing);
        }
      }
      const { data: row, error } = await sb.from("food_orders").insert({
        customer_name: name, customer_phone: phone || null, customer_email: email || null, customer_note: clean(b.note, 300) || null,
        items: lineItems, total_pence: total, status: "new", paid: false,
        order_code: code, allergen_note: clean(b.allergen_note, 500) || null,
      }).select("id,order_no").single();
      if (error) return json({ error: error.message }, 400);
      await notifyCustomer({ order_no: row.order_no, customer_name: name, customer_phone: phone, customer_email: email }, `On A Roll 🍔 Order #${row.order_no} received — we're on it! We'll message you the moment it's ready to collect.`, `Order #${row.order_no} received`, receivedEmail({ order_no: row.order_no }));
      return json({ ok: true, order_id: row.id, order_no: row.order_no, code_label: codeRow.label });
    }

    if (action === "joinWaitlist") { // public — customer leaves their number while paused
      const phone = clean(b.phone, 30);
      if (!phone) return json({ error: "no phone number" }, 400);
      const { data: dupe } = await sb.from("food_waitlist").select("id").eq("phone", phone).is("notified_at", null).maybeSingle();
      if (!dupe) { const { error } = await sb.from("food_waitlist").insert({ phone, name: clean(b.name, 80) || null }); if (error) return json({ error: error.message }, 400); }
      return json({ ok: true });
    }
    if (action === "sendDueWaitlist") { // cron (every minute) — text the next waiter if OPEN
      if (!isAdmin()) return json({ error: "not allowed" }, 403);
      const e = await getEffective(sb);
      if (!e.open) return json({ ok: true, sent: 0, note: "paused" });
      const { data: next } = await sb.from("food_waitlist").select("*").is("notified_at", null).order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (!next) return json({ ok: true, sent: 0 });
      const texted = await sendSMS(next.phone, `On A Roll 🍔🍟 you can order again! Order here: ${ORDER_URL}`);
      await sb.from("food_waitlist").update({ notified_at: new Date().toISOString() }).eq("id", next.id);
      return json({ ok: true, sent: 1, texted });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
