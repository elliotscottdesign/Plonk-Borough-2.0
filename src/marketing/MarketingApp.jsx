import React, { useState } from 'react'
import { MARKETING_SECTIONS, WINDSOR_SOURCES, WINDSOR_CONNECTED } from './data/windsor.js'
import { useWindsorFeed } from './useWindsorFeed.js'
import MarketingSection from './sections/MarketingSection.jsx'
import Newsletter from './sections/Newsletter.jsx'
import Members from './sections/Members.jsx'

// Sub-nav = the Windsor/GA4 dashboards + the in-house tools (Newsletter, Members).
const NAV = [
  ...MARKETING_SECTIONS.map(s => ({ key: s.key, label: s.label, icon: s.icon, kind: 'dash' })),
  { key: 'newsletter', label: 'Newsletter', icon: '✉️', kind: 'tool' },
  { key: 'members', label: 'Members & Loyalty', icon: '🪪', kind: 'tool' },
]

// ─── No Dice Marketing hub (/marketing) ──────────────────────────────────
// Own gated area, separate from /ops. GA4 / Google Ads / Search Console / Meta
// data flows in via Windsor.ai once connected (see data/windsor.js). Until then
// the section renders as a ready-to-fill scaffold with the connect steps.

function ConnectBanner({ feed }) {
  if (feed.connected && !feed.error) return null
  return (
    <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FCD34D', marginBottom: 8 }}>
        {feed.error ? 'Windsor.ai feed error' : 'Windsor.ai not connected yet'}
      </div>
      <div style={{ fontSize: 13, color: '#FDE68A', lineHeight: 1.6 }}>
        {feed.error
          ? `Couldn't read the feed: ${feed.error}. Check the URL in data/windsor.js.`
          : <>The dashboards below are built and waiting. To switch them on: (1) in Windsor.ai connect <strong>GA4</strong> (then Google Ads, Search Console, Meta as the campaigns go live), (2) set the destination to a feed the site can read — a Windsor data-feed URL, a published Google Sheet, or an Apps Script <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>/exec</code> endpoint, (3) send me that URL and I'll drop it in. Data then fills these cards automatically.</>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {WINDSOR_SOURCES.map(s => (
          <span key={s.name} title={s.note} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
            ◌ {s.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function MarketingApp() {
  const [active, setActive] = useState('overview')
  const feed = useWindsorFeed()
  const section = MARKETING_SECTIONS.find(s => s.key === active)

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#FFFFFF', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.10)', flexShrink: 0, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div className="serif" style={{ fontSize: 17, color: '#DA1B33' }}>No Dice · Marketing</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Hackney · GA4 via Windsor.ai</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, color: WINDSOR_CONNECTED ? '#34D399' : 'rgba(255,255,255,0.6)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: WINDSOR_CONNECTED ? '#34D399' : '#6B7280', display: 'inline-block' }} />
            {WINDSOR_CONNECTED ? (feed.loading ? 'Syncing…' : 'Connected') : 'Not connected'}
          </span>
          <a href="/ops" style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textDecoration: 'none' }}>Ops →</a>
          <a href="/" style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textDecoration: 'none' }}>← nodice.bar</a>
        </div>
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 4, padding: '10px 24px 0', background: '#0A0A0A', borderBottom: '1px solid rgba(218,27,51,0.12)', overflowX: 'auto', flexShrink: 0 }}>
        {NAV.map(s => (
          <button key={s.key} onClick={() => setActive(s.key)} style={{
            padding: '8px 16px', fontSize: 12, border: 'none', borderBottom: `2px solid ${active === s.key ? '#DA1B33' : 'transparent'}`,
            background: 'transparent', color: active === s.key ? '#DA1B33' : 'rgba(255,255,255,0.6)', cursor: 'pointer',
            whiteSpace: 'nowrap', fontWeight: active === s.key ? 600 : 400, letterSpacing: '0.03em',
            marginLeft: s.kind === 'tool' && NAV[NAV.indexOf(s) - 1]?.kind === 'dash' ? 16 : 0,
          }}>{s.icon} {s.label}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 64px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {active === 'newsletter' ? <Newsletter />
            : active === 'members' ? <Members />
            : <><ConnectBanner feed={feed} /><MarketingSection section={section} data={feed.data} /></>}
        </div>
      </div>
    </div>
  )
}
