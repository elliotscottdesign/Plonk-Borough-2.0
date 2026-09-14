import React, { useEffect, useState } from 'react'
import { getReport } from './foodOrders.js'
import DateField from '../lib/DateField.jsx'

// 📊 On A Roll service report — pick a period, see revenue, what sold, avg cook
// time, tips, and where checkouts were abandoned / cards failed (so we can see if
// the payment tech is improving). Lives in the Orders section.
const GOLD = '#C9A84C', GREEN = '#34D399', RED = '#e0231b', AMBER = '#E8B84B', BLUE = '#5B8DEF'
const LINE = 'rgba(201,168,76,0.22)', MUTED = 'rgba(255,255,255,0.55)', CARD = '#0e0e10'
const HEAVY = "Impact, 'Arial Narrow Bold', sans-serif"
const gbp = p => '£' + ((p || 0) / 100).toFixed(2)
const mmss = s => s == null ? '—' : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
const pad = n => String(n).padStart(2, '0')
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const shift = (base, n) => { const x = new Date(base); x.setDate(x.getDate() + n); return x }

function presetRange(key) {
  const now = new Date(); const t = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dow = (t.getDay() + 6) % 7   // 0 = Monday
  if (key === 'yesterday') { const y = shift(t, -1); return [ymd(y), ymd(y)] }
  if (key === 'week') return [ymd(shift(t, -dow)), ymd(t)]
  if (key === 'lastweek') { const mon = shift(t, -dow - 7); return [ymd(mon), ymd(shift(mon, 6))] }
  if (key === 'month') return [ymd(new Date(t.getFullYear(), t.getMonth(), 1)), ymd(t)]
  return [ymd(t), ymd(t)]   // today
}
const PRESETS = [['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'This week'], ['lastweek', 'Last week'], ['month', 'This month'], ['custom', '📅 Custom']]

const Stat = ({ label, value, sub, color = '#fff', big }) => (
  <div style={{ flex: '1 1 150px', background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '11px 14px' }}>
    <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontFamily: HEAVY, fontSize: big ? 34 : 26, color, lineHeight: 1.05 }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: MUTED }}>{sub}</div>}
  </div>
)

export default function ReportsPanel() {
  const [preset, setPreset] = useState('today')
  const [range, setRange] = useState(() => presetRange('today'))
  const [rep, setRep] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [from, to] = range

  const applyPreset = key => { setPreset(key); if (key !== 'custom') setRange(presetRange(key)) }
  const setFrom = v => { setPreset('custom'); setRange(([, t]) => [v || t, t]) }
  const setTo = v => { setPreset('custom'); setRange(([f]) => [f, v || f]) }

  useEffect(() => {
    if (!from || !to) return
    let live = true; setLoading(true); setErr('')
    getReport(from, to).then(r => { if (live) { setRep(r.report); setLoading(false) } }).catch(e => { if (live) { setErr(e.message); setLoading(false) } })
    return () => { live = false }
  }, [from, to])

  const thisYear = new Date().getFullYear()
  return (
    <div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
        {PRESETS.map(([k, l]) => (
          <button key={k} onClick={() => applyPreset(k)} style={{ fontSize: 13, fontWeight: 700, padding: '8px 13px', borderRadius: 9, cursor: 'pointer', background: preset === k ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${preset === k ? GOLD : LINE}`, color: preset === k ? GOLD : '#fff' }}>{l}</button>
        ))}
      </div>
      {preset === 'custom' && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12, background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px' }}>
          <span style={{ fontSize: 12.5, color: MUTED }}>From</span>
          <DateField value={from} onChange={setFrom} yearMin={thisYear - 3} yearMax={thisYear} style={{ background: '#000', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 8, padding: '8px 10px', fontSize: 14, width: 130 }} />
          <span style={{ fontSize: 12.5, color: MUTED }}>to</span>
          <DateField value={to} onChange={setTo} yearMin={thisYear - 3} yearMax={thisYear} style={{ background: '#000', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 8, padding: '8px 10px', fontSize: 14, width: 130 }} />
        </div>
      )}

      {err && <div style={{ fontSize: 13, color: RED, background: 'rgba(224,35,27,0.08)', border: `1px solid ${RED}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>Couldn't load the report — {err}</div>}
      {loading && !rep && <div style={{ color: MUTED, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Loading report…</div>}

      {rep && (
        <div style={{ opacity: loading ? 0.5 : 1 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <Stat label="💷 Revenue (card)" value={gbp(rep.revenue_pence)} sub={`${rep.orders} paid order${rep.orders !== 1 ? 's' : ''}`} color={GREEN} big />
            <Stat label="📊 Average order" value={gbp(rep.avg_order_pence)} />
            <Stat label="⏱ Avg cook time" value={mmss(rep.avg_cook_sec)} sub="order → ready" />
            <Stat label="💛 Tips (kitchen)" value={gbp(rep.tips_pence)} color={AMBER} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {rep.tab_orders > 0 && <Stat label="🎟 Tabs (party/staff)" value={`${rep.tab_orders}`} sub={`${gbp(rep.tab_total_pence)} on tab`} color={BLUE} />}
            <Stat label="🛒 Abandoned" value={`${rep.abandoned}`} sub="started, didn't pay" color={rep.abandoned ? AMBER : '#fff'} />
            <Stat label="❌ Card failed" value={`${rep.card_failed}`} sub="declined / errored" color={rep.card_failed ? RED : '#fff'} />
          </div>

          <div style={{ fontSize: 14, fontWeight: 800, color: GOLD, margin: '4px 0 8px' }}>🍔 What sold</div>
          {rep.items.length === 0 ? <div style={{ color: MUTED, fontSize: 13, padding: '8px 0' }}>No sales in this period.</div> : (
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              {rep.items.map((it, i) => (
                <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderTop: i ? `1px solid ${LINE}` : 'none' }}>
                  <span style={{ fontFamily: HEAVY, fontSize: 17, color: GOLD, minWidth: 34 }}>{it.qty}×</span>
                  <span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 600 }}>{it.name}</span>
                  <span style={{ fontSize: 13.5, color: MUTED }}>{gbp(it.pence)}</span>
                </div>
              ))}
            </div>
          )}

          {rep.days.length > 1 && (<>
            <div style={{ fontSize: 14, fontWeight: 800, color: GOLD, margin: '4px 0 8px' }}>📅 By day</div>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
              {rep.days.map((d, i) => (
                <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderTop: i ? `1px solid ${LINE}` : 'none' }}>
                  <span style={{ flex: 1, fontSize: 13.5, color: '#fff' }}>{new Date(d.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span style={{ fontSize: 12.5, color: MUTED }}>{d.orders} order{d.orders !== 1 ? 's' : ''}</span>
                  <span style={{ fontFamily: HEAVY, fontSize: 16, color: GREEN, minWidth: 66, textAlign: 'right' }}>{gbp(d.pence)}</span>
                </div>
              ))}
            </div>
          </>)}

          <div style={{ fontSize: 11, color: MUTED, marginTop: 16, lineHeight: 1.5 }}>Revenue = card sales (incl. tips). Tabs settle at the bar. A daily summary emails to elliot@nodice.bar after close, and a weekly summary every Sunday.</div>
        </div>
      )}
    </div>
  )
}
