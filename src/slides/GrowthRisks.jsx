import React from 'react'
import { useTranslation } from 'react-i18next'

const GROWTH_META = [
  { key:'seo',         impact:'high' },
  { key:'ads',         impact:'medium' },
  { key:'corporate',   impact:'high' },
  { key:'dj',          impact:'medium' },
  { key:'repricing',   impact:'low' },
  { key:'development', impact:'strategic' },
]

const RISKS_META = [
  { key:'timeline',   rating:'low' },
  { key:'revenue',    rating:'low' },
  { key:'wage',       rating:'medium' },
  { key:'brand',      rating:'medium' },
  { key:'marketing',  rating:'low' },
  { key:'keyPerson',  rating:'medium' },
]

const IMPACT_COLOR = { high:'#2DD4BF', medium:'#E67E22', low:'#94A3B8', strategic:'#C9A84C' }
const RAG = { low:'#2DD4BF', medium:'#E67E22', high:'#E53935' }

export default function GrowthRisks() {
  const { t } = useTranslation('growth')

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', color:'var(--cream)', marginBottom:8 }}>
        {t('title')}
      </h2>
      <p style={{ color:'var(--cream-dim)', marginBottom:32, fontSize:14 }}>
        {t('subtitle')}
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>

        {/* Growth drivers */}
        <div>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>
            {t('upsideHeader')}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {GROWTH_META.map((g) => (
              <div key={g.key} className="card" style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{
                    fontSize:9, padding:'2px 8px', borderRadius:10,
                    background:`${IMPACT_COLOR[g.impact]}22`, color:IMPACT_COLOR[g.impact],
                    letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600,
                  }}>{t(`impact.${g.impact}`)}</div>
                  <div style={{ fontSize:12, color:'var(--cream)', fontWeight:500 }}>▶ {t(`drivers.${g.key}.driver`)}</div>
                </div>
                <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.5 }}>{t(`drivers.${g.key}.detail`)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk register */}
        <div>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>
            {t('risksHeader')}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {RISKS_META.map((r) => (
              <div key={r.key} className="card" style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{
                    fontSize:9, padding:'2px 8px', borderRadius:10,
                    background:`${RAG[r.rating]}22`, color:RAG[r.rating],
                    letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600,
                    flexShrink:0,
                  }}>{t(`impact.${r.rating}`)}</div>
                  <div style={{ fontSize:12, color:'var(--cream)' }}>{t(`risks.${r.key}.risk`)}</div>
                </div>
                <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.5 }}>{t(`risks.${r.key}.mitigation`)}</div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="card-highlight" style={{ padding:18, marginTop:12 }}>
            <div style={{ fontSize:11, color:'var(--gold)', marginBottom:8 }}>{t('overallHeader')}</div>
            <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.6 }}>
              {t('overallBody')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
