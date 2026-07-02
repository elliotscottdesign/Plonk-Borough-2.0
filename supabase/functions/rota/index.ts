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

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
