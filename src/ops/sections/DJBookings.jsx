import React, { useState, useEffect } from 'react'

// ─── DJ Bookings — management calendar (admin v1) ────────────────────────
// The founder-facing side of the DJ booking flow:
//   1. Open the dates you want to fill (the 3 weekly sessions).
//   2. A DJ's pick lands as PENDING (the "pre-release" calendar).
//   3. You SIGN OFF → it becomes CONFIRMED (the main events calendar).
//
// v1 is local (saved on this device) so we can shape the layout + flow first.
// Next: a DJ-facing portal (magic link) + Supabase so DJs book remotely and
// their picks appear here automatically, then auto-publish on sign-off.

const KEY = 'ndb_dj_bookings_v1'
const WEEKS_AHEAD = 12

// JS getDay(): Sun=0 … Sat=6.  Thu=4, Fri=5, Sat=6.
const SESSIONS = {
  4: { day: 'Thursday', start: '19:00', end: '23:00' },
  5: { day: 'Friday',   start: '20:00', end: '00:00' },
  6: { day: 'Saturday', start: '20:00', end: '00:00' },
}
const GENRES = ['House', 'Disco', 'Funk & Soul', 'Hip-Hop', 'Garage', 'Techno', 'Afrobeat', 'Reggae / Dub', 'Soul', 'Jazz', 'Open format']

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fmt = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
const timeLabel = (s) => `${s.start.replace(':00', '')}${Number(s.start.slice(0, 2)) < 12 ? 'am' : 'pm'}–${s.end === '00:00' ? '12am' : s.end.replace(':00', '') + 'pm'}`

function upcomingSessions(weeks) {
  const out = []
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const end = new Date(today); end.setDate(end.getDate() + weeks * 7)
  const d = new Date(today)
  while (d <= end) {
    if (SESSIONS[d.getDay()]) out.push({ date: iso(d), session: SESSIONS[d.getDay()] })
    d.setDate(d.getDate() + 1)
  }
  return out
}

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }

export default function DJBookings() {
  const [data, setData] = useState(load)            // { [date]: { open, booking } }
  const [adding, setAdding] = useState(null)         // date currently showing the add-DJ form
  const [form, setForm] = useState({ dj: '', genre: GENRES[0], night: '', email: '' })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* ignore */ } }, [data])

  const sessions = upcomingSessions(WEEKS_AHEAD)
  const patch = (date, next) => setData(d => ({ ...d, [date]: { ...(d[date] || {}), ...next } }))

  const toggleOpen = (date) => patch(date, { open: !(data[date]?.open) })
  const signOff = (date) => patch(date, { booking: { ...data[date].booking, status: 'confirmed' } })
  const unconfirm = (date) => patch(date, { booking: { ...data[date].booking, status: 'pending' } })
  const removeBooking = (date) => patch(date, { booking: null })
  const startAdd = (date) => { setAdding(date); setForm({ dj: '', genre: GENRES[0], night: '', email: '' }) }
  const saveAdd = (date) => {
    if (!form.dj.trim()) return
    patch(date, { open: true, booking: { ...form, dj: form.dj.trim(), status: 'pending', source: 'manual' } })
    setAdding(null)
  }

  // counts
  const open = sessions.filter(s => data[s.date]?.open && !data[s.date]?.booking).length
  const pending = sessions.filter(s => data[s.date]?.booking?.status === 'pending').length
  const confirmed = sessions.filter(s => data[s.date]?.booking?.status === 'confirmed').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div className="serif" style={{ fontSize: 24, color: 'var(--cream)' }}>🎧 DJ Bookings</div>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginTop: 4, maxWidth: 760, lineHeight: 1.6 }}>
          Open the dates you want to fill, then sign off DJs as they come in. <strong style={{ color: 'var(--cream)' }}>Pending</strong> = your pre-release calendar; <strong style={{ color: 'var(--cream)' }}>Confirmed</strong> = the main events calendar.
          The three weekly sessions: <em>Thu {timeLabel(SESSIONS[4])} · Fri {timeLabel(SESSIONS[5])} · Sat {timeLabel(SESSIONS[6])}</em>.
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[['Open for DJs', open, 'var(--gold)'], ['Pending sign-off', pending, '#FCD34D'], ['Confirmed', confirmed, '#34D399']].map(([label, n, c]) => (
          <div key={label} style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '12px 18px', minWidth: 130 }}>
            <div className="serif" style={{ fontSize: 26, color: c, lineHeight: 1 }}>{n}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Sessions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sessions.map(({ date, session }) => {
          const st = data[date] || {}
          const b = st.booking
          const status = b ? b.status : (st.open ? 'open' : 'closed')
          const accent = status === 'confirmed' ? '#34D399' : status === 'pending' ? '#FCD34D' : status === 'open' ? 'var(--gold)' : 'rgba(255,255,255,0.25)'
          return (
            <div key={date} style={{ background: 'var(--ink-2)', border: `1px solid ${status === 'closed' ? 'rgba(255,255,255,0.08)' : 'rgba(201,168,76,0.18)'}`, borderLeft: `3px solid ${accent}`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {/* date + time */}
                <div style={{ minWidth: 150 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cream)' }}>{fmt(date)}</div>
                  <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{session.day} · {timeLabel(session)}</div>
                </div>
                {/* status / booking */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  {b ? (
                    <div style={{ fontSize: 13, color: 'var(--cream)' }}>
                      <strong>{b.dj}</strong> · {b.genre}{b.night ? <> · <em style={{ color: 'var(--gold)' }}>"{b.night}"</em></> : null}
                      <span style={{ marginLeft: 8, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, fontWeight: 700 }}>{b.status}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {st.open ? 'Open · waiting for a DJ' : 'Closed'}
                    </div>
                  )}
                </div>
                {/* actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {!b && <button onClick={() => toggleOpen(date)} style={btn(st.open ? 'ghost' : 'gold')}>{st.open ? 'Close' : 'Open for DJs'}</button>}
                  {!b && st.open && <button onClick={() => startAdd(date)} style={btn('ghost')}>+ Add DJ</button>}
                  {b && b.status === 'pending' && <button onClick={() => signOff(date)} style={btn('green')}>✓ Sign off</button>}
                  {b && b.status === 'confirmed' && <button onClick={() => unconfirm(date)} style={btn('ghost')}>Un-confirm</button>}
                  {b && <button onClick={() => removeBooking(date)} style={btn('red')}>Remove</button>}
                </div>
              </div>

              {/* inline add-DJ form */}
              {adding === date && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <input value={form.dj} onChange={e => setForm(f => ({ ...f, dj: e.target.value }))} placeholder="DJ / artist name" style={inp(180)} />
                  <select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} style={inp(150)}>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <input value={form.night} onChange={e => setForm(f => ({ ...f, night: e.target.value }))} placeholder="Night name (optional)" style={inp(170)} />
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="DJ email (optional)" style={inp(170)} />
                  <button onClick={() => saveAdd(date)} style={btn('gold')}>Save</button>
                  <button onClick={() => setAdding(null)} style={btn('ghost')}>Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: 'var(--cream)' }}>Next steps (say the word):</strong> a DJ-facing portal (you text/email each DJ a link) where they pick an open date, time, genre &amp; night name — landing here as Pending automatically; then auto-publish to the public events page / a social caption on sign-off. This view saves on this device for now; the portal needs the shared database (Supabase) so DJs can book from their own phones.
      </div>
    </div>
  )
}

const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: 'var(--gold)', color: 'var(--ink)' }
  if (kind === 'green') return { ...base, background: '#34D399', color: 'var(--ink)' }
  if (kind === 'red') return { ...base, background: 'transparent', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }
  return { ...base, background: 'rgba(255,255,255,0.05)', color: 'var(--cream)', border: '1px solid rgba(201,168,76,0.3)' }
}
const inp = (w) => ({ width: w, minWidth: 120, padding: '8px 10px', fontSize: 13, borderRadius: 7, background: 'var(--ink)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--cream)', outline: 'none' })
