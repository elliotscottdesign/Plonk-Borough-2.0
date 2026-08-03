import React, { useEffect, useState } from 'react'
import { toiletLog } from '../../toilets/api.js'

// Founder view (/ops → "Toilet Checks"): compliance log of the 2-hourly hygiene
// checks — which windows were ticked off, by whom, and how many staff phones have
// reminders switched on.
const GOLD = 'var(--gold)', CREAM = 'var(--cream)', GREEN = '#34D399', DIM = 'var(--cream-dim)'
const hhmm = (iso) => {
  try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }) }
  catch { return '' }
}
const win = (i) => `${String((i * 2) % 24).padStart(2, '0')}:00–${String((i * 2 + 2) % 24).padStart(2, '0')}:00`
const prettyDay = (d) => {
  try { return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) }
  catch { return d }
}

export default function ToiletLog() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [days, setDays] = useState(14)

  useEffect(() => {
    let live = true
    setData(null); setErr('')
    toiletLog(days).then(d => { if (live) setData(d) }).catch(e => { if (live) setErr(e.message || 'Could not load') })
    return () => { live = false }
  }, [days])

  const byDay = {}
  for (const c of data?.checks || []) (byDay[c.shift_day] ||= []).push(c)
  const dayKeys = Object.keys(byDay).sort().reverse()

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="serif" style={{ color: GOLD, fontSize: 22, margin: 0 }}>Toilet checks</h2>
        <select value={days} onChange={e => setDays(Number(e.target.value))} style={{
          background: 'rgba(255,255,255,0.06)', color: CREAM, border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, padding: '7px 10px', fontSize: 13 }}>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>
      <p style={{ color: DIM, fontSize: 13, lineHeight: 1.6, margin: '8px 0 4px' }}>
        Staff on shift get a phone reminder every 2 hours; the first to tap “Done” clears it for the rest.
        The share link for staff is <strong style={{ color: CREAM }}>team.nodice.bar/toilets</strong>.
      </p>
      {data && (
        <p style={{ color: DIM, fontSize: 12.5, margin: '0 0 16px' }}>
          📲 Reminders switched on by <strong style={{ color: GREEN }}>{data.enabledPhonesStaff}</strong> staff
          ({data.totalSubs} phone{data.totalSubs === 1 ? '' : 's'}).
        </p>
      )}

      {err && <p style={{ color: '#F87171' }}>{err}</p>}
      {!data && !err && <p style={{ color: DIM }}>Loading…</p>}
      {data && !dayKeys.length && <p style={{ color: DIM }}>No checks logged yet.</p>}

      {dayKeys.map(day => (
        <div key={day} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>{prettyDay(day)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {byDay[day].map(c => {
              const done = c.status === 'done'
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  <span style={{ fontSize: 16 }}>{done ? '✅' : '•'}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: CREAM, minWidth: 118, fontSize: 14 }}>{win(c.window_index)}</span>
                  {done ? (
                    <span style={{ color: DIM, fontSize: 13.5 }}>
                      <strong style={{ color: CREAM }}>{c.done_by_name || 'Someone'}</strong> · {hhmm(c.done_at)}
                    </span>
                  ) : (
                    <span style={{ color: DIM, fontSize: 13.5 }}>reminded {c.ping_count || 0}×, not ticked off</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
