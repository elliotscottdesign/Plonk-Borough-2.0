// Supabase Edge Function: kitchen
// Split out of `rota` on 2026-07-31 so the kitchen lane owns its own backend and no
// longer shares a file with rota. All actions read/write the SAME tables the rota
// function used (kitchen_checklist_runs, kitchen_waste_log, kitchen_allergen_matrix,
// plus staff / staff_shifts / staff_shift_claims for auth & shift-tying) — no schema
// change, existing data untouched. Auth mirrors rota exactly:
//   • staff actions gated by the member's own token (kitchen ability required)
//   • manager actions gated by SEND_SECRET.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const clean = (v: unknown) => (typeof v === "string" ? v.trim() : v);
const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" } as Record<string, string>)[c]);

// ── Email (Resend) — manager alerts (same as rota) ───────────────────────────
const RESEND = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "elliot@nodice.bar";
const OPS_URL = "https://team.nodice.bar/ops";
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
    <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#DA1B33;margin:0 0 14px">No Dice · Kitchen</p>
    <h1 style="font-size:22px;margin:0 0 12px">${heading}</h1>
    ${bodyHtml}
    ${cta ? `<p style="margin:22px 0"><a href="${cta.href}" style="background:#DA1B33;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700;display:inline-block">${cta.label}</a></p>` : ""}
    <p style="font-size:11px;color:#777;margin-top:18px">No Dice · 407 Mentmore Terrace, London Fields, E8 3PH</p>
  </div>`;

// Resolve the logged-in staff member from their portal token (verbatim from rota).
const staffByToken = async (sb: any, token: unknown) => {
  const t = String(token || "");
  if (!t) return null;
  const { data } = await sb.from("staff").select("*").eq("token", t).limit(1);
  return (data || [])[0] || null;
};

// ── Shift day (8am-anchored, London time) — verbatim from rota ────────────────
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {};
  try { b = await req.json(); } catch { /* empty body */ }
  const action = b.action as string;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const isAdmin = () => b.secret && b.secret === Deno.env.get("SEND_SECRET");

  try {
    // ── Staff (token-authed): kitchen-trained crew complete the sheets ──────────
    if (["kitchenGetDay", "kitchenSaveRun", "kitchenAddWaste", "kitchenDeleteWaste"].includes(action)) {
      const me = await staffByToken(sb, b.token);
      if (!me) return json({ error: "Please log in again." }, 401);
      if (me.active === false) return json({ error: "This account is inactive — ask the manager." }, 403);

      // ── Kitchen food-safety: read today's runs + saved allergen overrides ─────
      if (action === "kitchenGetDay") {
        if (!(me.abilities || []).includes("kitchen")) return json({ error: "Kitchen access only." }, 403);
        const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) ? String(b.date) : shiftDayISO();
        const [{ data: runs }, { data: matrix }, { data: waste }] = await Promise.all([
          sb.from("kitchen_checklist_runs").select("*").eq("run_date", date),
          sb.from("kitchen_allergen_matrix").select("dish,allergens,notes,updated_at"),
          sb.from("kitchen_waste_log").select("*").eq("log_date", date).order("created_at", { ascending: false }),
        ]);
        const byCadence: Record<string, any> = {};
        for (const r of runs || []) byCadence[r.cadence] = r;
        return json({ ok: true, date, runs: byCadence, matrix: matrix || [], waste: waste || [] });
      }

      // ── Kitchen wastage log: add / delete a thrown-out item (product + reason) ──
      if (action === "kitchenAddWaste") {
        if (!(me.abilities || []).includes("kitchen")) return json({ error: "Kitchen access only." }, 403);
        const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) ? String(b.date) : shiftDayISO();
        const product = clean(b.product, 200);
        if (!product) return json({ error: "What was thrown out?" }, 400);
        const reason = clean(b.reason, 300) || null;
        const quantity = clean(b.quantity, 60) || null;
        // Tie it to the caller's kitchen shift for the day if they have one.
        const { data: kShifts } = await sb.from("staff_shifts").select("id").eq("date", date).eq("ability", "kitchen");
        const kIds = (kShifts || []).map((s: any) => s.id);
        let shift_id: string | null = null;
        if (kIds.length) { const { data: cl } = await sb.from("staff_shift_claims").select("shift_id").eq("staff_id", me.id).in("shift_id", kIds).maybeSingle(); shift_id = cl?.shift_id || null; }
        const { data: row, error } = await sb.from("kitchen_waste_log").insert({ log_date: date, staff_id: me.id, shift_id, product, reason, quantity }).select("*").single();
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, entry: row });
      }
      if (action === "kitchenDeleteWaste") {
        if (!(me.abilities || []).includes("kitchen")) return json({ error: "Kitchen access only." }, 403);
        const id = clean(b.id, 40);
        if (!id) return json({ error: "no entry" }, 400);
        await sb.from("kitchen_waste_log").delete().eq("id", id).eq("staff_id", me.id);   // own rows only
        return json({ ok: true });
      }

      // ── Kitchen food-safety: save / submit a run. Fails need a corrective note. ──
      if (action === "kitchenSaveRun") {
        if (!(me.abilities || []).includes("kitchen")) return json({ error: "Kitchen access only." }, 403);
        const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) ? String(b.date) : shiftDayISO();
        const cadence = String(b.cadence || "");
        if (!["opening", "service", "closing", "weekly", "prep"].includes(cadence)) return json({ error: "bad cadence" }, 400);
        // Any kitchen-trained member can complete the sheets (founder's call — the kitchen
        // area is theirs, not gated on being rostered). We still derive their kitchen shift
        // server-side when there is one, so runs stay tied to the shift for the record.
        const { data: kShifts } = await sb.from("staff_shifts").select("id").eq("date", date).eq("ability", "kitchen");
        const kIds = (kShifts || []).map((s: any) => s.id);
        let myShiftId: string | null = null;
        if (kIds.length) { const { data: cl } = await sb.from("staff_shift_claims").select("shift_id").eq("staff_id", me.id).in("shift_id", kIds).maybeSingle(); myShiftId = cl?.shift_id || null; }
        const submit = !!b.submit;
        const entries = (Array.isArray(b.entries) ? b.entries : []).slice(0, 200).map((e: any) => ({
          key: String(e?.key || "").slice(0, 80),
          checked: !!e?.checked,
          value_numeric: (e?.value_numeric === null || e?.value_numeric === undefined || e?.value_numeric === "") ? null : Number(e.value_numeric),
          value_text: e?.value_text != null ? String(e.value_text).slice(0, 500) : null,
          is_fail: !!e?.is_fail,
          corrective_action: e?.corrective_action != null ? String(e.corrective_action).slice(0, 1000) : null,
        })).filter((e: any) => e.key);
        const fails = entries.filter((e: any) => e.is_fail);
        const has_failure = fails.length > 0;
        if (submit && fails.some((e: any) => !e.corrective_action || !String(e.corrective_action).trim()))
          return json({ error: "Add a corrective-action note to each failed check before submitting." }, 400);
        // Any staff edit invalidates a manager's earlier countersign (they signed off
        // different data) and, if reverted to a draft, clears the completed stamp.
        const row: any = { run_date: date, cadence, staff_id: me.id, shift_id: myShiftId, entries, has_failure, status: submit ? "completed" : "in_progress", completed_at: submit ? new Date().toISOString() : null, reviewed_at: null, review_note: null };
        const { data: saved, error } = await sb.from("kitchen_checklist_runs").upsert(row, { onConflict: "run_date,cadence" }).select("*").single();
        if (error) return json({ error: error.message }, 400);
        if (submit && has_failure && RESEND) {
          const titles: Record<string, string> = { opening: "Opening", service: "During service", closing: "Closing", weekly: "Weekly deep clean", prep: "Batch prep" };
          const title = titles[cadence] || cadence;
          const li = fails.map((e: any) => `<li style="margin:4px 0"><strong style="color:#fff">${esc(e.key)}</strong>${e.value_numeric != null ? ` — ${esc(String(e.value_numeric))} °C` : ""}${e.corrective_action ? `<br><span style="color:#bbb">Action: ${esc(String(e.corrective_action))}</span>` : ""}</li>`).join("");
          await sendMail(ADMIN_EMAIL, `⚠️ Kitchen ${title} check FAILED — ${date}`,
            emailShell(`Kitchen ${title} check failed`,
              `<p style="color:#ccc;line-height:1.6"><strong style="color:#fff">${esc(me.name)}</strong> submitted the <strong style="color:#fff">${esc(title)}</strong> kitchen checklist for <strong style="color:#fff">${esc(date)}</strong> with <strong style="color:#DA1B33">${fails.length} failed check${fails.length === 1 ? "" : "s"}</strong>:</p><ul style="color:#ccc">${li}</ul><p style="color:#999;font-size:13px">Review it in /ops → Kitchen.</p>`));
        }
        return json({ ok: true, run: saved });
      }
    }

    // ── Manager (founder, SEND_SECRET-gated): review + allergen matrix ──────────
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);

    if (action === "kitchenRuns") {
      const days = Math.max(1, Math.min(120, parseInt(String(b.days)) || 30));
      const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      const { data: runs } = await sb.from("kitchen_checklist_runs").select("*").gte("run_date", since).order("run_date", { ascending: false });
      const ids = [...new Set((runs || []).map((r: any) => r.staff_id).filter(Boolean))];
      const { data: names } = ids.length ? await sb.from("staff").select("id,name").in("id", ids) : { data: [] };
      const nameOf: Record<string, string> = {}; for (const s of names || []) nameOf[s.id] = s.name;
      return json({ ok: true, runs: (runs || []).map((r: any) => ({ ...r, staff_name: r.staff_id ? nameOf[r.staff_id] || null : null })) });
    }
    if (action === "kitchenWasteLog") {   // manager view of thrown-out stock
      const days = Math.max(1, Math.min(120, parseInt(String(b.days)) || 30));
      const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      const { data: waste } = await sb.from("kitchen_waste_log").select("*").gte("log_date", since).order("log_date", { ascending: false }).order("created_at", { ascending: false });
      const ids = [...new Set((waste || []).map((r: any) => r.staff_id).filter(Boolean))];
      const { data: names } = ids.length ? await sb.from("staff").select("id,name").in("id", ids) : { data: [] };
      const nameOf: Record<string, string> = {}; for (const s of names || []) nameOf[s.id] = s.name;
      return json({ ok: true, waste: (waste || []).map((r: any) => ({ ...r, staff_name: r.staff_id ? nameOf[r.staff_id] || null : null })) });
    }
    if (action === "kitchenReview") {   // manager countersign
      const id = String(b.runId || "");
      if (!id) return json({ error: "no run" }, 400);
      const { error } = await sb.from("kitchen_checklist_runs").update({ reviewed_at: new Date().toISOString(), review_note: clean(b.note) || null }).eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    if (action === "kitchenGetMatrix") {
      const { data } = await sb.from("kitchen_allergen_matrix").select("*").order("dish");
      return json({ ok: true, matrix: data || [] });
    }
    if (action === "kitchenSaveMatrix") {
      const dish = clean(b.dish);
      if (!dish) return json({ error: "no dish" }, 400);
      const allergens = (b.allergens && typeof b.allergens === "object" && !Array.isArray(b.allergens)) ? b.allergens : {};
      const { error } = await sb.from("kitchen_allergen_matrix").upsert({ dish, allergens, notes: clean(b.notes) || null, updated_at: new Date().toISOString() }, { onConflict: "dish" });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    // Missed-checklist sweep. On a KITCHEN day (a kitchen shift exists) with no completed
    // opening/closing run, report what's missing. It only EMAILS when notify:true — the
    // pg_cron job (run once after close) passes that; the /ops button is a read-only peek
    // so a mid-shift click can't fire a false "closing missed" alert.
    if (action === "kitchenCheckMissed") {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) ? String(b.date) : shiftDayISO();
      const notify = b.notify === true;
      const { data: kShifts } = await sb.from("staff_shifts").select("id").eq("date", date).eq("ability", "kitchen");
      if (!kShifts || !kShifts.length) return json({ ok: true, trading: false });   // not a kitchen day
      const { data: runs } = await sb.from("kitchen_checklist_runs").select("cadence,status").eq("run_date", date);
      const done = new Set((runs || []).filter((r: any) => r.status === "completed").map((r: any) => r.cadence));
      const missing = ["opening", "closing"].filter((c) => !done.has(c));
      if (missing.length && notify && RESEND) {
        await sendMail(ADMIN_EMAIL, `⚠️ Kitchen checklist missed — ${date}`,
          emailShell("Kitchen checklist missed",
            `<p style="color:#ccc;line-height:1.6">It's a kitchen trading day (${esc(date)}) but the <strong style="color:#DA1B33">${missing.map((m) => esc(m)).join(" & ")}</strong> checklist${missing.length === 1 ? " hasn't" : "s haven't"} been completed.</p><p style="color:#999;font-size:13px">Check in /ops → Kitchen.</p>`));
      }
      return json({ ok: true, trading: true, missing, emailed: !!(missing.length && notify && RESEND) });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
