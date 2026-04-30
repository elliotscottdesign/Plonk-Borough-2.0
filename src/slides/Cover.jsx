import React from 'react'
import { useTranslation } from 'react-i18next'
import { ACTUALS_2025, FORECAST, computeDealFromInvestment } from '../data.js'
import { formatCurrency } from '../i18n/format.js'
import { useLockedFunding } from '../components/LockedFundingContext.jsx'
import FundingSlider from '../components/FundingSlider.jsx'

// Cover slide — eyebrow + title + lede + FundingSlider (single root raise
// control for the deck) + 6 stat cards. Every stat reads from the
// LockedFundingContext via `effective.investment`, so the figures cascade
// live as the slider is dragged.
//
// Year-1 dividend is anchored to base-case operating profit (£124k × 50%
// investor equity = £62k) — this stays constant regardless of raise size.
// Cash-on-cash and payback flex inversely with the raise. Multiple flexes
// directly with pre-money.
export default function Cover() {
  const { t, i18n } = useTranslation('cover')
  const lang = i18n.language
  const fmt = (n) => formatCurrency(n, lang)

  const { effective } = useLockedFunding()
  const fundingAmount = effective.investment
  const deal          = computeDealFromInvestment(fundingAmount)

  // Year-1 investor return = 50% × base-case operating profit (£124k).
  // Anchored to operating profit, NOT to the raise — investor receives
  // their pro-rata slice of the same profit pool no matter what the
  // total raise size is. CoC and payback flex inversely with raise.
  const investorReturn = FORECAST.profit * deal.investorEq
  const coc            = fundingAmount > 0 ? investorReturn / fundingAmount : 0
  const payback        = investorReturn > 0 ? fundingAmount / investorReturn : Infinity

  const cocPct      = (coc * 100).toFixed(1)
  const paybackText = isFinite(payback) ? payback.toFixed(2) : 'N/A'

  const stats = [
    { label: t('stats.seeking.label'),         value: `${fmt(fundingAmount)} inc VAT`,    sub: t('stats.seeking.sub') },
    { label: t('stats.verifiedRevenue.label'), value: fmt(ACTUALS_2025.revenue),          sub: t('stats.verifiedRevenue.sub') },
    { label: t('stats.year1Return.label'),     value: fmt(investorReturn),                sub: t('stats.year1Return.sub', { coc: cocPct, payback: paybackText }) },
    { label: t('stats.distribution.label'),    value: t('stats.distribution.value'),      sub: t('stats.distribution.sub') },
    { label: t('stats.forecast.label'),        value: fmt(FORECAST.revenue),              sub: t('stats.forecast.sub') },
    { label: t('stats.valuation.label'),       value: `${deal.impliedMult.toFixed(2)}×`,  sub: t('stats.valuation.sub') },
  ]

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--gold)', marginBottom:16 }}>
          {t('eyebrow')}
        </div>
        <h1 className="serif" style={{ fontSize:'clamp(3rem,7vw,5.5rem)', lineHeight:1, color:'var(--cream)', marginBottom:20 }}>
          No Dice<br/>Borough
        </h1>
        <p style={{ fontSize:18, color:'var(--cream-dim)', maxWidth:520, lineHeight:1.6 }}>
          {t('lede', { revenue: fmt(ACTUALS_2025.revenue) })}
        </p>
      </div>

      <div style={{ height:1, background:'linear-gradient(90deg,transparent,var(--gold),transparent)', marginBottom:24 }} />

      {/* Funding slider — single root control. Cascades to every slide
          via LockedFundingContext. */}
      <FundingSlider />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:12, padding:24 }}>
            <div style={{ fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', marginBottom:10 }}>{s.label}</div>
            <div className="serif" style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)', color:'var(--cream)', marginBottom:8, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:40, padding:'16px 24px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:10 }}>
        <div style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6 }}>
          <strong style={{ color:'var(--gold)' }}>{t('address')}</strong> {t('addressTail')}
        </div>
      </div>
    </div>
  )
}
