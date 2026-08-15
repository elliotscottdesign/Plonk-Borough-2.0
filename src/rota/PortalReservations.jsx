import React, { useCallback, useEffect, useRef, useState } from 'react'
import { rotaReservationsToday, rotaReservationArrive } from './api.js'

// ─── Today's reservations — every staff member's view (rota portal) ───────────
// The day's bookings across golf / pool / tables / tournaments, colour-coded by
// kind, with times, notes and contact details — and a big "Arrived" tick for the
// door. Ticks save server-side (reservation_arrivals via the rota fn), so one tap
// shows on every phone AND the founder's /ops → Events → Reservations screen.
// Polls every 15s like the /ops view; ticking is optimistic then server-confirmed.

const RED = '#DA1B33', GREEN = '#34D399', GOLD = '#C9A84C', TEAL = '#1ec8b8', PURPLE = '#A855F7', AMBER = '#F59E0B'
const CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'
const POLL_MS = 15000
const BIG_PARTY = 8

const KIND_META = {
  table:      { emoji: '🍽', label: 'Table',           color: GOLD },
  pool:       { emoji: '🎱', label: 'Pool table',      color: TEAL },
  golf:       { emoji: '⛳', label: 'Golf',             color: GREEN },
  tournament: { emoji: '🏆', label: 'Pool tournament',  color: PURPLE },
}
const fmtTime = (t) => t ? String(t).slice(0, 5) : '—'

export default function PortalReservations({ token }) {
  const [rows, setRows] = useState(null)     // null = loading
  const [date, setDate] = useState('')
  const [err, setErr] = useState('')
  const [busyKey, setBusyKey] = useState('') // `${kind}:${id}` mid-toggle
  const timer = useRef(null)
  // A poll response that was requested BEFORE the latest tick must never overwrite
  // it (it would silently un-tick the row for up to 15s). Every toggle bumps this;
  // a load only applies its rows if no toggle happened after it started.
  const lastMutation = useRef(0)

  const load = useCallback(async (silent) => {
    const startedAt = Date.now()
    try {
      const r = await rotaReservationsToday(token)
      if (startedAt < lastMutation.current) return   // stale snapshot — discard
      setRows(r.rows || []); setDate(r.date || ''); setErr('')
    } catch (e) { if (!silent) setErr(e.message || 'Could not load') }
  }, [token])

  useEffect(() => {
    load()
    timer.current = setInterval(() => load(true), POLL_MS)
    return () => clearInterval(timer.current)
  }, [load])

  const toggle = async (r) => {
    const key = `${r.kind}:${r.id}`
    const on = !r.arrived
    setBusyKey(key)
    lastMutation.current = Date.now()
    // Optimistic — flip locally, then confirm with the server's answer.
    setRows(rs => rs.map(x => (x.kind === r.kind && x.id === r.id) ? { ...x, arrived: on ? { staff_name: 'you', arrived_at: new Date().toISOString() } : null } : x))
    try {
      const resp = await rotaReservationArrive(token, r.kind, r.id, date, on)
      lastMutation.current = Date.now()   // server confirmed — anything requested earlier is stale
      setRows(rs => rs.map(x => (x.kind === r.kind && x.id === r.id) ? { ...x, arrived: resp.arrived } : x))
    } catch (e) {
      setRows(rs => rs.map(x => (x.kind === r.kind && x.id === r.id) ? { ...x, arrived: r.arrived } : x))   // revert
      alert(e.message || 'Could not save — try again.')
    } finally { setBusyKey('') }
  }

  if (rows === null) return <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, padding: '20px 0' }}>Loading today's bookings…</div>

  const arrivedN = rows.filter(r => r.arrived).length
  const covers = rows.reduce((a, r) => a + (r.party || 0), 0)

  return (
    <div>
      <div className="serif" style={{ fontSize: 18, color: '#fff' }}>📇 Today's reservations</div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', margin: '3px 0 12px', lineHeight: 1.5 }}>
        Live from the website — refreshes itself. When a booking walks in, <strong style={{ color: '#fff' }}>tap ✓ Arrived</strong>; it saves for everyone (all phones + the office).
      </div>
      {err && <div style={{ fontSize: 12.5, color: '#F87171', marginBottom: 10 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={pill('rgba(255,255,255,0.7)')}>{rows.length} booking{rows.length === 1 ? '' : 's'}</span>
        <span style={pill(GOLD)}>{covers} covers</span>
        <span style={pill(GREEN)}>{arrivedN} arrived</span>
      </div>

      {rows.length === 0 && (
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '22px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          Nothing booked in for today yet — new bookings appear here within 15 seconds.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(r => {
          const meta = KIND_META[r.kind] || { emoji: '·', label: r.kind, color: 'rgba(255,255,255,0.5)' }
          const key = `${r.kind}:${r.id}`
          const on = !!r.arrived
          const big = (r.party || 0) >= BIG_PARTY
          return (
            <div key={key} style={{ background: CARD, border: `1px solid ${on ? 'rgba(52,211,153,0.45)' : LINE}`, borderLeft: `4px solid ${meta.color}`, borderRadius: 10, padding: '10px 12px', opacity: on ? 0.82 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{meta.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmtTime(r.time)}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: on ? 'line-through' : 'none' }}>{r.name}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: big ? AMBER : '#fff', flexShrink: 0 }}>{r.party || '—'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta.label}</span>
                {big && <span style={{ fontSize: 10, fontWeight: 800, color: AMBER, background: 'rgba(245,158,11,0.12)', border: `1px solid ${AMBER}55`, borderRadius: 999, padding: '1px 7px', letterSpacing: '0.05em' }}>BIG · {r.party}</span>}
                {r.extra && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{r.extra}</span>}
              </div>
              {r.notes && <div style={{ fontSize: 11.5, color: AMBER, marginTop: 4, lineHeight: 1.45 }}>📝 {r.notes}</div>}
              {(r.phone || r.email) && (
                <div style={{ fontSize: 11.5, marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {r.phone && <a href={`tel:${r.phone}`} style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>📞 {r.phone}</a>}
                  {r.email && <a href={`mailto:${r.email}`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>✉ {r.email}</a>}
                </div>
              )}
              <button onClick={() => toggle(r)} disabled={busyKey === key} style={{
                width: '100%', marginTop: 9, padding: '10px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 800,
                background: on ? 'rgba(52,211,153,0.14)' : RED, color: on ? GREEN : '#fff',
                border: on ? `1.5px solid ${GREEN}` : '1.5px solid transparent', opacity: busyKey === key ? 0.6 : 1,
              }}>
                {on ? `✓ Arrived${r.arrived?.staff_name && r.arrived.staff_name !== 'you' ? ` — ticked by ${r.arrived.staff_name}` : ''} · tap to undo` : '✓ Arrived'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const pill = (color) => ({ fontSize: 11.5, fontWeight: 700, color, background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}55`, borderRadius: 999, padding: '4px 11px' })
