import React, { useState } from 'react'

// Plonk — clones Borough's Plonk tab structure. Borough uses this as the
// "franchise / IP & Licensing dev area" — Plonk Golf running an online
// booking + commission platform across multiple venues.
//
// For Hackney as a bar-only entity this isn't directly in scope. The shell
// is replicated for structural parity; sub-tabs render TBD placeholders so
// we can decide later whether Hackney participates in the Plonk Golf model
// (online ticket commission, IP licensing) or if this tab is removed.
//
// Borough sub-tabs: Cover · How It Works · IP & Licensing · Digital Marketing · SEO Marketing

const TABS = ['Cover', 'How It Works', 'IP & Licensing', 'Digital Marketing', 'SEO Marketing']

function STitle({ children }) {
  return <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>{children}</div>
}

function Tbd({ children }) {
  return (
    <div style={{ padding:'14px 18px', borderRadius:10, background:'rgba(201,168,76,0.06)', border:'1px dashed rgba(201,168,76,0.35)', color:'var(--cream-dim)', fontSize:12, lineHeight:1.6 }}>
      <span style={{ color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginRight:8, fontWeight:600 }}>TBD</span>
      {children}
    </div>
  )
}

function PlonkCover() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Plonk Golf — Cover</STitle>
      <Tbd>Borough's Plonk Cover introduces the franchise/IP development side of the business. For Hackney bar-only, decide: (a) include a Hackney-relevant Plonk Golf relationship narrative, (b) leave as structural placeholder, or (c) remove the Plonk top-tab from the Hackney deck.</Tbd>
    </div>
  )
}

function PlonkHowItWorks() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>How It Works</STitle>
      <Tbd>Borough's "How It Works" walks through the licensing flow: venue runs the Plonk-branded experience under licence; Plonk Golf handles online sales, takes a commission. Hackney equivalent depends on whether Hackney joins this model — TBD.</Tbd>
    </div>
  )
}

function IPLicensing() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>IP & Licensing</STitle>
      <Tbd>Borough's IP & Licensing tab shows the SKU-by-SKU online vs office split, monthly volumes, commission economics, and the new model's commission/booking-fee structure. Hackney bar-only doesn't run mini golf so the SKU set is N/A — empty stubs are kept in <code>data/hackney.js</code> so the import doesn't break.</Tbd>
    </div>
  )
}

function DigitalMarketing() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Digital Marketing</STitle>
      <Tbd>Borough's Digital Marketing tab models Google Ads, SEO and ticket-uplift forecasts. Hackney runs zero paid Google Ads — populate with Hackney's organic / local listings / events split or remove if not used.</Tbd>
    </div>
  )
}

function SeoMarketing() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>SEO Marketing</STitle>
      <Tbd>Borough's SEO tab covers organic search recovery (the 32% drop from the Plonk→No Dice rebrand). Hackney equivalent: GA4 baseline + local-search ranking plan + 301 redirect strategy. TBD.</Tbd>
    </div>
  )
}

export default function Plonk() {
  const [tab, setTab] = useState('Cover')
  const tabComponents = {
    'Cover':              <PlonkCover />,
    'How It Works':       <PlonkHowItWorks />,
    'IP & Licensing':     <IPLicensing />,
    'Digital Marketing':  <DigitalMarketing />,
    'SEO Marketing':      <SeoMarketing />,
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
