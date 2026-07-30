import React, { useEffect, useState } from 'react'
import {
  tournList, tournOpen, tournAddManual, tournRename, tournReplace, tournRemove, tournRestore, tournDeleteRun,
  tournStartRounds, tournNextRound, tournEnterScore, tournEnterGames, tournClearScore, tournDeleteLastRound,
  tournStartKnockout, tournGetLeague, tournFinalize, tournSeedFromLeague,
} from '../../tournament/api.js'

// ─── Pool tournaments (founder) ──────────────────────────────────────────────
// Slice 1: pick a booked pool night, see the paid entrants auto-pulled in, tidy the
// roster. Slice 2: run the Swiss rounds — draw a round, punch in scores, live standings
// (points → frame difference → Buchholz). Knockout + league land in later slices.
// Reads the live booking data; writes only to the pool_* tables.

const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33', PURPLE = '#A855F7', BLUE = '#60A5FA'
// Purple league branding across the whole tournament section (cards, borders, buttons).
const CARD = '#160e24', LINE = 'rgba(168,85,247,0.25)'
const fmtDate = (d) => d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''
const typeBadge = (t) => t === 'doubles' ? { txt: '👥 Doubles', c: PURPLE } : t === 'singles' ? { txt: '👤 Singles', c: BLUE } : { txt: t || '—', c: 'rgba(255,255,255,0.5)' }

export default function Tournament() {
  const [view, setView] = useState('list')     // 'list' | 'run'
  const [tourns, setTourns] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [run, setRun] = useState(null)          // full run state from `open`
  const [busy, setBusy] = useState(false)
  const [walkin, setWalkin] = useState('')
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [scores, setScores] = useState({})      // matchId -> { p1, p2 } in-progress score inputs
  const [gameScores, setGameScores] = useState({})   // matchId -> [{p1,p2}...] for best-of-3 matches
  const [thirdPlace, setThirdPlace] = useState(true)    // knockout: play a 3rd-place match? (founder rule 2026-07-30: always on)
  const [koRaceTo, setKoRaceTo] = useState(8)           // knockout: race to how many frames?
  const [finalBestOf3, setFinalBestOf3] = useState(true) // knockout: final + 3rd-place = best of 3?
  const [replacing, setReplacing] = useState(null)      // { participantId, oldName, newName } during mid-tournament substitution
  const [menuOpen, setMenuOpen] = useState(false)       // 2026-07-30 refactor: slide-out options drawer (☰) hosts every "action" so the main view stays focused on rounds + standings
  const [leagueView, setLeagueView] = useState(false)   // showing the season league table
  const [league, setLeague] = useState(null)
  const [leagueDisc, setLeagueDisc] = useState('singles')

  const loadList = async () => {
    setLoading(true)
    try { const r = await tournList(); setTourns(r.tournaments || []); setErr('') }
    catch (e) { setErr(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { loadList() }, [])

  const open = async (tournamentId) => {
    setBusy(true); setErr('')
    try { const r = await tournOpen(tournamentId); setRun(r); setView('run') }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const refresh = async () => { if (run) { const r = await tournOpen(run.tournament.id); setRun(r) } }
  const guard = (fn) => async (...a) => { setBusy(true); try { await fn(...a); await refresh() } catch (e) { alert(e.message) } finally { setBusy(false) } }

  const addWalkin = async () => { const name = walkin.trim(); if (!name || !run) return; await guard(async () => { await tournAddManual(run.run.id, name); setWalkin('') })() }
  const saveRename = async (id) => { const name = editVal.trim(); if (!name) { setEditing(null); return } await guard(async () => { await tournRename(id, name); setEditing(null) })() }
  const remove = async (p) => { if (p.source === 'manual' && !window.confirm(`Remove walk-in "${p.display_name}"?`)) return; await guard(() => tournRemove(p.id))() }
  const restore = (id) => guard(() => tournRestore(id))()
  // Mid-tournament substitution: cascades the new name across every match in this
  // run AND nulls the ORIGINAL player's league points for the night — see edge
  // fn `replacePlayer`. A confirmation dialog spells the trade-off out.
  const saveReplace = async () => {
    if (!replacing) return
    const name = (replacing.newName || '').trim()
    if (!name) { alert('Enter the replacement player\'s name.'); return }
    if (!window.confirm(`Replace "${replacing.oldName}" with "${name}"?\n\n· All historic matches this tournament switch to the new name.\n· The ORIGINAL player earns ZERO league points for tonight.\n\nContinue?`)) return
    await guard(async () => { await tournReplace(replacing.participantId, name); setReplacing(null) })()
  }
  const startRounds = async () => { if (!window.confirm('Start the tournament? This locks the entrant list and draws Round 1.')) return; await guard(() => tournStartRounds(run.run.id))() }
  const nextRound = () => guard(() => tournNextRound(run.run.id))()
  const undoRound = async () => { if (!window.confirm('Undo the last round? Its matches & scores are removed.')) return; await guard(() => tournDeleteLastRound(run.run.id))() }
  const reopenMatch = (m) => guard(() => tournClearScore(m.id))()
  const startKnockout = async () => { if (!window.confirm(`Cut to the knockout? The top players seed into a single-elimination bracket from the standings.\n\nMatches: race to ${koRaceTo} frames${thirdPlace ? ' · with a 3rd-place match' : ''}${finalBestOf3 ? ' · final + 3rd-place are best of 3' : ''}.`)) return; await guard(() => tournStartKnockout(run.run.id, thirdPlace, koRaceTo, finalBestOf3))() }
  const loadLeague = async (disc) => { setLeagueDisc(disc); setBusy(true); try { setLeague(await tournGetLeague(disc)) } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const openLeague = async () => { setLeagueView(true); await loadLeague(leagueDisc) }
  const seedGrandFinal = async () => { if (!window.confirm('Add the league top 8 to this grand final?')) return; await guard(() => tournSeedFromLeague(run.run.id))() }
  const resendVouchers = () => guard(() => tournFinalize(run.run.id))()
  const saveScore = async (m) => {
    const e = scores[m.id] || {}
    const p1 = e.p1 ?? (m.p1_score ?? ''), p2 = e.p2 ?? (m.p2_score ?? '')
    if (p1 === '' || p2 === '') { alert('Enter both scores.'); return }
    await guard(async () => { await tournEnterScore(m.id, p1, p2); setScores(s => { const n = { ...s }; delete n[m.id]; return n }) })()
  }
  // Race to WIN (8). Pick the loser's frames (0–7) and the winner auto-jumps to 8;
  // pick 8 for a side and it's the winner (the other side clears so you set the loser).
  const setScore = (id, side, raw) => setScores(s => {
    const WIN = run?.run?.settings?.raceTo || 8
    const cur = s[id] || {}, other = side === 'p1' ? 'p2' : 'p1'
    const v = raw === '' ? '' : Number(raw)
    let next
    if (v === '') next = { ...cur, [side]: '' }
    else if (v < WIN) next = { ...cur, [side]: v, [other]: WIN }
    else next = { ...cur, [side]: WIN, [other]: (cur[other] === WIN || cur[other] == null || cur[other] === '') ? '' : cur[other] }
    return { ...s, [id]: next }
  })

  // Best-of-3: one score input per game, same loser-picker auto-fill (pick the loser's
  // frames → the winner jumps to WIN). `saveGames` sends the completed games; the engine
  // tallies them (first to win 2) and finalises when the final is decided.
  const setGame = (id, idx, side, raw, WIN, base) => setGameScores(s => {
    // Seed from the persisted games (base = m.games) on the first edit after a save/reload —
    // otherwise editing a partially-saved best-of-3 match would wipe the games already stored.
    const arr = (s[id] ? s[id] : (base || [])).map(g => ({ ...g }))
    while (arr.length <= idx) arr.push({ p1: '', p2: '' })
    const cur = arr[idx], other = side === 'p1' ? 'p2' : 'p1'
    const v = raw === '' ? '' : Number(raw)
    if (v === '') cur[side] = ''
    else if (v < WIN) { cur[side] = v; cur[other] = WIN }
    else { cur[side] = WIN; cur[other] = (cur[other] === WIN || cur[other] == null || cur[other] === '') ? '' : cur[other] }
    return { ...s, [id]: arr }
  })
  const saveGames = async (m) => {
    const src = gameScores[m.id] ?? (m.games || [])
    const games = src.filter(g => g && g.p1 !== '' && g.p2 !== '' && g.p1 != null && g.p2 != null).map(g => ({ p1: Number(g.p1), p2: Number(g.p2) }))
    if (!games.length) { alert('Enter at least one game.'); return }
    if (games.some(g => g.p1 === g.p2)) { alert('Each game needs a winner — no tied games.'); return }
    await guard(async () => { await tournEnterGames(m.id, games); setGameScores(s => { const n = { ...s }; delete n[m.id]; return n }) })()
  }

  // ── Season league table ─────────────────────────────────────────────────────
  if (leagueView) {
    const rows = league?.table || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button onClick={() => setLeagueView(false)} style={{ ...btn('ghost'), alignSelf: 'flex-start' }}>← Pool nights</button>
        <div>
          <div className="serif" style={{ fontSize: 22, color: '#fff' }}>🏆 League table</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 3, lineHeight: 1.5 }}>Season points across every finished night — 1st <strong style={{ color: '#fff' }}>5</strong> · 2nd <strong style={{ color: '#fff' }}>4</strong> · 3rd <strong style={{ color: '#fff' }}>3</strong> · turn up <strong style={{ color: '#fff' }}>1</strong> · top the rounds table <strong style={{ color: '#fff' }}>+1</strong>. Level on points → season frame difference. Top 8 seed the grand final. {league ? `${league.nights} night${league.nights === 1 ? '' : 's'} counted.` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['singles', 'doubles'].map(d => <button key={d} onClick={() => loadLeague(d)} style={{ ...pill(leagueDisc === d), textTransform: 'capitalize' }}>{d}</button>)}
        </div>
        {busy && !league ? <div style={muted}>Loading…</div> : rows.length === 0 ? <div style={muted}>No finished {leagueDisc} nights yet — the league fills in as tournaments complete.</div> : (
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
              <thead><tr style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ textAlign: 'left', padding: '0 8px 6px 0' }}>#</th><th style={{ textAlign: 'left', padding: '0 8px 6px 0' }}>Player</th>
                {['Nights', '🥇', '🥈', '🥉', '+/−', 'Pts'].map(h => <th key={h} style={{ padding: '0 8px 6px', textAlign: 'right' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.key} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#fff', background: r.qualifies ? 'rgba(168,85,247,0.12)' : 'transparent' }}>
                    <td style={{ padding: '8px 8px 8px 0', fontWeight: 700, color: r.rank <= 8 ? PURPLE : 'rgba(255,255,255,0.5)' }}>{r.rank}{r.rank <= 8 ? ' ✦' : ''}</td>
                    <td style={{ padding: '8px 8px 8px 0', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: 'rgba(255,255,255,0.55)' }}>{r.nights}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{r.wins || ''}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{r.seconds || ''}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{r.thirds || ''}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: r.frameDiff > 0 ? GREEN : r.frameDiff < 0 ? '#F87171' : 'rgba(255,255,255,0.55)' }}>{r.frameDiff > 0 ? '+' : ''}{r.frameDiff}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, fontSize: 15, color: PURPLE }}>{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>✦ = top 8 · qualifies for the grand final. This same table shows live on nodice.bar.</div>
          </div>
        )}
      </div>
    )
  }

  // ── List of pool nights ─────────────────────────────────────────────────────
  if (view === 'list') {
    const todayISO = new Date().toISOString().slice(0, 10)
    const upcoming = tourns.filter(t => (t.event_date || '') >= todayISO)
    const past = tourns.filter(t => (t.event_date || '') < todayISO).reverse()
    const card = (t) => {
      const tb = typeBadge(t.type)
      const full = t.paid >= t.cap
      return (
        <button key={t.id} onClick={() => open(t.id)} disabled={busy} style={{ textAlign: 'left', background: CARD, border: `1px solid ${t.run ? 'rgba(52,211,153,0.4)' : LINE}`, borderRadius: 12, padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{t.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>{fmtDate(t.event_date)}</span>
              <span style={{ color: tb.c, fontWeight: 700 }}>{tb.txt}</span>
              {t.run && <span style={{ color: GREEN, fontWeight: 700 }}>· {t.run.status === 'setup' ? 'set up' : t.run.status}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: full ? RED : '#fff' }}>{t.paid}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> / {t.cap}</span></div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: full ? RED : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{full ? 'Full' : 'booked'}</div>
          </div>
        </button>
      )
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="serif" style={{ fontSize: 22, color: '#fff' }}>🎱 Pool tournaments</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>Your booked pool nights — tap one to see who's paid and run the tournament. Entrants come straight from online bookings.</div>
          </div>
          <button onClick={openLeague} style={pill(false)}>🏆 League table</button>
        </div>
        {err && <div style={errBox}>{err}</div>}
        {loading ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Loading…</div> : (
          <>
            <div style={sectLbl}>Upcoming</div>
            {upcoming.length === 0 ? <div style={muted}>No upcoming pool nights.</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{upcoming.map(card)}</div>}
            {past.length > 0 && <>
              <div style={{ ...sectLbl, marginTop: 6 }}>Past</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.75 }}>{past.slice(0, 12).map(card)}</div>
            </>}
          </>
        )}
      </div>
    )
  }

  // ── One night ───────────────────────────────────────────────────────────────
  const t = run.tournament
  const parts = run.participants || []
  const activeParts = parts.filter(p => p.active)
  const removedParts = parts.filter(p => !p.active)
  const tb = typeBadge(t.type)
  const full = activeParts.length >= t.cap
  const status = run.run.status
  const rounds = run.rounds || []
  const matches = run.matches || []
  const standings = run.standings || []
  const nameById = Object.fromEntries(parts.map(p => [p.id, p.display_name]))
  const curRound = rounds[rounds.length - 1]
  const curDone = curRound ? matches.filter(m => m.round_id === curRound.id).every(m => m.status === 'done') : true

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={() => { setView('list'); loadList() }} style={{ ...btn('ghost'), alignSelf: 'flex-start' }}>← All pool nights</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 21, color: '#fff' }}>{t.name}</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span>{fmtDate(t.event_date)}</span><span style={{ color: tb.c, fontWeight: 700 }}>{tb.txt}</span>
            {status !== 'setup' && <span style={{ color: GREEN, fontWeight: 700 }}>· {status === 'rounds' ? `Round ${curRound?.ordinal || 1}` : status}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: full ? RED : '#fff', lineHeight: 1 }}>{activeParts.length}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> / {t.cap}</span></div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: full ? RED : GREEN, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{full ? '● Full' : 'entrants'}</div>
          </div>
          {/* Hamburger opens a slide-out drawer with every tournament option
              (substitute a player, undo round, restart, start knockout, resend
              vouchers…). Keeps the main view focused on rounds + standings. */}
          {status !== 'setup' && (
            <button onClick={() => setMenuOpen(true)} title="Tournament options" aria-label="Open tournament options" style={{
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 4, background: CARD, border: `1px solid ${LINE}`, borderRadius: 10,
              cursor: 'pointer', padding: 0,
            }}>
              <span style={{ display: 'block', width: 18, height: 2, background: '#fff', borderRadius: 1 }} />
              <span style={{ display: 'block', width: 18, height: 2, background: '#fff', borderRadius: 1 }} />
              <span style={{ display: 'block', width: 18, height: 2, background: '#fff', borderRadius: 1 }} />
            </button>
          )}
        </div>
      </div>

      {/* ══ SETUP: roster editing + start ══ */}
      {status === 'setup' && <>
        <div style={infoBox}>{run.paidCount} paid online → auto-entered. {t.type === 'doubles' ? 'Doubles show by team name. ' : ''}Add a cash walk-in, rename or remove anyone, then start the rounds.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {activeParts.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: CARD, border: `1px solid ${LINE}`, borderRadius: 9, padding: '9px 11px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', minWidth: 20 }}>{i + 1}</span>
              {editing === p.id
                ? <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveRename(p.id); if (e.key === 'Escape') setEditing(null) }} onBlur={() => saveRename(p.id)} style={{ flex: 1, padding: '6px 9px', fontSize: 14, borderRadius: 7, background: '#000', border: `1px solid ${RED}`, color: '#fff', outline: 'none' }} />
                : <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.display_name}</div>}
              <span style={{ fontSize: 10, fontWeight: 700, color: p.source === 'manual' ? AMBER : GREEN, border: `1px solid ${p.source === 'manual' ? AMBER : GREEN}55`, borderRadius: 5, padding: '2px 6px', flexShrink: 0 }}>{p.source === 'manual' ? '✋ walk-in' : '🎟️ ticket'}</span>
              <button onClick={() => { setEditing(p.id); setEditVal(p.display_name) }} disabled={busy} title="Rename" style={iconBtn}>✎</button>
              <button onClick={() => remove(p)} disabled={busy} title="Remove" style={{ ...iconBtn, color: '#F87171' }}>✕</button>
            </div>
          ))}
          {activeParts.length === 0 && <div style={muted}>No entrants yet. They'll appear as people pay online, or add a walk-in below.</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={walkin} onChange={e => setWalkin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addWalkin() }} placeholder="Add a walk-in (name / team)…" disabled={full} style={{ flex: 1, minWidth: 180, padding: '9px 11px', fontSize: 14, borderRadius: 8, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none', opacity: full ? 0.5 : 1 }} />
          <button onClick={addWalkin} disabled={busy || !walkin.trim() || full} style={{ ...btn('gold'), opacity: (busy || !walkin.trim() || full) ? 0.5 : 1 }}>+ Add walk-in</button>
          <button onClick={refresh} disabled={busy} style={btn('ghost')} title="Re-check who's paid online">↻ Refresh</button>
        </div>
        {removedParts.length > 0 && (
          <div style={{ borderTop: `1px dashed ${LINE}`, paddingTop: 12 }}>
            <div style={{ ...sectLbl, marginBottom: 8 }}>Removed</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {removedParts.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6, fontSize: 13 }}>
                  <span style={{ flex: 1, color: 'rgba(255,255,255,0.7)', textDecoration: 'line-through' }}>{p.display_name}</span>
                  <button onClick={() => restore(p.id)} disabled={busy} style={{ ...btn('ghost'), padding: '4px 10px', fontSize: 11 }}>Restore</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/season final|grand final/i.test(t.name || '') && (
          <button onClick={seedGrandFinal} disabled={busy} style={{ ...pill(true), alignSelf: 'flex-start', padding: '9px 14px' }} title="Add the league's top 8 as entrants">✦ Seed the top 8 from the league</button>
        )}
        <button onClick={startRounds} disabled={busy || activeParts.length < 2} style={{ ...btn('gold'), padding: '13px', fontSize: 15, opacity: activeParts.length < 2 ? 0.5 : 1 }}>▶ Start tournament — draw Round 1</button>
      </>}

      {/* ══ ROUNDS: two-column layout — rounds on the LEFT (oldest at top, new
          rounds append at the bottom), standings on the RIGHT. Every "option"
          (substitute player, undo, start knockout, restart…) lives in the ☰
          drawer so the founder can find them in one predictable place. ══ */}
      {status === 'rounds' && <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
          {/* LEFT — rounds (oldest first, "+ Add another round" at the bottom) */}
          <div style={{ flex: '2 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Rounds — oldest at top, newest at the bottom so the page reads like
            a match log written down the page (founder direction 2026-07-30). */}
        {rounds.map(rnd => {
          const rms = matches.filter(m => m.round_id === rnd.id).sort((a, b) => (a.slot || 0) - (b.slot || 0))
          const done = rms.filter(m => m.status === 'done').length
          return (
            <div key={rnd.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Round {rnd.ordinal}</div>
                <div style={{ fontSize: 11, color: done === rms.length ? GREEN : AMBER, fontWeight: 700 }}>{done}/{rms.length} played</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {rms.map(m => {
                  if (m.is_bye) return <div key={m.id} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', padding: '6px 2px' }}><strong style={{ color: '#fff' }}>{nameById[m.p1_id]}</strong> — bye <span style={{ color: GREEN }}>(auto-win)</span></div>
                  const e = scores[m.id] || {}
                  const v1 = e.p1 ?? (m.p1_score ?? ''), v2 = e.p2 ?? (m.p2_score ?? '')
                  const doneM = m.status === 'done'
                  const p1win = doneM && m.winner_id === m.p1_id, p2win = doneM && m.winner_id === m.p2_id
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 8, padding: '7px 9px', flexWrap: 'wrap' }}>
                      {/* Table badge — shows which physical pool table this pair is on.
                          Populated by the edge fn's reassignTables helper; unassigned
                          pending matches (waiting for a table to free up) show "—". */}
                      <TableBadge n={m.table_number} pending={!doneM} />
                      <div style={{ flex: 1, minWidth: 90, textAlign: 'right', fontSize: 13.5, fontWeight: p1win ? 800 : 600, color: p1win ? GREEN : '#fff' }}>{nameById[m.p1_id]}</div>
                      <ScoreSelect value={v1} onPick={val => setScore(m.id, 'p1', val)} disabled={busy || doneM} max={run.run?.settings?.raceTo || 8} />
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>–</span>
                      <ScoreSelect value={v2} onPick={val => setScore(m.id, 'p2', val)} disabled={busy || doneM} max={run.run?.settings?.raceTo || 8} />
                      <div style={{ flex: 1, minWidth: 90, fontSize: 13.5, fontWeight: p2win ? 800 : 600, color: p2win ? GREEN : '#fff' }}>{nameById[m.p2_id]}</div>
                      {doneM
                        ? <button onClick={() => reopenMatch(m)} disabled={busy} title="Edit result" style={iconBtn}>✎</button>
                        : <button onClick={() => saveScore(m)} disabled={busy} style={{ ...btn('gold'), padding: '6px 12px' }}>Save</button>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* "+ Add another round" sits at the BOTTOM of the rounds column so
            the next round appears immediately below when clicked — matches
            the "reads down the page" founder direction. Always enabled;
            pairings use standings-so-far if the current round isn't finished. */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <button onClick={nextRound} disabled={busy} style={{ ...btn('gold'), padding: '12px 18px', fontSize: 14 }}>+ Add another round</button>
        </div>
        {!curDone && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>Round {curRound?.ordinal} still has open matches — that's fine, the next round pairs from the standings you have so far.</div>}
          </div>

          {/* RIGHT — live standings (reference column) */}
          <div style={{ flex: '1 1 300px', minWidth: 0, background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 10 }}>📊 Standings <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.45)' }}>· pts → frame diff</span></div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'right', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ textAlign: 'left', padding: '0 8px 6px 0' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '0 8px 6px 0' }}>Player</th>
                    {[['P', 'Played'], ['W', 'Won'], ['L', 'Lost'], ['F', 'Frames won'], ['A', 'Frames lost'], ['+/−', 'Frame difference — the tiebreaker when level on points'], ['Pts', 'Points']].map(([h, tip]) => <th key={h} title={tip} style={{ padding: '0 7px 6px', cursor: 'help' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {standings.map(s => (
                    <tr key={s.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}>
                      <td style={{ textAlign: 'left', padding: '7px 8px 7px 0', fontWeight: 700, color: s.rank === 1 ? '#FCD34D' : 'rgba(255,255,255,0.5)' }}>{s.rank === 1 ? '🏆' : s.rank}</td>
                      <td style={{ textAlign: 'left', padding: '7px 8px 7px 0', fontWeight: 600 }}>{s.name}{s.byes > 0 ? <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}> · bye</span> : null}</td>
                      <td style={{ textAlign: 'right', padding: '7px 7px', color: 'rgba(255,255,255,0.7)' }}>{s.played}</td>
                      <td style={{ textAlign: 'right', padding: '7px 7px', color: GREEN }}>{s.won}</td>
                      <td style={{ textAlign: 'right', padding: '7px 7px', color: 'rgba(255,255,255,0.6)' }}>{s.lost}</td>
                      <td style={{ textAlign: 'right', padding: '7px 7px', color: 'rgba(255,255,255,0.55)' }}>{s.for}</td>
                      <td style={{ textAlign: 'right', padding: '7px 7px', color: 'rgba(255,255,255,0.55)' }}>{s.against}</td>
                      <td style={{ textAlign: 'right', padding: '7px 7px', fontWeight: 700, color: s.diff > 0 ? GREEN : s.diff < 0 ? '#F87171' : 'rgba(255,255,255,0.6)' }}>{s.diff > 0 ? '+' : ''}{s.diff}</td>
                      <td style={{ textAlign: 'right', padding: '7px 7px', fontWeight: 800, color: '#fff', fontSize: 14 }}>{s.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 1.5 }}>P · W · L · F frames won · A frames lost · <strong style={{ color: 'rgba(255,255,255,0.65)' }}>+/−</strong> frame difference · Pts</div>
          </div>
        </div>
        {/* Options for substitute-player / knockout / undo / refresh / restart
            all live inside the ☰ drawer at the top of the page. */}
      </>}

      {/* ══ KNOCKOUT: single-elim bracket ══ */}
      {(status === 'knockout' || status === 'done') && (() => {
        const bmatches = matches.filter(m => m.bracket_round != null && !m.is_third_place)
        const tpm = matches.find(m => m.is_third_place)
        const totalRounds = bmatches.length ? Math.max(...bmatches.map(m => m.bracket_round)) : 0
        const placings = run.placings
        const roundLabel = (r) => { const inRound = Math.pow(2, totalRounds - r); return inRound === 1 ? 'Final' : inRound === 2 ? 'Semi-finals' : inRound === 4 ? 'Quarter-finals' : `1/${inRound} Finals` }
        const bracketMax = run.run?.settings?.raceTo || 8
        const bo3On = !!run.run?.settings?.finalBestOf3
        const BracketMatch = ({ m }) => {
          if (m.is_bye) return <div style={{ ...bracketBox, color: 'rgba(255,255,255,0.6)' }}><div style={{ fontWeight: 700, color: '#fff' }}>{nameById[m.p1_id]}</div><div style={{ fontSize: 10.5, color: GREEN }}>bye →</div></div>
          const doneM = m.status === 'done'
          const isFinalM = m.bracket_round === totalRounds && !m.is_third_place

          // ── Best-of-3 (final / 3rd-place): enter each game, first to win 2 ──
          if (bo3On && (m.is_third_place || isFinalM)) {
            const perGame = bracketMax
            const bothIn = m.p1_id && m.p2_id
            const working = gameScores[m.id] ?? (m.games || [])
            const complete = working.filter(g => g && g.p1 !== '' && g.p2 !== '' && g.p1 != null && g.p2 != null)
            let w1 = 0, w2 = 0
            for (const g of complete) { const a = Number(g.p1), b = Number(g.p2); if (a > b) w1++; else if (b > a) w2++; if (w1 >= 2 || w2 >= 2) break }
            const decided = w1 >= 2 || w2 >= 2
            const editing = bothIn && !doneM
            const rows = (doneM || decided) ? Math.max(1, complete.length) : Math.min(3, complete.length + 1)
            const tallyLine = (pid, wins, win) => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 26 }}>
                <span style={{ fontSize: 13.5, fontWeight: win ? 800 : 600, color: !pid ? 'rgba(255,255,255,0.3)' : win ? GREEN : (doneM ? 'rgba(255,255,255,0.45)' : '#fff'), textDecoration: doneM && !win ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pid ? nameById[pid] : 'TBD'}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: win ? GREEN : 'rgba(255,255,255,0.55)', minWidth: 18, textAlign: 'center' }}>{wins}</span>
              </div>
            )
            return (
              <div style={bracketBox}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Best of 3 · race to {perGame}</div>
                  {editing && <TableBadge n={m.table_number} pending small />}
                </div>
                {tallyLine(m.p1_id, w1, decided && w1 >= 2)}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                {tallyLine(m.p2_id, w2, decided && w2 >= 2)}
                {!bothIn && <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>waiting on the semis…</div>}
                {bothIn && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {Array.from({ length: rows }).map((_, i) => {
                      const g = working[i] || {}
                      const gv1 = g.p1 ?? '', gv2 = g.p2 ?? ''
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', width: 20 }}>G{i + 1}</span>
                          {editing
                            ? <>
                                <ScoreSelect value={gv1} onPick={x => setGame(m.id, i, 'p1', x, perGame, working)} disabled={busy} max={perGame} compact />
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>–</span>
                                <ScoreSelect value={gv2} onPick={x => setGame(m.id, i, 'p2', x, perGame, working)} disabled={busy} max={perGame} compact />
                              </>
                            : <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>{gv1 === '' ? '–' : gv1} – {gv2 === '' ? '–' : gv2}</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
                {editing && <button onClick={() => saveGames(m)} disabled={busy} style={{ ...btn('gold'), width: '100%', padding: '6px', fontSize: 11.5, marginTop: 8 }}>Save games</button>}
                {doneM && <button onClick={() => reopenMatch(m)} disabled={busy} title="Edit result" style={{ ...iconBtn, width: 24, height: 24, fontSize: 11, marginTop: 6, alignSelf: 'flex-end' }}>✎</button>}
              </div>
            )
          }

          const playable = m.p1_id && m.p2_id && !doneM
          const e = scores[m.id] || {}, v1 = e.p1 ?? (m.p1_score ?? ''), v2 = e.p2 ?? (m.p2_score ?? '')
          // One line per player: their name on the left, THEIR score on the right —
          // a dropdown while playable, the final number once done.
          const row = (pid, side, val, sc, win) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 34 }}>
              <span style={{ fontSize: 13.5, fontWeight: win ? 800 : 600, color: !pid ? 'rgba(255,255,255,0.3)' : win ? GREEN : doneM ? 'rgba(255,255,255,0.45)' : '#fff', textDecoration: doneM && !win ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pid ? nameById[pid] : 'TBD'}</span>
              {playable && pid
                ? <ScoreSelect value={val} onPick={x => setScore(m.id, side, x)} disabled={busy} max={bracketMax} compact />
                : (doneM ? <span style={{ fontSize: 16, fontWeight: 800, color: win ? GREEN : 'rgba(255,255,255,0.45)', minWidth: 20, textAlign: 'center' }}>{sc}</span> : null)}
            </div>
          )
          return (
            <div style={bracketBox}>
              {/* Table badge — visible while the match is playable so staff know
                  which of the two physical tables the pair should head to. */}
              {playable && <div style={{ alignSelf: 'flex-start', marginBottom: 4 }}><TableBadge n={m.table_number} pending small /></div>}
              {row(m.p1_id, 'p1', v1, m.p1_score, doneM && m.winner_id === m.p1_id)}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '5px 0' }} />
              {row(m.p2_id, 'p2', v2, m.p2_score, doneM && m.winner_id === m.p2_id)}
              {playable && <button onClick={() => saveScore(m)} disabled={busy} style={{ ...btn('gold'), width: '100%', padding: '6px', fontSize: 11.5, marginTop: 8 }}>Save result</button>}
              {doneM && <button onClick={() => reopenMatch(m)} disabled={busy} title="Edit result" style={{ ...iconBtn, width: 24, height: 24, fontSize: 11, marginTop: 6, alignSelf: 'flex-end' }}>✎</button>}
            </div>
          )
        }
        return (
          <>
            {/* Final decided but the night isn't fully finished yet (a 3rd-place playoff is still
                to play, or was left unplayed) — vouchers hold until it's settled. */}
            {placings && status !== 'done' && (
              <div style={{ background: 'rgba(245,158,11,0.10)', border: `1px solid ${AMBER}66`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>🏆 Final decided — {nameById[placings.first]} wins</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>Play the <strong style={{ color: '#fff' }}>3rd-place playoff</strong> below to lock the standings, then the vouchers issue automatically. Not playing it? Finalise now — 3rd goes to the higher-placed beaten semi-finalist.</div>
                <button onClick={resendVouchers} disabled={busy} style={{ ...btn('gold'), alignSelf: 'flex-start', padding: '7px 14px', fontSize: 12 }}>✓ Finalise the night & issue vouchers</button>
              </div>
            )}
            {status === 'done' && placings && (() => {
              const vByPlace = Object.fromEntries((run.vouchers || []).map(v => [v.place, v]))
              return (
                <div style={{ background: 'rgba(168,85,247,0.10)', border: `1px solid ${PURPLE}88`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FCD34D' }}>🏆 {nameById[placings.first]} — Champion!</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[1, 2, 3].map(place => {
                      const pid = place === 1 ? placings.first : place === 2 ? placings.second : placings.third
                      if (!pid) return null
                      const v = vByPlace[place], medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉', amt = place === 1 ? '£30' : place === 2 ? '£20' : '£10'
                      return (
                        <div key={place} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                          <span style={{ color: '#fff', fontWeight: 700 }}>{medal} {nameById[pid]}</span>
                          <span style={{ color: PURPLE, fontWeight: 800 }}>{amt} tab</span>
                          {v?.code && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'ui-monospace, monospace' }}>{v.code}</span>}
                          {v?.emailed_at ? <span style={{ fontSize: 11, color: GREEN }}>✓ emailed</span> : v?.email ? <span style={{ fontSize: 11, color: AMBER }}>will email</span> : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>no email — give at the bar</span>}
                        </div>
                      )
                    })}
                  </div>
                  <button onClick={resendVouchers} disabled={busy} style={{ ...btn('ghost'), alignSelf: 'flex-start', padding: '6px 12px', fontSize: 11.5 }}>↻ Re-issue / email vouchers</button>
                </div>
              )
            })()}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>🎯 Knockout bracket</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(168,85,247,0.15)', border: `1px solid ${LINE}`, borderRadius: 999, padding: '3px 10px' }}>race to {bracketMax}{run.run?.settings?.thirdPlaceMatch ? ' · 3rd-place match' : ''}{run.run?.settings?.finalBestOf3 ? ' · best-of-3 final' : ''}</span>
            </div>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
              {Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => (
                <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 190, justifyContent: 'space-around' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>{roundLabel(r)}</div>
                  {bmatches.filter(m => m.bracket_round === r).sort((a, b) => (a.bracket_slot || 0) - (b.bracket_slot || 0)).map(m => <BracketMatch key={m.id} m={m} />)}
                </div>
              ))}
            </div>
            {tpm && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>3rd-place match</div>
                <div style={{ maxWidth: 220 }}><BracketMatch m={tpm} /></div>
              </div>
            )}
            <button onClick={refresh} disabled={busy} style={{ ...btn('ghost'), alignSelf: 'flex-start' }}>↻ Refresh</button>
          </>
        )
      })()}

      {/* Slide-out options drawer — every "action" (substitute, undo, restart,
          start knockout, resend vouchers, refresh) lives here so the main view
          stays focused on rounds + standings. */}
      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        status={status}
        curDone={curDone}
        busy={busy}
        participants={run.participants || []}
        replacing={replacing}
        setReplacing={setReplacing}
        onSaveReplace={saveReplace}
        onUndoRound={undoRound}
        onRefresh={refresh}
        onDeleteRun={() => { if (window.confirm('Restart tournament? Every round, score and match is deleted. The roster + paid entries stay.')) { guard(async () => { await tournDeleteRun(run.run.id); setView('list'); loadList() })() } }}
        koRaceTo={koRaceTo}
        setKoRaceTo={setKoRaceTo}
        thirdPlace={thirdPlace}
        setThirdPlace={setThirdPlace}
        finalBestOf3={finalBestOf3}
        setFinalBestOf3={setFinalBestOf3}
        onStartKnockout={startKnockout}
        onResendVouchers={resendVouchers}
        onSeedGrandFinal={seedGrandFinal}
        tournamentName={t.name || ''}
      />
    </div>
  )
}

const btn = (kind) => {
  const base = { padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: PURPLE, color: '#fff', boxShadow: '0 2px 10px rgba(168,85,247,0.35)' }   // primary CTA — purple like the league
  return { ...base, background: 'rgba(168,85,247,0.10)', color: '#fff', border: '1px solid rgba(168,85,247,0.3)' }
}
const iconBtn = { width: 30, height: 30, borderRadius: 7, background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.3)', color: '#fff', fontSize: 13, cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }
const scoreInp = { width: 40, padding: '7px 0', fontSize: 15, fontWeight: 700, textAlign: 'center', borderRadius: 7, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none' }
// A 0–8 frames dropdown (opens the list of numbers). compact = bracket size.
function ScoreSelect({ value, onPick, disabled, max = 8, compact }) {
  const v = value === '' || value == null ? '' : String(value)
  return (
    <select value={v} onChange={e => onPick(e.target.value)} disabled={disabled}
      style={{ width: compact ? 44 : 52, padding: compact ? '5px 2px' : '7px 2px', fontSize: compact ? 14 : 16, fontWeight: 800, textAlign: 'center', textAlignLast: 'center', borderRadius: 7, background: '#000', border: `1px solid ${v !== '' ? PURPLE : LINE}`, color: '#fff', outline: 'none', cursor: disabled ? 'default' : 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
      <option value="">–</option>
      {Array.from({ length: max + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
    </select>
  )
}
const bracketBox = { background: '#0A0A0A', border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column' }

// ── Table badge ─────────────────────────────────────────────────────────────
// Shows which physical pool table (T1 / T2) an in-progress match is on. When
// a match is pending but no table is assigned yet ("all tables busy"), it
// renders a muted "table free soon" pill instead. Done matches show no badge
// (the info is redundant once a result is in).
function TableBadge({ n, pending, small }) {
  const size = small ? { pad: '2px 7px', fs: 10 } : { pad: '3px 9px', fs: 11 }
  if (n === 1 || n === 2) {
    return (
      <span style={{
        display: 'inline-block', padding: size.pad, borderRadius: 999,
        fontSize: size.fs, fontWeight: 800, letterSpacing: '0.06em',
        background: n === 1 ? 'rgba(96,165,250,0.18)' : 'rgba(52,211,153,0.18)',
        border: `1px solid ${n === 1 ? BLUE : GREEN}88`,
        color: n === 1 ? BLUE : GREEN,
        whiteSpace: 'nowrap',
      }}>TABLE {n}</span>
    )
  }
  if (pending) {
    return (
      <span style={{
        display: 'inline-block', padding: size.pad, borderRadius: 999,
        fontSize: size.fs, fontWeight: 700, letterSpacing: '0.04em',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)',
        color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap',
      }}>waiting for a table</span>
    )
  }
  return null
}

// ── Replace-player panel ────────────────────────────────────────────────────
// Compact mid-tournament substitution UI: pick a player from the dropdown,
// type the replacement's name, hit Save. Cascades the new name to every match
// in the current run AND nulls the original player's league points for the
// night (edge fn action `replacePlayer` — see the `saveReplace` handler above
// for the confirmation dialog spelling out the trade-off).
function ReplacePanel({ participants, replacing, setReplacing, onSave, busy }) {
  const active = (participants || []).filter(p => p.active)
  if (!active.length) return null
  const isOpen = !!replacing
  return (
    <div style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: PURPLE }}>🔁 Substitute a player</span>
        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>Player leaving? Someone new stepping in? Pick them from the list, type the replacement's name, save. Nulls the original's league points for tonight.</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <select
          value={replacing?.participantId || ''}
          onChange={e => {
            const id = e.target.value
            if (!id) { setReplacing(null); return }
            const p = active.find(x => x.id === id)
            setReplacing({ participantId: id, oldName: p?.display_name || '', newName: '' })
          }}
          disabled={busy}
          style={{ flex: '1 1 180px', minWidth: 140, padding: '8px 10px', fontSize: 13, borderRadius: 8, background: '#000', border: '1px solid rgba(168,85,247,0.35)', color: '#fff', outline: 'none' }}
        >
          <option value="">Pick a player…</option>
          {active.map(p => <option key={p.id} value={p.id}>{p.display_name}{p.league_null ? ' (already substituted)' : ''}</option>)}
        </select>
        {isOpen && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>→</span>
            <input
              autoFocus
              value={replacing.newName}
              onChange={e => setReplacing({ ...replacing, newName: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') setReplacing(null) }}
              placeholder="Replacement's name"
              disabled={busy}
              style={{ flex: '1 1 160px', minWidth: 140, padding: '8px 10px', fontSize: 13, borderRadius: 8, background: '#000', border: `1px solid ${PURPLE}`, color: '#fff', outline: 'none' }}
            />
            <button onClick={onSave} disabled={busy || !replacing.newName?.trim()} style={{ ...btn('gold'), padding: '8px 14px', fontSize: 12 }}>Save substitution</button>
            <button onClick={() => setReplacing(null)} disabled={busy} style={{ ...btn('ghost'), padding: '8px 12px', fontSize: 12 }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  )
}
const pill = (active) => ({ padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', border: `1px solid ${active ? PURPLE : 'rgba(255,255,255,0.2)'}`, background: active ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.05)', color: '#fff' })

// ── Slide-out options drawer ────────────────────────────────────────────────
// Every tournament "action" (substitute a player, undo last round, restart the
// whole run, launch the knockout with its options, resend vouchers, seed the
// grand final) is grouped here. Founder rule 2026-07-30: keep the main view
// focused on rounds + standings; every management action opens from the ☰.
//
// Renders as a right-side sheet ~360px wide with a click-to-close backdrop.
// Sections show or hide based on `status` so only the relevant actions
// surface at each stage.
function MenuDrawer({
  open, onClose, status, curDone, busy,
  participants, replacing, setReplacing, onSaveReplace,
  onUndoRound, onRefresh, onDeleteRun,
  koRaceTo, setKoRaceTo, thirdPlace, setThirdPlace, finalBestOf3, setFinalBestOf3, onStartKnockout,
  onResendVouchers, onSeedGrandFinal, tournamentName,
}) {
  if (!open) return null
  const isRounds = status === 'rounds'
  const isKO = status === 'knockout' || status === 'done'
  const isGrandFinal = /season final|grand final/i.test(tournamentName || '')
  const closeAfter = (fn) => async (...a) => { onClose(); await fn?.(...a) }
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(360px, 92vw)',
        background: '#0b0713', borderLeft: `1px solid ${LINE}`, zIndex: 101,
        overflowY: 'auto', boxShadow: '-8px 0 30px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', gap: 16, padding: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: PURPLE, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Tournament options</div>
          <button onClick={onClose} aria-label="Close" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`, color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Substitute a player — the highest-touch mid-tournament action */}
        {(isRounds || isKO) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>🔁 Change team names / substitute</div>
            <ReplacePanel
              participants={participants}
              replacing={replacing}
              setReplacing={setReplacing}
              onSave={onSaveReplace}
              busy={busy}
            />
          </div>
        )}

        {/* Round management — only during Swiss rounds */}
        {isRounds && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Rounds</div>
            <button onClick={closeAfter(onUndoRound)} disabled={busy} style={{ ...btn('ghost'), textAlign: 'left' }}>↩ Undo the last round</button>
            <button onClick={closeAfter(onRefresh)} disabled={busy} style={{ ...btn('ghost'), textAlign: 'left' }}>↻ Refresh</button>
          </div>
        )}

        {/* Start knockout — options grouped together, ONE cutover button */}
        {isRounds && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(168,85,247,0.06)', border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>🏆 Start the knockout</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>Cuts to a single-elimination bracket. Top players seed from the current standings.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Match length — race to</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[5, 6, 7, 8, 9].map(n => {
                  const on = koRaceTo === n
                  return (
                    <button key={n} onClick={() => setKoRaceTo(n)} style={{ padding: '7px 13px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, border: `1px solid ${on ? PURPLE : 'rgba(168,85,247,0.3)'}`, background: on ? PURPLE : 'rgba(168,85,247,0.10)', color: '#fff' }}>{n}</button>
                  )
                })}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }}>
              <input type="checkbox" checked={thirdPlace} onChange={e => setThirdPlace(e.target.checked)} style={{ marginTop: 2 }} />
              <span>Play a <strong style={{ color: '#fff' }}>3rd-place match</strong></span>
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }}>
              <input type="checkbox" checked={finalBestOf3} onChange={e => setFinalBestOf3(e.target.checked)} style={{ marginTop: 2 }} />
              <span><strong style={{ color: '#fff' }}>Best of 3</strong> for the final{thirdPlace ? ' & 3rd-place playoff' : ''}</span>
            </label>
            <button onClick={closeAfter(onStartKnockout)} disabled={busy} style={{ ...btn('gold'), padding: '12px', fontSize: 13, marginTop: 4 }}>▶ Start knockout</button>
          </div>
        )}

        {/* Knockout stage — resend voucher emails / refresh */}
        {isKO && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Knockout</div>
            <button onClick={closeAfter(onResendVouchers)} disabled={busy} style={{ ...btn('ghost'), textAlign: 'left' }}>✉ Finalise / resend vouchers</button>
            <button onClick={closeAfter(onRefresh)} disabled={busy} style={{ ...btn('ghost'), textAlign: 'left' }}>↻ Refresh</button>
          </div>
        )}

        {/* Grand-final seeding — only makes sense on the season final's setup */}
        {status === 'setup' && isGrandFinal && (
          <button onClick={closeAfter(onSeedGrandFinal)} disabled={busy} style={{ ...pill(true), textAlign: 'left' }}>✦ Seed the top 8 from the league</button>
        )}

        {/* Danger zone at the bottom — destructive, wants distance */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px dashed rgba(248,113,113,0.3)', paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(248,113,113,0.7)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Danger zone</div>
          <button onClick={closeAfter(onDeleteRun)} disabled={busy} style={{
            padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
            background: 'transparent', border: '1px solid rgba(248,113,113,0.45)', color: '#F87171', textAlign: 'left',
          }}>♻ Restart the tournament from scratch</button>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Deletes every round, match and score. The roster and paid entries are kept.</div>
        </div>
      </div>
    </>
  )
}
const infoBox = { fontSize: 11.5, color: 'rgba(255,255,255,0.6)', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8, padding: '10px 12px', lineHeight: 1.5 }
const errBox = { fontSize: 12.5, color: '#F87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 8, padding: '9px 12px' }
const sectLbl = { fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }
const muted = { fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }
