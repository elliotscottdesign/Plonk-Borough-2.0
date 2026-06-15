import React, { useMemo, useState } from 'react'
import { SPECS, SPEC_SECTIONS } from '../data/cocktailSpecs.js'
import OpsBrandHeader from '../components/OpsBrandHeader.jsx'

// ─── Cocktail Specs — bar-side reference + printable build sheet ──────
// Matches the layout of "Cocktail Specs Update DEC 2025.pdf" — same
// column shape (Ingredients | Build / method | Glassware), grouped by
// SHAKE / BUILD / JUGS / MOCKTAILS / SHRUBS. The Print button triggers
// window.print(); a @media print block flips the page to ink-efficient
// black-on-white with simple table borders for laminated bar copies or
// "Save as PDF".
// ──────────────────────────────────────────────────────────────────────

const gold = 'var(--gold)'
const cream = 'var(--cream)'
const ink2 = 'rgba(255,255,255,0.04)'
const dim = 'rgba(245,239,227,0.6)'

export default function CocktailSpecs() {
  const [activeSection, setActiveSection] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SPECS.filter(s => {
      if (activeSection !== 'all' && s.section !== activeSection) return false
      if (!q) return true
      const blob = [s.name, s.method, s.glass, s.garnish, s.build, ...(s.ingredients || [])].join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [activeSection, query])

  const grouped = useMemo(() => {
    return SPEC_SECTIONS
      .map(g => ({ ...g, items: filtered.filter(s => s.section === g.key) }))
      .filter(g => g.items.length > 0)
  }, [filtered])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: cream }}>
      {/* ─── No Dice brand header (hidden in print) ────────────── */}
      <OpsBrandHeader
        eyebrow="Operations · Cocktail Specs"
        title="House cocktail build reference"
        subtitle={(
          <>
            Source of truth for every spec on the bar — from <strong style={{ color: cream }}>Cocktail Specs Update DEC 2025.pdf</strong>.
            Click <strong style={{ color: cream }}>Print sheet</strong> for an ink-efficient black-on-white download with the No Dice
            wordmark on every page. Filter or search to narrow.
          </>
        )}
        action={(
          <button onClick={() => window.print()} style={btnPrimary}>Print sheet ↗</button>
        )}
      />

      {/* ─── Toolbar (hidden in print) ──────────────────────────── */}
      <div className="screen-only" style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
        background: ink2, border: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 10,
      }}>
        <input
          type="text"
          placeholder="Search cocktail name, ingredient, glassware…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ ...inp, minWidth: 240, flex: 1 }}
        />
        <select
          value={activeSection}
          onChange={e => setActiveSection(e.target.value)}
          style={{ ...inp, minWidth: 160 }}
        >
          <option value="all">All sections</option>
          {SPEC_SECTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <span style={{ fontSize: 11, color: dim, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
          {filtered.length} of {SPECS.length}
        </span>
      </div>

      {/* ─── Print-only running header (No Dice wordmark on every page) ───
          A position:fixed header inside @media print runs on every printed
          page in Chrome/Safari/Firefox; the @page top margin reserves room
          so it never overlaps content. */}
      <div className="print-only print-running-header">
        <img src="/nodice-wordmark.png" alt="No Dice" />
        <div className="print-running-subtitle">Cocktail Specs · House bar reference</div>
      </div>

      {/* ─── Sections + spec rows ───────────────────────────────── */}
      {grouped.map(group => (
        <section key={group.key} className="spec-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 className="section-header" style={{
            margin: 0, fontSize: 13, color: gold, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            padding: '8px 0 6px',
            borderBottom: '1px solid rgba(201,168,76,0.18)',
          }}>{group.label}</h3>

          <table className="spec-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: ink2 }}>
                <th style={th}>Cocktail / Ingredients</th>
                <th style={{ ...th, width: '38%' }}>Method &amp; build notes</th>
                <th style={{ ...th, width: 130 }}>Glassware</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((s) => (
                <SpecRow key={s.id} spec={s} />
              ))}
            </tbody>
          </table>
        </section>
      ))}

      {grouped.length === 0 && (
        <p className="screen-only" style={{ color: dim, padding: 20, textAlign: 'center' }}>
          No specs match this filter. Clear the search to see all.
        </p>
      )}

      {/* ─── Print CSS — ink-efficient B&W transform with No Dice
              wordmark running header on every page. ─────────────── */}
      <style>{`
        .print-only { display: none; }
        @media print {
          /* Page margin reserves space for the running header at top. */
          @page { size: A4; margin: 28mm 10mm 12mm 10mm; }
          html, body { background: #ffffff !important; color: #000000 !important; }
          .screen-only { display: none !important; }
          .print-only { display: block !important; color: #000 !important; }

          /* Wordmark running header — repeats on every printed page via
             position:fixed inside the print box. */
          .print-running-header {
            position: fixed;
            top: 0; left: 0; right: 0;
            text-align: center;
            padding-top: 4mm;
            border-bottom: 1px solid #000;
            padding-bottom: 3mm;
            background: #fff;
          }
          .print-running-header img {
            height: 12mm;
            display: block;
            margin: 0 auto;
            filter: brightness(0); /* force the wordmark to pure black on white */
          }
          .print-running-subtitle {
            margin: 1mm 0 0;
            font-size: 8pt;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #000;
          }

          .spec-section { break-inside: avoid; page-break-inside: avoid; }
          .section-header {
            color: #000 !important;
            border-bottom: 1px solid #000 !important;
            margin-top: 4mm !important;
            font-size: 11pt !important;
          }
          .spec-table {
            color: #000 !important;
            border: 1px solid #000 !important;
            page-break-inside: auto;
            font-size: 9pt !important;
          }
          .spec-table th, .spec-table td {
            background: #fff !important;
            color: #000 !important;
            border: 1px solid #000 !important;
            padding: 4px 6px !important;
            vertical-align: top;
          }
          .spec-table tr { page-break-inside: avoid; }
          .glass-icon { stroke: #000 !important; fill: none !important; }
          .ing-list, .garnish-line, .batch-note, .build-text, .cocktail-name { color: #000 !important; }
          .garnish-line { font-style: italic; }
          .batch-note { font-size: 8pt; }
          a { color: #000 !important; text-decoration: none; }
        }
      `}</style>
    </div>
  )
}

// ─── One row per cocktail ───────────────────────────────────────
function SpecRow({ spec }) {
  return (
    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <td style={tdTight}>
        <div className="cocktail-name" style={{
          fontSize: 13, color: gold, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {spec.name}
        </div>
        <ul className="ing-list" style={{ margin: '6px 0 0', padding: 0, listStyle: 'none' }}>
          {spec.ingredients.map((line, i) => (
            <li key={i} style={{ fontSize: 12, lineHeight: 1.5, color: cream }}>{line}</li>
          ))}
        </ul>
        {spec.garnish && (
          <div className="garnish-line" style={{ marginTop: 6, fontSize: 11, color: dim }}>
            <strong style={{ color: cream, fontStyle: 'normal' }}>G:</strong> {spec.garnish}
          </div>
        )}
      </td>
      <td style={tdTight}>
        <div style={{
          fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: gold, fontWeight: 700, marginBottom: 4,
        }}>{spec.method}</div>
        <div className="build-text" style={{ fontSize: 12, lineHeight: 1.5, color: cream }}>{spec.build}</div>
        {spec.batchNote && (
          <div className="batch-note" style={{ marginTop: 6, fontSize: 10, color: dim, fontStyle: 'italic' }}>
            {spec.batchNote}
          </div>
        )}
      </td>
      <td style={{ ...tdTight, textAlign: 'center' }}>
        <GlassIcon name={spec.glass} />
        <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: dim, marginTop: 6 }}>
          {spec.glass}
        </div>
      </td>
    </tr>
  )
}

// ─── Inline SVG glass icons — match the PDF stick-figure style ──
function GlassIcon({ name }) {
  const stroke = cream
  const props = { className: 'glass-icon', stroke, fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const lower = (name || '').toLowerCase()

  // Coupe — V bowl on a stem with base
  if (lower.includes('coupe')) {
    return (
      <svg viewBox="0 0 60 70" width="46" height="54" {...props}>
        <path d="M10 12 L50 12 L30 35 Z" />
        <line x1="30" y1="35" x2="30" y2="58" />
        <line x1="18" y1="62" x2="42" y2="62" />
      </svg>
    )
  }
  // Wine glass — U bowl on stem
  if (lower.includes('wine')) {
    return (
      <svg viewBox="0 0 60 70" width="46" height="54" {...props}>
        <path d="M14 10 L46 10 Q46 36 30 38 Q14 36 14 10 Z" />
        <line x1="30" y1="38" x2="30" y2="60" />
        <line x1="18" y1="63" x2="42" y2="63" />
      </svg>
    )
  }
  // Highball or jug — tall rectangle
  if (lower.includes('highball') || lower.includes('hi ball') || lower.includes('jug') || lower.includes('pitcher')) {
    return (
      <svg viewBox="0 0 60 70" width="40" height="54" {...props}>
        <rect x="18" y="8" width="24" height="56" rx="3" />
        {lower.includes('jug') && <path d="M42 22 L52 28 L52 44 L42 50" />}
      </svg>
    )
  }
  // Default — short tumbler (rock glass)
  return (
    <svg viewBox="0 0 60 70" width="44" height="44" {...props}>
      <rect x="14" y="22" width="32" height="40" rx="3" />
    </svg>
  )
}

// ─── Styles ────────────────────────────────────────────────────
const th = {
  textAlign: 'left', padding: '8px 10px',
  fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: dim, fontWeight: 700,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
}
const tdTight = {
  padding: '10px 12px', verticalAlign: 'top',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
}
const inp = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: cream,
  padding: '6px 8px', borderRadius: 6, fontSize: 13,
}
const btnPrimary = {
  background: 'rgba(201,168,76,0.16)', color: gold,
  border: '1px solid rgba(201,168,76,0.45)',
  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
  cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase',
}
