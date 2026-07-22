import React, { useEffect, useState } from 'react'
import { tournList, tournOpen, tournAddManual, tournRename, tournRemove, tournRestore } from '../../tournament/api.js'

// ─── Pool tournaments (founder) ──────────────────────────────────────────────
// Slice 1: pick a booked pool night, see the paid entrants auto-pulled in, and
// tidy the roster (add a walk-in, rename, remove) before the night starts.
// Reads the live booking data; writes only to the pool_* tables. Rounds + knockout
// arrive in the next slices.

const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33', PURPLE = '#A855F7', BLUE = '#60A5FA'
const CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'
const fmtDate = (d) => d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''
const typeBadge = (t) => t === 'doubles' ? { txt: '👥 Doubles', c: PURPLE } : t === 'singles' ? { txt: '👤 Singles', c: BLUE } : { txt: t || '—', c: 'rgba(255,255,255,0.5)' }

export default function Tournament() {
  const [view, setView] = useState('list')     // 'list' | 'run'
  const [tourns, setTourns] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [run, setRun] = useState(null)          // { tournament, run, paidCount, participants }
  const [busy, setBusy] = useState(false)
  const [walkin, setWalkin] = useState('')
  const [editing, setEditing] = useState(null)  // participantId being renamed
  const [editVal, setEditVal] = useState('')

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
  const refresh = async () => { if (run) await open(run.tournament.id) }

  const addWalkin = async () => {
    const name = walkin.trim(); if (!name || !run) return
    setBusy(true)
    try { await tournAddManual(run.run.id, name); setWalkin(''); await refresh() }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const saveRename = async (id) => {
    const name = editVal.trim(); if (!name) { setEditing(null); return }
    setBusy(true)
    try { await tournRename(id, name); setEditing(null); await refresh() }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const remove = async (p) => {
    if (p.source === 'manual' && !window.confirm(`Remove walk-in "${p.display_name}"?`)) return
    setBusy(true)
    try { await tournRemove(p.id); await refresh() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const restore = async (id) => { setBusy(true); try { await tournRestore(id); await refresh() } catch (e) { alert(e.message) } finally { setBusy(false) } }

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
              {t.run && <span style={{ color: GREEN, fontWeight: 700 }}>· started</span>}
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
        <div>
          <div className="serif" style={{ fontSize: 22, color: '#fff' }}>🎱 Pool tournaments</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>Your booked pool nights — tap one to see who's paid and run the tournament. Entrants come straight from online bookings.</div>
        </div>
        {err && <div style={{ fontSize: 12.5, color: '#F87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 8, padding: '9px 12px' }}>{err}</div>}
        {loading ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Loading…</div> : (
          <>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upcoming</div>
            {upcoming.length === 0 ? <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>No upcoming pool nights.</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{upcoming.map(card)}</div>}
            {past.length > 0 && <>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 6 }}>Past</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.75 }}>{past.slice(0, 12).map(card)}</div>
            </>}
          </>
        )}
      </div>
    )
  }

  // ── One night's roster ──────────────────────────────────────────────────────
  const t = run.tournament
  const parts = run.participants || []
  const activeParts = parts.filter(p => p.active)
  const removedParts = parts.filter(p => !p.active)
  const tb = typeBadge(t.type)
  const full = activeParts.length >= t.cap
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={() => { setView('list'); loadList() }} style={{ ...btn('ghost'), alignSelf: 'flex-start' }}>← All pool nights</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 21, color: '#fff' }}>{t.name}</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span>{fmtDate(t.event_date)}</span><span style={{ color: tb.c, fontWeight: 700 }}>{tb.txt}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: full ? RED : '#fff', lineHeight: 1 }}>{activeParts.length}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> / {t.cap}</span></div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: full ? RED : GREEN, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{full ? '● Full' : 'entrants'}</div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 8, padding: '10px 12px' }}>
        {run.paidCount} paid online → auto-entered. {t.type === 'doubles' ? 'Doubles show by team name.' : ''} Add a cash walk-in below, rename or remove anyone, then the rounds start next (coming in the next update).
      </div>

      {/* Roster */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {activeParts.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: CARD, border: `1px solid ${LINE}`, borderRadius: 9, padding: '9px 11px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', minWidth: 20 }}>{i + 1}</span>
            {editing === p.id ? (
              <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveRename(p.id); if (e.key === 'Escape') setEditing(null) }} onBlur={() => saveRename(p.id)}
                style={{ flex: 1, padding: '6px 9px', fontSize: 14, borderRadius: 7, background: '#000', border: `1px solid ${RED}`, color: '#fff', outline: 'none' }} />
            ) : (
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.display_name}</div>
            )}
            <span title={p.source === 'manual' ? 'Walk-in (cash)' : 'Booked online'} style={{ fontSize: 10, fontWeight: 700, color: p.source === 'manual' ? AMBER : GREEN, border: `1px solid ${p.source === 'manual' ? AMBER : GREEN}55`, borderRadius: 5, padding: '2px 6px', flexShrink: 0 }}>{p.source === 'manual' ? '✋ walk-in' : '🎟️ ticket'}</span>
            <button onClick={() => { setEditing(p.id); setEditVal(p.display_name) }} disabled={busy} title="Rename" style={iconBtn}>✎</button>
            <button onClick={() => remove(p)} disabled={busy} title="Remove" style={{ ...iconBtn, color: '#F87171' }}>✕</button>
          </div>
        ))}
        {activeParts.length === 0 && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', padding: '6px 2px' }}>No entrants yet. They'll appear here as people pay online, or add a walk-in below.</div>}
      </div>

      {/* Add walk-in */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={walkin} onChange={e => setWalkin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addWalkin() }} placeholder="Add a walk-in (name / team)…" disabled={full}
          style={{ flex: 1, minWidth: 180, padding: '9px 11px', fontSize: 14, borderRadius: 8, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none', opacity: full ? 0.5 : 1 }} />
        <button onClick={addWalkin} disabled={busy || !walkin.trim() || full} style={{ ...btn('gold'), opacity: (busy || !walkin.trim() || full) ? 0.5 : 1 }}>+ Add walk-in</button>
        <button onClick={refresh} disabled={busy} style={btn('ghost')} title="Re-check who's paid online">↻ Refresh</button>
      </div>
      {full && <div style={{ fontSize: 11.5, color: AMBER }}>This night is full ({t.cap}). Remove someone to add another.</div>}

      {/* Removed (kept so a mistaken removal is one tap back) */}
      {removedParts.length > 0 && (
        <div style={{ borderTop: `1px dashed ${LINE}`, paddingTop: 12 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Removed</div>
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

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: '#fff' }}>Next up:</strong> once the field's set, the <strong style={{ color: '#fff' }}>rounds</strong> (Swiss) and live standings — then the <strong style={{ color: '#fff' }}>knockout</strong> bracket — will run from right here.
      </div>
    </div>
  )
}

const btn = (kind) => {
  const base = { padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: RED, color: '#fff' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
}
const iconBtn = { width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', fontSize: 13, cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }
