import React from 'react'
import {
  HACKNEY_DOWNSIDE,
  HACKNEY_DEAL,
  HACKNEY_ACTUALS_2025,
} from '../../data/hackney.js'

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const fmtSigned = (n) => (n >= 0 ? '+' : '−') + '£' + Math.round(Math.abs(n)).toLocaleString('en-GB')

const RISKS = [
  { risk: 'Seasonality (Jan–Feb thin)',          mitigation: 'Cash buffer built from Dec surplus and 4-month rent-free start.' },
  { risk: 'Wage inflation (NMW £12.21 → £13+)',  mitigation: 'Fully-loaded 2025 wages already in the base — no inflation assumption added on top.' },
  { risk: 'Cost overruns',                        mitigation: '30% hard variable-cost cap holds in all three scenarios.' },
  { risk: 'Cash dip risk',                        mitigation: '4-month rent-free + £34,684 reserve target (3 months Fixed OH + Rent).' },
  { risk: 'Top-line drop (-10%)',                 mitigation: 'Honest stress test below — surfaces an annual loss rather than hiding it.' },
  { risk: 'Competitor density',                   mitigation: 'London Fields scene is collaborative; partnerships drive traffic, not cannibalise it.' },
  { risk: 'Consumer slowdown',                    mitigation: 'Activity-led format works sober; lower alcohol spend tolerated by the unit economics.' },
]

const SECTOR_REALITY = [
  { fact: 'Employer NICs',          detail: '13.8% → 15% (Apr 2025)',           note: 'Already in 2025 wage base.' },
  { fact: 'NMW',                    detail: '£11.44 → £12.21 (+6.7%, Apr 2025)',note: 'Already in base.' },
  { fact: 'Business rates relief',  detail: '75% → 40% (2025/26)',              note: 'Already in forecast.' },
  { fact: 'UK hospitality closures',detail: '~2 per day (2025)',                note: 'Distress creates acquisition opportunity.' },
  { fact: 'Consumer shift',         detail: 'Experience-led, lower-alcohol',    note: 'Events format aligns.' },
]

export default function RiskHonesty() {
  const baseProfit = 45632
  const downsideDelta = HACKNEY_DOWNSIDE.annualProfit - baseProfit

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Risk &amp; Honesty</div>
        <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05, color: 'var(--cream)', marginBottom: 14 }}>
          What breaks the model — and what we've already absorbed.
        </h2>
        <p style={{ fontSize: 17, color: 'var(--cream-dim)', maxWidth: 760, lineHeight: 1.6 }}>
          The same model that produces the Base Case loses money under a 10% revenue drop. We're surfacing that here rather than hiding it — the deal is priced and structured around honest stress.
        </p>
      </div>

      <div className="gold-rule" style={{ marginBottom: 28 }} />

      {/* DOWNSIDE STRESS TEST */}
      <div style={{ padding: 24, marginBottom: 24, borderRadius: 12, background: 'rgba(123,0,0,0.12)', border: '1px solid rgba(123,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E08080' }}>Downside stress test — revenue −10%</div>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>Source: Downside Scenario sheet</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
          {[
            { label: 'Annual revenue',  value: fmt(HACKNEY_DOWNSIDE.annualRevenue),    sub: `From ${fmt(HACKNEY_ACTUALS_2025.revenue * 1.15)} base case` },
            { label: 'Annual profit',   value: fmt(HACKNEY_DOWNSIDE.annualProfit),     sub: `${fmtSigned(downsideDelta)} vs base`, danger: true },
            { label: 'Profit margin',   value: `${(HACKNEY_DOWNSIDE.margin*100).toFixed(2)}%`, sub: 'Negative — loss-making' },
            { label: 'Cash buffer gap', value: fmt(HACKNEY_DOWNSIDE.cashBufferGap),    sub: 'Below the 3-month reserve target' },
          ].map(c => (
            <div key={c.label} style={{ padding: 14, background: 'rgba(10,10,15,0.4)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{c.label}</div>
              <div className="serif" style={{ fontSize: '1.5rem', color: c.danger ? '#E08080' : 'var(--cream)', lineHeight: 1, marginBottom: 4 }}>{c.value}</div>
              <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{c.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.6, padding: '12px 14px', background: 'rgba(10,10,15,0.4)', borderRadius: 8 }}>
          <strong style={{ color: '#E08080' }}>Verdict:</strong> {HACKNEY_DOWNSIDE.verdict} The fixed wage base of {fmt(HACKNEY_ACTUALS_2025.wages)} is the binding constraint at this stress level. We're flagging this as a risk worth surfacing rather than burying.
        </div>
      </div>

      {/* SECTOR REALITY */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Sector reality — what's already absorbed</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {SECTOR_REALITY.map(r => (
            <div key={r.fact} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 200px', gap: 14, padding: '10px 0', borderBottom: '1px solid rgba(201,168,76,0.06)', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: 'var(--cream)' }}>{r.fact}</span>
              <span style={{ fontSize: 13, color: 'var(--cream-dim)' }}>{r.detail}</span>
              <span style={{ fontSize: 12, color: 'var(--gold-dim)', textAlign: 'right' }}>{r.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RISK REGISTER */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Risk register</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {RISKS.map(r => (
            <div key={r.risk} style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
              <span style={{ fontSize: 13, color: 'var(--cream)' }}>{r.risk}</span>
              <span style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{r.mitigation}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RESERVE STRATEGY */}
      <div className="card-highlight" style={{ padding: 22 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Reserve strategy</div>
        <div style={{ fontSize: 14, color: 'var(--cream)', lineHeight: 1.6, marginBottom: 8 }}>
          Reserve = <strong>3 months × (Fixed OH + Rent)</strong>, excluding wages and director salary. Monthly base £11,561 → 3-month target {fmt(HACKNEY_DEAL.reserveTarget)}.
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
          Step 3 of the distribution waterfall withholds any shortfall before equity dividends are paid. In Year 1 base case, trading cash naturally exceeds the target so £0 is withheld — the reserve gate exists for downside protection, not as a structural drag.
        </div>
      </div>
    </div>
  )
}
