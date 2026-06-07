import React, { useState } from 'react'
import Roadmap from '../components/Roadmap.jsx'
import {
  ACTUAL_2025, RECOST_Y1, RECOST_STEADY, BRIDGE, Y1_RENT_FREE_BONUS,
  DECK_FORECAST, MONTHLY_2025, PL_LINES, PL_LABELS,
} from '../data/reportPL.js'

const money = (n) => (n < 0 ? '−£' : '£') + Math.abs(Math.round(n)).toLocaleString('en-GB')
const pct = (n) => (n * 100).toFixed(1) + '%'

function Tile({ label, value, sub, accent }) {
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)' }}>{label}</div>
      <div className="serif" style={{ fontSize: 28, color: accent || 'var(--gold)', lineHeight: 1.15, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function Reports() {
  const [scenario, setScenario] = useState('y1')
  const recost = scenario === 'y1' ? RECOST_Y1 : RECOST_STEADY
  const delta = recost.profit - ACTUAL_2025.profit
  const maxRev = Math.max(...MONTHLY_2025.map(m => m.amount))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--cream)' }}>Performance Report</div>
          <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)', background: 'var(--teal, #34D399)', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>Live</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginTop: 6, maxWidth: 760, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--cream)' }}>2025 sales on the 2026 cost base.</strong> What last year's trade
          (£{Math.round(ACTUAL_2025.revenue).toLocaleString('en-GB')} of sales) would earn under the new lease and predicted
          costs — so you can plan the reopening on realistic numbers. Sales held at 2025 actual; costs swapped to the 2026 model.
        </div>
      </div>

      {/* Scenario toggle */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--cream-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Rent scenario:</span>
        {[['y1', 'Year 1 (rent-free start)'], ['steady', 'Steady state (£65k lease)']].map(([k, l]) => {
          const on = scenario === k
          return (
            <button key={k} onClick={() => setScenario(k)} style={{
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
              background: on ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${on ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
              color: on ? 'var(--gold)' : 'var(--cream)', fontWeight: on ? 600 : 400,
            }}>{l}</button>
          )
        })}
      </div>

      {/* Headline tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: 12 }}>
        <Tile label="2025 actual profit" value={money(ACTUAL_2025.profit)} sub={`${pct(ACTUAL_2025.margin)} margin`} accent="var(--cream)" />
        <Tile label="Recosted profit" value={money(recost.profit)} sub={`${pct(recost.margin)} margin · ${scenario === 'y1' ? 'Year 1' : 'steady state'}`} accent={delta >= 0 ? '#34D399' : '#F87171'} />
        <Tile label="vs 2025" value={(delta >= 0 ? '+' : '') + money(delta)} sub={delta >= 0 ? 'better on the new base' : 'inflation + director outweigh rent'} accent={delta >= 0 ? '#34D399' : '#F87171'} />
        <Tile label="Before director draw" value={money(recost.profitBeforeDirector)} sub={`${pct(recost.profitBeforeDirector / recost.revenue)} margin`} accent="var(--gold)" />
      </div>

      {/* P&L comparison */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 18 }}>
        <div className="serif" style={{ fontSize: 17, color: 'var(--gold)', marginBottom: 12 }}>The numbers</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ textAlign: 'left', padding: '6px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cream-dim)' }}>Line</th>
            <th style={{ textAlign: 'right', padding: '6px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cream-dim)' }}>2025 actual</th>
            <th style={{ textAlign: 'right', padding: '6px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)' }}>2025 sales · 2026 costs</th>
            <th style={{ textAlign: 'right', padding: '6px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cream-dim)' }}>change</th>
          </tr></thead>
          <tbody>
            {PL_LINES.map(key => {
              const a = ACTUAL_2025[key], b = recost[key]
              const isProfit = key === 'profit'
              const isRevenue = key === 'revenue'
              const chg = b - a
              return (
                <tr key={key} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: isProfit ? 'rgba(201,168,76,0.06)' : 'transparent' }}>
                  <td style={{ padding: '9px 6px', fontSize: 13, color: isProfit ? 'var(--gold)' : 'var(--cream)', fontWeight: isProfit ? 700 : 400 }}>{PL_LABELS[key]}</td>
                  <td style={{ padding: '9px 6px', fontSize: 13, textAlign: 'right', color: 'var(--cream)', fontVariantNumeric: 'tabular-nums', fontWeight: isProfit ? 700 : 400 }}>{money(a)}</td>
                  <td style={{ padding: '9px 6px', fontSize: 13, textAlign: 'right', color: isProfit ? 'var(--gold)' : 'var(--cream)', fontVariantNumeric: 'tabular-nums', fontWeight: isProfit ? 700 : 400 }}>{money(b)}</td>
                  <td style={{ padding: '9px 6px', fontSize: 12, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: chg === 0 ? 'var(--cream-dim)' : (isRevenue ? 'var(--cream-dim)' : (chg < 0 ? '#34D399' : '#F87171')) }}>
                    {chg === 0 ? '—' : (chg > 0 ? '+' : '') + money(chg)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ fontSize: 10, color: 'var(--cream-dim)', marginTop: 10, lineHeight: 1.5 }}>
          Green = good for profit (a cost falling or revenue holding). On cost lines, a rising cost shows red.
          VAT and wages unchanged (sales flat / 2026 wage model = 2025).
        </div>
      </div>

      {/* Cost bridge */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 18 }}>
        <div className="serif" style={{ fontSize: 17, color: 'var(--gold)', marginBottom: 4 }}>What moved profit — 2025 → steady state</div>
        <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 14 }}>Holding sales flat, here's how the new cost base changes the bottom line.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--cream)', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span>2025 actual profit</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(ACTUAL_2025.profit)}</span>
          </div>
          {BRIDGE.map((b, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--cream-dim)' }}>
              <span>{b.delta >= 0 ? '▲ ' : '▼ '}{b.label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: b.delta >= 0 ? '#34D399' : '#F87171' }}>{(b.delta >= 0 ? '+' : '') + money(b.delta)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--gold)', fontWeight: 700, paddingTop: 8, borderTop: '1px solid rgba(201,168,76,0.25)' }}>
            <span>Steady-state profit</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(RECOST_STEADY.profit)}</span>
          </div>
        </div>
      </div>

      {/* Takeaways */}
      <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#34D399', marginBottom: 10 }}>What this tells you</div>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--cream)', lineHeight: 1.55 }}>
          <li><strong>Year 1 is the prize.</strong> The 3-month rent-free start adds ~{money(Y1_RENT_FREE_BONUS)} straight to the bottom line — on 2025's exact sales, profit jumps from {money(ACTUAL_2025.profit)} to <strong style={{ color: '#34D399' }}>{money(RECOST_Y1.profit)}</strong> ({pct(RECOST_Y1.margin)}). Make the most of the rent-free window while you rebuild trade.</li>
          <li><strong>At steady state, the lease saving is mostly eaten.</strong> The ~{money(94146 - 65000)} rent cut is offset by +10% cost inflation (~{money(RECOST_STEADY.variable - ACTUAL_2025.variable)}) and the new {money(RECOST_STEADY.director)} director salary — so flat sales land at {money(RECOST_STEADY.profit)} ({pct(RECOST_STEADY.margin)}), just below 2025.</li>
          <li><strong>The growth lever is sales, not costs.</strong> The cost base alone won't transform the business — the deck's £{Math.round(DECK_FORECAST.profit / 1000)}k forecast needs the +15% revenue too. The reopening playbook (events, weekends, golf footfall) is what gets you there.</li>
          <li><strong>Before any director draw,</strong> the venue clears {money(RECOST_STEADY.profitBeforeDirector)}–{money(RECOST_Y1.profitBeforeDirector)} on 2025 sales — healthy operating profit; the director line is a choice, not a fixed obligation.</li>
        </ul>
      </div>

      {/* Monthly 2025 revenue shape */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 18 }}>
        <div className="serif" style={{ fontSize: 16, color: 'var(--gold)', marginBottom: 2 }}>2025 sales — month by month</div>
        <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 14 }}>Where the £{Math.round(ACTUAL_2025.revenue / 1000)}k came from. Summer (Jun/Aug) carried the year.</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
          {MONTHLY_2025.map(m => (
            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 9, color: 'var(--cream-dim)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(m.amount / 1000)}k</div>
              <div style={{ width: '70%', height: `${(m.amount / maxRev) * 90}px`, background: 'var(--gold)', borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
              <div style={{ fontSize: 9, color: 'var(--cream-dim)' }}>{m.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Basis note */}
      <div style={{ fontSize: 10, color: 'var(--gold-dim)', lineHeight: 1.6 }}>
        Basis · 2025 figures = canonical Monthly Summary (ties to the £{Math.round(ACTUAL_2025.profit / 1000)}k actual profit).
        2026 costs = new lease £65,000 net/yr (Year 1 £48,750 with 3-month rent-free), other fixed & variable +10% inflation,
        wages unchanged, VAT held at the 2025 sales level, new director salary {money(RECOST_STEADY.director)}.
        Till figures are operational; this report uses the audited P&L line. Re-baseline once post-reopening months land.
      </div>

      {/* Roadmap — the rest of Reports */}
      <div style={{ borderTop: '1px solid rgba(201,168,76,0.15)', paddingTop: 22, marginTop: 4 }}>
        <Roadmap
          title="More reports — coming next"
          intro="This first report is the P&L view. The full weekly read-out adds the operational and external signals on top."
          sections={[
            { h: 'Weekly read-out will add', items: [
              'Till sales by category & day, vs the same week 2025',
              'Events performance — what each night took',
              'Weather overlay vs footfall',
              'Staff & rota — hours vs sales, labour cost %',
              'Google + Instagram — reach, bookings, engagement',
            ]},
          ]}
          need={[
            'Google Business / Analytics connection',
            'Instagram insights access',
            'Events calendar + per-event takings',
            'Live rota / staff-hours source',
          ]}
          liveNote="Till-sales data is already in the platform, so the weekly sales read-out can go live next — just say go."
        />
      </div>
    </div>
  )
}
