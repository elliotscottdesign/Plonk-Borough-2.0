import React from 'react'
import {
  HACKNEY_DEAL,
  HACKNEY_INVESTOR_RETURNS,
  HACKNEY_ACTUALS_2025,
  HACKNEY_COMPLIANCE,
} from '../../data/hackney.js'

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const pct = (n, d=2) => (n*100).toFixed(d) + '%'

const WHY_DIFFERENT = [
  { headline: 'Proven revenue base',          detail: `${fmt(HACKNEY_ACTUALS_2025.revenue)} verified 2025 bar-only trading actuals — not a projection.` },
  { headline: 'Mini golf drag removed',        detail: 'Restated to exclude the loss-making golf operation; saves ~£19,800 net per year.' },
  { headline: 'Hackney Wick location',         detail: 'Established East London late-night destination with built-in footfall.' },
  { headline: '4-month rent-free period',      detail: 'Landlord acquisition concession protects opening cash runway.' },
  { headline: 'DJ &  events programme',        detail: 'Fri/Sat highest-revenue nights with experience-led format.' },
  { headline: 'Brand IP retained',             detail: 'Trading name, customer data, goodwill carry across.' },
  { headline: 'Zero paid-search spend',         detail: 'Runs on organic / local / word-of-mouth — no Google Ads dependency.' },
  { headline: 'Below sector entry multiple',   detail: '3.24× EBITDA at entry — under the 4.1× hospitality sector average. Exit assumption holds at 4×.' },
  { headline: '50/50 single share class',      detail: 'No A/B distinction, no founder priority slice. After 8% preferred and reserve gate, pure pro-rata.' },
  { headline: 'Cash-yielding from day one',    detail: 'Returns come from operating cash flow — no multiple-expansion bet required.' },
]

const HOW_PAID = [
  { n: 1, title: 'Preferred return — paid first',    body: `8% × £100,000 = £8,000 every year, before any other distribution. Priority not guarantee.` },
  { n: 2, title: 'Reserve protected',                 body: `Before equity dividends, the business retains enough to cover 3 months of Fixed OH + Rent (${fmt(HACKNEY_DEAL.reserveTarget)}). Withheld only when trading cash falls short.` },
  { n: 3, title: 'Pro-rata by equity',                body: `Remaining profit splits 50/50 — ${pct(HACKNEY_DEAL.investorEq, 0)} to investor / ${pct(HACKNEY_DEAL.founderEq, 0)} to founder. Single share class, no founder priority slice.` },
]

export default function Close() {
  const r = HACKNEY_INVESTOR_RETURNS

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Close</div>
        <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05, color: 'var(--cream)', marginBottom: 14 }}>
          A 50/50 cash-yielding bar — priced below sector average.
        </h2>
        <p style={{ fontSize: 17, color: 'var(--cream-dim)', maxWidth: 760, lineHeight: 1.6 }}>
          Single share class, founder-controlled day-to-day, pure pro-rata after preferred. Returns come from real operating cash, not a multiple-expansion thesis.
        </p>
      </div>

      <div className="gold-rule" style={{ marginBottom: 28 }} />

      {/* WHY DIFFERENT */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Why this deal is different</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {WHY_DIFFERENT.map((w, i) => (
            <div key={w.headline} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 10, padding: '10px 0', borderBottom: i < WHY_DIFFERENT.length - 2 ? '1px solid rgba(201,168,76,0.06)' : 'none' }}>
              <div className="serif" style={{ fontSize: 14, color: 'var(--gold-dim)', textAlign: 'center', paddingTop: 2 }}>{i+1}</div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--cream)', marginBottom: 3, fontWeight: 500 }}>{w.headline}</div>
                <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{w.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW INVESTORS GET PAID */}
      <div className="card-highlight" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>How investors get paid — in plain English</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {HOW_PAID.map(s => (
            <div key={s.n} style={{ padding: 18, background: 'var(--ink-3)', borderRadius: 8, border: '1px solid rgba(201,168,76,0.1)' }}>
              <div className="serif" style={{ fontSize: 28, color: 'var(--gold)', lineHeight: 1, marginBottom: 8 }}>0{s.n}</div>
              <div style={{ fontSize: 14, color: 'var(--cream)', marginBottom: 8, fontWeight: 500 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RECAP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Invest',          value: fmt(HACKNEY_DEAL.investment) },
          { label: 'Receive',         value: pct(HACKNEY_DEAL.investorEq, 0) + ' equity' },
          { label: 'Year 1',          value: fmt(r.year1.investorReturn) + ` · ${(r.year1.coc*100).toFixed(1)}%` },
          { label: '5 years',         value: fmt(r.totalReturned) + ` · ${r.multipleOfMoney.toFixed(2)}× MoM` },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>{c.label}</div>
            <div className="serif" style={{ fontSize: '1.3rem', color: 'var(--cream)', lineHeight: 1.1 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* CONTACT */}
      <div className="card" style={{ padding: 22, marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Next steps</div>
        <div style={{ fontSize: 14, color: 'var(--cream)', lineHeight: 1.7 }}>
          Read the full 39-sheet financial model on request. Site visits available — Hackney Wick, London E9. Subscription documents and shareholders' agreement to follow once interest is confirmed.
        </div>
      </div>

      {/* COMPLIANCE FOOTER */}
      <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 8 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 8 }}>Compliance</div>
        <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6, fontStyle: 'italic' }}>
          {HACKNEY_COMPLIANCE}
        </div>
      </div>
    </div>
  )
}
