import React, { useMemo, useState } from 'react'
import { toMin, fmtTime, dayLabel, shiftLabel, maxConcurrency, countAt, capFor, MAX_CONCURRENT } from '../../help/data.js'

// ─── Admin shift calendar — month + week views of claimed shifts ───────────
// Shows every helper's claimed shift (from /helpout sign-ups), with the cap
// (2 by default, bumpable to 3 on busy days) visualised: any slot over the
// day's cap is flagged red. Elliot can set the global default or a per-day cap.

const GOLD = 'var(--gold)', RED = '#DA1B33', GREEN = '#34D399', AMBER = '#FCD34D'
const LINE = 'rgba(201,168,76,0.15)'
const WIN_START = 9 * 60, WIN_END = 24 * 60, WIN = WIN_END - WIN_START
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const startOfWeek = (d) => addDays(d, -((d.getDay() + 6) % 7))
const statusColor = (s) => (s === 'confirmed' ? GREEN : AMBER)

function withLanes(items) {
  const sorted = [...items].sort((a, b) => toMin(a.start) - toMin(b.start))
  const laneEnds = []
  return {
    placed: sorted.map(it => {
      let lane = laneEnds.findIndex(end => toMin(it.start) >= end)
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(0) }
      laneEnds[lane] = toMin(it.end)
      return { ...it, lane }
    }),
    lanes: Math.max(1, laneEnds.length),
  }
}

// 2 / 3 cap buttons. date=null sets the global default.
function CapButtons({ date, cap, defaultCap, onSet }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 10, color: 'var(--cream-dim)' }}>max</span>
      {[2, 3].map(n => {
        const on = cap === n
        return (
          <button key={n} onClick={(e) => { e.stopPropagation(); onSet(date, n) }} title={date ? `Allow ${n} at once on this day` : `Default ${n} at once`} style={{
            fontSize: 11, width: 22, height: 20, borderRadius: 5, cursor: 'pointer', padding: 0,
            background: on ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${on ? GOLD : 'rgba(255,255,255,0.14)'}`, color: on ? GOLD : 'var(--cream-dim)', fontWeight: on ? 700 : 400,
          }}>{n}</button>
        )
      })}
      {date && cap !== defaultCap && <span title="custom for this day" style={{ fontSize: 9, color: GOLD }}>★</span>}
    </span>
  )
}

function DayTimeline({ items, cap }) {
  if (!items.length) return <div style={{ fontSize: 11.5, color: 'var(--cream-dim)', padding: '8px 0' }}>No shifts.</div>
  const { placed, lanes } = withLanes(items)
  const barH = 20, gap = 3
  const ticks = [9 * 60, 12 * 60, 15 * 60, 18 * 60, 21 * 60, 24 * 60]
  const slots = []
  for (let t = WIN_START; t < WIN_END; t += 30) slots.push(t)
  return (
    <div>
      <div style={{ position: 'relative', height: lanes * (barH + gap), marginBottom: 4 }}>
        {placed.map((it, i) => {
          const left = ((toMin(it.start) - WIN_START) / WIN) * 100
          const width = ((toMin(it.end) - toMin(it.start)) / WIN) * 100
          const col = statusColor(it.status)
          return (
            <div key={i} title={`${it.name} · ${shiftLabel(it)} · ${it.status}`} style={{
              position: 'absolute', top: it.lane * (barH + gap), left: `${left}%`, width: `${width}%`, height: barH,
              background: `${col}22`, border: `1px solid ${col}`, borderRadius: 5, padding: '0 6px',
              display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap',
              fontSize: 11, color: 'var(--cream)', boxSizing: 'border-box',
            }}>{it.name} · {fmtTime(toMin(it.start))}</div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 1, height: 5 }}>
        {slots.map(t => {
          const c = countAt(items, t)
          const bg = c > cap ? RED : c === cap ? AMBER : c >= 1 ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.06)'
          return <div key={t} style={{ flex: 1, background: bg }} />
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--cream-dim)', marginTop: 2 }}>
        {ticks.map(t => <span key={t}>{fmtTime(t)}</span>)}
      </div>
    </div>
  )
}

export default function HelpCalendar({ helpers, settings, onSetCap }) {
  const dcap = settings?.defaultCap ?? MAX_CONCURRENT
  const dayCaps = settings?.dayCaps || {}
  const capOf = (ds) => capFor(ds, dcap, dayCaps)
  const setCap = (date, n) => onSetCap && onSetCap(date, n)

  const items = useMemo(() => (helpers || []).flatMap(h =>
    (h.shifts || []).map(s => ({ date: s.date, start: s.start, end: s.end, name: h.name, status: h.status, hid: h.id }))
  ), [helpers])
  const byDate = useMemo(() => {
    const m = {}
    for (const it of items) (m[it.date] ||= []).push(it)
    return m
  }, [items])

  const firstDate = items.map(i => i.date).sort()[0]
  const [view, setView] = useState('week')
  const [cursor, setCursor] = useState(() => (firstDate ? new Date(firstDate + 'T00:00:00') : new Date()))
  const [selected, setSelected] = useState(firstDate || iso(new Date()))
  const today = iso(new Date())

  const nav = (dir) => setCursor(c => addDays(c, dir * (view === 'week' ? 7 : 30)))
  const overCap = (ds) => maxConcurrency(byDate[ds] || []) > capOf(ds)

  const weekStart = startOfWeek(cursor)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const mFirst = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const mStart = (mFirst.getDay() + 6) % 7
  const mDays = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const cells = [...Array(mStart).fill(null), ...Array.from({ length: mDays }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)

  const tBtn = (active) => ({ fontSize: 12, padding: '6px 14px', borderRadius: 7, cursor: 'pointer', background: active ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.12)'}`, color: active ? GOLD : 'var(--cream)', fontWeight: active ? 700 : 400 })
  const navBtn = { background: 'transparent', border: 'none', color: GOLD, fontSize: 16, cursor: 'pointer', padding: '4px 12px' }
  const card = { background: 'var(--ink-2)', border: `1px solid ${LINE}`, borderRadius: 10 }

  const headerLabel = view === 'week'
    ? `${dayLabel(iso(weekStart))} – ${dayLabel(iso(addDays(weekStart, 6)))}`
    : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`

  return (
    <div style={{ ...card, padding: 16 }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setView('week')} style={tBtn(view === 'week')}>Week</button>
          <button onClick={() => setView('month')} style={tBtn(view === 'month')}>Month</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => nav(-1)} style={navBtn}>◀</button>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--cream)', minWidth: 150, textAlign: 'center' }}>{headerLabel}</div>
          <button onClick={() => nav(1)} style={navBtn}>▶</button>
          <button onClick={() => setCursor(new Date())} style={{ ...tBtn(false), padding: '6px 10px' }}>Today</button>
        </div>
      </div>

      {/* Global default cap */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 12, color: 'var(--cream-dim)' }}>
        <span>Default helpers at once:</span>
        <CapButtons date={null} cap={dcap} defaultCap={dcap} onSet={setCap} />
        <span style={{ fontSize: 11 }}>· bump a busy day below to allow 3.</span>
      </div>

      {/* WEEK VIEW */}
      {view === 'week' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {weekDays.map(d => {
            const ds = iso(d)
            const dayItems = byDate[ds] || []
            const isToday = ds === today
            const over = overCap(ds)
            return (
              <div key={ds} style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 12, alignItems: 'start', padding: '8px 0', borderTop: `1px solid ${LINE}` }}>
                <div style={{ paddingTop: 2 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{DOW[(d.getDay() + 6) % 7]}</div>
                  <div className="serif" style={{ fontSize: 20, color: isToday ? GOLD : 'var(--cream)' }}>{d.getDate()}</div>
                  {dayItems.length > 0 && <div style={{ fontSize: 10, color: over ? RED : 'var(--cream-dim)', marginBottom: 4 }}>{dayItems.length} shift{dayItems.length > 1 ? 's' : ''}{over ? ' ⚠' : ''}</div>}
                  <CapButtons date={ds} cap={capOf(ds)} defaultCap={dcap} onSet={setCap} />
                </div>
                <div style={{ minWidth: 0 }}><DayTimeline items={dayItems} cap={capOf(ds)} /></div>
              </div>
            )
          })}
        </div>
      )}

      {/* MONTH VIEW */}
      {view === 'month' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5, marginBottom: 5 }}>
            {DOW.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--cream-dim)', fontWeight: 600 }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const ds = iso(new Date(cursor.getFullYear(), cursor.getMonth(), day))
              const dayItems = byDate[ds] || []
              const over = overCap(ds)
              const sel = selected === ds
              const isToday = ds === today
              const custom = capOf(ds) !== dcap
              return (
                <button key={i} onClick={() => setSelected(ds)} style={{
                  minHeight: 64, textAlign: 'left', padding: 6, borderRadius: 8, cursor: 'pointer',
                  background: sel ? 'rgba(201,168,76,0.14)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${over ? RED : sel ? GOLD : 'rgba(255,255,255,0.08)'}`, color: 'var(--cream)',
                  display: 'flex', flexDirection: 'column', gap: 3,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isToday ? GOLD : 'var(--cream)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{day}{over ? ' ⚠' : ''}</span>{custom && <span style={{ fontSize: 9, color: GOLD }}>max {capOf(ds)}</span>}
                  </div>
                  {dayItems.slice(0, 2).map((it, j) => (
                    <div key={j} style={{ fontSize: 9.5, lineHeight: 1.25, padding: '1px 4px', borderRadius: 3, background: `${statusColor(it.status)}22`, border: `1px solid ${statusColor(it.status)}66`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {fmtTime(toMin(it.start))} {it.name.split(' ')[0]}
                    </div>
                  ))}
                  {dayItems.length > 2 && <div style={{ fontSize: 9, color: 'var(--cream-dim)' }}>+{dayItems.length - 2} more</div>}
                </button>
              )
            })}
          </div>

          {/* Selected day detail */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${LINE}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{dayLabel(selected)}{overCap(selected) ? <span style={{ color: RED }}> · ⚠ over {capOf(selected)} at once</span> : ''}</div>
              <CapButtons date={selected} cap={capOf(selected)} defaultCap={dcap} onSet={setCap} />
            </div>
            <DayTimeline items={byDate[selected] || []} cap={capOf(selected)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {(byDate[selected] || []).sort((a, b) => toMin(a.start) - toMin(b.start)).map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--cream)' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: statusColor(it.status), marginRight: 7 }} />{it.name}</span>
                  <span style={{ color: 'var(--cream-dim)' }}>{shiftLabel(it)} · {it.status}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14, fontSize: 10.5, color: 'var(--cream-dim)' }}>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: AMBER, marginRight: 5 }} />pending</span>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: GREEN, marginRight: 5 }} />confirmed</span>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: RED, marginRight: 5 }} />over the day's cap</span>
      </div>
    </div>
  )
}
