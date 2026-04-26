import React from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../i18n/format.js'
import { STOCK_SETUP_DETAIL, HARDWARE_BREAKDOWN } from '../data.js'

export default function UseOfFunds() {
  const { t, i18n } = useTranslation('funds')
  const { t: tc } = useTranslation('common')
  const lang = i18n.language
  const fmt = (n) => formatCurrency(n, lang)
  const vatLabel = tc('units.incVat')

  const funds = [
    { key:'rent',     color:'#8B5CF6', pct:34.3, amount:27078, vat:vatLabel, icon:'🏠' },
    { key:'hardware', color:'#4FC3F7', pct:30.4, amount:24000, vat:vatLabel, icon:'🔧' },
    { key:'ip',       color:'#C9A84C', pct:15.2, amount:12000, vat:vatLabel, icon:'⭐' },
    { key:'stock',    color:'#2DD4BF', pct: 6.2, amount: 4900, vat:vatLabel, icon:'📦' },
    { key:'working',  color:'#6B7280', pct:14.0, amount:11022, vat:null,     icon:'💼' },
  ]

  // Mapping of STOCK_SETUP_DETAIL items to translation keys + icons. Keep order matching data.js.
  const setupItems = [
    { key:'alcohol',  amount:1500, icon:'🍾' },
    { key:'soft',     amount: 300, icon:'🥤' },
    { key:'ice',      amount:  30, icon:'🧊' },
    { key:'cleaning', amount: 250, icon:'🧽' },
    { key:'internet', amount: 300, icon:'📡' },
    { key:'app',      amount: 200, icon:'📱' },
    { key:'xero',     amount:  75, icon:'📊' },
    { key:'rota',     amount:  75, icon:'🗓️' },
    { key:'google',   amount:  75, icon:'🗂️' },
    { key:'spotify',  amount:  60, icon:'🎵' },
    { key:'supplier', amount: 135, icon:'🤝' },
    { key:'rates',    amount:1800, icon:'🏛️' },
    { key:'licence',  amount: 100, icon:'📜' },
  ]
  const setupTotal = setupItems.reduce((s, i) => s + i.amount, 0)

  // Hardware breakdown — amounts shown EX VAT (sum to £20,000 ex VAT = £24,000 inc VAT).
  const hardwareItems = [
    { key:'minigolf', amount: 4000, icon:'⛳' },
    { key:'barEquip', amount:10000, icon:'🍻' },
    { key:'wetStock', amount: 2000, icon:'🔧' },
    { key:'arcade',   amount: 4000, icon:'🕹️' },
  ]
  const hardwareExVat = hardwareItems.reduce((s, i) => s + i.amount, 0)
  const hardwareIncVat = Math.round(hardwareExVat * 1.2)

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
      <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:'16px 20px', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--cream)', letterSpacing:'0.06em' }}>{t('bannerHeader')}</div>
          <div style={{ fontSize:12, color:'#9CA3AF' }}>{t('bannerNote')}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          <div style={{ background:'rgba(234,88,12,0.1)', border:'1px solid rgba(234,88,12,0.3)', borderRadius:8, padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#EA580C', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>{t('day1.label')}</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#EA580C', marginBottom:4 }}>£67,978</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{t('day1.sub')}</div>
          </div>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'2px solid rgba(201,168,76,0.4)', borderRadius:8, padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#C9A84C', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>{t('working.label')}</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#C9A84C', marginBottom:4 }}>£11,022</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{t('working.sub')}</div>
          </div>
          <div style={{ background:'rgba(45,212,191,0.08)', border:'1px solid rgba(45,212,191,0.3)', borderRadius:8, padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#2DD4BF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>{t('vatReclaim.label')}</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#2DD4BF', marginBottom:4 }}>£6,500</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{t('vatReclaim.sub')}</div>
          </div>
        </div>
      </div>

      {/* Stock & Operational Setup — itemised £3,000 detail */}
      <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:'20px 24px', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, color:'#2DD4BF', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>{t('setup.eyebrow')}</div>
            <h3 className="serif" style={{ fontSize:22, color:'var(--cream)', margin:0 }}>{t('setup.title')}</h3>
          </div>
          <div style={{ fontSize:11, color:'#9CA3AF', maxWidth:340, textAlign:'right' }}>{t('setup.subtitle')}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
          {setupItems.map(item => (
            <div key={item.key} style={{ background:'rgba(45,212,191,0.04)', border:'1px solid rgba(45,212,191,0.15)', borderRadius:6, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:18, flexShrink:0, lineHeight:1 }}>{item.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--cream)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t(`setup.items.${item.key}.label`)}</div>
                <div style={{ fontSize:10, color:'#9CA3AF', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t(`setup.items.${item.key}.note`)}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:'#2DD4BF', flexShrink:0 }}>{fmt(item.amount)}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid rgba(45,212,191,0.2)', marginTop:14, paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#9CA3AF' }}>{t('setup.totalLabel')}</span>
          <span style={{ fontSize:14, fontWeight:700, color:'#2DD4BF' }}>{fmt(setupTotal)} {vatLabel}</span>
        </div>
      </div>

      {/* Hardware from Liquidators — itemised £20,000 ex VAT detail */}
      <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, color:'#4FC3F7', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>{t('hardware.eyebrow')}</div>
            <h3 className="serif" style={{ fontSize:22, color:'var(--cream)', margin:0 }}>{t('hardware.title')}</h3>
          </div>
          <div style={{ fontSize:11, color:'#9CA3AF', maxWidth:340, textAlign:'right' }}>{t('hardware.subtitle')}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
          {hardwareItems.map(item => (
            <div key={item.key} style={{ background:'rgba(79,195,247,0.04)', border:'1px solid rgba(79,195,247,0.18)', borderRadius:6, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontSize:24, flexShrink:0, lineHeight:1 }}>{item.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--cream)', marginBottom:2 }}>{t(`hardware.items.${item.key}.label`)}</div>
                <div style={{ fontSize:11, color:'#9CA3AF', lineHeight:1.4 }}>{t(`hardware.items.${item.key}.note`)}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#4FC3F7' }}>{fmt(item.amount)}</div>
                <div style={{ fontSize:9, color:'#6B7280', letterSpacing:'0.06em', textTransform:'uppercase' }}>ex VAT</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid rgba(79,195,247,0.25)', marginTop:14, paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#9CA3AF' }}>{t('hardware.totalLabel')}</span>
          <span style={{ fontSize:14, fontWeight:700, color:'#4FC3F7' }}>{fmt(hardwareExVat)} ex VAT  ·  {fmt(hardwareIncVat)} {vatLabel}</span>
        </div>
      </div>
    </div>
  )
}
