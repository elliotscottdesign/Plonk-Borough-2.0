import React, { useEffect, useMemo, useState } from 'react'
import { report360, kitchenHours, tillFood } from './foodOrders.js'
import { shiftPay, payFor } from '../rota/pay.js'   // single source of truth for pay — never reimplement
import DateField from '../lib/DateField.jsx'

// 📈 Food 360 — the full picture of food at No Dice. Two tiers (founder rule 14 Sep):
//   • Operational tier (this whole panel): speed, peaks, item quantities.
//   • Money tier (revenue / COGS / margin / GP%): behind the 888999 founder code,
//     same speed-bump pattern as PasswordGate — a plain constant + a sessionStorage
//     flag that clears on tab close. Never render a money number outside that gate.
const MONEY_CODE = '888999'
const MONEY_KEY = 'oar_money_ok'
const GOLD = '#C9A84C', GREEN = '#34D399', RED = '#e0231b', AMBER = '#E8B84B', BLUE = '#5B8DEF'
const LINE = 'rgba(201,168,76,0.22)', MUTED = 'rgba(255,255,255,0.55)', CARD = '#0e0e10'
const HEAVY = "Impact, 'Arial Narrow Bold', sans-serif"
const gbp = p => '£' + ((p || 0) / 100).toFixed(2)
const mmss = s => s == null ? '—' : `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s`
const pad = n => String(n).padStart(2, '0')
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const shiftD = (base, n) => { const x = new Date(base); x.setDate(x.getDate() + n); return x }
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function presetRange(key) {
  const now = new Date(); const t = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dow = (t.getDay() + 6) % 7
  if (key === 'yesterday') { const y = shiftD(t, -1); return [ymd(y), ymd(y)] }
  if (key === 'week') return [ymd(shiftD(t, -dow)), ymd(t)]
  if (key === 'lastweek') { const mon = shiftD(t, -dow - 7); return [ymd(mon), ymd(shiftD(mon, 6))] }
  if (key === 'month') return [ymd(new Date(t.getFullYear(), t.getMonth(), 1)), ymd(t)]
  return [ymd(t), ymd(t)]
}
const PRESETS = [['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'This week'], ['lastweek', 'Last week'], ['month', 'This month'], ['custom', '📅 Custom']]

const Stat = ({ label, value, sub, color = '#fff', big }) => (
  <div style={{ flex: '1 1 150px', background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '11px 14px' }}>
    <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontFamily: HEAVY, fontSize: big ? 32 : 25, color, lineHeight: 1.05 }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: MUTED }}>{sub}</div>}
  </div>
)
const H = ({ children }) => <div style={{ fontSize: 15, fontWeight: 800, color: GOLD, margin: '18px 0 8px' }}>{children}</div>

// Demand heatmap: day-of-week × hour. Cell brightness = order volume; a blue
// outline = the kitchen was rostered then. So: bright + outline = busy & staffed;
// bright + NO outline = demand you're missing; dim + outline = staffed but dead.
function Heatmap({ heat, rostered }) {
  const hours = Array.from({ length: 24 }, (_, h) => h)
  const ros = rostered || Array.from({ length: 7 }, () => Array(24).fill(0))
  const active = hours.filter(h => heat.some(row => row[h] > 0) || ros.some(row => row[h] > 0))
  const lo = active.length ? Math.min(...active) : 11, hi = active.length ? Math.max(...active) : 22
  const cols = hours.filter(h => h >= lo && h <= hi)
  const max = Math.max(1, ...heat.flat())
  const cell = c => c === 0 ? 'rgba(255,255,255,0.03)' : `rgba(201,168,76,${0.2 + 0.8 * (c / max)})`
  return (
    <div style={{ overflowX: 'auto', background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '10px 12px' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 2, fontSize: 11 }}>
        <thead><tr><th></th>{cols.map(h => <th key={h} style={{ color: MUTED, fontWeight: 600, padding: '0 3px 4px', minWidth: 22 }}>{h}</th>)}</tr></thead>
        <tbody>{DOW.map((d, di) => (
          <tr key={d}>
            <td style={{ color: MUTED, paddingRight: 8, fontWeight: 700 }}>{d}</td>
            {cols.map(h => { const c = heat[di][h], r = ros[di][h] > 0; return <td key={h} title={`${d} ${h}:00 — ${c} orders${r ? ' · kitchen rostered' : ''}`} style={{ background: cell(c), width: 24, height: 24, textAlign: 'center', color: c ? '#1a1a1a' : 'transparent', fontWeight: 800, borderRadius: 4, boxShadow: r ? `inset 0 0 0 2px ${BLUE}` : 'none' }}>{c || ''}</td> })}
          </tr>
        ))}</tbody>
      </table>
      <div style={{ fontSize: 11, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>Orders by day &amp; hour (London). <b style={{ color: GOLD }}>Brighter = busier.</b> <span style={{ color: BLUE }}>Blue outline = kitchen rostered.</span> Bright with no outline = <b style={{ color: '#fff' }}>demand you're missing</b>; dim with an outline = <b style={{ color: '#fff' }}>staffed but dead</b>.</div>
    </div>
  )
}

// Kitchen labour for the period — run the RAW rota data through pay.js (the one
// true pay maths: clock-rounding, 5min/hr break on 6h+, sick = half).
function computeLabour(data) {
  if (!data) return null
  const claimsByShift = {}; for (const c of (data.claims || [])) (claimsByShift[c.shift_id] ||= []).push(c)
  const clockBy = {}; for (const c of (data.clocks || [])) clockBy[`${c.staff_id}|${c.date}`] = c
  const rateBy = {}; for (const s of (data.staff || [])) rateBy[s.id] = (s.hourly_rate == null || s.hourly_rate === '') ? null : Number(s.hourly_rate)
  let pence = 0, paidMin = 0, unrated = 0
  for (const sh of (data.shifts || [])) for (const c of (claimsByShift[sh.id] || [])) {
    const p = shiftPay(sh, clockBy[`${c.staff_id}|${sh.date}`] || null, sh.date, { sick: c.status === 'sick' })
    paidMin += p.paidMin
    const rate = rateBy[c.staff_id]
    if (rate != null) pence += Math.round(payFor(p.paidMin, rate) * 100)
    else if (p.paidMin > 0) unrated++
  }
  return { labour_pence: pence, paid_min: paidMin, unrated }
}

function MoneyGate({ onUnlock }) {
  const [v, setV] = useState(''); const [err, setErr] = useState(false)
  const submit = () => { if (v.trim() === MONEY_CODE) { try { sessionStorage.setItem(MONEY_KEY, '1') } catch { /* */ } onUnlock() } else setErr(true) }
  return (
    <div style={{ background: CARD, border: `1px dashed ${GOLD}`, borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>🔒 Money view</div>
      <div style={{ fontSize: 12.5, color: MUTED, margin: '4px auto 12px', maxWidth: 320, lineHeight: 1.5 }}>Revenue, food cost, margin &amp; GP% are founder-only. Enter the founder code to unlock (clears when you close the tab).</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <input value={v} type="password" autoFocus placeholder="Founder code" onChange={e => { setV(e.target.value); setErr(false) }} onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ background: '#000', border: `1px solid ${err ? RED : LINE}`, color: '#fff', borderRadius: 8, padding: '10px 12px', fontSize: 15, width: 160, textAlign: 'center' }} />
        <button onClick={submit} style={{ background: GOLD, color: '#1a1a1a', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Unlock</button>
      </div>
      {err && <div style={{ color: RED, fontSize: 12.5, marginTop: 8 }}>Wrong code.</div>}
    </div>
  )
}

export default function Food360Panel() {
  const [preset, setPreset] = useState('lastweek')
  const [range, setRange] = useState(() => presetRange('lastweek'))
  const [money, setMoney] = useState(() => { try { return sessionStorage.getItem(MONEY_KEY) === '1' } catch { return false } })
  const [rep, setRep] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [sortKey, setSortKey] = useState('revenue_pence')
  const [khours, setKhours] = useState(null)
  const [till, setTill] = useState(null)
  const [from, to] = range
  const thisYear = new Date().getFullYear()

  const applyPreset = key => { setPreset(key); if (key !== 'custom') setRange(presetRange(key)) }
  const setFrom = v => { setPreset('custom'); setRange(([, t]) => [v || t, t]) }
  const setTo = v => { setPreset('custom'); setRange(([f]) => [f, v || f]) }

  useEffect(() => {
    if (!from || !to) return
    let live = true; setLoading(true); setErr('')
    report360(from, to, money).then(r => { if (live) { setRep(r.report); setLoading(false) } }).catch(e => { if (live) { setErr(e.message); setLoading(false) } })
    return () => { live = false }
  }, [from, to, money])

  useEffect(() => {
    if (!money || !from || !to) { setKhours(null); setTill(null); return }
    let live = true
    kitchenHours(from, to).then(d => { if (live) setKhours(d) }).catch(() => { if (live) setKhours(null) })
    tillFood(from, to).then(d => { if (live) setTill(d) }).catch(() => { if (live) setTill(null) })
    return () => { live = false }
  }, [from, to, money])

  const labour = useMemo(() => computeLabour(khours), [khours])

  const items = useMemo(() => {
    const list = rep?.money?.items ? [...rep.money.items] : []
    return list.sort((a, b) => sortKey === 'gp_pct' ? b.gp_pct - a.gp_pct : sortKey === 'qty' ? b.qty - a.qty : b.revenue_pence - a.revenue_pence)
  }, [rep, sortKey])

  const sp = rep?.speed
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

      {err && <div style={{ fontSize: 13, color: RED, background: 'rgba(224,35,27,0.08)', border: `1px solid ${RED}`, borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>Couldn't load — {err}</div>}
      {loading && !rep && <div style={{ color: MUTED, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Loading Food 360…</div>}

      {rep && (
        <div style={{ opacity: loading ? 0.5 : 1 }}>
          {/* at-a-glance — operational only, no money */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <Stat label="🧾 Orders" value={rep.orders} sub={[rep.tab_orders ? `+${rep.tab_orders} tab` : '', rep.staff_meals ? `${rep.staff_meals} staff meal${rep.staff_meals !== 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ') || 'card'} big />
            <Stat label="⏱ Cook time (median)" value={mmss(sp?.cook_median_sec)} sub={`p90 ${mmss(sp?.cook_p90_sec)}`} color={sp?.cook_median_sec > 12 * 60 ? RED : sp?.cook_median_sec > 8 * 60 ? AMBER : GREEN} />
            <Stat label="🛒 Abandoned" value={rep.abandoned} sub="started, didn't pay" color={rep.abandoned ? AMBER : '#fff'} />
            <Stat label="❌ Card failed" value={rep.card_failed} color={rep.card_failed ? RED : '#fff'} />
          </div>

          <H>⏱ Speed</H>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <Stat label="Served" value={sp?.served ?? 0} />
            <Stat label="Median cook" value={mmss(sp?.cook_median_sec)} />
            <Stat label="Slowest 10% (p90)" value={mmss(sp?.cook_p90_sec)} sub="averages hide these" color={AMBER} />
            {sp?.split_n > 0
              ? <><Stat label="Queue (avg)" value={mmss(sp.queue_avg_sec)} sub="order → started" /><Stat label="Cook (avg)" value={mmss(sp.cook_avg_sec)} sub="started → ready" /></>
              : <Stat label="Queue vs cook" value="—" sub="builds from new orders" />}
          </div>
          {sp?.per_item?.length > 0 && (
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden', marginTop: 4 }}>
              {sp.per_item.slice(0, 12).map((it, i) => (
                <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 13px', borderTop: i ? `1px solid ${LINE}` : 'none' }}>
                  <span style={{ flex: 1, fontSize: 13.5, color: '#fff' }}>{it.name}</span>
                  <span style={{ fontSize: 11.5, color: MUTED }}>{it.n} served</span>
                  <span style={{ fontFamily: HEAVY, fontSize: 15, color: it.avg_sec > 12 * 60 ? RED : '#fff', minWidth: 66, textAlign: 'right' }}>{mmss(it.avg_sec)}</span>
                </div>
              ))}
            </div>
          )}

          <H>🔥 Peaks &amp; gaps</H>
          <Heatmap heat={rep.peaks.heat} rostered={rep.peaks.rostered} />

          <H>💷 Money {money ? '' : '🔒'}</H>
          {!money ? <MoneyGate onUnlock={() => setMoney(true)} /> : !rep.money ? (
            <div style={{ color: MUTED, fontSize: 13, padding: '10px 0' }}>Loading money…</div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <Stat label={`💷 Revenue ${rep.money.vat_registered ? '(ex-VAT)' : ''}`} value={gbp(rep.money.revenue_ex_vat_pence)} sub="food only, ex-tips" color={GREEN} big />
                <Stat label="🥩 Food cost (COGS)" value={gbp(rep.money.cogs_pence)} color={AMBER} />
                <Stat label="📈 Gross margin" value={gbp(rep.money.gross_margin_pence)} sub={`${rep.money.gross_margin_pct}%`} color={GREEN} />
              </div>
              {(() => {
                const noShifts = khours && (khours.shifts || []).length === 0
                return (<>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <Stat label="👨‍🍳 Kitchen labour" value={noShifts ? 'none' : labour ? gbp(labour.labour_pence) : '…'} sub={noShifts ? 'no rota kitchen shifts' : labour ? `${Math.round(labour.paid_min / 60 * 10) / 10}h paid (rota)` : 'from the rota'} color={AMBER} />
                    {rep.money.staff_meals_count > 0 && <Stat label="🍽 Staff meals (cost)" value={gbp(rep.money.staff_meals_cost_pence)} sub={`${rep.money.staff_meals_count} meal${rep.money.staff_meals_count !== 1 ? 's' : ''} · perk, not a sale`} color={AMBER} />}
                    <Stat label={noShifts ? '📈 Contribution (pre-wages)' : '✅ Kitchen contribution'} value={labour ? gbp(rep.money.gross_margin_pence - labour.labour_pence) : '…'} sub={noShifts ? 'wages not yet counted' : 'margin − kitchen wages'} color={labour && (rep.money.gross_margin_pence - labour.labour_pence) >= 0 ? GREEN : RED} big />
                  </div>
                  {noShifts && <div style={{ fontSize: 11.5, color: AMBER, marginBottom: 8 }}>ℹ No kitchen-team (“orange” Kitchen / Barback staff) worked in this period, so no kitchen wage is deducted. Add chefs to the rota as Kitchen / Barback with their rate and their wages count here automatically.</div>}
                  {!noShifts && labour?.unrated > 0 && <div style={{ fontSize: 11.5, color: AMBER, marginBottom: 8 }}>⚠ {labour.unrated} kitchen shift(s) worked by someone with no hourly rate set — labour is understated. Set their rate on the rota.</div>}
                </>)
              })()}
              {rep.money.estimated_lines > 0 && <div style={{ fontSize: 11.5, color: AMBER, marginBottom: 8 }}>⚠ {rep.money.estimated_lines} older line(s) use today's menu cost (estimated) — orders from 14 Sep carry an exact cost snapshot.</div>}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: MUTED }}>Sort:</span>
                {[['revenue_pence', 'Revenue'], ['qty', 'Qty'], ['gp_pct', 'GP%']].map(([k, l]) => (
                  <button key={k} onClick={() => setSortKey(k)} style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, cursor: 'pointer', background: sortKey === k ? 'rgba(201,168,76,0.16)' : 'transparent', border: `1px solid ${sortKey === k ? GOLD : LINE}`, color: sortKey === k ? GOLD : MUTED }}>{l}</button>
                ))}
              </div>
              <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 8, padding: '7px 13px', fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${LINE}` }}>
                  <span style={{ flex: 1 }}>Item</span><span style={{ width: 42, textAlign: 'right' }}>Qty</span><span style={{ width: 70, textAlign: 'right' }}>Revenue</span><span style={{ width: 62, textAlign: 'right' }}>Cost</span><span style={{ width: 48, textAlign: 'right' }}>GP%</span>
                </div>
                {items.map(it => (
                  <div key={it.name} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 13px', fontSize: 13.5, borderTop: `1px solid ${LINE}` }}>
                    <span style={{ flex: 1, color: '#fff' }}>{it.name}{it.estimated && <span title="estimated cost" style={{ color: AMBER, fontSize: 11 }}> ~</span>}</span>
                    <span style={{ width: 42, textAlign: 'right', color: MUTED }}>{it.qty}</span>
                    <span style={{ width: 70, textAlign: 'right', color: '#fff' }}>{gbp(it.revenue_pence)}</span>
                    <span style={{ width: 62, textAlign: 'right', color: MUTED }}>{gbp(it.cost_pence)}</span>
                    <span style={{ width: 48, textAlign: 'right', fontWeight: 800, color: it.gp_pct >= 65 ? GREEN : it.gp_pct >= 45 ? GOLD : RED }}>{it.gp_pct}%</span>
                  </div>
                ))}
              </div>
              {till && till.total_pence > 0 && (<>
                <div style={{ fontSize: 14, fontWeight: 800, color: GOLD, margin: '16px 0 8px' }}>🧾 Till food sales (Lightspeed)</div>
                <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '9px 13px', borderBottom: `1px solid ${LINE}` }}>
                    <span style={{ flex: 1, color: '#fff', fontWeight: 700, fontSize: 14 }}>Total till food (Food + Bar Food)</span>
                    <span style={{ fontFamily: HEAVY, fontSize: 19, color: BLUE }}>{gbp(till.total_pence)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '9px 13px', borderTop: `1px solid ${LINE}`, background: 'rgba(52,211,153,0.06)' }}>
                    <span style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: 14 }}>≡ Total food revenue <span style={{ color: MUTED, fontWeight: 400, fontSize: 11.5 }}>(On A Roll {gbp(rep.money.revenue_ex_vat_pence)} + till {gbp(till.total_pence)})</span></span>
                    <span style={{ fontFamily: HEAVY, fontSize: 21, color: GREEN }}>{gbp(rep.money.revenue_ex_vat_pence + till.total_pence)}</span>
                  </div>
                  <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {till.days.filter(d => d.total_pence > 0).map(d => (
                      <div key={d.date} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 13px', borderTop: `1px solid ${LINE}`, fontSize: 13 }}>
                        <span style={{ flex: 1, color: '#fff' }}>{new Date(d.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span style={{ color: MUTED, fontSize: 11.5 }}>Food {gbp(d.food_pence)} · Bar {gbp(d.bar_food_pence)}</span>
                        <span style={{ fontFamily: HEAVY, fontSize: 15, color: BLUE, minWidth: 60, textAlign: 'right' }}>{gbp(d.total_pence)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>Food rung through the <b style={{ color: '#fff' }}>Lightspeed till</b> (Food + Bar Food groups) — e.g. days On A Roll was down and food went through the bar. Shown <b style={{ color: '#fff' }}>separately</b> from On A Roll's own sales; no cook-time or item-cost detail for these.</div>
              </>)}
              <div style={{ fontSize: 11, color: MUTED, marginTop: 10, lineHeight: 1.5 }}>Contribution = gross margin − kitchen wages — the <b style={{ color: '#fff' }}>kitchen team's</b> paid hours from the rota, via the real payroll rules. Kitchen wages are counted as a <b style={{ color: '#fff' }}>separate cost</b>: bar and kitchen occasionally cover for each other, but the kitchen crew's wage is treated as the kitchen's own. Staff meals (STAFF66) are valued at cost as a perk, never as a sale. ~ = cost estimated from today's menu.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
