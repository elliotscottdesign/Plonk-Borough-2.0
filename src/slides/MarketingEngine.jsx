import React from 'react'
import { MARKETING } from '../data.js'

const fmt = (n) => '£' + n.toLocaleString()

export default function MarketingEngine() {
  const budget2026 = [
    { line: 'Website Maintenance', supplier: 'Lithos Digital EE', monthly: 291, annual: 3492, note: 'plonkgolf.co.uk · cloud server · redirecting to nodiceborough.co.uk' },
    { line: 'SEO + Outreach + Business Listings', supplier: 'Lithos Digital EE', monthly: 872, annual: 10464, note: '3 articles/mth + 10 business listings · run all 12 months from Day 1' },
    { line: 'Google Ads (PPC spend)', supplier: 'Google Ads', monthly: 600, annual: 7200, note: '~1,875 clicks/mth · ~107 conversions/mth at verified £0.32 CPC' },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        Digital Marketing
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 36, fontSize: 15 }}>
        GA4-verified actuals (Windsor.ai) · Two-year analysis · 2026 spend plan
      </p>

      {/* Key finding banner */}
      <div style={{
        background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.2)',
        borderRadius: 10, padding: '16px 20px', marginBottom: 32, fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.7,
      }}>
        <span style={{ color: 'var(--teal)', fontWeight: 500 }}>Key insight: </span>
        Organic Search drives <strong style={{ color: 'var(--cream)' }}>50× more traffic</strong> than paid ads —
        77,801 organic sessions in 2025 vs 1,580 from Google Ads (37 active days).
        The SEO programme is the primary acquisition engine. Google Ads are a proven, efficient supplement
        when conversion tracking is live.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 36 }}>

        {/* 2025 actuals */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
            2025 Google Ads — GA4 Verified
          </div>
          <div style={{
            background: 'rgba(183,28,28,0.08)', border: '1px solid rgba(183,28,28,0.25)',
            borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6,
          }}>
            <span style={{ color: '#E53935', fontWeight: 500 }}>2024: </span>
            Ads ran Jan–Nov with no conversion tracking.
            <strong style={{ color: 'var(--cream)' }}> £9,353 spent</strong> — zero measurable ROI.
          </div>
          {[
            ['Active period', '5 Nov – 11 Dec 2025 (37 days)'],
            ['Total ad spend', fmt(MARKETING.googleAdsSpend2025)],
            ['Total clicks', MARKETING.googleAdsClicks.toLocaleString()],
            ['Average CPC', `£${MARKETING.googleAdsCPC}`],
            ['Conversions', `${MARKETING.googleAdsConversions} (DMN checkout verified)`],
            ['Cost per conversion', `£${MARKETING.googleAdsCostPerConv}`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
              <span style={{ color: 'var(--cream-dim)' }}>{label}</span>
              <span style={{ color: 'var(--gold)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Organic traffic */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
            Organic Search — Primary Channel
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {[
              { year: '2024', sessions: 114228, note: 'Plonk Golf brand active all year', color: '#1565C0' },
              { year: '2025', sessions: 77801, note: '−32% · brand changing to No Dice Borough', color: '#C9A84C' },
            ].map(s => (
              <div key={s.year} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--cream-dim)' }}>{s.year} Organic Sessions</span>
                  <span style={{ fontSize: 16, fontFamily: "'DM Serif Display', serif", color: s.color }}>
                    {s.sessions.toLocaleString()}
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--ink-3)', borderRadius: 2 }}>
                  <div style={{ height: '100%', background: s.color, borderRadius: 2, width: `${(s.sessions/114228)*100}%` }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--cream-dim)', marginTop: 6 }}>{s.note}</div>
              </div>
            ))}
          </div>
          <div style={{
            background: 'rgba(183,28,28,0.08)', border: '1px solid rgba(183,28,28,0.25)',
            borderRadius: 8, padding: '12px 14px', fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6,
          }}>
            <span style={{ color: '#E53935', fontWeight: 500 }}>Action required: </span>
            No Dice Borough has zero SEO history. Lithos SEO must start from
            <strong style={{ color: 'var(--cream)' }}> Day 1 of reopening</strong>. 301 redirect
            plonkgolf.co.uk → nodiceborough.co.uk preserves domain authority.
          </div>
        </div>
      </div>

      {/* 2026 Budget */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 }}>
          2026 Digital Marketing Budget
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {budget2026.map((b, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr',
              gap: 16, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
              alignItems: 'center', fontSize: 12 }}>
              <div>
                <div style={{ color: 'var(--cream)', marginBottom: 2 }}>{b.line}</div>
                <div style={{ fontSize: 10, color: 'var(--cream-dim)' }}>{b.supplier}</div>
              </div>
              <div style={{ color: 'var(--cream)', textAlign: 'right' }}>£{b.monthly}/mth</div>
              <div style={{ color: 'var(--gold)', textAlign: 'right', fontFamily: "'DM Serif Display', serif", fontSize: 15 }}>
                £{b.annual.toLocaleString()}/yr
              </div>
              <div style={{ fontSize: 10, color: 'var(--cream-dim)' }}>{b.note}</div>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr',
            gap: 16, padding: '14px 0', alignItems: 'center' }}>
            <div style={{ fontWeight: 500, color: 'var(--cream)', fontSize: 13 }}>Total Digital Marketing</div>
            <div style={{ color: 'var(--cream)', textAlign: 'right', fontSize: 13 }}>£1,763/mth</div>
            <div style={{ color: 'var(--gold)', textAlign: 'right', fontFamily: "'DM Serif Display', serif", fontSize: 18 }}>
              £{MARKETING.totalDigital2026.toLocaleString()}/yr
            </div>
            <div style={{ fontSize: 10, color: 'var(--cream-dim)' }}>
              2.5% of £852k forecast revenue · Studio hosting removed (new provider)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
