import React, { useState } from 'react'
import { MARKETING, ACTUALS_2025 } from '../data.js'
import MarketingUpliftCard from '../components/MarketingUpliftCard.jsx'
import ResetBtn from '../components/ResetBtn.jsx'

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

      {/* ─── Empirical 2026 Forecast — derived, NOT a sandbox ───────── */}
      <EmpiricalForecast />

      {/* ─── Top adwords + current Google market price reference ────── */}
      <TopAdwordsTable />

      {/* ─── Where do those tickets land? + capacity reality check ─── */}
      <div style={{ marginTop: 36 }}>
        <MarketingUpliftCard />
      </div>

      {/* ─── Stress-test scenarios (collapsible — sliders, not data) ── */}
      <CollapsibleSection title="Stress-test scenarios · slider-driven" defaultOpen={false}>
        <p style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6, marginBottom: 14 }}>
          Sandbox below the empirical forecast. Drag any slider to model alternate spend / CPC /
          conversion-rate scenarios. Outputs are illustrative — the headline 2026 forecast above
          is the figure that flows into Investor Returns.
        </p>
        <MarketingForecastCalculator />
      </CollapsibleSection>

      {/* ─── Sandbox funnel calculator (was: Plonk · SEO Marketing tab) ── */}
      <CollapsibleSection title="Sandbox funnel calculator · ads → clicks → customers → revenue" defaultOpen={false}>
        <p style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6, marginBottom: 14 }}>
          Standalone funnel sandbox — quick what-if on weekly ad budget × CPC × conversion rate × avg ticket.
          Independent of the empirical forecast above; useful for back-of-envelope scenario testing
          rather than projection.
        </p>
        <FunnelSandbox />
      </CollapsibleSection>
    </div>
  )
}

// ─── CollapsibleSection — large rotating ▾ + serif h3 header ────────────
// Same pattern as the Investor Returns slide. Click anywhere on the
// header row to toggle. Default closed unless caller passes defaultOpen.
function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div style={{ marginTop: 32 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          width: '100%', gap: 14, marginBottom: 12,
          background: 'transparent', border: 'none', padding: 0,
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: 28, color: 'var(--gold)', lineHeight: 1, flexShrink: 0,
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 0.2s ease',
          display: 'inline-block', width: 24, textAlign: 'center',
        }}>▾</span>
        <h3 className="serif" style={{
          fontSize: 22, color: 'var(--cream)', lineHeight: 1.25, margin: 0,
        }}>
          {title}
        </h3>
      </button>
      {open && children}
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────
// EmpiricalForecast — 2026 prediction derived from the 2024 (ads-on,
// untracked) vs 2025 Jan–Oct (ads-off) vs 2025 Nov–Dec (ads-on, fully
// GA4-tracked) historical comparison. NO sliders — every number is
// computed from MARKETING constants in data.js. This is the headline
// forecast investors should anchor on; the slider-driven calculators
// below are for stress-testing only.
// ───────────────────────────────────────────────────────────────────────
function EmpiricalForecast() {
  const AVG_TICKET = 14                                // verified weighted avg
  const SEO_CONV_RATE = 0.015                          // 1.5% organic conv (intent-driven)
  const ANNUAL_AD_SPEND = MARKETING.googleAdsBudget2026 // £7,200 / yr at £600/mth

  // Verified Nov–Dec 2025 efficiency
  const cpc = MARKETING.googleAdsCPC                                         // £0.32
  const convRate = MARKETING.googleAdsConversions / MARKETING.googleAdsClicks // ~5.74%

  // Direct paid extrapolation: continuous campaign at Nov–Dec efficiency
  const annualClicks = ANNUAL_AD_SPEND / cpc
  const annualConvs  = annualClicks * convRate
  const annualPaidRev = annualConvs * AVG_TICKET

  // Organic recovery: rebuilding 2025 (77,801) toward 2024 (114,228)
  const organicGap = MARKETING.organicSessions2024 - MARKETING.organicSessions2025
  const organicRecoveryRev = organicGap * SEO_CONV_RATE * AVG_TICKET

  // Combined uplift vs the ads-off 2025 baseline
  const totalUplift = annualPaidRev + organicRecoveryRev
  const totalDigitalCost = MARKETING.totalDigital2026  // £21,156 = ads + SEO + web maint
  const netMarketingProfit = totalUplift - totalDigitalCost
  const blendedROAS = totalUplift / totalDigitalCost

  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
        Empirical 2026 Forecast · derived from 2024 vs 2025 paid-search comparison
      </div>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 20, fontSize: 13, lineHeight: 1.6 }}>
        Three-period historical comparison anchors the 2026 prediction. No sliders. Numbers below
        come straight from the verified GA4 / Windsor.ai dataset — drag-anything stress-testing
        lives in the collapsible sandboxes further down.
      </p>

      {/* 3-column historical comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <PeriodCard
          tag="2024 · Jan–Nov" tagColour="#1565C0"
          headline="Paid search active (untracked)"
          rows={[
            ['Ad spend',          '£' + (9353).toLocaleString()],
            ['Conversions',       'Untracked (no GA4)'],
            ['Organic sessions',  MARKETING.organicSessions2024.toLocaleString()],
          ]}
          tail="Brand awareness held organic high"
        />
        <PeriodCard
          tag="2025 · Jan–Oct" tagColour="#E53935"
          headline="Paid search OFF (ads paused)"
          rows={[
            ['Ad spend',          '£0'],
            ['Conversions',       '0 from ads'],
            ['Organic sessions',  MARKETING.organicSessions2025.toLocaleString() + ' (−32% YoY)'],
          ]}
          tail={`Implied loss: ${'£' + Math.round(organicRecoveryRev).toLocaleString()}/yr in organic-driven revenue`}
        />
        <PeriodCard
          tag="2025 · Nov–Dec (37 days)" tagColour="#2DD4BF"
          headline="Paid search ON · fully GA4-tracked"
          rows={[
            ['Ad spend',          '£' + MARKETING.googleAdsSpend2025],
            ['Conversions',       MARKETING.googleAdsConversions + ' verified'],
            ['CPC / conv rate',   '£' + cpc + ' · ' + (convRate*100).toFixed(2) + '%'],
          ]}
          tail={`Verified revenue: ~£${Math.round(MARKETING.googleAdsConversions * AVG_TICKET).toLocaleString()} in 37 days`}
        />
      </div>

      {/* 2026 derived forecast — single, non-sandbox */}
      <div className="card-highlight" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--gold-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          2026 Prediction · continuous paid + organic recovery
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
          <ForecastTile
            label="Paid · direct revenue"
            value={'£' + Math.round(annualPaidRev).toLocaleString()}
            sub={`${Math.round(annualConvs)} customers · £${ANNUAL_AD_SPEND.toLocaleString()} spend`}
          />
          <ForecastTile
            label="Organic · recovery uplift"
            value={'£' + Math.round(organicRecoveryRev).toLocaleString()}
            sub={`Recovering +${organicGap.toLocaleString()} sessions × 1.5% conv × £${AVG_TICKET}`}
          />
          <ForecastTile
            label="Total marketing-driven uplift"
            value={'£' + Math.round(totalUplift).toLocaleString()}
            sub="vs the 2025 ads-off baseline"
            gold
          />
          <ForecastTile
            label="Net marketing profit"
            value={'£' + Math.round(netMarketingProfit).toLocaleString()}
            sub={`After £${totalDigitalCost.toLocaleString()} digital cost · ROAS ${blendedROAS.toFixed(2)}×`}
            colour={netMarketingProfit > 0 ? '#2DD4BF' : '#EF4444'}
          />
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--cream)' }}>Method.</strong> Direct revenue extrapolates the
        37-day Nov–Dec 2025 efficiency (£0.32 CPC · 5.74% conv) to a continuous £600/mth
        annualised spend. Organic uplift assumes brand-name organic recovers from the 2025
        ads-off floor (77,801 sessions) toward the 2024 ads-on ceiling (114,228 sessions) at
        a 1.5% intent-driven conversion rate. Avg ticket £14 (verified 2025 online ticket
        revenue ÷ volume). Cost line = £{MARKETING.totalDigital2026.toLocaleString()}/yr total
        digital (ads + SEO retainer + web maintenance).
      </div>
    </div>
  )
}

// Top adwords + current Google market price reference. Currently a
// placeholder — populate the rows from Google Ads Keyword Planner /
// SEMrush exports. Numbers are kept in this component's local array
// so the table is easy to update without touching data.js.
function TopAdwordsTable() {
  // Replace placeholder rows with actual Keyword Planner data when
  // available. Keep `ourCPC = MARKETING.googleAdsCPC` for the rows
  // we ran during the Nov–Dec 2025 campaign; mark "—" otherwise.
  const ROWS = [
    { keyword: 'Borough Market bar',     monthlySearches: 'TBD',  googleCPC: 'TBD', ourCPC: '—' },
    { keyword: 'mini golf London',       monthlySearches: 'TBD',  googleCPC: 'TBD', ourCPC: '£' + MARKETING.googleAdsCPC },
    { keyword: 'crazy golf Borough',     monthlySearches: 'TBD',  googleCPC: 'TBD', ourCPC: '£' + MARKETING.googleAdsCPC },
    { keyword: 'late night SE1',         monthlySearches: 'TBD',  googleCPC: 'TBD', ourCPC: '—' },
    { keyword: 'arcade bar London',      monthlySearches: 'TBD',  googleCPC: 'TBD', ourCPC: '—' },
  ]
  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
        Top adwords · current Google market prices
      </div>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
        Live Google Ads market rates for the keywords No Dice Borough bids on, alongside the
        £{MARKETING.googleAdsCPC} CPC we paid during the verified Nov–Dec 2025 campaign. Rows
        marked TBD pending the next Keyword Planner export — populate from the Google Ads
        dashboard or SEMrush export so the empirical forecast above can be tightened.
      </p>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid rgba(201,168,76,0.3)', fontSize: 10, color: 'var(--gold-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <span>Keyword</span>
          <span style={{ textAlign:'right' }}>Monthly searches</span>
          <span style={{ textAlign:'right' }}>Google CPC (current)</span>
          <span style={{ textAlign:'right' }}>Our 2025 CPC</span>
        </div>
        {ROWS.map(r => (
          <div key={r.keyword} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: 'var(--cream)' }}>{r.keyword}</span>
            <span style={{ textAlign: 'right', color: r.monthlySearches === 'TBD' ? 'var(--gold-dim)' : 'var(--cream-dim)' }}>{r.monthlySearches}</span>
            <span style={{ textAlign: 'right', color: r.googleCPC === 'TBD' ? 'var(--gold-dim)' : 'var(--cream)' }}>{r.googleCPC}</span>
            <span style={{ textAlign: 'right', color: r.ourCPC === '—' ? 'var(--cream-dim)' : 'var(--gold)' }}>{r.ourCPC}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PeriodCard({ tag, tagColour, headline, rows, tail }) {
  return (
    <div className="card" style={{ padding: 16, borderTop: `3px solid ${tagColour}` }}>
      <div style={{ fontSize: 10, color: tagColour, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{tag}</div>
      <div style={{ fontSize: 12, color: 'var(--cream)', fontWeight: 500, marginBottom: 10 }}>{headline}</div>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0' }}>
          <span style={{ color: 'var(--cream-dim)' }}>{k}</span>
          <span style={{ color: 'var(--cream)', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
        </div>
      ))}
      <div style={{ fontSize: 10, color: 'var(--cream-dim)', lineHeight: 1.5, marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>{tail}</div>
    </div>
  )
}

function ForecastTile({ label, value, sub, gold, colour }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div className="serif" style={{ fontSize: 'clamp(1.3rem, 2.2vw, 1.7rem)', color: colour || (gold ? 'var(--gold)' : 'var(--cream)'), lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{sub}</div>
    </div>
  )
}

// ─── FunnelSandbox — moved from src/tabs/PlonkSeoMarketing.jsx ──────────
// Quick what-if on weekly ad budget × CPC × conversion rate × avg ticket.
// Lives at the bottom of the Digital Marketing tab as a collapsible. The
// empirical forecast above is the headline; this is for exploratory work.
function FunnelSandbox() {
  const [budget, setBudget]     = useState(500)
  const [cpc, setCpc]           = useState(0.46)
  const [cvr, setCvr]           = useState(3.6)
  const [avgSpend, setAvgSpend] = useState(70.2)
  const annualBudget = budget * 52
  const clicks       = Math.round(annualBudget / cpc)
  const customers    = Math.round(clicks * cvr / 100)
  const revenue      = Math.round(customers * avgSpend)
  const roas         = revenue > 0 ? (revenue / annualBudget).toFixed(1) : 0
  const netProfit    = Math.round(revenue * 0.6 - annualBudget)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Marketing model inputs</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Weekly Ad Budget',   value: budget,   set: setBudget,   min: 100,  max: 1500, prefix: '£', suffix: '',  default: 500  },
            { label: 'Cost Per Click',     value: cpc,      set: setCpc,      min: 0.1,  max: 2,    step: 0.01,  prefix: '£', suffix: '',  default: 0.46 },
            { label: 'Conversion Rate',    value: cvr,      set: setCvr,      min: 0.5,  max: 10,   step: 0.1,                  prefix: '',  suffix: '%', default: 3.6  },
            { label: 'Avg Spend / Customer', value: avgSpend, set: setAvgSpend, min: 20,  max: 150,                              prefix: '£', suffix: '',  default: 70.2 },
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
          { label: 'Annual Budget',         value: '£' + Math.round(annualBudget / 1000) + 'k', color: '#C9A84C' },
          { label: 'Paying Customers',      value: customers.toLocaleString(),                  color: '#4FC3F7' },
          { label: 'ROAS',                  value: roas + '×',                                  color: '#2DD4BF' },
          { label: 'Net Marketing Profit',  value: '£' + Math.round(netProfit / 1000) + 'k',    color: netProfit > 0 ? '#2DD4BF' : '#EF4444' },
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
