import React, { useEffect, useMemo, useState } from 'react'
import { rotaLoad } from '../../rota/api.js'
import { workedMins, hoursLabel } from '../../rota/shifts.js'

// ─── Finances (FOUNDER ONLY — registered founderOnly:true in OpsApp) ─────────
// Senior-management money view, hidden from team-tier (NDTEAM) logins. Slice 1
// is the WAGE BILL, computed from real clock-in/out records (~6 months returned
// by the rota admin `load`) × each member's hourly rate. Salaried staff with no
// hourly rate are listed but excluded from the hourly total, with a note.
// Next slices (placeholders below): till takings, supplier costs, VAT/key dates.

const GOLD = 'var(--gold)', CREAM = 'var(--cream)', DIM = 'var(--cream-dim)'
const CARD = { background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '16px 18px' }

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (ds, n) => { const d = new Date(ds + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const mondayOf = (ds) => addDays(ds, -((new Date(ds + 'T00:00:00Z').getUTCDay() + 6) % 7))
const monthStart = (ds) => ds.slice(0, 8) + '01'
const gbp = (n) => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// The four ready-made windows the founder flips between. [from, to] inclusive.
function periods(todayStr) {
  const wk = mondayOf(todayStr)
  const mo = monthStart(todayStr)
  const lastMoEnd = addDays(mo, -1)
  return [
    { key: 'thisweek',  label: 'This week',  from: wk,                    to: todayStr },
    { key: 'lastweek',  label: 'Last week',  from: addDays(wk, -7),       to: addDays(wk, -1) },
    { key: 'thismonth', label: 'This month', from: mo,                    to: todayStr },
    { key: 'lastmonth', label: 'Last month', from: monthStart(lastMoEnd), to: lastMoEnd },
  ]
}

export default function Finances() {
  const [staff, setStaff] = useState([])
  const [clocks, setClocks] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [periodKey, setPeriodKey] = useState('thisweek')

  useEffect(() => {
    rotaLoad()
      .then(r => { setStaff(r.staff || []); setClocks(r.clocks || []) })
      .catch(e => setErr(e.message || 'Could not load'))
      .finally(() => setLoading(false))
  }, [])

  const todayStr = iso(new Date())
  const PERIODS = useMemo(() => periods(todayStr), [todayStr])
  const period = PERIODS.find(p => p.key === periodKey) || PERIODS[0]

  // Wage numbers for one [from,to] window: per-person minutes worked + cost.
  // Uses completed clock records only (in + out); auto-closed ones count but are
  // flagged — they're the best estimate until the founder adjusts them.
  const tally = useMemo(() => {
    const byStaff = {}
    for (const s of staff) byStaff[s.id] = { staff: s, mins: 0, cost: 0, shifts: 0, autoOut: 0 }
    const windows = {}
    for (const p of PERIODS) windows[p.key] = { mins: 0, cost: 0, unrated: 0 }
    for (const c of clocks) {
      if (!c.clock_in || !c.clock_out || !c.date) continue
      const mins = workedMins(c.clock_in, c.clock_out)
      if (!mins) continue
      const s = byStaff[c.staff_id]
      const rate = s ? Number(s.staff.hourly_rate) : NaN
      const rated = Number.isFinite(rate) && rate > 0
      for (const p of PERIODS) {
        if (c.date < p.from || c.date > p.to) continue
        windows[p.key].mins += mins
        if (rated) windows[p.key].cost += (mins / 60) * rate
        else windows[p.key].unrated += mins
        if (p.key === periodKey && s) {
          s.mins += mins; s.shifts += 1
          if (rated) s.cost += (mins / 60) * rate
          if (c.auto_out) s.autoOut += 1
        }
      }
    }
    const rows = Object.values(byStaff).filter(r => r.mins > 0).sort((a, b) => b.cost - a.cost || b.mins - a.mins)
    return { windows, rows }
  }, [staff, clocks, PERIODS, periodKey])

  if (loading) return <div style={{ padding: 24, color: DIM, fontSize: 13 }}>Loading the money picture…</div>
  if (err) return <div style={{ padding: 24, color: '#F87171', fontSize: 13 }}>{err}</div>

  const totalRow = tally.rows.reduce((a, r) => ({ mins: a.mins + r.mins, cost: a.cost + r.cost }), { mins: 0, cost: 0 })
  const anyUnrated = tally.rows.some(r => !(Number(r.staff.hourly_rate) > 0))
  const anyAuto = tally.rows.some(r => r.autoOut > 0)

  return (
    <div style={{ padding: '20px max(16px, env(safe-area-inset-right)) 40px max(16px, env(safe-area-inset-left))', maxWidth: 1000, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div className="serif" style={{ fontSize: 24, color: GOLD }}>💷 Finances</div>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', background: GOLD, borderRadius: 999, padding: '3px 10px' }}>Founder only</div>
      </div>
      <div style={{ fontSize: 12.5, color: DIM, margin: '6px 0 18px', lineHeight: 1.5 }}>
        The money picture for senior management. Slice 1 is the <strong style={{ color: CREAM }}>wage bill</strong> — real clocked hours × each person's rate. Till takings, supplier costs and tax dates come next.
      </div>

      {/* Wage bill across the four windows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 18 }}>
        {PERIODS.map(p => {
          const w = tally.windows[p.key]
          const active = p.key === periodKey
          return (
            <button key={p.key} onClick={() => setPeriodKey(p.key)} style={{ ...CARD, textAlign: 'left', cursor: 'pointer', borderColor: active ? GOLD : 'rgba(201,168,76,0.2)', background: active ? 'rgba(201,168,76,0.08)' : 'var(--ink-2)' }}>
              <div style={{ fontSize: 11, color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{p.label}</div>
              <div className="serif" style={{ fontSize: 24, color: active ? GOLD : CREAM, margin: '4px 0 2px' }}>{gbp(w.cost)}</div>
              <div style={{ fontSize: 11.5, color: DIM }}>{hoursLabel(w.mins)} clocked{w.unrated ? ` · ${hoursLabel(w.unrated)} salaried` : ''}</div>
            </button>
          )
        })}
      </div>

      {/* Per-person breakdown for the selected window */}
      <div style={{ ...CARD, marginBottom: 18, overflowX: 'auto' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: CREAM, marginBottom: 10 }}>Who earned what — {period.label.toLowerCase()} <span style={{ color: DIM, fontWeight: 400, fontSize: 12 }}>({period.from} → {period.to})</span></div>
        {tally.rows.length === 0 ? (
          <div style={{ fontSize: 12.5, color: DIM }}>No completed clock records in this window yet.</div>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12.5, minWidth: 480 }}>
            <thead>
              <tr>{['Name', 'Role', 'Shifts', 'Hours', 'Rate', 'Cost'].map(h => <th key={h} style={{ textAlign: h === 'Name' || h === 'Role' ? 'left' : 'right', padding: '6px 8px', color: DIM, fontWeight: 600, borderBottom: '1px solid rgba(201,168,76,0.25)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {tally.rows.map(r => {
                const rate = Number(r.staff.hourly_rate)
                const rated = Number.isFinite(rate) && rate > 0
                return (
                  <tr key={r.staff.id}>
                    <td style={{ padding: '7px 8px', color: CREAM, fontWeight: 600, whiteSpace: 'nowrap' }}>{(r.staff.name || 'Unnamed')}{r.autoOut > 0 && <span title={`${r.autoOut} shift(s) auto-signed-out — adjust in Staff Rota`} style={{ marginLeft: 6, fontSize: 11 }}>⏰</span>}</td>
                    <td style={{ padding: '7px 8px', color: DIM, whiteSpace: 'nowrap' }}>{r.staff.role || '—'}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: CREAM }}>{r.shifts}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: CREAM, whiteSpace: 'nowrap' }}>{hoursLabel(r.mins)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: rated ? CREAM : DIM, whiteSpace: 'nowrap' }}>{rated ? gbp(rate) + '/h' : 'salaried'}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: rated ? GOLD : DIM, fontWeight: 700, whiteSpace: 'nowrap' }}>{rated ? gbp(r.cost) : '—'}</td>
                  </tr>
                )
              })}
              <tr>
                <td colSpan={3} style={{ padding: '9px 8px', color: DIM, borderTop: '1px solid rgba(201,168,76,0.25)' }}>Total (hourly staff)</td>
                <td style={{ padding: '9px 8px', textAlign: 'right', color: CREAM, fontWeight: 700, borderTop: '1px solid rgba(201,168,76,0.25)', whiteSpace: 'nowrap' }}>{hoursLabel(totalRow.mins)}</td>
                <td style={{ borderTop: '1px solid rgba(201,168,76,0.25)' }} />
                <td style={{ padding: '9px 8px', textAlign: 'right', color: GOLD, fontWeight: 800, borderTop: '1px solid rgba(201,168,76,0.25)', whiteSpace: 'nowrap' }}>{gbp(totalRow.cost)}</td>
              </tr>
            </tbody>
          </table>
        )}
        {(anyUnrated || anyAuto) && (
          <div style={{ fontSize: 11.5, color: DIM, marginTop: 10, lineHeight: 1.5 }}>
            {anyUnrated && <>“Salaried” = no hourly rate set on their profile (set one in Staff Rota → Team → Edit → Pay &amp; hours to include them here). </>}
            {anyAuto && <>⏰ = includes an auto-signed-out shift (forgot to clock out) — the hours are an estimate until you adjust them in Staff Rota.</>}
          </div>
        )}
      </div>

      {/* Coming next — honest placeholders so the shape of the page is set */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {[
          ['🧾 Till takings', 'Daily sales from the Lightspeed till, next to the wage bill — so each day shows wages as a % of takings.'],
          ['📦 Supplier costs', 'What we spend with each supplier (linked to the Bar stock orders), month by month.'],
          ['📅 VAT & key dates', 'VAT quarters, PAYE runs and filing deadlines on one calendar, with reminders.'],
        ].map(([title, blurb]) => (
          <div key={title} style={{ ...CARD, opacity: 0.75 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: CREAM }}>{title}</div>
            <div style={{ fontSize: 12, color: DIM, marginTop: 5, lineHeight: 1.5 }}>{blurb}</div>
            <div style={{ fontSize: 10.5, color: GOLD, marginTop: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Next slice</div>
          </div>
        ))}
      </div>
    </div>
  )
}
