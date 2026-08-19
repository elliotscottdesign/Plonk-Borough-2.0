import React, { useEffect, useRef, useState } from 'react'
import {
  tournList, tournOpen, tournAddManual, tournAddWalkup, tournRename, tournReplace, tournRemove, tournRestore, tournDeleteRun,
  tournStartRounds, tournNextRound, tournEnterScore, tournEnterGames, tournClearScore, tournDeleteLastRound,
  tournStartKnockout, tournGetLeague, tournFinalize, tournSeedFromLeague,
  tournListVouchers, tournRedeemVoucher, tournUnredeemVoucher, tournCallPlayers, tournCallRound } from '../../pingpong/api.js'

// ─── Ping pong tournaments (founder) ──────────────────────────────────────────────
// Sundays from 6pm, ALWAYS teams (founder rule 3 Aug 2026) — no singles/doubles split,
// one team league, a game is first-to-11. Pick a Sunday night, see the paid teams
// auto-pulled in, tidy the roster, run the Swiss rounds (points → point difference →
// Buchholz), cut to the knockout. Reads the live booking data (tournament_type='teams'
// rows only); writes only to the pingpong_* tables.

const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33', PURPLE = '#A855F7', BLUE = '#60A5FA'
// Purple league branding across the whole tournament section (cards, borders, buttons).
const CARD = '#160e24', LINE = 'rgba(168,85,247,0.25)'
const fmtDate = (d) => d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''
// Ping pong nights are ALWAYS teams (Sunday 6pm) — singles/doubles kept only as a
// fallback in case an old row slips through.
const typeBadge = (t) => t === 'teams' ? { txt: '👥 Teams', c: PURPLE } : t === 'doubles' ? { txt: '👥 Doubles', c: PURPLE } : t === 'singles' ? { txt: '👤 Singles', c: BLUE } : { txt: t || '—', c: 'rgba(255,255,255,0.5)' }
// Calendar helpers (Mon-first, UK). monthMatrix → array of weeks, each 7 cells of { day, iso } | null.
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const monthMatrix = (year, month0) => {
  const startDow = (new Date(Date.UTC(year, month0, 1)).getUTCDay() + 6) % 7   // Mon = 0
  const days = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate()
  const cells = Array.from({ length: startDow }, () => null)
  for (let d = 1; d <= days; d++) cells.push({ day: d, iso: `${year}-${String(month0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
  while (cells.length % 7) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export default function PingPong() {
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
  const [koRaceTo, setKoRaceTo] = useState(21)          // knockout: first to how many points? (founder: 21)
  const [finalBestOf3, setFinalBestOf3] = useState(true) // knockout: final + 3rd-place = best of 3?
  const [replacing, setReplacing] = useState(null)      // { participantId, oldName, newName } during mid-tournament substitution
  const [menuOpen, setMenuOpen] = useState(false)       // 2026-07-30 refactor: slide-out options drawer (☰) hosts every "action" so the main view stays focused on rounds + standings
  const [leagueView, setLeagueView] = useState(false)   // showing the season league table
  const [voucherView, setVoucherView] = useState(false)  // 🎟 redemption panel
  const [vouchers, setVouchers] = useState(null)
  const [vSearch, setVSearch] = useState('')
  const [league, setLeague] = useState(null)            // ping pong has ONE league: teams (no singles/doubles)
  const [showPast, setShowPast] = useState(false)       // calendar: reveal past months

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
  // In-flight lock via ref, not just state: two taps in the same frame both see
  // busy=false (setState is async), so a fast double-tap on "+ Add another round"
  // could fire twice and generate TWO rounds (happened live 5 Aug 2026). The ref
  // flips synchronously, so the second tap is swallowed.
  const inFlight = useRef(false)
  const guard = (fn) => async (...a) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    try { await fn(...a); await refresh() } catch (e) { alert(e.message) } finally { inFlight.current = false; setBusy(false) }
  }

  const addWalkin = async () => { const name = walkin.trim(); if (!name || !run) return; await guard(async () => { await tournAddManual(run.run.id, name); setWalkin('') })() }
  const saveRename = async (id) => { const name = editVal.trim(); if (!name) { setEditing(null); return } await guard(async () => { await tournRename(id, name); setEditing(null) })() }
  const remove = async (p) => { if (p.source === 'manual' && !window.confirm(`Remove walk-in "${p.display_name}"?`)) return; await guard(() => tournRemove(p.id))() }
  const restore = (id) => guard(() => tournRestore(id))()
  // Walk-up sign-up: full booking-style details + emailed Stripe pay link
  // (founder rule 6 Aug 2026). Returns the fn result so the panel can show
  // whether the email fired.
  const addWalkupSubmit = async (d) => {
    let out = null
    await guard(async () => { out = await tournAddWalkup(run.run.id, d) })()
    return out
  }
  const renameFromDrawer = (pid, name) => guard(() => tournRename(pid, name))()
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
  // 📣 Call players over — texts both sides on demand and SAYS what happened
  // (founder direction, tournament night 12 Aug 2026: the automatic ping was
  // invisible, so there was no way to tell a silent failure from a sent text).
  const [callMsg, setCallMsg] = useState(null)
  const callPlayers = async (matchId, roundId) => {
    if (busy) return
    setBusy(true); setCallMsg(null)
    try {
      const r = matchId ? await tournCallPlayers(matchId) : await tournCallRound(roundId)
      const bits = []
      if (r.sent?.length) bits.push(`📣 Texted ${r.sent.length}: ${r.sent.join(', ')}`)
      if (r.noPhone?.length) bits.push(`📵 No number on file — call these over yourself: ${r.noPhone.join(', ')}`)
      if (r.failed?.length) bits.push(`⚠️ Text failed for ${r.failed.join(', ')} — shout for them`)
      if (r.note) bits.push(r.note)
      setCallMsg(bits.length ? bits.join('  ·  ') : 'Nobody to call.')
    } catch (e) { setCallMsg('⚠️ ' + e.message) } finally { setBusy(false) }
  }
  const undoRound = async () => { if (!window.confirm('Undo the last round? Its matches & scores are removed.')) return; await guard(() => tournDeleteLastRound(run.run.id))() }
  const reopenMatch = (m) => guard(() => tournClearScore(m.id))()
  const startKnockout = async () => { if (!window.confirm(`Cut to the knockout? The top teams seed into a single-elimination bracket from the standings.\n\nMatches: first to ${koRaceTo} points, win by 2${thirdPlace ? ' · with a 3rd-place match' : ''}${finalBestOf3 ? ' · final + 3rd-place are best of 3' : ''}.`)) return; await guard(() => tournStartKnockout(run.run.id, thirdPlace, koRaceTo, finalBestOf3))() }
  const loadLeague = async () => { setBusy(true); try { setLeague(await tournGetLeague('teams')) } catch (e) { alert(e.message) } finally { setBusy(false) } }
  // 🔗 Reconnect a returning walk-in's points — walk-ins have no booking email,
  // so their league identity is the name typed at the bar. Folds the old row
  // into the new one; nothing historic is rewritten and undo restores the split.
  const [mergeFrom, setMergeFrom] = useState('')
  const [mergeTo, setMergeTo] = useState('')
  const doMerge = async () => {
    const rows = league?.table || []
    const a = rows.find(r => r.key === mergeFrom), bRow = rows.find(r => r.key === mergeTo)
    if (!a || !bRow) return alert('Pick both rows.')
    if (!window.confirm(`Move ${a.name}'s ${a.pts} point${a.pts === 1 ? '' : 's'} onto ${bRow.name}?\n\nThey become one row in the league. You can undo this.`)) return
    setBusy(true)
    try { setLeague(await tournMergeLeague('teams', mergeFrom, mergeTo)); setMergeFrom(''); setMergeTo('') }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const undoMerge = async (fromKey, label) => {
    if (!window.confirm(`Split "${label}" back out into its own league row?`)) return
    setBusy(true)
    try { setLeague(await tournUnmergeLeague('teams', fromKey)) } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const openLeague = async () => { setLeagueView(true); await loadLeague() }
  // 🎟 Voucher redemption (founder brief 12 Aug 2026) — codes lock on redeem.
  const openVouchers = async () => {
    setVoucherView(true); setVouchers(null); setVSearch('')
    try { const r = await tournListVouchers(); setVouchers(r.vouchers || []) } catch (e) { alert(e.message); setVouchers([]) }
  }
  const reloadVouchers = async () => { try { const r = await tournListVouchers(); setVouchers(r.vouchers || []) } catch (_) { /* keep stale list */ } }
  const doRedeem = async (v) => {
    const by = window.prompt(`Mark ${v.code} (${v.display_name || 'winner'}) as redeemed?\n\nYour name/initials (optional — just OK is fine):`)
    if (by === null) return   // cancelled
    setBusy(true)
    try { await tournRedeemVoucher(v.id, by.trim()); await reloadVouchers() } catch (e) { alert(e.message); await reloadVouchers() } finally { setBusy(false) }
  }
  const doUnredeem = async (v) => {
    if (!window.confirm(`Un-redeem ${v.code}? Use this only to fix a mis-tap.`)) return
    setBusy(true)
    try { await tournUnredeemVoucher(v.id); await reloadVouchers() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const seedGrandFinal = async () => { if (!window.confirm('Add the league top 8 to this grand final?')) return; await guard(() => tournSeedFromLeague(run.run.id))() }
  const resendVouchers = () => guard(() => tournFinalize(run.run.id))()
  const saveScore = async (m) => {
    const e = scores[m.id] || {}
    const p1 = e.p1 ?? (m.p1_score ?? ''), p2 = e.p2 ?? (m.p2_score ?? '')
    if (p1 === '' || p2 === '') { alert('Enter both scores.'); return }
    await guard(async () => { await tournEnterScore(m.id, p1, p2); setScores(s => { const n = { ...s }; delete n[m.id]; return n }) })()
  }
  // Ping pong scoring with the DEUCE rule (founder 3 Aug 2026): first to WIN but you
  // must be 2 points clear, so games can run past WIN (12–10, 15–13…). Rounds WIN = 11,
  // knockout WIN = 21 (looked up per match via bracket_round).
  //
  // Entry model: pick the LOSER's score and the winner auto-fills — loser ≤ WIN−2 →
  // winner = WIN; deuce (loser ≥ WIN−1) → winner = loser + 2. Picking exactly WIN marks
  // that side the winner (then pick the loser on the other side).
  const winFor = (id) => {
    const m = (run?.matches || []).find(x => x.id === id)
    return m && m.bracket_round != null ? (run?.run?.settings?.koRaceTo || 21) : (run?.run?.settings?.raceTo || 11)
  }
  const winOver = (loser, WIN) => loser <= WIN - 2 ? WIN : loser + 2
  const setScore = (id, side, raw) => setScores(s => {
    const WIN = winFor(id)
    const cur = s[id] || {}, other = side === 'p1' ? 'p2' : 'p1'
    const v = raw === '' ? '' : Number(raw)
    let next
    if (v === '') next = { ...cur, [side]: '' }
    else if (v === WIN) next = { ...cur, [side]: WIN, [other]: (cur[other] !== '' && cur[other] != null && Number(cur[other]) <= WIN - 2) ? cur[other] : '' }
    else next = { ...cur, [side]: v, [other]: winOver(v, WIN) }
    return { ...s, [id]: next }
  })

  // Best-of-3: one score input per game, same loser-picker auto-fill (pick the loser's
  // points → the winner fills in; deuce → loser + 2). `saveGames` sends the completed
  // games; the engine tallies them (first to win 2) and finalises when the final is decided.
  const setGame = (id, idx, side, raw, WIN, base) => setGameScores(s => {
    // Seed from the persisted games (base = m.games) on the first edit after a save/reload —
    // otherwise editing a partially-saved best-of-3 match would wipe the games already stored.
    const arr = (s[id] ? s[id] : (base || [])).map(g => ({ ...g }))
    while (arr.length <= idx) arr.push({ p1: '', p2: '' })
    const cur = arr[idx], other = side === 'p1' ? 'p2' : 'p1'
    const v = raw === '' ? '' : Number(raw)
    if (v === '') cur[side] = ''
    else if (v === WIN) { cur[side] = WIN; if (!(cur[other] !== '' && cur[other] != null && Number(cur[other]) <= WIN - 2)) cur[other] = '' }
    else { cur[side] = v; cur[other] = winOver(v, WIN) }
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

  // ── Prize vouchers — look up a code, mark it redeemed (once), undo mistakes ──
  if (voucherView) {
    const q = vSearch.trim().toLowerCase().replace(/^nd-?/, '')
    const rows = (vouchers || []).filter(v => {
      if (!q) return true
      const code = String(v.code || '').toLowerCase().replace(/^nd-?/, '')
      return code.includes(q) || String(v.display_name || '').toLowerCase().includes(vSearch.trim().toLowerCase())
    })
    const outstanding = (vouchers || []).filter(v => !v.redeemed_at).reduce((t, v) => t + (v.amount_pence || 0), 0)
    const gbpFmt = (p) => '£' + (p % 100 ? (p / 100).toFixed(2) : String(p / 100))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button onClick={() => setVoucherView(false)} style={{ ...btn('ghost'), alignSelf: 'flex-start' }}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="serif" style={{ fontSize: 22, color: '#fff' }}>🎟 Prize vouchers</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 3, maxWidth: 520, lineHeight: 1.5 }}>When a winner claims their bar tab, find their code (it's in their prize email), check the amount, and mark it redeemed — each code works exactly once.</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FCD34D' }}>{gbpFmt(outstanding)}</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>outstanding tabs</div>
          </div>
        </div>
        <input
          value={vSearch}
          onChange={e => setVSearch(e.target.value)}
          placeholder="Type the code from their email (e.g. JAVLKT) or a name…"
          style={{ padding: '11px 13px', fontSize: 15, borderRadius: 9, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none' }}
        />
        {vouchers === null ? <div style={muted}>Loading…</div> : rows.length === 0 ? <div style={muted}>{vSearch ? 'No voucher matches that — check the code letter by letter.' : 'No vouchers yet — they appear when a tournament finishes.'}</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map(v => {
              const medal = v.place === 1 ? '🥇' : v.place === 2 ? '🥈' : '🥉'
              const redeemed = !!v.redeemed_at
              return (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: CARD, border: `1px solid ${redeemed ? 'rgba(255,255,255,0.10)' : LINE}`, borderRadius: 11, padding: '11px 13px', opacity: redeemed ? 0.65 : 1 }}>
                  <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{medal} {v.display_name || '—'} <span style={{ color: PURPLE, fontWeight: 800 }}>{gbpFmt(v.amount_pence || 0)}</span>{v.recipient === 2 ? <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}> · player 2</span> : null}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{v.night_name}{v.night_date ? ` · ${fmtDate(v.night_date)}` : ''}{v.emailed_at ? ' · emailed ✓' : ' · not emailed'}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.1em', color: redeemed ? 'rgba(255,255,255,0.4)' : '#fff', fontFamily: 'ui-monospace, monospace', textDecoration: redeemed ? 'line-through' : 'none' }}>{v.code}</div>
                  {redeemed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>✓ redeemed {String(v.redeemed_at).slice(0, 10)}{v.redeemed_by ? ` · ${v.redeemed_by}` : ''}</span>
                      <button onClick={() => doUnredeem(v)} disabled={busy} style={{ ...btn('ghost'), padding: '5px 10px', fontSize: 11 }}>Undo</button>
                    </div>
                  ) : (
                    <button onClick={() => doRedeem(v)} disabled={busy} style={{ ...btn('gold'), padding: '8px 14px', fontSize: 12.5 }}>✓ Mark redeemed</button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (leagueView) {
    const rows = league?.table || []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button onClick={() => setLeagueView(false)} style={{ ...btn('ghost'), position: 'sticky', top: 0, zIndex: 25, alignSelf: 'flex-start', boxShadow: '0 6px 14px rgba(0,0,0,0.5)' }}>← Ping pong nights</button>
        <div>
          <div className="serif" style={{ fontSize: 22, color: '#fff' }}>🏆 Team league</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 3, lineHeight: 1.5 }}>Season points across every finished Sunday night — 1st <strong style={{ color: '#fff' }}>5</strong> · 2nd <strong style={{ color: '#fff' }}>4</strong> · 3rd <strong style={{ color: '#fff' }}>3</strong> · turn up <strong style={{ color: '#fff' }}>1</strong> · top the rounds table <strong style={{ color: '#fff' }}>+1</strong>. Level on points → season point difference. Top 8 seed the grand final. {league ? `${league.nights} night${league.nights === 1 ? '' : 's'} counted.` : ''}</div>
        </div>
        {busy && !league ? <div style={muted}>Loading…</div> : rows.length === 0 ? <div style={muted}>No finished nights yet — the league fills in as tournaments complete.</div> : (
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
              <thead><tr style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ textAlign: 'left', padding: '0 8px 6px 0' }}>#</th><th style={{ textAlign: 'left', padding: '0 8px 6px 0' }}>Team</th>
                {['Nights', '🥇', '🥈', '🥉', '+/−', 'Pts'].map(h => <th key={h} style={{ padding: '0 8px 6px', textAlign: 'right' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.key} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#fff', background: r.qualifies ? 'rgba(168,85,247,0.12)' : 'transparent' }}>
                    <td style={{ padding: '8px 8px 8px 0', fontWeight: 700, color: r.rank <= 8 ? PURPLE : 'rgba(255,255,255,0.5)' }}>{r.rank}{r.rank <= 8 ? ' ✦' : ''}</td>
                    <td style={{ padding: '8px 8px 8px 0', fontWeight: 600 }}>{r.name}{r.alsoKnownAs?.length ? <span style={{ fontSize: 10.5, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}> · incl. {r.alsoKnownAs.join(', ')}</span> : null}</td>
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
            {/* Reconnect a returning walk-in — founder's rule: let them come
                back, then stitch the points together (13 Aug 2026). */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${LINE}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>🔗 Same team, two rows?</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Walk-ins added at the bar have no email, so a returning team can end up with a second row. Fold the old one into the new and their points carry over.</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={mergeFrom} onChange={e => setMergeFrom(e.target.value)} style={{ flex: '1 1 150px', padding: '9px 10px', fontSize: 13, borderRadius: 8, background: '#000', border: `1px solid ${LINE}`, color: '#fff' }}>
                  <option value="">Move this row…</option>
                  {rows.map(r => <option key={r.key} value={r.key}>{r.name} ({r.pts} pts)</option>)}
                </select>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>→ onto</span>
                <select value={mergeTo} onChange={e => setMergeTo(e.target.value)} style={{ flex: '1 1 150px', padding: '9px 10px', fontSize: 13, borderRadius: 8, background: '#000', border: `1px solid ${LINE}`, color: '#fff' }}>
                  <option value="">…this one</option>
                  {rows.filter(r => r.key !== mergeFrom).map(r => <option key={r.key} value={r.key}>{r.name} ({r.pts} pts)</option>)}
                </select>
                <button onClick={doMerge} disabled={busy || !mergeFrom || !mergeTo} style={{ ...btn('gold'), padding: '9px 14px', fontSize: 13, opacity: (mergeFrom && mergeTo) ? 1 : 0.45 }}>🔗 Join</button>
              </div>
              {!!(league?.merges || []).length && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
                  {league.merges.map(mg => (
                    <div key={mg.from_key} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>
                      <span>“{mg.from_key}” → “{mg.to_key}”</span>
                      <button onClick={() => undoMerge(mg.from_key, mg.from_key)} disabled={busy} style={{ background: 'none', border: `1px solid ${LINE}`, color: 'rgba(255,255,255,0.75)', borderRadius: 6, padding: '2px 8px', fontSize: 10.5, cursor: 'pointer' }}>undo</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Calendar of ping pong nights ─────────────────────────────────────────────────
  if (view === 'list') {
    const todayISO = new Date().toISOString().slice(0, 10)
    const thisMonthKey = todayISO.slice(0, 7)
    const dated = tourns.filter(t => t.event_date)
    // Next coming up = the soonest event today-or-later (gets the green highlight ring).
    const nextT = dated.filter(t => t.event_date >= todayISO).sort((a, b) => a.event_date.localeCompare(b.event_date))[0]
    const nextISO = nextT ? nextT.event_date : null
    // Map each date → its event(s), and the months that actually contain events.
    const byDate = {}
    dated.forEach(t => { (byDate[t.event_date] = byDate[t.event_date] || []).push(t) })
    const monthKeys = [...new Set(dated.map(t => t.event_date.slice(0, 7)))].sort()
    const futureMonths = monthKeys.filter(mk => mk >= thisMonthKey)
    const pastMonths = monthKeys.filter(mk => mk < thisMonthKey)

    // One day cell in the month grid.
    const dayCell = (cell, i) => {
      if (!cell) return <div key={i} />
      const evs = byDate[cell.iso] || []
      const isToday = cell.iso === todayISO
      const isPast = cell.iso < todayISO
      if (evs.length === 0) {
        return (
          <div key={i} style={{ minHeight: 46, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '4px 6px', fontSize: 11, borderRadius: 8, color: isPast ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.4)', background: isToday ? 'rgba(255,255,255,0.05)' : 'transparent', border: isToday ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent' }}>{cell.day}</div>
        )
      }
      const t = evs[0]
      const tb = typeBadge(t.type)
      const full = t.paid >= t.cap
      const isNext = cell.iso === nextISO
      return (
        <button key={i} onClick={() => open(t.id)} disabled={busy} title={`${t.name} · ${t.paid}/${t.cap} booked${t.run ? ` · ${t.run.status === 'setup' ? 'set up' : t.run.status}` : ''}`} style={{
          minHeight: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, cursor: 'pointer', position: 'relative',
          borderRadius: 10, padding: '2px', color: '#fff', opacity: isPast ? 0.55 : 1,
          background: isPast ? 'rgba(255,255,255,0.04)' : `${tb.c}22`,
          border: isNext ? `2px solid ${GREEN}` : `1px solid ${tb.c}55`,
          boxShadow: isNext ? `0 0 0 3px ${GREEN}26` : 'none',
        }}>
          <span style={{ position: 'absolute', top: 3, right: 5, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{cell.day}</span>
          <span style={{ fontSize: 15, lineHeight: 1 }}>{t.type === 'doubles' ? '👥' : t.type === 'singles' ? '👤' : '🏓'}</span>
          <span style={{ fontSize: 10.5, fontWeight: 800, lineHeight: 1, color: full ? RED : '#fff' }}>{t.paid}/{t.cap}</span>
          {t.run && <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: GREEN, lineHeight: 1 }}>{t.run.status === 'setup' ? 'set up' : t.run.status}</span>}
          {evs.length > 1 && <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', lineHeight: 1 }}>+{evs.length - 1}</span>}
        </button>
      )
    }

    const monthGrid = (mk) => {
      const [y, m] = mk.split('-').map(Number)
      const weeks = monthMatrix(y, m - 1)
      return (
        <div key={mk} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{MONTH_NAMES[m - 1]} {y}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {WEEKDAYS.map((w, i) => <div key={`h${i}`} style={{ textAlign: 'center', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.03em', color: 'rgba(255,255,255,0.35)', paddingBottom: 2 }}>{w[0]}</div>)}
            {weeks.flat().map((cell, i) => dayCell(cell, i))}
          </div>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="serif" style={{ fontSize: 22, color: '#fff' }}>🏓 Ping Pong tournaments</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>Your booked ping pong nights — tap a date to see who's paid and run the tournament. Entrants come straight from online bookings.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button onClick={openVouchers} style={pill(false)}>🎟 Vouchers</button><button onClick={openLeague} style={pill(false)}>🏆 League table</button></div>
        </div>
        {err && <div style={errBox}>{err}</div>}
        {loading ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Loading…</div> : dated.length === 0 ? <div style={muted}>No ping pong nights booked yet.</div> : (
          <>
            {/* Next coming up — the highlighted date, pulled out so it's tap-first on phone. */}
            {nextT && (() => {
              const tb = typeBadge(nextT.type); const full = nextT.paid >= nextT.cap
              return (
                <button onClick={() => open(nextT.id)} disabled={busy} style={{ textAlign: 'left', width: '100%', cursor: 'pointer', background: CARD, border: `2px solid ${GREEN}`, boxShadow: `0 0 0 4px ${GREEN}1f`, borderRadius: 14, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: GREEN }}>Next coming up</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 3 }}>{nextT.name}</div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>{fmtDate(nextT.event_date)}</span>
                      <span style={{ color: tb.c, fontWeight: 700 }}>{tb.txt}</span>
                      {nextT.run && <span style={{ color: GREEN, fontWeight: 700 }}>· {nextT.run.status === 'setup' ? 'set up' : nextT.run.status}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: full ? RED : '#fff' }}>{nextT.paid}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> / {nextT.cap}</span></div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: full ? RED : 'rgba(255,255,255,0.4)' }}>{full ? 'Full' : 'booked'}</div>
                  </div>
                </button>
              )
            })()}

            {/* Legend — every ping pong night is a Sunday-6pm TEAM night */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: `${PURPLE}22`, border: `1px solid ${PURPLE}55` }} />👥 Team night · Sundays 6pm</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: 'transparent', border: `2px solid ${GREEN}` }} />Next up</span>
            </div>

            {futureMonths.map(monthGrid)}

            {pastMonths.length > 0 && (
              <>
                <button onClick={() => setShowPast(v => !v)} style={{ ...pill(false), alignSelf: 'flex-start' }}>{showPast ? 'Hide past nights' : `Show past nights (${pastMonths.length} ${pastMonths.length === 1 ? 'month' : 'months'})`}</button>
                {showPast && <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.8 }}>{pastMonths.slice().reverse().map(monthGrid)}</div>}
              </>
            )}
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
  // Display order for the rounds column: NEWEST first (founder direction
  // 12 Aug 2026) so the round being played sits at the top, level with the
  // standings, and finished rounds stack underneath. `rounds` itself stays in
  // DB order — curRound and every id lookup depend on it.
  const orderedRounds = [...rounds].sort((a, b) => (b.ordinal || 0) - (a.ordinal || 0))
  const curRound = rounds[rounds.length - 1]
  const curDone = curRound ? matches.filter(m => m.round_id === curRound.id).every(m => m.status === 'done') : true

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={() => { setView('list'); loadList() }} style={{ ...btn('ghost'), position: 'sticky', top: 0, zIndex: 25, alignSelf: 'flex-start', boxShadow: '0 6px 14px rgba(0,0,0,0.5)' }}>← All ping pong nights</button>

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
        <div style={infoBox}>{run.paidCount} paid online → auto-entered. Teams enter under their team name. Add a cash walk-in team, rename or remove anyone, then start the rounds.</div>
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

      {/* ══ ROUNDS: two-column layout — rounds on the LEFT (NEWEST at top, older
          rounds stack below), standings on the RIGHT. Every "option"
          (substitute player, undo, start knockout, restart…) lives in the ☰
          drawer so the founder can find them in one predictable place. ══ */}
      {status === 'rounds' && <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
          {/* LEFT — rounds (newest first, "+ Add another round" under the current one) */}
          <div style={{ flex: '2 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Score entry hint — deuce rule (founder 3 Aug 2026): first to 11, win by 2. */}
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Games are <strong style={{ color: 'rgba(255,255,255,0.75)' }}>first to 11, win by 2</strong>. Pick the <strong style={{ color: 'rgba(255,255,255,0.75)' }}>loser's</strong> score and the winner fills itself in — deuce included (pick 10 → 12–10, pick 13 → 15–13).</div>
        {/* Rounds — newest at top so the round in play is always the first thing
            you see, next to the standings; older rounds read down the page as
            history (founder direction 12 Aug 2026, replacing the 30 Jul order). */}
        {orderedRounds.map((rnd, ri) => {
          const rms = matches.filter(m => m.round_id === rnd.id).sort((a, b) => (a.slot || 0) - (b.slot || 0))
          const done = rms.filter(m => m.status === 'done').length
          return (
            <React.Fragment key={rnd.id}>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Round {rnd.ordinal}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {ri === 0 && done < rms.length && <button onClick={() => callPlayers(null, rnd.id)} disabled={busy} title="Text everyone still to play in this round" style={{ background: 'none', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 7, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>📣 Call players</button>}
                  <div style={{ fontSize: 11, color: done === rms.length ? GREEN : AMBER, fontWeight: 700 }}>{done}/{rms.length} played</div>
                </div>
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
                      {/* Table badge — shows which physical table this pair is on.
                          Populated by the edge fn's reassignTables helper; unassigned
                          pending matches (waiting for a table to free up) show "—". */}
                      <TableBadge n={m.table_number} pending={!doneM} />
                      {!doneM && <button onClick={() => callPlayers(m.id)} disabled={busy} title="Text both players to come to the table" style={{ background: 'none', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 6, padding: '3px 7px', fontSize: 12, cursor: 'pointer', lineHeight: 1.2, flexShrink: 0 }}>📣</button>}
                      <div style={{ flex: 1, minWidth: 90, textAlign: 'right', fontSize: 13.5, fontWeight: p1win ? 800 : 600, color: p1win ? GREEN : '#fff' }}>{nameById[m.p1_id]}</div>
                      <ScoreSelect value={v1} onPick={val => setScore(m.id, 'p1', val)} disabled={busy || doneM} max={(run.run?.settings?.raceTo || 11) + 10} />
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>–</span>
                      <ScoreSelect value={v2} onPick={val => setScore(m.id, 'p2', val)} disabled={busy || doneM} max={(run.run?.settings?.raceTo || 11) + 10} />
                      <div style={{ flex: 1, minWidth: 90, fontSize: 13.5, fontWeight: p2win ? 800 : 600, color: p2win ? GREEN : '#fff' }}>{nameById[m.p2_id]}</div>
                      {doneM
                        ? <button onClick={() => reopenMatch(m)} disabled={busy} title="Edit result" style={iconBtn}>✎</button>
                        : <button onClick={() => saveScore(m)} disabled={busy} style={{ ...btn('gold'), padding: '6px 12px', flexShrink: 0 }}>Save</button>}
                    </div>
                  )
                })}
              </div>
            </div>
            {/* "+ Add another round" sits directly UNDER the current round, so a
                new draw appears immediately above it and the older rounds below
                stay out of the way. Always enabled; pairings use standings so far. */}
            {ri === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, marginBottom: 4 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={nextRound} disabled={busy} style={{ ...btn('gold'), padding: '12px 18px', fontSize: 14 }}>+ Add another round</button>
                </div>
                {!curDone && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>Round {curRound?.ordinal} still has open matches — that's fine, the next round pairs from the standings you have so far.</div>}
                {/* Add a team/player mid-tournament — was drawer-only, surfaced here
                    on the founder's word during a live night (12 Aug 2026). They
                    join the NEXT round's draw; take the entry fee at the bar. */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input value={walkin} onChange={e => setWalkin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addWalkin() }} placeholder="Add a team / player…" style={{ flex: '1 1 150px', minWidth: 0, padding: '9px 10px', fontSize: 13.5, borderRadius: 8, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none' }} />
                  <button onClick={addWalkin} disabled={busy || !walkin.trim()} style={{ ...btn('ghost'), padding: '9px 13px', fontSize: 13, opacity: walkin.trim() ? 1 : 0.45 }}>＋ Add</button>
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: -3 }}>Goes straight into the next round's draw — take the entry fee at the bar.</div>
                {callMsg && (
                  <div onClick={() => setCallMsg(null)} title="tap to dismiss" style={{ fontSize: 12, lineHeight: 1.5, color: '#fff', background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>{callMsg}</div>
                )}
                {orderedRounds.length > 1 && <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700 }}>Earlier rounds ↓</div>}
              </div>
            )}
            </React.Fragment>
          )
        })}

        {orderedRounds.length === 0 && (
          <button onClick={nextRound} disabled={busy} style={{ ...btn('gold'), padding: '12px 18px', fontSize: 14 }}>+ Add another round</button>
        )}
          </div>

          {/* RIGHT — live standings (reference column). Sticky (founder rule
              4 Aug 2026): the table pins to the top of the window while the
              rounds column scrolls, so scores stay in view. On phones the
              columns stack and the stickiness naturally does nothing. */}
          <div style={{ flex: '1 1 300px', minWidth: 0, background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, position: 'sticky', top: 12, alignSelf: 'flex-start', maxHeight: 'calc(100dvh - 90px)', overflowY: 'auto' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 10 }}>📊 Standings <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.45)' }}>· pts → point diff</span></div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'right', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ textAlign: 'left', padding: '0 8px 6px 0' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '0 8px 6px 0' }}>Team</th>
                    {[['P', 'Played'], ['W', 'Won'], ['L', 'Lost'], ['F', 'Points won'], ['A', 'Points lost'], ['+/−', 'Point difference — the tiebreaker when level on points'], ['Pts', 'Points']].map(([h, tip]) => <th key={h} title={tip} style={{ padding: '0 7px 6px', cursor: 'help' }}>{h}</th>)}
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
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 1.5 }}>P · W · L · F points won · A points lost · <strong style={{ color: 'rgba(255,255,255,0.65)' }}>+/−</strong> point difference · Pts</div>
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
        const roundLabel = (r) => { const inRound = Math.pow(2, totalRounds - r); return inRound === 1 ? 'The Final' : inRound === 2 ? 'Semi-finals' : inRound === 4 ? 'Quarter-finals' : `1/${inRound} Finals` }
        // Knockout target: first to 21 (deuce past 20–20). The dropdown ceiling sits 10
        // above so deuce finishes (23–21…) can be entered.
        const koWin = run.run?.settings?.koRaceTo || 21
        const selMax = koWin + 10
        const bo3On = !!run.run?.settings?.finalBestOf3
        const BracketMatch = ({ m }) => {
          if (m.is_bye) return <div style={{ ...bracketBox, color: 'rgba(255,255,255,0.6)' }}><div style={{ fontWeight: 700, color: '#fff' }}>{nameById[m.p1_id]}</div><div style={{ fontSize: 10.5, color: GREEN }}>bye →</div></div>
          const doneM = m.status === 'done'
          const isFinalM = m.bracket_round === totalRounds && !m.is_third_place

          // ── Best-of-3 (final / 3rd-place): enter each game, first to win 2 ──
          if (bo3On && (m.is_third_place || isFinalM)) {
            const perGame = koWin
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
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Best of 3 · first to {perGame}</div>
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
                                <ScoreSelect value={gv1} onPick={x => setGame(m.id, i, 'p1', x, perGame, working)} disabled={busy} max={selMax} compact />
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>–</span>
                                <ScoreSelect value={gv2} onPick={x => setGame(m.id, i, 'p2', x, perGame, working)} disabled={busy} max={selMax} compact />
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
                ? <ScoreSelect value={val} onPick={x => setScore(m.id, side, x)} disabled={busy} max={selMax} compact />
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
              // Doubles split (founder rule 6 Aug 2026): a place can carry TWO
              // half-vouchers — one per player, each with its own code + email
              // status. Singles (and legacy full vouchers) show one line.
              const vsByPlace = {}
              ;(run.vouchers || []).forEach(v => { (vsByPlace[v.place] = vsByPlace[v.place] || []).push(v) })
              return (
                <div style={{ background: 'rgba(168,85,247,0.10)', border: `1px solid ${PURPLE}88`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FCD34D' }}>🏆 {nameById[placings.first]} — Champion!</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[1, 2, 3].map(place => {
                      const pid = place === 1 ? placings.first : place === 2 ? placings.second : placings.third
                      if (!pid) return null
                      const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉'
                      const fallbackAmt = place === 1 ? '£30' : place === 2 ? '£20' : '£10'
                      const vs = (vsByPlace[place] || []).slice().sort((a, b) => (a.recipient || 1) - (b.recipient || 1))
                      if (!vs.length) return (
                        <div key={place} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                          <span style={{ color: '#fff', fontWeight: 700 }}>{medal} {nameById[pid]}</span>
                          <span style={{ color: PURPLE, fontWeight: 800 }}>{fallbackAmt} tab</span>
                        </div>
                      )
                      return vs.map(v => (
                        <div key={`${place}-${v.recipient || 1}`} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                          <span style={{ color: '#fff', fontWeight: 700 }}>{medal} {nameById[pid]}{vs.length > 1 ? <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}> · player {v.recipient || 1}</span> : null}</span>
                          <span style={{ color: PURPLE, fontWeight: 800 }}>£{Math.round((v.amount_pence || 0) / 100)} tab</span>
                          {v.code && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'ui-monospace, monospace' }}>{v.code}</span>}
                          {v.emailed_at ? <span style={{ fontSize: 11, color: GREEN }}>✓ emailed</span> : v.email ? <span style={{ fontSize: 11, color: AMBER }}>will email</span> : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>no email — give at the bar</span>}
                        </div>
                      ))
                    })}
                  </div>
                  <button onClick={resendVouchers} disabled={busy} style={{ ...btn('ghost'), alignSelf: 'flex-start', padding: '6px 12px', fontSize: 11.5 }}>↻ Re-issue / email vouchers</button>
                </div>
              )
            })()}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>🎯 Knockout bracket</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(168,85,247,0.15)', border: `1px solid ${LINE}`, borderRadius: 999, padding: '3px 10px' }}>first to {koWin} · deuce past {koWin - 1}–{koWin - 1}{run.run?.settings?.thirdPlaceMatch ? ' · 3rd-place match' : ''}{run.run?.settings?.finalBestOf3 ? ' · best-of-3 final' : ''}</span>
            </div>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
              {Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => (
                <div key={r} style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 190, justifyContent: r === totalRounds ? 'center' : 'space-around' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>{roundLabel(r)}</div>
                  {bmatches.filter(m => m.bracket_round === r).sort((a, b) => (a.bracket_slot || 0) - (b.bracket_slot || 0)).map(m => <BracketMatch key={m.id} m={m} />)}
                  {r === totalRounds && tpm && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', marginBottom: 8 }}>3rd-place play-off</div>
                      <BracketMatch m={tpm} />
                    </div>
                  )}
                </div>
              ))}
            </div>
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
        onAddLate={(name) => guard(() => tournAddManual(run.run.id, name))()}
        onAddWalkup={addWalkupSubmit}
        onRenameParticipant={renameFromDrawer}
        walkupNameLabel={'Team name…'}
        walkupPartner={true}
        onUndoRound={undoRound}
        onRefresh={refresh}
        onDeleteRun={() => {
          // Two-step gate per founder direction 2026-07-30 — the first confirm
          // stops an accidental tap; the second (type-to-confirm) stops a
          // reflex "OK" from wiping a live tournament.
          if (!window.confirm('⚠ Restart tournament?\n\nThis DELETES every round, match and score for this night. The roster + paid entries stay.\n\nContinue to the final confirmation.')) return
          const typed = window.prompt('One more safety check.\n\nType RESTART to confirm — anything else cancels.')
          if ((typed || '').trim().toUpperCase() !== 'RESTART') { alert('Restart cancelled — nothing was deleted.'); return }
          guard(async () => { await tournDeleteRun(run.run.id); setView('list'); loadList() })()
        }}
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
// A 0–11 points dropdown (opens the list of numbers). compact = bracket size.
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
// Shows which physical table (T1 / T2) an in-progress match is on. When
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
        borderRadius: 999, fontSize: small ? 11 : 12.5, lineHeight: 1,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)',
        color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: small ? 20 : 24, padding: small ? '2px 5px' : '3px 6px',
      }} title="Waiting for a table to free up">🕐</span>
    )
  }
  return null
}

// ── Add-late-team panel ─────────────────────────────────────────────────────
// Small self-contained input + button used in the ☰ drawer while the rounds
// run, so a late-arriving team can be added without leaving the tournament view.
function AddLatePanel({ busy, onAdd, label, hint }) {
  const [name, setName] = useState('')
  const submit = async () => { const n = name.trim(); if (!n || busy) return; await onAdd(n); setName('') }
  return (
    <div style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{hint}</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder={label}
          disabled={busy}
          style={{ flex: '1 1 160px', minWidth: 120, padding: '9px 11px', fontSize: 14, borderRadius: 8, background: '#000', border: '1px solid rgba(168,85,247,0.35)', color: '#fff', outline: 'none' }}
        />
        <button onClick={submit} disabled={busy || !name.trim()} style={{ ...btn('gold'), padding: '9px 14px', opacity: (busy || !name.trim()) ? 0.5 : 1 }}>+ Add</button>
      </div>
    </div>
  )
}


// ── Walk-up sign-up panel ───────────────────────────────────────────────────
// Full mid-tournament sign-up, exactly like booking online (founder rule
// 6 Aug 2026): creates a real booking entry (pending payment), drops them
// into the run NOW, and emails them a secure Stripe link to pay the entry
// fee. The webhook marks them paid + fires the normal confirmation when the
// link is used. Cash payers can use quick-add instead.
function WalkupPanel({ busy, onAdd, nameLabel, showPartner }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [p2name, setP2name] = useState('')
  const [p2email, setP2email] = useState('')
  const [note, setNote] = useState('')
  const valid = name.trim().length > 1 && /.+@.+\..+/.test(email.trim())
  const inp = { padding: '9px 11px', fontSize: 14, borderRadius: 8, background: '#000', border: '1px solid rgba(168,85,247,0.35)', color: '#fff', outline: 'none', minWidth: 0 }
  const submit = async () => {
    if (!valid || busy) return
    const r = await onAdd({ name: name.trim(), email: email.trim(), phone: phone.trim(), partnerName: p2name.trim(), partnerEmail: p2email.trim() })
    if (r && r.ok) {
      setNote(r.emailed ? `✓ ${name.trim()} is in — payment link emailed` : `✓ ${name.trim()} is in — pay-link email failed, take cash instead`)
      setName(''); setEmail(''); setPhone(''); setP2name(''); setP2email('')
    }
  }
  return (
    <div style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>Signs them up like an online booking: they join the tournament straight away and get an email with a secure Stripe link to pay the entry fee.</span>
      <input value={name} onChange={e => setName(e.target.value)} placeholder={nameLabel} disabled={busy} style={inp} />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (payment link goes here)…" type="email" disabled={busy} style={inp} />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)…" type="tel" disabled={busy} style={inp} />
      {showPartner && <>
        <input value={p2name} onChange={e => setP2name(e.target.value)} placeholder="Player 2 name (optional)…" disabled={busy} style={inp} />
        <input value={p2email} onChange={e => setP2email(e.target.value)} placeholder="Player 2 email (their half of any prize)…" type="email" disabled={busy} style={inp} />
      </>}
      <button onClick={submit} disabled={busy || !valid} style={{ ...btn('gold'), padding: '10px', opacity: (busy || !valid) ? 0.5 : 1 }}>🚶 Sign up & email the pay link</button>
      {note && <span style={{ fontSize: 11.5, color: GREEN }}>{note}</span>}
    </div>
  )
}

// ── Rename panel ────────────────────────────────────────────────────────────
// Fix a name / team name mid-tournament — cascades everywhere instantly and
// KEEPS league points (substitution is the one that nulls the night). League
// identity follows the booking email, so a rename never splits a player's
// season record.
function RenamePanel({ participants, busy, onRename }) {
  const [pid, setPid] = useState('')
  const [name, setName] = useState('')
  const active = (participants || []).filter(p => p.active)
  if (!active.length) return null
  const submit = async () => { const n = name.trim(); if (!pid || !n || busy) return; await onRename(pid, n); setPid(''); setName('') }
  return (
    <div style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>Fix a spelling or change a team name — applies everywhere at once and keeps their league points. (A DIFFERENT person stepping in? Use Substitute below instead.)</span>
      <select value={pid} onChange={e => setPid(e.target.value)} disabled={busy} style={{ padding: '8px 10px', fontSize: 13, borderRadius: 8, background: '#000', border: '1px solid rgba(168,85,247,0.35)', color: '#fff', outline: 'none' }}>
        <option value="">Pick who to rename…</option>
        {active.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
      </select>
      {pid && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit() }} placeholder="New name…" disabled={busy} style={{ flex: '1 1 150px', minWidth: 120, padding: '9px 11px', fontSize: 14, borderRadius: 8, background: '#000', border: '1px solid rgba(168,85,247,0.35)', color: '#fff', outline: 'none' }} />
        <button onClick={submit} disabled={busy || !name.trim()} style={{ ...btn('gold'), padding: '9px 14px', opacity: (busy || !name.trim()) ? 0.5 : 1 }}>Save</button>
      </div>}
    </div>
  )
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
  participants, replacing, setReplacing, onSaveReplace, onAddLate,
  onAddWalkup, onRenameParticipant, walkupNameLabel, walkupPartner,
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
        {/* Pinned: the drawer is its own scroller, so an unpinned ✕ scrolled out of
            sight once the options list got long — leaving only a thin strip of
            backdrop to escape by (founder: "no way out"). */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, position: 'sticky', top: -18, zIndex: 2, background: '#0b0713', paddingTop: 18, marginTop: -18, paddingBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: PURPLE, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Tournament options</div>
          <button onClick={onClose} aria-label="Close" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`, color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* No format section here (pool has a singles/doubles flip) — every ping
            pong night is a TEAM night, founder rule 3 Aug 2026. */}

        {/* Add a late team — founder rule 4 Aug 2026: joining mid-tournament is
            allowed while the Swiss rounds run. They start on 0 points and get
            drawn into the NEXT round. Not shown in the knockout — bracket is fixed. */}
        {isRounds && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>🚶 Walk-up sign-up — emails a pay link</div>
            <WalkupPanel busy={busy} onAdd={onAddWalkup} nameLabel={walkupNameLabel} showPartner={walkupPartner} />
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>➕ Quick add (cash at the bar)</div>
            <AddLatePanel busy={busy} onAdd={onAddLate} label="Team name…" hint="No email, no link — just drops them straight into the next round. Take cash at the bar." />
          </div>
        )}

        {/* Substitute a player — the highest-touch mid-tournament action */}
        {(isRounds || isKO) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>🔁 Change team names / substitute</div>
            <RenamePanel participants={participants} busy={busy} onRename={onRenameParticipant} />
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
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Match length — first to</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[11, 15, 21].map(n => {
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
