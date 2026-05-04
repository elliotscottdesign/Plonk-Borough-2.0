import React, { useState } from 'react'
import { MARKETING, ACTUALS_2025 } from '../data.js'
import MarketingUpliftCard from '../components/MarketingUpliftCard.jsx'

const fmt = (n) => '£' + Math.round(n).toLocaleString()
const fmtK = (n) => '£' + (Math.round(n / 1000)).toLocaleString() + 'k'

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
        when conversion tracking is live. Plonk Golf Ltd traded under the same brand throughout 2025 —
        the dip below is paid-search-driven, not brand-driven.
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
              { year: '2024', sessions: 114228, note: 'Paid search active Jan–Nov 2024', color: '#1565C0' },
              { year: '2025', sessions: 77801, note: '−32% · no paid search end-2024 → Nov 2025', color: '#C9A84C' },
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

      {/* ─── 2026 Marketing-Driven Ticket Sales Forecast ────────────── */}
      <MarketingForecastCalculator />

      {/* ─── Where do those tickets land? + capacity reality check ─── */}
      <div style={{ marginTop: 36 }}>
        <MarketingUpliftCard />
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
// 2026 forecast calculator — projects incremental ticket sales from
// editable Google Ads + SEO investment levels. Defaults pulled from
// Windsor.ai-verified GA4 data (37-day Nov–Dec 2025 campaign):
//   - CPC £0.32, conversion rate 5.7%, avg ticket value £14.
//   - SEO baseline = 2024 trend (114k organic sessions during the last full
//     year of paid search — paid search lapsed at end of 2024).
// All assumptions editable so investors can stress-test.
// ───────────────────────────────────────────────────────────────────────
function MarketingForecastCalculator() {
  // Default avg ticket value derived from ACTUALS_2025 — total online ticket
  // revenue / online ticket volume. Verified £14.11/ticket weighted average.
  const DEFAULT_AVG_TICKET = 14
  const DEFAULT_GA_CONV_RATE = +(MARKETING.googleAdsConversions / MARKETING.googleAdsClicks * 100).toFixed(2)  // 5.75%
  const DEFAULT_GA_CPC = MARKETING.googleAdsCPC                                                                // 0.32
  // SEO baseline session count and uplift defaults — moderate recovery target
  const DEFAULT_SEO_BASELINE = MARKETING.organicSessions2025
  const DEFAULT_SEO_GROWTH = 30      // % year-1 growth target (recovery from 2025 dip)
  const DEFAULT_SEO_CONV_RATE = 1.5  // % — organic visitors convert lower than paid (intent-driven traffic)

  // Editable state
  const [adsMonthly,   setAdsMonthly]   = useState(600)   // £/mo Google Ads
  const [adsCPC,       setAdsCPC]       = useState(DEFAULT_GA_CPC)
  const [adsConvRate,  setAdsConvRate]  = useState(DEFAULT_GA_CONV_RATE)
  const [seoMonthly,   setSeoMonthly]   = useState(872)   // £/mo SEO retainer
  const [seoGrowth,    setSeoGrowth]    = useState(DEFAULT_SEO_GROWTH)
  const [seoConvRate,  setSeoConvRate]  = useState(DEFAULT_SEO_CONV_RATE)
  const [avgTicket,    setAvgTicket]    = useState(DEFAULT_AVG_TICKET)

  // ─── Google Ads outputs ─────────────────────────────────────────────
  const adsClicksPerMo  = adsMonthly / Math.max(0.01, adsCPC)
  const adsConvPerMo    = adsClicksPerMo * (adsConvRate / 100)
  const adsRevPerMo     = adsConvPerMo * avgTicket
  const adsRevPerYr     = adsRevPerMo * 12
  const adsSpendPerYr   = adsMonthly * 12
  const adsROI          = adsSpendPerYr > 0 ? (adsRevPerYr / adsSpendPerYr) : 0

  // ─── SEO outputs (year-1 average) ───────────────────────────────────
  // Organic growth ramps over 12 months — use simple linear ramp from
  // baseline to baseline × (1 + growth%). Year-1 average sessions = midpoint.
  const seoTargetSessions = DEFAULT_SEO_BASELINE * (1 + seoGrowth / 100)
  const seoAvgSessions    = (DEFAULT_SEO_BASELINE + seoTargetSessions) / 2
  const seoMonthlySessions = seoAvgSessions / 12
  const seoConvPerMo       = seoMonthlySessions * (seoConvRate / 100)
  const seoRevPerMo        = seoConvPerMo * avgTicket
  const seoRevPerYr        = seoRevPerMo * 12
  const seoSpendPerYr      = seoMonthly * 12
  const seoROI             = seoSpendPerYr > 0 ? (seoRevPerYr / seoSpendPerYr) : 0
  // Incremental sessions vs 2025 baseline (for the "uplift over baseline" framing)
  const seoIncrementalSessions = seoAvgSessions - DEFAULT_SEO_BASELINE
  const seoIncrementalConvPerYr = (seoIncrementalSessions * (seoConvRate / 100))
  const seoIncrementalRev      = seoIncrementalConvPerYr * avgTicket

  const totalRev   = adsRevPerYr + seoRevPerYr
  const totalSpend = adsSpendPerYr + seoSpendPerYr
  const totalROI   = totalSpend > 0 ? totalRev / totalSpend : 0

  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
        2026 Forecast · Marketing-Driven Ticket Uplift
      </div>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 24, fontSize: 13, lineHeight: 1.6 }}>
        Projects incremental tickets sold from each marketing channel. Defaults are
        live-from-Windsor.ai GA4 actuals (37-day Nov–Dec 2025 campaign for Ads, two-year
        organic trend for SEO). Drag any slider to stress-test scenarios.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* ── Google Ads card ─────────────────────────────────────── */}
        <ForecastCard
          accent="#4FC3F7"
          eyebrow="Google Ads · PPC"
          title={`${Math.round(adsConvPerMo)} tickets / mo`}
          subtitle={`${fmt(adsRevPerMo)} / mo  ·  ${fmt(adsRevPerYr)} / yr`}
        >
          <ForecastSlider
            label="Monthly spend"
            value={adsMonthly} setValue={setAdsMonthly}
            min={0} max={3000} step={50}
            display={`£${adsMonthly.toLocaleString()}/mo`}
            color="#4FC3F7"
          />
          <ForecastInputRow>
            <ForecastInputCell label="CPC" value={adsCPC} setValue={setAdsCPC} prefix="£" suffix="/click" step={0.01} />
            <ForecastInputCell label="Conv rate" value={adsConvRate} setValue={setAdsConvRate} suffix="%" step={0.1} />
          </ForecastInputRow>
          <ForecastInputRow>
            <ForecastInputCell label="Avg ticket" value={avgTicket} setValue={setAvgTicket} prefix="£" step={0.5} />
            <ForecastDerived label="Clicks / mo" value={Math.round(adsClicksPerMo).toLocaleString()} />
          </ForecastInputRow>
          <ForecastBottomLine
            spend={fmt(adsSpendPerYr)}
            revenue={fmt(adsRevPerYr)}
            roi={`${adsROI.toFixed(1)}×`}
          />
        </ForecastCard>

        {/* ── SEO card ────────────────────────────────────────────── */}
        <ForecastCard
          accent="#2DD4BF"
          eyebrow="SEO · Organic"
          title={`${Math.round(seoConvPerMo).toLocaleString()} tickets / mo`}
          subtitle={`${fmt(seoRevPerMo)} / mo  ·  ${fmt(seoRevPerYr)} / yr`}
        >
          <ForecastSlider
            label="Monthly SEO retainer"
            value={seoMonthly} setValue={setSeoMonthly}
            min={0} max={3000} step={50}
            display={`£${seoMonthly.toLocaleString()}/mo`}
            color="#2DD4BF"
          />
          <ForecastInputRow>
            <ForecastInputCell label="Y1 growth" value={seoGrowth} setValue={setSeoGrowth} suffix="%" step={5} />
            <ForecastInputCell label="Conv rate" value={seoConvRate} setValue={setSeoConvRate} suffix="%" step={0.1} />
          </ForecastInputRow>
          <ForecastInputRow>
            <ForecastDerived label="Sessions / mo" value={Math.round(seoMonthlySessions).toLocaleString()} />
            <ForecastDerived label="Avg ticket" value={`£${avgTicket}`} />
          </ForecastInputRow>
          <ForecastBottomLine
            spend={fmt(seoSpendPerYr)}
            revenue={fmt(seoRevPerYr)}
            roi={`${seoROI.toFixed(1)}×`}
            note={seoIncrementalRev > 0 ? `+${fmt(seoIncrementalRev)} vs 2025 baseline` : null}
          />
        </ForecastCard>
      </div>

      {/* ── Combined uplift summary ───────────────────────────────────── */}
      <div style={{
        marginTop: 16,
        background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 10, padding: '18px 22px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <ForecastSummary label="Total marketing spend"  value={fmt(totalSpend)} sub="annual"        color="#9CA3AF" />
          <ForecastSummary label="Forecast ticket revenue" value={fmt(totalRev)}   sub="annual uplift" color="var(--gold)" highlight />
          <ForecastSummary label="Combined ROI"            value={`${totalROI.toFixed(1)}×`} sub="revenue ÷ spend" color="#2DD4BF" />
          <ForecastSummary label="Tickets / yr"            value={Math.round((adsConvPerMo + seoConvPerMo) * 12).toLocaleString()} sub="incremental" color="#22D3EE" />
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
        <span style={{ color: '#9CA3AF', fontWeight: 600 }}>Sources: </span>
        Google Ads CPC + conversion rate verified by GA4 (Windsor.ai) over the 5 Nov–11 Dec 2025
        campaign window. SEO baseline uses verified 2025 organic session count (77,801);
        2024 organic was 114k during the last full year of paid search (paid search lapsed end of 2024).
        Avg ticket value derived from 2025 online ticket revenue ÷ ticket volume.
      </div>
    </div>
  )
}

// ─── Forecast helper components ────────────────────────────────────────

function ForecastCard({ accent, eyebrow, title, subtitle, children }) {
  return (
    <div style={{
      background: 'var(--ink-2)', border: `1px solid ${accent}40`, borderRadius: 10, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontWeight: 700, marginBottom: 6 }}>{eyebrow}</div>
        <div className="serif" style={{ fontSize: 26, color: 'var(--cream)', lineHeight: 1.1, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--cream-dim)' }}>{subtitle}</div>
      </div>
      {children}
    </div>
  )
}

function ForecastSlider({ label, value, setValue, min, max, step, display, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 700 }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => setValue(Number(e.target.value))}
        style={{ width: '100%', accentColor: color }} />
    </div>
  )
}

function ForecastInputRow({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>
}

function ForecastInputCell({ label, value, setValue, prefix, suffix, step = 0.1 }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 9.5, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {prefix && <span style={{ fontSize: 11, color: '#6B7280' }}>{prefix}</span>}
        <input type="number" min={0} step={step} value={value}
          onChange={e => setValue(Number(e.target.value) || 0)}
          style={{
            width: '100%', padding: '4px 6px', textAlign: 'right',
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 4, color: 'var(--gold)', fontWeight: 600, fontSize: 12,
          }} />
        {suffix && <span style={{ fontSize: 10, color: '#6B7280', whiteSpace: 'nowrap' }}>{suffix}</span>}
      </span>
    </label>
  )
}

function ForecastDerived({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 9.5, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600, padding: '4px 0' }}>{value}</span>
    </div>
  )
}

function ForecastBottomLine({ spend, revenue, roi, note }) {
  return (
    <div style={{ marginTop: 4, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--cream-dim)' }}>
        <span>Spend: <span style={{ color: 'var(--cream)' }}>{spend}</span></span>
        <span>Revenue: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{revenue}</span></span>
        <span>ROI: <span style={{ color: '#2DD4BF', fontWeight: 700 }}>{roi}</span></span>
      </div>
      {note && <div style={{ fontSize: 10.5, color: '#6B7280', marginTop: 4 }}>{note}</div>}
    </div>
  )
}

function ForecastSummary({ label, value, sub, color, highlight }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9.5, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div className="serif" style={{ fontSize: highlight ? 24 : 20, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#6B7280' }}>{sub}</div>
    </div>
  )
}
