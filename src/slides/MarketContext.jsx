import React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { computeDealFromInvestment } from '../data.js'
import { useLockedFunding } from '../components/LockedFundingContext.jsx'

export default function MarketContext() {
  const { t } = useTranslation('market')

  // The "this deal" multiple flexes with the locked Cover funding amount.
  const { effective: funding } = useLockedFunding()
  const deal = computeDealFromInvestment(funding.investment)

  const benchmarks = [
    { multiple: '~5.3×',                          labelKey: 'midMarket',   tagKey: 'above',       highlight: false },
    { multiple: '~4.1×',                          labelKey: 'hospitality', tagKey: 'inline',      highlight: false },
    { multiple: '~2–4×',                          labelKey: 'smallSites',  tagKey: 'inRange',     highlight: false },
    { multiple: '~2–3×',                          labelKey: 'distressed',  tagKey: 'abovePriced', highlight: false },
    { multiple: `${deal.impliedMult.toFixed(2)}×`, labelKey: 'thisDeal',   tagKey: 'entry',       highlight: true  },
  ]

  const sectorKeys = ['nics','nmw','rates','closures','consumer','pe']
  const differentiatorKeys = [
    { key:'proven',   icon:'📊', color:'#C9A84C' },
    { key:'location', icon:'📍', color:'#C9A84C' },
    { key:'format',   icon:'🎮', color:'#2DD4BF' },
    { key:'streams',  icon:'💰', color:'#C9A84C' },
    { key:'ip',       icon:'⭐', color:'#9CA3AF' },
    { key:'digital',  icon:'🌐', color:'#2DD4BF' },
  ]
  const checkKeys = ['noMultiple', 'cashDay1', 'positive']

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 4px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:12, color:'#C9A84C', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>{t('eyebrow')}</div>
        <h2 className="serif" style={{ fontSize:'clamp(2rem, 4vw, 3rem)', color:'var(--cream)', marginBottom:8 }}>{t('title')}</h2>
        <p style={{ fontSize:14, color:'#9CA3AF' }}>{t('subtitle')}</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, marginBottom:20 }}>
        {/* Left: Market Benchmarks */}
        <div style={{ background:'#13131A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <span style={{ fontSize:16 }}>📊</span>
            <span style={{ fontSize:12, color:'#C9A84C', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>{t('benchmarks.header')}</span>
          </div>
          {benchmarks.map((b, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', marginBottom:8, borderRadius:8, background: b.highlight ? 'rgba(45,212,191,0.05)' : 'rgba(255,255,255,0.02)', border: b.highlight ? '1px solid #2DD4BF' : '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize:18, fontWeight:800, color: b.highlight ? '#2DD4BF' : '#E53935', minWidth:60 }}>{b.multiple}</div>
              <div style={{ flex:1, fontSize:14, color:'#F5F0E8' }}>{t(`benchmarks.rows.${b.labelKey}`)}</div>
              <div style={{ fontSize:11, color: b.highlight ? '#2DD4BF' : '#6B7280', border: `1px solid ${b.highlight ? '#2DD4BF' : '#374151'}`, borderRadius:4, padding:'3px 10px', whiteSpace:'nowrap' }}>{t(`benchmarks.tags.${b.tagKey}`)}</div>
            </div>
          ))}
          <div style={{ marginTop:16, fontSize:11, color:'#6B7280' }}>{t('benchmarks.sources')}</div>
        </div>

        {/* Right: The Deal in One Line */}
        <div style={{ background:'#13131A', border:'2px solid #C9A84C', borderRadius:10, padding:24 }}>
          <div style={{ fontSize:11, color:'#C9A84C', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:16 }}>{t('oneLine.header')}</div>
          <p style={{ fontSize:14, color:'#F5F0E8', lineHeight:1.7, marginBottom:20 }}>
            <Trans
              ns="market"
              i18nKey="oneLine.body"
              defaults="A proven Borough Market experience venue, acquired at distressed pricing (<gold>{{multiple}}</gold>), distributing via <orange>{{proRata}}</orange> (all shareholders paid at the same time by equity %), with payback driven by <teal>{{cashFlow}}</teal>."
              values={{
                // Multiple flexes with the locked Cover slider — pre-money / 2025 EBITDA.
                multiple: `${deal.impliedMult.toFixed(2)}× EBITDA`,
                proRata: t('oneLine.proRata'),
                cashFlow: t('oneLine.cashFlow'),
              }}
              components={{
                gold: <span style={{ color:'#C9A84C', fontWeight:700 }} />,
                orange: <span style={{ color:'#E67E22', fontWeight:700 }} />,
                teal: <span style={{ color:'#2DD4BF', fontWeight:700 }} />,
              }}
            />
          </p>
          {checkKeys.map((key, i) => (
            <div key={key} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'10px 14px', marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#F5F0E8', marginBottom:2 }}>{t(`oneLine.checks.${key}.title`)}</div>
              <div style={{ fontSize:12, color:'#9CA3AF' }}>{t(`oneLine.checks.${key}.sub`)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Sector Reality */}
        <div style={{ background:'#13131A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <span style={{ fontSize:16 }}>⚠️</span>
            <span style={{ fontSize:12, color:'#EAB308', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>{t('sectorReality.header')}</span>
          </div>
          {sectorKeys.map((key, i) => (
            <div key={key} style={{ marginBottom:14 }}>
              <div style={{ fontSize:13, color:'#D1D5DB' }}>▪ {t(`sectorReality.items.${key}.issue`)}</div>
              <div style={{ fontSize:13, color:'#2DD4BF', paddingLeft:16, marginTop:4 }}>→ {t(`sectorReality.items.${key}.response`)}</div>
            </div>
          ))}
        </div>

        {/* Why This Business is Different */}
        <div style={{ background:'#13131A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <span style={{ fontSize:16 }}>💎</span>
            <span style={{ fontSize:12, color:'#E67E22', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>{t('differentiators.header')}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {differentiatorKeys.map((item) => (
              <div key={item.key} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:14 }}>
                <div style={{ fontSize:22, marginBottom:8 }}>{item.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:item.color, marginBottom:6 }}>{t(`differentiators.items.${item.key}.title`)}</div>
                <div style={{ fontSize:12, color:'#9CA3AF', lineHeight:1.5 }}>{t(`differentiators.items.${item.key}.text`)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
