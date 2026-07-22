// Supabase Edge Function: tournament
// No Dice pool-tournament tool (kickertool replacement). One function, `action`-routed,
// ALL actions founder-gated by SEND_SECRET (the /ops "Tournament" screen).
//
// It READS the existing booking tables (tournaments, tournament_entries) — which the
// separate nodice.bar booking site fills via Stripe — and writes ONLY to its own
// pool_* tables. Never mutates a customer's booking.
//
// Slice 1: entrants. A "run" (pool_tournaments) links a booked pool night to its
// roster (pool_participants), auto-synced from the paid entries; the founder can add
// walk-ins, rename, or remove. Rounds + knockout land in later slices on this function.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const clean = (v: unknown, max = 60) => String(v ?? "").trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {};
  try { b = await req.json(); } catch { /* empty */ }
  const action = b.action as string;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const isAdmin = () => b.secret && b.secret === Deno.env.get("SEND_SECRET");

  if (!isAdmin()) return json({ error: "unauthorized" }, 401);

  try {
    // The pool nights to run: booked tournaments + their paid count, cap, and run status.
    if (action === "list") {
      const [{ data: tourns }, { data: paid }, { data: runs }] = await Promise.all([
        sb.from("tournaments").select("id,name,event_date,start_time,tournament_type,max_teams,bookable,registration_open").order("event_date", { ascending: true }),
        sb.from("tournament_entries").select("tournament_id").eq("status", "paid"),
        sb.from("pool_tournaments").select("id,tournament_id,status"),
      ]);
      const paidCount: Record<string, number> = {};
      for (const e of paid || []) paidCount[e.tournament_id] = (paidCount[e.tournament_id] || 0) + 1;
      const runByT: Record<string, any> = {};
      for (const r of runs || []) runByT[r.tournament_id] = r;
      return json({
        ok: true,
        tournaments: (tourns || []).map((t: any) => ({
          id: t.id, name: t.name, event_date: t.event_date, start_time: t.start_time,
          type: t.tournament_type, cap: t.max_teams || 12, paid: paidCount[t.id] || 0,
          bookable: t.bookable, registration_open: t.registration_open,
          run: runByT[t.id] ? { id: runByT[t.id].id, status: runByT[t.id].status } : null,
        })),
      });
    }

    // Open a pool night: create the run if needed, pull in any paid entry not yet a
    // participant, and return the roster. Idempotent — safe to call on every load.
    if (action === "open") {
      const tournamentId = clean(b.tournamentId, 40);
      if (!tournamentId) return json({ error: "no tournament" }, 400);
      const { data: t } = await sb.from("tournaments").select("*").eq("id", tournamentId).maybeSingle();
      if (!t) return json({ error: "Tournament not found" }, 404);

      let { data: run } = await sb.from("pool_tournaments").select("*").eq("tournament_id", tournamentId).maybeSingle();
      if (!run) {
        const ins = await sb.from("pool_tournaments").insert({ tournament_id: tournamentId }).select("*").single();
        if (ins.error) return json({ error: ins.error.message }, 400);
        run = ins.data;
      }

      // Sync: add each PAID entry that isn't already a participant (by entry_id).
      const { data: entries } = await sb.from("tournament_entries").select("id,team_name,captain_name").eq("tournament_id", tournamentId).eq("status", "paid").order("paid_at");
      const { data: existing } = await sb.from("pool_participants").select("*").eq("pool_tournament_id", run.id);
      const haveEntryIds = new Set((existing || []).filter((p: any) => p.entry_id).map((p: any) => p.entry_id));
      const toAdd = (entries || [])
        .filter((e: any) => !haveEntryIds.has(e.id))
        .map((e: any) => ({ pool_tournament_id: run.id, entry_id: e.id, display_name: clean(e.team_name) || clean(e.captain_name) || "Player", source: "ticket" }));
      for (const row of toAdd) { await sb.from("pool_participants").insert(row); }   // one-by-one so a dup can't abort the batch

      const { data: participants } = await sb.from("pool_participants").select("*").eq("pool_tournament_id", run.id).order("created_at");
      return json({
        ok: true,
        tournament: { id: t.id, name: t.name, event_date: t.event_date, start_time: t.start_time, type: t.tournament_type, cap: t.max_teams || 12 },
        run, paidCount: (entries || []).length, participants: participants || [],
      });
    }

    // Add a walk-in (cash at the bar). Flagged source=manual so the books reconcile.
    if (action === "addManual") {
      const runId = clean(b.runId, 40);
      const name = clean(b.name);
      if (!runId || !name) return json({ error: "Enter a name." }, 400);
      const { data, error } = await sb.from("pool_participants").insert({ pool_tournament_id: runId, display_name: name, source: "manual" }).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, participant: data });
    }

    if (action === "renameParticipant") {
      const id = clean(b.participantId, 40);
      const name = clean(b.name);
      if (!id || !name) return json({ error: "Enter a name." }, 400);
      const { data, error } = await sb.from("pool_participants").update({ display_name: name }).eq("id", id).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, participant: data });
    }

    // Remove: a manual walk-in is deleted; a ticket-holder is deactivated (so the paid
    // re-sync can't silently re-add them — and it can be undone).
    if (action === "removeParticipant") {
      const id = clean(b.participantId, 40);
      const { data: p } = await sb.from("pool_participants").select("*").eq("id", id).maybeSingle();
      if (!p) return json({ error: "Not found." }, 404);
      if (p.source === "manual") await sb.from("pool_participants").delete().eq("id", id);
      else await sb.from("pool_participants").update({ active: false }).eq("id", id);
      return json({ ok: true });
    }
    if (action === "restoreParticipant") {
      const id = clean(b.participantId, 40);
      await sb.from("pool_participants").update({ active: true }).eq("id", id);
      return json({ ok: true });
    }

    // Reset a run entirely (deletes the roster; the booking data is untouched).
    if (action === "deleteRun") {
      const runId = clean(b.runId, 40);
      if (!runId) return json({ error: "no run" }, 400);
      await sb.from("pool_tournaments").delete().eq("id", runId);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
