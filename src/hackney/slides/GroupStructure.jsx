import React from 'react'

// GroupStructure — corporate / group-level context for No Dice Hackney
// investors. Lays out the four entities involved in the wider business,
// who owns whom, and how they relate operationally to the venue under
// consideration. The Hackney investment is into No Dice Hackney Limited
// directly; this page exists so investors understand what sits above
// (the holding company) and what sits next door (the Wacky Works golf
// course that drives cross-traffic into the Hackney bar).

const cs = {
  background: 'var(--ink-2)',
  border: '1px solid rgba(201,168,76,0.18)',
  borderRadius: 10,
  padding: 20,
}

// ─── Entity card ──────────────────────────────────────────────────
// Single re-usable card for each of the four entities on the page.
// `tone` colours the accent strip on the left; "parent" gets the
// gold treatment, "operating" gets cream, "sister" gets a teal so
// Wacky Works reads as related-but-separate at a glance.
const TONES = {
  parent:    { bar: 'var(--gold)',  label: 'Holding company' },
  operating: { bar: '#22D3EE',      label: 'Operating subsidiary' },
  sister:    { bar: '#A78BFA',      label: 'Sister company' },
}

function EntityCard({ name, suffix, tone, bullets }) {
  const t = TONES[tone] || TONES.operating
  return (
    <div style={{ ...cs, borderLeft: `4px solid ${t.bar}`, padding: '18px 20px' }}>
      <div style={{ fontSize: 10, color: t.bar, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
        {t.label}
      </div>
      <div className="serif" style={{ fontSize: 20, color: 'var(--cream)', lineHeight: 1.25, marginBottom: 4 }}>
        {name}
      </div>
      {suffix && (
        <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 10 }}>{suffix}</div>
      )}
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
        {bullets.map((b, i) => <li key={i} style={{ marginBottom: 4 }}>{b}</li>)}
      </ul>
    </div>
  )
}

// ─── Ownership diagram ────────────────────────────────────────────
// Hand-drawn SVG showing the parent → two subsidiaries fan plus the
// dotted operational link from No Dice Hackney to Wacky Works. Kept
// small / readable on a 1280-wide slide; scales fluidly via the
// viewBox.
function OwnershipDiagram() {
  const w = 900
  const h = 380
  // Box geometry — top parent, two children below, sister to the right.
  const parent = { x: 330, y: 14,  w: 240, h: 70 }
  const left   = { x: 100, y: 196, w: 240, h: 80 }
  const right  = { x: 380, y: 196, w: 240, h: 80 }
  const sister = { x: 660, y: 196, w: 230, h: 80 }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', maxHeight: 380 }} role="img" aria-label="Group ownership diagram">
      {/* Parent → children ownership lines (solid, gold, with 100% labels) */}
      <line x1={parent.x + parent.w / 2} y1={parent.y + parent.h}
            x2={left.x  + left.w  / 2}   y2={left.y}
            stroke="var(--gold)" strokeWidth="2" />
      <line x1={parent.x + parent.w / 2} y1={parent.y + parent.h}
            x2={right.x + right.w / 2}   y2={right.y}
            stroke="var(--gold)" strokeWidth="2" />
      <text x={(parent.x + parent.w / 2 + left.x  + left.w  / 2) / 2 - 22}
            y={(parent.y + parent.h + left.y) / 2 - 4}
            fontSize="11" fill="var(--gold)" fontWeight="600">100%</text>
      <text x={(parent.x + parent.w / 2 + right.x + right.w / 2) / 2 + 6}
            y={(parent.y + parent.h + right.y) / 2 - 4}
            fontSize="11" fill="var(--gold)" fontWeight="600">100%</text>

      {/* No Dice Hackney → Wacky Works operational link (dashed, teal) */}
      <line x1={right.x + right.w}      y1={right.y + right.h / 2}
            x2={sister.x}                y2={sister.y + sister.h / 2}
            stroke="#A78BFA" strokeWidth="2" strokeDasharray="6 4" />
      <text x={(right.x + right.w + sister.x) / 2 - 50}
            y={right.y + right.h / 2 - 8}
            fontSize="10" fill="#C4B5FD" letterSpacing="0.06em" textTransform="uppercase">cross-traffic</text>
      <text x={(right.x + right.w + sister.x) / 2 - 50}
            y={right.y + right.h / 2 + 22}
            fontSize="10" fill="#C4B5FD" letterSpacing="0.06em">(operational link)</text>

      {/* Parent box */}
      <rect x={parent.x} y={parent.y} width={parent.w} height={parent.h}
            rx="8" fill="var(--ink-3)" stroke="var(--gold)" strokeWidth="1.5" />
      <text x={parent.x + parent.w / 2} y={parent.y + 28} textAnchor="middle"
            fontSize="9" fill="var(--gold)" letterSpacing="0.14em">HOLDING COMPANY</text>
      <text x={parent.x + parent.w / 2} y={parent.y + 52} textAnchor="middle"
            fontSize="16" fill="var(--cream)" fontWeight="600" fontFamily="DM Serif Display, serif">
        No Dice Bars Limited
      </text>

      {/* Left child — Borough */}
      <rect x={left.x} y={left.y} width={left.w} height={left.h}
            rx="8" fill="var(--ink-3)" stroke="#22D3EE" strokeWidth="1.5" />
      <text x={left.x + left.w / 2} y={left.y + 22} textAnchor="middle"
            fontSize="9" fill="#22D3EE" letterSpacing="0.14em">OPERATING SUBSIDIARY</text>
      <text x={left.x + left.w / 2} y={left.y + 46} textAnchor="middle"
            fontSize="15" fill="var(--cream)" fontWeight="600" fontFamily="DM Serif Display, serif">
        No Dice Borough Limited
      </text>
      <text x={left.x + left.w / 2} y={left.y + 65} textAnchor="middle"
            fontSize="11" fill="var(--cream-dim)">Borough Market venue · bar, games, golf</text>

      {/* Right child — Hackney */}
      <rect x={right.x} y={right.y} width={right.w} height={right.h}
            rx="8" fill="var(--ink-3)" stroke="#22D3EE" strokeWidth="1.5" />
      <text x={right.x + right.w / 2} y={right.y + 22} textAnchor="middle"
            fontSize="9" fill="#22D3EE" letterSpacing="0.14em">OPERATING SUBSIDIARY</text>
      <text x={right.x + right.w / 2} y={right.y + 46} textAnchor="middle"
            fontSize="15" fill="var(--cream)" fontWeight="600" fontFamily="DM Serif Display, serif">
        No Dice Hackney Limited
      </text>
      <text x={right.x + right.w / 2} y={right.y + 65} textAnchor="middle"
            fontSize="11" fill="var(--cream-dim)">London Fields venue · bar with games</text>

      {/* Sister — Wacky Works */}
      <rect x={sister.x} y={sister.y} width={sister.w} height={sister.h}
            rx="8" fill="var(--ink-3)" stroke="#A78BFA" strokeWidth="1.5" />
      <text x={sister.x + sister.w / 2} y={sister.y + 22} textAnchor="middle"
            fontSize="9" fill="#A78BFA" letterSpacing="0.14em">SISTER COMPANY</text>
      <text x={sister.x + sister.w / 2} y={sister.y + 46} textAnchor="middle"
            fontSize="15" fill="var(--cream)" fontWeight="600" fontFamily="DM Serif Display, serif">
        Wacky Works
      </text>
      <text x={sister.x + sister.w / 2} y={sister.y + 65} textAnchor="middle"
            fontSize="11" fill="var(--cream-dim)">Crazy-golf build, design &amp; operations</text>

      {/* Legend bottom-left */}
      <g transform="translate(20, 332)">
        <line x1="0" y1="0" x2="24" y2="0" stroke="var(--gold)" strokeWidth="2" />
        <text x="32" y="4" fontSize="10" fill="var(--cream-dim)">100% ownership</text>
        <line x1="170" y1="0" x2="194" y2="0" stroke="#A78BFA" strokeWidth="2" strokeDasharray="6 4" />
        <text x="202" y="4" fontSize="10" fill="var(--cream-dim)">Operational link (no ownership)</text>
      </g>
    </svg>
  )
}

export default function GroupStructure() {
  return (
    <div style={{ padding: '32px 48px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="serif" style={{ fontSize: 36, color: 'var(--cream)', lineHeight: 1.15 }}>
          Group Structure
        </div>
        <div className="gold-rule" style={{ marginTop: 14, marginBottom: 14 }} />
        <div style={{ fontSize: 14, color: 'var(--cream-dim)', maxWidth: 820, lineHeight: 1.6 }}>
          Four entities make up the No Dice ecosystem. The Hackney investment
          sits in <strong style={{ color: 'var(--cream)' }}>No Dice Hackney Limited</strong>, a
          wholly-owned subsidiary of <strong style={{ color: 'var(--cream)' }}>No Dice Bars Limited</strong>.
          A sister company — <strong style={{ color: 'var(--cream)' }}>Wacky Works</strong> — operates
          a separate crazy-golf venue next door to the Hackney bar, driving cross-traffic to
          the venue without sharing in its trade.
        </div>
      </div>

      {/* Diagram card */}
      <div style={{ ...cs, marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
          Ownership diagram
        </div>
        <OwnershipDiagram />
      </div>

      {/* Entity detail cards — 2-up grid, fourth card sits below by itself */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <EntityCard
          tone="parent"
          name="No Dice Bars Limited"
          suffix="Parent / holding company · UK-incorporated"
          bullets={[
            'Owns 100% of the share capital of No Dice Borough Limited and No Dice Hackney Limited.',
            'Holds no operating trade in its own right — corporate, brand, and IP layer only.',
            'Group-level reporting and inter-company arrangements sit at this level.',
          ]}
        />
        <EntityCard
          tone="sister"
          name="Wacky Works"
          suffix="Crazy-golf build, design & operations · separately owned"
          bullets={[
            'Designs and builds crazy-golf courses for third-party bars and venues across the UK.',
            'Operates a crazy-golf course adjacent to the No Dice Hackney bar — independently of No Dice Hackney Limited.',
            'Customers of the Wacky Works golf course buy drinks, food and other in-venue spend at the No Dice Hackney bar across the road — net inbound footfall for Hackney, no revenue share owed to Wacky Works.',
            'Not a subsidiary of No Dice Bars Limited; relationship is operational, not equity.',
          ]}
        />
        <EntityCard
          tone="operating"
          name="No Dice Borough Limited"
          suffix="Borough Market venue · bar, games and crazy golf under one roof"
          bullets={[
            '100% owned by No Dice Bars Limited.',
            'Operates the original No Dice venue at Borough Market — bar revenue plus in-house mini-golf and games.',
            'Separate financial accounts, separate licence, separate lease — ring-fenced from Hackney.',
          ]}
        />
        <EntityCard
          tone="operating"
          name="No Dice Hackney Limited"
          suffix="London Fields venue · bar-led, with games on site"
          bullets={[
            '100% owned by No Dice Bars Limited.',
            'Operates the No Dice Hackney bar at 407 Mentmore Terrace, E8 — the venue and trade you are investing in.',
            'Bar-led offering with games (pool, arcade, tokens) on site. Crazy golf next door is run by Wacky Works, not by this company.',
            'Separate financial accounts, separate licence, separate lease — ring-fenced from Borough.',
          ]}
        />
      </div>

      {/* Cross-traffic value note — directly tied to the diagram's dashed line */}
      <div style={{
        ...cs,
        background: 'rgba(167,139,250,0.06)',
        border: '1px solid rgba(167,139,250,0.3)',
        borderLeft: '4px solid #A78BFA',
        padding: '16px 20px',
      }}>
        <div style={{ fontSize: 10, color: '#A78BFA', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          Why the Wacky Works link matters for Hackney
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.7 }}>
          The crazy-golf course operated by Wacky Works sits directly across from the
          No Dice Hackney bar. Players come for the golf, then settle in at the bar for drinks
          and food — <strong style={{ color: '#C4B5FD' }}>the bar captures 100% of the food &amp; beverage spend</strong> from
          customers who arrived for the golf. The arrangement gives Hackney a steady,
          activity-driven footfall stream without the capex, licensing burden, or operating
          complexity of running a golf course inside the bar. No revenue share flows to
          Wacky Works on bar takings; no revenue share flows to No Dice Hackney on golf takings.
          Two cleanly-separated trades, one shared catchment.
        </div>
      </div>

      {/* Footer caveat */}
      <div style={{ marginTop: 18, fontSize: 10, color: 'var(--cream-dim)', lineHeight: 1.55, opacity: 0.7 }}>
        Group-structure summary for investor information only. Statutory company numbers,
        registered offices, and detailed inter-company arrangements are documented in the
        full subscription pack. Subject to contract.
      </div>

    </div>
  )
}
