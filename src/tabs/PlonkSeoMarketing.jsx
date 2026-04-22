import React, { useState } from 'react'
import ResetBtn from '../components/ResetBtn.jsx'

// Digital acquisition funnel model — was "Distribution" in Business Explorer, now
// lives under the Plonk tab since the Plonk Golf holding co owns the marketing stack
// (ad spend, SEO, booking system) for all franchised venues.
export default function PlonkSeoMarketing() {
  const [budget, setBudget] = useState(500)
  const [cpc, setCpc] = useState(0.46)
  const [cvr, setCvr] = useState(3.6)
  const [avgSpend, setAvgSpend] = useState(70.2)
  const annualBudget = budget * 52
  const clicks = Math.round(annualBudget / cpc)
  const customers = Math.round(clicks * cvr / 100)
  const revenue = Math.round(customers * avgSpend)
  const roas = revenue > 0 ? (revenue / annualBudget).toFixed(1) : 0
  const netProfit = Math.round(revenue * 0.6 - annualBudget)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13 }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>
          SEO Marketing · Funnel Model
        </div>
        <h2 className="serif" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', lineHeight: 1.1, color: 'var(--cream)', marginBottom: 8 }}>
          Ads → clicks → customers → revenue
        </h2>
        <p style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, maxWidth: 780 }}>
          Interactive model for the paid digital funnel Plonk Golf runs centrally. Move the sliders to test budget, CPC, conversion rate and average ticket spend — outputs update in real time.
        </p>
      </div>

      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Marketing Model Inputs</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Weekly Ad Budget', value: budget, set: setBudget, min: 100, max: 1500, prefix: '£', suffix: '', default: 500 },
            { label: 'Cost Per Click', value: cpc, set: setCpc, min: 0.1, max: 2, step: 0.01, prefix: '£', suffix: '', default: 0.46 },
            { label: 'Conversion Rate', value: cvr, set: setCvr, min: 0.5, max: 10, step: 0.1, prefix: '', suffix: '%', default: 3.6 },
            { label: 'Avg Spend / Customer', value: avgSpend, set: setAvgSpend, min: 20, max: 150, prefix: '£', suffix: '', default: 70.2 },
          ].map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--cream)' }}>{s.label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{s.prefix}{s.value}{s.suffix}</span>
                  <ResetBtn onClick={() => s.set(s.default)} title={`Reset to ${s.prefix}${s.default}${s.suffix}`} />
                </span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step || 1} value={s.value} onChange={e => s.set(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--gold)' }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Annual Budget', value: '£' + Math.round(annualBudget / 1000) + 'k', color: '#C9A84C' },
          { label: 'Paying Customers', value: customers.toLocaleString(), color: '#4FC3F7' },
          { label: 'ROAS', value: roas + '×', color: '#2DD4BF' },
          { label: 'Net Marketing Profit', value: '£' + Math.round(netProfit / 1000) + 'k', color: netProfit > 0 ? '#2DD4BF' : '#EF4444' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
