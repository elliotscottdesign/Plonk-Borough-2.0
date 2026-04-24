import React from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../i18n/format.js'

export default function UseOfFunds() {
  const { t, i18n } = useTranslation('funds')
  const { t: tc } = useTranslation('common')
  const lang = i18n.language
  const fmt = (n) => formatCurrency(n, lang)
  const vatLabel = tc('units.incVat')

  const funds = [
    { key:'rent',     color:'#8B5CF6', pct:38.7, amount:27078, vat:vatLabel, icon:'🏠' },
    { key:'hardware', color:'#4FC3F7', pct:21.4, amount:15000, vat:vatLabel, icon:'🔧' },
    { key:'ip',       color:'#C9A84C', pct:17.1, amount:12000, vat:vatLabel, icon:'⭐' },
    { key:'stock',    color:'#2DD4BF', pct:11.4, amount:8000,  vat:vatLabel, icon:'📦' },
    { key:'working',  color:'#6B7280', pct:11.3, amount:7922,  vat:null,     icon:'💼' },
  ]

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 4px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:12, color:'#4FC3F7', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>{t('eyebrow')}</div>
        <h2 className="serif" style={{ fontSize:'clamp(2rem, 4vw, 3rem)', color:'var(--cream)', marginBottom:8 }}>{t('title')}</h2>
        <p style={{ fontSize:14, color:'#9CA3AF' }}>{t('subtitle')}</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:24 }}>
          <div style={{ fontSize:12, color:'#4FC3F7', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:20 }}>{t('allocation')}</div>
          <div style={{ display:'flex', height:32, borderRadius:6, overflow:'hidden', marginBottom:24 }}>
            {funds.map(f => {
              const label = t(`items.${f.key}.label`)
              return <div key={f.key} style={{ width:f.pct+'%', background:f.color }} title={`${label}: ${fmt(f.amount)}${f.vat ? ' ' + f.vat : ''} · ${f.pct}%`} />
            })}
          </div>
          {funds.map(f => (
            <div key={f.key} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ width:12, height:12, borderRadius:2, background:f.color, flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:600, color:'var(--cream)', flex:1 }}>{t(`items.${f.key}.label`)}</span>
                {f.vat && <span style={{ fontSize:10, color:f.color, border:`1px solid ${f.color}`, borderRadius:3, padding:'1px 6px' }}>{f.vat}</span>}
                <span style={{ fontSize:13, color:f.color, fontWeight:600, minWidth:36, textAlign:'right' }}>{f.pct}%</span>
                <span style={{ fontSize:13, fontWeight:700, color:f.color, minWidth:64, textAlign:'right' }}>{fmt(f.amount)}</span>
              </div>
              <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, marginLeft:20 }}>
                <div style={{ height:'100%', width:f.pct+'%', background:f.color, borderRadius:2 }} />
              </div>
            </div>
          ))}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', marginTop:8, paddingTop:12, display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--cream)', letterSpacing:'0.06em' }}>{t('total')}</span>
            <span style={{ fontSize:16, fontWeight:700, color:'#C9A84C' }}>{t('totalAmount')}</span>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {funds.map(f => (
            <div key={f.key} style={{ background:'#0D1117', border:'1px solid #21262D', borderLeft:`3px solid ${f.color}`, borderRadius:8, padding:'14px 18px', display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ fontSize:22, flexShrink:0 }}>{f.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:'var(--cream)' }}>{t(`items.${f.key}.label`)}</span>
                  <span style={{ fontSize:12, color:f.color, fontWeight:600, marginLeft:'auto' }}>{f.pct}%</span>
                  <span style={{ fontSize:14, fontWeight:700, color:f.color }}>{fmt(f.amount)}</span>
                </div>
                <div style={{ fontSize:12, color:'#9CA3AF', lineHeight:1.5 }}>{t(`items.${f.key}.desc`)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--cream)', letterSpacing:'0.06em' }}>{t('bannerHeader')}</div>
          <div style={{ fontSize:12, color:'#9CA3AF' }}>{t('bannerNote')}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          <div style={{ background:'rgba(234,88,12,0.1)', border:'1px solid rgba(234,88,12,0.3)', borderRadius:8, padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#EA580C', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>{t('day1.label')}</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#EA580C', marginBottom:4 }}>£62,078</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{t('day1.sub')}</div>
          </div>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'2px solid rgba(201,168,76,0.4)', borderRadius:8, padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#C9A84C', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>{t('working.label')}</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#C9A84C', marginBottom:4 }}>£7,922</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{t('working.sub')}</div>
          </div>
          <div style={{ background:'rgba(45,212,191,0.08)', border:'1px solid rgba(45,212,191,0.3)', borderRadius:8, padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#2DD4BF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>{t('vatReclaim.label')}</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#2DD4BF', marginBottom:4 }}>£5,833</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{t('vatReclaim.sub')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
