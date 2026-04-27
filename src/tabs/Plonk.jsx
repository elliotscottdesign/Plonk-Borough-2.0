import React, { useState } from 'react'
import MarketingEngine from '../slides/MarketingEngine.jsx'
import IPLicensing from './IPLicensing.jsx'
import PlonkCover from './PlonkCover.jsx'
import PlonkHowItWorks from './PlonkHowItWorks.jsx'
import PlonkSeoMarketing from './PlonkSeoMarketing.jsx'

const TABS = ['Cover', 'How It Works', 'IP & Licensing', 'Digital Marketing', 'SEO Marketing']

export default function Plonk() {
  const [tab, setTab] = useState('Cover')
  const tabComponents = {
    'Cover': <PlonkCover />,
    'How It Works': <PlonkHowItWorks />,
    'IP & Licensing': <IPLicensing />,
    'Digital Marketing': <MarketingEngine />,
    'SEO Marketing': <PlonkSeoMarketing />,
  }
  return (
    <div style={{ minHeight:'100%', background:'var(--ink)', color:'var(--cream)' }}>
      <div style={{ padding:'20px 32px 0', borderBottom:'1px solid rgba(201,168,76,0.12)' }}>
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 16px', fontSize:11, cursor:'pointer', border:'none', background:'transparent', letterSpacing:'0.06em', textTransform:'uppercase', borderBottom:`2px solid ${tab===t?'var(--gold)':'transparent'}`, color:tab===t?'var(--gold)':'var(--cream-dim)', transition:'all 0.15s', whiteSpace:'nowrap' }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:'24px 32px 24px', fontSize:13 }}>{tabComponents[tab]}</div>
      <div style={{ padding:'20px 32px 32px', borderTop:'1px solid rgba(201,168,76,0.12)', marginTop:12 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>Plonk Golf</div>
        <div style={{ fontSize:14, color:'var(--cream-dim)' }}>IP &amp; Licensing · Digital Marketing · dev section</div>
      </div>
    </div>
  )
}
