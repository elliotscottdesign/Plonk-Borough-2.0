import React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { DEAL, ACTUALS_2025, FORECAST } from '../data.js'
import { formatCurrency } from '../i18n/format.js'

const STRENGTH_META = [
  { key:'proven',     icon:'📊' },
  { key:'location',   icon:'📍' },
  { key:'distressed', icon:'💰' },
  { key:'aligned',    icon:'🤝' },
  { key:'streams',    icon:'🎯' },
  { key:'noExit',     icon:'⚡' },
]

const UPSIDE_KEYS = ['seo', 'ads', 'corporate', 'dj', 'repricing']

const RISKS_META = [
  { key:'timeline', rating:'low' },
  { key:'revenue',  rating:'low' },
  { key:'wage',     rating:'medium' },
  { key:'brand',    rating:'medium' },
]

const RAG = { low: '#2DD4BF', medium: '#E67E22', high: '#E53935' }

export default function InvestmentCase() {
  const { t, i18n } = useTranslation('case')
  const lang = i18n.language
  const fmt = (n) => formatCurrency(n, lang)

  const cocPct = (DEAL.coc * 100).toFixed(1)
  const investorPct = (DEAL.investorEq * 100).toFixed(1)

  const strengthBody = (key) => {
    switch (key) {
      case 'proven':
        return t('strengths.proven.body', { revenue: fmt(ACTUALS_2025.revenue) })
      case 'distressed':
        return t('strengths.distressed.body', { multiple: DEAL.multiple.toFixed(2) })
      case 'noExit':
        return t('strengths.noExit.body', { coc: cocPct, payback: DEAL.payback })
      default:
        return t(`strengths.${key}.body`)
    }
  }

  const paybackLabel = Number(DEAL.payback) === 1
    ? t('cta.year', { n: DEAL.payback })
    : t('cta.years', { n: DEAL.payback })

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

        {/* Upside drivers */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
            {t('upsideHeader')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {UPSIDE_KEYS.map((key) => (
              <div key={key} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--teal)', marginBottom: 4, fontWeight: 500 }}>▶ {t(`upside.${key}.driver`)}</div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{t(`upside.${key}.detail`)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Risks */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
            {t('risksHeader')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RISKS_META.map((r) => (
              <div key={r.key} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                    background: `${RAG[r.rating]}22`, color: RAG[r.rating],
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>{t(`impact.${r.rating}`)}</div>
                  <div style={{ fontSize: 12, color: 'var(--cream)' }}>{t(`risks.${r.key}.risk`)}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{t(`risks.${r.key}.mitigation`)}</div>
              </div>
            ))}
          </div>

          {/* Final call to action */}
          <div className="card-highlight" style={{ padding: 20, marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.7 }}>
              <Trans
                ns="case"
                i18nKey="cta.body"
                defaults="{{seeking}} <gold>{{investment}} inc VAT</gold> {{forWord}} <gold>{{equity}}</gold>. {{year1}} <gold>{{return}}</gold> {{coc}}. {{payback}} <gold>{{paybackYears}}</gold>. {{tail}}"
                values={{
                  seeking: t('cta.seeking'),
                  investment: fmt(DEAL.investment),
                  forWord: t('cta.for'),
                  equity: t('cta.equity', { pct: investorPct }),
                  year1: t('cta.year1'),
                  return: fmt(DEAL.totalInvestorReturn),
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
      </div>
    </div>
  )
}
