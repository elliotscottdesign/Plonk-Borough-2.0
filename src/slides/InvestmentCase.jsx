import React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { DEAL, ACTUALS_2025, FORECAST, computeDealFromInvestment } from '../data.js'
import { formatCurrency } from '../i18n/format.js'
import { useLockedFunding } from '../components/LockedFundingContext.jsx'

const STRENGTH_META = [
  { key:'proven',     icon:'📊' },
  { key:'location',   icon:'📍' },
  { key:'distressed', icon:'💰' },
  { key:'aligned',    icon:'🤝' },
  { key:'streams',    icon:'🎯' },
  { key:'noExit',     icon:'⚡' },
]

export default function InvestmentCase() {
  const { t, i18n } = useTranslation('case')
  const lang = i18n.language
  const fmt = (n) => formatCurrency(n, lang)

  // All deal economics derive from the live / locked funding amount on
  // the Cover slide — no more hardcoded DEAL.coc / DEAL.payback /
  // DEAL.multiple / DEAL.totalInvestorReturn references.
  const { effective: funding } = useLockedFunding()
  const fundingAmount    = funding.investment
  const deal             = computeDealFromInvestment(fundingAmount)
  const investorReturn   = FORECAST.profit * deal.investorEq      // Year-1 dividend
  const coc              = fundingAmount > 0 ? investorReturn / fundingAmount : 0
  const payback          = investorReturn > 0 ? fundingAmount / investorReturn : Infinity
  const cocPct           = (coc * 100).toFixed(1)
  const investorPct      = (deal.investorEq * 100).toFixed(1)
  const paybackText      = isFinite(payback) ? payback.toFixed(2) : 'N/A'

  const strengthBody = (key) => {
    switch (key) {
      case 'proven':
        return t('strengths.proven.body', { revenue: fmt(ACTUALS_2025.revenue) })
      case 'distressed':
        return t('strengths.distressed.body', { multiple: deal.impliedMult.toFixed(2) })
      case 'noExit':
        return t('strengths.noExit.body', { coc: cocPct, payback: paybackText })
      default:
        return t(`strengths.${key}.body`)
    }
  }

  const paybackLabel = paybackText === '1' || paybackText === '1.00'
    ? t('cta.year', { n: paybackText })
    : t('cta.years', { n: paybackText })

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        {t('title')}
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 36, fontSize: 15 }}>
        {t('subtitle')}
      </p>

      {/* Six strengths */}
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
        {t('strengthsHeader')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        {STRENGTH_META.map((s) => (
          <div key={s.key} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500, marginBottom: 8 }}>{t(`strengths.${s.key}.title`)}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6 }}>{strengthBody(s.key)}</div>
          </div>
        ))}
      </div>

      {/* Final call to action */}
      <div className="card-highlight" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.7 }}>
          <Trans
            ns="case"
            i18nKey="cta.body"
            defaults="{{seeking}} <gold>{{investment}} inc VAT</gold> {{forWord}} <gold>{{equity}}</gold>. {{year1}} <gold>{{return}}</gold> {{coc}}. {{payback}} <gold>{{paybackYears}}</gold>. {{tail}}"
            values={{
              seeking: t('cta.seeking'),
              investment: fmt(fundingAmount),
              forWord: t('cta.for'),
              equity: t('cta.equity', { pct: investorPct }),
              year1: t('cta.year1'),
              return: fmt(investorReturn),
              coc: t('cta.coc', { coc: cocPct }),
              payback: t('cta.payback'),
              paybackYears: paybackLabel,
              tail: t('cta.tail'),
            }}
            components={{ gold: <span style={{ color: 'var(--gold)', fontWeight: 500 }} /> }}
          />
        </div>
      </div>
    </div>
  )
}
