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
  { src:'/Borough_Course_1.jpg', caption:'Hole 5 Ã¢ÂÂ Belfast cityscape mural' },
  { src:'/Borough_Course_2.jpg', caption:'The bar arch Ã¢ÂÂ playing through' },
  { src:'/Borough_Course_3.jpg', caption:'London landmarks course' },
  { src:'/Borough_Course_4.jpg', caption:'London Eye hole Ã¢ÂÂ arch 4' },
  { src:'/Borough_Course_5.jpg', caption:'Red telephone box feature hole' },
  { src:'/Borough_Course_6.jpg', caption:"It's a London Thing Ã¢ÂÂ arch 3" },
]

const DRINKS_IMGS = [
  { src:'/drinks_1.jpg', caption:'Camden Town Brewery Ã¢ÂÂ bar draught' },
  { src:'/drinks_2.jpg', caption:'Cloudwater craft beer selection' },
  { src:'/drinks_3.jpg', caption:"Mondo Brewing Ã¢ÂÂ Dennis Hopp'r IPA on tap" },
  { src:'/drinks_4.jpg', caption:'Tropical cocktail Ã¢ÂÂ citrus spritz' },
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
          <div key={i} onClick={()=>setActive(i)} style={{ flexShrink:0, width:72, height:50, borderRadius:6, overflow:'hidden', cursor:'pointer', border:`2px solid ${i===active?'var(--gold)':'transparent'}`, opacity:i===active?1:0.6, transition:'all 0.15s' }}>
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
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize:12, color:'var(--cream-dim)', flexShrink:0, paddingRight:16 }}>{label}</span>
      <span style={{ fontSize:12, color:gold?'var(--gold)':'var(--cream)', textAlign:'right' }}>{value}</span>
    </div>
  )
}

function STitle({ children }) {
  return <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>{children}</div>
}

function Card({ children }) {
  return <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20 }}>{children}</div>
}

function HoursGrid({ activity, hours }) {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:11, color:'var(--gold)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>{activity}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
        {days.map(d => (
          <div key={d} style={{ textAlign:'center' }}>
            <div style={{ fontSize:10, color:'var(--cream-dim)', marginBottom:2 }}>{d}</div>
            <div style={{ fontSize:10, color:'var(--cream)', background:'var(--ink-3)', borderRadius:4, padding:'3px 2px' }}>{hours}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabCatchment() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {STATS.map(s => (
          <Card key={s.label}>
            <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:26, color:'var(--gold)', fontFamily:"'DM Serif Display',serif", marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'var(--cream-dim)' }}>{s.sub}</div>
          </Card>
        ))}
      </div>
      <Card>
        <STitle>Catchment Area</STitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ fontSize:13, color:'var(--cream)', marginBottom:8, fontWeight:500 }}>Primary Catchment (0Ã¢ÂÂ5 min walk)</div>
            {['Borough Market Ã¢ÂÂ 30,000+ daily visitors','London Bridge Station Ã¢ÂÂ 56m passengers/yr','Southwark Ã¢ÂÂ 16m annual visitors','The Shard Ã¢ÂÂ 1m+ annual visitors'].map(item => (
              <div key={item} style={{ fontSize:12, color:'var(--cream-dim)', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>ÃÂ· {item}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:13, color:'var(--cream)', marginBottom:8, fontWeight:500 }}>Secondary Catchment (5Ã¢ÂÂ15 min)</div>
            {['Tate Modern Ã¢ÂÂ 4.7m annual visitors','Bankside & Bermondsey','City of London workers','South Bank cultural quarter'].map(item => (
              <div key={item} style={{ fontSize:12, color:'var(--cream-dim)', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>ÃÂ· {item}</div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

function TabLocation() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Card>
        <STitle>Location Details</STitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            {[['Address','Arches B C D And E, Montague Close, London SE1 9DA'],['Area','Borough Market'],['Borough','Southwark'],['Nearest Station','London Bridge (2 min walk)'],['Bus Routes','RV1, 21, 35, 40, 133, 343']].map(([l,v]) => <Row key={l} label={l} value={v} />)}
          </div>
          <div>
            {[['MonÃ¢ÂÂFri','07:00 Ã¢ÂÂ 23:30'],['Saturday','07:00 Ã¢ÂÂ 23:30'],['Sunday','07:00 Ã¢ÂÂ 23:30'],['DPS','Klaudia Ciepluch'],['OS Map Ref','532733180272']].map(([l,v]) => <Row key={l} label={l} value={v} />)}
          </div>
        </div>
      </Card>
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
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:16 }}>
          <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Floor Plan — Arches B C D And E, Montague Close SE1</div>
          <img src="/floorplan_1.png" alt="Venue floor plan" style={{ width:'100%', borderRadius:6, objectFit:'contain', maxHeight:380 }} />
          <div style={{ marginTop:10, display:'flex', gap:16, flexWrap:'wrap' }}>
            {[['#4FC3F7','Arcades'],['#C9A84C','Bar / Pool'],['#A855F7','Golf Courses'],['#2DD4BF','WC / Exits']].map(([col,label]) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:col, flexShrink:0 }} />
                <span style={{ fontSize:11, color:'var(--cream-dim)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {specs.map(s => (
            <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:8, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div style={{ fontSize:13, color:'var(--cream)', fontWeight:600, letterSpacing:'0.08em' }}>{s.label}</div>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                <div style={{ fontSize:22, color:s.color, fontWeight:700 }}>{s.value}</div>
                {s.note && <div style={{ fontSize:10, color:'#C9A84C', background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:4, padding:'3px 8px', letterSpacing:'0.05em', maxWidth:160, lineHeight:1.4 }}>{s.note}</div>}
              </div>
            </div>
          ))}
          <div style={{ marginTop:4, background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:8, padding:16 }}>
            <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Zone Layout</div>
            {[
              ['Arcades','Upper left section'],
              ['WC','Upper centre'],
              ['Pool','Ground level, left'],
              ['Bar','Centre left, ground level'],
              ['Golf Course 1','Centre right arch'],
              ['Golf Course 2','Far right arch'],
              ['Main Entrance','Centre, bar section'],
              ['Fire Exits','3 total — left, centre-right, far right'],
              ['Depth','22m'],
            ].map(([zone,detail]) => (
              <div key={zone} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:12, color:'var(--cream)', fontWeight:500 }}>{zone}</span>
                <span style={{ fontSize:12, color:'var(--cream-dim)' }}>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
function TabLicence() {
  const a1 = [
    {r:'100',t:'No supply of alcohol may be made under the Premises Licence: (a) at a time when there is no Designated Premises Supervisor; or (b) at a time when the Designated Premises Supervisor does not hold a Personal Licence or their Personal Licence is suspended.'},
    {r:'101',t:'Every supply of alcohol under the Premises Licence must be made, or authorised by, a person who holds a Personal Licence.'},
    {r:'102',t:'The admission of children to films given under this licence must be restricted in accordance with the recommendations of the British Board of Film Classification or of the licensing authority itself.'},
    {r:'485',t:'No irresponsible promotions. The responsible person must ensure that staff do not carry out, arrange or participate in any irresponsible promotions â including activities encouraging individuals to drink within time limits, provision of unlimited quantities of alcohol at a fixed/discounted fee, or dispensing alcohol directly into another personâs mouth.'},
    {r:'487',t:'Free potable water must be provided on request to customers where reasonably available.'},
    {r:'488',t:'Age Verification Policy. An age verification policy must be adopted and upheld. Individuals appearing under 18 must present photo ID with a holographic mark or ultraviolet feature.'},
    {r:'489',t:'Mandatory measures. Beer/cider: Â½ pint; Gin/rum/vodka/whisky: 25 ml or 35 ml; Still wine: 125 ml. Measures must be displayed and offered where no quantity is specified by the customer.'},
    {r:'491',t:'Minimum pricing. No alcohol may be sold below the permitted price as calculated by the formula P = D + (D Ã V), where D is duty and V is the rate of VAT applicable on the date of sale.'},
  ]
  const a2 = [
    {r:'289',t:'Comprehensive CCTV must be installed and maintained. All recordings stored for a minimum of 31 days with date and time stamping. Available immediately upon request by Police or authorised officer.'},
    {r:'288',t:'A CCTV-trained staff member must be on premises at all times when open to the public and able to show Police recent footage with minimum delay.'},
    {r:'307',t:'Accommodation limit: maximum 100 persons (excluding staff).'},
    {r:'340',t:'Alcohol consumption restriction. Intoxicating liquor shall only be sold to: (a) persons taking part in the combined Plonk Golf offering; (b) persons purchasing tokens for on-site amusement arcade machines; or (c) persons playing board games on the premises.'},
    {r:'341',t:'The Bar area shall close at 11pm, save for customer access/egress and access to the check-in desk.'},
    {r:'342',t:'Alcohol shall not be consumed on the Premises between 11:30pm and 8am daily.'},
    {r:'343',t:'All customers shall be off all areas of the Premises by 11:30pm daily.'},
    {r:'344',t:'A written dispersal policy shall be kept at the premises and made available for inspection. All relevant staff shall be trained in its implementation.'},
    {r:'345',t:'The Arcade Room shall only be available to customers who have also purchased a golf ticket.'},
    {r:'346',t:'No alcohol promotions. This includes Bottomless Brunches, free or discounted alcohol with ticket purchase, 2-for-1 offers, or advertising of discounted alcohol.'},
    {r:'347',t:'Persons are not permitted to bring their own music amplification equipment to the Premises.'},
    {r:'348',t:'No customer of the Premises shall be permitted to smoke outside the Premises.'},
    {r:'316',t:'No deliveries or waste collections outside the hours of 8amâ8pm Monday to Saturday or 10amâ4pm on Sunday.'},
    {r:'349',t:'Bottles shall not be moved from inside the Premises to any outdoor bin or store between 8pm and 8am.'},
    {r:'239',t:'No noise shall emanate from the Premises that gives rise to a nuisance.'},
    {r:'350',t:'The main entrance/exit door shall have a mechanism to prevent it slamming shut.'},
    {r:'351',t:'No customers are permitted to queue outside the Premises.'},
    {r:'352',t:'Any SIA staff shall be deployed on a risk-assessed basis.'},
    {r:'353',t:'There shall be no live screenings of sporting events at the Premises.'},
    {r:'354',t:'Customers are not permitted to remove alcohol bought within the Premises outside the Premises.'},
    {r:'355',t:'No neon or dynamic lighting inside the premises that is visible from outside. All lights shall be turned off when the Premises is closed.'},
    {r:'356',t:'Sufficient measures must be in place to remove and prevent litter or waste accumulating outside the premises. The area shall be swept and litter stored in approved arrangements by close of business.'},
    {r:'138',t:'Substantial food and non-intoxicating beverages, including drinking water, shall be available in all parts of the premises where alcohol is sold.'},
    {r:'158',t:'Notices shall be prominently displayed at all exits requesting patrons to respect local residents and leave the area quietly.'},
    {r:'357',t:'All waste shall be properly presented for collection no earlier than 30 minutes before collection times.'},
    {r:'304',t:'A direct telephone number for the manager shall be publicly available at all times the premises is open, made available to residents and businesses in the vicinity.'},
    {r:'358',t:'No noise or vibration generated on the premises shall emanate from or be transmitted through the structure of the premises in a manner that gives rise to a nuisance.'},
    {r:'359',t:'Incident log to be kept and available on request, recording: (a) all crimes reported; (b) all ejections; (c) complaints concerning crime and disorder; (d) incidents of disorder; (e) seizures of drugs or offensive weapons; (f) any refusal of alcohol sales.'},
    {r:'4AA',t:'Challenge 25 policy: customers appearing under 25 must produce an approved form of photo ID. Accepted forms include driving licence, passport, or PASS-approved card such as the Southwark Proof of Age (SPA) card.'},
    {r:'4AB',t:'All staff involved in alcohol sales must be trained in the Challenge 25 policy. Training records including dates shall be available for inspection on request.'},
    {r:'4AC',t:'Challenge 25 signage shall be displayed at entrances, areas where alcohol is displayed for sale, and at all points of sale.'},
    {r:'4AI',t:'A register of refused alcohol sales shall be maintained and available for inspection by Council authorised officers or the Police.'},
  ]
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const cs = {background:'var(--ink-2)',border:'1px solid rgba(201,168,76,0.12)',borderRadius:10,padding:20}
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={cs}><STitle>Part 1 â Premises Details</STitle>
          <Row label="Premises Licence" value="Licensing Act 2003 Â· Issued by Southwark Council" />
          <Row label="Licence Number" value="888057" gold />
          <Row label="Premises" value="Arches B C D And E, Montague Close, London SE1 9DA" />
          <Row label="Post Town" value="London" />
          <Row label="Post Code" value="SE1 9DA" />
          <Row label="OS Map Reference" value="532733180272" />
        </div>
        <div style={cs}><STitle>Part 2 â Licence Holder</STitle>
          <Row label="Licence Holder" value="Plonk Golf Ltd" gold />
          <Row label="Registered Address" value="15 Mentmore Terrace, Hackney, London E8 3PN" />
          <Row label="Company Number" value="10328982" />
          <Row label="Issue Date" value="19/01/2026" />
          <Row label="Designated Premises Supervisor" value="Klaudia Ciepluch" gold />
          <Row label="DPS Address" value="Flat 11 Clichy House, Stepney Way, London E1 3HH" />
          <Row label="Personal Licence No." value="157679" />
          <Row label="Issuing Authority (Personal Licence)" value="L.B Tower Hamlets" />
        </div>
      </div>
      <div style={cs}><STitle>Licensable Activities</STitle>
        <Row label="Films â Indoors" value="Permitted" gold />
        <Row label="Indoor Sporting Event" value="Permitted" gold />
        <Row label="Sale by retail of alcohol" value="To be consumed on premises" gold />
        <Row label="Alcohol Supply Type" value="On-premises consumption only" />
      </div>
      <div style={cs}><STitle>Opening Hours â For non-standard timings see Annex 2</STitle>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:16}}>
          {days.map(d=><div key={d} style={{textAlign:'center'}}><div style={{fontSize:11,color:'var(--cream-dim)',marginBottom:4}}>{d}</div><div style={{fontSize:11,color:'var(--cream)',background:'var(--ink-3)',borderRadius:4,padding:'4px 2px'}}>07:00</div><div style={{fontSize:10,color:'var(--gold-dim)',margin:'2px 0'}}>â</div><div style={{fontSize:11,color:'var(--cream)',background:'var(--ink-3)',borderRadius:4,padding:'4px 2px'}}>23:30</div></div>)}
        </div>
        <STitle>Licensed Activity Hours</STitle>
        {[['Films â Indoors','11:00â23:00'],['Indoor Sporting Event','11:00â23:00'],['Alcohol â On Premises','11:00â23:00']].map(([act,hrs])=>(
          <div key={act} style={{marginBottom:14}}>
            <div style={{fontSize:12,color:'var(--gold)',marginBottom:6}}>{act}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
              {days.map(d=><div key={d} style={{textAlign:'center'}}><div style={{fontSize:10,color:'var(--cream-dim)',marginBottom:2}}>{d}</div><div style={{fontSize:11,color:'var(--cream)',background:'var(--ink-3)',borderRadius:4,padding:'3px 2px'}}>{hrs}</div></div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={cs}><STitle>Annex 1 â Mandatory Conditions</STitle>
        {a1.map(c=><div key={c.r} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}><div style={{fontSize:12,color:'var(--gold)',minWidth:36,flexShrink:0,fontWeight:600}}>{c.r}</div><div style={{fontSize:12,color:'var(--cream-dim)',lineHeight:1.6}}>{c.t}</div></div>)}
      </div>
      <div style={cs}><STitle>Annex 2 â Operating Schedule Conditions</STitle>
        {a2.map(c=><div key={c.r} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}><div style={{fontSize:12,color:'var(--gold)',minWidth:36,flexShrink:0,fontWeight:600}}>{c.r}</div><div style={{fontSize:12,color:'var(--cream-dim)',lineHeight:1.6}}>{c.t}</div></div>)}
      </div>
    </div>
  )
}
function TabDevelopment() {
  return (
    <Card>
      <STitle>Growth Opportunities</STitle>
      {[
        ['Private Hire Expansion','Corporate bookings and private events currently underserved Ã¢ÂÂ dedicated sales resource would drive significant uplift'],
        ['Extended Hours','Friday and Saturday late licence extension to 01:00 would capture post-theatre and post-gig trade from The Globe and Tate'],
        ['Digital Marketing Scale','GA4-verified ÃÂ£0.32 CPC Ã¢ÂÂ increasing Google Ads budget from ÃÂ£7,200 to ÃÂ£15,000 p.a. projects 2ÃÂ booking volume'],
        ['Menu Development','Hot food licence not currently utilised Ã¢ÂÂ small sharing plates would increase dwell time and spend per head'],
        ['Membership Scheme','Monthly membership model (ÃÂ£25/mo) for regular players Ã¢ÂÂ recurring revenue and loyalty'],
        ['Corporate Packages','Bespoke team event packages Ã¢ÂÂ currently booked ad hoc, no structured offering'],
      ].map(([title, desc]) => (
        <div key={title} style={{ padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize:13, color:'var(--gold)', marginBottom:5 }}>{title}</div>
          <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>{desc}</div>
        </div>
      ))}
    </Card>
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
            <div style={{ fontSize:14, color:'var(--cream-dim)' }}>Venue Information ÃÂ· Arches B C D And E, Montague Close SE1</div>
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