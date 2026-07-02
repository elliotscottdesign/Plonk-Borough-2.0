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

// Public shape of a staff row — never leak the password over the wire.
const publicStaff = (s: any) => {
  if (!s) return null;
  const { password, ...rest } = s;
  return { ...rest, has_password: !!password };
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {};
  try { b = await req.json(); } catch { /* empty body */ }
  const action = b.action as string;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const isAdmin = () => b.secret && b.secret === Deno.env.get("SEND_SECRET");

  try {
    // ── Staff login: email + password → their profile + token ──────────────────
    if (action === "login") {
      const email = String(b.email || "").trim().toLowerCase();
      const pw = String(b.password || "");
      if (!email || !pw) return json({ error: "Enter your email and password." }, 400);
      const { data } = await sb.from("staff").select("*").ilike("email", email).limit(1);
      const s = (data || [])[0];
      if (!s || (s.password || "") !== pw) return json({ error: "Email or password not recognised." }, 401);
      if (s.active === false) return json({ error: "This account is inactive — ask the manager." }, 403);
      return json({ ok: true, staff: publicStaff(s), token: s.token });
    }

    // ── Staff portal: load own profile by token ────────────────────────────────
    if (action === "me") {
      const token = String(b.token || "");
      if (!token) return json({ error: "no token" }, 400);
      const { data } = await sb.from("staff").select("*").eq("token", token).limit(1);
      const s = (data || [])[0];
      if (!s) return json({ error: "not found" }, 404);
      return json({ ok: true, staff: publicStaff(s) });
    }

    // ── Everything below is founder-only ───────────────────────────────────────
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);

    if (action === "admin") {
      const { data: staff } = await sb.from("staff").select("*").order("name");
      return json({ ok: true, staff: (staff || []).map(publicStaff), roles: ROLES });
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
        training_status: clean(b.training_status) || null,
        training_notes: clean(b.training_notes) || null,
        feedback_notes: clean(b.feedback_notes) || null,
        work_rules: clean(b.work_rules) || null,
        password: clean(b.password) || null,
        active: b.active !== false,
      };
      const { data, error } = await sb.from("staff").insert(row).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, staff: publicStaff(data) });
    }

    if (action === "saveStaff") {
      const id = b.id;
      if (!id) return json({ error: "no id" }, 400);
      const patch: any = {};
      // Only apply fields that were actually sent, so a partial save never nulls the rest.
      for (const k of ["name", "email", "phone", "address", "emergency_name", "emergency_phone",
        "emergency_relation", "role", "training_status", "training_notes", "feedback_notes",
        "work_rules"]) {
        if (k in b) patch[k] = clean(b[k]) || null;
      }
      if ("skills" in b) patch.skills = Array.isArray(b.skills) ? b.skills : [];
      if ("active" in b) patch.active = !!b.active;
      // Password only changes when a non-empty value is sent (blank = leave as-is).
      if ("password" in b && clean(b.password)) patch.password = clean(b.password);
      const { data, error } = await sb.from("staff").update(patch).eq("id", id).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, staff: publicStaff(data) });
    }

    if (action === "removeStaff") {
      const id = b.id;
      if (!id) return json({ error: "no id" }, 400);
      const { error } = await sb.from("staff").delete().eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ── Rota (founder view): staff + upcoming shifts + who's on them ───────────
    if (action === "load") {
      const today = todayISO();
      const [{ data: staff }, { data: shifts }, { data: claims }] = await Promise.all([
        sb.from("staff").select("*").order("name"),
        sb.from("staff_shifts").select("*").gte("date", today).order("date"),
        sb.from("staff_shift_claims").select("*"),
      ]);
      const ids = new Set((shifts || []).map((s: any) => s.id));
      return json({
        ok: true, roles: ROLES,
        staff: (staff || []).map(publicStaff),
        shifts: shifts || [],
        claims: (claims || []).filter((c: any) => ids.has(c.shift_id)),   // only claims on upcoming shifts
      });
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
          rows.push({ date, shift_key: s.key, label: s.label, position: s.label, role: s.role, start_min: s.start, end_min: s.end, status: "open", headcount });
        }
      }
      if (rows.length) {
        const { error } = await sb.from("staff_shifts").upsert(rows, { onConflict: "date,shift_key", ignoreDuplicates: true });
        if (error) return json({ error: error.message }, 400);
      }
      return json({ ok: true, opened: rows.length });
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
