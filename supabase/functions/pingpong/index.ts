// Supabase Edge Function: pingpong
// No Dice ping-pong-tournament tool (kickertool replacement). A byte-for-byte copy of the
// `tournament` (pool) function, differing ONLY in that a game is first-to-11 (raceTo 11)
// and it writes to its own pingpong_* tables. One function, `action`-routed, ALL actions
// founder-gated by SEND_SECRET (the /ops "Ping Pong" screen).
//
// It READS the same booking tables (tournaments, tournament_entries) the pool tool uses —
// which the separate nodice.bar booking site fills via Stripe — and writes ONLY to its own
// pingpong_* tables. Never mutates a customer's booking.
//
// Ping pong nights are SUNDAYS from 6pm, always TEAMS (founder rule 3 Aug 2026):
// rows in `tournaments` with tournament_type='teams'. This function lists ONLY those
// (pool's `tournament` function excludes them), and the league is a single team league —
// no singles/doubles split anywhere.
//
// Slice 1: entrants. A "run" (pingpong_tournaments) links a booked night to its
// roster (pingpong_participants), auto-synced from the paid entries; the founder can add
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

// ── Email (Resend) — voucher confirmations to winners (reuses the rota pattern) ──
const RESEND = Deno.env.get("RESEND_API_KEY");
const esc = (s: unknown) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" } as Record<string, string>)[c]);
async function sendMail(to: string, subject: string, html: string) {
  if (!RESEND || !to) return false;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "No Dice <elliot@nodice.bar>", to, subject, html }),
    });
    return true;
  } catch (_) { return false; }
}
const gbp = (pence: number) => "£" + (pence / 100).toFixed(pence % 100 ? 2 : 0);
const voucherEmail = (name: string, place: number, amount: number, code: string, tournName: string) => {
  const ord = place === 1 ? "1st" : place === 2 ? "2nd" : "3rd";
  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#0b0713;color:#fff;padding:28px;border-radius:14px;max-width:560px;margin:auto;border:1px solid #2a1e3f">
    <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#A855F7;margin:0 0 14px">No Dice · Ping Pong</p>
    <h1 style="font-size:24px;margin:0 0 6px">${medal} ${ord} place — nice one, ${esc(name)}!</h1>
    <p style="font-size:15px;line-height:1.6;color:#ddd">You finished <strong style="color:#fff">${ord}</strong> at <strong style="color:#fff">${esc(tournName)}</strong>. Here's your <strong style="color:#A855F7">${gbp(amount)} bar tab</strong> — on us.</p>
    <div style="margin:20px 0;padding:16px;border:1px dashed #A855F7;border-radius:12px;text-align:center;background:#160e24">
      <div style="font-size:12px;color:#b79ae0;text-transform:uppercase;letter-spacing:.1em">Your voucher</div>
      <div style="font-size:30px;font-weight:800;color:#fff;margin:4px 0">${gbp(amount)}</div>
      <div style="font-size:18px;font-weight:700;letter-spacing:.14em;color:#A855F7">${code}</div>
    </div>
    <p style="font-size:13px;line-height:1.6;color:#aaa">Show this email at the bar to redeem. Valid on your next visit.</p>
    <p style="font-size:11px;color:#777;margin-top:18px">No Dice · 407 Mentmore Terrace, London Fields, E8 3PH</p>
  </div>`;
};
const bookingEmail = (name: string, tournName: string, dateStr: string) =>
  `<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#0b0713;color:#fff;padding:28px;border-radius:14px;max-width:560px;margin:auto;border:1px solid #2a1e3f">
    <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#A855F7;margin:0 0 14px">No Dice · Ping Pong</p>
    <h1 style="font-size:24px;margin:0 0 8px">You're in, ${esc(name)}! 🏓</h1>
    <p style="font-size:15px;line-height:1.6;color:#ddd">Your spot in <strong style="color:#fff">${esc(tournName)}</strong> on <strong style="color:#fff">${esc(dateStr)}</strong> is confirmed. Turn up, check in at the bar, and we'll seed you into the night.</p>
    <p style="margin:22px 0"><a href="https://nodice.bar/pingpong" style="background:#A855F7;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:700;display:inline-block">See the ping pong page</a></p>
    <p style="font-size:13px;line-height:1.6;color:#aaa">Follow the season league at <a href="https://nodice.bar/league" style="color:#C4B5FD">nodice.bar/league</a> — the top 8 seed the grand final.</p>
    <p style="font-size:11px;color:#777;margin-top:18px">No Dice · 407 Mentmore Terrace, London Fields, E8 3PH</p>
  </div>`;
function shortCode(seed: string) {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  let out = "";
  for (let i = 0; i < 6; i++) { out += A[h % 32]; h = (Math.floor(h / 32) ^ Math.imul(h, 2246822519)) >>> 0; }
  return "ND-" + out;
}

// Scoring settings (per tournament, in pingpong_tournaments.settings). Ping pong,
// founder rules 3 Aug 2026:
//   • Rounds: a game is FIRST TO 11 — but you must be 2 points clear. At 10–10 it's
//     deuce and the game runs on past 11 (12–10, 15–13, …).
//   • Knockout: first to 21, same 2-clear deuce rule (23–21, …).
//   • Final + 3rd-place playoff: ALWAYS best of 3 (each game first to 21), and a
//     3rd-place playoff is ALWAYS on.
// No draws, 1 point per win (standings Pts = wins, then points difference), byes not rated.
const DEFAULT_SETTINGS = { winPts: 1, drawPts: 1, lossPts: 0, drawsAllowed: false, rateByes: false, raceTo: 11, koRaceTo: 21, thirdPlaceMatch: true, finalBestOf3: true };

// Validate a finished ping pong game score against the deuce rule. Returns an error
// string, or null if the score is a legal final score for a first-to-`WIN` game.
function badGameScore(a: number, b: number, WIN: number): string | null {
  const hi = Math.max(a, b), lo = Math.min(a, b);
  if (hi < WIN) return `A game is first to ${WIN} — the winner needs at least ${WIN} points.`;
  if ((hi === WIN && lo > WIN - 2) || (hi > WIN && hi - lo !== 2))
    return `From ${WIN - 1}–${WIN - 1} it's deuce — the winner must finish exactly 2 points clear (e.g. ${WIN + 4}–${WIN + 2}).`;
  return null;
}
const settingsOf = (run: any) => ({ ...DEFAULT_SETTINGS, ...(run?.settings || {}) });

// Best-of-3 applies ONLY to the final and the 3rd-place playoff (founder's choice) —
// both are end-of-line matches, so this never touches bracket advancement.
// A match is the final if it's in the last bracket round and isn't the 3rd-place match.
function isBestOf3Match(m: any, allBracket: any[], s: any): boolean {
  if (!s.finalBestOf3 || m.bracket_round == null) return false;
  if (m.is_third_place) return true;
  const rounds = Math.max(...allBracket.map((x: any) => x.bracket_round));
  return m.bracket_round === rounds && !m.is_third_place;
}
// Tally games won from a games array [{p1,p2},...]; a game counts only when it has a
// clear winner. Returns {p1, p2} games won and whether the match is decided (first to 2).
function tallyGames(games: any[]): { p1: number; p2: number; decided: boolean; winnerSide: 1 | 2 | null } {
  let p1 = 0, p2 = 0;
  for (const g of games || []) {
    const a = Number(g?.p1), b = Number(g?.p2);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) continue;
    if (a > b) p1++; else p2++;
    if (p1 >= 2 || p2 >= 2) break;   // first to 2 — ignore anything after it's decided
  }
  const decided = p1 >= 2 || p2 >= 2;
  return { p1, p2, decided, winnerSide: p1 >= 2 ? 1 : p2 >= 2 ? 2 : null };
}

// Live standings from the ROUNDS matches only (bracket matches excluded). Ranked by
// points → frame difference → frames for → Buchholz (sum of opponents' points) → name.
// All integer maths — no floats (float rounding mis-sorts tables).
function computeStandings(participants: any[], matches: any[], settings: any) {
  const st: Record<string, any> = {};
  for (const p of participants) if (p.active) st[p.id] = { id: p.id, name: p.display_name, seed: p.seed, played: 0, won: 0, drawn: 0, lost: 0, for: 0, against: 0, byes: 0, pts: 0, opps: [] as string[] };
  for (const m of matches) {
    if (m.status !== "done" || !m.round_id) continue;   // only completed round matches
    if (m.is_bye) {   // byes: rated (a win) only if the setting is on — kickertool's default is off
      const s = st[m.p1_id]; if (s) { s.byes++; if (settings.rateByes) { s.played++; s.won++; s.pts += settings.winPts; } }
      continue;
    }
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

// Swiss (Monrad) pairing with a NO-REMATCH guarantee (founder rule 5 Aug 2026):
// never pair two players who have already met if ANY rematch-free pairing of the
// whole field exists — so 8 teams over 7 rounds is a full round-robin with no
// duplicated games. The old greedy top-down walk could corner itself (pair the
// top two, leaving two at the bottom who had already met) even when a clean
// pairing existed. This version BACKTRACKS over the whole field, trying
// nearest-ranked partners first so pairings stay Swiss-flavoured, and only if
// no rematch-free pairing exists at all (more rounds than opponents) does it
// fall back to the fewest possible rematches. Odd field -> bye to the
// lowest-ranked player who hasn't had one, but if that bye choice forces a
// rematch it walks up the table for a bye that doesn't.
function pairSwiss(standings: any[], matches: any[]) {
  const played = new Set<string>();
  for (const m of matches) { if (m.round_id && m.p1_id && m.p2_id) { played.add(m.p1_id + "|" + m.p2_id); played.add(m.p2_id + "|" + m.p1_id); } }
  const hadBye = new Set(matches.filter((m: any) => m.is_bye).map((m: any) => m.p1_id));
  const all = standings.map((s: any) => s.id);

  // Perfect-match `ids` (standings order) using at most `allow` rematches,
  // backtracking; nearest-ranked partners tried first.
  function matchUp(ids: string[], allow: number): [string, string][] | null {
    if (!ids.length) return [];
    const a = ids[0], rest = ids.slice(1);
    for (let j = 0; j < rest.length; j++) {
      const b = rest[j];
      const cost = played.has(a + "|" + b) ? 1 : 0;
      if (cost > allow) continue;
      const sub = matchUp(rest.filter((_, k) => k !== j), allow - cost);
      if (sub) return [[a, b], ...sub];
    }
    return null;
  }

  // Bye candidates: bottom-up among those without a bye, then (if everyone has
  // had one) bottom-up regardless. Even field -> single "no bye" candidate.
  const byeCandidates: (string | null)[] = [];
  if (all.length % 2 === 1) {
    for (let i = all.length - 1; i >= 0; i--) if (!hadBye.has(all[i])) byeCandidates.push(all[i]);
    for (let i = all.length - 1; i >= 0; i--) if (hadBye.has(all[i])) byeCandidates.push(all[i]);
  } else byeCandidates.push(null);

  // Escalate the rematch budget from 0 so a clean pairing always wins.
  for (let allow = 0; allow <= Math.ceil(all.length / 2); allow++) {
    for (const byeId of byeCandidates) {
      const pool = byeId ? all.filter((x: string) => x !== byeId) : all;
      const pairs = matchUp(pool, allow);
      if (pairs) return { pairs, byeId: byeId ?? null };
    }
  }
  return { pairs: [] as [string, string][], byeId: null };   // unreachable with >= 2 players
}

// Load a run's roster + rounds + matches + live standings in one go.
async function loadRun(sb: any, run: any) {
  const [{ data: participants }, { data: rounds }, { data: matches }] = await Promise.all([
    sb.from("pingpong_participants").select("*").eq("pingpong_tournament_id", run.id).order("created_at"),
    sb.from("pingpong_rounds").select("*").eq("pingpong_tournament_id", run.id).order("ordinal"),
    sb.from("pingpong_matches").select("*").eq("pingpong_tournament_id", run.id).order("created_at"),
  ]);
  const standings = computeStandings(participants || [], matches || [], settingsOf(run));
  const placings = computePlacings(matches || [], standings);
  return { participants: participants || [], rounds: rounds || [], matches: matches || [], standings, placings };
}

// Create the next round's matches (Swiss). Guards that the current round is fully scored.
async function generateRound(sb: any, run: any) {
  const { participants, rounds, matches, standings } = await loadRun(sb, run);
  const active = participants.filter((p: any) => p.active);
  if (active.length < 2) return { error: "Need at least 2 entrants." };
  const lastRound = rounds[rounds.length - 1];
  // 2026-07-30 — founder direction: allow adding another round even when the
  // current round has unfinished matches. Pairings for the new round are based
  // on standings-so-far (unfinished matches simply don't contribute yet).
  const ordinal = (lastRound?.ordinal || 0) + 1;
  // Round 1 has no standings yet — pair by sign-up order; later rounds pair on standings.
  const order = ordinal === 1 ? active.map((p: any) => ({ id: p.id, name: p.display_name })) : standings;
  const { pairs, byeId } = pairSwiss(order, matches);
  const { data: round, error: rErr } = await sb.from("pingpong_rounds").insert({ pingpong_tournament_id: run.id, ordinal, status: "active" }).select("*").single();
  if (rErr) return { error: rErr.message };
  let slot = 1;
  for (const [a, bId] of pairs) await sb.from("pingpong_matches").insert({ pingpong_tournament_id: run.id, round_id: round.id, slot: slot++, p1_id: a, p2_id: bId, status: "pending" });
  if (byeId) await sb.from("pingpong_matches").insert({ pingpong_tournament_id: run.id, round_id: round.id, slot: slot++, p1_id: byeId, p2_id: null, is_bye: true, winner_id: byeId, status: "done", p1_score: 0, p2_score: 0 });
  // Immediately assign the two physical tables (T1 / T2) to the earliest ready
  // matches so staff know where to send each pair.
  await reassignTables(sb, run.id);
  return { round };
}

// ── Physical table assignment ────────────────────────────────────────────────
// The venue has TWO tables. Each match sits at exactly one of them while
// it's being played; freeing the table (match done) lets the next pending
// match take it — but a PLAYER can only be at one table at a time (live-night
// fix 5 Aug 2026: with several rounds open at once, the same pair was being
// offered a second table for their next-round match while still mid-game).
//
// Two passes, both in stage order (earliest Swiss round → bracket, by ordinal —
// the old code compared a round's uuid against a number, so the order among
// open rounds was luck):
//   1. Audit current holders — a match keeps its table only if the table isn't
//      double-booked and neither of its players is already at an earlier table;
//      conflicting later matches release theirs.
//   2. Hand free tables to the earliest ready match whose players are BOTH free.
//
// Called after every state change: new round, score entered, score cleared,
// bracket generated. Idempotent — safe to call multiple times.
async function reassignTables(sb: any, runId: string) {
  const TABLES = [1, 2];
  const [{ data: matches }, { data: rounds }] = await Promise.all([
    sb.from("pingpong_matches")
      .select("id, status, table_number, round_id, slot, bracket_round, is_bye, p1_id, p2_id")
      .eq("pingpong_tournament_id", runId),
    sb.from("pingpong_rounds").select("id, ordinal").eq("pingpong_tournament_id", runId),
  ]);
  if (!matches) return;
  const ordinalOf: Record<string, number> = {};
  for (const r of rounds || []) ordinalOf[r.id] = r.ordinal ?? 0;
  const stageRank = (m: any) => m.round_id != null ? (ordinalOf[m.round_id] ?? 0) : 10000 + (m.bracket_round ?? 0);
  const cmp = (a: any, b: any) => (stageRank(a) - stageRank(b)) || ((a.slot ?? 0) - (b.slot ?? 0));
  const live = (matches as any[]).filter((m) => !m.is_bye && m.status !== "done");

  // Pass 1 — audit who's holding tables, earliest stage first.
  const busy = new Set<string>();      // players currently mid-game at a table
  const occupied = new Set<number>();  // tables in use
  for (const m of live.filter((x) => x.table_number != null).sort(cmp)) {
    const clash = occupied.has(m.table_number) ||
      (m.p1_id && busy.has(m.p1_id)) || (m.p2_id && busy.has(m.p2_id));
    if (clash) {
      await sb.from("pingpong_matches").update({ table_number: null }).eq("id", m.id);
      m.table_number = null;
    } else {
      occupied.add(m.table_number);
      if (m.p1_id) busy.add(m.p1_id);
      if (m.p2_id) busy.add(m.p2_id);
    }
  }

  // Pass 2 — free tables go to the earliest playable match whose players are free.
  const free = TABLES.filter((t) => !occupied.has(t));
  if (!free.length) return;
  const needy = live
    .filter((m) => m.table_number == null && m.p1_id && m.p2_id)
    .sort(cmp);
  for (const m of needy) {
    if (!free.length) break;
    if (busy.has(m.p1_id) || busy.has(m.p2_id)) continue;   // player already mid-game
    const t = free.shift()!;
    await sb.from("pingpong_matches").update({ table_number: t }).eq("id", m.id);
    occupied.add(t);
    busy.add(m.p1_id);
    busy.add(m.p2_id);
  }
}

// ── Knockout bracket (single elimination) ────────────────────────────────────
// Standard seeding order for a bracket of `size` (power of 2): keeps top seeds apart
// (1 & 2 meet only in the final). seedOrder(8) = [1,8,4,5,2,7,3,6].
function seedOrder(size: number): number[] {
  let pls = [1, 2];
  while (pls.length < size) {
    const sum = pls.length * 2 + 1;
    const next: number[] = [];
    for (const p of pls) { next.push(p); next.push(sum - p); }
    pls = next;
  }
  return pls;
}
// Build the whole single-elim tree from the standings order (seed 1 = top of standings).
// Byes fill up to the next power of two and auto-advance the seeded player.
async function generateBracket(sb: any, run: any, standings: any[], thirdPlace: boolean) {
  const N = standings.length;
  if (N < 2) return { error: "Need at least 2 players for a knockout." };
  let size = 2; while (size < N) size *= 2;
  const rounds = Math.round(Math.log2(size));
  const order = seedOrder(size);
  const bySeed = (seed: number) => (seed <= N ? standings[seed - 1].id : null);
  const idByRS: Record<string, string> = {};
  // Insert from the final backwards so each match knows the match it feeds into.
  for (let r = rounds; r >= 1; r--) {
    const count = size / Math.pow(2, r);
    for (let slot = 0; slot < count; slot++) {
      const next_match_id = r < rounds ? idByRS[`${r + 1}:${Math.floor(slot / 2)}`] : null;
      const next_slot = r < rounds ? (slot % 2) + 1 : null;
      let p1: string | null = null, p2: string | null = null, isBye = false, winner: string | null = null, status = "pending";
      if (r === 1) {
        p1 = bySeed(order[2 * slot]); p2 = bySeed(order[2 * slot + 1]);
        if (p1 && !p2) { isBye = true; winner = p1; status = "done"; }
        else if (!p1 && p2) { p1 = p2; p2 = null; isBye = true; winner = p1; status = "done"; }
      }
      const { data: m } = await sb.from("pingpong_matches").insert({
        pingpong_tournament_id: run.id, bracket_round: r, bracket_slot: slot,
        p1_id: p1, p2_id: p2, is_bye: isBye, winner_id: winner, status, next_match_id, next_slot,
      }).select("id").single();
      idByRS[`${r}:${slot}`] = m!.id;
    }
  }
  // Cascade round-1 bye winners forward into their next match's slot.
  const { data: r1 } = await sb.from("pingpong_matches").select("*").eq("pingpong_tournament_id", run.id).eq("bracket_round", 1);
  for (const m of r1 || []) if (m.status === "done" && m.winner_id && m.next_match_id) {
    await sb.from("pingpong_matches").update({ [`p${m.next_slot}_id`]: m.winner_id }).eq("id", m.next_match_id);
  }
  // Optional 3rd-place match (fed by the two semi-final losers when they're known).
  if (thirdPlace && rounds >= 2) {
    await sb.from("pingpong_matches").insert({ pingpong_tournament_id: run.id, bracket_round: rounds, bracket_slot: 1, is_third_place: true, status: "pending" });
  }
  await sb.from("pingpong_tournaments").update({ status: "knockout", updated_at: new Date().toISOString() }).eq("id", run.id);
  return { size, rounds };
}

// Final 1st / 2nd / 3rd from a completed bracket. 3rd = the 3rd-place-match winner if
// there is one, else the better-standing beaten semi-finalist (kickertool's default).
function computePlacings(matches: any[], standings: any[]) {
  const br = matches.filter((m) => m.bracket_round != null && !m.is_third_place);
  if (!br.length) return null;
  const rounds = Math.max(...br.map((m) => m.bracket_round));
  const final = br.find((m) => m.bracket_round === rounds && m.bracket_slot === 0);
  if (!final || final.status !== "done" || !final.winner_id) return null;
  const first = final.winner_id;
  const second = final.winner_id === final.p1_id ? final.p2_id : final.p1_id;
  const semis = br.filter((m) => m.bracket_round === rounds - 1 && m.status === "done");
  const semiLosers = semis.map((m) => (m.winner_id === m.p1_id ? m.p2_id : m.p1_id)).filter(Boolean);
  const tpm = matches.find((m) => m.is_third_place);
  let third: string | null = null;
  if (tpm && tpm.status === "done") third = tpm.winner_id;
  else { const rank: Record<string, number> = {}; standings.forEach((s, i) => (rank[s.id] = i)); third = [...semiLosers].sort((a, b) => (rank[a] ?? 99) - (rank[b] ?? 99))[0] || null; }
  return { first, second, third };
}

// Placings are only final when the final is decided AND (if a 3rd-place playoff exists) it's
// also decided — so we don't issue/email the £10 to a fallback semi-finalist prematurely.
function placingsComplete(matches: any[]): boolean {
  const br = (matches || []).filter((m) => m.bracket_round != null);
  if (!br.length) return false;
  const rounds = Math.max(...br.map((m) => m.bracket_round));
  const final = br.find((m) => m.bracket_round === rounds && !m.is_third_place);
  if (!final || final.status !== "done" || !final.winner_id) return false;
  const tpm = br.find((m) => m.is_third_place);
  if (tpm && (tpm.status !== "done" || !tpm.winner_id)) return false;
  return true;
}
// After any bracket result changes: finish + issue vouchers once placings are locked; reconcile
// if a corrected result changed them; reopen a finished night that's no longer complete.
async function settleRun(sb: any, runId: string) {
  const { data: run } = await sb.from("pingpong_tournaments").select("*").eq("id", runId).maybeSingle();
  if (!run) return;
  const { data: matches } = await sb.from("pingpong_matches").select("*").eq("pingpong_tournament_id", runId).not("bracket_round", "is", null);
  const complete = placingsComplete(matches || []);
  if (complete) {
    if (run.status !== "done") await sb.from("pingpong_tournaments").update({ status: "done", updated_at: new Date().toISOString() }).eq("id", runId);
    const { data: dr } = await sb.from("pingpong_tournaments").select("*").eq("id", runId).maybeSingle();
    if (dr) await finalizeTournament(sb, dr);
  } else if (run.status === "done") {
    await sb.from("pingpong_tournaments").update({ status: "knockout", updated_at: new Date().toISOString() }).eq("id", runId);
  }
}

const VOUCHER_PENCE: Record<number, number> = { 1: 3000, 2: 2000, 3: 1000 };   // £30 / £20 / £10 per placing
// Both booking emails for a participant — captain + partner (doubles collect two,
// founder rule 6 Aug 2026). Walk-ins have neither.
const emailsForParticipant = async (sb: any, p: any): Promise<{ captain: string | null; partner: string | null }> => {
  if (!p?.entry_id) return { captain: null, partner: null };
  const { data: e } = await sb.from("tournament_entries").select("captain_email, partner_email").eq("id", p.entry_id).maybeSingle();
  return { captain: e?.captain_email || null, partner: e?.partner_email || null };
};
// Create/reconcile the 1st/2nd/3rd voucher records + email ticket-holders.
//
// SINGLES: one voucher per place, full amount, to the booking email.
// DOUBLES (founder rule 6 Aug 2026): the tab SPLITS — two vouchers per place at
// half the amount each (recipient 1 → captain's email, recipient 2 → partner's),
// so each player gets their own prize email and can spend it separately. Teams
// entered as walk-ins split too — both halves handed out at the bar.
//
// Legacy guard: vouchers issued before the split rule keep their full amount —
// re-running finalize never rewrites an existing voucher's value or bolts a
// second half onto a legacy full one. A corrected result still repoints the
// voucher(s) and clears the emailed flag so the right winners get emailed.
async function finalizeTournament(sb: any, run: any) {
  const { participants, placings } = await loadRun(sb, run);
  if (!placings) return { error: "Not finished yet." };
  const { data: t } = await sb.from("tournaments").select("name, tournament_type").eq("id", run.tournament_id).maybeSingle();
  const tournName = t?.name || "the No Dice ping pong tournament";
  const effType = run.discipline_override || t?.tournament_type;
  const split = effType === "doubles" || effType === "teams";
  const byId: Record<string, any> = {}; for (const p of participants) byId[p.id] = p;
  const vouchers: any[] = [];
  for (const place of [1, 2, 3]) {
    const pid = place === 1 ? placings.first : place === 2 ? placings.second : placings.third;
    if (!pid) continue;
    const p = byId[pid];
    const emails = await emailsForParticipant(sb, p);
    const { data: existing } = await sb.from("pingpong_vouchers").select("*").eq("pingpong_tournament_id", run.id).eq("place", place).order("recipient");
    const legacyFull = split && (existing || []).some((x: any) => (x.recipient ?? 1) === 1 && x.amount_pence === VOUCHER_PENCE[place]);
    const shares = (split && !legacyFull)
      ? [{ recipient: 1, amount: VOUCHER_PENCE[place] / 2, email: emails.captain },
         { recipient: 2, amount: VOUCHER_PENCE[place] / 2, email: emails.partner }]
      : [{ recipient: 1, amount: VOUCHER_PENCE[place], email: emails.captain }];
    for (const sh of shares) {
      let v = (existing || []).find((x: any) => (x.recipient ?? 1) === sh.recipient) || null;
      if (!v) {
        const ins = await sb.from("pingpong_vouchers").insert({
          pingpong_tournament_id: run.id, participant_id: pid, place, recipient: sh.recipient,
          amount_pence: sh.amount, code: shortCode(run.id + place + ":" + sh.recipient),
          display_name: p?.display_name || null, email: sh.email,
        }).select("*").single();
        v = ins.data;
      } else if (v.participant_id !== pid) {
        // A corrected result changed who placed here — repoint and re-email the right person.
        const upd = await sb.from("pingpong_vouchers").update({ participant_id: pid, display_name: p?.display_name || null, email: sh.email, emailed_at: null }).eq("id", v.id).select("*").single();
        v = upd.data;
      }
      if (v && v.email && !v.emailed_at) {
        const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
        const sent = await sendMail(v.email, `${medal} You won ${gbp(v.amount_pence)} at No Dice ping pong!`, voucherEmail(v.display_name || "", place, v.amount_pence, v.code, tournName));
        if (sent) { await sb.from("pingpong_vouchers").update({ emailed_at: new Date().toISOString() }).eq("id", v.id); v.emailed_at = new Date().toISOString(); }
      }
      if (v) vouchers.push(v);
    }
  }
  return { vouchers };
}

// The live league for a discipline: aggregate every finished night (excluding season
// finals). Points: 1st 5 · 2nd 4 · 3rd 3 · show-up 1 · top of the rounds table +1.
// Tiebreak on cumulative season goal/frame difference. Top 8 qualify for the grand final.
//
// Skips any participant whose slot was mid-tournament replaced (league_null=true) —
// the original player earns nothing from that night, and the replacement doesn't
// get league credit for a partial-attendance run either (founder rule 2026-07-30).
async function computeLeague(sb: any, discipline: string) {
  const { data: runs } = await sb.from("pingpong_tournaments").select("*, tournaments(name,event_date,tournament_type)").eq("status", "done");
  // discipline_override lets the founder re-classify a night mid-run (e.g. a
  // doubles night played as singles because not enough teams showed up).
  // When set, this night's points accrue to the OTHER league.
  const effectiveType = (r: any) => r.discipline_override || (r.tournaments && r.tournaments.tournament_type);
  const relevant = (runs || []).filter((r: any) => r.tournaments && effectiveType(r) === discipline && !/season final/i.test(r.tournaments.name || ""));
  relevant.sort((a: any, b: any) => String(a.tournaments.event_date).localeCompare(String(b.tournaments.event_date)));
  const table: Record<string, any> = {};
  for (const run of relevant) {
    const { participants, standings, placings } = await loadRun(sb, run);
    const nulled = new Set((participants as any[]).filter((p) => p.league_null).map((p) => p.id));
    const nameById: Record<string, string> = {}; for (const p of participants) nameById[p.id] = p.display_name;
    const keyOf = (id: string) => (nameById[id] || "").trim().toLowerCase();
    const ensure = (id: string) => { if (nulled.has(id)) return null; const k = keyOf(id); if (!k) return null; const e = (table[k] ||= { key: k, name: nameById[id], pts: 0, frameDiff: 0, nights: 0, wins: 0, seconds: 0, thirds: 0 }); e.name = nameById[id]; return e; };
    for (const p of participants.filter((p: any) => p.active && !p.league_null)) { const e = ensure(p.id); if (e) { e.pts += 1; e.nights += 1; } }
    for (const s of standings) { if (nulled.has(s.id)) continue; const e = table[keyOf(s.id)]; if (e) e.frameDiff += s.diff; }
    if (standings[0] && !nulled.has(standings[0].id)) { const e = table[keyOf(standings[0].id)]; if (e) e.pts += 1; }
    if (placings) {
      const add = (pid: string | null, pts: number, f: string) => { if (!pid || nulled.has(pid)) return; const e = table[keyOf(pid)]; if (e) { e.pts += pts; e[f]++; } };
      add(placings.first, 5, "wins"); add(placings.second, 4, "seconds"); add(placings.third, 3, "thirds");
    }
  }
  const arr = (Object.values(table) as any[]).sort((a, b) => b.pts - a.pts || b.frameDiff - a.frameDiff || String(a.name).localeCompare(String(b.name))).map((r, i) => ({ ...r, rank: i + 1, qualifies: i < 8 }));
  return { discipline, nights: relevant.length, table: arr };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {};
  try { b = await req.json(); } catch { /* empty */ }
  const action = b.action as string;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const isAdmin = () => b.secret && b.secret === Deno.env.get("SEND_SECRET");

  // ── Public reads (no secret — the nodice.bar site + bar-TV pages call these) ──
  try {
    if (action === "getLeague") {
      // Ping pong has ONE league: teams. The discipline param is ignored (kept for
      // backward-compat with older frontends that still send singles/doubles).
      return json({ ok: true, ...(await computeLeague(sb, "teams")) });
    }
  } catch (e) { return json({ error: String((e as any)?.message || e) }, 500); }

  if (!isAdmin()) return json({ error: "unauthorized" }, 401);

  try {
    // The ping pong nights to run: Sunday team nights only (tournament_type='teams') +
    // their paid count, cap, and run status. Pool's singles/doubles nights are excluded.
    if (action === "list") {
      const [{ data: tourns }, { data: paid }, { data: runs }] = await Promise.all([
        sb.from("tournaments").select("id,name,event_date,start_time,tournament_type,max_teams,bookable,registration_open").eq("tournament_type", "teams").order("event_date", { ascending: true }),
        sb.from("tournament_entries").select("tournament_id").eq("status", "paid"),
        sb.from("pingpong_tournaments").select("id,tournament_id,status"),
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

      let { data: run } = await sb.from("pingpong_tournaments").select("*").eq("tournament_id", tournamentId).maybeSingle();
      if (!run) {
        const ins = await sb.from("pingpong_tournaments").insert({ tournament_id: tournamentId }).select("*").single();
        if (ins.error) return json({ error: ins.error.message }, 400);
        run = ins.data;
      }

      // Sync: add each PAID entry that isn't already a participant (by entry_id).
      const { data: entries } = await sb.from("tournament_entries").select("id,team_name,captain_name").eq("tournament_id", tournamentId).eq("status", "paid").order("paid_at");
      const { data: existing } = await sb.from("pingpong_participants").select("*").eq("pingpong_tournament_id", run.id);
      const haveEntryIds = new Set((existing || []).filter((p: any) => p.entry_id).map((p: any) => p.entry_id));
      const toAdd = (entries || [])
        .filter((e: any) => !haveEntryIds.has(e.id))
        .map((e: any) => ({ pingpong_tournament_id: run.id, entry_id: e.id, display_name: clean(e.team_name) || clean(e.captain_name) || "Player", source: "ticket" }));
      // Only sync new paid entries while still setting up — once rounds start the field is locked.
      if (run.status === "setup") for (const row of toAdd) { await sb.from("pingpong_participants").insert(row); }

      const data = await loadRun(sb, run);
      const { data: vouchers } = await sb.from("pingpong_vouchers").select("*").eq("pingpong_tournament_id", run.id).order("place");
      return json({
        ok: true,
        tournament: { id: t.id, name: t.name, event_date: t.event_date, start_time: t.start_time, type: t.tournament_type, cap: t.max_teams || 12 },
        run, paidCount: (entries || []).length, ...data, vouchers: vouchers || [],
      });
    }

    // Start the rounds phase: locks the field and generates round 1. Needs ≥ 2 players.
    if (action === "startRounds") {
      const runId = clean(b.runId, 40);
      const { data: run } = await sb.from("pingpong_tournaments").select("*").eq("id", runId).maybeSingle();
      if (!run) return json({ error: "Run not found." }, 404);
      const { participants, rounds } = await loadRun(sb, run);
      const active = participants.filter((p: any) => p.active);
      if (active.length < 2) return json({ error: "Need at least 2 entrants to start." }, 400);
      if (rounds.length > 0) return json({ error: "Rounds already started." }, 400);
      await sb.from("pingpong_tournaments").update({ status: "rounds", updated_at: new Date().toISOString() }).eq("id", runId);
      const gen = await generateRound(sb, { ...run, status: "rounds" });
      if (gen.error) return json({ error: gen.error }, 400);
      return json({ ok: true, round: gen.round });
    }

    // Generate the next round (Swiss). Requires the current round to be fully scored.
    if (action === "generateNextRound") {
      const runId = clean(b.runId, 40);
      const { data: run } = await sb.from("pingpong_tournaments").select("*").eq("id", runId).maybeSingle();
      if (!run) return json({ error: "Run not found." }, 404);
      const gen = await generateRound(sb, run);
      if (gen.error) return json({ error: gen.error }, 400);
      return json({ ok: true, round: gen.round });
    }

    // Enter / correct a match score. Rounds + most bracket matches are one game (winner =
    // higher score). The final + 3rd-place playoff can be best-of-3 (frontend sends `games`).
    if (action === "enterScore") {
      const matchId = clean(b.matchId, 40);
      const { data: m } = await sb.from("pingpong_matches").select("*").eq("id", matchId).maybeSingle();
      if (!m) return json({ error: "Match not found." }, 404);
      if (m.is_bye) return json({ error: "That's a bye — no score to enter." }, 400);
      const isBracket = m.bracket_round != null;
      if (isBracket && (!m.p1_id || !m.p2_id)) return json({ error: "This match is waiting on an earlier result." }, 400);
      const { data: run } = await sb.from("pingpong_tournaments").select("*").eq("id", m.pingpong_tournament_id).maybeSingle();
      const s = settingsOf(run);
      const { data: allBr } = isBracket
        ? await sb.from("pingpong_matches").select("*").eq("pingpong_tournament_id", m.pingpong_tournament_id).not("bracket_round", "is", null)
        : { data: [] as any[] };
      const rounds = (allBr && allBr.length) ? Math.max(...allBr.map((x: any) => x.bracket_round)) : 0;
      const isFinal = isBracket && m.bracket_round === rounds && !m.is_third_place;

      // ── Best-of-3 (final / 3rd-place only): games:[{p1,p2},...], first to win 2.
      //    Each game is first to koRaceTo (21) with the deuce rule. ──
      if (isBestOf3Match(m, allBr || [], s)) {
        if (!Array.isArray(b.games)) return json({ error: "This match is best-of-3 — enter each game." }, 400);
        const games = (b.games as any[]).slice(0, 3).map((g) => ({
          p1: Math.max(0, Math.min(99, parseInt(String(g?.p1)) || 0)),
          p2: Math.max(0, Math.min(99, parseInt(String(g?.p2)) || 0)),
        }));
        const KO = s.koRaceTo || 21;
        for (const g of games) {
          if (g.p1 === g.p2) return json({ error: "Each game needs a winner — no tied games." }, 400);
          const bad = badGameScore(g.p1, g.p2, KO);
          if (bad) return json({ error: bad }, 400);
        }
        const t = tallyGames(games);
        const winner = t.winnerSide === 1 ? m.p1_id : t.winnerSide === 2 ? m.p2_id : null;
        // Store games; p1_score/p2_score hold GAMES won (e.g. 2–1) for display — standings &
        // league read round matches only, so this never affects frame difference.
        // Free the table when the match is decided so the next pending match can take it.
        const patch: any = { games, p1_score: t.p1, p2_score: t.p2, winner_id: winner, status: t.decided ? "done" : "active" };
        if (t.decided) patch.table_number = null;
        const { error } = await sb.from("pingpong_matches").update(patch).eq("id", matchId);
        if (error) return json({ error: error.message }, 400);
        await settleRun(sb, m.pingpong_tournament_id);   // finish + vouchers once the final AND (any) 3rd-place are decided
        if (t.decided) await reassignTables(sb, m.pingpong_tournament_id);
        return json({ ok: true });
      }

      // ── Single game (rounds + regular bracket matches) ──
      // Rounds are first to 11, bracket matches first to 21 — both with the deuce rule
      // (win by 2 past WIN−1 apiece), so scores above the target are legal (15–13).
      const p1 = Math.max(0, Math.min(99, parseInt(String(b.p1_score)) || 0));
      const p2 = Math.max(0, Math.min(99, parseInt(String(b.p2_score)) || 0));
      if (p1 === p2 && (isBracket || !s.drawsAllowed)) return json({ error: "Needs a winner — a tie isn't allowed here. Adjust the score." }, 400);
      const WIN = isBracket ? (s.koRaceTo || 21) : (s.raceTo || 11);
      const bad = badGameScore(p1, p2, WIN);
      if (bad) return json({ error: bad }, 400);
      const winner = p1 > p2 ? m.p1_id : p2 > p1 ? m.p2_id : null;
      // Free the table this match was on — reassignTables below will hand it
      // to the next ready pending match.
      const { error } = await sb.from("pingpong_matches").update({ p1_score: p1, p2_score: p2, winner_id: winner, status: "done", table_number: null }).eq("id", matchId);
      if (error) return json({ error: error.message }, 400);
      // Bracket: push the winner into the next match, then feed the 3rd-place match.
      if (isBracket && winner) {
        if (m.next_match_id && m.next_slot) await sb.from("pingpong_matches").update({ [`p${m.next_slot}_id`]: winner }).eq("id", m.next_match_id);
        const tpm = (allBr || []).find((x: any) => x.is_third_place);
        if (tpm && m.bracket_round === rounds - 1) {
          // allBr was read before this semi was marked done — patch in its fresh result so both
          // semis are seen as complete and the 3rd-place match gets its two losers.
          const semis = (allBr || []).map((x: any) => (x.id === m.id ? { ...x, status: "done", winner_id: winner } : x))
            .filter((x: any) => x.bracket_round === rounds - 1 && !x.is_third_place && x.status === "done");
          if (semis.length === 2) await sb.from("pingpong_matches").update({ p1_id: semis[0].winner_id === semis[0].p1_id ? semis[0].p2_id : semis[0].p1_id, p2_id: semis[1].winner_id === semis[1].p1_id ? semis[1].p2_id : semis[1].p1_id }).eq("id", tpm.id);
        }
        await settleRun(sb, m.pingpong_tournament_id);   // finish + vouchers once the final AND (any) 3rd-place are decided
      }
      await reassignTables(sb, m.pingpong_tournament_id);   // freed table flows to the next pending match
      return json({ ok: true });
    }
    // Reopen a match. For a bracket match, also un-advance the winner from the next slot.
    if (action === "clearScore") {
      const matchId = clean(b.matchId, 40);
      const { data: m } = await sb.from("pingpong_matches").select("*").eq("id", matchId).maybeSingle();
      if (!m || m.is_bye) return json({ ok: true });
      await sb.from("pingpong_matches").update({ p1_score: null, p2_score: null, games: null, winner_id: null, status: "pending", table_number: null }).eq("id", matchId);
      if (m.bracket_round != null && m.winner_id && m.next_match_id && m.next_slot) {
        await sb.from("pingpong_matches").update({ [`p${m.next_slot}_id`]: null, p1_score: null, p2_score: null, games: null, winner_id: null, status: "pending", table_number: null }).eq("id", m.next_match_id);
      }
      // Clearing a bracket result may drop the night out of "complete" — reopen it if so.
      if (m.bracket_round != null) await settleRun(sb, m.pingpong_tournament_id);
      // Reopened match may pick up a free table.
      await reassignTables(sb, m.pingpong_tournament_id);
      return json({ ok: true });
    }
    // Start the knockout: seed the bracket from the final rounds standings.
    if (action === "startKnockout") {
      const runId = clean(b.runId, 40);
      const { data: run } = await sb.from("pingpong_tournaments").select("*").eq("id", runId).maybeSingle();
      if (!run) return json({ error: "Run not found." }, 404);
      if (run.status === "knockout" || run.status === "done") return json({ error: "Knockout already started." }, 400);
      const { standings, matches } = await loadRun(sb, run);
      if (matches.some((m: any) => m.round_id && m.status !== "done")) return json({ error: "Finish scoring the current round first." }, 400);
      const s = settingsOf(run);
      const thirdPlace = b.thirdPlace != null ? !!b.thirdPlace : !!s.thirdPlaceMatch;
      // Knockout match length (first to N, deuce past N−1 apiece). Default 21 — founder
      // rule 3 Aug 2026. Stored as koRaceTo so the rounds' first-to-11 stays untouched.
      const koRaceTo = b.raceTo != null ? Math.min(31, Math.max(5, Math.round(Number(b.raceTo) || s.koRaceTo))) : s.koRaceTo;
      // Best-of-3 for the final + 3rd-place playoff (each game first to `koRaceTo`).
      const finalBestOf3 = b.finalBestOf3 != null ? !!b.finalBestOf3 : !!s.finalBestOf3;
      const nextSettings = { ...(run.settings || {}), thirdPlaceMatch: thirdPlace, koRaceTo, finalBestOf3 };
      // Persist the chosen knockout options so the bracket score entry & standings
      // read the right race target, and re-opens show what was picked.
      await sb.from("pingpong_tournaments").update({ settings: nextSettings }).eq("id", runId);
      const gen = await generateBracket(sb, { ...run, settings: nextSettings }, standings, thirdPlace);
      if ((gen as any).error) return json({ error: (gen as any).error }, 400);
      // Assign T1 / T2 to the first playable bracket matches.
      await reassignTables(sb, runId);
      return json({ ok: true, ...gen });
    }

    // Finish the night now / re-run voucher emails. This is the manual escape hatch: it works
    // even if a 3rd-place playoff was enabled but skipped (3rd falls back to the beaten
    // semi-finalist). Idempotent — re-running just reconciles + re-emails any missing vouchers.
    if (action === "finalize") {
      const runId = clean(b.runId, 40);
      const { data: run } = await sb.from("pingpong_tournaments").select("*").eq("id", runId).maybeSingle();
      if (!run) return json({ error: "Run not found." }, 404);
      const { placings } = await loadRun(sb, run);
      if (!placings) return json({ error: "The final isn't finished yet." }, 400);
      if (run.status !== "done") await sb.from("pingpong_tournaments").update({ status: "done", updated_at: new Date().toISOString() }).eq("id", runId);
      const { data: dr } = await sb.from("pingpong_tournaments").select("*").eq("id", runId).maybeSingle();
      const r = await finalizeTournament(sb, dr || run);
      if ((r as any).error) return json({ error: (r as any).error }, 400);
      return json({ ok: true, ...r });
    }
    // Seed a season final (grand final) from the league's top 8.
    if (action === "seedFromLeague") {
      const runId = clean(b.runId, 40);
      const { data: run } = await sb.from("pingpong_tournaments").select("*, tournaments(tournament_type)").eq("id", runId).maybeSingle();
      if (!run) return json({ error: "Run not found." }, 404);
      if (run.status !== "setup") return json({ error: "Seed the grand final before it starts." }, 400);
      const league = await computeLeague(sb, "teams");   // ping pong: one team league
      const top8 = league.table.slice(0, 8);
      const { data: existing } = await sb.from("pingpong_participants").select("display_name").eq("pingpong_tournament_id", runId);
      const have = new Set((existing || []).map((p: any) => (p.display_name || "").trim().toLowerCase()));
      let added = 0;
      for (const r of top8) { if (have.has(r.key)) continue; await sb.from("pingpong_participants").insert({ pingpong_tournament_id: runId, display_name: r.name, source: "manual", seed: r.rank }); added++; }
      return json({ ok: true, added, top8 });
    }

    // Comp / test booking — add a paid entry for a night (no charge) and email a
    // confirmation, so the founder can experience the customer side. The paid-count
    // trigger runs on UPDATE, so we touch the row after inserting to sync the count.
    if (action === "compBooking" && isAdmin()) {
      const tournamentId = clean(b.tournamentId, 40);
      const name = clean(b.name) || "Guest";
      const email = clean(b.email, 120);
      const { data: t } = await sb.from("tournaments").select("name,event_date").eq("id", tournamentId).maybeSingle();
      if (!t) return json({ error: "Tournament not found." }, 404);
      const { data: entry, error } = await sb.from("tournament_entries").insert({
        tournament_id: tournamentId, team_name: name, captain_name: name,
        captain_email: email || "", captain_phone: clean(b.phone, 30) || "",
        status: "paid", paid_at: new Date().toISOString(), notes: "Comp / test entry (added from /ops)",
      }).select("*").single();
      if (error) return json({ error: error.message }, 400);
      await sb.from("tournament_entries").update({ notes: "Comp / test entry (added from /ops)" }).eq("id", entry.id);   // fire paid-count sync
      let emailed = false;
      if (email) {
        const niceDate = new Date(t.event_date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
        emailed = await sendMail(email, `You're in — ${t.name} 🏓`, bookingEmail(name, t.name, niceDate));
      }
      return json({ ok: true, entry, emailed });
    }
    // Undo the latest round (delete it + its matches).
    if (action === "deleteLastRound") {
      const runId = clean(b.runId, 40);
      const { data: rounds } = await sb.from("pingpong_rounds").select("*").eq("pingpong_tournament_id", runId).order("ordinal", { ascending: false }).limit(1);
      const last = (rounds || [])[0];
      if (!last) return json({ error: "No rounds to undo." }, 400);
      await sb.from("pingpong_rounds").delete().eq("id", last.id);   // cascades its matches
      if (last.ordinal === 1) await sb.from("pingpong_tournaments").update({ status: "setup" }).eq("id", runId);   // back to setup
      return json({ ok: true });
    }

    // Add a walk-in (cash at the bar). Flagged source=manual so the books reconcile.
    if (action === "addManual") {
      const runId = clean(b.runId, 40);
      const name = clean(b.name);
      if (!runId || !name) return json({ error: "Enter a name." }, 400);
      const { data, error } = await sb.from("pingpong_participants").insert({ pingpong_tournament_id: runId, display_name: name, source: "manual" }).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, participant: data });
    }

    if (action === "renameParticipant") {
      const id = clean(b.participantId, 40);
      const name = clean(b.name);
      if (!id || !name) return json({ error: "Enter a name." }, 400);
      const { data, error } = await sb.from("pingpong_participants").update({ display_name: name }).eq("id", id).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, participant: data });
    }

    // Mid-tournament substitution: the player at this slot has left, someone
    // new is stepping in. Rename the slot to the replacement's name (cascades
    // to every match in the tournament via participant id) and flag the slot
    // as league_null so the ORIGINAL player earns no league points for the
    // night — per founder rule 2026-07-30. Any bar-tab voucher won by that
    // slot still goes out (this only nullifies league, not vouchers).
    if (action === "replacePlayer") {
      const id = clean(b.participantId, 40);
      const name = clean(b.name);
      if (!id || !name) return json({ error: "Enter the replacement's name." }, 400);
      const { data, error } = await sb.from("pingpong_participants")
        .update({ display_name: name, league_null: true, replaced_at: new Date().toISOString() })
        .eq("id", id).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, participant: data });
    }

    // Remove: a manual walk-in is deleted; a ticket-holder is deactivated (so the paid
    // re-sync can't silently re-add them — and it can be undone).
    if (action === "removeParticipant") {
      const id = clean(b.participantId, 40);
      const { data: p } = await sb.from("pingpong_participants").select("*").eq("id", id).maybeSingle();
      if (!p) return json({ error: "Not found." }, 404);
      if (p.source === "manual") await sb.from("pingpong_participants").delete().eq("id", id);
      else await sb.from("pingpong_participants").update({ active: false }).eq("id", id);
      return json({ ok: true });
    }
    if (action === "restoreParticipant") {
      const id = clean(b.participantId, 40);
      await sb.from("pingpong_participants").update({ active: true }).eq("id", id);
      return json({ ok: true });
    }

    // Flip THIS night's discipline (e.g. doubles → singles) so its points accrue
    // to a different league than the parent tournament's tournament_type. Founder
    // rule 2026-07-30: when a doubles night doesn't get enough teams and gets
    // played as singles, the points still count — just for the singles league.
    // Pass null to revert to the tournament's original type.
    if (action === "setDiscipline") {
      const runId = clean(b.runId, 40);
      if (!runId) return json({ error: "no run" }, 400);
      const raw = b.discipline;
      const override = raw === "singles" || raw === "doubles" ? raw : null;
      const { data, error } = await sb.from("pingpong_tournaments")
        .update({ discipline_override: override, updated_at: new Date().toISOString() })
        .eq("id", runId).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, run: data });
    }

    // Reset a run entirely (deletes the roster; the booking data is untouched).
    if (action === "deleteRun") {
      const runId = clean(b.runId, 40);
      if (!runId) return json({ error: "no run" }, 400);
      await sb.from("pingpong_tournaments").delete().eq("id", runId);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
