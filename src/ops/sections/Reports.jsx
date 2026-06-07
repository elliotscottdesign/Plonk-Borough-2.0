import React, { useState } from 'react'
import Roadmap from '../components/Roadmap.jsx'
import {
  ACTUAL_2025, BAR_REVENUE, GOLF_TICKETS, RECOST_Y1, RECOST_STEADY, BRIDGE,
  Y1_RENT_FREE_BONUS, DECK_FORECAST, MONTHLY_2025,
} from '../data/reportPL.js'

const money = (n) => (n < 0 ? '−£' : '£') + Math.abs(Math.round(n)).toLocaleString('en-GB')
const pct = (n) => (n * 100).toFixed(1) + '%'

function Tile({ label, value, sub, accent }) {
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)' }}>{label}</div>
      <div className="serif" style={{ fontSize: 27, color: accent || 'var(--gold)', lineHeight: 1.15, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function Reports() {
  const [scenario, setScenario] = useState('y1')
  const recost = scenario === 'y1' ? RECOST_Y1 : RECOST_STEADY
  const maxRev = Math.max(...MONTHLY_2025.map(m => m.amount))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--cream)' }}>Performance Report</div>
          <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)', background: '#34D399', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>Live · bar-only</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginTop: 6, maxWidth: 780, lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--cream)' }}>Bar-only 2025 sales on the 2026 cost base.</strong> Golf now sits with
          Plonk Golf, so its tickets ({money(GOLF_TICKETS)}) come out of No Dice's sales and its running-costs come out too.
          What's left — the <strong style={{ color: 'var(--cream)' }}>{money(BAR_REVENUE)}</strong> bar — is re-costed on the new
          lease and predicted 2026 costs. Sales held at 2025 level so you see the structural change cleanly.
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
        <Tile label="Bar-only revenue" value={money(BAR_REVENUE)} sub={`was ${money(ACTUAL_2025.revenue)} with golf`} accent="var(--cream)" />
        <Tile label={scenario === 'y1' ? 'Profit · Year 1' : 'Profit · steady state'} value={money(recost.profit)} sub={`${pct(recost.margin)} margin`} accent={recost.profit >= 0 ? '#34D399' : '#F87171'} />
        <Tile label="Before director draw" value={money(recost.profitBeforeDirector)} sub={`${pct(recost.profitBeforeDirector / recost.revenue)} margin`} accent="var(--gold)" />
        <Tile label="2025 as reported" value={money(ACTUAL_2025.profit)} sub="incl. golf — for context" accent="var(--cream-dim)" />
      </div>

      {/* The bridge — the centrepiece */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 18 }}>
        <div className="serif" style={{ fontSize: 17, color: 'var(--gold)', marginBottom: 4 }}>How the profit changes</div>
        <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 14 }}>From the audited 2025 profit to the bar-only, 2026-cost steady state. Every step shown.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--cream)', paddingBottom: 9, borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>
            <span>2025 actual profit (golf included)</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(ACTUAL_2025.profit)}</span>
          </div>
          {BRIDGE.map((b, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13 }}>
              <span style={{ color: 'var(--cream-dim)' }}>
                {b.delta >= 0 ? '▲ ' : '▼ '}{b.label}
                {b.note && <span style={{ fontSize: 11, color: 'var(--ink-3, #6B7280)', marginLeft: 6 }}>· {b.note}</span>}
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: b.delta >= 0 ? '#34D399' : '#F87171', minWidth: 90, textAlign: 'right' }}>{(b.delta >= 0 ? '+' : '') + money(b.delta)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: RECOST_STEADY.profit >= 0 ? 'var(--gold)' : '#F87171', fontWeight: 700, paddingTop: 9, borderTop: '1px solid rgba(201,168,76,0.25)' }}>
            <span>Bar-only steady-state profit</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(RECOST_STEADY.profit)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#34D399' }}>
            <span>▲ Year-1 rent-free bonus (3 months)</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>+{money(Y1_RENT_FREE_BONUS)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: RECOST_Y1.profit >= 0 ? '#34D399' : '#F87171', fontWeight: 700 }}>
            <span>Bar-only Year-1 profit</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(RECOST_Y1.profit)}</span>
          </div>
        </div>
      </div>

      {/* Takeaways */}
      <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FCD34D', marginBottom: 10 }}>What this tells you</div>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--cream)', lineHeight: 1.55 }}>
          <li><strong>Golf was carrying the headline.</strong> Strip it out and the bar's 2025 sales ({money(BAR_REVENUE)}) only just cover the cost base — even with the rent cut. Golf contributed roughly {money(GOLF_TICKETS - 31423)} net to the old P&L.</li>
          <li><strong>The rent-free start is what keeps Year 1 above water.</strong> It adds {money(Y1_RENT_FREE_BONUS)}, lifting bar-only Year-1 to <strong style={{ color: '#34D399' }}>{money(RECOST_Y1.profit)}</strong> ({pct(RECOST_Y1.margin)}). At steady state, on flat sales, it's a small loss of {money(RECOST_STEADY.profit)} — so the rent saving alone doesn't cover losing golf.</li>
          <li><strong>Before any director draw,</strong> the bar clears {money(RECOST_STEADY.profitBeforeDirector)}–{money(RECOST_Y1.profitBeforeDirector)} — so the director salary is the swing between profit and loss. It's a choice, not a fixed cost.</li>
          <li><strong>Sales growth is the lever.</strong> The investor deck's 2026 forecast is now bar-only (revenue rebased to ~£602k, golf moved to Plonk Golf with its costs; profit/returns held). This internal view strips 2025 too for a clean like-for-like — the reopening plan (weekends, events, the new community push) is what carries it.</li>
        </ul>
      </div>

      {/* Monthly 2025 revenue shape */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 18 }}>
        <div className="serif" style={{ fontSize: 16, color: 'var(--gold)', marginBottom: 2 }}>2025 sales — month by month</div>
        <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 14 }}>As reported (golf included). Summer (Jun/Aug) carried the year — useful for pacing the reopening.</div>
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
        Basis · Built as a transparent bridge off the audited 2025 profit (£{Math.round(ACTUAL_2025.profit / 1000)}k). Golf removed
        per founder direction: {money(GOLF_TICKETS)} tickets + ~£31k running-costs. 2026 costs = new lease £65,000 net/yr
        (Year 1 £48,750 with 3-month rent-free), variable & other-fixed +10%, wages held, VAT held at the bar-sales level,
        new director salary. Source figures don't fully reconcile at line level — this is a planning view; re-cut from the
        weekly P&L for an audited bar-only number. The investor deck's forecast still shows the golf-inclusive base and should be rebased.
      </div>

      {/* Roadmap */}
      <div style={{ borderTop: '1px solid rgba(201,168,76,0.15)', paddingTop: 22, marginTop: 4 }}>
        <Roadmap
          title="More reports — coming next"
          intro="This first report is the bar-only P&L view. The full weekly read-out adds the operational and external signals on top."
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
