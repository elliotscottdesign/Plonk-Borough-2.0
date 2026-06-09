import React, { useState, useEffect } from 'react'
import DJRoster, { Avatar } from './DJRoster.jsx'
import { djAdmin, setTypeLabel } from '../../dj/api.js'
import MonthCalendar from '../../dj/MonthCalendar.jsx'

// ─── DJ Bookings — live Calendar + Roster (admin) ────────────────────────
// Reads/writes Supabase via dj-admin. Two views:
//   📅 Calendar — open the 3 weekly sessions; DJs claim them via their portal;
//                 you sign off. Pending = pre-release · Confirmed = main calendar.
//   🎚️ Roster   — the live DJ profile database + per-DJ invite links.

const WEEKS_AHEAD = 12
const SESSIONS = {
  1: { day: 'Monday', start: '19:00', end: '23:00', kind: 'opendecks' },
  2: { day: 'Tuesday', start: '19:00', end: '23:00', kind: 'opendecks' },
  3: { day: 'Wednesday', start: '19:00', end: '23:00', kind: 'opendecks' },
  4: { day: 'Thursday', start: '19:00', end: '23:00', kind: 'session' },
  5: { day: 'Friday', start: '20:00', end: '00:00', kind: 'session' },
  6: { day: 'Saturday', start: '20:00', end: '00:00', kind: 'session' },
}
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fmt = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const timeLabel = (s) => `${s.start.replace(':00', '')}${Number(s.start.slice(0, 2)) < 12 ? 'am' : 'pm'}–${s.end === '00:00' ? '12am' : s.end.replace(':00', '') + 'pm'}`
function upcomingSessions(weeks) {
  const out = []
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const end = new Date(today); end.setDate(end.getDate() + weeks * 7)
  const d = new Date(today)
  while (d <= end) { if (SESSIONS[d.getDay()]) out.push({ date: iso(d), session: SESSIONS[d.getDay()] }); d.setDate(d.getDate() + 1) }
  return out
}

export default function DJBookings() {
  const [view, setView] = useState('calendar')
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    try { setData(await djAdmin('load')); setErr('') }
    catch (e) { setErr(e.message || String(e)) } finally { setLoading(false) }
  }
  useEffect(() => { reload() }, [])

  const needsSetup = err && /does not exist|relation|schema/i.test(err)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* No Dice wordmark — branding for DJs viewing this page (DJ-only access) */}
      <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 'min(190px, 54vw)', height: 'auto', display: 'block', marginBottom: 4 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {[['calendar', '📅 Calendar'], ['roster', '🎚️ DJ Roster']].map(([k, label]) => (
          <button key={k} onClick={() => setView(k)} style={{
            padding: '7px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
            background: view === k ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${view === k ? '#DA1B33' : 'rgba(255,255,255,0.1)'}`,
            color: view === k ? '#DA1B33' : '#FFFFFF', fontWeight: view === k ? 600 : 400,
          }}>{label}</button>
        ))}
      </div>

      {loading && !data ? (
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, padding: 20 }}>Loading the live DJ database…</div>
      ) : needsSetup ? (
        <div style={{ background: '#0A0A0A', border: '1px solid #FCD34D', borderRadius: 10, padding: 18, color: '#FDE68A', fontSize: 13, lineHeight: 1.6 }}>
          <strong style={{ color: '#fff' }}>One setup step left.</strong> The DJ database tables aren't created yet. Run the SQL in <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3 }}>supabase/dj-schema.sql</code> once in Supabase → SQL Editor, then refresh.
        </div>
      ) : err && !data ? (
        <div style={{ color: '#F87171', fontSize: 13, padding: 20 }}>Couldn't load: {err}</div>
      ) : view === 'roster' ? (
        <DJRoster djs={data.djs} reload={reload} />
      ) : (
        <Calendar data={data} reload={reload} />
      )}
    </div>
  )
}

function Calendar({ data, reload }) {
  const { djs, slots } = data
  const [adding, setAdding] = useState(null)
  const [form, setForm] = useState({ djId: '', night: '' })
  const [busy, setBusy] = useState(false)

  const sessions = upcomingSessions(WEEKS_AHEAD)
  const byDate = Object.fromEntries((slots || []).map(s => [s.date, s]))
  const act = async (action, payload) => { setBusy(true); try { await djAdmin(action, payload); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const startAdd = (date) => { setAdding(date); setForm({ djId: '', night: '' }) }
  const saveAdd = async (date) => { if (!form.djId) return; await act('book', { date, djId: form.djId, nightName: form.night }); setAdding(null) }

  const now = new Date()
  const [viewY, setViewY] = useState(now.getFullYear())
  const [viewM, setViewM] = useState(now.getMonth())
  const [selDate, setSelDate] = useState(null)
  const shiftMonth = (n) => { let m = viewM + n, y = viewY; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } setViewY(y); setViewM(m) }
  const canPrevMonth = viewY > now.getFullYear() || (viewY === now.getFullYear() && viewM > now.getMonth())
  const calCell = (dateStr) => {
    const session = SESSIONS[new Date(dateStr + 'T00:00:00').getDay()]
    if (!session) return null
    const slot = byDate[dateStr]
    return { tone: slot ? slot.status : 'closed', kind: session.kind, disabled: false }
  }

  const open = (slots || []).filter(s => s.status === 'open' && !s.dj_id).length
  const pending = (slots || []).filter(s => s.status === 'pending').length
  const confirmed = (slots || []).filter(s => s.status === 'confirmed').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="serif" style={{ fontSize: 22, color: '#FFFFFF' }}>📅 Booking calendar</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, maxWidth: 760, lineHeight: 1.6 }}>
          Open the dates you want to fill — DJs claim them from their portal. <strong style={{ color: '#FFFFFF' }}>Pending</strong> = pre-release · <strong style={{ color: '#FFFFFF' }}>Confirmed</strong> = main events calendar.
          Sessions: <em>Thu {timeLabel(SESSIONS[4])} · Fri {timeLabel(SESSIONS[5])} · Sat {timeLabel(SESSIONS[6])}</em>.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[['Open for DJs', open, '#DA1B33'], ['Pending sign-off', pending, '#FCD34D'], ['Confirmed', confirmed, '#34D399']].map(([label, n, c]) => (
          <div key={label} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '12px 18px', minWidth: 130 }}>
            <div className="serif" style={{ fontSize: 26, color: c, lineHeight: 1 }}>{n}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <MonthCalendar year={viewY} month={viewM} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} canPrev={canPrevMonth}
        cellFor={calCell} onDay={(d) => { setSelDate(d); setAdding(null) }} selected={selDate}
        legend={<>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#DA1B33', marginRight: 5, verticalAlign: 'middle' }} />Session</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#34D399', marginRight: 5, verticalAlign: 'middle' }} />Open Decks</span>
          <span>dashed = closed · red = open · amber = pending · green = confirmed</span>
        </>} />

      {selDate ? (() => {
        const date = selDate
        const session = SESSIONS[new Date(date + 'T00:00:00').getDay()]
        if (!session) return null
        const slot = byDate[date]
        const status = slot ? slot.status : 'closed'
        const accent = status === 'confirmed' ? '#34D399' : status === 'pending' ? '#FCD34D' : status === 'open' ? '#DA1B33' : 'rgba(255,255,255,0.25)'
        const booked = slot && slot.dj_id
        return (
          <div style={{ background: '#0A0A0A', border: '1px solid rgba(218,27,51,0.4)', borderLeft: `3px solid ${accent}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 150 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>{fmt(date)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{session.day} · {timeLabel(session)}</div>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: session.kind === 'session' ? '#DA1B33' : '#34D399', border: `1px solid ${session.kind === 'session' ? 'rgba(218,27,51,0.5)' : 'rgba(52,211,153,0.5)'}`, borderRadius: 999, padding: '1px 7px', display: 'inline-block', marginTop: 4 }}>{session.kind === 'session' ? 'Paid session' : 'Open Decks'}</span>
              </div>
              <div style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 10 }}>
                {booked ? (
                  <>
                    <Avatar d={slot.dj || { dj_name: '?' }} size={34} />
                    <div style={{ fontSize: 13, color: '#FFFFFF' }}>
                      <div><strong>{slot.dj?.dj_name || 'DJ'}</strong>{slot.genre ? ` · ${slot.genre}` : ''}{slot.night_name ? <> · <em style={{ color: '#DA1B33' }}>"{slot.night_name}"</em></> : null}<span style={{ marginLeft: 8, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, fontWeight: 700 }}>{status}</span></div>
                      {(slot.set_type || slot.promo_track) && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{slot.set_type ? setTypeLabel(slot.set_type) : ''}{slot.set_type && slot.promo_track ? ' · ' : ''}{slot.promo_track ? `🎵 ${slot.promo_track}` : ''}</div>}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{status === 'open' ? 'Open · waiting for a DJ' : 'Closed'}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {!booked && <button onClick={() => act(status === 'open' ? 'close' : 'open', { date })} disabled={busy} style={btn(status === 'open' ? 'ghost' : 'gold')}>{status === 'open' ? 'Close' : 'Open for DJs'}</button>}
                {!booked && status === 'open' && <button onClick={() => startAdd(date)} disabled={busy} style={btn('ghost')}>+ Add DJ</button>}
                {booked && status === 'pending' && <button onClick={() => act('signoff', { date })} disabled={busy} style={btn('green')}>✓ Sign off</button>}
                {booked && status === 'confirmed' && <button onClick={() => act('unconfirm', { date })} disabled={busy} style={btn('ghost')}>Un-confirm</button>}
                {booked && <button onClick={() => act('removeBooking', { date })} disabled={busy} style={btn('red')}>Remove</button>}
              </div>
            </div>
            {adding === date && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <Dropdown value={form.djId} onChange={v => setForm(f => ({ ...f, djId: v }))} placeholder="— pick a DJ from the roster —" width={220} options={(djs || []).map(r => ({ value: r.id, label: r.dj_name }))} />
                <input value={form.night} onChange={e => setForm(f => ({ ...f, night: e.target.value }))} placeholder="Night name (optional)" style={inp(170)} />
                <button onClick={() => saveAdd(date)} disabled={busy || !form.djId} style={btn('gold')}>Save</button>
                <button onClick={() => setAdding(null)} style={btn('ghost')}>Cancel</button>
              </div>
            )}
          </div>
        )
      })() : <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Tap a date to open it or manage its booking.</div>}
    </div>
  )
}

// Branded No Dice dropdown (replaces native <select> so the open list is on-brand).
function Dropdown({ value, onChange, options, placeholder = 'Select…', width = 220 }) {
  const [open, setOpen] = useState(false)
  const sel = options.find(o => o.value === value)
  return (
    <div style={{ position: 'relative', width }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', fontSize: 13, borderRadius: 7, background: '#000000', border: `1px solid ${open ? '#DA1B33' : 'rgba(255,255,255,0.18)'}`, color: sel ? '#FFFFFF' : 'rgba(255,255,255,0.5)', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sel ? sel.label : placeholder}</span>
        <span style={{ color: '#DA1B33', fontSize: 10 }}>▼</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: '#0A0A0A', border: '1px solid rgba(218,27,51,0.45)', borderRadius: 8, maxHeight: 260, overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            {options.length === 0 && <div style={{ padding: '10px 12px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No DJs yet</div>}
            {options.map(o => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 13, background: o.value === value ? 'rgba(218,27,51,0.18)' : 'transparent', color: o.value === value ? '#fff' : 'rgba(255,255,255,0.85)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: '#DA1B33', color: '#FFFFFF' }
  if (kind === 'green') return { ...base, background: '#34D399', color: '#06281C' }
  if (kind === 'red') return { ...base, background: 'transparent', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.18)' }
}
const inp = (w) => ({ width: w, minWidth: 120, padding: '8px 10px', fontSize: 13, borderRadius: 7, background: '#000000', border: '1px solid rgba(255,255,255,0.18)', color: '#FFFFFF', outline: 'none' })
