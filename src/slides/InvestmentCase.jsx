import React from 'react'
import { DEAL, ACTUALS_2025, FORECAST } from '../data.js'

const fmt = (n) => '£' + n.toLocaleString()

const STRENGTHS = [
  {
    icon: '📊',
    title: 'Proven Trading History',
    body: `${fmt(ACTUALS_2025.revenue)} verified 2025 revenue from 52 weeks of categorised weekly P&L. Not a projection — real trading data from an established venue.`,
  },
  {
    icon: '📍',
    title: 'Defensible Location',
    body: 'Borough Market SE1 — one of London\'s highest-footfall tourist and local destinations. The lease cannot be easily replicated. 77,801 organic search sessions in 2025.',
  },
  {
    icon: '💰',
    title: 'Distressed Entry Pricing',
    body: `${DEAL.multiple.toFixed(2)}× EBITDA entry multiple via acquisition from liquidation. Comparable hospitality venues trade at 3–5× EBITDA. Immediate equity uplift on Day 1.`,
  },
  {
    icon: '🛡️',
    title: 'Preferred Return Protection',
    body: `${fmt(DEAL.preferred)} annual preferred return paid before any equity distribution. 8% on ${fmt(DEAL.investment)} invested — guaranteed first position in the waterfall.`,
  },
  {
    icon: '🎯',
    title: 'Multiple Revenue Streams',
    body: 'Bar spend (49%), online golf tickets (28%), bookings & events (14%), private hires (6%), pool tickets and service charge. No single point of failure.',
  },
  {
    icon: '⚡',
    title: 'No Exit Required',
    body: `${(DEAL.coc * 100).toFixed(1)}% cash-on-cash return from Year 1 trading distributions. ${DEAL.payback} year payback period. Investor returns are cash-flow driven — no sale required.`,
  },
]

const UPSIDE = [
  { driver: 'SEO rebuild from Day 1', detail: 'Organic traffic down 32% due to brand change. Lithos SEO programme restores rankings under No Dice Borough — compounding year-on-year.' },
  { driver: 'Google Ads scaling', detail: 'Proven £0.32 CPC and 5.7% conversion rate. Current £600/mth budget delivers ~107 conversions/mth. Scale to £1,200/mth doubles volume with verified unit economics.' },
  { driver: 'Corporate events pipeline', detail: 'Private hire revenue £44,999 in 2025. Bookings manager focusing on corporate events, team days and exclusive hires — material upside to base case.' },
  { driver: 'DJ Nights programme', detail: 'Fri/Sat late events incremental to walk-in trade. High-margin bar revenue, zero additional fixed cost.' },
  { driver: 'Gaming repricing', detail: '+£1 across pool and mini golf across 100k+ annual plays. Minimal customer resistance, meaningful P&L impact.' },
]

const RISKS = [
  { risk: 'Reopening timeline', rating: 'Low', mitigation: 'Lease secured, hardware acquired, staff retained. Target May 2026.' },
  { risk: 'Revenue below forecast', rating: 'Low', mitigation: 'Base case is +15% on verified 2025 actuals. Preferred return paid even if revenue flat.' },
  { risk: 'Wage inflation', rating: 'Medium', mitigation: 'NMW modelled at 2025 actuals — no optimistic assumption. Wage calculator available for scenario testing.' },
  { risk: 'Brand transition (Plonk → No Dice)', rating: 'Medium', mitigation: 'SEO redirect preserves domain authority. Existing customer database retained. Borough Market location unchanged.' },
]

const RAG = { Low: '#2DD4BF', Medium: '#E67E22', High: '#E53935' }

export default function InvestmentCase() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        The Investment Case
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 36, fontSize: 15 }}>
        Why No Dice Borough · Six reasons to invest · Upside drivers · Risk mitigation
      </p>

      {/* Six strengths */}
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
        Six Core Strengths
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        {STRENGTHS.map((s, i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500, marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6 }}>{s.body}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

        {/* Upside drivers */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
            Upside Drivers (not in base case)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {UPSIDE.map((u, i) => (
              <div key={i} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--teal)', marginBottom: 4, fontWeight: 500 }}>▶ {u.driver}</div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{u.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Risks */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
            Risks &amp; Mitigations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RISKS.map((r, i) => (
              <div key={i} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                    background: `${RAG[r.rating]}22`, color: RAG[r.rating],
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>{r.rating}</div>
                  <div style={{ fontSize: 12, color: 'var(--cream)' }}>{r.risk}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{r.mitigation}</div>
              </div>
            ))}
          </div>

          {/* Final call to action */}
          <div className="card-highlight" style={{ padding: 20, marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.7 }}>
              Seeking <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{fmt(DEAL.investment)} inc VAT</span> for{' '}
              <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{(DEAL.investorEq*100).toFixed(1)}% equity</span>.
              Year 1 return <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{fmt(DEAL.totalInvestorReturn)}</span> ({(DEAL.coc*100).toFixed(1)}% CoC).
              Payback <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{DEAL.payback} years</span>.
              Cash-flow driven — no exit required.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
