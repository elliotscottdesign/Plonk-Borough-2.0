import React, { useState, useMemo, useEffect } from 'react'
import {
  SUPPLIERS,
  CATEGORIES_SUPPLIED,
  GROUPS,
  loadOverrides,
  saveOverrides,
  effective,
} from '../data/suppliers.js'
import OpsBrandHeader from '../components/OpsBrandHeader.jsx'

// ─── Suppliers — directory + 1-click trade portal launcher ────────────
// Sections grouped by primary purpose (Spirits & Liqueurs, Wine, etc.).
// Each card is collapsed by default — header bar shows name, category
// chips, and the two action buttons (trade portal + website). Click the
// chevron to expand and reveal address, phone, email, payment terms,
// notes, plus the Edit button. All edits persist to localStorage under
// ndb_ops_suppliers_v1.
// ─────────────────────────────────────────────────────────────────────

const gold = 'var(--gold)'
const cream = 'var(--cream)'
const ink2 = 'rgba(255,255,255,0.04)'
const ink3 = 'rgba(255,255,255,0.08)'
const dim = 'rgba(245,239,227,0.6)'

const EXPANDED_KEY = 'ndb_ops_suppliers_expanded_v1'

export default function Suppliers() {
  const [overrides, setOverrides] = useState(() => loadOverrides())
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  // Per-card expanded state — persists across visits so the founder
  // doesn't lose the cards they were mid-editing.
  const [expanded, setExpanded] = useState(() => {
    try { return JSON.parse(localStorage.getItem(EXPANDED_KEY) || '{}') }
    catch { return {} }
  })
  // Per-card "edit mode" — separate from expanded so a card can be
  // open for viewing without all the inputs flipping into edit form.
  const [editing, setEditing] = useState({})

  useEffect(() => { saveOverrides(overrides) }, [overrides])
  useEffect(() => {
    try { localStorage.setItem(EXPANDED_KEY, JSON.stringify(expanded)) } catch {}
  }, [expanded])

  const patch = (id, field, value) => {
    setOverrides(o => ({ ...o, [id]: { ...(o[id] || {}), [field]: value } }))
  }

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))
  const toggleEdit   = (id) => setEditing(e => ({ ...e, [id]: !e[id] }))

  const expandAll = (val) => {
    const next = {}
    if (val) merged.forEach(s => { next[s.id] = true })
    setExpanded(next)
  }

  const resetOne = (id) => {
    if (!confirm('Discard your edits for this supplier? Seed values come back.')) return
    setOverrides(o => { const n = { ...o }; delete n[id]; return n })
  }

  const resetAll = () => {
    if (!confirm('Discard ALL supplier edits across every card? Seed values come back everywhere.')) return
    setOverrides({})
  }

  const merged = useMemo(
    () => SUPPLIERS.map(s => effective(s, overrides)),
    [overrides],
  )

  // Filtering: respects search + category filter.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return merged.filter(s => {
      if (catFilter !== 'all' && !(s.categories || []).includes(catFilter)) return false
      if (!q) return true
      const blob = [s.name, s.address, s.phone, s.email, s.repName, s.notes, s.tradePortalNote, ...(s.categories || [])].join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [merged, query, catFilter])

  // Group filtered suppliers by group key, preserving GROUPS order.
  const grouped = useMemo(() => {
    const map = new Map(GROUPS.map(g => [g.key, []]))
    for (const s of filtered) {
      const key = s.group || 'other'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    }
    return GROUPS
      .map(g => ({ ...g, items: map.get(g.key) || [] }))
      .filter(g => g.items.length > 0)
  }, [filtered])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: cream }}>
      {/* ─── No Dice brand header ────────────────────────────── */}
      <OpsBrandHeader
        eyebrow="Operations · Suppliers"
        title="Directory & trade portal launcher"
        subtitle={(
          <>
            Suppliers grouped by what they primarily stock. Click any card header to expand — reveals address, phone, email,
            payment terms and notes. Click <strong style={{ color: cream }}>Edit</strong> inside an expanded card to update fields. All edits save locally.
          </>
        )}
      />
      <style>{`
        @media print {
          @page { size: A4; margin: 28mm 10mm 12mm 10mm; }
          html, body { background: #ffffff !important; color: #000 !important; }
        }
      `}</style>

      {/* ─── Search / filter row ───────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
        background: ink2, border: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 10,
      }}>
        <input
          type="text"
          placeholder="Search supplier name, contact, notes…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ ...inp, minWidth: 240, flex: 1 }}
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{ ...inp, minWidth: 180 }}
        >
          <option value="all">All categories</option>
          {CATEGORIES_SUPPLIED.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => expandAll(true)} style={btnGhost}>Expand all</button>
        <button onClick={() => expandAll(false)} style={btnGhost}>Collapse all</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: dim, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
            {filtered.length} of {SUPPLIERS.length}
          </span>
          <button onClick={resetAll} style={btnGhost}>Reset all</button>
        </div>
      </div>

      {/* ─── Grouped sections ──────────────────────────────────────── */}
      {grouped.map(group => (
        <section key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 12,
            padding: '8px 0 6px',
            borderBottom: '1px solid rgba(201,168,76,0.18)',
          }}>
            <h3 style={{
              margin: 0, fontSize: 13, color: gold, fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>{group.label}</h3>
            <span style={{ fontSize: 11, color: dim, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>
              {group.items.length} {group.items.length === 1 ? 'supplier' : 'suppliers'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.items.map(s => (
              <SupplierCard
                key={s.id}
                supplier={s}
                expanded={!!expanded[s.id]}
                editing={!!editing[s.id]}
                onToggleExpand={() => toggleExpand(s.id)}
                onToggleEdit={() => toggleEdit(s.id)}
                onPatch={(field, value) => patch(s.id, field, value)}
                onResetOne={() => resetOne(s.id)}
              />
            ))}
          </div>
        </section>
      ))}
      {grouped.length === 0 && (
        <p style={{ color: dim, padding: 20, textAlign: 'center' }}>
          No suppliers match this filter. Clear the search to see all.
        </p>
      )}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────
function SupplierCard({ supplier, expanded, editing, onToggleExpand, onToggleEdit, onPatch, onResetOne }) {
  const portal = (supplier.tradePortal || '').trim()
  const website = (supplier.website || '').trim()

  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)',
      border: `1px solid ${supplier.priority === 'primary' ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* ─── Header bar (always visible) ───────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand() } }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px',
          cursor: 'pointer',
          background: expanded ? 'rgba(201,168,76,0.06)' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <span style={{
          color: gold, fontSize: 14, fontWeight: 700,
          width: 16, textAlign: 'center',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
        }}>▶</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, fontSize: 16, color: gold, fontWeight: 600 }}>{supplier.name}</h4>
            {supplier.priority === 'primary' && <span style={primaryPill}>Primary</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {(supplier.categories || []).map(c => (
              <span key={c} style={chip}>{c}</span>
            ))}
          </div>
        </div>

        {/* Action buttons in the header — clicks stopPropagation so
            they fire the link without toggling the expand. */}
        <div
          style={{ display: 'flex', gap: 6, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {portal ? (
            <a href={portal} target="_blank" rel="noopener noreferrer" style={btnPrimary}>
              Portal ↗
            </a>
          ) : (
            <span style={btnDisabled}>No portal</span>
          )}
          {website && website !== portal && (
            <a href={website} target="_blank" rel="noopener noreferrer" style={btnGhost}>
              Website ↗
            </a>
          )}
        </div>
      </div>

      {/* ─── Expanded body ────────────────────────────────────── */}
      {expanded && (
        <div style={{
          padding: '12px 16px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px 20px',
        }}>
          <Field label="Address" value={supplier.address} onChange={v => onPatch('address', v)} editing={editing} multiline span2 />
          <Field label="Phone" value={supplier.phone} onChange={v => onPatch('phone', v)} editing={editing} type="tel" />
          <Field label="Email" value={supplier.email} onChange={v => onPatch('email', v)} editing={editing} type="email" />
          <Field label="Rep name" value={supplier.repName} onChange={v => onPatch('repName', v)} editing={editing} />
          <Field label="Payment terms" value={supplier.paymentTerms} onChange={v => onPatch('paymentTerms', v)} editing={editing} />
          <Field label="Trade portal URL" value={portal} onChange={v => onPatch('tradePortal', v)} editing={editing} type="url" mono span2 />
          <Field label="Website URL" value={website} onChange={v => onPatch('website', v)} editing={editing} type="url" mono span2 />
          <Field label="Notes" value={supplier.notes} onChange={v => onPatch('notes', v)} editing={editing} multiline span2 />

          {supplier.tradePortalNote && !portal && (
            <div style={{
              gridColumn: '1 / -1',
              fontSize: 11, color: dim, fontStyle: 'italic',
              background: ink2, padding: '8px 10px', borderRadius: 6,
            }}>
              {supplier.tradePortalNote}
            </div>
          )}

          <div style={{
            gridColumn: '1 / -1',
            display: 'flex', gap: 8, marginTop: 4,
            paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <button onClick={onToggleEdit} style={editing ? btnPrimary : btnGhost}>
              {editing ? 'Done editing' : 'Edit fields'}
            </button>
            {editing && (
              <button onClick={onResetOne} style={{ ...btnGhost, color: '#FB7185', borderColor: 'rgba(251,113,133,0.3)' }}>
                Reset this card
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, editing, multiline, type = 'text', mono, span2 }) {
  const display = (value || '').toString().trim()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: span2 ? '1 / -1' : 'auto' }}>
      <span style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: dim, fontWeight: 700 }}>{label}</span>
      {editing ? (
        multiline ? (
          <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={2} style={{ ...inp, fontFamily: mono ? 'monospace' : 'inherit', width: '100%' }} />
        ) : (
          <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...inp, fontFamily: mono ? 'monospace' : 'inherit', width: '100%' }} />
        )
      ) : (
        <span style={{ fontSize: 13, color: display ? cream : dim, wordBreak: 'break-word', fontFamily: mono && display ? 'monospace' : 'inherit' }}>
          {display || '—'}
        </span>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────
const chip = {
  fontSize: 10, padding: '2px 7px', borderRadius: 999,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  color: cream, letterSpacing: '0.04em',
}
const primaryPill = {
  fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700,
  color: gold, padding: '2px 8px', borderRadius: 999,
  background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)',
}
const inp = {
  background: ink3, border: '1px solid rgba(255,255,255,0.12)', color: cream,
  padding: '6px 8px', borderRadius: 6, fontSize: 13,
}
const btnPrimary = {
  background: 'rgba(201,168,76,0.16)', color: gold,
  border: '1px solid rgba(201,168,76,0.45)',
  padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
  textDecoration: 'none', display: 'inline-block', cursor: 'pointer',
  letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
}
const btnDisabled = {
  background: 'transparent', color: dim, border: '1px dashed rgba(255,255,255,0.15)',
  padding: '6px 12px', borderRadius: 6, fontSize: 10,
  letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
}
const btnGhost = {
  background: 'transparent', color: cream, border: '1px solid rgba(255,255,255,0.18)',
  padding: '5px 11px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
  textDecoration: 'none', display: 'inline-block', whiteSpace: 'nowrap',
  letterSpacing: '0.04em',
}
