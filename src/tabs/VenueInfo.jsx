import React, { useState } from 'react'

const TABS = ['Catchment','Location','Floor Plan','Venue Gallery','Course Gallery','Drinks Gallery','Licence','Development']

const STATS = [
  { label:'Capacity', value:'120', sub:'standing / 80 seated' },
  { label:'Site', value:'SE1', sub:'Borough Market, London' },
  { label:'Opened', value:'2022', sub:'Trading since Apr 2022' },
  { label:'Licence', value:'888057', sub:'Southwark Council' },
]

const VENUE_IMGS = [
  { src:'/venue_gallery_1.jpg', caption:'Main bar and entrance area' },
  { src:'/venue_gallery_2.jpg', caption:'Mini golf course overview' },
  { src:'/venue_gallery_3.jpg', caption:'Pool table area' },
  { src:'/venue_gallery_4.jpg', caption:'Bar seating and lounge' },
  { src:'/venue_gallery_5.jpg', caption:'Event space setup' },
  { src:'/venue_gallery_6.jpg', caption:'DJ booth and dance floor' },
  { src:'/venue_gallery_7.jpg', caption:'Air hockey and LED games' },
]

const COURSE_IMGS = [
  { src:'/Borough_Course_1.jpg', caption:'Hole 5 — Belfast cityscape mural' },
  { src:'/Borough_Course_2.jpg', caption:'The bar arch — playing through' },
  { src:'/Borough_Course_3.jpg', caption:'London landmarks course' },
  { src:'/Borough_Course_4.jpg', caption:'London Eye hole — arch 4' },
  { src:'/Borough_Course_5.jpg', caption:'Red telephone box feature hole' },
  { src:'/Borough_Course_6.jpg', caption:"It's a London Thing — arch 3" },
]

const DRINKS_IMGS = [
  { src:'/drinks_1.jpg', caption:'Camden Town Brewery — bar draught' },
  { src:'/drinks_2.jpg', caption:'Cloudwater craft beer selection' },
  { src:'/drinks_3.jpg', caption:"Mondo Brewing — Dennis Hopp'r IPA on tap" },
  { src:'/drinks_4.jpg', caption:'Tropical cocktail — citrus spritz' },
  { src:'/drinks_5.jpg', caption:'Negroni on the rocks' },
  { src:'/drinks_6.jpg', caption:'Rose petal martini' },
  { src:'/drinks_7.jpg', caption:'Espresso martini' },
  { src:'/drinks_8.png', caption:'Borough craft beer range' },
  { src:'/drinks_9.png', caption:'Signature cocktail menu' },
]

function Gallery({ images }) {
  const [active, setActive] = useState(0)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ position:'relative', background:'var(--ink-3)', borderRadius:10, overflow:'hidden', aspectRatio:'16/9' }}>
        <img src={images[active].src} alt={images[active].caption} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 16px', background:'linear-gradient(transparent,rgba(0,0,0,0.7))', color:'#fff', fontSize:13 }}>{images[active].caption}</div>
        {active > 0 && <button onClick={()=>setActive(active-1)} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', border:'none', background:'rgba(0,0,0,0.5)', color:'#fff', cursor:'pointer', fontSize:18 }}>‹</button>}
        {active < images.length-1 && <button onClick={()=>setActive(active+1)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', border:'none', background:'rgba(0,0,0,0.5)', color:'#fff', cursor:'pointer', fontSize:18 }}>›</button>}
      </div>
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
        {images.map((img,i) => (
          <div key={i} onClick={()=>setActive(i)} style={{ flexShrink:0, width:72, height:50, borderRadius:6, overflow:'hidden', cursor:'pointer', border:`2px solid ${i===active?'var(--gold)':'transparent'}`, opacity:i===active?1:0.6, transition:'all 0.15s' }}>
            <img src={img.src} alt={img.caption} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
        ))}
      </div>
      <div style={{ fontSize:12, color:'var(--cream-dim)', textAlign:'center' }}>{active+1} / {images.length}</div>
    </div>
  )
}

function TabCatchment() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:16 }}>
            <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:26, color:'var(--gold)', fontFamily:"'DM Serif Display',serif", marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'var(--cream-dim)' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Catchment Area</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ fontSize:13, color:'var(--cream)', marginBottom:8, fontWeight:500 }}>Primary Catchment (0–5 min walk)</div>
            {['Borough Market — 30,000+ daily visitors','London Bridge Station — 56m passengers/yr','Southwark — 16m annual visitors','The Shard — 1m+ annual visitors'].map(item => (
              <div key={item} style={{ fontSize:12, color:'var(--cream-dim)', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>· {item}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:13, color:'var(--cream)', marginBottom:8, fontWeight:500 }}>Secondary Catchment (5–15 min)</div>
            {['Tate Modern — 4.7m annual visitors','Bankside & Bermondsey','City of London workers','South Bank cultural quarter'].map(item => (
              <div key={item} style={{ fontSize:12, color:'var(--cream-dim)', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>· {item}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabLocation() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Location Details</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            {[['Address','6 Park Street, London SE1 9AB'],['Area','Borough Market'],['Borough','Southwark'],['Nearest Station','London Bridge (2 min walk)'],['Bus Routes','RV1, 21, 35, 40, 133, 343']].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:12, color:'var(--cream-dim)' }}>{l}</span>
                <span style={{ fontSize:12, color:'var(--cream)' }}>{v}</span>
              </div>
            ))}
          </div>
          <div>
            {[['Mon–Thu','11:00 – 23:00'],['Friday','11:00 – 23:30'],['Saturday','10:00 – 23:30'],['Sunday','12:00 – 22:30'],['DPS','Klaudia Ciepluch']].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:12, color:'var(--cream-dim)' }}>{l}</span>
                <span style={{ fontSize:12, color:'var(--cream)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, overflow:'hidden', height:300 }}>
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2483.6!2d-0.0908!3d51.5055!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487604a93b49f6db%3A0x5c6cd91fc3ec62fd!2sBorough%20Market!5e0!3m2!1sen!2suk!4v1" width="100%" height="300" style={{ border:0 }} allowFullScreen loading="lazy" />
      </div>
    </div>
  )
}

function TabFloorPlan() {
  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:16 }}>
      <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Floor Plan</div>
      <img src="/floorplan_1.png" alt="Venue floor plan" style={{ width:'100%', borderRadius:8, objectFit:'contain' }} />
    </div>
  )
}

function TabLicence() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Premises Licence</div>
        {[['Licence Number','888057'],['Issuing Authority','Southwark Council'],['Designated Premises Supervisor','Klaudia Ciepluch'],['Licence Type','Full Premises Licence'],['Activities','Supply of alcohol, regulated entertainment, late night refreshment']].map(([l,v]) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize:12, color:'var(--cream-dim)' }}>{l}</span>
            <span style={{ fontSize:12, color:'var(--cream)', textAlign:'right', maxWidth:'60%' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Licensed Hours</div>
        {[['Monday – Thursday','11:00 – 23:00'],['Friday','11:00 – 23:30'],['Saturday','10:00 – 23:30'],['Sunday','12:00 – 22:30']].map(([l,v]) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize:12, color:'var(--cream-dim)' }}>{l}</span>
            <span style={{ fontSize:13, color:'var(--gold)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabDevelopment() {
  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20 }}>
      <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Growth Opportunities</div>
      {[
        ['Private Hire Expansion','Corporate bookings and private events currently underserved — dedicated sales resource would drive significant uplift'],
        ['Extended Hours','Friday and Saturday late licence extension to 01:00 would capture post-theatre and post-gig trade from The Globe and Tate'],
        ['Digital Marketing Scale','GA4-verified £0.32 CPC — increasing Google Ads budget from £7,200 to £15,000 p.a. projects 2× booking volume'],
        ['Menu Development','Hot food licence not currently utilised — small sharing plates would increase dwell time and spend per head'],
        ['Membership Scheme','Monthly membership model (£25/mo) for regular players — recurring revenue and loyalty'],
        ['Corporate Packages','Bespoke team event packages — currently booked ad hoc, no structured offering'],
      ].map(([title, desc]) => (
        <div key={title} style={{ padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize:13, color:'var(--gold)', marginBottom:5 }}>{title}</div>
          <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>{desc}</div>
        </div>
      ))}
    </div>
  )
}

export default function VenueInfo() {
  const [tab, setTab] = useState('Catchment')
  const tabComponents = {
    'Catchment': <TabCatchment />,
    'Location': <TabLocation />,
    'Floor Plan': <TabFloorPlan />,
    'Venue Gallery': <Gallery images={VENUE_IMGS} />,
    'Course Gallery': <Gallery images={COURSE_IMGS} />,
    'Drinks Gallery': <Gallery images={DRINKS_IMGS} />,
    'Licence': <TabLicence />,
    'Development': <TabDevelopment />,
  }
  return (
    <div style={{ minHeight:'100%', background:'var(--ink)', color:'var(--cream)' }}>
      <div style={{ padding:'20px 32px 0', borderBottom:'1px solid rgba(201,168,76,0.12)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>No Dice Borough Ltd</div>
            <div style={{ fontSize:14, color:'var(--cream-dim)' }}>Venue Information · 6 Park Street SE1</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 16px', fontSize:11, cursor:'pointer', border:'none', background:'transparent', letterSpacing:'0.08em', textTransform:'uppercase', borderBottom:`2px solid ${tab===t?'var(--gold)':'transparent'}`, color:tab===t?'var(--gold)':'var(--cream-dim)', transition:'all 0.15s', whiteSpace:'nowrap' }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:'24px 32px 48px' }}>{tabComponents[tab]}</div>
    </div>
  )
}