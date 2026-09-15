import React, { useState } from 'react'
import { shiftPay, payFor, money } from '../../rota/pay.js'
import { fmtMin, dayName } from '../../rota/shifts.js'
import { tipsForStaffMonth } from '../../finance/tipsData.js'

// ─── 💷 Pay — what each person's invoice should say (founder) ─────────────────
// Month by month, per person, from the rota + what they actually clocked:
//   paid start = clock-in rounded to the nearest hour (never before rostered),
//   paid end = clock-out; 6h+ shifts lose 5 min/worked hour (always, tapped or
//   not); no clock-in = unpaid; 🤒 sick day = half the rostered hours.
// Tips are a SEPARATE invoice — shown alongside, never mixed into hours.
// Reads the finance lane's tips data read-only (updated on each CSV drop).

const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33', BLUE = '#60A5FA'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const gbp = (n) => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const iso = (d) => d.toISOString().slice(0, 10)
const addDays = (ds, n) => { const d = new Date(ds + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const mondayOf = (ds) => addDays(ds, -((new Date(ds + 'T00:00:00Z').getUTCDay() + 6) % 7))
const wkLabel = (ds) => new Date(ds + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export default function PayInvoices({ staff = [], shifts = [], claims = [], clocks = [] }) {
  const now = new Date()
  // Weekly payroll cycle (Mon–Sun). Default to the week just gone (up to today).
  const [weekStart, setWeekStart] = useState(() => mondayOf(iso(now)))
  const [openId, setOpenId] = useState(null)
  const step = (n) => setWeekStart(w => addDays(w, n * 7))
  const weekEnd = addDays(weekStart, 6)
  const ym = weekEnd.slice(0, 7)   // month the week belongs to — for the monthly tips figure

  const todayStr = iso(now)
  const inWeek = (d) => d >= weekStart && d <= weekEnd
  const claimsByShift = {}
  for (const c of claims) (claimsByShift[c.shift_id] ||= []).push(c)
  const clockBy = {}   // staffId|date → clock row
  for (const c of clocks) clockBy[`${c.staff_id}|${c.date}`] = c

  const rows = staff.filter(s => s.active !== false || shifts.some(sh => inWeek(sh.date) && (claimsByShift[sh.id] || []).some(c => c.staff_id === s.id))).map(s => {
    const lines = []
    for (const sh of shifts) {
      if (!inWeek(sh.date) || sh.date > todayStr) continue   // only days in this week that have happened
      const c = (claimsByShift[sh.id] || []).find(x => x.staff_id === s.id)
      if (!c) continue
      const p = shiftPay(sh, clockBy[`${s.id}|${sh.date}`] || null, sh.date, { sick: c.status === 'sick' })
      lines.push({ date: sh.date, sh, ...p })
    }
    lines.sort((a, b) => a.date.localeCompare(b.date))
    const paidMin = lines.reduce((a, l) => a + l.paidMin, 0)
    const breakMin = lines.reduce((a, l) => a + l.breakMin, 0)
    const sickDays = lines.filter(l => l.kind === 'sick').length
    const missed = lines.filter(l => l.kind === 'unworked').length
    const rate = s.hourly_rate == null || s.hourly_rate === '' ? null : Number(s.hourly_rate)
    const pay = rate != null ? payFor(paidMin, rate) : null
    return { s, lines, paidMin, breakMin, sickDays, missed, rate, pay }
  }).filter(r => r.lines.length > 0).sort((a, b) => (b.pay || 0) - (a.pay || 0))

  const totPay = rows.reduce((a, r) => a + (r.pay || 0), 0)
  // Tips settle MONTHLY (separate invoice) — the whole month's figure for the week's month.
  const monthTips = rows.map(r => tipsForStaffMonth ? (tipsForStaffMonth((r.s.name || '').split(' ')[0], ym) || 0) : 0).reduce((a, b) => a + b, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div className="serif" style={{ fontSize: 22, color: '#fff' }}>💷 Pay — weekly invoices</div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 3, lineHeight: 1.6 }}>
          Worked out from clock-in/out: start rounds to the <strong style={{ color: '#fff' }}>nearest hour</strong> (never before their rostered start) · shifts over 6h lose <strong style={{ color: '#fff' }}>5 min per worked hour</strong> as the unpaid break (taken or not) · no clock-in = not paid · <span style={{ color: AMBER }}>🤒 sick days pay half the rostered hours</span>. Hours invoice <strong style={{ color: '#fff' }}>weekly</strong>; tips are a <strong style={{ color: BLUE }}>separate monthly invoice</strong>.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => step(-1)} style={nav}>◀</button>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', minWidth: 170, textAlign: 'center' }}>Week {wkLabel(weekStart)} – {wkLabel(weekEnd)}</div>
        <button onClick={() => step(1)} style={nav}>▶</button>
        <button onClick={() => setWeekStart(mondayOf(iso(now)))} style={{ ...nav, width: 'auto', padding: '0 10px', fontSize: 11, color: '#fff' }}>This week</button>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#fff', textAlign: 'right' }}>Hours invoices (this week) <strong style={{ color: GREEN }}>{gbp(totPay)}</strong><br /><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Tips invoices ({MONTHS[+ym.slice(5, 7) - 1]}, monthly) <strong style={{ color: BLUE }}>{gbp(monthTips)}</strong></span></span>
      </div>

      {rows.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>No worked days found for this week yet.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(({ s, lines, paidMin, breakMin, sickDays, missed, rate, pay }) => (
          <div key={s.id} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14 }}>
            <div onClick={() => setOpenId(o => o === s.id ? null : s.id)} style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', cursor: 'pointer' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', minWidth: 120 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                <strong style={{ color: '#fff' }}>{Math.round(paidMin / 6) / 10}h</strong> paid
                {breakMin > 0 && <span style={{ color: AMBER }}> · −{breakMin}m breaks</span>}
                {sickDays > 0 && <span style={{ color: AMBER }}> · 🤒 {sickDays} sick (half pay)</span>}
                {missed > 0 && <span style={{ color: '#F87171' }}> · {missed} no-clock (unpaid)</span>}
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: pay != null ? GREEN : AMBER }}>{pay != null ? gbp(pay) : 'no rate set'}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)' }}>{rate != null ? `weekly hours invoice @ £${rate}/h` : 'set in Team → Pay & hours'}</div>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{openId === s.id ? '▴' : '▾'}</span>
            </div>
            {openId === s.id && (
              <div style={{ marginTop: 10, borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: 8, display: 'grid', gridTemplateColumns: 'auto auto auto auto 1fr', gap: '4px 14px', fontSize: 11.5, color: 'rgba(255,255,255,0.75)' }}>
                <span style={hd}>Day</span><span style={hd}>Rostered</span><span style={hd}>Paid</span><span style={hd}>Break</span><span style={hd}>Note</span>
                {lines.map((l, i) => (
                  <React.Fragment key={i}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{dayName(l.date).slice(0, 3)} {+l.date.slice(8)}</span>
                    <span>{fmtMin(l.sh.start_min)}–{fmtMin(l.sh.end_min)}</span>
                    <span style={{ color: l.kind === 'unworked' ? '#F87171' : '#fff' }}>{l.kind === 'unworked' ? '—' : l.kind === 'sick' ? `${Math.round(l.paidMin / 6) / 10}h` : `${fmtMin(l.start)}–${fmtMin(l.end)} (${Math.round(l.paidMin / 6) / 10}h)`}</span>
                    <span style={{ color: l.breakMin ? AMBER : 'rgba(255,255,255,0.35)' }}>{l.breakMin ? `−${l.breakMin}m` : '—'}</span>
                    <span style={{ color: l.kind === 'sick' ? AMBER : l.kind === 'unworked' ? '#F87171' : 'rgba(255,255,255,0.45)' }}>{l.kind === 'sick' ? '🤒 sick — half rostered' : l.kind === 'unworked' ? 'no clock-in — unpaid' : ''}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: '#fff' }}>Checking an invoice:</strong> the green figure is each person's <strong style={{ color: '#fff' }}>weekly hours invoice</strong>; tips are a <strong style={{ color: BLUE }}>separate MONTHLY invoice</strong> (shown as the month total in the header, not split by week — they settle end of month) (from the latest Lightspeed tips data — drop a new payments CSV to refresh it). Tap a person to see every day: rostered vs paid times, the break deduction, sick days and any unpaid no-clock days. Fix a wrong clock time on the Rota calendar (tap the day → adjust the clock record) and this updates instantly.
      </div>
    </div>
  )
}

const hd = { fontSize: 9.5, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }
const nav = { width: 32, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: RED, fontSize: 14, cursor: 'pointer' }
