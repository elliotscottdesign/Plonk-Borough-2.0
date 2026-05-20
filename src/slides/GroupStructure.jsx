import React from 'react'
import IPLicenceSection from '../components/IPLicenceSection.jsx'

// GroupStructure (Borough deck) — mirrors the structure of the Hackney
// deck's GroupStructure slide so the corporate context is consistent
// across both investor surfaces. Lists the three entities in the No Dice
// ecosystem and how they relate.
//
// IMPORTANT — Borough vs Hackney divergence:
//   • The Borough deck is the original investor deck (pre-Hackney pivot)
//   • The "Borough" venue at Borough Market is no longer the active project
//     — per the Hackney GroupStructure note, "that project is no longer
//     going ahead". This slide therefore positions Borough Ltd as either
//     the (a) eventual second venue under the group OR (b) the dormant
//     original entity, depending on what the founder lands on.
//   • The shared IP Licence template is presented as a group-level
//     template applicable to ANY operating subsidiary (Borough Ltd as
//     well as Hackney Ltd), gated to founder access (888999).

const cs = {
  background: 'var(--ink-2)',
  border: '1px solid rgba(201,168,76,0.18)',
  borderRadius: 10,
  padding: 20,
}

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

// Diagram — parent + both subsidiaries (Borough, Hackney) + Wacky Works.
function OwnershipDiagram() {
  const w = 1000
  const h = 380
  const parent  = { x: 360, y: 14,  w: 280, h: 70 }
  const borough = { x: 80,  y: 196, w: 280, h: 80 }
  const hackney = { x: 380, y: 196, w: 280, h: 80 }
  const sister  = { x: 700, y: 196, w: 260, h: 80 }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', maxHeight: 380 }} role="img" aria-label="Group ownership diagram">
      {/* Parent → Borough 100% */}
      <line x1={parent.x + parent.w / 2} y1={parent.y + parent.h}
            x2={borough.x + borough.w / 2} y2={borough.y}
            stroke="var(--gold)" strokeWidth="2" />
      <text x={(parent.x + parent.w / 2 + borough.x + borough.w / 2) / 2 - 32}
            y={(parent.y + parent.h + borough.y) / 2 + 4}
            fontSize="11" fill="var(--gold)" fontWeight="600">100%</text>

      {/* Parent → Hackney 100% */}
      <line x1={parent.x + parent.w / 2} y1={parent.y + parent.h}
            x2={hackney.x + hackney.w / 2} y2={hackney.y}
            stroke="var(--gold)" strokeWidth="2" />
      <text x={parent.x + parent.w / 2 + 6}
            y={(parent.y + parent.h + hackney.y) / 2 + 4}
            fontSize="11" fill="var(--gold)" fontWeight="600">100%</text>

      {/* Hackney → Wacky Works operational link */}
      <line x1={hackney.x + hackney.w} y1={hackney.y + hackney.h / 2}
            x2={sister.x}              y2={sister.y + sister.h / 2}
            stroke="#A78BFA" strokeWidth="2" strokeDasharray="6 4" />
      <text x={(hackney.x + hackney.w + sister.x) / 2 - 32}
            y={hackney.y + hackney.h / 2 - 8}
            fontSize="10" fill="#C4B5FD">cross-traffic</text>

      {/* Parent box */}
      <rect x={parent.x} y={parent.y} width={parent.w} height={parent.h}
            rx="8" fill="var(--ink-3)" stroke="var(--gold)" strokeWidth="1.5" />
      <text x={parent.x + parent.w / 2} y={parent.y + 28} textAnchor="middle"
            fontSize="9" fill="var(--gold)" letterSpacing="0.14em">HOLDING COMPANY</text>
      <text x={parent.x + parent.w / 2} y={parent.y + 52} textAnchor="middle"
            fontSize="16" fill="var(--cream)" fontWeight="600" fontFamily="DM Serif Display, serif">
        No Dice Bars Limited
      </text>

      {/* Borough subsidiary */}
      <rect x={borough.x} y={borough.y} width={borough.w} height={borough.h}
            rx="8" fill="var(--ink-3)" stroke="#22D3EE" strokeWidth="1.5" />
      <text x={borough.x + borough.w / 2} y={borough.y + 22} textAnchor="middle"
            fontSize="9" fill="#22D3EE" letterSpacing="0.14em">OPERATING SUBSIDIARY</text>
      <text x={borough.x + borough.w / 2} y={borough.y + 46} textAnchor="middle"
            fontSize="15" fill="var(--cream)" fontWeight="600" fontFamily="DM Serif Display, serif">
        No Dice Borough Limited
      </text>
      <text x={borough.x + borough.w / 2} y={borough.y + 65} textAnchor="middle"
            fontSize="11" fill="var(--cream-dim)">Borough Market venue — original investor deck</text>

      {/* Hackney subsidiary */}
      <rect x={hackney.x} y={hackney.y} width={hackney.w} height={hackney.h}
            rx="8" fill="var(--ink-3)" stroke="#22D3EE" strokeWidth="1.5" />
      <text x={hackney.x + hackney.w / 2} y={hackney.y + 22} textAnchor="middle"
            fontSize="9" fill="#22D3EE" letterSpacing="0.14em">OPERATING SUBSIDIARY</text>
      <text x={hackney.x + hackney.w / 2} y={hackney.y + 46} textAnchor="middle"
            fontSize="15" fill="var(--cream)" fontWeight="600" fontFamily="DM Serif Display, serif">
        No Dice Hackney Limited
      </text>
      <text x={hackney.x + hackney.w / 2} y={hackney.y + 65} textAnchor="middle"
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

      {/* Legend */}
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
          The No Dice group is organised under a single holding company,{' '}
          <strong style={{ color: 'var(--cream)' }}>No Dice Bars Limited</strong>, which holds 100% of each
          trading subsidiary. The brand, customer database, website and IP sit at the parent level;
          each operating subsidiary licenses what it needs to trade under the No Dice name.
        </div>
      </div>

      {/* Diagram card */}
      <div style={{ ...cs, marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
          Ownership diagram
        </div>
        <OwnershipDiagram />
      </div>

      {/* Entity detail cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <EntityCard
          tone="parent"
          name="No Dice Bars Limited"
          suffix="Parent / holding company · UK-incorporated"
          bullets={[
            'Owns 100% of the share capital of each operating subsidiary.',
            'Holds the brand, the nodice.bar website and domain, all trade marks, the customer database, and the marketing CRM.',
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
            'Customers of the Wacky Works golf course buy drinks and food at the No Dice Hackney bar — net inbound footfall for Hackney, no revenue share owed to Wacky Works.',
            'Not a subsidiary of No Dice Bars Limited; relationship is operational, not equity.',
          ]}
        />
        <EntityCard
          tone="operating"
          name="No Dice Borough Limited"
          suffix="Borough Market venue · original investor deck"
          bullets={[
            '100% owned by No Dice Bars Limited.',
            'The original Borough Market venue under the No Dice brand; the entity that this investor deck refers to.',
            'Separate financial accounts, separate licence, separate lease — ring-fenced at the entity level.',
            'Operates under a Brand & Data Licence from No Dice Bars Limited.',
          ]}
        />
        <EntityCard
          tone="operating"
          name="No Dice Hackney Limited"
          suffix="London Fields venue · bar-led, with games on site"
          bullets={[
            '100% owned by No Dice Bars Limited — sister operating subsidiary alongside Borough.',
            'Operates the No Dice Hackney bar at 407 Mentmore Terrace, E8.',
            'Bar-led offering with games (pool, arcade, tokens) on site. Crazy golf next door is run by Wacky Works, not by this company.',
            'Operates under a Brand & Data Licence from No Dice Bars Limited.',
          ]}
        />
      </div>

      {/* Group IP / data licence callout */}
      <div style={{
        ...cs,
        background: 'rgba(34,211,238,0.06)',
        border: '1px solid rgba(34,211,238,0.3)',
        borderLeft: '4px solid #22D3EE',
        padding: '16px 20px',
      }}>
        <div style={{ fontSize: 10, color: '#22D3EE', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          Why the holding-company structure matters
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.7 }}>
          By holding the brand, customer database and IP at the parent level, the group <strong style={{ color: '#7DD3FC' }}>ring-fences operating risk at the venue level</strong>:
          if a single venue runs into trouble (lease dispute, licence challenge, force majeure), the brand and the customer relationships
          survive at the parent and roll into the next venue. Investors in any single operating subsidiary therefore benefit from
          group-level brand strength without taking on group-level liabilities.
        </div>
      </div>

      {/* Footer caveat */}
      <div style={{ marginTop: 18, fontSize: 10, color: 'var(--cream-dim)', lineHeight: 1.55, opacity: 0.7 }}>
        Group-structure summary for investor information only. Statutory company numbers,
        registered offices, and detailed inter-company arrangements are documented in the
        full subscription pack. Subject to contract.
      </div>

      {/* Founder-only · Brand, IP & Customer-Data Licence template.
          Returns null for non-founder access codes; only 888999 sees it. */}
      <IPLicenceSection licensee="No Dice Borough Ltd" />

    </div>
  )
}
