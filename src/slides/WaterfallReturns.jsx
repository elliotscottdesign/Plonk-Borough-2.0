import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WATERFALL, DEAL } from '../data.js'
import { formatCurrency } from '../i18n/format.js'
import { useLockedForecast } from '../components/LockedForecastContext.jsx'

function calcWaterfall(profit) {
  // Pure pro-rata — operating profit splits directly by equity %. No preferred, no A-share priority.
  const investorDiv = profit * DEAL.investorEq   // 36.05%
  const founderDiv = profit * DEAL.founderEq     // 63.95%
  const totalInvestor = investorDiv
  const coc = totalInvestor / DEAL.investment
  return { investorDiv, founderDiv, totalInvestor, coc }
}

export default function WaterfallReturns() {
  const { t, i18n } = useTranslation('waterfall')
  const lang = i18n.language
  const fmt = (n) => formatCurrency(n, lang)
  const { snapshot, isLocked } = useLockedForecast()

  // Custom scenario reads from the locked snapshot. When the 2026
  // Performance tab is locked, snapshot.opProfit (= profitAfterVat)
  // populates the Custom card. When unlocked, Custom is greyed out
  // and falls back to base.
  const customProfit = snapshot?.opProfit ?? 124000

  const SCENARIOS = {
    bear:   { label: t('scenarios.bear'),   badge: t('scenarioBadges.bear'),   profit: 0,            color: '#E53935' },
    base:   { label: t('scenarios.base'),   badge: t('scenarioBadges.base'),   profit: 124000,       color: '#C9A84C' },
    bull:   { label: t('scenarios.bull'),   badge: t('scenarioBadges.bull'),   profit: 174000,       color: '#2DD4BF' },
    custom: {
      label:  t('scenarios.custom'),
      badge:  isLocked ? t('scenarioBadges.custom') : t('scenarioBadges.customUnlocked'),
      profit: customProfit,
      color:  'var(--gold)',
      disabled: !isLocked,
    },
  }

  const [scenario, setScenario] = useState('base')
  const s = SCENARIOS[scenario]
  const w = calcWaterfall(s.profit)

  const investorPct = (DEAL.investorEq * 100).toFixed(1)
  const founderPct = (DEAL.founderEq * 100).toFixed(1)

  const steps = [
    { label: t('steps.operatingProfit'), amount: s.profit, color: '#1565C0', note: s.badge },
    { label: t('steps.investorDividend', { pct: investorPct }), amount: w.investorDiv, color: '#C9A84C', note: t('steps.investorNote', { pct: investorPct }) },
    { label: t('steps.founderDividend',  { pct: founderPct  }), amount: w.founderDiv,  color: '#4A5568', note: t('steps.founderNote',  { pct: founderPct  }) },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        {t('title')}
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 32, fontSize: 15 }}>
        {t('subtitle')}
      </p>

      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
        {Object.entries(SCENARIOS).map(([key, sc]) => (
          <button key={key} onClick={() => { if (!sc.disabled) setScenario(key) }} disabled={sc.disabled} style={{
            padding: '8px 20px', borderRadius: 6, fontSize: 12, cursor: sc.disabled ? 'not-allowed' : 'pointer',
            background: scenario === key ? sc.color : 'transparent',
            border: `1px solid ${sc.color}`,
            opacity: sc.disabled ? 0.4 : 1,
            color: scenario === key ? '#0A0A0F' : sc.color,
            fontWeight: scenario === key ? 600 : 400,
            transition: 'all 0.15s',
          }}>{sc.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>

        {/* Waterfall steps */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
            {t('steps.header')}
          </div>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ width: 3, height: 36, background: step.color, borderRadius: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--cream)', marginBottom: 2 }}>{step.label}</div>
                <div style={{ fontSize: 10, color: 'var(--cream-dim)' }}>{step.note}</div>
              </div>
              <div style={{
                fontSize: 16, fontFamily: "'DM Serif Display', serif",
                color: step.amount < 0 ? '#E53935' : step.color,
              }}>
                {step.amount < 0 ? '−' : ''}{fmt(Math.abs(step.amount))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>
            {t('summary.header')}
          </div>

          <div className="card-highlight" style={{ padding: 24 }}>
            <div style={{ fontSize: 10, color: 'var(--gold-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('summary.totalReturn')}
            </div>
            <div className="serif" style={{ fontSize: 36, color: 'var(--gold)', marginBottom: 4 }}>
              {fmt(w.totalInvestor)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--cream-dim)' }}>
              {t('summary.totalReturnNote', { pct: investorPct })}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <Row label={t('summary.cashOnCash')} value={`${(w.coc * 100).toFixed(1)}%`} gold />
            <Row label={t('summary.paybackPeriod')} value={t('summary.paybackYears', { n: (DEAL.investment / w.totalInvestor).toFixed(2) })} />
            <Row label={t('summary.onInvested', { amount: fmt(DEAL.investment) })} value={fmt(DEAL.investment)} />
            <Row label={t('summary.equityDividend', { pct: investorPct })} value={fmt(w.investorDiv)} gold />
            <Row label={t('summary.distributionTiming')} value={t('summary.sameAsFounder')} />
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--gold-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('summary.founderPosition')}
            </div>
            <Row label={t('summary.founderEquity', { pct: founderPct })} value={fmt(w.founderDiv)} />
            <Row label={t('summary.paid')} value={t('summary.paidNote')} />
          </div>

          <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6, padding: '4px 0' }}>
            {t('summary.footnote')}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, gold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 12, color: 'var(--cream-dim)' }}>{label}</span>
      <span style={{ fontSize: 13, color: gold ? 'var(--gold)' : 'var(--cream)' }}>{value}</span>
    </div>
  )
}
