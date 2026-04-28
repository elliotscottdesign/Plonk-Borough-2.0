import React, { useState } from 'react'

// VenueInfo — clones Borough's sub-tab structure exactly:
//   Catchment · Location · Floor Plan · Venue Gallery · Course Gallery
//   · Drinks Gallery · Licence · Development
//
// Each sub-tab is a SKELETON for the framework — it renders the same shell
// (sub-tab nav + section headers) with TBD placeholders inside. Populate
// each one as Hackney's underlying data lands. Galleries already use the
// curated photo set in public/hackney/.

const TABS = [
  { key: 'catchment',     label: 'Catchment' },
  { key: 'location',      label: 'Location' },
  { key: 'floorPlan',     label: 'Floor Plan' },
  { key: 'venueGallery',  label: 'Venue Gallery' },
  { key: 'courseGallery', label: 'Course Gallery' },
  { key: 'drinksGallery', label: 'Drinks Gallery' },
  { key: 'licence',       label: 'Licence' },
  { key: 'development',   label: 'Development' },
]

const VENUE_IMGS = [
  { src: '/hackney/garden/g3.jpg',     caption: 'London Fields venue exterior — railway arches, garden, bus' },
  { src: '/hackney/garden/g1.jpg',     caption: 'Garden — outdoor trading area' },
  { src: '/hackney/garden/g4.jpg',     caption: 'Garden — afternoon trade' },
  { src: '/hackney/cocktails/c1.jpg',  caption: 'Bar — cocktail service' },
  { src: '/hackney/pool/p1.jpg',       caption: 'Pool nights' },
  { src: '/hackney/tacos/t1.jpg',      caption: 'Events — Tacos collab' },
  { src: '/hackney/garden/g6.jpg',     caption: 'Garden — late afternoon' },
]
const DRINKS_IMGS = [
  { src: '/hackney/cocktails/c1.jpg', caption: 'Cocktail 1' },
  { src: '/hackney/cocktails/c2.jpg', caption: 'Cocktail 2' },
  { src: '/hackney/cocktails/c3.jpg', caption: 'Cocktail 3' },
  { src: '/hackney/cocktails/c4.jpg', caption: 'Cocktail 4' },
]

function Gallery({ images }) {
  const [active, setActive] = useState(0)
  if (images.length === 0) return <Tbd>No photos available yet — add to public/hackney/ to populate.</Tbd>
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ position:'relative', background:'var(--ink-3)', borderRadius:10, overflow:'hidden', aspectRatio:'16/9' }}>
        <img src={images[active].src} alt={images[active].caption} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 16px', background:'linear-gradient(transparent,rgba(0,0,0,0.7))', color:'#fff', fontSize:13 }}>{images[active].caption}</div>
        {active > 0 && <button onClick={()=>setActive(active-1)} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', border:'none', background:'rgba(0,0,0,0.5)', color:'#fff', cursor:'pointer', fontSize:18 }}>&#8249;</button>}
        {active < images.length-1 && <button onClick={()=>setActive(active+1)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', border:'none', background:'rgba(0,0,0,0.5)', color:'#fff', cursor:'pointer', fontSize:18 }}>&#8250;</button>}
      </div>
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
        {images.map((img,i) => (
          <div key={i} onClick={()=>setActive(i)} style={{ flexShrink:0, width:72, height:50, borderRadius:6, overflow:'hidden', cursor:'pointer', border:`2px solid ${i===active?'var(--gold)':'transparent'}`, opacity:i===active?1:0.6 }}>
            <img src={img.src} alt={img.caption} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
        ))}
      </div>
      <div style={{ fontSize:12, color:'var(--cream-dim)', textAlign:'center' }}>{active+1} / {images.length}</div>
    </div>
  )
}

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

function TabCatchment() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Catchment & Footfall</STitle>
      <Tbd>Catchment area stats (footfall, visitor numbers, average household income, demographic split, search volumes, organic share). Mirrors Borough's 6-stat catchment grid — populate from local Hackney/London Fields data sources.</Tbd>
    </div>
  )
}

function TabLocation() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Location</STitle>
      <Tbd>Map embed, street address, transport links (Overground, buses), nearby anchors (Broadway Market, London Fields park, Westgate Street arches).</Tbd>
    </div>
  )
}

function TabFloorPlan() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Floor Plan</STitle>
      <Tbd>Architectural floor plan with capacity zones, bar position, garden, pool table layout, arcade, kitchen, accessibility. Provide as PNG/SVG and reference here.</Tbd>
    </div>
  )
}

function TabVenueGallery() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Venue Gallery</STitle>
      <Gallery images={VENUE_IMGS} />
    </div>
  )
}

function TabCourseGallery() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Course Gallery</STitle>
      <Tbd>Mini golf is excluded from the bar-only entity — this sub-tab kept to mirror Borough's structure. Populate with games (pool, arcades, board games) imagery, or leave empty if redundant for Hackney.</Tbd>
    </div>
  )
}

function TabDrinksGallery() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Drinks Gallery</STitle>
      <Gallery images={DRINKS_IMGS} />
    </div>
  )
}

function TabLicence() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Premises Licence</STitle>
      <Tbd>Premises licence summary — licensable activities, hours, conditions, designated premises supervisor, capacity. Sourced from the Hackney Licensing record.</Tbd>
    </div>
  )
}

function TabDevelopment() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Development Pipeline</STitle>
      <Tbd>Capacity uplift opportunities — garden refurb (£12k in Use of Funds), interior completion, signage, future licence variations. Mirror Borough's "Development Licence" detail with Hackney equivalents.</Tbd>
    </div>
  )
}

export default function VenueInfo() {
  const [tab, setTab] = useState('catchment')
  const tabComponents = {
    catchment:     <TabCatchment />,
    location:      <TabLocation />,
    floorPlan:     <TabFloorPlan />,
    venueGallery:  <TabVenueGallery />,
    courseGallery: <TabCourseGallery />,
    drinksGallery: <TabDrinksGallery />,
    licence:       <TabLicence />,
    development:   <TabDevelopment />,
  }
  return (
    <div style={{ minHeight:'100%', background:'var(--ink)', color:'var(--cream)' }}>
      <div style={{ padding:'20px 32px 0', borderBottom:'1px solid rgba(201,168,76,0.12)' }}>
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding:'8px 16px', fontSize:11, cursor:'pointer', border:'none', background:'transparent', letterSpacing:'0.06em', textTransform:'uppercase', borderBottom:`2px solid ${tab===t.key?'var(--gold)':'transparent'}`, color:tab===t.key?'var(--gold)':'var(--cream-dim)', transition:'all 0.15s', whiteSpace:'nowrap' }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:'24px 32px 24px' }}>{tabComponents[tab]}</div>
    </div>
  )
}
