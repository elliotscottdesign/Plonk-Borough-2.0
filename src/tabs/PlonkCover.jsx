import React from 'react'

const TIMELINE = [
  {
    year: '2013',
    title: 'Founded',
    body: 'Plonk Crazy Golf is founded by a troop of set designers from the film industry who band together to build the greatest Crazy Golf courses imaginable — and plonk them down around the capital.',
    accent: '#C9A84C',
  },
  {
    year: '2014',
    title: 'First Course · Haggerston',
    body: 'Our first permanent course opens in Haggerston, London — built from 100% up-cycled materials rescued from the streets of Hackney.',
    accent: '#4FC3F7',
  },
  {
    year: "2014 – '19",
    title: '50+ Pop-Up Sites',
    body: 'Increasingly ambitious courses appear across the UK and Europe. Beer gardens, forgotten basements, old warehouses, nightclubs, markets, museums, festivals and shopping centres.',
    accent: '#2DD4BF',
  },
  {
    year: '2019 – 2026',
    title: 'Owned Venues Era',
    body: 'Plonk begins operating its own venues — each housing a unique Crazy Golf course alongside arcade machines, pool tables, pinball, board games and a fully stocked bar with draught beer, cocktails and canned craft.',
    accent: '#E67E22',
  },
  {
    year: '2026 →',
    title: 'Back to the Roots',
    body: 'Plonk reverts to its original model — Plonk @ other companies\' venues. Plonk Golf provides the IP, course design, hardware and digital funnel. Venues run the day-to-day and pay a franchise commission plus a hardware purchase fee.',
    accent: '#C9A84C',
  },
]

const OFFERS = [
  {
    label: 'Franchise Commission',
    body: 'A % on golf ticket sales routed through the Plonk online booking system — and, optionally, on office-handled bookings if Plonk Golf provides a bookings manager. Pool tables, private events and group bookings 12+ remain venue-managed.',
    accent: '#4FC3F7',
    pill: 'Recurring',
  },
  {
    label: 'Hardware Purchase Fee',
    body: 'One-off fee for the Plonk course and equipment — built bespoke for the venue, delivered and installed. Hardware is bought outright by the venue.',
    accent: '#C9A84C',
    pill: 'One-off',
  },
  {
    label: 'Maintenance Plan (optional)',
    body: '£400 / month for London-based venues — includes one on-site day per month. Plan holders also unlock discounts on all new hardware and equipment orders.',
    accent: '#2DD4BF',
    pill: '£400 / mo',
  },
]

const WARRANTY_TERMS = [
  { label: 'Warranty', value: 'Valid only while a Maintenance Plan is active. No maintenance plan = no warranty cover.', tone: 'warn' },
  { label: 'Maintenance visit', value: '1 on-site day per month · London venues · £400 / month', tone: 'ok' },
  { label: 'Hardware discounts', value: 'Plan holders get discounted rates on all new hardware and equipment.', tone: 'ok' },
  { label: 'Vandalism', value: 'Not covered under warranty or maintenance plan — venue\'s responsibility.', tone: 'warn' },
]

export default function PlonkCover() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Hero */}
      <div style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>
          Plonk Golf · Overview
        </div>
        <h1 className="serif" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', lineHeight: 1, color: 'var(--cream)', marginBottom: 18 }}>
          Plonk Crazy Golf
        </h1>
        <p style={{ fontSize: 16, color: 'var(--cream-dim)', lineHeight: 1.6, maxWidth: 720 }}>
          The ultimate destination for competitive socialising in the capital — and now, the IP and operating system behind the courses our partners run in their own venues.
        </p>
        <div style={{ height: 1, background: 'linear-gradient(90deg, var(--gold), transparent)', marginTop: 22 }} />
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Founded', value: '2013', sub: 'By film-industry set designers' },
          { label: 'First Permanent Course', value: '2014', sub: 'Haggerston · 100% up-cycled' },
          { label: 'Pop-Up Sites', value: '50+', sub: 'UK & Europe' },
          { label: 'Model from 2026', value: 'Franchise', sub: 'IP + hardware + maintenance' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div className="serif" style={{ fontSize: 26, color: 'var(--cream)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 6, lineHeight: 1.4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
          Our Story
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TIMELINE.map((t, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 20, background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${t.accent}`, borderRadius: 8, padding: '16px 20px' }}>
              <div>
                <div className="serif" style={{ fontSize: 22, color: t.accent, lineHeight: 1 }}>{t.year}</div>
                <div style={{ fontSize: 12, color: 'var(--cream-dim)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.title}</div>
              </div>
              <div style={{ fontSize: 14, color: 'var(--cream)', lineHeight: 1.6 }}>{t.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Commercial offer */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
          The New Model · 2026 &amp; On
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginBottom: 16, maxWidth: 720, lineHeight: 1.6 }}>
          Plonk Golf licenses the IP, sells the hardware, and runs the digital funnel. Venues run the day-to-day. Three commercial levers:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {OFFERS.map(o => (
            <div key={o.label} style={{ background: 'var(--ink-2)', border: `1px solid ${o.accent}40`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, color: o.accent, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{o.label}</div>
                <div style={{ fontSize: 10, color: o.accent, border: `1px solid ${o.accent}60`, borderRadius: 20, padding: '2px 10px', letterSpacing: '0.05em' }}>{o.pill}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6 }}>{o.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Warranty / maintenance fine print */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
          Maintenance &amp; Warranty Terms
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {WARRANTY_TERMS.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: t.tone === 'warn' ? 'rgba(239,68,68,0.06)' : 'rgba(45,212,191,0.06)', border: `1px solid ${t.tone === 'warn' ? 'rgba(239,68,68,0.25)' : 'rgba(45,212,191,0.25)'}`, borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: t.tone === 'warn' ? '#EF4444' : '#2DD4BF', flexShrink: 0, width: 22, textAlign: 'center' }}>{t.tone === 'warn' ? '!' : '✓'}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cream)', marginBottom: 3 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{t.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--gold-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', paddingTop: 8 }}>
        Continue to IP &amp; Licensing or Marketing Engine →
      </div>
    </div>
  )
}
