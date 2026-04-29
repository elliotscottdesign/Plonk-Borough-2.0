import React, { useState } from 'react'

// VenueInfo — clones Borough's sub-tab structure exactly, populated for the
// Hackney bar-only entity. Mini-golf-specific copy and the "Course Gallery"
// sub-tab are repurposed for the in-venue games inventory; mini golf is
// excluded from the bar-only operation.
//
// Sources:
//   • Site listing — https://www.plonkgolf.co.uk/venue/plonk-hackney/
//   • Premises licence 109311 — https://hackney.moderngov.co.uk (LSC report,
//     19 October 2023). Granted 10 Nov 2020, re-issued 11 May 2023, held by
//     Elliot Scott. DPS: Klaudia Ciepluch.
//   • ONS Census 2021 — London Fields ward profile + Hackney borough
//     statistics. Trust for London poverty and inequality data.
//   • The Arch Company freehold context — Mentmore Terrace railway arches
//     transferred from Network Rail to Blackstone / Telereal Trillium JV.

const TABS = [
  { key: 'catchment',     label: 'Catchment' },
  { key: 'location',      label: 'Location' },
  { key: 'floorPlan',     label: 'Floor Plan' },
  { key: 'courseGallery', label: 'Course' },
  { key: 'venueGallery',  label: 'Venue' },
  { key: 'gardenGallery', label: 'Garden' },
  { key: 'drinksGallery', label: 'Drinks' },
  { key: 'gamesGallery',  label: 'Games' },
  { key: 'licence',       label: 'Licence' },
  { key: 'development',   label: 'Development' },
]

const range = (n, fn) => Array.from({ length: n }, (_, i) => fn(i + 1))

const VENUE_IMGS  = range(16, n => ({ src: `/hackney/venue/Interior_${n}.jpg`, caption: 'No Dice Hackney — interior' }))
const COURSE_IMGS = range(10, n => ({ src: `/hackney/course/Course_${n}.jpg`,  caption: 'No Dice Hackney — mini-golf course' }))
const GARDEN_IMGS = range(8,  n => ({ src: `/hackney/garden/Garden_${n}.jpg`,  caption: 'No Dice Hackney — garden / outdoor terrace' }))
const DRINKS_IMGS = range(15, n => ({ src: `/hackney/drinks/Drinks_${n}.jpg`,  caption: 'No Dice Hackney — bar & drinks' }))
const GAMES_IMGS  = range(21, n => ({ src: `/hackney/games/Games_${n}.jpg`,    caption: 'No Dice Hackney — games & arcade' }))

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

// =============================================================================
// CATCHMENT — mirrors Borough's 6 stat tiles + 4 strength cards
// =============================================================================
function TabCatchment() {
  // Stats sourced from ONS Census 2021 (London Fields ward profile),
  // Hackney Council Population Data 2024, Trust for London poverty data.
  // GA4 / page-view metrics deferred until the No Dice Hackney site has a
  // tracking baseline.
  const stats = [
    { value: '12,682',  label: 'LONDON FIELDS WARD POPULATION', sub: 'Resident population (2.3 avg household size)', source: 'ONS Census 2021 ward profile', color: '#4FC3F7' },
    { value: '£49,532', label: 'HACKNEY MEDIAN INCOME',          sub: 'Annual household income',                       source: 'Hackney Council 2024',           color: '#2DD4BF' },
    { value: '36.8',    label: 'LONDON FIELDS AVG AGE',          sub: 'Years (Hackney borough avg 32)',                source: 'ONS Census 2021',                 color: '#4FC3F7' },
    { value: '68.4%',   label: 'ECONOMICALLY ACTIVE',            sub: 'Of London Fields ward residents',               source: 'ONS Census 2021',                 color: '#2DD4BF' },
    { value: 'TBD',     label: 'VENUE PAGE VIEWS 2026',          sub: 'GA4 — pending baseline post-relaunch',          source: 'Google Analytics',                color: '#C9A84C' },
    { value: 'TBD',     label: 'ORGANIC SEARCH SHARE',           sub: 'Of all venue traffic — pending GA4',            source: 'GA4 2026',                        color: '#C9A84C' },
  ]
  const strengths = [
    { icon:'🎨', title:'CREATIVE NEIGHBOURHOOD',       text:'London Fields is at the heart of East London\'s independent creative scene — the ward sits between Broadway Market, Hackney Wick and Dalston, three of London\'s densest concentrations of independent hospitality and lifestyle brands.' },
    { icon:'🍻', title:'NIGHT-ECONOMY CLUSTER',         text:'Direct neighbours on the Mentmore Terrace arches include London Fields Brewery, E5 Bakehouse, Pub on the Park, Patty & Bun. The site sits inside an established, peer-supported night-economy cluster — partnerships drive footfall.' },
    { icon:'🌳', title:'PARK-ADJACENT DESTINATION',     text:'London Fields park (31 acres) is a 1-minute walk. Year-round footfall driver — outdoor sports, summer events, weekend leisure crowds spill directly onto Mentmore Terrace.' },
    { icon:'🚇', title:'OVERGROUND-LED ACCESSIBILITY',  text:'2-minute walk from London Fields Overground (Mildmay line). 10 minutes to Hackney Central. Direct connections into Liverpool Street, Stratford, Camden — a creative-class commuter axis.' },
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
              <div style={{ fontSize:13, fontWeight:700, color:'var(--cream)', marginBottom:10, letterSpacing:'0.04em' }}>{s.title}</div>
              <div style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6 }}>{s.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// LOCATION — mirrors Borough's 4 top cards + transport grid + landmarks + map
// =============================================================================
function TabLocation() {
  const minWalk = (n) => `${n} min walk`
  const topCards = [
    { icon:'🚇', name:'London Fields Overground', detail: minWalk(2),  sub:'Mildmay line · 2 stops to Liverpool Street',           color:'#4FC3F7' },
    { icon:'🥖', name:'Broadway Market',           detail: minWalk(5),  sub:'Saturday market · independent food & lifestyle scene', color:'#C9A84C' },
    { icon:'🌳', name:'London Fields Park',        detail: minWalk(1),  sub:'31-acre park · pool, sports, summer events',            color:'#2DD4BF' },
    { icon:'🏛️', name:'Hackney Central',           detail: minWalk(10), sub:'Town hall · Hackney Empire · Mare Street trade',       color:'#4FC3F7' },
  ]
  const transport = [
    { label:'OVERGROUND',       sub:'London Fields',         mins: minWalk(2),  bg:'#FA9221', border:'#FA9221' },
    { label:'OVERGROUND',       sub:'Hackney Central',        mins: minWalk(10), bg:'#FA9221', border:'#FA9221' },
    { label:'OVERGROUND',       sub:'Hackney Downs',          mins: minWalk(12), bg:'#FA9221', border:'#FA9221' },
    { label:'BIKE / CYCLE LANE', sub:'CS1 + Quietway 2',       mins: minWalk(0),  bg:'#10B981', border:'#10B981' },
  ]
  const buses = ['26','48','55','106','254','277','388','D6','N26','N277']
  const landmarks = [
    { icon:'🚇', name:'London Fields Overground',  type:'Transport',  dist: minWalk(2),  color:'#4FC3F7' },
    { icon:'🥖', name:'Broadway Market',            type:'Footfall',   dist: minWalk(5),  color:'#C9A84C' },
    { icon:'🌳', name:'London Fields Park',         type:'Green Space',dist: minWalk(1),  color:'#2DD4BF' },
    { icon:'🍞', name:'E5 Bakehouse',                type:'Neighbour',  dist:'Adjacent',   color:'#C9A84C' },
    { icon:'🍺', name:'London Fields Brewery',       type:'Neighbour',  dist:'Adjacent',   color:'#C9A84C' },
    { icon:'🏛️', name:'Hackney Empire / Town Hall', type:'Cultural',   dist: minWalk(10), color:'#2DD4BF' },
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {topCards.map((c, i) => (
          <div key={i} style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:20 }}>
            <div style={{ fontSize:24, marginBottom:10 }}>{c.icon}</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--cream)', marginBottom:4 }}>{c.name}</div>
            <div style={{ fontSize:16, fontWeight:700, color:c.color, marginBottom:8 }}>{c.detail}</div>
            <div style={{ fontSize:12, color:'#6B7280' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:16 }}>Transport Links</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
          {transport.map((tr,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#fff', background:tr.bg, border:`1px solid ${tr.border}`, borderRadius:4, padding:'4px 6px', marginBottom:8, letterSpacing:'0.05em' }}>{tr.label}</div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--cream)', marginBottom:4 }}>{tr.sub}</div>
              <div style={{ fontSize:12, color:'#6B7280' }}>{tr.mins}</div>
            </div>
          ))}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#fff', background:'#DC2626', border:'1px solid #DC2626', borderRadius:4, padding:'4px 6px', marginBottom:8, letterSpacing:'0.05em' }}>BUS ROUTES</div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--cream)', marginBottom:4 }}>Mare St · Richmond Rd</div>
            <div style={{ fontSize:12, color:'#6B7280', marginBottom:8 }}>{minWalk(2)}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:3, justifyContent:'center' }}>
              {buses.map(b => <span key={b} style={{ fontSize:10, background:'#DC2626', color:'#fff', borderRadius:3, padding:'2px 5px', fontWeight:600 }}>{b}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20 }}>
          <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:16 }}>Nearby Landmarks</div>
          {landmarks.map((l,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize:20 }}>{l.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--cream)' }}>{l.name}</div>
                <div style={{ fontSize:11, color:'#6B7280' }}>{l.type}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:l.color }}>{l.dist}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, overflow:'hidden', minHeight:400 }}>
          {/* Embedded Google Map — pin coordinates: Mentmore Terrace E8 3PH */}
          <iframe
            title="London Fields venue map"
            src="https://www.google.com/maps?q=Arch+407+Mentmore+Terrace+London+E8+3PH&output=embed"
            width="100%" height="100%" style={{ border:0, minHeight:400 }} allowFullScreen loading="lazy" />
        </div>
      </div>

      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20 }}>
        <STitle>Opening Hours (per current premises licence 109311)</STitle>
        {[
          ['Mon–Thu & Sun (alcohol)',  '12:00 – 23:00'],
          ['Mon–Thu & Sun (premises)', '07:00 – 23:30'],
          ['Fri–Sat (alcohol)',        '12:00 – 00:00 · variation granted post-2023', true],
          ['Fri–Sat (premises)',       '07:00 – 00:30 · variation granted post-2023', true],
        ].map(([l,v,gold]) => <Row key={l} label={l} value={v} gold={gold} />)}
      </div>
    </div>
  )
}

// =============================================================================
// FLOOR PLAN — mirrors Borough's image + 7 spec rows
// =============================================================================
function TabFloorPlan() {
  const [zoomed, setZoomed] = useState(false)
  // Capacity values from premises licence 109311, Annex 3, Condition 32.
  const specs = [
    { label: 'BAR SEATED AREA',    badge: null,                              value: '30',     color: '#4FC3F7' },
    { label: 'GARDEN / TERRACE',   badge: 'CLOSES 22:00 (CONDITION 14)',     value: '20',     color: '#C9A84C' },
    { label: 'GAMES / ARCADE',     badge: null,                              value: '17',     color: '#2DD4BF' },
    { label: 'TOTAL CAPACITY',     badge: 'EXCLUDES STAFF',                  value: '67',     color: '#4FC3F7' },
    { label: 'PREMISES LICENCE',   badge: null,                              value: '109311', color: '#C9A84C' },
    { label: 'TRADING HOURS',      badge: 'PER LICENCE',                     value: '23:30',  color: '#2DD4BF' },
    { label: 'PLANNING USE CLASS', badge: 'GRANTED',                         value: 'Sui Generis', color: '#10B981' },
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20, alignItems:'start' }}>
      {zoomed && (
        <div onClick={()=>setZoomed(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}>
          <div style={{ position:'relative', maxWidth:'92vw', maxHeight:'92vh' }}>
            <img src="/hackney/floorplan_1.png" alt="Hackney venue floor plan" style={{ maxWidth:'92vw', maxHeight:'92vh', objectFit:'contain', borderRadius:8 }} onError={(e)=>{e.target.style.display='none'}} />
            <div style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:12, padding:'4px 10px', borderRadius:4 }}>Click anywhere to close</div>
          </div>
        </div>
      )}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase' }}>The New Layout — Arch 407 Mentmore Terrace, E8 3PH</div>
          <button onClick={()=>setZoomed(true)} style={{ fontSize:11, color:'var(--gold)', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:4, padding:'3px 10px', cursor:'pointer' }}>Click to expand ⤢</button>
        </div>
        <img onClick={()=>setZoomed(true)} src="/hackney/floorplan_1.png" alt="No Dice Hackney venue floor plan — bar, garden, arcades, pool, mezzanine" style={{ width:'100%', borderRadius:6, objectFit:'contain', maxHeight:560, display:'block', cursor:'zoom-in' }} />
        <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:10, lineHeight:1.6 }}>
          Legend: walls · mezzanine and stairs · pool tables · arcades · speakers · seating · DJ trolley.
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {specs.map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:8, padding:'14px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                <div style={{ fontSize:13, color:'var(--cream)', fontWeight:600, letterSpacing:'0.08em' }}>{s.label}</div>
                {s.badge && <div style={{ fontSize:10, color:'#C9A84C', background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:4, padding:'3px 8px', lineHeight:1.4 }}>{s.badge}</div>}
              </div>
              <div style={{ fontSize:22, color:s.color, fontWeight:700, flexShrink:0 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// LICENCE — verbatim conditions from premises licence 109311
// =============================================================================
function TabLicence() {
  // Annex 1: Mandatory conditions (statutory, identical across UK premises).
  const a1 = [
    {r:'1', t:'No supply of alcohol may be made under the Premises Licence: (a) at a time when there is no Designated Premises Supervisor; or (b) at a time when the Designated Premises Supervisor does not hold a Personal Licence or their Personal Licence is suspended.'},
    {r:'2', t:'Every supply of alcohol under the Premises Licence must be made, or authorised by, a person who holds a Personal Licence.'},
    {r:'3', t:'No irresponsible promotions — including activities encouraging individuals to drink within time limits, provision of unlimited or discounted alcohol, prizes encouraging accelerated consumption, or dispensing alcohol directly into another person\'s mouth.'},
    {r:'4', t:'Free potable water must be provided on request to customers where reasonably available.'},
    {r:'5', t:'Age Verification Policy. Individuals appearing under 18 must present photo ID with a holographic mark or ultraviolet feature.'},
    {r:'6', t:'Mandatory measures. Beer/cider: ½ pint; Gin/rum/vodka/whisky: 25ml or 35ml; Still wine: 125ml. Measures must be displayed and customers made aware of them.'},
    {r:'7', t:'Minimum pricing. No alcohol may be sold below the permitted price as calculated by P = D + (D × V), where D is duty and V is the rate of VAT applicable on the date of sale.'},
    {r:'8', t:'Each individual carrying out a security activity at the premises must be licensed by the Security Industry Authority.'},
  ]
  // Annex 2: Conditions consistent with operating schedule + responsible authorities.
  const a2 = [
    {r:'9',  t:'Staff shall direct customers to a nearby cab office or call a cab for customers on request.'},
    {r:'10', t:'No child or young person under 18 will be permitted to be on the premises after 19:00.'},
    {r:'11', t:'Comprehensive CCTV system per Metropolitan Police Crime Prevention minimum requirements. All public areas, entry and exit points covered. Continuous recording while open. Recordings stored 31 days minimum, available immediately to Police or authorised officer.'},
    {r:'12', t:'A staff member conversant with the CCTV system must be on the premises at all times when open to the public, and able to show recent footage to a Police or authorised council officer on request.'},
    {r:'13', t:'No bottles, glasses or drinks shall be permitted to be taken beyond the terrace at any time.'},
    {r:'14', t:'After 22:00 the use of the outside terrace shall cease and be closed to customers, and a maximum of four (4) smokers at any one time will be permitted on the outside terrace after that time.'},
    {r:'15', t:'Notices prominently displayed by the entry/exit door and servery: CCTV & Challenge 25 in operation; underage / proxy sales rules; permitted hours; outside terrace times; no bottles/glasses beyond terrace; respect residents and leave quietly; zero tolerance to drugs/weapons; max 4 smokers on the terrace after 22:00.'},
    {r:'16', t:'A minimum of 2 staff shall be on duty in the premises at any time.'},
    {r:'17', t:'SIA door supervisors shall be employed on a risk-assessed basis whenever licensable activity is taking place. Full details entered in the daily register.'},
    {r:'18', t:'No persons shall be permitted to leave the premises with opened containers containing alcohol.'},
    {r:'19', t:'Challenge 25 proof-of-age scheme — only photographic ID (driving licence, passport) accepted.'},
    {r:'20', t:'An incident log shall be kept on the premises and made available on request: crimes reported, ejections, complaints, disorder, drug or weapon seizures, CCTV faults, refusals of alcohol sale, visits by relevant authorities.'},
    {r:'21', t:'Premises operates a zero-tolerance policy to drugs, complying with Hackney Police Drugs and Weapons policy where appropriate.'},
    {r:'22', t:'All instances of crime and disorder witnessed or brought to the attention of staff to be reported by the Designated Premises Supervisor or responsible member of staff to the police.'},
    {r:'23', t:'All staff shall receive training on alcohol-sales legislation (underage and drunken persons) with refresher training every 12 months. Written records kept on premises.'},
    {r:'24', t:'The premises licence holder or DPS shall ensure that all management and staff who are not personal licence holders are fully trained and briefed on the four licensing objectives and Challenge 25.'},
    {r:'25', t:'If door supervisors are not on duty, at the terminal hour a staff member shall be tasked to monitor departing customers — remind them to leave quietly, ensure no loitering, monitor conduct, ensure no bottles/glasses/drinks leave the terrace.'},
    {r:'26', t:'All sales of alcohol shall only be to those who are using the mini golf and arcade/gaming facilities. (Critical bar-only constraint — variation required.)', highlight: true},
  ]
  // Annex 3: Conditions attached after a hearing by the licensing authority.
  const a3 = [
    {r:'27', t:'All licensable activity will cease 30 minutes before the premises closes each day.'},
    {r:'28', t:'No off sales of alcohol are permitted.'},
    {r:'29', t:'A written dispersal policy shall be kept on the premises and made available to a Police or other authorised officer on request.'},
    {r:'30', t:'All customers shall book a two (2) hour session/slot before they commence using the mini golf and arcade/gaming facilities on the premises. (Bar-only constraint — variation required.)', highlight: true},
    {r:'31', t:'Only background music will be played at the premises at any time.'},
    {r:'32', t:'Capacity (excluding staff): Golf area 20 · Bar seated area 30 · Arcade area 17 · Total 67.'},
  ]
  const dayKeys = ['mon','tue','wed','thu','fri','sat','sun']
  const cs = {background:'var(--ink-2)',border:'1px solid rgba(201,168,76,0.12)',borderRadius:10,padding:20,marginBottom:12}
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div style={cs}>
          <STitle>Premises Licence — Part 1</STitle>
          <Row label="Licensing Act 2003" value="London Borough of Hackney" />
          <Row label="Licence number"     value="109311" gold />
          <Row label="Premises"           value="Plonk Golf, Railway Arch 407, Mentmore Terrace, London E8 3PH" />
          <Row label="Issuing authority"  value="LB Hackney Licensing · 1 Hillman St, E8 1DY" />
          <Row label="Granted by"         value="Gerry McCarthy (Head of Community Safety, Enforcement & Business Regulation)" />
        </div>
        <div style={cs}>
          <STitle>Premises Licence — Part 2</STitle>
          <Row label="Holder"                       value="Mr Elliot Scott" gold />
          <Row label="Holder address"                value="268 Kingsland Road, London E8 4BH" />
          <Row label="Company number"                value="N/A — held in personal name" />
          <Row label="Date of grant"                 value="10 November 2020" />
          <Row label="Re-issued"                     value="11 May 2023" />
          <Row label="Designated Premises Supervisor" value="Klaudia Ciepluch" gold />
        </div>
      </div>

      <div style={cs}>
        <STitle>Premises Opening Hours (current — post-2023 variation)</STitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:12 }}>
          {dayKeys.map(d=>{
            const isWeekend = d === 'fri' || d === 'sat'
            const close = isWeekend ? '00:30' : '23:30'
            return (
              <div key={d} style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--cream-dim)', marginBottom:4 }}>{d.charAt(0).toUpperCase()+d.slice(1)}</div>
                <div style={{ fontSize:11, color:'var(--cream)', background:'var(--ink-3)', borderRadius:4, padding:'3px 2px' }}>07:00</div>
                <div style={{ fontSize:10, color:'var(--gold-dim)', margin:'2px 0' }}>–</div>
                <div style={{ fontSize:11, color: isWeekend ? 'var(--gold)' : 'var(--cream)', background:'var(--ink-3)', borderRadius:4, padding:'3px 2px', fontWeight: isWeekend ? 600 : 400 }}>{close}</div>
              </div>
            )
          })}
        </div>
        <STitle>Licensable Activities</STitle>
        <div style={{ fontSize:12, color:'var(--cream-dim)', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>Supply of Alcohol — On Premises only · Mon–Thu &amp; Sun 12:00–23:00 · <span style={{ color:'var(--gold)', fontWeight:600 }}>Fri–Sat 12:00–00:00</span> (variation granted)</div>
        <div style={{ fontSize:12, color:'var(--cream-dim)', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>Premises hours: Mon–Thu &amp; Sun 07:00–23:30 · <span style={{ color:'var(--gold)', fontWeight:600 }}>Fri–Sat 07:00–00:30</span></div>
        <div style={{ fontSize:12, color:'var(--cream-dim)', padding:'4px 0' }}>Non-standard timings: on Sundays preceding a Bank Holiday Monday, premises hours extend until 00:30.</div>
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
        <STitle>Annex 2 — Conditions consistent with the Operating Schedule</STitle>
        {a2.map(c=>(
          <div key={c.r} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', background: c.highlight ? 'rgba(248,113,113,0.04)' : 'transparent' }}>
            <div style={{ fontSize:12, color: c.highlight ? '#F87171' : 'var(--gold)', minWidth:36, flexShrink:0, fontWeight:600 }}>{c.r}</div>
            <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>{c.t}</div>
          </div>
        ))}
      </div>

      <div style={cs}>
        <STitle>Annex 3 — Conditions attached after a hearing by the Licensing Authority</STitle>
        {a3.map(c=>(
          <div key={c.r} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', background: c.highlight ? 'rgba(248,113,113,0.04)' : 'transparent' }}>
            <div style={{ fontSize:12, color: c.highlight ? '#F87171' : 'var(--gold)', minWidth:36, flexShrink:0, fontWeight:600 }}>{c.r}</div>
            <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>{c.t}</div>
          </div>
        ))}
      </div>

      <div style={cs}>
        <STitle>Variation history</STitle>
        <Row label="2023 application"  value="Vary alcohol hours Thu–Sat to 00:00; premises to 00:30" />
        <Row label="Date heard"         value="19 October 2023 (Licensing Sub-Committee)" />
        <Row label="Local objections"   value="3 — Ellingfort Rd / Croston St residents (noise, breach allegations)" />
        <Row label="Outcome"            value="Granted — Fri–Sat alcohol to 00:00, premises to 00:30" gold />
        <Row label="Operating hours now" value="Mon–Thu &amp; Sun: alcohol to 23:00 · Fri–Sat: alcohol to 00:00" />
      </div>
    </div>
  )
}

// =============================================================================
// DEVELOPMENT — Hackney-specific strategies, residential context considered
// =============================================================================
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

      {/* SECTION 1 — Site context & neighbourhood constraints */}
      <div>
        <div style={{ fontSize:11, color:'#F59E0B', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>Neighbourhood Constraints</div>
        <h2 style={{ fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:900, color:'#fff', textTransform:'uppercase', marginBottom:12 }}>Operating in a Residential-Adjacent Conservation Area</h2>
        <p style={{ fontSize:14, color:'#9CA3AF', lineHeight:1.6, marginBottom:24 }}>
          Mentmore Terrace sits inside London Fields ward, immediately backing onto residential streets (Ellingfort Road, Martello Terrace, Croston Street). The arches are leased from <strong style={{ color:'var(--cream)' }}>The Arch Company</strong> (Blackstone / Telereal Trillium JV — the freehold transferred from Network Rail in 2019). Any development plan must work around four hard constraints.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={card('#F87171')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#F87171', border:'1px solid #F87171', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Constraint A · Residential Boundary</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>The rear yard backs onto homes</h3>
            {[
              'Active resident voice — three formal objections to the 2023 hours-extension variation, citing noise, breach allegations and dispersal nuisance',
              'The rear terrace / former crazy-golf area has no soundproofing — lifted directly from the residents\' Licensing Sub-Committee submission',
              'Any hours extension or capacity uplift requires a soundproofing investment + dispersal policy as a precondition',
              'Site change-of-use is now Sui Generis (granted) — the planning question that drove resident concern in 2023 is settled',
            ].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13, color:'#D1D5DB' }}><Arr c="#F87171" /><span>{item}</span></div>)}
          </div>
          <div style={card('#C9A84C')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#C9A84C', border:'1px solid #C9A84C', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Constraint B · Conservation Area</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>London Fields conservation area</h3>
            {[
              'London Fields ward sits in a Hackney conservation area — Victorian terrace context governs streetscene impact',
              'External alterations (signage, frontage changes, dormers) are scrutinised more closely than in non-conservation streets',
              'No structural changes to the arch frontage without listed-building / conservation consent',
              'Garden refurbishment works (in the £12k Use of Funds line) must respect the screening and visibility expectations of the conservation area',
            ].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13, color:'#D1D5DB' }}><Arr c="#C9A84C" /><span>{item}</span></div>)}
          </div>
          <div style={card('#9CA3AF')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#9CA3AF', border:'1px solid #9CA3AF', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Constraint C · Arch Company lease</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>Freehold sits with The Arch Company</h3>
            {[
              'The 4,455 railway arches transferred from Network Rail to The Arch Company (Blackstone / Telereal Trillium) in 2019 for £1.46bn',
              'No basement to develop — railway arches sit at street level by definition (vs Borough\'s Montague Close vaults)',
              'No third-party tenant in adjacent space to reclaim — different physical context to Borough',
              'Rent-review consultation through Guardians of the Arches charter — landlord-side variations are charter-bound',
            ].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13, color:'#D1D5DB' }}><Arr c="#9CA3AF" /><span>{item}</span></div>)}
          </div>
          <div style={card('#4FC3F7')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#4FC3F7', border:'1px solid #4FC3F7', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Constraint D · Licence track record</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>Working relationship with the licensing authority</h3>
            {[
              'The 2023 hearing surfaced resident objections — booking enforcement, capacity, off-sales, take-away alcohol — which the variation defended successfully',
              'Hours extension granted: Fri–Sat alcohol to 00:00, premises to 00:30 — the venue now operates with a confirmed track record of winning a contested variation',
              'Bar-only restatement strengthens the next application: it explicitly resolves the booking-rule and walk-in concerns residents raised in 2023',
              'Pre-application engagement with the LBH Licensing Officer (Shan Uthayasangar) and Met Police remains decisive in residential wards — informal alignment before submission',
            ].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13, color:'#D1D5DB' }}><Arr c="#4FC3F7" /><span>{item}</span></div>)}
          </div>
        </div>
      </div>

      {/* SECTION 2 — Day-1 development (in scope) */}
      <div>
        <div style={{ fontSize:11, color:'#2DD4BF', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>Phase 1 · Day-1 Development</div>
        <h2 style={{ fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:900, color:'#fff', textTransform:'uppercase', marginBottom:12 }}>Within Existing Licence — In Scope at Reopening</h2>
        <p style={{ fontSize:14, color:'#9CA3AF', lineHeight:1.6, marginBottom:24 }}>
          The £100k Use of Funds covers four physical works that operate inside the current premises licence and conservation envelope. No external consents required.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={card('#2DD4BF')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#2DD4BF', border:'1px solid #2DD4BF', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>£12,000 inc VAT</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>Garden Refurbishment</h3>
            {[
              'Rebuild the rear outdoor trading area with planting, screening, and surface upgrade',
              'Soundproofing investment is the strategic prerequisite — directly addresses the 2023 resident objections',
              'Stays within the 20-person outdoor capacity (Annex 3 Condition 32) and the 22:00 close (Condition 14)',
              'Improves yield per cover during peak summer trade without triggering any licence variation',
            ].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13, color:'#D1D5DB' }}><Arr c="#2DD4BF" /><span>{item}</span></div>)}
          </div>
          <div style={card('#C9A84C')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#C9A84C', border:'1px solid #C9A84C', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>£10,000 inc VAT</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>Interior Completion + Signage</h3>
            {[
              'Bar fit-out completion (back-bar, glasswash positioning, service stations)',
              'Frontage signage rebrand to No Dice Hackney — conservation-area review for new external signage',
              'Internal acoustic treatment (rear wall, ceiling baffles)',
              'Operates inside the granted Sui Generis planning use — bespoke class explicitly recognises the entertainment-led operation',
            ].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13, color:'#D1D5DB' }}><Arr c="#C9A84C" /><span>{item}</span></div>)}
          </div>
          <div style={card('#4FC3F7')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#4FC3F7', border:'1px solid #4FC3F7', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>£42,000 inc VAT</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>Stock Purchase from Liquidators</h3>
            {[
              'Bar equipment, kitchen, glassware, games — purchased at liquidation pricing',
              'Operational from Day 1, no commissioning lead time',
              'Stays inside the 67-person total capacity (Annex 3 Condition 32)',
              'Per-line itemisation TBD pending liquidator inventory',
            ].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13, color:'#D1D5DB' }}><Arr c="#4FC3F7" /><span>{item}</span></div>)}
          </div>
          <div style={card('#A78BFA')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#A78BFA', border:'1px solid #A78BFA', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>£26,750 inc VAT</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>Landlord Rent Deposit (3 months)</h3>
            {[
              'Held by The Arch Company per the lease — refundable on exit',
              'Pre-trade cash protection — does not consume working capital',
              'Establishes rent compliance footing with the freeholder from Day 1',
              'No development consent required',
            ].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:13, color:'#D1D5DB' }}><Arr c="#A78BFA" /><span>{item}</span></div>)}
          </div>
        </div>
      </div>

      {/* SECTION 3 — Premises Licence Variations */}
      <div>
        <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>Phase 2 · Premises Licence Variations</div>
        <h2 style={{ fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:900, color:'#fff', textTransform:'uppercase', marginBottom:12 }}>Existing Licence Conditions — Limit Bar-Only Operation</h2>
        <p style={{ fontSize:14, color:'#9CA3AF', lineHeight:1.6, marginBottom:20 }}>
          Premises Licence 109311 was granted in November 2020 around a mini-golf-and-arcade-led operation. Two conditions in particular are incompatible with the bar-only restatement and need a variation application.
        </p>

        <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, padding:'14px 18px', marginBottom:24, fontSize:13, color:'#D1D5DB', lineHeight:1.6 }}>
          <span style={{ color:'#F59E0B' }}>⚠️ </span>The licence is currently held by <strong>Mr Elliot Scott</strong> in personal name, with <strong>Klaudia Ciepluch</strong> as DPS. A transfer to <strong>No Dice Hackney Ltd</strong> would normally accompany the variation — confirm with the LBH licensing officer (Shan Uthayasangar) before submission.
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          {/* Activity-link variation */}
          <div style={card('#2DD4BF')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#2DD4BF', border:'1px solid #2DD4BF', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Highest priority</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Annex 2 / Condition 26 — Activity-link removal</h3>
            <p style={{ fontSize:13, color:'#F87171', marginBottom:16 }}>Current: alcohol sales only to mini-golf and arcade/gaming users.</p>
            {[
              'Bar-only restatement removes the mini-golf operation entirely — Condition 26 becomes structurally impossible to meet',
              'Direct precedent: Borough\'s Condition 340 (parallel wording) is the same variation target on the SE1 site',
              'Propose to vary to: any customer using the venue (board games, pool, ping pong, arcade) may purchase alcohol — preserves the activity-led character',
              'Apply for this one first — easiest legal argument, builds credibility with the authority',
            ].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:'#D1D5DB' }}><Arr c="#2DD4BF" /><span>{item}</span></div>)}
            <div style={{ marginTop:20 }}><Bar label="Likelihood" pct="60–70%" val={0.65} color="#2DD4BF" /></div>
          </div>

          {/* Booking variation */}
          <div style={card('#4FC3F7')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#4FC3F7', border:'1px solid #4FC3F7', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Bar-only critical</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Annex 3 / Condition 30 — 2-hour booking removal</h3>
            <p style={{ fontSize:13, color:'#F87171', marginBottom:16 }}>Current: customers must book a 2-hour session/slot before using mini golf and arcade/gaming.</p>
            {[
              'Without mini golf the booking gate has no operational basis — bar-only relaunch is incompatible',
              'Residents object that the booking rule is currently unenforced — cite this in the variation as a clean break with the past, not a relaxation',
              'Replace with: walk-in capacity managed via door staff and the existing 67-person total cap (Condition 32) — no operational change for residents',
              'Pair with the Condition 26 variation in a single application to share the consultation burden',
            ].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:'#D1D5DB' }}><Arr c="#4FC3F7" /><span>{item}</span></div>)}
            <div style={{ marginTop:20 }}><Bar label="Likelihood (paired with C26)" pct="50–60%" val={0.55} color="#4FC3F7" /></div>
          </div>

          {/* Hours extension — granted */}
          <div style={card('#10B981')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#10B981', border:'1px solid #10B981', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>✓ Granted — track record</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Hours extension Fri–Sat to 00:00 (granted)</h3>
            <p style={{ fontSize:13, color:'#10B981', marginBottom:16 }}>Status: granted post-2023 hearing. Fri–Sat alcohol now to 00:00, premises to 00:30. Mon–Thu &amp; Sun unchanged at 23:00 / 23:30.</p>
            {[
              'Variation defended through three formal resident objections (Ellingfort Rd / Croston St) — strong precedent for the bar-only relaunch',
              'Establishes a working relationship with the LBH Licensing Officer (Shan Uthayasangar) and the Hackney Licensing Sub-Committee',
              'Demonstrates that the venue can win contested variations in a residential-adjacent ward — a transferable asset for future applications (C26, C30, C14)',
              'Captures the highest-revenue Fri/Sat late-night trade without further consents — already in the forecast base',
              'A further extension (e.g. Thu to 00:00, or Fri/Sat to 01:00) is realistic only after a 12-month clean compliance window under the bar-only model',
            ].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:'#D1D5DB' }}><Arr c="#10B981" /><span>{item}</span></div>)}
            <div style={{ marginTop:20 }}><Bar label="Future further-extension likelihood" pct="25–35%" val={0.3} color="#9CA3AF" /></div>
          </div>

          {/* Outside terrace variation */}
          <div style={card('#C9A84C')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#C9A84C', border:'1px solid #C9A84C', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Soundproofing-gated</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>Annex 2 / Condition 14 — Outside terrace 22:00 close</h3>
            <p style={{ fontSize:13, color:'#F87171', marginBottom:16 }}>Current: outside terrace closes at 22:00; max 4 smokers after.</p>
            {[
              'Garden refurbishment + acoustic screening is the prerequisite — without measurable soundproofing this is a non-starter',
              'Propose Fri/Sat extension to 22:30 only, summer trial — minimal incremental noise burden on neighbours',
              'Pair with a written dispersal policy update and explicit signage commitments',
              'Apply only after the activity-link / booking variations land',
            ].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:'#D1D5DB' }}><Arr c="#C9A84C" /><span>{item}</span></div>)}
            <div style={{ marginTop:20 }}><Bar label="Likelihood (post-soundproofing)" pct="35–45%" val={0.4} color="#C9A84C" /></div>
          </div>
        </div>

        <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderLeft:'4px solid #6366F1', borderRadius:8, padding:'16px 20px', marginBottom:16 }}>
          <p style={{ fontSize:13, color:'#9CA3AF', fontStyle:'italic', marginBottom:12 }}>Recommended sequencing — in priority order:</p>
          <Tag label="C26 + C30 (paired) — bar-only critical" color="#2DD4BF" />
          <Tag label="C14 (post-soundproofing)" color="#C9A84C" />
          <Tag label="Hours: Fri–Sat 00:00 ✓ granted" color="#10B981" />
          <Tag label="Engage LBH Licensing pre-application" color="#9CA3AF" />
        </div>
        <p style={{ fontSize:12, color:'#6B7280', fontStyle:'italic', textAlign:'center' }}>Likelihood ranges are management estimates. Engage a Hackney-specialist licensing solicitor before any submission.</p>
      </div>

    </div>
  )
}

export default function VenueInfo() {
  const [tab, setTab] = useState('catchment')
  const tabComponents = {
    catchment:     <TabCatchment />,
    location:      <TabLocation />,
    floorPlan:     <TabFloorPlan />,
    courseGallery: <Gallery images={COURSE_IMGS} />,
    venueGallery:  <Gallery images={VENUE_IMGS} />,
    gardenGallery: <Gallery images={GARDEN_IMGS} />,
    drinksGallery: <Gallery images={DRINKS_IMGS} />,
    gamesGallery:  <Gallery images={GAMES_IMGS} />,
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
      <div style={{ padding:'20px 32px 32px', borderTop:'1px solid rgba(201,168,76,0.12)', marginTop:12 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>No Dice Hackney</div>
        <div style={{ fontSize:14, color:'var(--cream-dim)' }}>Venue Information · Arch 407 Mentmore Terrace, London E8 3PH · Premises Licence 109311</div>
      </div>
    </div>
  )
}
