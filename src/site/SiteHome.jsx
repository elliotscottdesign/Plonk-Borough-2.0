import React from 'react'

// SiteHome — the full No Dice bar website, served at /site/inside.
//
// Reference inspiration: allmyfriends.uk. The pattern is:
//   • sticky horizontal nav at the top (jump links, NOT separate routes)
//   • one long mobile-first scroll
//   • each section is a self-contained block with a heading + a CTA
//
// Sections (in order):
//   1. Hero — wordmark + one-liner + "Book a table" CTA
//   2. This Month — six cards: DJs, Deals, Games, Tournaments, Food, Bar
//   3. Book It — five booking CTAs: Events, Pool slots, Food pop-ups,
//      World Cup matches, Tournaments. Each is a placeholder for the
//      eventual real booking system (Stripe Checkout / Resy / Design
//      My Night / Tock / etc.) — currently mailto: links so the founder
//      can answer enquiries while wiring up the real flow.
//   4. Visit — address, hours, map link
//   5. Footer — socials, legal, "back to splash"
//
// All copy is placeholder. Edit freely.

const BRAND_RED = '#DA1B33'
const INK       = '#000000'

// Centralised so the founder can change a single line and update every
// "email us" button on the page.
const BOOKINGS_EMAIL = 'bookings@nodice.bar'

export default function SiteHome() {
  React.useEffect(() => {
    const prevBg    = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = INK
    document.body.style.color      = '#FFFFFF'
    document.title = 'No Dice — London Fields · Bar, Pool, Events'
    return () => {
      document.body.style.background = prevBg
      document.body.style.color      = prevColor
    }
  }, [])

  const goSplash = () => {
    history.pushState({}, '', '/site')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: INK,
      color: '#FFFFFF',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <StickyNav onLogoClick={goSplash} />

      <Hero />

      <ThisMonth />

      <BookIt />

      <Visit />

      <Footer onSplashClick={goSplash} />
    </div>
  )
}

// ─── Sticky top nav ─────────────────────────────────────────────────────
// Jumps to anchors below. Wordmark on the left also doubles as a "back
// to splash" link. Horizontally scrollable on tiny screens so we don't
// hide nav items behind a burger.

function StickyNav({ onLogoClick }) {
  const items = [
    { label: 'This Month',  href: '#this-month' },
    { label: 'Book',        href: '#book' },
    { label: 'Visit',       href: '#visit' },
  ]
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      gap: 12,
    }}>
      <img
        src="/nodice-wordmark.png"
        alt="No Dice"
        onClick={onLogoClick}
        style={{ height: 28, width: 'auto', cursor: 'pointer', display: 'block' }}
      />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {items.map(it => (
          <a key={it.href} href={it.href} style={{
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.75)',
            textDecoration: 'none',
            padding: '8px 10px',
            whiteSpace: 'nowrap',
            fontWeight: 600,
          }}>{it.label}</a>
        ))}
      </div>
    </div>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────────
// Big wordmark, single line of intent, one primary CTA. No clutter.

function Hero() {
  return (
    <section style={{
      padding: '64px 20px 56px',
      textAlign: 'center',
      maxWidth: 720,
      margin: '0 auto',
    }}>
      <img
        src="/nodice-wordmark.png"
        alt="No Dice"
        style={{ width: 'min(380px, 78vw)', height: 'auto', margin: '0 auto 24px', display: 'block' }}
      />
      <div style={{
        fontSize: 13,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.75)',
        marginBottom: 18,
      }}>
        Bar · Pool · Pop-ups · Live sport · E8
      </div>
      <p style={{
        fontSize: 15,
        lineHeight: 1.55,
        color: 'rgba(255,255,255,0.78)',
        margin: '0 auto 28px',
        maxWidth: 460,
      }}>
        A neighbourhood bar in the railway arches off London Fields. Pool tables,
        rotating food, residents on the decks, and every big match on the screens.
      </p>
      <a href="#book" style={primaryCtaStyle()}>Book a table</a>
    </section>
  )
}

// ─── This Month ─────────────────────────────────────────────────────────
// Six cards summarising what's on right now. Each card is placeholder copy
// — when the founder fires up Instagram-fed content or a Sheet-driven feed
// later, swap the inline arrays for a fetched list with the same shape:
// { title, dek, footnote }.

function ThisMonth() {
  const cards = [
    {
      key: 'djs',
      title: 'DJs',
      dek: 'Friday + Saturday residents through June. Disco, house, funk — late, free.',
      footnote: 'Every Fri / Sat · 8pm till late',
    },
    {
      key: 'deals',
      title: 'Deals',
      dek: '2-4-1 cocktails 5–7pm Mon–Thu. Pint + pool for £8 all day Sunday.',
      footnote: 'Mon–Thu happy hour · Sunday pool',
    },
    {
      key: 'games',
      title: 'Games',
      dek: 'Six pool tables, free darts, retro arcade in the back. Book a table or walk in.',
      footnote: 'Walk-ins welcome · book ahead for groups',
    },
    {
      key: 'tournaments',
      title: 'Tournaments',
      dek: 'Weekly £50-prize pool league every Tuesday. Open to anyone — bring a partner or get drawn in.',
      footnote: 'Tuesdays · entry £5 per pair',
    },
    {
      key: 'food',
      title: 'Food',
      dek: 'Rotating residencies — different kitchen every fortnight. June: Smash patties from Paddy & Sons.',
      footnote: 'Kitchen 12pm–10pm',
    },
    {
      key: 'bar',
      title: 'Bar',
      dek: 'Cask + craft on rotation, classic cocktails, low-intervention wine. Always something new on the chalk board.',
      footnote: 'Open till 2am Fri/Sat',
    },
  ]
  return (
    <section id="this-month" style={sectionWrap()}>
      <SectionHeading kicker="June 2026" title="This month" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 12,
        marginTop: 8,
      }}>
        {cards.map(c => (
          <div key={c.key} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '20px 18px',
          }}>
            <div style={{
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: BRAND_RED,
              fontWeight: 700,
              marginBottom: 10,
            }}>{c.title}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)', marginBottom: 10 }}>
              {c.dek}
            </div>
            <div style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}>
              {c.footnote}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Book It ────────────────────────────────────────────────────────────
// Five booking lanes. Each currently links to a mailto: so enquiries
// reach the founder's inbox immediately. As the real systems land
// (Stripe Checkout for tournament entries, Resy/Tock for tables,
// Design My Night for events, etc.), replace each href with the real
// booking URL — the card layout doesn't need to change.

function BookIt() {
  const lanes = [
    {
      key: 'events',
      title: 'Events & private hire',
      dek: 'Birthdays, leaving dos, brand activations. We do whole-venue and arch-end hires.',
      cta: 'Enquire',
      href: `mailto:${BOOKINGS_EMAIL}?subject=Event enquiry`,
    },
    {
      key: 'pool',
      title: 'Pool tables',
      dek: 'Book a table for an hour or for the evening. Groups of 6+ — book ahead.',
      cta: 'Book a table',
      href: `mailto:${BOOKINGS_EMAIL}?subject=Pool table booking`,
    },
    {
      key: 'food',
      title: 'Food pop-ups',
      dek: 'Want to run a fortnight in our kitchen? Pitch us — we host one new resident every two weeks.',
      cta: 'Pitch your pop-up',
      href: `mailto:${BOOKINGS_EMAIL}?subject=Food pop-up pitch`,
    },
    {
      key: 'worldcup',
      title: 'World Cup matches',
      dek: 'Reserve a table for any group-stage or knockout match. Big screens, full sound, every game.',
      cta: 'Reserve a match',
      href: '/world-cup',
    },
    {
      key: 'tournaments',
      title: 'Tournaments',
      dek: 'Weekly pool league, monthly darts night, one-off poker. Sign up for the next one.',
      cta: 'Enter the next tournament',
      href: `mailto:${BOOKINGS_EMAIL}?subject=Tournament entry`,
    },
  ]
  return (
    <section id="book" style={sectionWrap()}>
      <SectionHeading kicker="Bookings" title="Book it" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        {lanes.map(l => (
          <a
            key={l.key}
            href={l.href}
            style={{
              display: 'block',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '18px 20px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background    = 'rgba(218,27,51,0.08)'
              e.currentTarget.style.borderColor   = 'rgba(218,27,51,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background    = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.01em' }}>{l.title}</div>
              <div style={{
                fontSize: 10,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: BRAND_RED,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}>{l.cta} →</div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)' }}>
              {l.dek}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

// ─── Visit ──────────────────────────────────────────────────────────────

function Visit() {
  return (
    <section id="visit" style={sectionWrap()}>
      <SectionHeading kicker="Find us" title="Visit" />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 18,
        marginTop: 8,
      }}>
        {/* Address + map link */}
        <div style={infoBlockStyle()}>
          <div style={infoLabelStyle()}>Address</div>
          <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 12 }}>
            Arch 407 Mentmore Terrace<br />
            London Fields, Hackney<br />
            E8 3PH
          </div>
          <a
            href="https://www.google.com/maps?q=Arch+407+Mentmore+Terrace+London+E8+3PH"
            target="_blank" rel="noopener noreferrer"
            style={textLinkStyle()}
          >
            Open in maps →
          </a>
        </div>

        {/* Hours */}
        <div style={infoBlockStyle()}>
          <div style={infoLabelStyle()}>Hours</div>
          <div style={{ fontSize: 14, lineHeight: 1.7 }}>
            <Row k="Mon"     v="Closed" />
            <Row k="Tue–Thu" v="4pm – 12am" />
            <Row k="Fri"     v="4pm – 2am" />
            <Row k="Sat"     v="12pm – 2am" />
            <Row k="Sun"     v="12pm – 11pm" />
          </div>
        </div>

        {/* Contact */}
        <div style={infoBlockStyle()}>
          <div style={infoLabelStyle()}>Contact</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
            <a href={`mailto:${BOOKINGS_EMAIL}`} style={textLinkStyle()}>{BOOKINGS_EMAIL}</a>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7 }}>
            <a href="https://www.instagram.com/nodicelondon/" target="_blank" rel="noopener noreferrer" style={textLinkStyle()}>
              @nodicelondon
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Row({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}>{k}</span>
      <span style={{ color: 'rgba(255,255,255,0.9)' }}>{v}</span>
    </div>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────

function Footer({ onSplashClick }) {
  return (
    <footer style={{
      padding: '40px 20px 56px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      marginTop: 40,
      textAlign: 'center',
      color: 'rgba(255,255,255,0.45)',
      fontSize: 11,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={onSplashClick} style={footerLinkStyle()}>Splash</button>
        <a href="/privacy" style={footerLinkStyle()}>Privacy</a>
        <a href="/terms"   style={footerLinkStyle()}>Terms</a>
      </div>
      <div>© No Dice Bars Ltd · London Fields</div>
    </footer>
  )
}

// ─── Shared style helpers ───────────────────────────────────────────────

function sectionWrap() {
  return {
    padding: '40px 20px',
    maxWidth: 980,
    margin: '0 auto',
    boxSizing: 'border-box',
  }
}

function SectionHeading({ kicker, title }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: BRAND_RED,
        fontWeight: 700,
        marginBottom: 6,
      }}>{kicker}</div>
      <h2 style={{
        fontFamily: "'Bebas Neue', 'Impact', sans-serif",
        fontSize: 'clamp(2rem, 7vw, 3.4rem)',
        margin: 0,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontWeight: 400,
        lineHeight: 1,
      }}>{title}</h2>
    </div>
  )
}

function primaryCtaStyle() {
  return {
    display: 'inline-block',
    padding: '14px 36px',
    fontSize: 12,
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    fontWeight: 700,
    color: '#FFFFFF',
    background: BRAND_RED,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    textDecoration: 'none',
  }
}

function infoBlockStyle() {
  return {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '20px 20px',
  }
}

function infoLabelStyle() {
  return {
    fontSize: 10,
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: BRAND_RED,
    fontWeight: 700,
    marginBottom: 10,
  }
}

function textLinkStyle() {
  return {
    color: '#FFFFFF',
    textDecoration: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.35)',
    paddingBottom: 1,
  }
}

function footerLinkStyle() {
  return {
    color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 11,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
  }
}
