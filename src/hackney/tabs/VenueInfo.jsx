import React, { useState } from 'react'

// VenueInfo — clones Borough's sub-tab structure exactly. Hackney venue
// data sourced from https://www.plonkgolf.co.uk/venue/plonk-hackney/
// (the historical Plonk Hackney site listing) — site-level facts apply to
// the bar-only relaunch even though the published page predates the
// restatement. Mini-golf-specific copy is intentionally left out: the
// bar-only entity excludes mini golf operations.

const TABS = [
  { key: 'catchment',     label: 'Catchment' },
  { key: 'location',      label: 'Location' },
  { key: 'floorPlan',     label: 'Floor Plan' },
  { key: 'venueGallery',  label: 'Venue Gallery' },
  { key: 'courseGallery', label: 'Games & Activities' },   // repurposed for bar-only
  { key: 'drinksGallery', label: 'Drinks Gallery' },
  { key: 'licence',       label: 'Licence' },
  { key: 'development',   label: 'Development' },
]

const VENUE_IMGS = [
  { src: '/hackney/garden/g3.jpg',     caption: 'London Fields venue exterior — under the railway arches' },
  { src: '/hackney/garden/g1.jpg',     caption: 'Garden — outdoor trading area, plane trees overhead' },
  { src: '/hackney/garden/g4.jpg',     caption: 'Garden — afternoon trade' },
  { src: '/hackney/cocktails/c1.jpg',  caption: 'Bar — cocktail service' },
  { src: '/hackney/pool/p1.jpg',       caption: 'Pool nights' },
  { src: '/hackney/tacos/t1.jpg',      caption: 'Events — El Caravana taco residency' },
  { src: '/hackney/garden/g6.jpg',     caption: 'Garden — late afternoon' },
]
const DRINKS_IMGS = [
  { src: '/hackney/cocktails/c1.jpg', caption: 'Rotating seasonal cocktails — Tiki-styled bar' },
  { src: '/hackney/cocktails/c2.jpg', caption: 'Two cocktails for £12 weekday until 7pm' },
  { src: '/hackney/cocktails/c3.jpg', caption: 'Local craft draught beer + wines, mocktails, low-alcohol' },
  { src: '/hackney/cocktails/c4.jpg', caption: 'Bar service' },
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

function Row({ label, value, gold }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize:12, color:'var(--cream-dim)', paddingRight:16 }}>{label}</span>
      <span style={{ fontSize:12, color:gold?'var(--gold)':'var(--cream)', textAlign:'right' }}>{value}</span>
    </div>
  )
}

function Card({ title, children, accent='var(--gold)' }) {
  return (
    <div className="card" style={{ padding:20 }}>
      <div style={{ fontSize:11, color:accent, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12, fontWeight:500 }}>{title}</div>
      {children}
    </div>
  )
}

function TabCatchment() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Catchment & Footfall</STitle>
      <Tbd>Catchment area stats (footfall counts, household income, demographic split, search volumes, organic share). Borough's equivalent shows 6 stat tiles — populate from local Hackney/London Fields footfall data + GA4 once available.</Tbd>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card title="Neighbourhood">
          <div style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6 }}>
            London Fields, E8. Established East London late-night destination. Sits on a stretch of railway-arch venues directly under the plane trees of London Fields park, between Broadway Market and Mare Street.
          </div>
        </Card>
        <Card title="Walk-time anchors">
          <Row label="London Fields Overground" value="2 min" gold />
          <Row label="Broadway Market" value="5 min" />
          <Row label="Hackney Central Overground" value="10 min" />
          <Row label="Mare Street / Richmond Road buses" value="couple min" />
        </Card>
      </div>
    </div>
  )
}

function TabLocation() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Location</STitle>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card title="Address">
          <Row label="Arch 407 Mentmore Terrace" value="London E8 3PP" gold />
          <Row label="Main entrance" value="On Parkside" />
          <Row label="Site type" value="Railway-arch venue" />
        </Card>
        <Card title="Transport">
          <Row label="London Fields (Overground)" value="2 min" gold />
          <Row label="Hackney Central (Overground)" value="10 min" />
          <Row label="Buses" value="Mare St · Richmond Rd" />
          <Row label="Broadway Market" value="5 min walk" />
        </Card>
      </div>

      <Card title="Directions from London Fields station">
        <div style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6 }}>
          Turn left out of the station, then left again under the bridge. Entrance on Parkside.
        </div>
      </Card>

      <Tbd>Embed a map view (Mapbox / Leaflet / static image). Confirm exact pin coordinates with the lease before launch.</Tbd>
    </div>
  )
}

function TabFloorPlan() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Floor Plan</STitle>
      <Tbd>Architectural floor plan with capacity zones — bar position, garden, pool tables, arcade, kitchen, accessibility (DDA toilet). Drop a PNG/SVG into <code>public/hackney/</code> and reference it here.</Tbd>
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

// "Course Gallery" repurposed — bar-only entity excludes mini golf, so this
// sub-tab now lists in-venue games & activities (pool, arcades, garden games).
function TabCourseGallery() {
  const games = [
    { title: 'American Pool',        detail: '2 × 7ft × 4ft tables · £5 per 30 minutes · 18+',                                                accent: '#4FC3F7' },
    { title: 'Pinball machines',     detail: 'Rotating cabinets — multi-game retro, shoot \'em ups, themed pinball',                          accent: '#C9A84C' },
    { title: 'Skeeball',             detail: 'Vintage machine exclusive to Hackney site · score 270+ for a free cocktail',                    accent: '#2DD4BF' },
    { title: 'Foosball',             detail: 'Indoor table-football · open play',                                                              accent: '#E67E22' },
    { title: 'Ping pong (garden)',   detail: 'Top-of-the-line tables in the beer garden',                                                      accent: '#A78BFA' },
    { title: 'Board & bar games',    detail: '"Tons" of board games available at the bar — Scrabble through party packs',                     accent: '#F59E0B' },
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Games & Activities (bar-only entity)</STitle>
      <Tbd>Mini golf is excluded from the No Dice Hackney bar-only entity — kept for parity with Borough's structure but repurposed as the in-venue games inventory.</Tbd>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {games.map(g => (
          <div key={g.title} className="card" style={{ padding:16, borderLeft:`3px solid ${g.accent}` }}>
            <div style={{ fontSize:13, color:'var(--cream)', fontWeight:500, marginBottom:6 }}>{g.title}</div>
            <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.5 }}>{g.detail}</div>
          </div>
        ))}
      </div>

      <Card title="Events programme (recurring)">
        <Row label="Doubles Pool Tournament" value="2nd & 4th Wed · 8 slots · prizes £200+" gold />
        <Row label="Date Night" value="Tue–Thu evenings" />
        <Row label="Bottomless Brunch" value="Sundays" />
        <Row label="El Caravana Tacos residency" value="Tue–Sat" />
      </Card>
    </div>
  )
}

function TabDrinksGallery() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Drinks Gallery</STitle>
      <Gallery images={DRINKS_IMGS} />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card title="Bar offering">
          <Row label="Rotating seasonal cocktails" value="Tiki-styled" gold />
          <Row label="Local craft draught beer" value="On rotation" />
          <Row label="Wines" value="House + reserve list" />
          <Row label="Mocktails / low-alcohol" value="Available" />
          <Row label="Exotic juices" value="Available" />
        </Card>
        <Card title="Recurring offers">
          <Row label="Two cocktails for £12" value="Weekday · until 7pm" gold />
          <Row label="Taco Tuesday" value="£5 for two" />
          <Row label="Bottomless Brunch" value="Sundays" />
          <Row label="Date Night" value="Tue–Thu evenings" />
        </Card>
      </div>
    </div>
  )
}

function TabLicence() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Premises Licence</STitle>
      <Tbd>Licensable activities, opening hours, conditions, Designated Premises Supervisor, and capacity from the Hackney Council Licensing record. Public site shows access policy summary below — full licence detail TBD.</Tbd>

      <Card title="Access policy (from the published site)">
        <Row label="Under-18s" value="Welcome before 5pm weekdays only" />
        <Row label="After 5pm weekdays" value="Adults only" />
        <Row label="Weekends" value="Adults only" />
        <Row label="Pool tables" value="Under-16s prohibited" />
        <Row label="Accompanied minors" value="Must be with a paying adult" />
      </Card>
    </div>
  )
}

function TabDevelopment() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <STitle>Development Pipeline</STitle>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card title="In-scope at Day 1">
          <Row label="Garden refurbishment" value="£12,000 inc VAT" gold />
          <Row label="Interior completion + signage" value="£10,000 inc VAT" gold />
          <Row label="Stock purchase from liquidators" value="£42,000 inc VAT" />
          <Row label="3-month rent deposit" value="£26,750 inc VAT" />
        </Card>
        <Card title="Capacity / hire">
          <Row label="Private hire" value="Up to 60 people" gold />
          <Row label="Group bookings" value="12+ contact venue" />
          <Row label="Garden — open trading" value="Plane trees, ping pong" />
        </Card>
      </div>

      <Tbd>Future capacity uplift opportunities (licence variations, kitchen extension, garden-cover scheme, basement reclaim if applicable). Document any contractual rights in the lease that map to development optionality.</Tbd>
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
