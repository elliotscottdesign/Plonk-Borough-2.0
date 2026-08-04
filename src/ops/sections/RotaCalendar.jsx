import React, { useState, useEffect } from 'react'
import { rotaSaveDayRoster, rotaAddDayNote, rotaDeleteDayNote, rotaSetClock } from '../../rota/api.js'
import { eventsList, eventsForDate, catMeta } from '../keydates/events.js'
import { shiftsForDate, fmtMin, shiftHours, dayName, shiftTimeLabel, fmtClockTime, workedMins, hoursLabel } from '../../rota/shifts.js'
import { presenceBadge } from '../../rota/geo.js'
import DayRosterGrid from './DayRosterGrid.jsx'
import useIsMobile from '../../lib/useIsMobile.js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../marketing/data/backend.js'

// ─── Rota calendar (founder) ─────────────────────────────────────────────────
// A month grid of days; tapping a day opens the drag-to-build roster (DayRosterGrid)
// where the founder paints each person's hours. Above it, a week overview of hours
// vs target + wage spend. Own calendar grid (not the DJ MonthCalendar).

const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33', GREY = 'rgba(255,255,255,0.28)', PURPLE = '#A855F7'
const TODAY = '#60A5FA'                          // "today" ring — blue, never clashes with the status colours
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

// A progress ring (clock/gauge) showing hours-assigned vs target for one staffer.
function Ring({ pct, color, hasTarget, size = 44 }) {
  const r = (size - 7) / 2, c = 2 * Math.PI * r
  const frac = hasTarget ? Math.min(1, Math.max(0, pct)) : 0
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{hasTarget ? `${Math.round(pct * 100)}%` : '–'}</div>
    </div>
  )
}

// One person's line in the week overview: ring + name/type + hours-vs-target + cost.
function WeekRow({ row }) {
  const { s, hrs, actualHrs, target, cost, rate } = row
  const pct = target ? hrs / target : 0
  const color = target == null ? 'rgba(255,255,255,0.28)' : hrs > target + 0.05 ? PURPLE : hrs >= target ? GREEN : hrs > 0 ? AMBER : RED
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Ring pct={pct} color={color} hasTarget={target != null} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {s.name || 'Unnamed'}
          {s.active === false ? <span style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}> · inactive</span> : null}
          {s.employment_type ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> · {s.employment_type}</span> : null}
        </div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
          <strong style={{ color: '#fff' }}>{hrs}h</strong>{target != null ? ` / ${target}h target` : ' · no target set'}
          {actualHrs > 0 && <span style={{ color: '#60A5FA' }}> · {actualHrs}h actual ✓</span>}
          {target != null && hrs > target + 0.05 && <span style={{ color: PURPLE, fontWeight: 700 }}> · +{Math.round((hrs - target) * 10) / 10}h over</span>}
          {target != null && hrs < target - 0.05 && <span style={{ color: AMBER }}> · {Math.round((target - hrs) * 10) / 10}h short</span>}
          {target != null && hrs >= target - 0.05 && hrs <= target + 0.05 && <span style={{ color: GREEN }}> · on target</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{cost == null ? '—' : gbp(cost)}</div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>{rate == null ? 'no rate' : `£${Number.isInteger(rate) ? rate : rate.toFixed(2)}/h`}</div>
      </div>
    </div>
  )
}

export default function RotaCalendar({ staff = [], shifts = [], claims = [], notes = [], clocks = [], availability = [], reload }) {
  // Key Dates (festivals, half-terms, bank holidays…) flagged on the calendar as you build.
  const [keyEvents, setKeyEvents] = useState([])
  useEffect(() => { eventsList().then(r => setKeyEvents(r.events || [])).catch(() => {}) }, [])
  // Booking overlay — nodice.bar customer bookings + paid tournament sign-ups
  // pulled straight from the shared Supabase so each day tile shows how many
  // covers are already committed (with a 🔥 flag when any booking is 8+).
  // Refetches when the month changes so the visible grid is always accurate.
  const [bookingsByDate, setBookingsByDate] = useState({})
  const now = new Date()
  const [viewY, setViewY] = useState(now.getFullYear())
  const [viewM, setViewM] = useState(now.getMonth())
  useEffect(() => {
    let cancelled = false
    const from = iso(viewY, viewM, 1)
    const lastDay = new Date(viewY, viewM + 1, 0).getDate()
    const to = iso(viewY, viewM, lastDay)
    const h = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    const url = (p) => `${SUPABASE_URL}/rest/v1/${p}`
    Promise.allSettled([
      fetch(url(`bar_reservations?select=reservation_date,party_size&status=in.(confirmed,paid)&reservation_date=gte.${from}&reservation_date=lte.${to}`), { headers: h }).then(r => r.json()),
      fetch(url(`tournament_entries?select=team_name,captain_name,tournaments!inner(event_date)&status=eq.paid&tournaments.event_date=gte.${from}&tournaments.event_date=lte.${to}`), { headers: h }).then(r => r.json()),
    ]).then(([barR, tournR]) => {
      if (cancelled) return
      const map = {}
      const bar = barR.status === 'fulfilled' && Array.isArray(barR.value) ? barR.value : []
      const tourn = tournR.status === 'fulfilled' && Array.isArray(tournR.value) ? tournR.value : []
      for (const r of bar) {
        const d = r.reservation_date; if (!d) continue
        const bucket = (map[d] ||= { count: 0, covers: 0, big: 0 })
        bucket.count++; bucket.covers += r.party_size || 0
        if ((r.party_size || 0) >= 8) bucket.big++
      }
      for (const t of tourn) {
        const d = t.tournaments?.event_date; if (!d || d < from || d > to) continue
        const bucket = (map[d] ||= { count: 0, covers: 0, big: 0 })
        bucket.count++; bucket.covers += (t.team_name && t.team_name !== t.captain_name) ? 2 : 1
      }
      setBookingsByDate(map)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [viewY, viewM])
  const [selDate, setSelDate] = useState(null)
  const [busy, setBusy] = useState(false)
  const [weekStart, setWeekStart] = useState(() => mondayOf(iso(now.getFullYear(), now.getMonth(), now.getDate())))   // week-overview Monday
  const [overviewOpen, setOverviewOpen] = useState(true)
  const [sortBy, setSortBy] = useState('hours')   // 'hours' | 'role' | 'name'
  const [pastOpen, setPastOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const isMobile = useIsMobile()

  const addNote = async () => {
    const body = noteText.trim(); if (!body) return
    setBusy(true); try { await rotaAddDayNote(selDate, body); setNoteText(''); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const deleteNote = async (id) => { setBusy(true); try { await rotaDeleteDayNote(id); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const approveClock = async (staffId, date, approved) => { setBusy(true); try { await rotaSetClock(staffId, date, { approved }); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  // clock lookups: worked minutes + by staff|date
  const clockDur = (c) => (c && c.clock_in && c.clock_out) ? Math.max(0, Math.round((new Date(c.clock_out) - new Date(c.clock_in)) / 60000)) : 0
  const clockMap = {}
  for (const c of clocks) clockMap[`${c.staff_id}|${c.date}`] = c

  // date → shift rows (sorted by start); shift_id → claim rows.
  const shiftsByDate = {}
  for (const s of shifts) (shiftsByDate[s.date] ||= []).push(s)
  for (const arr of Object.values(shiftsByDate)) arr.sort((a, b) => (a.start_min || 0) - (b.start_min || 0))
  const claimsByShift = {}
  for (const c of claims) (claimsByShift[c.shift_id] ||= []).push(c)

  // ── Week overview: assigned hours vs each person's target + wage spend ───────
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i))
  const weekEnd = weekDates[6]
  const weekSet = new Set(weekDates)
  const hoursByStaff = {}   // staff_id → hours assigned this week
  for (const sh of shifts) {
    if (!weekSet.has(sh.date)) continue
    const hrs = shiftHours(sh)
    for (const c of (claimsByShift[sh.id] || [])) hoursByStaff[c.staff_id] = (hoursByStaff[c.staff_id] || 0) + hrs
  }
  // Approved actual worked minutes per staffer this week (drives pay once approved).
  const actualByStaff = {}
  for (const c of clocks) { if (weekSet.has(c.date) && c.approved) actualByStaff[c.staff_id] = (actualByStaff[c.staff_id] || 0) + clockDur(c) }
  // Active staff, plus anyone deactivated who still holds hours this week (so their
  // committed cost isn't silently dropped from the total — they're flagged inactive).
  const weekRows = staff.filter(s => s.active !== false || (hoursByStaff[s.id] || 0) > 0).map(s => {
    const hrs = Math.round((hoursByStaff[s.id] || 0) * 10) / 10                 // rostered (planned)
    const actualHrs = Math.round(((actualByStaff[s.id] || 0) / 60) * 10) / 10   // approved actual
    const payHrs = actualHrs > 0 ? actualHrs : hrs                              // approved actual once it exists, else rostered
    const rate = s.hourly_rate == null || s.hourly_rate === '' ? null : Number(s.hourly_rate)
    const targetN = s.target_hours == null || s.target_hours === '' ? NaN : Number(s.target_hours)
    const target = Number.isFinite(targetN) && targetN > 0 ? targetN : null   // 0 / blank = no target
    const cost = rate != null ? Math.round(payHrs * rate * 100) / 100 : null
    return { s, hrs, actualHrs, payHrs, rate, target, cost }
  }).sort((a, b) => b.hrs - a.hrs || (a.s.name || '').localeCompare(b.s.name || ''))
  const totalHours = Math.round(weekRows.reduce((a, r) => a + r.hrs, 0) * 10) / 10
  const totalSpend = weekRows.reduce((a, r) => a + (r.cost || 0), 0)
  const missingRate = weekRows.some(r => r.hrs > 0 && r.rate == null)
  // Sort order the founder can flip: by hours (default), by role (Manager→Bar→Kitchen), or A–Z.
  const byName = (a, b) => (a.s.name || '').localeCompare(b.s.name || '')
  const sorters = {
    hours: (a, b) => b.hrs - a.hrs || byName(a, b),
    role: (a, b) => roleRank(a.s.role) - roleRank(b.s.role) || byName(a, b),
    name: byName,
  }
  const overviewRows = weekRows.filter(r => r.hrs > 0 || r.target != null).slice().sort(sorters[sortBy] || sorters.hours)

  const todayStr = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const shiftMonth = (d) => { let m = viewM + d, y = viewY; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } setViewY(y); setViewM(m); setSelDate(null) }

  // Save the whole day's roster from the grid (throws on error so the grid can alert).
  // The grid is the deliberate roster editor, so an empty save here is an intentional
  // "clear this day" — pass allowClear so the server accepts it.
  const saveRoster = async (date, blocks) => { setBusy(true); try { await rotaSaveDayRoster(date, blocks, true); await reload() } finally { setBusy(false) } }

  // Calendar grid (weeks start Monday, UTC math — matches the rest of the app).
  const startDow = (new Date(Date.UTC(viewY, viewM, 1)).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(viewY, viewM + 1, 0)).getUTCDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7) cells.push(null)

  const selShifts = selDate ? (shiftsByDate[selDate] || []) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 20, color: '#fff' }}>🗓️ Rota — who's working</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Tap a day to build the roster by dragging each person's hours onto the grid.</div>
        </div>
      </div>

      {/* Week overview — hours vs target + wage spend (founder only) */}
      <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setOverviewOpen(o => !o)} title={overviewOpen ? 'Hide breakdown' : 'Show breakdown'} style={{ ...weekNav, width: 26 }}>{overviewOpen ? '▾' : '▸'}</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>📊 Week</span>
            <button onClick={() => setWeekStart(w => addDaysISO(w, -7))} style={weekNav}>◀</button>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 150, textAlign: 'center' }}>{fmtDay(weekStart)} – {fmtDayMon(weekEnd)}</div>
            <button onClick={() => setWeekStart(w => addDaysISO(w, 7))} style={weekNav}>▶</button>
            <button onClick={() => setWeekStart(mondayOf(todayStr))} style={{ ...btn('ghost'), padding: '4px 9px', fontSize: 11 }}>This week</button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wage spend this week</div>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{gbp(totalSpend)} <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>· {totalHours}h assigned</span></div>
          </div>
        </div>
        {missingRate && <div style={{ fontSize: 11, color: AMBER, marginTop: 8 }}>⚠️ Some assigned staff have no hourly rate, so their pay isn't in the total — set it in Team → Edit profile → Pay &amp; hours.</div>}
        {overviewOpen && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 2 }}>Sort</span>
              {[['hours', 'Hours'], ['role', 'Role'], ['name', 'A–Z']].map(([k, lbl]) => (
                <button key={k} onClick={() => setSortBy(k)} title={k === 'role' ? 'Manager → Assistant Manager → Bar Staff → Kitchen Staff' : ''} style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', background: sortBy === k ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.05)', border: `1px solid ${sortBy === k ? PURPLE : 'rgba(255,255,255,0.14)'}`, color: sortBy === k ? '#fff' : 'rgba(255,255,255,0.6)' }}>{lbl}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              {overviewRows.length === 0
                ? <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>No one assigned this week yet and no targets set. Assign shifts below, and set each person's target hours &amp; rate in Team → Edit profile.</div>
                : overviewRows.map(r => <WeekRow key={r.s.id} row={r} />)}
            </div>
          </>
        )}
      </div>

      {/* Month nav */}
      <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => shiftMonth(-1)} style={{ background: 'transparent', border: 'none', color: RED, fontSize: 16, cursor: 'pointer', padding: '4px 12px' }}>◀</button>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{MONTHS[viewM]} {viewY}</div>
          <button onClick={() => shiftMonth(1)} style={{ background: 'transparent', border: 'none', color: RED, fontSize: 16, cursor: 'pointer', padding: '4px 12px' }}>▶</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 4, marginBottom: 5 }}>
          {DOW.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const dateStr = iso(viewY, viewM, d)
            const rows = shiftsByDate[dateStr] || []
            const pattern = shiftsForDate(dateStr)
            const isSel = selDate === dateStr
            const isToday = dateStr === todayStr
            const evs = eventsForDate(keyEvents, dateStr)
            return (
              <button key={i} type="button" onClick={() => setSelDate(dateStr)}
                style={{ minHeight: 62, minWidth: 0, overflow: 'hidden', borderRadius: 8, padding: '3px 4px 4px', textAlign: 'left', background: '#000', color: '#fff', cursor: 'pointer', opacity: 1, border: isSel ? `2px solid ${RED}` : '1px solid rgba(255,255,255,0.14)', boxShadow: isToday ? `0 0 0 2px ${TODAY}` : undefined, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: (isToday && !isSel) ? TODAY : '#fff' }}>{d}</span>
                  <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    {/* Bookings overlay — customer bookings from nodice.bar. Only
                        renders when the day has bookings so the tile stays clean
                        on empty days. Amber ✱ flag = at least one 8+ booking. */}
                    {(() => {
                      const b = bookingsByDate[dateStr]
                      if (!b || !b.count) return null
                      return (
                        <span
                          title={`${b.count} booking${b.count === 1 ? '' : 's'} · ${b.covers} cover${b.covers === 1 ? '' : 's'}${b.big ? ` · ${b.big} big part${b.big === 1 ? 'y' : 'ies'} (8+)` : ''}`}
                          style={{ fontSize: 9, fontWeight: 700, color: b.big ? AMBER : PURPLE, background: `${b.big ? AMBER : PURPLE}22`, border: `1px solid ${b.big ? AMBER : PURPLE}55`, borderRadius: 4, padding: '1px 4px', whiteSpace: 'nowrap', lineHeight: 1 }}
                        >
                          {b.big ? '✱ ' : ''}{b.covers}
                        </span>
                      )
                    })()}
                    {evs.length > 0 && <span title={evs.map(e => `${catMeta(e.category).icon} ${e.title}${e.location ? ' · ' + e.location : ''}`).join('\n')} style={{ fontSize: 11, lineHeight: 1 }}>🔔</span>}
                  </span>
                </span>
                {(() => {
                  const people = rows.reduce((a, sh) => a + (claimsByShift[sh.id] || []).length, 0)
                  const hrs = Math.round(rows.reduce((a, sh) => a + (claimsByShift[sh.id] || []).length * shiftHours(sh), 0))
                  // Pills wrap instead of forcing the cell wide — on a phone the 7-col
                  // month must FIT the screen (it used to overflow and clip Fri–Sun).
                  if (people > 0) return (
                    <div style={{ fontSize: 9, color: '#fff', border: `1px solid ${GREEN}`, background: `${GREEN}22`, borderRadius: 4, padding: '2px 4px', display: 'flex', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap', minWidth: 0 }}>
                      <span style={{ whiteSpace: 'nowrap' }}>👥{people}</span><span style={{ fontWeight: 700, color: GREEN, whiteSpace: 'nowrap' }}>{hrs}h</span>
                    </div>
                  )
                  return pattern.map((p, j) => (
                    <div key={j} style={{ fontSize: 8, color: GREY, border: `1px dashed ${GREY}`, borderRadius: 4, padding: '1px 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }} title={`${p.label} ${fmtMin(p.start)}`}>{fmtMin(p.start)} {p.label}</div>
                  ))
                })()}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>
          <span><span style={{ color: GREEN }}>■</span> fully staffed</span>
          <span><span style={{ color: AMBER }}>■</span> part-filled</span>
          <span><span style={{ color: RED }}>■</span> open, empty</span>
          <span><span style={{ color: GREY }}>▢</span> not released yet</span>
          <span><span style={{ color: TODAY }}>▣</span> today</span>
        </div>
      </div>

      {/* Day panel */}
      {selDate && (
        <div style={{ background: '#0A0A0A', border: '1px solid rgba(218,27,51,0.35)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div className="serif" style={{ fontSize: 18, color: '#fff' }}>{dayName(selDate)} {selDate.slice(8)} {MONTHS[+selDate.slice(5, 7) - 1]}</div>
            <button onClick={() => setSelDate(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>

          {eventsForDate(keyEvents, selDate).map(ev => {
            const m = catMeta(ev.category)
            return (
              <div key={ev.id} style={{ background: `${m.color}18`, border: `1px solid ${m.color}66`, borderRadius: 10, padding: '9px 12px', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 17 }}>{m.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{ev.title}{ev.location ? <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}> · 📍 {ev.location}</span> : null}</div>
                  {ev.angle && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, lineHeight: 1.45 }}>{ev.angle}</div>}
                  <div style={{ fontSize: 10.5, color: m.color, marginTop: 2 }}>Key date — staff up for the extra footfall</div>
                </div>
              </div>
            )
          })}

          {/* Customer bookings & tournament entries for this day — headline numbers, tap for the full list */}
          <DayBookings date={selDate} />

          {(() => {
            const dayClaims = claims.filter(c => selShifts.some(s => s.id === c.shift_id))
            // Remount (re-sync from the DB) whenever the day's claims change — e.g. after a
            // save/reload — so the grid is never a stale snapshot that clobbers newer data.
            const daySig = dayClaims.map(c => c.id).sort().join(',')
            return (
              <DayRosterGrid
                key={selDate + '|' + daySig}
                date={selDate}
                staff={staff}
                dayShifts={selShifts}
                dayClaims={dayClaims}
                availability={availability}
                busy={busy}
                onSave={(blocks) => saveRoster(selDate, blocks)}
              />
            )
          })()}

          {/* Shift notes for the day — manager briefings (pop up for staff) + the team's handover log */}
          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>📝 Shift notes</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>Your notes pop up for the team when they open this day. Their handover notes appear here too.</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 10 }}>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} placeholder="e.g. Make fresh limes through · we're out of oat milk · deep-clean the ice well" style={{ flex: 1, minWidth: 200, padding: '8px 10px', fontSize: 13, borderRadius: 8, background: '#000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              <button onClick={addNote} disabled={busy || !noteText.trim()} style={{ ...btn('gold'), opacity: noteText.trim() ? 1 : 0.5 }}>Add note</button>
            </div>
            {(() => {
              const dayNotes = notes.filter(n => n.date === selDate)
              if (dayNotes.length === 0) return <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No notes for this day yet.</div>
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dayNotes.map(n => {
                    const mgr = n.kind === 'manager'
                    return (
                      <div key={n.id} style={{ background: mgr ? 'rgba(218,27,51,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${mgr ? 'rgba(218,27,51,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: mgr ? RED : GREEN }}>{mgr ? '📣 ' : '↪ '}{n.author_name || (mgr ? 'Management' : 'Staff')}</span>
                          <button onClick={() => deleteNote(n.id)} disabled={busy} title="Delete" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
                        </div>
                        <div style={{ fontSize: 13, color: '#fff', whiteSpace: 'pre-wrap', marginTop: 2 }}>{n.body}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Actual hours from clock in/out — approve to feed the week's wage total */}
          {(() => {
            const dayClocks = clocks.filter(c => c.date === selDate && (c.clock_in || c.clock_out))
            if (dayClocks.length === 0) return null
            const nameById = {}; for (const s of staff) nameById[s.id] = s.name
            const fmtT = (t) => t ? new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
            const rosteredMin = {}
            for (const sh of selShifts) { const hrs = (sh.end_min - sh.start_min); for (const c of (claimsByShift[sh.id] || [])) rosteredMin[c.staff_id] = (rosteredMin[c.staff_id] || 0) + hrs }
            return (
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>⏱ Actual hours worked</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>From clock in/out. Approve each once you're happy — approved hours are what the week's wage total uses.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dayClocks.map(c => {
                    const worked = clockDur(c), wh = Math.floor(worked / 60), wm = worked % 60
                    const rost = Math.round((rosteredMin[c.staff_id] || 0) / 60 * 10) / 10
                    const done = !!c.clock_out
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: c.approved ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${c.approved ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ flex: 1, minWidth: 150 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {nameById[c.staff_id] || 'Unknown'}
                            {c.auto_out && <span style={{ fontSize: 10.5, fontWeight: 700, color: AMBER, border: `1px solid ${AMBER}66`, borderRadius: 5, padding: '1px 5px' }} title="They forgot to clock out — the system auto-signed-out at their rostered end. Please check the finish time.">⏰ auto-signed-out</span>}
                            {(() => { const pb = presenceBadge(c.presence); return pb ? <span style={{ fontSize: 10.5, fontWeight: 700, color: pb.color, border: `1px solid ${pb.color}55`, borderRadius: 5, padding: '1px 5px' }} title={`Clock-in: ${pb.text}`}>{pb.icon} {pb.short}</span> : null })()}
                            {(() => { const pb = presenceBadge(c.presence_out); return (pb && c.presence_out !== c.presence) ? <span style={{ fontSize: 10.5, fontWeight: 700, color: pb.color, border: `1px solid ${pb.color}55`, borderRadius: 5, padding: '1px 5px' }} title={`Clock-out: ${pb.text}`}>out {pb.icon}</span> : null })()}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>In {fmtT(c.clock_in)} · Out {done ? fmtT(c.clock_out) : 'still on'}{done ? ` · worked ${wh}h${wm ? ` ${wm}m` : ''}` : ''} <span style={{ color: 'rgba(255,255,255,0.4)' }}>· rostered {rost}h</span></div>
                        </div>
                        {done && <button onClick={() => approveClock(c.staff_id, selDate, !c.approved)} disabled={busy} style={c.approved ? btn('ghost') : btn('gold')}>{c.approved ? '✓ Approved' : 'Approve'}</button>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* All past shifts — full history of who worked, rostered vs actual clocked (founder) */}
      {(() => {
        const nameById = {}; for (const s of staff) nameById[s.id] = s.name
        const rows = []
        for (const sh of shifts) {
          if (sh.date >= todayStr) continue
          for (const c of (claimsByShift[sh.id] || [])) rows.push({ date: sh.date, staffId: c.staff_id, name: nameById[c.staff_id] || 'Unknown', sh })
        }
        if (!rows.length) return null
        const byDate = {}
        for (const r of rows) (byDate[r.date] ||= []).push(r)
        const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))
        return (
          <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setPastOpen(o => !o)}>
              <button style={{ ...weekNav, width: 26 }}>{pastOpen ? '▾' : '▸'}</button>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>📋 All past shifts</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{rows.length} shift{rows.length === 1 ? '' : 's'} worked · rostered vs actual</span>
            </div>
            {pastOpen && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 520, overflowY: 'auto' }}>
                {dates.map(date => (
                  <div key={date}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: RED, marginBottom: 6 }}>{dayName(date)} {date.slice(8)} {MONTHS[+date.slice(5, 7) - 1]}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {byDate[date].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(r => {
                        const clk = clockMap[`${r.staffId}|${r.date}`]
                        const inT = fmtClockTime(clk?.clock_in), outT = fmtClockTime(clk?.clock_out)
                        const worked = workedMins(clk?.clock_in, clk?.clock_out)
                        return (
                          <div key={r.sh.id + '|' + r.staffId} style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 110 }}>{r.name} <span style={{ fontSize: 10.5, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>{r.sh.label}</span></div>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Rostered <strong style={{ color: '#fff' }}>{shiftTimeLabel(r.sh)}</strong></span>
                            {inT
                              ? <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Clocked <strong style={{ color: '#60A5FA' }}>{inT}–{outT || '…'}</strong>{worked ? <span style={{ color: '#60A5FA' }}> · {hoursLabel(worked)}</span> : (!outT ? <span style={{ color: AMBER }}> · no clock-out</span> : null)}{clk.auto_out ? <span style={{ color: AMBER }} title="Auto-signed-out — check the finish time"> · ⏰ auto</span> : null}{clk.approved ? <span style={{ color: GREEN }} title="Approved"> · ✓</span> : null}{(() => { const pb = presenceBadge(clk?.presence); return pb ? <span style={{ color: pb.color }} title={`Clock-in: ${pb.text}`}> · {pb.icon} {pb.short}</span> : null })()}</span>
                              : <span style={{ fontSize: 12, color: AMBER }}>Didn't clock in</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: '#fff' }}>Rostering a day:</strong> tap a day to open it, then {isMobile
          ? <>tap <strong style={{ color: '#fff' }}>+ Add shift</strong> on a person and set their <strong style={{ color: '#fff' }}>start &amp; end</strong> times</>
          : <><strong style={{ color: '#fff' }}>drag across a person's row</strong> to set their hours (30-minute slots, colour-coded by role), drag a block's right edge to trim it</>}, and <strong style={{ color: '#fff' }}>Save roster</strong>. Whoever's on is who's working — their hours &amp; wage flow into the week overview above, and they see their shifts in their own portal.
      </div>
    </div>
  )
}

// Role display order for the "by role" sort (founder-set stack):
// Manager → Assistant Manager → Bar Staff → Kitchen Staff. (Supervisor sits just
// below Assistant Manager; unknown/blank roles group with Bar Staff.)
const ROLE_ORDER = { 'Manager': 0, 'Asst. Manager': 1, 'Supervisor': 2, 'Bar Staff': 3, 'Kitchen / Barback': 4 }
const roleRank = (role) => ROLE_ORDER[role] ?? 3

const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: '#DA1B33', color: '#FFFFFF' }
  if (kind === 'red') return { ...base, background: 'transparent', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.18)' }
}
const weekNav = { width: 30, height: 28, borderRadius: 7, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
// Week-overview date helpers (UTC, Monday-start — matches the rest of the app).
// ─── Bookings & reservations for one day (day panel) ─────────────────────────
// Customer bookings from nodice.bar (tables + pool, `bar_reservations`) and paid
// tournament sign-ups, read straight from the shared Supabase. Headline numbers
// on the summary row; open the dropdown for the full booking list. Cancelled
// bookings are excluded. Refetches whenever the selected day changes.
function DayBookings({ date }) {
  const [data, setData] = useState(null)   // null = loading · { resv, tourn }
  useEffect(() => {
    let cancelled = false
    setData(null)
    const h = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    const url = (p) => `${SUPABASE_URL}/rest/v1/${p}`
    Promise.allSettled([
      fetch(url(`bar_reservations?select=id,kind,start_time,duration_minutes,party_size,resource_count,name,notes,status&reservation_date=eq.${date}&status=in.(confirmed,paid)&order=start_time`), { headers: h }).then(r => r.json()),
      fetch(url(`tournament_entries?select=id,team_name,captain_name,tournaments!inner(event_date)&status=eq.paid&tournaments.event_date=eq.${date}`), { headers: h }).then(r => r.json()),
    ]).then(([a, t]) => {
      if (cancelled) return
      setData({
        resv: a.status === 'fulfilled' && Array.isArray(a.value) ? a.value : [],
        tourn: t.status === 'fulfilled' && Array.isArray(t.value) ? t.value : [],
      })
    })
    return () => { cancelled = true }
  }, [date])

  if (!data) return <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>Checking bookings…</div>
  const { resv, tourn } = data
  if (resv.length === 0 && tourn.length === 0) return null   // nothing booked — keep the panel clean
  const covers = resv.reduce((a, r) => a + (r.party_size || 0), 0)
  const big = resv.filter(r => (r.party_size || 0) >= 8).length
  const tTime = (t) => (t || '').slice(0, 5)
  const endOf = (r) => { if (!r.start_time) return ''; const [hh, mm] = r.start_time.split(':').map(Number); const e = hh * 60 + mm + (r.duration_minutes || 60); return `${String(Math.floor(e / 60) % 24).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}` }
  return (
    <details style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: 10, padding: '0 12px' }}>
      <summary style={{ cursor: 'pointer', padding: '10px 0', fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700 }}>📖 Bookings</span>
        <span style={{ fontSize: 12.5, color: '#60A5FA', fontWeight: 700 }}>{resv.length} booking{resv.length === 1 ? '' : 's'} · {covers} covers</span>
        {big > 0 && <span style={{ fontSize: 11.5, color: AMBER, fontWeight: 700 }}>🔥 {big} big group{big === 1 ? '' : 's'} (8+)</span>}
        {tourn.length > 0 && <span style={{ fontSize: 11.5, color: PURPLE, fontWeight: 700 }}>🎱 {tourn.length} tournament entr{tourn.length === 1 ? 'y' : 'ies'}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>details ▾</span>
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 12 }}>
        {resv.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: '#fff', minWidth: 86 }}>{tTime(r.start_time)}–{endOf(r)}</span>
            <span style={{ color: 'rgba(255,255,255,0.75)' }}>{r.kind === 'pool' ? `🎱 Pool${(r.resource_count || 1) > 1 ? ` ×${r.resource_count}` : ''}` : '🍽️ Table'}</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{r.name || '—'}</span>
            <span style={{ color: (r.party_size || 0) >= 8 ? AMBER : 'rgba(255,255,255,0.7)', fontWeight: 700 }}>👥 {r.party_size || '?'}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: r.status === 'paid' ? GREEN : '#60A5FA' }}>{r.status}</span>
            {r.notes && <div style={{ width: '100%', fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>“{r.notes}”</div>}
          </div>
        ))}
        {tourn.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, padding: '7px 10px', fontSize: 12 }}>
            <span>🎱</span><span style={{ color: '#fff', fontWeight: 600 }}>{t.team_name || t.captain_name || 'Entry'}</span>
            {t.team_name && t.captain_name && t.team_name !== t.captain_name && <span style={{ color: 'rgba(255,255,255,0.6)' }}>capt. {t.captain_name}</span>}
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: PURPLE }}>Tournament</span>
          </div>
        ))}
      </div>
    </details>
  )
}

const addDaysISO = (d, n) => { const dt = new Date(d + 'T00:00:00Z'); dt.setUTCDate(dt.getUTCDate() + n); return dt.toISOString().slice(0, 10) }
const mondayOf = (d) => addDaysISO(d, -((new Date(d + 'T00:00:00Z').getUTCDay() + 6) % 7))
const fmtDay = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })
const fmtDayMon = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const gbp = (n) => '£' + Number(n || 0).toLocaleString('en-GB', { maximumFractionDigits: 2 })
