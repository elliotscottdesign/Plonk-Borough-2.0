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

// Resolve the logged-in staff member from their portal token (issued at login).
const staffByToken = async (sb: any, token: unknown) => {
  const t = String(token || "");
  if (!t) return null;
  const { data } = await sb.from("staff").select("*").eq("token", t).limit(1);
  return (data || [])[0] || null;
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

    // ── Staff portal (token-authed): the logged-in member's own view + actions ──
    if (["myState", "saveProfile", "saveAvailability", "claimShift", "releaseShift", "getChecklist", "saveChecklist", "completeTraining", "uncompleteTraining"].includes(action)) {
      const me = await staffByToken(sb, b.token);
      if (!me) return json({ error: "Please log in again." }, 401);

      if (action === "myState") {
        const today = todayISO();
        const [{ data: shifts }, { data: av }, { data: train }] = await Promise.all([
          sb.from("staff_shifts").select("*").gte("date", today).order("date"),
          sb.from("staff_availability").select("month,data").eq("staff_id", me.id),
          sb.from("training_completions").select("item_key").eq("staff_id", me.id),
        ]);
        const ids = (shifts || []).map((s: any) => s.id);
        const { data: claims } = ids.length
          ? await sb.from("staff_shift_claims").select("shift_id,staff_id").in("shift_id", ids)
          : { data: [] };
        const filled: Record<string, number> = {}; const mine = new Set<string>();
        for (const c of claims || []) { filled[c.shift_id] = (filled[c.shift_id] || 0) + 1; if (c.staff_id === me.id) mine.add(c.shift_id); }
        const availability: Record<string, any> = {};
        for (const r of av || []) availability[r.month] = r.data || {};
        return json({
          ok: true, staff: publicStaff(me), availability,
          shifts: (shifts || []).map((s: any) => ({ ...s, filled: filled[s.id] || 0, mine: mine.has(s.id) })),
          training: (train || []).map((t: any) => t.item_key),
        });
      }

      if (action === "saveProfile") {
        // Staff edit their OWN contact + next-of-kin only. Role/skills/training/
        // password/active stay founder-controlled.
        const patch: any = {};
        for (const k of ["name", "phone", "address", "emergency_name", "emergency_phone", "emergency_relation"]) {
          if (k in b) patch[k] = clean(b[k]) || null;
        }
        if (!Object.keys(patch).length) return json({ error: "nothing to save" }, 400);
        const { error } = await sb.from("staff").update(patch).eq("id", me.id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true, staff: publicStaff({ ...me, ...patch }) });
      }

      if (action === "saveAvailability") {
        const month = String(b.month || "");
        if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: "bad month" }, 400);
        const raw = (b.data && typeof b.data === "object" && !Array.isArray(b.data)) ? b.data : {};
        // Sanitise: keep only valid YYYY-MM-DD keys in this month, cap the count,
        // coerce values — never store an unbounded/arbitrary blob.
        const data: Record<string, any> = {};
        let n = 0;
        for (const k of Object.keys(raw)) {
          if (n >= 40) break;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !k.startsWith(month + "-")) continue;
          const v = raw[k];
          data[k] = (v && typeof v === "object" && !Array.isArray(v))
            ? { from: String(v.from || "").slice(0, 5), to: String(v.to || "").slice(0, 5) }
            : { available: true };
          n++;
        }
        // Don't let them un-mark a day they're already rostered on (keeps the
        // founder's rota and the member's availability from disagreeing).
        const { data: myClaims } = await sb.from("staff_shift_claims").select("shift:staff_shifts(date)").eq("staff_id", me.id);
        for (const c of myClaims || []) {
          const d = (c as any).shift?.date;
          if (d && d.startsWith(month + "-") && !data[d]) return json({ error: `You're on a shift on ${d} — drop that shift first, then update your availability.` }, 409);
        }
        const { error } = await sb.from("staff_availability")
          .upsert({ staff_id: me.id, month, data, updated_at: new Date().toISOString() }, { onConflict: "staff_id,month" });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      if (action === "claimShift") {
        if (me.active === false) return json({ error: "Your account is inactive — ask the manager." }, 403);
        const { data: shift } = await sb.from("staff_shifts").select("id,date").eq("id", b.shiftId).maybeSingle();
        if (!shift) return json({ error: "That shift is no longer available — refresh." }, 404);
        // Must have marked availability on that day first.
        const { data: avRow } = await sb.from("staff_availability").select("data").eq("staff_id", me.id).eq("month", shift.date.slice(0, 7)).maybeSingle();
        if (!avRow?.data?.[shift.date]) return json({ error: "Mark yourself available on that day first (Availability tab), then grab the shift." }, 409);
        // Capacity is enforced atomically by the enforce_shift_headcount trigger.
        const { error } = await sb.from("staff_shift_claims").insert({ shift_id: b.shiftId, staff_id: me.id, status: "claimed", source: "staff" });
        if (error) {
          const m = (error.message || "").toLowerCase();
          if (m.includes("shift_full")) return json({ error: "That shift just filled up — try another." }, 409);
          if (m.includes("duplicate")) return json({ error: "You're already on that shift." }, 409);
          return json({ error: "Couldn't grab that shift — refresh and try again." }, 400);
        }
        return json({ ok: true });
      }

      if (action === "releaseShift") {
        const { error } = await sb.from("staff_shift_claims").delete().eq("shift_id", b.shiftId).eq("staff_id", me.id);
        if (error) return json({ error: error.message }, 400);
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
      if (error) return json({ error: /duplicate/i.test(error.message) ? "That email is already used by another team member." : error.message }, 400);
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
      if (error) return json({ error: /duplicate/i.test(error.message) ? "That email is already used by another team member." : error.message }, 400);
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
