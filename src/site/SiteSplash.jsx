import React from 'react'

// SiteSplash — the new No Dice bar website's intro screen.
//
// Lives at /site. Design brief, in plain English:
//   • Black background, full-bleed
//   • "No Dice" wordmark at the top (same PNG as the public landing)
//   • A portrait video sits centre-stage (placeholder for now — using the
//     Rolling Bones poster as an <img>; swap to <video> when the real clip
//     lands at /site-hero.mp4)
//   • ENTER button below the video → /site/inside (the full site)
//
// Pattern lifted from schmucknyc.com (header + video + cta). The whole
// thing is mobile-first because that's where 90% of bar customers will
// open the link from Instagram.
//
// The existing public landing (Landing.jsx at /) STAYS. This route is
// hidden during dev — only reachable by typing /site directly. When
// we're ready to flip, swap the route in App.jsx so / serves SiteSplash
// and the waitlist landing moves elsewhere (or is retired).

const BRAND_RED = '#DA1B33'   // matches the wordmark + landing page
const INK       = '#000000'

export default function SiteSplash() {
  // Paint the whole viewport black (covers the area outside our box too).
  React.useEffect(() => {
    const prevBg    = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = INK
    document.body.style.color      = '#FFFFFF'
    document.title = 'No Dice — London Fields'
    return () => {
      document.body.style.background = prevBg
      document.body.style.color      = prevColor
    }
  }, [])

  const goInside = () => {
    history.pushState({}, '', '/site/inside')
    // Force a re-render of App.jsx by dispatching popstate; the path
    // dispatcher reads location.pathname on render.
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: INK,
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px 20px 48px',
      fontFamily: "'DM Sans', sans-serif",
      boxSizing: 'border-box',
    }}>

      {/* Wordmark — sits at the top, same as the public landing page. */}
      <img
        src="/nodice-wordmark.png"
        alt="No Dice"
        style={{
          width: 'min(360px, 70vw)',
          height: 'auto',
          display: 'block',
          marginBottom: 28,
        }}
      />

      {/* Portrait video slot. Today: Rolling Bones poster as a placeholder
          <img>. Tomorrow: swap the <img> for a muted/autoplay/looping
          <video src="/site-hero.mp4" /> with the same wrapper. The 9:16
          aspect frame is fixed via aspectRatio so the layout doesn't jump
          when the asset is replaced. */}
      <div style={{
        width: 'min(420px, 88vw)',
        aspectRatio: '9 / 16',
        background: '#0A0A0A',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
      }}>
        <img
          src="/site-hero-placeholder.jpg"
          alt="No Dice — Rolling Bones"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* ENTER button — single CTA, lifts you into /site/inside. */}
      <button
        onClick={goInside}
        style={{
          padding: '16px 56px',
          fontSize: 14,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: '#FFFFFF',
          background: BRAND_RED,
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'transform 0.15s, background 0.15s',
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
        onMouseUp={(e)   => { e.currentTarget.style.transform = 'scale(1)' }}
        onMouseLeave={(e)=> { e.currentTarget.style.transform = 'scale(1)' }}
      >
        Enter
      </button>

      {/* Quiet footer line — keeps the splash from feeling empty under the
          button on tall screens. Optional, can be removed when the real
          site copy lands. */}
      <div style={{
        marginTop: 'auto',
        paddingTop: 32,
        fontSize: 10,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
        textAlign: 'center',
      }}>
        407 Mentmore Terrace · London Fields · E8
      </div>
    </div>
  )
}
