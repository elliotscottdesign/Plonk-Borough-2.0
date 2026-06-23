import React, { useState, useEffect, useRef } from 'react'
import DJRoster, { Avatar } from './DJRoster.jsx'
import Messages from './DJMessages.jsx'
import { djAdmin, djCaption, setTypeLabel, SET_TYPES, instagramCaption, slotsForDate, slotLabel, sessionForSlot, resizeImage } from '../../dj/api.js'
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
const timeLabel = (s) => s ? `${s.start.replace(':00', '')}${Number(s.start.slice(0, 2)) < 12 ? 'am' : 'pm'}–${s.end === '00:00' ? '12am' : s.end.replace(':00', '') + 'pm'}` : ''
// "20:00" → "8pm" (start only) — matches the public events viewer's time format.
const fmtStart = (hhmm) => { if (!hhmm) return ''; const h = +hhmm.slice(0, 2), m = +hhmm.slice(3, 5); const ap = h >= 12 ? 'pm' : 'am'; const h12 = h % 12 === 0 ? 12 : h % 12; return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''}${ap}` }
const heldLeft = (heldAt) => {
  if (!heldAt) return ''
  const ms = new Date(heldAt).getTime() + 24 * 3600 * 1000 - Date.now()
  if (ms <= 0) return 'expiring'
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}
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
  const [eventsFilter, setEventsFilter] = useState('all')   // which list the Events tab shows (stat cards deep-link here)

  const reload = async () => {
    try { setData(await djAdmin('load')); setErr('') }
    catch (e) { setErr(e.message || String(e)) } finally { setLoading(false) }
  }
  useEffect(() => { reload() }, [])

  const needsSetup = err && /does not exist|relation|schema/i.test(err)
  const unread = (data?.notes || []).filter(n => !n.read_at).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* No Dice wordmark — branding for DJs viewing this page (DJ-only access) */}
      <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 'min(190px, 54vw)', height: 'auto', display: 'block', marginBottom: 4 }} />
      <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#DA1B33', fontWeight: 700, marginBottom: 6 }}>DJ Admin</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[['calendar', '📅 Calendar'], ['roster', '🎚️ DJ Roster'], ['events', '🎪 Events'], ['messages', `💬 Messages${unread ? ` (${unread})` : ''}`]].map(([k, label]) => (
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
        <DJRoster djs={data.djs} slots={data.slots} release={data.release} templates={data.templates} reload={reload} />
      ) : view === 'messages' ? (
        <Messages data={data} reload={reload} />
      ) : view === 'events' ? (
        <Events data={data} reload={reload} filter={eventsFilter} setFilter={setEventsFilter} />
      ) : (
        <Calendar data={data} reload={reload} onJump={(f) => { setEventsFilter(f); setView('events') }} />
      )}
    </div>
  )
}

function Calendar({ data, reload, onJump }) {
  const { djs, slots } = data
  const [buildKey, setBuildKey] = useState(null)   // which slot's build/edit form is open
  const [busy, setBusy] = useState(false)

  const sessions = upcomingSessions(WEEKS_AHEAD)
  const byKey = {}
  for (const s of (slots || [])) byKey[s.date + '|' + (s.slot || 'main')] = s   // keyed by date + slot
  const act = async (action, payload) => { setBusy(true); try { await djAdmin(action, payload); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  // Build a new night (book) or edit a booked one (editEvent), then attach artwork.
  const saveNight = async (date, slot, isNew, d) => {
    if (isNew && !d.djId) return
    setBusy(true)
    try {
      if (isNew) await djAdmin('book', { date, slot, djId: d.djId, nightName: d.nightName, subgenres: d.subgenres, setType: d.setType, promoTrack: d.promoTrack })
      else await djAdmin('editEvent', { date, slot, nightName: d.nightName, subgenres: d.subgenres, setType: d.setType, promoTrack: d.promoTrack })
      if (d.imgData) await djAdmin('eventPhoto', { date, slot, dataUrl: d.imgData })
      await reload(); setBuildKey(null)
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  const now = new Date()
  const [viewY, setViewY] = useState(now.getFullYear())
  const [viewM, setViewM] = useState(now.getMonth())
  const [selDate, setSelDate] = useState(null)
  const shiftMonth = (n) => { let m = viewM + n, y = viewY; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } setViewY(y); setViewM(m) }
  const canPrevMonth = viewY > now.getFullYear() || (viewY === now.getFullYear() && viewM > now.getMonth())
  const calCell = (dateStr) => {
    const defs = slotsForDate(dateStr)
    if (!defs.length) return null
    const rows = defs.map(d => byKey[dateStr + '|' + d.slot]).filter(Boolean)
    if (!rows.length) return { tone: 'closed', kind: defs[0].kind, disabled: false }
    const has = (st) => rows.some(r => r.status === st)
    const tone = (has('pending') || has('held')) ? 'pending' : has('open') ? 'open' : has('confirmed') ? 'confirmed' : 'closed'
    // Booked nights → thumbnail + detail cards in the cell (public-viewer rules).
    const events = rows.filter(r => r.dj_id).map(r => {
      const sess = sessionForSlot(dateStr, r.slot)
      const genres = Array.isArray(r.subgenres) ? r.subgenres : []
      const sub = r.night_name ? `"${r.night_name}"` : (genres.length ? genres.join(' · ') : (r.kind === 'opendecks' ? 'Open Decks' : 'DJ set'))
      return { image: r.event_image_url || r.dj?.image_url || '', title: r.dj?.dj_name || 'DJ', time: fmtStart(sess?.start), sub, status: r.status }
    })
    const openCount = rows.filter(r => r.status === 'open' && !r.dj_id).length   // other slots still free that day
    return { tone, kind: defs[0].kind, disabled: false, events, openCount }
  }

  // Counts scoped to upcoming so the headline matches the list you land on when
  // you tap a card (past nights live under the Events tab's Past filter).
  const todayStr = iso(now)
  const up = (s) => s.date >= todayStr
  const open = (slots || []).filter(s => s.status === 'open' && !s.dj_id && up(s)).length
  const held = (slots || []).filter(s => s.status === 'held' && up(s)).length
  const pending = (slots || []).filter(s => s.status === 'pending' && up(s)).length
  const confirmed = (slots || []).filter(s => s.status === 'confirmed' && up(s)).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="serif" style={{ fontSize: 22, color: '#FFFFFF' }}>📅 Booking calendar</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, maxWidth: 760, lineHeight: 1.6 }}>
          Tap a date, then either <strong style={{ color: '#FFFFFF' }}>Open for DJs to claim</strong> (they fill it from their portal) or <strong style={{ color: '#FFFFFF' }}>🎛️ Build a night</strong> yourself — pick a DJ and set all the details. <strong style={{ color: '#FFFFFF' }}>Pending</strong> = pre-release · <strong style={{ color: '#FFFFFF' }}>Confirmed</strong> = main events calendar.
          Sessions: <em>Thu {timeLabel(SESSIONS[4])} · Fri {timeLabel(SESSIONS[5])} · Sat {timeLabel(SESSIONS[6])}</em>.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[['Open for DJs', open, '#DA1B33', 'open'], ['Holding (draft)', held, '#F59E0B', 'held'], ['Pending sign-off', pending, '#FCD34D', 'pending'], ['Confirmed', confirmed, '#34D399', 'confirmed']].map(([label, n, c, fkey]) => (
          <button key={label} onClick={() => onJump && onJump(fkey)} title={`See the ${label} list in Events`} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '12px 18px', minWidth: 130, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div className="serif" style={{ fontSize: 26, color: c, lineHeight: 1 }}>{n}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>{label} <span style={{ color: c, opacity: 0.8 }}>→</span></div>
          </button>
        ))}
      </div>

      <MonthCalendar year={viewY} month={viewM} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} canPrev={canPrevMonth}
        cellFor={calCell} onDay={(d) => { setSelDate(d); setBuildKey(null) }} selected={selDate} rich
        legend={<>
          <span>Booked nights show artwork + DJ. Border &amp; dot:</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#34D399', marginRight: 5, verticalAlign: 'middle' }} />confirmed</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#FCD34D', marginRight: 5, verticalAlign: 'middle' }} />pending/draft</span>
          <span>An <strong style={{ color: '#fff' }}>open</strong> tag = a slot that day is still free. Empty days: dashed = closed · red = open for DJs.</span>
        </>} />

      {selDate ? (() => {
        const date = selDate
        const past = date < todayStr   // past dates: no sign-off/un-confirm (avoids a "confirmed 🎉" email for a night that's gone)
        const defs = slotsForDate(date)
        if (!defs.length) return null
        return (
          <div style={{ background: '#0A0A0A', border: '1px solid rgba(218,27,51,0.4)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>{fmt(date)}</div>
            {defs.map(def => {
              const key = date + '|' + def.slot
              const slot = byKey[key]
              const status = slot ? slot.status : 'closed'
              const accent = status === 'confirmed' ? '#34D399' : status === 'pending' ? '#FCD34D' : status === 'held' ? '#F59E0B' : status === 'open' ? '#DA1B33' : 'rgba(255,255,255,0.25)'
              const booked = slot && slot.dj_id
              const sLab = slotLabel(date, def.slot)
              return (
                <div key={def.slot} style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 12, display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 150 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{def.day}{sLab ? ` · ${sLab}` : ''} · {timeLabel(def)}</div>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: def.kind === 'session' ? '#DA1B33' : '#34D399', border: `1px solid ${def.kind === 'session' ? 'rgba(218,27,51,0.5)' : 'rgba(52,211,153,0.5)'}`, borderRadius: 999, padding: '1px 7px', display: 'inline-block', marginTop: 4 }}>{def.kind === 'session' ? 'Paid session' : 'Open Decks'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {booked ? (
                      <>
                        <Avatar d={{ ...(slot.dj || { dj_name: '?' }), image_url: slot.event_image_url || slot.dj?.image_url }} size={34} />
                        <div style={{ fontSize: 13, color: '#FFFFFF' }}>
                          <div><strong>{slot.dj?.dj_name || 'DJ'}</strong>{slot.genre ? ` · ${slot.genre}` : ''}{slot.night_name ? <> · <em style={{ color: '#DA1B33' }}>"{slot.night_name}"</em></> : null}<span style={{ marginLeft: 8, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, fontWeight: 700 }}>{status === 'held' ? 'draft' : status}</span></div>
                          {(slot.set_type || slot.promo_track) && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{slot.set_type ? setTypeLabel(slot.set_type) : ''}{slot.set_type && slot.promo_track ? ' · ' : ''}{slot.promo_track ? `🎵 ${slot.promo_track}` : ''}</div>}
                          {status === 'held' && <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 3, fontWeight: 600 }}>⏳ Draft — DJ is filling in details{slot.held_at ? ` · ${heldLeft(slot.held_at)}` : ''}</div>}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{status === 'open' ? 'Open · waiting for a DJ' : 'Closed'}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {!booked && <button onClick={() => act(status === 'open' ? 'close' : 'open', { date, slot: def.slot })} disabled={busy} style={btn('ghost')}>{status === 'open' ? 'Close (remove from marketplace)' : 'Open for DJs to claim'}</button>}
                    {!booked && <button onClick={() => setBuildKey(buildKey === key ? null : key)} disabled={busy} style={btn('gold')}>{buildKey === key ? '✕ Close' : '🎛️ Build a night'}</button>}
                    {booked && <button onClick={() => setBuildKey(buildKey === key ? null : key)} disabled={busy} style={btn('ghost')}>{buildKey === key ? '✕ Close' : '✏️ Edit details'}</button>}
                    {booked && status === 'pending' && !past && <button onClick={() => act('signoff', { date, slot: def.slot })} disabled={busy} style={btn('green')}>✓ Sign off</button>}
                    {booked && status === 'confirmed' && !past && <button onClick={() => act('unconfirm', { date, slot: def.slot })} disabled={busy} style={btn('ghost')}>Un-confirm</button>}
                    {booked && <button onClick={() => act('removeBooking', { date, slot: def.slot })} disabled={busy} style={btn('red')}>Remove</button>}
                  </div>
                  {buildKey === key && (
                    <NightForm
                      djs={djs}
                      slotRow={slot}
                      isSession={def.kind === 'session'}
                      showDj={!booked}
                      busy={busy}
                      onSave={(d) => saveNight(date, def.slot, !booked, d)}
                      onCancel={() => setBuildKey(null)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )
      })() : <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Tap a date to open it or manage its booking.</div>}
    </div>
  )
}

// Events — confirmed upcoming nights (the "what's on") + Instagram captions +
// full management: edit, suspend (hide from the public page), or delete any event.
function Events({ data, reload, filter, setFilter }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayStr = iso(today)
  // Every booking with a DJ attached is an "event" — draft (held) → pending →
  // confirmed. The tab lists them all (filterable), plus open dates and past.
  const isPast = (s) => s.date < todayStr
  const withDj = (data.slots || []).filter(s => s.dj_id)
  const upcomingDj = withDj.filter(s => !isPast(s))
  const openSlots = (data.slots || []).filter(s => s.status === 'open' && !s.dj_id && !isPast(s)).sort((a, b) => a.date.localeCompare(b.date))
  const counts = {
    all: upcomingDj.length,
    held: upcomingDj.filter(s => s.status === 'held').length,
    pending: upcomingDj.filter(s => s.status === 'pending').length,
    confirmed: upcomingDj.filter(s => s.status === 'confirmed').length,
    open: openSlots.length,
    past: withDj.filter(isPast).length,
  }
  const cur = counts[filter] !== undefined ? filter : 'all'
  const events = cur === 'past'
    ? withDj.filter(isPast).sort((a, b) => b.date.localeCompare(a.date))
    : cur === 'all'
      ? upcomingDj.slice().sort((a, b) => a.date.localeCompare(b.date))
      : cur === 'open'
        ? []
        : upcomingDj.filter(s => s.status === cur).sort((a, b) => a.date.localeCompare(b.date))
  const [copied, setCopied] = useState(null)
  const [ai, setAi] = useState({})   // { [ckey]: { loading, text, error, setup, copied } }
  const [editing, setEditing] = useState(null)   // ckey currently being edited
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)
  const ckey = (s) => s.date + '-' + (s.slot || 'main')
  const copyCap = (s) => { try { navigator.clipboard.writeText(instagramCaption(s)) } catch { /* ignore */ } setCopied(ckey(s)); setTimeout(() => setCopied(null), 1800) }

  const aiRewrite = async (s) => {
    const k = ckey(s)
    const prev = ai[k]?.text || ''
    setAi(a => ({ ...a, [k]: { ...(a[k] || {}), loading: true, error: '', setup: false } }))
    try {
      const { caption } = await djCaption(s, prev)
      setAi(a => ({ ...a, [k]: { loading: false, text: caption || '', error: '', setup: false, copied: false } }))
    } catch (e) {
      setAi(a => ({ ...a, [k]: { ...(a[k] || {}), loading: false, error: e.message || String(e), setup: !!e.setup } }))
    }
  }
  const copyAi = (s) => {
    const k = ckey(s)
    try { navigator.clipboard.writeText(ai[k]?.text || '') } catch { /* ignore */ }
    setAi(a => ({ ...a, [k]: { ...(a[k] || {}), copied: true } }))
    setTimeout(() => setAi(a => ({ ...a, [k]: { ...(a[k] || {}), copied: false } })), 1800)
  }

  // ── Manage an event (edit / suspend / delete) ─────────────────────────────
  const act = async (action, s, extra = {}) => {
    setBusy(true)
    try { await djAdmin(action, { date: s.date, slot: s.slot || 'main', ...extra }); await reload() }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const startEdit = (s) => {
    setEditing(ckey(s))
    setForm({ date: s.date, nightName: s.night_name || '', subgenres: (s.subgenres || []).join(', '), setType: s.set_type || 'dj_set', promoTrack: s.promo_track || '' })
  }
  const saveEdit = async (s) => {
    setBusy(true)
    try {
      await djAdmin('editEvent', {
        date: s.date, slot: s.slot || 'main', newDate: form.date, nightName: form.nightName,
        subgenres: (form.subgenres || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 4),
        setType: form.setType, promoTrack: form.promoTrack,
      })
      setEditing(null); await reload()
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const onDelete = (s) => {
    // Only confirmed, un-suspended, upcoming nights are actually on the public feed.
    const wasPublic = s.status === 'confirmed' && !s.suspended && !isPast(s)
    const where = wasPublic ? 'the calendar and the public events page' : 'the calendar'
    if (window.confirm(`Delete this event — ${s.dj?.dj_name || 'DJ'} on ${fmt(s.date)}?\n\nThis removes it from ${where}, and can't be undone.`)) act('deleteEvent', s)
  }
  const editIsSession = (d) => !!d && [4, 5, 6].includes(new Date(d + 'T00:00:00Z').getUTCDay())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div className="serif" style={{ fontSize: 22, color: '#FFFFFF' }}>🎪 Events</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, maxWidth: 760, lineHeight: 1.6 }}>
          Every night in the system — <strong style={{ color: '#F59E0B' }}>drafts</strong> a DJ is still filling in, <strong style={{ color: '#FCD34D' }}>pending</strong> your sign-off, and <strong style={{ color: '#34D399' }}>confirmed</strong> — plus open dates and past events. Confirmed nights power the public events feed. <em>✏️ Edit</em>, <em>✓ Sign off</em>, <em>⏸ Suspend</em> or <em>🗑 Delete</em> to manage; <em>📋 / ✨</em> build the Instagram caption.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['all', 'All active'], ['held', '⏳ Drafts'], ['pending', '✋ Pending'], ['confirmed', '✓ Confirmed'], ['open', '◻ Open dates'], ['past', '🕓 Past']].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: '7px 13px', fontSize: 12.5, borderRadius: 8, cursor: 'pointer', background: cur === k ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)', border: `1px solid ${cur === k ? '#DA1B33' : 'rgba(255,255,255,0.1)'}`, color: cur === k ? '#DA1B33' : '#FFFFFF', fontWeight: cur === k ? 600 : 400 }}>{label} <span style={{ opacity: 0.6 }}>{counts[k]}</span></button>
        ))}
      </div>

      {cur === 'open' ? (
        openSlots.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>No open dates right now — open some from the Calendar tab.</div>
        ) : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{openSlots.map(s => {
          const sess = sessionForSlot(s.date, s.slot); const sLab = slotLabel(s.date, s.slot)
          return (
            <div key={s.date + '-' + (s.slot || 'main')} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.10)', borderLeft: '3px solid #DA1B33', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{fmt(s.date)} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>· {sess?.day} {timeLabel(sess)}{sLab ? ` · ${sLab}` : ''}</span></div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.kind === 'opendecks' ? 'Open Decks' : 'Session'} · waiting for a DJ to claim</div>
              </div>
              <button onClick={() => act('close', s)} disabled={busy} style={btn('ghost')}>Close (remove)</button>
            </div>
          )
        })}</div>
      ) : events.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{cur === 'past' ? 'No past events yet.' : 'Nothing here yet — sign nights off from the Calendar, or wait for DJs to claim dates.'}</div>
      ) : events.map(s => {
        const session = sessionForSlot(s.date, s.slot)
        const sLab = slotLabel(s.date, s.slot)
        const k = ckey(s)
        const a = ai[k] || {}
        const sus = !!s.suspended
        const past = isPast(s)
        const meta = { held: { label: 'Draft', color: '#F59E0B' }, pending: { label: 'Pending', color: '#FCD34D' }, confirmed: { label: 'Confirmed', color: '#34D399' } }[s.status] || { label: s.status, color: '#9CA3AF' }
        const showCap = !past && (s.status === 'confirmed' || s.status === 'pending')
        return (
          <div key={k} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.10)', borderLeft: `3px solid ${sus ? '#9CA3AF' : past ? '#6B7280' : meta.color}`, borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, opacity: sus ? 0.72 : past ? 0.85 : 1 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Avatar d={{ ...(s.dj || { dj_name: '?' }), image_url: s.event_image_url || s.dj?.image_url }} size={48} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>{fmt(s.date)} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>· {session?.day} {timeLabel(session)}{sLab ? ` · ${sLab}` : ''}</span><span style={{ marginLeft: 8, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: past ? '#9CA3AF' : meta.color, border: `1px solid ${past ? '#9CA3AF' : meta.color}66`, borderRadius: 999, padding: '1px 7px' }}>{past ? 'Past' : meta.label}</span>{sus && <span style={{ marginLeft: 6, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', border: '1px solid rgba(156,163,175,0.5)', borderRadius: 999, padding: '1px 7px' }}>Suspended</span>}</div>
                <div style={{ fontSize: 13, color: '#FFFFFF', marginTop: 2 }}><strong>{s.dj?.dj_name || 'DJ'}</strong>{s.night_name ? <> · <em style={{ color: '#DA1B33' }}>"{s.night_name}"</em></> : null}</div>
                {(s.subgenres || []).length > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{(s.subgenres || []).join(' · ')}</div>}
                {s.dj?.format && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>🎛️ {s.dj.format}</div>}
                {s.kind === 'opendecks' && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Open Decks{s.set_type ? ` · ${setTypeLabel(s.set_type)}` : ''}</div>}
                {s.promo_track && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>🎵 {s.promo_track}</div>}
              </div>
              {showCap && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch' }}>
                  <button onClick={() => copyCap(s)} style={btn(copied === k ? 'green' : 'gold')}>{copied === k ? '✓ Caption copied' : '📋 Instagram caption'}</button>
                  <button onClick={() => aiRewrite(s)} disabled={a.loading} style={{ ...btn('ghost'), opacity: a.loading ? 0.6 : 1, cursor: a.loading ? 'default' : 'pointer' }}>{a.loading ? '✨ Writing…' : (a.text ? '✨ Try again' : '✨ AI rewrite')}</button>
                </div>
              )}
            </div>

            {/* Manage — actions depend on the event's status */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
              <button onClick={() => editing === k ? setEditing(null) : startEdit(s)} disabled={busy} style={btn('ghost')}>{editing === k ? '✕ Close' : '✏️ Edit'}</button>
              {s.status === 'pending' && !past && <button onClick={() => act('signoff', s)} disabled={busy} style={btn('green')}>✓ Sign off</button>}
              {s.status === 'confirmed' && !past && (sus
                ? <button onClick={() => act('unsuspend', s)} disabled={busy} style={btn('green')}>▶️ Restore (show publicly)</button>
                : <button onClick={() => act('suspend', s)} disabled={busy} style={btn('ghost')}>⏸ Suspend (hide publicly)</button>)}
              {s.status === 'confirmed' && !past && <button onClick={() => act('unconfirm', s)} disabled={busy} style={btn('ghost')}>↩ Un-confirm</button>}
              <button onClick={() => onDelete(s)} disabled={busy} style={btn('red')}>🗑 Delete</button>
            </div>
            {s.status === 'held' && !past && <div style={{ fontSize: 11, color: '#F59E0B' }}>⏳ Draft — the DJ is still filling this in{s.held_at ? ` · ${heldLeft(s.held_at)}` : ''}. Edit or remove it if needed.</div>}

            {editing === k && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(218,27,51,0.35)', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {s.status === 'held'
                    ? <div style={lbl}>Date<div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{fmt(form.date)} <span style={{ color: '#F59E0B' }}>· can't move — the DJ is holding this date</span></div></div>
                    : <label style={lbl}>Date<input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp(160)} /></label>}
                  <label style={lbl}>Night name<input value={form.nightName} onChange={e => setForm(f => ({ ...f, nightName: e.target.value }))} placeholder="(optional)" style={inp(190)} /></label>
                </div>
                {editIsSession(form.date)
                  ? <label style={lbl}>Genres <span style={hint}>(comma-separated, up to 4)</span><input value={form.subgenres} onChange={e => setForm(f => ({ ...f, subgenres: e.target.value }))} placeholder="House, Disco, Funk" style={inp(300)} /></label>
                  : <label style={lbl}>Set type <span style={hint}>(Open Decks night)</span><Dropdown value={form.setType} onChange={v => setForm(f => ({ ...f, setType: v }))} width={220} options={SET_TYPES.map(t => ({ value: t.value, label: t.label }))} /></label>}
                <label style={lbl}>Promo track <span style={hint}>(name or link)</span><input value={form.promoTrack} onChange={e => setForm(f => ({ ...f, promoTrack: e.target.value }))} placeholder="Track name or link" style={inp(320)} /></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => saveEdit(s)} disabled={busy} style={btn('gold')}>Save changes</button>
                  <button onClick={() => setEditing(null)} disabled={busy} style={btn('ghost')}>Cancel</button>
                </div>
                {form.date !== s.date && <div style={{ fontSize: 11, color: '#FCD34D' }}>Moving this event to {fmt(form.date)}.</div>}
              </div>
            )}

            {showCap && (a.text || a.error) && (
              <div style={{ background: a.error ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${a.error ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.10)'}`, borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {a.error ? (
                  <div style={{ fontSize: 12.5, color: a.setup ? '#FDE68A' : '#F87171', lineHeight: 1.6 }}>
                    {a.setup ? '✨ ' : '⚠️ '}{a.error}
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#A78BFA' }}>✨ AI caption</div>
                    <div style={{ fontSize: 13, color: '#FFFFFF', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{a.text}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => copyAi(s)} style={btn(a.copied ? 'green' : 'gold')}>{a.copied ? '✓ Copied' : '📋 Copy this'}</button>
                      <button onClick={() => aiRewrite(s)} disabled={a.loading} style={btn('ghost')}>🔄 Try again</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: '#fff' }}>Public events page:</strong> these confirmed nights are live on a public feed at <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>/functions/v1/events-feed</code> — the customer nodice.bar site can read it to show "What's On". That page lives in the other repo; say the word and I'll coordinate wiring it in.
      </div>
    </div>
  )
}

// Branded No Dice dropdown (replaces native <select> so the open list is on-brand).
// Opens UPWARD when there isn't room below (so the list is never clipped off the
// bottom of the page).
function Dropdown({ value, onChange, options, placeholder = 'Select…', width = 220 }) {
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const ref = useRef(null)
  const sel = options.find(o => o.value === value)
  const toggle = () => {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect()
      setUp(window.innerHeight - r.bottom < 280 && r.top > 280)
    }
    setOpen(o => !o)
  }
  return (
    <div ref={ref} style={{ position: 'relative', width }}>
      <button type="button" onClick={toggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', fontSize: 13, borderRadius: 7, background: '#000000', border: `1px solid ${open ? '#DA1B33' : 'rgba(255,255,255,0.18)'}`, color: sel ? '#FFFFFF' : 'rgba(255,255,255,0.5)', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sel ? sel.label : placeholder}</span>
        <span style={{ color: '#DA1B33', fontSize: 10 }}>▼</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', ...(up ? { bottom: 'calc(100% + 4px)' } : { top: 'calc(100% + 4px)' }), left: 0, right: 0, zIndex: 50, background: '#0A0A0A', border: '1px solid rgba(218,27,51,0.45)', borderRadius: 8, maxHeight: 260, overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
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
const lbl = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.6)' }
const hint = { color: 'rgba(255,255,255,0.4)', fontWeight: 400 }

// Full "build / edit a DJ night" form — gives admins the same toolkit DJs have
// (DJ · night name · genres or set type · promo track · per-event artwork). Used
// for building a new night (showDj=true) and for editing a booked one.
function NightForm({ djs, slotRow, isSession, showDj, busy, onSave, onCancel }) {
  const [djId, setDjId] = useState(slotRow?.dj_id || '')
  const [nightName, setNightName] = useState(slotRow?.night_name || '')
  const [genres, setGenres] = useState((slotRow?.subgenres || []).join(', '))
  const [setType, setSetType] = useState(slotRow?.set_type || 'dj_set')
  const [promoTrack, setPromoTrack] = useState(slotRow?.promo_track || '')
  const [imgData, setImgData] = useState('')
  const [imgErr, setImgErr] = useState('')
  const djPhoto = (djs || []).find(d => d.id === djId)?.image_url || ''
  const preview = imgData || slotRow?.event_image_url || djPhoto

  const pickImg = async (file) => {
    if (!file) return
    setImgErr('')
    try { setImgData(await resizeImage(file)) } catch (e) { setImgErr(e.message || 'Could not read that image') }
  }
  const submit = () => {
    if (showDj && !djId) return
    onSave({ djId, nightName, subgenres: genres.split(',').map(x => x.trim()).filter(Boolean).slice(0, 4), setType, promoTrack, imgData })
  }

  return (
    <div style={{ width: '100%', marginTop: 6, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {showDj && (
        <label style={lbl}>DJ
          <Dropdown value={djId} onChange={setDjId} placeholder="— pick a DJ from the roster —" width={250}
            options={(djs || []).filter(r => (r.status || 'vetted') === 'vetted').map(r => ({ value: r.id, label: r.dj_name }))} />
        </label>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <label style={lbl}>Night name<input value={nightName} onChange={e => setNightName(e.target.value)} placeholder="(optional)" style={inp(200)} /></label>
        {isSession
          ? <label style={lbl}>Genres <span style={hint}>(comma, up to 4)</span><input value={genres} onChange={e => setGenres(e.target.value)} placeholder="House, Disco, Funk" style={inp(260)} /></label>
          : <label style={lbl}>Set type <span style={hint}>(Open Decks)</span><Dropdown value={setType} onChange={setSetType} width={200} options={SET_TYPES.map(t => ({ value: t.value, label: t.label }))} /></label>}
      </div>
      <label style={lbl}>Promo track <span style={hint}>(name or link — drives the Instagram post)</span><input value={promoTrack} onChange={e => setPromoTrack(e.target.value)} placeholder="Track name or link" style={inp(320)} /></label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={lbl}>Artwork <span style={hint}>(overrides the DJ photo for this night)</span></div>
        {preview
          ? <Avatar d={{ image_url: preview, dj_name: '?' }} size={46} />
          : <div style={{ width: 46, height: 46, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>none</div>}
        <label style={{ ...btn('ghost'), display: 'inline-block', cursor: 'pointer' }}>
          {imgData ? 'Change image' : 'Upload image'}
          <input type="file" accept="image/*" hidden onChange={e => pickImg(e.target.files?.[0])} />
        </label>
        {imgErr && <span style={{ fontSize: 11, color: '#F87171' }}>{imgErr}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={busy || (showDj && !djId)} style={btn('gold')}>{busy ? 'Saving…' : (showDj ? 'Build night' : 'Save details')}</button>
        <button onClick={onCancel} disabled={busy} style={btn('ghost')}>Cancel</button>
      </div>
    </div>
  )
}
