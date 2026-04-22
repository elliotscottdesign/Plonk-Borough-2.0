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
          { label: 'Customers', value: '1,000,000+', sub: 'Across every site since 2013' },
          { label: 'Pop-Up Sites', value: 'Over 50', sub: 'UK & Europe' },
          { label: 'Specialists', value: 'Design + Hospitality', sub: 'Set-design roots · hospitality-run' },
          { label: 'Opportunity', value: 'Unique Franchise', sub: 'IP + hardware + maintenance' },
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

      <div style={{ fontSize: 11, color: 'var(--gold-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', paddingTop: 8 }}>
        Continue to How It Works, IP &amp; Licensing or Marketing Engine →
      </div>
    </div>
  )
}
