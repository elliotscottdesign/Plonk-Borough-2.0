import React from 'react'
import { DEAL, ACTUALS_2025 } from '../../data/hackney.js'

// InvestmentCase — clones Borough's structure: 6-card "Six Core Strengths"
// grid + 2-column Upside Drivers / Risks layout + final CTA banner.

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

const STRENGTHS = [
  {
    key: 'proven', icon: '📊',
    title: 'Proven Trading History',
    body: ({ revenue }) => `${revenue} verified 2025 bar-only revenue from 52 weeks of categorised weekly P&L. Not a projection — real trading data with mini golf operations excluded.`,
  },
  {
    key: 'location', icon: '📍',
    title: 'Established East London Site',
    body: () => 'London Fields — a built-in late-night destination with established footfall. Lease secured, location unchanged through the relaunch.',
  },
  {
    key: 'distressed', icon: '💰',
    title: 'Below Sector Entry Pricing',
    body: ({ multiple }) => `${multiple}× EBITDA entry multiple — below the 4.1× hospitality sector average. The 50/50 split compresses entry pricing in the investor's favour while exit holds at the sector benchmark.`,
  },
  {
    key: 'aligned', icon: '🤝',
    title: 'Aligned Distribution Model',
    body: () => 'All shareholders paid at the same time — pure pro-rata on operating profit by equity %. No preferred return, no priority tiers, single share class. Founder and investor incentives move together from the first payout.',
  },
  {
    key: 'streams', icon: '🎯',
    title: 'Multiple Revenue Streams',
    body: () => 'Bar takings + bookings + private hires + events + service charge. Less dependent on drink-only margins. Source split TBD pending bar-only restatement.',
  },
  {
    key: 'noExit', icon: '⚡',
    title: 'No Exit Required',
    body: ({ coc, payback }) => `${coc}% cash-on-cash return from Year 1 trading distributions. ${payback} year payback period. Investor returns are cash-flow driven — no sale required.`,
  },
]

const UPSIDE = [
  { key:'seo',       driver:'SEO rebuild from Day 1',     detail:'Local-search and organic visibility programme planned for the relaunch — restoring rankings under No Dice Hackney. Baseline traffic figure TBD.' },
  { key:'organic',   driver:'Organic & local listings',   detail:'£8k/yr marketing budget across organic social, neighbourhood listings (Time Out, Resident Advisor) and events partnerships. Zero paid-search dependency.' },
  { key:'corporate', driver:'Corporate events pipeline',  detail:'Private hire and corporate bookings revenue TBD — bookings manager focusing on team days, exclusive hires and Christmas parties. Material upside to base case.' },
  { key:'dj',        driver:'DJ Nights programme',         detail:'Friday and Saturday late events incremental to walk-in trade. High-margin bar revenue, zero additional fixed cost.' },
  { key:'repricing', driver:'Pool & gaming repricing',     detail:'Modest price increases on pool tables and arcade play. Minimal customer resistance, meaningful P&L impact.' },
]

const RISKS = [
  { key:'timeline', rating:'low',    risk:'Reopening timeline',          mitigation:'Lease secured, stock purchased from liquidators, staff retained. Target May 2026.' },
  { key:'revenue',  rating:'low',    risk:'Revenue below forecast',      mitigation:'Base case is +15% on verified 2025 bar-only actuals. Investor dividend is pro-rata on whatever operating profit the venue produces.' },
  { key:'wage',     rating:'medium', risk:'Wage inflation',              mitigation:'NMW modelled at 2025 actuals — no optimistic assumption. Wage calculator available for scenario testing.' },
  { key:'brand',    rating:'medium', risk:'Brand transition',            mitigation:'Trading name, customer data and goodwill retained. Location unchanged. Bar-only restatement clarifies the operating model.' },
]

const RAG = { low: '#2DD4BF', medium: '#E67E22', high: '#E53935' }

export default function InvestmentCase() {
  const cocPct = (DEAL.coc * 100).toFixed(1)
  const investorPct = (DEAL.investorEq * 100).toFixed(1)

  const strengthArgs = {
    revenue: fmt(ACTUALS_2025.revenue),
    multiple: DEAL.multiple.toFixed(2),
    coc: cocPct,
    payback: DEAL.payback,
  }

  const paybackLabel = `${DEAL.payback} years`

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        The Investment Case
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 36, fontSize: 15 }}>
        Why No Dice Hackney · Six reasons to invest · Upside drivers · Risk mitigation
      </p>

      {/* Six strengths */}
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
        Six Core Strengths
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        {STRENGTHS.map((s) => (
          <div key={s.key} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500, marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6 }}>{s.body(strengthArgs)}</div>
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
            {UPSIDE.map((u) => (
              <div key={u.key} className="card" style={{ padding: 16 }}>
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
            {RISKS.map((r) => (
              <div key={r.key} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                    background: `${RAG[r.rating]}22`, color: RAG[r.rating],
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>{r.rating[0].toUpperCase() + r.rating.slice(1)}</div>
                  <div style={{ fontSize: 12, color: 'var(--cream)' }}>{r.risk}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{r.mitigation}</div>
              </div>
            ))}
          </div>

          {/* Final call to action */}
          <div className="card-highlight" style={{ padding: 20, marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.7 }}>
              Seeking <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{fmt(DEAL.investment)} inc VAT</span> for <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{investorPct}% equity</span>. Year 1 return <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{fmt(DEAL.totalInvestorReturn)}</span> ({cocPct}% CoC). Payback <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{paybackLabel}</span>. Cash-flow driven — no exit required.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
