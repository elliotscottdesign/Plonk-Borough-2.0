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

// Scoring settings (per tournament, in pool_tournaments.settings). Pool has no draws
// by default (race to N frames); points 3/0. All overridable later.
const DEFAULT_SETTINGS = { winPts: 3, drawPts: 1, lossPts: 0, drawsAllowed: false };
const settingsOf = (run: any) => ({ ...DEFAULT_SETTINGS, ...(run?.settings || {}) });

// Live standings from the ROUNDS matches only (bracket matches excluded). Ranked by
// points → frame difference → frames for → Buchholz (sum of opponents' points) → name.
// All integer maths — no floats (float rounding mis-sorts tables).
function computeStandings(participants: any[], matches: any[], settings: any) {
  const st: Record<string, any> = {};
  for (const p of participants) if (p.active) st[p.id] = { id: p.id, name: p.display_name, seed: p.seed, played: 0, won: 0, drawn: 0, lost: 0, for: 0, against: 0, byes: 0, pts: 0, opps: [] as string[] };
  for (const m of matches) {
    if (m.status !== "done" || !m.round_id) continue;   // only completed round matches
    if (m.is_bye) { const s = st[m.p1_id]; if (s) { s.played++; s.won++; s.byes++; s.pts += settings.winPts; } continue; }
    const a = st[m.p1_id], b = st[m.p2_id]; if (!a || !b) continue;
    const af = m.p1_score ?? 0, bf = m.p2_score ?? 0;
    a.for += af; a.against += bf; b.for += bf; b.against += af;
    a.played++; b.played++; a.opps.push(m.p2_id); b.opps.push(m.p1_id);
    if (af > bf) { a.won++; a.pts += settings.winPts; b.lost++; b.pts += settings.lossPts; }
    else if (bf > af) { b.won++; b.pts += settings.winPts; a.lost++; a.pts += settings.lossPts; }
    else { a.drawn++; b.drawn++; a.pts += settings.drawPts; b.pts += settings.drawPts; }
  }
  for (const s of Object.values(st) as any[]) s.buchholz = s.opps.reduce((t: number, oid: string) => t + (st[oid]?.pts || 0), 0);
  const arr = (Object.values(st) as any[]).map((s) => ({ ...s, diff: s.for - s.against }));
  arr.sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.for - a.for || b.buchholz - a.buchholz || String(a.name).localeCompare(String(b.name)));
  return arr.map((s, i) => ({ ...s, rank: i + 1 }));
}

// Swiss (Monrad) pairing for the next round: walk the standings top-to-bottom,
// pair each unpaired player with the next they HAVEN'T met; odd field → a bye to the
// lowest-ranked player who hasn't had one. Returns { pairs:[[a,b]...], byeId }.
function pairSwiss(standings: any[], matches: any[]) {
  const played = new Set<string>();
  for (const m of matches) { if (m.round_id && m.p1_id && m.p2_id) { played.add(m.p1_id + "|" + m.p2_id); played.add(m.p2_id + "|" + m.p1_id); } }
  const hadBye = new Set(matches.filter((m) => m.is_bye).map((m) => m.p1_id));
  const pool = standings.map((s) => s.id);
  let byeId: string | null = null;
  if (pool.length % 2 === 1) {
    let idx = -1;
    for (let i = pool.length - 1; i >= 0; i--) { if (!hadBye.has(pool[i])) { idx = i; break; } }
    if (idx === -1) idx = pool.length - 1;   // everyone's had a bye already
    byeId = pool.splice(idx, 1)[0];
  }
  const pairs: [string, string][] = [];
  const used = new Set<string>();
  for (let i = 0; i < pool.length; i++) {
    if (used.has(pool[i])) continue;
    let partner = -1;
    for (let j = i + 1; j < pool.length; j++) { if (!used.has(pool[j]) && !played.has(pool[i] + "|" + pool[j])) { partner = j; break; } }
    if (partner === -1) for (let j = i + 1; j < pool.length; j++) { if (!used.has(pool[j])) { partner = j; break; } }   // forced rematch (small field)
    if (partner === -1) continue;
    used.add(pool[i]); used.add(pool[partner]);
    pairs.push([pool[i], pool[partner]]);
  }
  return { pairs, byeId };
}

// Load a run's roster + rounds + matches + live standings in one go.
async function loadRun(sb: any, run: any) {
  const [{ data: participants }, { data: rounds }, { data: matches }] = await Promise.all([
    sb.from("pool_participants").select("*").eq("pool_tournament_id", run.id).order("created_at"),
    sb.from("pool_rounds").select("*").eq("pool_tournament_id", run.id).order("ordinal"),
    sb.from("pool_matches").select("*").eq("pool_tournament_id", run.id).order("created_at"),
  ]);
  const standings = computeStandings(participants || [], matches || [], settingsOf(run));
  return { participants: participants || [], rounds: rounds || [], matches: matches || [], standings };
}

// Create the next round's matches (Swiss). Guards that the current round is fully scored.
async function generateRound(sb: any, run: any) {
  const { participants, rounds, matches, standings } = await loadRun(sb, run);
  const active = participants.filter((p: any) => p.active);
  if (active.length < 2) return { error: "Need at least 2 entrants." };
  const lastRound = rounds[rounds.length - 1];
  if (lastRound && matches.some((m: any) => m.round_id === lastRound.id && m.status !== "done")) {
    return { error: "Finish scoring the current round first." };
  }
  const ordinal = (lastRound?.ordinal || 0) + 1;
  // Round 1 has no standings yet — pair by sign-up order; later rounds pair on standings.
  const order = ordinal === 1 ? active.map((p: any) => ({ id: p.id, name: p.display_name })) : standings;
  const { pairs, byeId } = pairSwiss(order, matches);
  const { data: round, error: rErr } = await sb.from("pool_rounds").insert({ pool_tournament_id: run.id, ordinal, status: "active" }).select("*").single();
  if (rErr) return { error: rErr.message };
  let slot = 1;
  for (const [a, bId] of pairs) await sb.from("pool_matches").insert({ pool_tournament_id: run.id, round_id: round.id, slot: slot++, p1_id: a, p2_id: bId, status: "pending" });
  if (byeId) await sb.from("pool_matches").insert({ pool_tournament_id: run.id, round_id: round.id, slot: slot++, p1_id: byeId, p2_id: null, is_bye: true, winner_id: byeId, status: "done", p1_score: 0, p2_score: 0 });
  return { round };
}

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
      // Only sync new paid entries while still setting up — once rounds start the field is locked.
      if (run.status === "setup") for (const row of toAdd) { await sb.from("pool_participants").insert(row); }

      const data = await loadRun(sb, run);
      return json({
        ok: true,
        tournament: { id: t.id, name: t.name, event_date: t.event_date, start_time: t.start_time, type: t.tournament_type, cap: t.max_teams || 12 },
        run, paidCount: (entries || []).length, ...data,
      });
    }

    // Start the rounds phase: locks the field and generates round 1. Needs ≥ 2 players.
    if (action === "startRounds") {
      const runId = clean(b.runId, 40);
      const { data: run } = await sb.from("pool_tournaments").select("*").eq("id", runId).maybeSingle();
      if (!run) return json({ error: "Run not found." }, 404);
      const { participants, rounds } = await loadRun(sb, run);
      const active = participants.filter((p: any) => p.active);
      if (active.length < 2) return json({ error: "Need at least 2 entrants to start." }, 400);
      if (rounds.length > 0) return json({ error: "Rounds already started." }, 400);
      await sb.from("pool_tournaments").update({ status: "rounds", updated_at: new Date().toISOString() }).eq("id", runId);
      const gen = await generateRound(sb, { ...run, status: "rounds" });
      if (gen.error) return json({ error: gen.error }, 400);
      return json({ ok: true, round: gen.round });
    }

    // Generate the next round (Swiss). Requires the current round to be fully scored.
    if (action === "generateNextRound") {
      const runId = clean(b.runId, 40);
      const { data: run } = await sb.from("pool_tournaments").select("*").eq("id", runId).maybeSingle();
      if (!run) return json({ error: "Run not found." }, 404);
      const gen = await generateRound(sb, run);
      if (gen.error) return json({ error: gen.error }, 400);
      return json({ ok: true, round: gen.round });
    }

    // Enter / correct a match score. winner = higher score; equal = draw (if allowed).
    if (action === "enterScore") {
      const matchId = clean(b.matchId, 40);
      const p1 = Math.max(0, Math.min(99, parseInt(String(b.p1_score)) || 0));
      const p2 = Math.max(0, Math.min(99, parseInt(String(b.p2_score)) || 0));
      const { data: m } = await sb.from("pool_matches").select("*").eq("id", matchId).maybeSingle();
      if (!m) return json({ error: "Match not found." }, 404);
      if (m.is_bye) return json({ error: "That's a bye — no score to enter." }, 400);
      const { data: run } = await sb.from("pool_tournaments").select("*").eq("id", m.pool_tournament_id).maybeSingle();
      const s = settingsOf(run);
      if (p1 === p2 && !s.drawsAllowed) return json({ error: "That's a draw — pool matches need a winner. Adjust the score." }, 400);
      const winner = p1 > p2 ? m.p1_id : p2 > p1 ? m.p2_id : null;
      const { error } = await sb.from("pool_matches").update({ p1_score: p1, p2_score: p2, winner_id: winner, status: "done" }).eq("id", matchId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    // Reopen a match (clear its score).
    if (action === "clearScore") {
      const matchId = clean(b.matchId, 40);
      await sb.from("pool_matches").update({ p1_score: null, p2_score: null, winner_id: null, status: "pending" }).eq("id", matchId).eq("is_bye", false);
      return json({ ok: true });
    }
    // Undo the latest round (delete it + its matches).
    if (action === "deleteLastRound") {
      const runId = clean(b.runId, 40);
      const { data: rounds } = await sb.from("pool_rounds").select("*").eq("pool_tournament_id", runId).order("ordinal", { ascending: false }).limit(1);
      const last = (rounds || [])[0];
      if (!last) return json({ error: "No rounds to undo." }, 400);
      await sb.from("pool_rounds").delete().eq("id", last.id);   // cascades its matches
      if (last.ordinal === 1) await sb.from("pool_tournaments").update({ status: "setup" }).eq("id", runId);   // back to setup
      return json({ ok: true });
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
