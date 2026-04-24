import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Cover() {
  const { t } = useTranslation('cover')

  const stats = [
    { label: t('stats.seeking.label'), value: '£70,000 inc VAT', sub: t('stats.seeking.sub') },
    { label: t('stats.verifiedRevenue.label'), value: '£741,644', sub: t('stats.verifiedRevenue.sub') },
    { label: t('stats.year1Return.label'), value: '£62,000', sub: t('stats.year1Return.sub') },
    { label: t('stats.distribution.label'), value: t('stats.distribution.value'), sub: t('stats.distribution.sub') },
    { label: t('stats.forecast.label'), value: '£852,891', sub: t('stats.forecast.sub') },
    { label: t('stats.valuation.label'), value: '0.76×', sub: t('stats.valuation.sub') },
  ]

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:48 }}>
        <div style={{ fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--gold)', marginBottom:16 }}>
          {t('eyebrow')}
        </div>
        <h1 className="serif" style={{ fontSize:'clamp(3rem,7vw,5.5rem)', lineHeight:1, color:'var(--cream)', marginBottom:20 }}>
          No Dice<br/>Borough
        </h1>
        <p style={{ fontSize:18, color:'var(--cream-dim)', maxWidth:520, lineHeight:1.6 }}>
          {t('lede')}
        </p>
      </div>

      <div style={{ height:1, background:'linear-gradient(90deg,transparent,var(--gold),transparent)', marginBottom:40 }} />

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
