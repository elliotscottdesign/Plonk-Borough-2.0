import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

const TAB_KEYS = ['catchment','location','floorPlan','gallery','licence','development']

const VENUE_IMGS = [
  { src:'/venue_gallery_1.jpg', captionKey:'1' },
  { src:'/venue_gallery_2.jpg', captionKey:'2' },
  { src:'/venue_gallery_3.jpg', captionKey:'3' },
  { src:'/venue_gallery_4.jpg', captionKey:'4' },
  { src:'/venue_gallery_5.jpg', captionKey:'5' },
  { src:'/venue_gallery_6.jpg', captionKey:'6' },
  { src:'/venue_gallery_7.jpg', captionKey:'7' },
]
const COURSE_IMGS = [
  { src:'/Borough_Course_1.jpg', captionKey:'1' },
  { src:'/Borough_Course_2.jpg', captionKey:'2' },
  { src:'/Borough_Course_3.jpg', captionKey:'3' },
  { src:'/Borough_Course_4.jpg', captionKey:'4' },
  { src:'/Borough_Course_5.jpg', captionKey:'5' },
  { src:'/Borough_Course_6.jpg', captionKey:'6' },
]
const DRINKS_IMGS = [
  { src:'/drinks_1.jpg', captionKey:'1' },
  { src:'/drinks_2.jpg', captionKey:'2' },
  { src:'/drinks_3.jpg', captionKey:'3' },
  { src:'/drinks_4.jpg', captionKey:'4' },
  { src:'/drinks_5.jpg', captionKey:'5' },
  { src:'/drinks_6.jpg', captionKey:'6' },
  { src:'/drinks_7.jpg', captionKey:'7' },
  { src:'/drinks_8.png', captionKey:'8' },
  { src:'/drinks_9.png', captionKey:'9' },
]

function Gallery({ images, translateCaption }) {
  const [active, setActive] = useState(0)
  const caption = translateCaption(images[active].captionKey)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ position:'relative', background:'var(--ink-3)', borderRadius:10, overflow:'hidden', aspectRatio:'16/9', maxHeight:'70vh', margin:'0 auto', width:'100%' }}>
        <img src={images[active].src} alt={caption} style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 16px', background:'linear-gradient(transparent,rgba(0,0,0,0.7))', color:'#fff', fontSize:13 }}>{caption}</div>
        {active > 0 && <button onClick={()=>setActive(active-1)} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', border:'none', background:'rgba(0,0,0,0.5)', color:'#fff', cursor:'pointer', fontSize:18 }}>&#8249;</button>}
        {active < images.length-1 && <button onClick={()=>setActive(active+1)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', border:'none', background:'rgba(0,0,0,0.5)', color:'#fff', cursor:'pointer', fontSize:18 }}>&#8250;</button>}
      </div>
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
        {images.map((img,i) => (
          <div key={i} onClick={()=>setActive(i)} style={{ flexShrink:0, width:72, height:50, borderRadius:6, overflow:'hidden', cursor:'pointer', border:`2px solid ${i===active?'var(--gold)':'transparent'}`, opacity:i===active?1:0.6 }}>
            <img src={img.src} alt={translateCaption(img.captionKey)} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
        ))}
      </div>
      <div style={{ fontSize:12, color:'var(--cream-dim)', textAlign:'center' }}>{active+1} / {images.length}</div>
    </div>
  )
}

// Side-index gallery hub — mirrors src/hackney/tabs/VenueInfo.jsx GalleryHub.
// 200px left rail with the gallery list + image counts; right side renders
// the active gallery's viewer.
function GalleryHub({ galleries, headerLabel }) {
  const [activeKey, setActiveKey] = useState(galleries[0].key)
  const active = galleries.find(g => g.key === activeKey) || galleries[0]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:24, alignItems:'start' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:2, borderRight:'1px solid rgba(201,168,76,0.12)', paddingRight:16 }}>
        <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, padding:'4px 12px 10px' }}>{headerLabel}</div>
        {galleries.map(g => {
          const isActive = g.key === activeKey
          return (
            <button
              key={g.key}
              onClick={() => setActiveKey(g.key)}
              style={{
                textAlign:'left',
                padding:'10px 12px',
                fontSize:13,
                cursor:'pointer',
                border:'none',
                background: isActive ? 'rgba(201,168,76,0.10)' : 'transparent',
                color: isActive ? 'var(--gold)' : 'var(--cream-dim)',
                borderLeft:`2px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
                borderRadius:'0 6px 6px 0',
                letterSpacing:'0.04em',
                fontWeight: isActive ? 600 : 400,
                display:'flex',
                justifyContent:'space-between',
                alignItems:'center',
                gap:8,
                transition:'all 0.15s',
              }}
            >
              <span>{g.label}</span>
              <span style={{ fontSize:11, color: isActive ? 'var(--gold-dim)' : 'rgba(255,255,255,0.3)' }}>{g.images.length}</span>
            </button>
          )
        })}
      </div>
      <div><Gallery key={active.key} images={active.images} translateCaption={active.translateCaption} /></div>
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
  const { t } = useTranslation('venue')
  const stats = [
    { k:'footfall', value:'130K+',  color:'#4FC3F7' },
    { k:'visitors', value:'15-20M', color:'#4FC3F7' },
    { k:'income',   value:'£57K',   color:'#2DD4BF' },
    { k:'age',      value:'48%',    color:'#4FC3F7' },
    { k:'views',    value:'90,475', color:'#4FC3F7' },
    { k:'organic',  value:'58%',    color:'#2DD4BF' },
  ]
  const strengths = [
    { k:'city',     icon:'🏢' },
    { k:'young',    icon:'👥' },
    { k:'tourism',  icon:'✈️' },
    { k:'evening',  icon:'🌙' },
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {stats.map(s => (
          <div key={s.k} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:24 }}>
            <div style={{ fontSize:'clamp(2rem,4vw,3rem)', fontWeight:800, color:s.color, lineHeight:1, marginBottom:10 }}>{s.value}</div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--cream)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{t(`catchment.stats.${s.k}.label`)}</div>
            <div style={{ fontSize:13, color:'var(--cream-dim)', marginBottom:6 }}>{t(`catchment.stats.${s.k}.sub`)}</div>
            <div style={{ fontSize:12, color:'var(--cream-dim)', fontStyle:'italic' }}>{t(`catchment.stats.${s.k}.source`)}</div>
          </div>
        ))}
      </div>
      <div style={{ border:'1px solid rgba(201,168,76,0.2)', borderRadius:10, padding:24 }}>
        <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:20 }}>{t('catchment.strengthsHeader')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {strengths.map(s => (
            <div key={s.k} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:20 }}>
              <div style={{ fontSize:28, marginBottom:12 }}>{s.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--cream)', marginBottom:10, letterSpacing:'0.04em' }}>{t(`catchment.strengths.${s.k}.title`)}</div>
              <div style={{ fontSize:13, color:'var(--cream-dim)', lineHeight:1.6 }}>{t(`catchment.strengths.${s.k}.text`)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabLocation() {
  const { t } = useTranslation('venue')
  const { t: tc } = useTranslation('common')
  const minWalk = (n) => tc('units.minWalk', { n })
  const landmarks = [
    { icon:'🚇', nameKey:'london',         typeKey:'transport', dist: minWalk(3),  color:'#4FC3F7' },
    { icon:'🥖', nameKey:'boroughMarket',  typeKey:'footfall',  dist: t('location.tags.adjacent'),  color:'#C9A84C' },
    { icon:'🏙️', nameKey:'shard',          typeKey:'landmark',  dist: minWalk(5),  color:'#2DD4BF' },
    { icon:'🎨', nameKey:'tate',           typeKey:'cultural',  dist: minWalk(12), color:'#2DD4BF' },
    { icon:'🏦', nameKey:'city',           typeKey:'business',  dist: minWalk(10), color:'#4FC3F7' },
    { icon:'🌉', nameKey:'southBank',      typeKey:'tourism',   dist: minWalk(10), color:'#4FC3F7' },
  ]
  const transport = [
    { k:'northern',     station: t('location.transport.northern.sub'),     mins: minWalk(3), bg:'#1a1a1a', border:'#333' },
    { k:'jubilee',      station: t('location.transport.jubilee.sub'),      mins: minWalk(3), bg:'#8B8B8B', border:'#8B8B8B' },
    { k:'southeastern', station: t('location.transport.southeastern.sub'), mins: minWalk(3), bg:'#1E5AA8', border:'#1E5AA8' },
    { k:'thames',       station: t('location.transport.thames.sub'),       mins: minWalk(5), bg:'#0099CC', border:'#0099CC' },
  ]
  const buses = ['17','21','22','35','40','43','47','48','133','141','149','343','381','N21','N35','N133']
  const topCards = [
    { icon:'🚇', name: t('location.landmarks.london.name'),         detail: minWalk(3), sub: t('location.landmarks.london.text'),   color:'#4FC3F7' },
    { icon:'🥖', name: t('location.landmarks.boroughMarket.name'),  detail: t('location.tags.adjacent'), sub: t('location.landmarks.boroughMarket.text'), color:'#C9A84C' },
    { icon:'🌆', name: t('location.landmarks.southBank.note') /* Tourist Destination */ + ': ' + t('location.landmarks.southBank.name'), detail: t('location.landmarks.southBank.name'), sub: t('location.landmarks.southBank.text'), color:'#2DD4BF' },
    { icon:'🖼️', name: t('location.landmarks.southBank.name'),     detail: minWalk(10), sub: t('location.landmarks.southBank.note'), color:'#4FC3F7' },
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
        <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:16 }}>{t('location.transportHeader')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:10, marginBottom:0 }}>
          {transport.map((tr,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#fff', background:tr.bg, border:`1px solid ${tr.border}`, borderRadius:4, padding:'4px 6px', marginBottom:8, letterSpacing:'0.05em' }}>{t(`location.transport.${tr.k}.label`)}</div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--cream)', marginBottom:4 }}>{tr.station}</div>
              <div style={{ fontSize:12, color:'#6B7280' }}>{tr.mins}</div>
            </div>
          ))}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#fff', background:'#DC2626', border:'1px solid #DC2626', borderRadius:4, padding:'4px 6px', marginBottom:8, letterSpacing:'0.05em' }}>{t('location.transport.bus.label')}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--cream)', marginBottom:4 }}>{t('location.transport.bus.sub')}</div>
            <div style={{ fontSize:12, color:'#6B7280', marginBottom:8 }}>{minWalk(1)}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:3, justifyContent:'center' }}>
              {buses.map(b => <span key={b} style={{ fontSize:10, background:'#DC2626', color:'#fff', borderRadius:3, padding:'2px 5px', fontWeight:600 }}>{b}</span>)}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20 }}>
          <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:16 }}>{t('location.landmarksHeader')}</div>
          {landmarks.map((l,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize:20 }}>{l.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--cream)' }}>{t(`location.landmarks.${l.nameKey}.name`)}</div>
                <div style={{ fontSize:11, color:'#6B7280' }}>{t(`location.tags.${l.typeKey}`)}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:l.color }}>{l.dist}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, overflow:'hidden', minHeight:400 }}>
          <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2483.6!2d-0.0908!3d51.5055!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487604a93b49f6db%3A0x5c6cd91fc3ec62fd!2sBorough%20Market!5e0!3m2!1sen!2suk!4v1" width="100%" height="100%" style={{ border:0, minHeight:400 }} allowFullScreen loading="lazy" />
        </div>
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20 }}>
        <STitle>{t('location.hoursHeader')}</STitle>
        {[[t('location.days.monFri'), '11:00 – 23:30'], [t('location.days.saturday'), '11:00 – 23:30'], [t('location.days.sunday'), '11:00 – 23:30']].map(([l,v]) => <Row key={l} label={l} value={v} />)}
      </div>
    </div>
  )
}

function TabFloorPlan() {
  const { t } = useTranslation('venue')
  const [zoomed, setZoomed] = useState(false)
  const specs = [
    { labelKey:'upstairs',   badge:null, value:'400m²', color:'#4FC3F7' },
    { labelKey:'downstairs', badgeKey:'storesNote', value:'300m²', color:'#C9A84C' },
    { labelKey:'licenseLabel',  badge:null, value:'11pm', color:'#2DD4BF' },
    { labelKey:'capacityLabel', badge:null, value:'120', color:'#4FC3F7' },
    { labelKey:'toiletsLabel',  badge:null, value:'2',   color:'#C9A84C' },
    { labelKey:'exitsLabel',    badge:null, value:'3',   color:'#2DD4BF' },
    { labelKey:'planningLabel', badge:null, value:t('floorPlan.eClass'), color:'#C9A84C' },
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20, alignItems:'start' }}>
      {zoomed && (
        <div onClick={()=>setZoomed(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}>
          <div style={{ position:'relative', maxWidth:'92vw', maxHeight:'92vh' }}>
            <img src="/floorplan_1.png" alt={t('floorPlan.alt')} style={{ maxWidth:'92vw', maxHeight:'92vh', objectFit:'contain', borderRadius:8 }} />
            <div style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:12, padding:'4px 10px', borderRadius:4 }}>{t('floorPlan.close')}</div>
          </div>
        </div>
      )}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{t('floorPlan.title')}</div>
          <button onClick={()=>setZoomed(true)} style={{ fontSize:11, color:'var(--gold)', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:4, padding:'3px 10px', cursor:'pointer' }}>{t('floorPlan.expand')}</button>
        </div>
        <img onClick={()=>setZoomed(true)} src="/floorplan_1.png" alt={t('floorPlan.alt')} style={{ width:'100%', borderRadius:6, objectFit:'contain', maxHeight:560, display:'block', cursor:'zoom-in' }} />
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {specs.map(s => (
          <div key={s.labelKey} style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:8, padding:'14px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                <div style={{ fontSize:13, color:'var(--cream)', fontWeight:600, letterSpacing:'0.08em' }}>{t(`floorPlan.${s.labelKey}`)}</div>
                {s.badgeKey && <div style={{ fontSize:10, color:'#C9A84C', background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:4, padding:'3px 8px', lineHeight:1.4 }}>{t(`floorPlan.${s.badgeKey}`)}</div>}
              </div>
              <div style={{ fontSize:22, color:s.color, fontWeight:700, flexShrink:0 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabLicence() {
  const { t } = useTranslation('venue')
  // Annex 1 and Annex 2 legal-condition strings kept in English per spec
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
  const dayKeys = ['mon','tue','wed','thu','fri','sat','sun']
  const cs = {background:'var(--ink-2)',border:'1px solid rgba(201,168,76,0.12)',borderRadius:10,padding:20,marginBottom:12}
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div style={cs}>
          <STitle>{t('licence.part1')}</STitle>
          <Row label={t('licence.heading')} value={t('licence.subheading')} />
          <Row label={t('licence.fields.number')} value="888057" gold />
          <Row label={t('licence.fields.premises')} value="Arches B C D And E, Montague Close, London SE1 9DA" />
          <Row label={t('licence.fields.postCode')} value="SE1 9DA" />
          <Row label={t('licence.fields.mapRef')} value="532733180272" />
        </div>
        <div style={cs}>
          <STitle>{t('licence.part2')}</STitle>
          <Row label={t('licence.fields.holder')} value={t('licence.values.plonkGolf')} gold />
          <Row label={t('licence.fields.address')} value="15 Mentmore Terrace, Hackney, London E8 3PN" />
          <Row label={t('licence.fields.company')} value="10328982" />
          <Row label={t('licence.fields.issueDate')} value="19/01/2026" />
          <Row label={t('licence.fields.dps')} value="Klaudia Ciepluch" gold />
          <Row label={t('licence.fields.personalLicenceNo')} value="157679" />
          <Row label={t('licence.fields.authority')} value={t('licence.values.lbTowerHamlets')} />
        </div>
      </div>
      <div style={cs}>
        <STitle>{t('licence.hours.opening')}</STitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:12 }}>
          {dayKeys.map(d=>(
            <div key={d} style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--cream-dim)', marginBottom:4 }}>{t(`location.days.${d}`)}</div>
              <div style={{ fontSize:11, color:'var(--cream)', background:'var(--ink-3)', borderRadius:4, padding:'3px 2px' }}>07:00</div>
              <div style={{ fontSize:10, color:'var(--gold-dim)', margin:'2px 0' }}>–</div>
              <div style={{ fontSize:11, color:'var(--cream)', background:'var(--ink-3)', borderRadius:4, padding:'3px 2px' }}>23:30</div>
            </div>
          ))}
        </div>
        <STitle>{t('licence.hours.licensed')}</STitle>
        {[t('licence.hours.films'), t('licence.hours.indoorSport'), t('licence.hours.alcohol')].map(act=>(
          <div key={act} style={{ fontSize:12, color:'var(--cream-dim)', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{act}</div>
        ))}
      </div>
      <div style={cs}>
        <STitle>{t('licence.annex1')}</STitle>
        {a1.map(c=>(
          <div key={c.r} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize:12, color:'var(--gold)', minWidth:36, flexShrink:0, fontWeight:600 }}>{c.r}</div>
            <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>{c.t}</div>
          </div>
        ))}
      </div>
      <div style={cs}>
        <STitle>{t('licence.annex2')}</STitle>
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
  const { t } = useTranslation('venue')
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
  // TODO i18n: the longer bullet lists inside Development cards remain in English
  // for now; leaving them inline because they are detailed prose that wasn't
  // in the original dictionary.
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:40 }}>
      <div>
        <div style={{ fontSize:11, color:'#4FC3F7', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>{t('development.header')}</div>
        <h2 style={{ fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:900, color:'#fff', textTransform:'uppercase', marginBottom:12 }}>{t('development.basement.title')}</h2>
        <p style={{ fontSize:14, color:'#9CA3AF', lineHeight:1.6, marginBottom:24 }}>{t('development.basement.intro')}</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={card('#C9A84C')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#C9A84C', border:'1px solid #C9A84C', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('development.basement.shortTerm')}</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>{t('development.basement.shortSub')}</h3>
            {['200m² of basement space directly below the bar and arcade arch','Available for development now — no structural barriers','Proposed uses: karaoke rooms · listening bar · private hire games spaces','High-margin private hire and events revenue potential','Extends the venue offer without expanding the footprint above ground'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:14, color:'#D1D5DB' }}><Arr c="#C9A84C" /><span>{item}</span></div>)}
          </div>
          <div style={card('#4FC3F7')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#4FC3F7', border:'1px solid #4FC3F7', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('development.basement.longTerm')}</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>{t('development.basement.longSub')}</h3>
            {['300m² of developable basement beneath the full Borough venue','Rights to sublet and carry out works are held within the lease','Structural costs covered by the landlord and building insurance policy','Fit-out to be carried out by No Dice Borough Ltd','A further 100m² tunnel opens under the final golf arch once TfL installs a new staircase — at that point the entire basement connects for public use','Full basement development unlocks a significant additional revenue floor'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:14, color:'#D1D5DB' }}><Arr c="#4FC3F7" /><span>{item}</span></div>)}
          </div>
        </div>
        <div style={{ background:'rgba(45,212,191,0.06)', border:'1px solid rgba(45,212,191,0.2)', borderRadius:8, padding:'16px 20px' }}>
          <p style={{ fontSize:13, color:'#9CA3AF', fontStyle:'italic', marginBottom:12 }}>{t('development.basement.body')}</p>
          <Tag label={t('development.basement.tags.rights')} color="#4FC3F7" />
          <Tag label={t('development.basement.tags.costs')} color="#2DD4BF" />
          <Tag label={t('development.basement.tags.total')} color="#C9A84C" />
        </div>
      </div>
      <div>
        <div style={{ fontSize:11, color:'#F87171', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>{t('development.yard.eyebrow')}</div>
        <h2 style={{ fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:900, color:'#fff', textTransform:'uppercase', marginBottom:12 }}>{t('development.yard.title')}</h2>
        <p style={{ fontSize:14, color:'#9CA3AF', lineHeight:1.6, marginBottom:24 }}>{t('development.yard.intro')}</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={card('#F87171')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#F87171', border:'1px solid #F87171', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('development.yard.currentStatus')}</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>{t('development.yard.currentSub')}</h3>
            {['The yard at the front of the venue is private land owned by Southwark Cathedral','Boro Bistro currently hold usage rights to this space','They have misused the space and are on their final warning with the landlord','One further breach gives No Dice Borough the right to reclaim the yard'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:14, color:'#D1D5DB' }}><Arr c="#F87171" /><span>{item}</span></div>)}
            <div style={{ marginTop:16, fontSize:13, color:'#F59E0B', fontStyle:'italic' }}>{t('development.yard.currentBody')}</div>
          </div>
          <div style={card('#2DD4BF')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#2DD4BF', border:'1px solid #2DD4BF', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('development.yard.ifReclaimed')}</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>{t('development.yard.ifReclaimedSub')}</h3>
            {['Very large additional outdoor capacity for bar service and social use','Significantly increases peak revenue potential, particularly for events and summer trading','No takeaway licence required — all private land, no public highway involvement','Bar sales extend naturally into the yard without additional licensing complexity','Transforms the kerb presence on one of London’s most visited streets'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:10, fontSize:14, color:'#D1D5DB' }}><Arr c="#2DD4BF" /><span>{item}</span></div>)}
            <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:6 }}>
              {['Private land — no licensing barrier to operation','No additional licence required to trade in the yard','High revenue impact — significant uplift in capacity and bar sales'].map((item,i) => <div key={i} style={{ fontSize:13, color:'#2DD4BF', fontStyle:'italic' }}>→ {item}</div>)}
            </div>
          </div>
        </div>
        <div style={{ background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'16px 20px' }}>
          <p style={{ fontSize:13, color:'#9CA3AF', fontStyle:'italic', marginBottom:12 }}>{t('development.yard.body')}</p>
          <Tag label={t('development.yard.tags.private')} color="#2DD4BF" />
          <Tag label={t('development.yard.tags.landlord')} color="#9CA3AF" />
          <Tag label={t('development.yard.tags.conditional')} color="#C9A84C" />
        </div>
      </div>
      <div>
        <div style={{ fontSize:11, color:'#9CA3AF', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>{t('development.licenceCite')}</div>
        <h2 style={{ fontSize:'clamp(1.5rem,3vw,2.2rem)', fontWeight:900, color:'#fff', textTransform:'uppercase', marginBottom:12 }}>{t('development.licenceHeader')}</h2>
        <p style={{ fontSize:14, color:'#9CA3AF', lineHeight:1.6, marginBottom:20 }}>{t('development.licenceIntro')}</p>
        <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, padding:'14px 18px', marginBottom:24, fontSize:13, color:'#D1D5DB', lineHeight:1.6 }}>
          <span style={{ color:'#F59E0B' }}>⚠️ </span>Note: The licence is currently held by Plonk Golf Ltd (Co. 10328982). A transfer to No Dice Borough Ltd must be completed before or alongside any variation application. The DPS appointment will also need to be reviewed at that stage.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={card('#4FC3F7')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#4FC3F7', border:'1px solid #4FC3F7', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('development.licenceVariations.hoursTarget')}</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>{t('development.licenceVariations.hoursTitle')}</h3>
            <p style={{ fontSize:13, color:'#F87171', marginBottom:16 }}>{t('development.licenceVariations.hoursCurrent')}</p>
            {['Conditions 341, 342 and 343 restrict all activity to 11pm–11:30pm','DJ and late-night events format requires a 1am licence as a minimum','Activity-led venue (not a bar) strengthens the case significantly','Propose a 12-month trial period to reduce the perceived risk','Zero complaint history in SE1 is the strongest single asset'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:'#D1D5DB' }}><Arr c="#4FC3F7" /><span>{item}</span></div>)}
            <div style={{ marginTop:20 }}><Bar label={t('development.licenceVariations.to1am')} pct="35–45%" val={0.4} color="#4FC3F7" /><Bar label={t('development.licenceVariations.to2am')} pct="20–30%" val={0.25} color="#6B7280" /></div>
          </div>
          <div style={card('#2DD4BF')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#2DD4BF', border:'1px solid #2DD4BF', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('development.licenceVariations.hoursLikelihood')}</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>{t('development.licenceVariations.alcoholTitle')}</h3>
            <p style={{ fontSize:13, color:'#F87171', marginBottom:16 }}>{t('development.licenceVariations.alcoholCurrent')}</p>
            {['Condition 340 currently limits alcohol to golf, arcade and board game participants only','Board game players can already drink freely — extending this logic to all activity participants is proportionate and defensible','Proposed wording: any customer using the venue activity or games facilities may purchase alcohol','Removes a compliance burden without changing the activity-led character','Strongest application — apply for this one first'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:'#D1D5DB' }}><Arr c="#2DD4BF" /><span>{item}</span></div>)}
            <div style={{ marginTop:20 }}><Bar label={t('development.licenceVariations.likelihood')} pct="65–75%" val={0.7} color="#2DD4BF" /></div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div style={card('#C9A84C')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#C9A84C', border:'1px solid #C9A84C', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('development.licenceVariations.sportsTarget')}</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:8 }}>{t('development.licenceVariations.sportsTitle')}</h3>
            <p style={{ fontSize:13, color:'#F87171', marginBottom:16 }}>{t('development.licenceVariations.sportsCurrent')}</p>
            {['Condition 353 blanket-prohibits all live sports screenings','Licence already includes Indoor Sporting Event as a licensed activity — a useful inconsistency to argue at variation','Not seeking to become a sports bar — international tournaments only (World Cup, Euros, Olympics)','Propose advance notification protocol: inform authority before each screening and maintain a log','Avoids the weekly Premier League concerns that drove the original condition'].map((item,i) => <div key={i} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:'#D1D5DB' }}><Arr c="#C9A84C" /><span>{item}</span></div>)}
            <div style={{ marginTop:20 }}><Bar label={t('development.licenceVariations.internationalOnly')} pct="40–55%" val={0.48} color="#C9A84C" /><Bar label={t('development.licenceVariations.fullRemoval')} pct="25–35%" val={0.3} color="#6B7280" /></div>
          </div>
          <div style={card('#9CA3AF')}>
            <div style={{ display:'inline-block', fontSize:11, color:'#9CA3AF', border:'1px solid #9CA3AF', borderRadius:4, padding:'3px 10px', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>{t('development.licenceVariations.recommendedHeader')}</div>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>{t('development.licenceVariations.recommendedSub')}</h3>
            {['Apply for the golf-drink link change first — easiest win, builds credibility with the authority','Obtain a formal zero-incident letter from Met Police Southwark and Southwark Council licensing team','Engage a Southwark specialist licensing solicitor before any application is submitted','Pre-consult with the licensing authority and police informally before formal submission','Engage Southwark Cathedral directly — their support on hours would carry exceptional weight as landlord','For hours: propose a 12-month time-limited trial to reduce perceived risk for the authority'].map((item,i) => (
              <div key={i} style={{ display:'flex', gap:12, marginBottom:12, fontSize:13, color:'#D1D5DB' }}>
                <span style={{ color:'#4FC3F7', fontWeight:700, minWidth:16, flexShrink:0 }}>{i+1}</span><span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderLeft:'4px solid #6366F1', borderRadius:8, padding:'16px 20px', marginBottom:16 }}>
          <p style={{ fontSize:13, color:'#9CA3AF', fontStyle:'italic', marginBottom:12 }}>{t('development.licenceVariations.recommendedBody')}</p>
          <Tag label={t('development.licenceVariations.bars.alcoholLink')} color="#2DD4BF" />
          <Tag label={t('development.licenceVariations.bars.hours1am')} color="#4FC3F7" />
          <Tag label={t('development.licenceVariations.bars.sports')} color="#C9A84C" />
          <Tag label={t('development.licenceVariations.bars.hours2am')} color="#9CA3AF" />
        </div>
        <p style={{ fontSize:12, color:'#6B7280', fontStyle:'italic', textAlign:'center' }}>{t('development.licenceVariations.disclaimer')}</p>
      </div>
    </div>
  )
}

export default function VenueInfo() {
  const { t } = useTranslation('venue')
  const { t: tc } = useTranslation('common')
  const [tab, setTab] = useState('catchment')

  const galleryCaption = (section) => (key) => t(`gallery.${section}.${key}`)

  const galleries = [
    { key:'venue',  label: t('galleryHub.venue'),  images: VENUE_IMGS,  translateCaption: galleryCaption('venue') },
    { key:'course', label: t('galleryHub.course'), images: COURSE_IMGS, translateCaption: galleryCaption('course') },
    { key:'drinks', label: t('galleryHub.drinks'), images: DRINKS_IMGS, translateCaption: galleryCaption('drinks') },
  ]

  const tabComponents = {
    catchment: <TabCatchment />,
    location: <TabLocation />,
    floorPlan: <TabFloorPlan />,
    gallery: <GalleryHub galleries={galleries} headerLabel={t('galleryHub.header')} />,
    licence: <TabLicence />,
    development: <TabDevelopment />,
  }
  return (
    <div style={{ minHeight:'100%', background:'var(--ink)', color:'var(--cream)' }}>
      <div style={{ padding:'20px 32px 0', borderBottom:'1px solid rgba(201,168,76,0.12)' }}>
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TAB_KEYS.map(k => (
            <button key={k} onClick={()=>setTab(k)} style={{ padding:'8px 16px', fontSize:11, cursor:'pointer', border:'none', background:'transparent', letterSpacing:'0.08em', textTransform:'uppercase', borderBottom:`2px solid ${tab===k?'var(--gold)':'transparent'}`, color:tab===k?'var(--gold)':'var(--cream-dim)', transition:'all 0.15s', whiteSpace:'nowrap' }}>{t(`tabs.${k}`)}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:'24px 32px 24px' }}>{tabComponents[tab]}</div>
      <div style={{ padding:'20px 32px 32px', borderTop:'1px solid rgba(201,168,76,0.12)', marginTop:12 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>{tc('shell.brand')}</div>
        <div style={{ fontSize:14, color:'var(--cream-dim)' }}>{t('header.eyebrow')}</div>
      </div>
    </div>
  )
}
