import React, { useState } from 'react'

const TABS = ['Catchment','Location','Floor Plan','Venue Gallery','Course Gallery','Drinks Gallery','Licence','Development']

const STATS = [
  { value:'130K+', label:'LONDON BRIDGE FOOTFALL', sub:'daily station passengers', src:'TfL 2024' },
  { value:'15–20M', label:'BOROUGH MARKET VISITORS', sub:'annual visitors to the area', src:'Borough Market Trust' },
  { value:'£57K', label:'SE1 MEDIAN INCOME', sub:'household income', src:'ONS 2024' },
  { value:'48%', label:'AGE 25–44', sub:'of SE1 residents', src:'Census 2021' },
  { value:'90,475', label:'VENUE PAGE VIEWS 2025', sub:'verified GA4', src:'Google Analytics' },
  { value:'58%', label:'ORGANIC SEARCH SHARE', sub:'of all traffic', src:'GA4 2025' },
]
const VENUE_IMGS = [
  { src:'/venue_gallery_1.jpg', caption:'Pool tables & arcades arch' },
  { src:'/venue_gallery_2.jpg', caption:'Bar & board games area' },
  { src:'/venue_gallery_3.jpg', caption:'Pool room' },
  { src:'/venue_gallery_4.jpg', caption:'Arcades & pinball machines' },
  { src:'/venue_gallery_5.jpg', caption:'Arcade detail' },
  { src:'/venue_gallery_6.jpg', caption:'Foosball table' },
  { src:'/venue_gallery_7.jpg', caption:'Air hockey & gaming' },
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
  { src:'/drinks_7.jpg', caption:'Jungle mojito' },
  { src:'/drinks_8.png', caption:'Berry smash' },
  { src:'/drinks_9.png', caption:'Coconut lime cooler' },
]

export default function VenueInfo() {
  const [tab, setTab] = useState('Catchment')
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [courseIdx, setCourseIdx] = useState(0)
  const [drinksIdx, setDrinksIdx] = useState(0)

  const Gallery = ({ imgs, idx, setIdx }) => (
    <div>
      <div style={{ position:'relative', borderRadius:10, overflow:'hidden', marginBottom:16 }}>
        <img src={imgs[idx].src} alt={imgs[idx].caption} style={{ width:'100%', height:420, objectFit:'cover', display:'block' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.8))', padding:'24px 20px 16px' }}>
          <div style={{ fontSize:12, color:'var(--cream)' }}>{imgs[idx].caption}</div>
          <div style={{ fontSize:10, color:'var(--cream-dim)', marginTop:2 }}>{idx+1} / {imgs.length}</div>
        </div>
        <button onClick={() => setIdx(i => (i-1+imgs.length)%imgs.length)} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', fontSize:16 }}>←</button>
        <button onClick={() => setIdx(i => (i+1)%imgs.length)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', fontSize:16 }}>→</button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${imgs.length},1fr)`, gap:6 }}>
        {imgs.map((img, i) => (
          <img key={i} src={img.src} alt={img.caption} onClick={() => setIdx(i)} style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:6, cursor:'pointer', border:`2px solid ${i===idx?'var(--gold)':'transparent'}`, transition:'border 0.15s' }} />
        ))}
      </div>
    </div>
  )

  const LicRow = ([l,v]) => (
    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', gap:12 }}>
      <span style={{ fontSize:10, color:'var(--cream-dim)', flexShrink:0 }}>{l}</span>
      <span style={{ fontSize:10, color:'var(--cream)', textAlign:'right' }}>{v}</span>
    </div>
  )

  return (
    <div style={{ minHeight:'100%', background:'var(--ink)', color:'var(--cream)' }}>
      <div style={{ padding:'20px 32px 0', borderBottom:'1px solid rgba(201,168,76,0.12)' }}>
        <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6 }}>The Venue</div>
        <div style={{ fontSize:13, color:'var(--cream-dim)', marginBottom:16 }}>No Dice Borough · Arches B,C,D,E Montague Close · SE1 9DA</div>
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 16px', fontSize:10, cursor:'pointer', border:'none', background:'transparent', letterSpacing:'0.08em', textTransform:'uppercase', borderBottom:`2px solid ${tab===t?'var(--gold)':'transparent'}`, color:tab===t?'var(--gold)':'var(--cream-dim)', transition:'all 0.15s', whiteSpace:'nowrap' }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:'28px 32px 48px' }}>

        {tab==='Catchment' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:32 }}>
              {STATS.map(s => (
                <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:10, padding:20 }}>
                  <div style={{ fontSize:32, color:'var(--gold)', marginBottom:6, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold-dim)', marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:10, color:'var(--cream-dim)', marginBottom:4 }}>{s.sub}</div>
                  <div style={{ fontSize:9, color:'rgba(184,176,160,0.5)' }}>{s.src}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', marginBottom:16 }}>Catchment Strengths</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                ['🏢','City Worker Proximity','The Square Mile is within 10-minute walking distance. Corporate lunch, after-work and team-building bookings are a core revenue opportunity.'],
                ['🎓','Young Professional Base','48% of SE1 residents are aged 25–44 — the primary spending demographic for experience-led hospitality.'],
                ['✈️','International Tourism','Borough Market and The Shard draw millions of international visitors annually. No Dice Borough is a natural tourist magnet.'],
                ['🌙','Evening Economy','London Bridge is a major night economy hub. Friday and Saturday footfall is exceptional with no enforced curfew on experience venues.'],
              ].map(([icon,title,body]) => (
                <div key={title} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:18 }}>
                  <div style={{ fontSize:20, marginBottom:8 }}>{icon}</div>
                  <div style={{ fontSize:12, color:'var(--cream)', fontWeight:500, marginBottom:6 }}>{title}</div>
                  <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.6 }}>{body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='Location' && (
          <div>
            <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:10, padding:24, marginBottom:20 }}>
              <div style={{ fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', marginBottom:16 }}>Venue Address</div>
              <div style={{ fontSize:16, color:'var(--cream)', marginBottom:6 }}>Arches B, C, D, E — Montague Close</div>
              <div style={{ fontSize:14, color:'var(--cream-dim)', marginBottom:16 }}>London SE1 9DA · Borough Market</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                {[['London Bridge','3 min walk'],['Borough Market','2 min walk'],['The Shard','5 min walk']].map(([l,v]) => (
                  <div key={l} style={{ textAlign:'center', padding:14, background:'var(--ink-3)', borderRadius:8 }}>
                    <div style={{ fontSize:13, color:'var(--gold)', marginBottom:4 }}>{v}</div>
                    <div style={{ fontSize:10, color:'var(--cream-dim)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius:10, overflow:'hidden', height:380, border:'1px solid rgba(201,168,76,0.15)' }}>
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d310.5!2d-0.08765!3d51.50555!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487603554d9a6f43%3A0x6a1a27c0c53e94!2sMontague+Cl%2C+London+SE1!5e0!3m2!1sen!2suk!4v1" width="100%" height="100%" style={{ border:0 }} allowFullScreen loading="lazy" title="Venue location" />
            </div>
          </div>
        )}

        {tab==='Floor Plan' && (
          <div>
            <div style={{ fontSize:11, color:'var(--cream-dim)', marginBottom:20, lineHeight:1.6 }}>Four railway arches · Arcades · Pool · Bar · Two golf course arches · 22m depth · Basement rights held within lease</div>
            <div style={{ background:'#000', borderRadius:10, overflow:'hidden', border:'1px solid rgba(201,168,76,0.2)', textAlign:'center', padding:20, marginBottom:20 }}>
              <img src="/floorplan_1.png" alt="Venue floor plan" style={{ maxWidth:'100%', maxHeight:500, objectFit:'contain' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {[['Arch B','Arcades & Pool'],['Arch C','Bar & Board Games'],['Arch D','Golf Course 1'],['Arch E','Golf Course 2']].map(([l,v]) => (
                <div key={l} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:8, padding:14, textAlign:'center' }}>
                  <div style={{ fontSize:12, color:'var(--gold)', marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:10, color:'var(--cream-dim)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='Venue Gallery' && <Gallery imgs={VENUE_IMGS} idx={galleryIdx} setIdx={setGalleryIdx} />}
        {tab==='Course Gallery' && <Gallery imgs={COURSE_IMGS} idx={courseIdx} setIdx={setCourseIdx} />}

        {tab==='Drinks Gallery' && (
          <div>
            <div style={{ fontSize:11, color:'var(--cream-dim)', marginBottom:16, lineHeight:1.6 }}>Craft beer on draught · Signature cocktails · Independent London breweries · Bar drives 49% of total revenue</div>
            <Gallery imgs={DRINKS_IMGS} idx={drinksIdx} setIdx={setDrinksIdx} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:20 }}>
              {[['49%','Bar Revenue Share','Largest single income stream — £362,836 in 2025'],['Craft Focus','Independent London Breweries','Camden Town, Cloudwater, Mondo — premium positioning'],['3 Categories','Beer · Wine · Cocktails','Full licensed bar — on-premises consumption only']].map(([v,l,s]) => (
                <div key={l} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:9, padding:16, textAlign:'center' }}>
                  <div style={{ fontSize:22, color:'var(--gold)', marginBottom:4 }}>{v}</div>
                  <div style={{ fontSize:11, color:'var(--cream)', marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:10, color:'var(--cream-dim)' }}>{s}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='Licence' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { title:'PREMISES LICENCE', sub:'Licensing Act 2003 · Issued by Southwark Council', rows:[['Licence Number','888057'],['Licence Holder','Plonk Golf Ltd'],['Premises','Arches B C D And E, Montague Close, London SE1 9DA'],['Issue Date','19/01/2026'],['OS Map Ref','532733180272']] },
                { title:'DESIGNATED PREMISES SUPERVISOR', sub:'', rows:[['Name','Klaudia Ciepluch'],['Address','Flat 11 Clichy House, Stepney Way, London E1 3HH'],['Personal Licence','157679'],['Issuing Authority','L.B Tower Hamlets']] },
                { title:'COMPANY DETAILS', sub:'', rows:[['Company','Plonk Golf Ltd'],['Company Number','10328982'],['Registered Address','15 Mentmore Terrace, Hackney, London E8 3PN']] },
              ].map(sec => (
                <div key={sec.title} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:18 }}>
                  <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', marginBottom:sec.sub?3:12 }}>{sec.title}</div>
                  {sec.sub && <div style={{ fontSize:10, color:'var(--cream-dim)', marginBottom:12 }}>{sec.sub}</div>}
                  {sec.rows.map(LicRow)}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { title:'LICENSABLE ACTIVITIES', rows:[['Films','Indoors'],['Indoor Sporting Events','Licensed'],['Sale of Alcohol','On-premises only']] },
                { title:'OPENING HOURS', rows:[['Monday–Thursday','11:00 – 23:00'],['Friday','11:00 – 23:30'],['Saturday','10:00 – 23:30'],['Sunday','12:00 – 22:30'],['Premises Close','30 mins after alcohol cutoff']] },
                { title:'LICENCE VARIATIONS — TARGET', rows:[['Remove golf-drink link','65–75% — apply first'],['Extended hours to 1am','35–45% likelihood'],['Live sports (international)','40–55% likelihood'],['Extended hours to 2am','20–30% likelihood']] },
              ].map(sec => (
                <div key={sec.title} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:18 }}>
                  <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', marginBottom:12 }}>{sec.title}</div>
                  {sec.rows.map(LicRow)}
                </div>
              ))}
              <div style={{ background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:10, padding:16 }}>
                <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', marginBottom:8 }}>Transfer Note</div>
                <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.6 }}>The licence is currently held by <strong style={{ color:'var(--cream)' }}>Plonk Golf Ltd (Co. 10328982)</strong>. A transfer to No Dice Borough Ltd must be completed before or alongside any variation application.</div>
              </div>
            </div>
          </div>
        )}

        {tab==='Development' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:10, padding:24 }}>
              <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', marginBottom:4 }}>Venue Expansion · Borough Market SE1</div>
              <div style={{ fontSize:20, color:'var(--cream)', marginBottom:10 }}>Basement Space</div>
              <div style={{ fontSize:12, color:'var(--cream-dim)', marginBottom:20, lineHeight:1.6 }}>The venue sits above 300m² of undeveloped basement space with full rights to sublet and carry out works. Expansion is structural upside already embedded in the lease.</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                {[
                  { tag:'SHORT TERM OPPORTUNITY', title:'Basement Below Bar & Arcade Arch', col:'var(--teal)', bullets:['200m² directly below the bar and arcade arch','Available for development now — no structural barriers','Proposed uses: karaoke rooms · listening bar · private hire games spaces','High-margin private hire and events revenue potential','Extends the venue offer without expanding the above-ground footprint'] },
                  { tag:'LONG TERM OPPORTUNITY', title:'Full Basement & TfL Tunnel Access', col:'var(--gold)', bullets:['300m² of developable basement beneath the full venue','Rights to sublet and carry out works held within the lease','Structural costs covered by the landlord and building insurance policy','Fit-out to be carried out by No Dice Borough Ltd','100m² TfL tunnel opens once TfL installs a new staircase'] },
                ].map(v => (
                  <div key={v.tag} style={{ background:'var(--ink-3)', borderRadius:8, padding:16, borderTop:`2px solid ${v.col}` }}>
                    <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:v.col, marginBottom:8 }}>{v.tag}</div>
                    <div style={{ fontSize:12, color:'var(--cream)', marginBottom:10 }}>{v.title}</div>
                    {v.bullets.map((b,i) => <div key={i} style={{ display:'flex', gap:8, marginBottom:5, fontSize:10, color:'var(--cream-dim)' }}><span style={{ color:v.col, flexShrink:0 }}>→</span>{b}</div>)}
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
                {['Lease-backed rights','Structural costs: landlord','400m² total potential'].map(l => (
                  <div key={l} style={{ textAlign:'center', padding:10, background:'rgba(201,168,76,0.08)', borderRadius:8, border:'1px solid rgba(201,168,76,0.2)', fontSize:11, color:'var(--gold)' }}>{l}</div>
                ))}
              </div>
              <div style={{ padding:12, background:'rgba(201,168,76,0.06)', borderRadius:8, fontSize:11, color:'var(--cream-dim)', lineHeight:1.6, fontStyle:'italic' }}>
                ★ The basement represents significant embedded upside — it is not speculative. The rights exist, the space exists, and the structural costs are not borne by No Dice Borough Ltd.
              </div>
            </div>

            <div style={{ background:'var(--ink-2)', border:'1px solid rgba(45,212,191,0.2)', borderRadius:10, padding:24 }}>
              <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--teal)', marginBottom:4 }}>External Space · Conditional Opportunity</div>
              <div style={{ fontSize:20, color:'var(--cream)', marginBottom:10 }}>Yard Space & External Capacity</div>
              <div style={{ fontSize:12, color:'var(--cream-dim)', marginBottom:16, lineHeight:1.6 }}>A significant external yard at the front of the venue is currently used by Boro Bistro under a landlord agreement. The opportunity to reclaim this space is live and represents a material uplift in capacity and bar revenue.</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div style={{ background:'var(--ink-3)', borderRadius:8, padding:16 }}>
                  <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#E67E22', marginBottom:8 }}>Current Status · Boro Bistro — Final Warning</div>
                  {['The yard is private land owned by Southwark Cathedral','Boro Bistro currently hold usage rights to this space','They have misused the space and are on their final warning','One further breach gives No Dice Borough the right to reclaim the yard'].map((b,i) => <div key={i} style={{ display:'flex', gap:8, marginBottom:5, fontSize:10, color:'var(--cream-dim)' }}><span style={{ color:'#E67E22', flexShrink:0 }}>→</span>{b}</div>)}
                  <div style={{ marginTop:10, padding:'7px 10px', background:'rgba(230,126,34,0.1)', borderRadius:6, fontSize:10, color:'#E67E22' }}>Situation is live — outcome subject to Boro Bistro next infraction</div>
                </div>
                <div style={{ background:'var(--ink-3)', borderRadius:8, padding:16 }}>
                  <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--teal)', marginBottom:8 }}>If Reclaimed — Large Capacity & Bar Revenue Upside</div>
                  {['Very large additional outdoor capacity for bar service and social use','Significantly increases peak revenue, particularly for events and summer trading','No takeaway licence required — all private land, no public highway involvement','Bar sales extend naturally into the yard without additional licensing complexity',"Transforms the venue's kerb presence on one of London's most visited streets"].map((b,i) => <div key={i} style={{ display:'flex', gap:8, marginBottom:5, fontSize:10, color:'var(--cream-dim)' }}><span style={{ color:'var(--teal)', flexShrink:0 }}>→</span>{b}</div>)}
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--cream-dim)', lineHeight:1.6, fontStyle:'italic', padding:12, background:'rgba(45,212,191,0.06)', borderRadius:8 }}>
                ★ The yard is not speculative pipeline — it is an active situation. If Boro Bistro commit one further breach, the opportunity to reclaim this space becomes available immediately.
              </div>
            </div>

            <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:10, padding:24 }}>
              <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', marginBottom:4 }}>Premises Licence No. 888057 · Southwark Council</div>
              <div style={{ fontSize:20, color:'var(--cream)', marginBottom:10 }}>Licence Development</div>
              <div style={{ fontSize:11, color:'var(--cream-dim)', marginBottom:20, lineHeight:1.6 }}>The current premises licence was granted for a golf-led activity venue. Four targeted variations would materially increase revenue potential. Zero enforcement history and an activity-led format are strong grounds for all four applications.</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
                {[
                  { tag:'TARGET: 1AM INITIALLY · 2AM LONG TERM', title:'Extended Trading Hours', lik:'35–45% to 1am · 20–30% to 2am', col:'#C9A84C', bullets:['Currently: Alcohol to 11pm · Premises closes 11:30pm','Conditions 341, 342 and 343 restrict all activity to 11pm–11:30pm','DJ and late-night events format requires 1am licence as a minimum','Activity-led venue (not a bar) strengthens the case significantly','Propose 12-month trial period to reduce perceived risk'] },
                  { tag:'HIGHEST LIKELIHOOD · APPLY FIRST', title:'Activity-Led Alcohol Access', lik:'65–75% likelihood', col:'var(--teal)', bullets:['Currently: Alcohol tied to golf ticket or arcade token purchase','Condition 340 limits alcohol to golf, arcade and board game participants','Board game players can already drink freely — extending this is proportionate','Proposed: any customer using activities may purchase alcohol','Removes compliance burden without changing the activity-led character'] },
                  { tag:'INTERNATIONAL MATCHES ONLY', title:'Live International Sports', lik:'International only 40–55%', col:'#1565C0', bullets:['Currently: No live sports screenings permitted (Condition 353)','Licence already includes Indoor Sporting Event as a licensed activity','Not seeking to become a sports bar — international tournaments only','World Cup, Euros, Olympics — propose advance notification protocol','Avoids weekly Premier League concerns that drove the original condition'] },
                  { tag:'RECOMMENDED APPROACH', title:'How to Maximise Success', lik:'', col:'var(--gold-dim)', bullets:['Apply for golf-drink link change first — easiest win, builds credibility','Obtain a formal zero-incident letter from Met Police Southwark','Engage a Southwark specialist licensing solicitor before any application','Pre-consult informally with licensing authority and police before submitting','Engage Southwark Cathedral directly — their support carries exceptional weight','For hours: propose a 12-month time-limited trial to reduce perceived risk'] },
                ].map(v => (
                  <div key={v.tag} style={{ background:'var(--ink-3)', borderRadius:8, padding:16, borderLeft:`3px solid ${v.col}` }}>
                    <div style={{ fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', color:v.col, marginBottom:6 }}>{v.tag}</div>
                    <div style={{ fontSize:12, color:'var(--cream)', fontWeight:500, marginBottom:v.lik?6:10 }}>{v.title}</div>
                    {v.lik && <div style={{ fontSize:11, color:v.col, marginBottom:8 }}>{v.lik}</div>}
                    {v.bullets.map((b,i) => <div key={i} style={{ display:'flex', gap:7, marginBottom:5, fontSize:10, color:'var(--cream-dim)' }}><span style={{ color:v.col, flexShrink:0 }}>→</span>{b}</div>)}
                  </div>
                ))}
              </div>
              <div style={{ padding:'12px 16px', background:'rgba(183,28,28,0.08)', border:'1px solid rgba(183,28,28,0.2)', borderRadius:8, fontSize:10, color:'var(--cream-dim)', lineHeight:1.6 }}>
                <strong style={{ color:'#E57373' }}>Do not apply for all four variations simultaneously</strong> — this signals a venue seeking to transform its character. Sequence the applications. A clean zero-incident trading record in SE1 is the strongest asset.<br /><br />
                This analysis is for information only and does not constitute legal advice. Engage a licensed specialist solicitor before submitting any variation application to Southwark Council.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
                                                                                                                                                                                                                                                                                                                                                                                                                                        }
