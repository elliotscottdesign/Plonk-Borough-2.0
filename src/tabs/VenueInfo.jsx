import React, { useState } from 'react'

const TABS = ['Catchment','Location','Floor Plan','Venue Gallery','Course Gallery','Drinks Gallery','Licence','Development']

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
  { src:'/Borough_Course_1.jpg', caption:'Hole 5' },
  { src:'/Borough_Course_2.jpg', caption:'The bar arch' },
  { src:'/Borough_Course_3.jpg', caption:'London landmarks course' },
  { src:'/Borough_Course_4.jpg', caption:'London Eye hole' },
  { src:'/Borough_Course_5.jpg', caption:'Red telephone box feature hole' },
  { src:'/Borough_Course_6.jpg', caption:'A London Thing' },
]
const DRINKS_IMGS = [
  { src:'/drinks_1.jpg', caption:'Camden Town Brewery draught' },
  { src:'/drinks_2.jpg', caption:'Cloudwater craft beer selection' },
  { src:'/drinks_3.jpg', caption:'Mondo Brewing IPA on tap' },
  { src:'/drinks_4.jpg', caption:'Tropical cocktail' },
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

function Row({ label, value, gold }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize:12, color:'var(--cream-dim)', paddingRight:16 }}>{label}</span>
      <span style={{ fontSize:12, color:gold?'var(--gold)':'var(--cream)', textAlign:'right' }}>{value}</span>
    </div>
  )
}

function STitle({ children }) {
  return <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>{children}</div>
}

function TabCatchment() {
  const stats = [
    { value:'130K+', label:'LONDON BRIDGE FOOTFALL', sub:'daily station passengers', source:'TfL 2024', color:'#4FC3F7' },
    { value:'15-20M', label:'BOROUGH MARKET VISITORS', sub:'annual visitors to the area', source:'Borough Market Trust', color:'#4FC3F7' },
    { value:'£57K', label:'SE1 MEDIAN INCOME', sub:'household income', source:'ONS 2024', color:'#2DD4BF' },
    { value:'48%', label:'AGE 25–44', sub:'of SE1 residents', source:'Census 2021', color:'#4FC3F7' },
    { value:'90,475', label:'VENUE PAGE VIEWS 2025', sub:'verified GA4', source:'Google Analytics', color:'#4FC3F7' },
    { value:'58%', label:'ORGANIC SEARCH SHARE', sub:'of all traffic', source:'GA4 2025', color:'#2DD4BF' },
  ]
  const strengths = [
    { icon:'🏢', title:'City Worker Proximity', text:'The Square Mile is within 10-minute walking distance. Corporate lunch, after-work and team-building bookings are a core revenue opportunity.' },
    { icon:'🎓', title:'Young Professional Base', text:'48% of SE1 residents are aged 25–44 — the primary spending demographic for experience-led hospitality.' },
    { icon:'✈️', title:'International Tourism', text:'Borough Market and The Shard draw millions of international visitors annually. No Dice Borough is a natural tourist magnet — an experience venue with no paid acquisition cost.' },
    { icon:'🌙', title:'Evening Economy', text:'London Bridge is a major night economy hub. Friday and Saturday footfall is exceptional with no enforced curfew on experience venues.' },
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:24 }}>
            <div style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:800, color:s.color, lineHeight:1, marginBottom:10 }}>{s.value}</div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--cream)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:13, color:'var(--cream-dim)', marginBottom:6 }}>{s.sub}</div>
            <div style={{ fontSize:12, color:'var(--cream-dim)', fontStyle:'italic' }}>{s.source}</div>
          </div>
        ))}
      </div>
      <div style={{ border:'1px solid rgba(201,168,76,0.2)', borderRadius:10, padding:24 }}>
        <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:20 }}>Catchment Strengths</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {strengths.map(s => (
            <div key={s.title} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:28, marginBottom:12 }}>{s.icon}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--cream)', marginBottom:10 }}>{s.title}</div>
              <div style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6 }}>{s.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabLocation() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20 }}>
        <STitle>Location Details</STitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            {[['Address','Arches B C D And E, Montague Close, London SE1 9DA'],['Area','Borough Market'],['Borough','Southwark'],['Nearest Station','London Bridge (2 min walk)'],['Bus Routes','RV1, 21, 35, 40, 133, 343']].map(([l,v]) => <Row key={l} label={l} value={v} />)}
          </div>
          <div>
            {[['Mon–Fri','07:00 – 23:30'],['Saturday','07:00 – 23:30'],['Sunday','07:00 – 23:30'],['DPS','Klaudia Ciepluch'],['OS Map Ref','532733180272']].map(([l,v]) => <Row key={l} label={l} value={v} />)}
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
  const specs = [
    { label:'UPSTAIRS', value:'400m²', color:'#4FC3F7', note:null },
    { label:'DOWNSTAIRS', value:'300m²', color:'#C9A84C', note:'SPACE CURRENTLY USED FOR STORES, CELLAR & KITCHEN' },
    { label:'LICENSE', value:'11pm', color:'#2DD4BF', note:null },
    { label:'CAPACITY', value:'120', color:'#4FC3F7', note:null },
    { label:'TOILETS', value:'2', color:'#C9A84C', note:null },
    { label:'FIRE EXITS', value:'3', color:'#2DD4BF', note:null },
    { label:'PLANNING', value:'E Class', color:'#C9A84C', note:null },
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:16 }}>
        <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Floor Plan — Arches B C D And E, Montague Close SE1</div>
        <img src="/floorplan_1.png" alt="Venue floor plan" style={{ width:'100%', borderRadius:6, objectFit:'contain', maxHeight:380 }} />
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {specs.map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:8, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <div style={{ fontSize:13, color:'var(--cream)', fontWeight:600, letterSpacing:'0.08em' }}>{s.label}</div>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
              <div style={{ fontSize:22, color:s.color, fontWeight:700 }}>{s.value}</div>
              {s.note && <div style={{ fontSize:10, color:'#C9A84C', background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:4, padding:'3px 8px', maxWidth:160, lineHeight:1.4 }}>{s.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabLicence() {
  const a1 = [
    {r:'100',t:'No supply of alcohol may be made under the Premises Licence: (a) at a time when there is no Designated Premises Supervisor; or (b) at a time when the Designated Premises Supervisor does not hold a Personal Licence or their Personal Licence is suspended.'},
    {r:'101',t:'Every supply of alcohol under the Premises Licence must be made, or authorised by, a person who holds a Personal Licence.'},
    {r:'102',t:'The admission of children to films given under this licence must be restricted in accordance with the recommendations of the British Board of Film Classification or of the licensing authority itself.'},
    {r:'485',t:'No irresponsible promotions — including activities encouraging individuals to drink within time limits, provision of unlimited quantities of alcohol at a fixed or discounted fee, or dispensing alcohol directly into another person’s mouth.'},
    {r:'487',t:'Free potable water must be provided on request to customers where reasonably available.'},
    {r:'488',t:'Age Verification Policy. Individuals appearing under 18 must present photo ID with a holographic mark or ultraviolet feature.'},
    {r:'489',t:'Mandatory measures. Beer/cider: ½ pint; Gin/rum/vodka/whisky: 25ml or 35ml; Still wine: 125ml.'},
    {r:'491',t:'Minimum pricing. No alcohol may be sold below the permitted price as calculated by the formula P = D + (D × V), where D is duty and V is the rate of VAT applicable on the date of sale.'},
  ]
  const a2 = [
    {r:'289',t:'Comprehensive CCTV must be installed and maintained. All recordings stored for a minimum of 31 days. Available immediately upon request by Police or authorised officer.'},
    {r:'288',t:'A CCTV-trained staff member must be on premises at all times when open to the public.'},
    {r:'307',t:'Accommodation limit: maximum 100 persons (excluding staff).'},
    {r:'340',t:'Alcohol consumption restriction. Intoxicating liquor shall only be sold to: (a) persons taking part in the combined Plonk Golf offering; (b) persons purchasing tokens for on-site amusement arcade machines; or (c) persons playing board games on the premises.'},
    {r:'341',t:'The Bar area shall close at 11pm, save for customer access and egress.'},
    {r:'342',t:'Alcohol shall not be consumed on the Premises between 11:30pm and 8am daily.'},
    {r:'343',t:'All customers shall be off all areas of the Premises by 11:30pm daily.'},
    {r:'344',t:'A written dispersal policy shall be kept at the premises and made available for inspection.'},
    {r:'345',t:'The Arcade Room shall only be available to customers who have also purchased a golf ticket.'},
    {r:'346',t:'No alcohol promotions. This includes Bottomless Brunches, free or discounted alcohol with ticket purchase, 2-for-1 offers, or advertising of discounted alcohol.'},
    {r:'347',t:'Persons are not permitted to bring their own music amplification equipment to the Premises.'},
    {r:'348',t:'No customer of the Premises shall be permitted to smoke outside the Premises.'},
    {r:'316',t:'No deliveries or waste collections outside the hours of 8am–8pm Monday to Saturday or 10am–4pm on Sunday.'},
    {r:'349',t:'Bottles shall not be moved from inside the Premises to any outdoor bin or store between 8pm and 8am.'},
    {r:'239',t:'No noise shall emanate from the Premises that gives rise to a nuisance.'},
    {r:'350',t:'The main entrance/exit door shall have a mechanism to prevent it slamming shut.'},
    {r:'351',t:'No customers are permitted to queue outside the Premises.'},
    {r:'352',t:'Any SIA staff shall be deployed on a risk-assessed basis.'},
    {r:'353',t:'There shall be no live screenings of sporting events at the Premises.'},
    {r:'354',t:'Customers are not permitted to remove alcohol bought within the Premises outside the Premises.'},
    {r:'355',t:'No neon or dynamic lighting inside the premises that is visible from outside.'},
    {r:'356',t:'Sufficient measures must be in place to prevent litter or waste accumulating outside the premises.'},
    {r:'138',t:'Substantial food and non-intoxicating beverages, including drinking water, shall be available in all parts of the premises where alcohol is sold.'},
    {r:'158',t:'Notices shall be prominently displayed at all exits requesting patrons to respect local residents and leave the area quietly.'},
    {r:'357',t:'All waste shall be properly presented for collection no earlier than 30 minutes before collection times.'},
    {r:'304',t:'A direct telephone number for the manager shall be publicly available at all times the premises is open.'},
    {r:'358',t:'No noise or vibration generated on the premises shall emanate in a manner that gives rise to a nuisance.'},
    {r:'359',t:'Incident log to be kept and available on request, recording all crimes reported, ejections, complaints, incidents of disorder, seizures of drugs or offensive weapons, and any refusal of alcohol sales.'},
    {r:'4AA',t:'Challenge 25 policy: customers appearing under 25 must produce an approved form of photo ID including driving licence, passport, or PASS-approved card.'},
    {r:'4AB',t:'All staff involved in alcohol sales must be trained in the Challenge 25 policy. Training records shall be available for inspection on request.'},
    {r:'4AC',t:'Challenge 25 signage shall be displayed at entrances, areas where alcohol is displayed for sale, and at all points of sale.'},
    {r:'4AI',t:'A register of refused alcohol sales shall be maintained and available for inspection by Council authorised officers or the Police.'},
  ]
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const cs = {background:'var(--ink-2)',border:'1px solid rgba(201,168,76,0.12)',borderRadius:10,padding:20,marginBottom:12}
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div style={cs}>
          <STitle>Part 1 — Premises Details</STitle>
          <Row label="Premises Licence" value="Licensing Act 2003 · Southwark Council" />
          <Row label="Licence Number" value="888057" gold />
          <Row label="Premises" value="Arches B C D And E, Montague Close, London SE1 9DA" />
          <Row label="Post Code" value="SE1 9DA" />
          <Row label="OS Map Reference" value="532733180272" />
        </div>
        <div style={cs}>
          <STitle>Part 2 — Licence Holder</STitle>
          <Row label="Licence Holder" value="Plonk Golf Ltd" gold />
          <Row label="Registered Address" value="15 Mentmore Terrace, Hackney, London E8 3PN" />
          <Row label="Company Number" value="10328982" />
          <Row label="Issue Date" value="19/01/2026" />
          <Row label="DPS" value="Klaudia Ciepluch" gold />
          <Row label="Personal Licence No." value="157679" />
          <Row label="Issuing Authority" value="L.B Tower Hamlets" />
        </div>
      </div>
      <div style={cs}>
        <STitle>Opening Hours — 07:00 to 23:30 all days</STitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:12 }}>
          {days.map(d=>(
            <div key={d} style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--cream-dim)', marginBottom:4 }}>{d}</div>
              <div style={{ fontSize:11, color:'var(--cream)', background:'var(--ink-3)', borderRadius:4, padding:'3px 2px' }}>07:00</div>
              <div style={{ fontSize:10, color:'var(--gold-dim)', margin:'2px 0' }}>–</div>
              <div style={{ fontSize:11, color:'var(--cream)', background:'var(--ink-3)', borderRadius:4, padding:'3px 2px' }}>23:30</div>
            </div>
          ))}
        </div>
        <STitle>Licensed Activity Hours — 11:00 to 23:00 all days</STitle>
        {['Films — Indoors','Indoor Sporting Event','Alcohol — On Premises'].map(act=>(
          <div key={act} style={{ fontSize:12, color:'var(--cream-dim)', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{act}</div>
        ))}
      </div>
      <div style={cs}>
        <STitle>Annex 1 — Mandatory Conditions</STitle>
        {a1.map(c=>(
          <div key={c.r} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize:12, color:'var(--gold)', minWidth:36, flexShrink:0, fontWeight:600 }}>{c.r}</div>
            <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>{c.t}</div>
          </div>
        ))}
      </div>
      <div style={cs}>
        <STitle>Annex 2 — Operating Schedule Conditions</STitle>
        {a2.map(c=>(
          <div key={c.r} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize:12, color:'var(--gold)', minWidth:36, flexShrink:0, fontWeight:600 }}>{c.r}</div>
            <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>{c.t}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabDevelopment() {
  const Arr = ({c}) => <span style={{ color:c, flexShrink:0 }}>→</span>
  const Tag = ({label,color}) => <span style={{ fontSize:11, border:`1px solid ${color}`, color, borderRadius:4, padding:'3px 10px', letterSpacing:'0.08em', textTransform:'uppercase', marginRight:8, display:'inline-block', marginBottom:6 }}>{label}</span>
  const Bar = ({label,pct,val,color}) => (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
        <span style={{ color }}>{label}</span><span style={{ color:'#9CA3AF' }}>{pct}</span>
      </div>
      <div style={{ height:6, background:'#1A1A1A', borderRadius:3 }}>
        <div style={{ height:'100%', width:(val*100)+'%', background:color, borderRadius:3 }} />
      </div>
    </div>
  )
  const card = (bc) => ({ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:24, borderTop:`3px solid ${bc}` })
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:40 }}>
      <div>
        <div style={{ fontSize:11, color:'#4FC3F7', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>Venue Expansion · Borough Market SE1</div>
        <h2 style={{ fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:900, color:'#fff', textTransform:'uppercase', marginBottom:12 }}>Basement Space</h2>
        <p style={{ fontSize:14, color:'#9CA3AF', lineHeight:1.6, marginBottom:24 }}>The venue sits above 300m² of undeveloped basement space with full rights to sublet and carry out works. Expansion is structural upside already embedded in the lease.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={card('#C9A84C')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#C9A84C', border:'1px solid #C9A84C', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Short Term Opportunity</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>Basement Below Bar &amp; Arcade Arch</h3>
            {['200m² of basement space directly below the bar and arcade arch','Available for development now — no structural barriers','Proposed uses: karaoke rooms · listening bar · private hire games spaces','High-margin private hire and events revenue potential','Extends the venue offer without expanding the footprint above ground'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:14, color:'#D1D5DB' }}><Arr c="#C9A84C" /><span>{item}</span></div>)}
          </div>
          <div style={card('#4FC3F7')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#4FC3F7', border:'1px solid #4FC3F7', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Long Term Opportunity</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>Full Basement &amp; TfL Tunnel Access</h3>
            {['300m² of developable basement beneath the full Borough venue','Rights to sublet and carry out works are held within the lease','Structural costs covered by the landlord and building insurance policy','Fit-out to be carried out by No Dice Borough Ltd','A further 100m² tunnel opens under the final golf arch once TfL installs a new staircase — at that point the entire basement connects for public use','Full basement development unlocks a significant additional revenue floor'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:14, color:'#D1D5DB' }}><Arr c="#4FC3F7" /><span>{item}</span></div>)}
          </div>
        </div>
        <div style={{ background:'rgba(45,212,191,0.06)', border:'1px solid rgba(45,212,191,0.2)', borderRadius:8, padding:'16px 20px' }}>
          <p style={{ fontSize:13, color:'#9CA3AF', fontStyle:'italic', marginBottom:12 }}>The basement represents significant embedded upside — it is not speculative. The rights exist, the space exists, and the structural costs are not borne by No Dice Borough Ltd.</p>
          <Tag label="Lease-Backed Rights" color="#4FC3F7" /><Tag label="Structural Costs: Landlord" color="#2DD4BF" /><Tag label="400m² Total Potential" color="#C9A84C" />
        </div>
      </div>
      <div>
        <div style={{ fontSize:11, color:'#F87171', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>External Space · Conditional Opportunity</div>
        <h2 style={{ fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:900, color:'#fff', textTransform:'uppercase', marginBottom:12 }}>Yard Space &amp; External Capacity</h2>
        <p style={{ fontSize:14, color:'#9CA3AF', lineHeight:1.6, marginBottom:24 }}>A significant external yard at the front of the venue is currently used by Boro Bistro under a landlord agreement. The opportunity to reclaim this space is live and represents a material uplift in capacity and bar revenue.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={card('#F87171')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#F87171', border:'1px solid #F87171', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Current Status</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>Boro Bistro — Final Warning</h3>
            {['The yard at the front of the venue is private land owned by Southwark Cathedral','Boro Bistro currently hold usage rights to this space','They have misused the space and are on their final warning with the landlord','One further breach gives No Dice Borough the right to reclaim the yard'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:14, color:'#D1D5DB' }}><Arr c="#F87171" /><span>{item}</span></div>)}
            <div style={{ marginTop:16, fontSize:13, color:'#F59E0B', fontStyle:'italic' }}>Situation is live — outcome subject to Boro Bistro’s next infraction</div>
          </div>
          <div style={card('#2DD4BF')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#2DD4BF', border:'1px solid #2DD4BF', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>If Reclaimed</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>Large Capacity &amp; Bar Revenue Upside</h3>
            {['Very large additional outdoor capacity for bar service and social use','Significantly increases peak revenue potential, particularly for events and summer trading','No takeaway licence required — all private land, no public highway involvement','Bar sales extend naturally into the yard without additional licensing complexity','Transforms the kerb presence on one of London’s most visited streets'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:14, color:'#D1D5DB' }}><Arr c="#2DD4BF" /><span>{item}</span></div>)}
            <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:6 }}>
              {['Private land — no licensing barrier to operation','No additional licence required to trade in the yard','High revenue impact — significant uplift in capacity and bar sales'].map((item,i) => <div key={i} style={{ fontSize:13, color:'#2DD4BF', fontStyle:'italic' }}>→ {item}</div>)}
            </div>
          </div>
        </div>
        <div style={{ background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'16px 20px' }}>
          <p style={{ fontSize:13, color:'#9CA3AF', fontStyle:'italic', marginBottom:12 }}>The yard is not speculative pipeline — it is an active situation. If Boro Bistro commit one further breach of their agreement, the opportunity to take back this space becomes available immediately.</p>
          <Tag label="Private Land — No Licensing Barrier" color="#2DD4BF" /><Tag label="Landlord: Southwark Cathedral" color="#9CA3AF" /><Tag label="Conditional on Boro Bistro Breach" color="#C9A84C" />
        </div>
      </div>
      <div>
        <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>Premises Licence No. 888057 · Southwark Council</div>
        <h2 style={{ fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:900, color:'#fff', textTransform:'uppercase', marginBottom:12 }}>Licence Development</h2>
        <p style={{ fontSize:14, color:'#9CA3AF', lineHeight:1.6, marginBottom:20 }}>The current premises licence was granted for a golf-led activity venue. Four targeted variations would materially increase revenue potential. Zero enforcement history and an activity-led format are strong grounds for all four applications.</p>
        <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, padding:'14px 18px', marginBottom:24, fontSize:13, color:'#D1D5DB', lineHeight:1.6 }}>
          <span style={{ color:'#F59E0B' }}>⚠️ </span>Note: The licence is currently held by Plonk Golf Ltd (Co. 10328982). A transfer to No Dice Borough Ltd must be completed before or alongside any variation application. The DPS appointment will also need to be reviewed at that stage.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={card('#4FC3F7')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#4FC3F7', border:'1px solid #4FC3F7', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Target: 1am Initially · 2am Long Term</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Extended Trading Hours</h3>
            <p style={{ fontSize:13, color:'#F87171', marginBottom:16 }}>Currently: Alcohol to 11pm · Premises closes 11:30pm</p>
            {['Conditions 341, 342 and 343 restrict all activity to 11pm–11:30pm','DJ and late-night events format requires a 1am licence as a minimum','Activity-led venue (not a bar) strengthens the case significantly','Propose a 12-month trial period to reduce the perceived risk','Zero complaint history in SE1 is the strongest single asset'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:'#D1D5DB' }}><Arr c="#4FC3F7" /><span>{item}</span></div>)}
            <div style={{ marginTop:20 }}><Bar label="To 1am" pct="35–45%" val={0.4} color="#4FC3F7" /><Bar label="To 2am" pct="20–30%" val={0.25} color="#6B7280" /></div>
          </div>
          <div style={card('#2DD4BF')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#2DD4BF', border:'1px solid #2DD4BF', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Highest Likelihood · Apply First</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Activity-Led Alcohol Access</h3>
            <p style={{ fontSize:13, color:'#F87171', marginBottom:16 }}>Currently: Alcohol tied to golf ticket or arcade token purchase</p>
            {['Condition 340 currently limits alcohol to golf, arcade and board game participants only','Board game players can already drink freely — extending this logic to all activity participants is proportionate and defensible','Proposed wording: any customer using the venue activity or games facilities may purchase alcohol','Removes a compliance burden without changing the activity-led character','Strongest application — apply for this one first'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:'#D1D5DB' }}><Arr c="#2DD4BF" /><span>{item}</span></div>)}
            <div style={{ marginTop:20 }}><Bar label="Likelihood" pct="65–75%" val={0.7} color="#2DD4BF" /></div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={card('#C9A84C')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#C9A84C', border:'1px solid #C9A84C', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>International Matches Only</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Live International Sports</h3>
            <p style={{ fontSize:13, color:'#F87171', marginBottom:16 }}>Currently: No live sports screenings permitted (Condition 353)</p>
            {['Condition 353 blanket-prohibits all live sports screenings','Licence already includes Indoor Sporting Event as a licensed activity — a useful inconsistency to argue at variation','Not seeking to become a sports bar — international tournaments only (World Cup, Euros, Olympics)','Propose advance notification protocol: inform authority before each screening and maintain a log','Avoids the weekly Premier League concerns that drove the original condition'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:'#D1D5DB' }}><Arr c="#C9A84C" /><span>{item}</span></div>)}
            <div style={{ marginTop:20 }}><Bar label="International only" pct="40–55%" val={0.48} color="#C9A84C" /><Bar label="Full removal" pct="25–35%" val={0.3} color="#6B7280" /></div>
          </div>
          <div style={card('#9CA3AF')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#9CA3AF', border:'1px solid #9CA3AF', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Recommended Approach</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>How to Maximise Success</h3>
            {['Apply for the golf-drink link change first — easiest win, builds credibility with the authority','Obtain a formal zero-incident letter from Met Police Southwark and Southwark Council licensing team','Engage a Southwark specialist licensing solicitor before any application is submitted','Pre-consult with the licensing authority and police informally before formal submission','Engage Southwark Cathedral directly — their support on hours would carry exceptional weight as landlord','For hours: propose a 12-month time-limited trial to reduce perceived risk for the authority'].map((item,i) => (
              <div key={i} style={{ display:'flex', gap:12, marginBottom:12, fontSize:13, color:'#D1D5DB' }}>
                <span style={{ color:'#4FC3F7', fontWeight:700, minWidth:16, flexShrink:0 }}>{i+1}</span><span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderLeft:'4px solid #6366F1', borderRadius:8, padding:'16px 20px', marginBottom:16 }}>
          <p style={{ fontSize:13, color:'#9CA3AF', fontStyle:'italic', marginBottom:12 }}>Do not apply for all four variations simultaneously — this signals a venue seeking to transform its character. Sequence the applications. A clean zero-incident trading record in SE1 is the strongest asset in every application.</p>
          <Tag label="Remove Golf-Drink Link 65–75%" color="#2DD4BF" /><Tag label="Hours to 1am 35–45%" color="#4FC3F7" /><Tag label="Sports Screening 40–55%" color="#C9A84C" /><Tag label="Hours to 2am 20–30%" color="#9CA3AF" />
        </div>
        <p style={{ fontSize:12, color:'#6B7280', fontStyle:'italic', textAlign:'center' }}>This analysis is for information only and does not constitute legal advice. Engage a licensed specialist solicitor before submitting any variation application to Southwark Council.</p>
      </div>
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
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>No Dice Borough Ltd</div>
          <div style={{ fontSize:14, color:'var(--cream-dim)' }}>Venue Information · Arches B C D And E, Montague Close SE1</div>
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