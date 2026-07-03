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

// ── Email (Resend) — founder alerts + the "shift back on the board" broadcast ──
const RESEND = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "elliot@nodice.bar";
const OPS_URL = "https://team.nodice.bar/ops";
const PORTAL_URL = "https://team.nodice.bar/rota";
const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" } as Record<string, string>)[c]);
const niceDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
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
    if (["myState", "saveProfile", "saveAvailability", "claimShift", "releaseShift", "getChecklist", "saveChecklist", "completeTraining", "uncompleteTraining", "signStatement", "uploadDoc"].includes(action)) {
      const me = await staffByToken(sb, b.token);
      if (!me) return json({ error: "Please log in again." }, 401);

      if (action === "myState") {
        const today = todayISO();
        const [{ data: shifts }, { data: av }, { data: train }, { data: myDocs }] = await Promise.all([
          sb.from("staff_shifts").select("*").gte("date", today).order("date"),
          sb.from("staff_availability").select("month,data").eq("staff_id", me.id),
          sb.from("training_completions").select("item_key").eq("staff_id", me.id),
          sb.from("staff_documents").select("kind").eq("staff_id", me.id),
        ]);
        const docKinds = new Set((myDocs || []).map((d: any) => d.kind));
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
          docs: { passport: docKinds.has("passport"), rtw: docKinds.has("rtw") },
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
        // Previous availability for this month — so we alert the founder only on the
        // "went from nothing → set it" transition, not on every autosaved tap.
        const { data: prevAv } = await sb.from("staff_availability").select("data").eq("staff_id", me.id).eq("month", month).maybeSingle();
        const prevDays = prevAv?.data ? Object.keys(prevAv.data).length : 0;
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
        // Founder alert on the "just set their availability" transition (nothing → some),
        // so the per-tap autosave doesn't spam but the founder is told once per month.
        if (prevDays === 0 && Object.keys(data).length > 0) {
          const monthName = new Date(month + "-01T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
          await sendMail(ADMIN_EMAIL, `${me.name} set their availability — ${monthName}`,
            emailShell(`${esc(me.name)} updated their availability`,
              `<p style="color:#ccc;line-height:1.6"><strong style="color:#fff">${esc(me.name)}</strong> has marked availability in <strong style="color:#fff">${monthName}</strong>. You can release shifts for them now.</p>`,
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
        // Tell the founder, with a link to the rota overview.
        await sendMail(ADMIN_EMAIL, `${me.name} took a shift — ${niceDate(shift.date)}`,
          emailShell(`${esc(me.name)} grabbed a shift`,
            `<p style="color:#ccc;line-height:1.6"><strong style="color:#fff">${esc(me.name)}</strong> took the <strong style="color:#fff">${esc(shift.label || "shift")}</strong> on <strong style="color:#fff">${niceDate(shift.date)}</strong>. Log in to see the rota and what still needs covering.</p>`,
            { href: OPS_URL, label: "See the rota overview" }));
        return json({ ok: true });
      }

      if (action === "releaseShift") {
        const { data: sh } = await sb.from("staff_shifts").select("date,label,ability,min_rank").eq("id", b.shiftId).maybeSingle();
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
        abilities: cleanAbilities(b.abilities),
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
        "work_rules", "dob", "ni_number", "bank_name", "bank_sort", "bank_account"]) {
        if (k in b) patch[k] = clean(b[k]) || null;
      }
      if ("skills" in b) patch.skills = Array.isArray(b.skills) ? b.skills : [];
      if ("abilities" in b) patch.abilities = cleanAbilities(b.abilities);
      if ("interests" in b) patch.interests = cleanInterests(b.interests);
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
      const [{ data: staff }, { data: shifts }, { data: claims }, { data: training }, { data: docs }] = await Promise.all([
        sb.from("staff").select("*").order("name"),
        sb.from("staff_shifts").select("*").gte("date", today).order("date"),
        sb.from("staff_shift_claims").select("*"),
        sb.from("training_completions").select("staff_id,item_key"),
        sb.from("staff_documents").select("staff_id,kind,uploaded_at"),   // which docs each has (no data)
      ]);
      const ids = new Set((shifts || []).map((s: any) => s.id));
      return json({
        ok: true, roles: ROLES,
        staff: (staff || []).map(publicStaff),
        shifts: shifts || [],
        claims: (claims || []).filter((c: any) => ids.has(c.shift_id)),   // only claims on upcoming shifts
        training: training || [],   // all completions — for per-staff progress in the admin
        docs: docs || [],           // which staff have uploaded passport / rtw
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
