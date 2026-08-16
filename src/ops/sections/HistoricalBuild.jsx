import React, { useMemo, useState } from 'react'
import { sourceWeekFor, TILL_BY_DATE, TILL_HISTORY_META, shapeDay, analyseDay, rosteredBars, personForLogin, LOGIN_TO_NAME, fmtT, gbp0, mondayOf } from '../../rota/historical.js'
import { addDaysISO, withDefaults } from '../../rota/rotaEngine.js'

// ─── Historical build (AI Builder mode) ──────────────────────────────────────
// A shadow of last week's till: half-hour sales bars per day, who was on the
// tills and when, who was rostered, what sold — with the demand curve the
// builder derives from it and the shifts it will propose. Callouts show where
// hours can be shaved (quiet + over-staffed) and where to overlap (peak).
// "Build this week from it" hands the shaped slots to the normal preview.

const RED = '#DA1B33', GREEN = '#34D399', AMBER = '#F59E0B', BLUE = '#60A5FA', PURPLE = '#A855F7'
const dayLabel = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })
const shortDay = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const PALETTE = ['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#A78BFA', '#2DD4BF', '#FB923C']

export default function HistoricalBuild({ weekStart, staff = [], shifts = [], claims = [], rules = null, onBuild }) {
  const auto = useMemo(() => sourceWeekFor(weekStart), [weekStart])
  const [srcMonday, setSrcMonday] = useState(auto.monday)
  React.useEffect(() => { setSrcMonday(auto.monday) }, [auto.monday])
  const [capacity, setCapacity] = useState(110)   // £ one person serves per half-hour
  const [floorMin, setFloorMin] = useState(0)
  const ruleMin = withDefaults(rules).minShiftMin || 360
  const [minShift, setMinShift] = useState(ruleMin)   // your Shortest-shift rule is the default (and the floor of the dial)
  const srcDates = Array.from({ length: 7 }, (_, i) => addDaysISO(srcMonday, i))
  const covered = srcDates.filter(d => TILL_BY_DATE[d]).length
  const latestMonday = mondayOf(TILL_HISTORY_META.to)

  const days = srcDates.map((sd, i) => {
    const td = addDaysISO(weekStart, i)
    const src = TILL_BY_DATE[sd] || null
    const bars = rosteredBars(sd, shifts, claims, staff)
    return { td, sd, src, bars, shaped: shapeDay(td, src, rules, { capacity, floorMin, minShift }), insight: analyseDay(src, bars) }
  })
  const weekTotal = days.reduce((a, d) => a + (d.src?.total || 0), 0)
  const weekShave = days.reduce((a, d) => a + (d.insight?.shaveHours || 0), 0)
  const proposedHours = days.reduce((a, d) => a + d.shaped.slots.reduce((x, s) => x + (s.end - s.start), 0) / 60, 0)
  const lastWeekHours = days.reduce((a, d) => a + (d.insight?.staffHours || 0), 0)

  const build = () => {
    const slotsByDate = {}
    for (const d of days) slotsByDate[d.td] = { slots: d.shaped.slots, open: d.shaped.open, close: d.shaped.close, shadow: d.shaped.shadow }
    onBuild?.(slotsByDate)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header: which week is being mirrored + the three dials */}
      <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>📜 Mirroring the till from</span>
          <button onClick={() => setSrcMonday(m => addDaysISO(m, -7))} style={nav}>◀</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: BLUE, minWidth: 190, textAlign: 'center' }}>{shortDay(srcMonday)} – {shortDay(addDaysISO(srcMonday, 6))}</span>
          <button onClick={() => setSrcMonday(m => addDaysISO(m, 7))} disabled={srcMonday >= latestMonday} style={{ ...nav, opacity: srcMonday >= latestMonday ? 0.4 : 1 }}>▶</button>
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>{covered}/7 days of till data{!auto.exact && srcMonday === auto.monday ? ' · latest week with data (the week just before has none yet)' : ''}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#fff' }}><strong>{gbp0(weekTotal)}</strong> taken that week</span>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <Dial label="How lean" hint="£ one person can serve per half-hour — higher = fewer people" value={capacity} min={50} max={220} step={10} onChange={setCapacity} fmt={v => `£${v}`} />
          <Dial label="Never fewer than" hint="floor people always on (besides the manager)" value={floorMin} min={0} max={3} step={1} onChange={setFloorMin} fmt={v => `${v} on floor`} />
          <Dial label="Shortest shift" hint="a shift is never shorter than this — set by your rules (Options → Shortest shift); you can only go longer here" value={minShift} min={ruleMin} max={Math.max(ruleMin, 480)} step={30} onChange={setMinShift} fmt={v => `${v / 60}h`} />
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
          <span>Last week staffed <strong style={{ color: '#fff' }}>{Math.round(lastWeekHours)}h</strong></span>
          <span>·</span>
          <span>Proposed <strong style={{ color: proposedHours < lastWeekHours ? GREEN : '#fff' }}>{Math.round(proposedHours)}h</strong>{lastWeekHours > 0 && <span style={{ color: proposedHours < lastWeekHours ? GREEN : AMBER }}> ({proposedHours < lastWeekHours ? '−' : '+'}{Math.abs(Math.round(proposedHours - lastWeekHours))}h)</span>}</span>
          {weekShave > 0 && <><span>·</span><span>Quiet-time over-staffing spotted: <strong style={{ color: AMBER }}>{weekShave}h</strong></span></>}
          <button onClick={build} style={{ ...btn('gold'), marginLeft: 'auto' }}>📜 Build this week from it →</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 12 }}>
        {days.map(d => <DayShadow key={d.td} {...d} staff={staff} />)}
      </div>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: '#fff' }}>How to read it:</strong> the bars are last week's sales per half-hour (taller = busier). Under them: who was on the <span style={{ color: BLUE }}>tills</span> and when, who was <span style={{ color: 'rgba(255,255,255,0.8)' }}>rostered</span>, and the <span style={{ color: GREEN }}>shifts this build proposes</span> — the manager and kitchen from your rules, then floor shifts that start when the sales needed a second (third…) pair of hands and finish when they didn't. <span style={{ color: AMBER }}>Shave</span> = quiet stretch with 2+ on; <span style={{ color: RED }}>Peak</span> = line up your overlaps here. Turn the dials, then <strong style={{ color: '#fff' }}>Build</strong> — you get the normal editable preview to tweak and Apply. Data: Lightspeed exports {TILL_HISTORY_META.from} → {TILL_HISTORY_META.to}{' '}(days marked “payments only” have the busy-times but no product mix — drop the latest transactions export to fill them in).
      </div>
    </div>
  )
}

function DayShadow({ td, sd, src, bars, shaped, insight, staff }) {
  const [open, setOpen] = useState(false)
  if (!src) return (
    <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{dayLabel(td)}</div>
      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>No till data for {shortDay(sd)} — this day will use your normal rules.</div>
    </div>
  )
  const series = insight.series
  const from = series[0]?.t ?? shaped.open, to = (series[series.length - 1]?.t ?? shaped.close) + 30
  const span = Math.max(1, to - from)
  const pct = (m) => `${((m - from) / span) * 100}%`
  const wpct = (a, b) => `${((b - a) / span) * 100}%`
  const peak = insight.peak
  const tills = Object.entries(src.staff || {}).map(([login, v], i) => ({ login, name: personForLogin(login, staff)?.name?.split(' ')[0] || LOGIN_TO_NAME[login] || login, ...v, color: PALETTE[i % PALETTE.length] }))
  const proposed = shaped.slots
  const hourMarks = []; for (let t = Math.ceil(from / 60) * 60; t < to; t += 60) hourMarks.push(t)
  const groups = Object.entries(src.groups || {}).filter(([, v]) => v > 0)

  return (
    <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{dayLabel(td)}</div>
          <div style={{ fontSize: 11, color: BLUE }}>shadow of {shortDay(sd)} · {src.src === 'payments' ? 'payments only' : 'full till detail'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{gbp0(src.total)} <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>· {src.orders} orders</span></div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{insight.staffHours > 0 ? <>{Math.round(insight.staffHours)}h rostered · <strong style={{ color: insight.salesPerStaffHour >= 60 ? GREEN : AMBER }}>{gbp0(insight.salesPerStaffHour)}</strong>/staff-hr</> : 'nothing rostered that day'}</div>
        </div>
      </div>

      {/* Sales shadow bars */}
      <div style={{ position: 'relative', height: 54, display: 'flex', alignItems: 'flex-end', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        {series.map(p => {
          const h = Math.max(2, (p.s / peak) * 50)
          const hot = p.s >= peak * 0.6, cold = p.s < Math.max(25, peak * 0.2)
          return <div key={p.t} title={`${fmtT(p.t)}–${fmtT(p.t + 30)} · ${gbp0(p.s)} · ${p.n} orders${Object.keys(p.by || {}).length ? '\n' + Object.entries(p.by).map(([k, v]) => `${LOGIN_TO_NAME[k] || k}: ${gbp0(v)}`).join(' · ') : ''}`} style={{ flex: 1, height: h, background: hot ? RED : cold ? 'rgba(255,255,255,0.18)' : BLUE, borderRadius: '2px 2px 0 0', opacity: 0.9 }} />
        })}
      </div>
      <div style={{ position: 'relative', height: 12 }}>
        {hourMarks.map(t => <span key={t} style={{ position: 'absolute', left: pct(t), transform: 'translateX(-50%)', fontSize: 8.5, color: 'rgba(255,255,255,0.4)' }}>{fmtT(t)}</span>)}
      </div>

      {/* Tills / rostered / proposed lanes */}
      <Lane label="Tills" color={BLUE}>
        {tills.map(t => <Bar key={t.login} left={pct(t.first)} width={wpct(t.first, t.last + 5)} color={t.color} text={`${t.name} ${gbp0(t.sales)}`} title={`${t.name} on the till ${fmtT(t.first)}–${fmtT(t.last)} · ${gbp0(t.sales)} · ${t.orders} orders`} />)}
        {tills.length === 0 && <Empty>no till logins recorded</Empty>}
      </Lane>
      <Lane label="Rostered" color="rgba(255,255,255,0.75)">
        {bars.map((b, i) => <Bar key={i} left={pct(Math.max(from, b.start))} width={wpct(Math.max(from, b.start), Math.min(to, b.end))} color="rgba(255,255,255,0.28)" text={b.name.split(' ')[0]} title={`${b.name} rostered ${fmtT(b.start)}–${fmtT(b.end)}`} />)}
        {bars.length === 0 && <Empty>nothing on the saved rota for {shortDay(sd)}</Empty>}
      </Lane>
      <Lane label="Proposed" color={GREEN}>
        {proposed.map((s, i) => <Bar key={i} left={pct(Math.max(from, s.start))} width={wpct(Math.max(from, s.start), Math.min(to, s.end))} color={s.role === 'manager' ? PURPLE : s.role === 'kitchen' ? AMBER : GREEN} text={`${s.role === 'manager' ? '👔' : s.role === 'kitchen' ? '🍳' : '🍺'} ${fmtT(s.start)}–${fmtT(s.end)}`} title={`${s.label}: ${fmtT(s.start)}–${fmtT(s.end)}`} />)}
      </Lane>

      {/* Callouts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
        {insight.peakRun && <Callout color={RED}>🔥 Peak {fmtT(insight.peakRun.start)}–{fmtT(insight.peakRun.end)} ({gbp0(insight.peakRun.sales)}) — overlap shifts here.</Callout>}
        {insight.quiet.map((q, i) => <Callout key={i} color={AMBER}>✂️ Quiet {fmtT(q.start)}–{fmtT(q.end)} ({gbp0(q.sales)}) with {q.staffed} on — could shave {(q.end - q.start) / 60 * (q.staffed - 1)}h.</Callout>)}
        {insight.quiet.length === 0 && insight.staffHours > 0 && <Callout color={GREEN}>✓ No over-staffed quiet stretches last time.</Callout>}
      </div>

      {/* Products */}
      {groups.length > 0 && (
        <details open={open} onToggle={e => setOpen(e.target.open)} style={{ borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: 6 }}>
          <summary style={{ cursor: 'pointer', fontSize: 11.5, color: 'rgba(255,255,255,0.7)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>What sold</span>
            {groups.slice(0, 4).map(([g, v]) => <span key={g}>{g} <strong style={{ color: '#fff' }}>{gbp0(v)}</strong></span>)}
            <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)' }}>top items ▾</span>
          </summary>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '3px 10px', fontSize: 11, marginTop: 6, color: 'rgba(255,255,255,0.8)' }}>
            {(src.top || []).map(([item, q, s, g]) => <React.Fragment key={item}><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item} <span style={{ color: 'rgba(255,255,255,0.4)' }}>· {g}</span></span><span>×{q}</span><span style={{ fontWeight: 700, color: '#fff' }}>{gbp0(s)}</span></React.Fragment>)}
          </div>
        </details>
      )}
      {groups.length === 0 && <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: 6 }}>Payments only for this day — no product mix. Drop the latest Lightspeed transactions export to fill it in.</div>}
    </div>
  )
}

function Lane({ label, color, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color, width: 52, flexShrink: 0 }}>{label}</span>
      <div style={{ position: 'relative', flex: 1, minHeight: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>
    </div>
  )
}
function Bar({ left, width, color, text, title }) {
  return (
    <div style={{ position: 'relative', height: 14 }}>
      <div title={title} style={{ position: 'absolute', left, width, height: 14, background: color, borderRadius: 3, fontSize: 9, color: '#000', fontWeight: 700, padding: '0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '14px' }}>{text}</div>
    </div>
  )
}
const Empty = ({ children }) => <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', height: 14, lineHeight: '14px' }}>{children}</div>
const Callout = ({ color, children }) => <div style={{ fontSize: 11, color, lineHeight: 1.45 }}>{children}</div>

function Dial({ label, hint, value, min, max, step, onChange, fmt }) {
  return (
    <label title={hint} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: 110 }} />
      <strong style={{ color: '#fff', minWidth: 62 }}>{fmt(value)}</strong>
    </label>
  )
}

const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: RED, color: '#fff' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }
}
const nav = { width: 28, height: 26, borderRadius: 7, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
