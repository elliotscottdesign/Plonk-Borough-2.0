import React, { useState, useMemo, useEffect } from 'react'
import {
  SUPPLIERS,
  CATEGORIES_SUPPLIED,
  loadOverrides,
  saveOverrides,
  effective,
} from '../data/suppliers.js'

// ─── Suppliers — directory + 1-click trade portal launcher ────────────
// Each supplier is a card showing every contact field we have. Every
// field is editable inline; edits persist to localStorage under
// ndb_ops_suppliers_v1. The "Open trade portal" button is the workflow
// driver — one click and you're on their login page.
// ─────────────────────────────────────────────────────────────────────

const gold = 'var(--gold)'
const cream = 'var(--cream)'
const ink2 = 'rgba(255,255,255,0.04)'
const ink3 = 'rgba(255,255,255,0.08)'
const dim = 'rgba(245,239,227,0.6)'

export default function Suppliers() {
  const [overrides, setOverrides] = useState(() => loadOverrides())
  const [query, setQuery] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [editing, setEditing] = useState(null) // supplier.id currently being edited

  useEffect(() => { saveOverrides(overrides) }, [overrides])

  const patch = (id, field, value) => {
    setOverrides(o => ({ ...o, [id]: { ...(o[id] || {}), [field]: value } }))
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return merged.filter(s => {
      if (catFilter !== 'all' && !(s.categories || []).includes(catFilter)) return false
      if (!q) return true
      const blob = [s.name, s.address, s.phone, s.email, s.repName, s.notes, s.tradePortalNote, ...(s.categories || [])].join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [merged, query, catFilter])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: cream }}>
      {/* ─── Header / blurb ────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: gold, fontWeight: 700 }}>
          Operations · Suppliers
        </div>
        <h2 style={{ margin: '6px 0 0', fontSize: 24, color: gold, fontFamily: 'inherit' }}>Directory & trade portal launcher</h2>
        <p style={{ margin: '6px 0 0', color: dim, fontSize: 13, maxWidth: 720 }}>
          Every active supplier with contact details, address, and a 1-click link to their trade-portal login.
          Click <strong style={{ color: cream }}>Edit</strong> on any card to update the fields — saves locally to this device.
          {' '}Cards stay in seed-order unless you reset.
        </p>
      </div>

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
          style={{ ...inp, minWidth: 260, flex: 1 }}
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{ ...inp, minWidth: 180 }}
        >
          <option value="all">All categories</option>
          {CATEGORIES_SUPPLIED.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: dim, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
            {filtered.length} of {SUPPLIERS.length}
          </span>
          <button onClick={resetAll} style={btnGhost}>Reset all</button>
        </div>
      </div>

      {/* ─── Supplier cards ────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 14,
      }}>
        {filtered.map(s => (
          <SupplierCard
            key={s.id}
            supplier={s}
            isEditing={editing === s.id}
            onEditToggle={() => setEditing(editing === s.id ? null : s.id)}
            onPatch={(field, value) => patch(s.id, field, value)}
            onResetOne={() => resetOne(s.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p style={{ color: dim, padding: 20, gridColumn: '1 / -1', textAlign: 'center' }}>
            No suppliers match this filter. Clear the search to see all.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────
function SupplierCard({ supplier, isEditing, onEditToggle, onPatch, onResetOne }) {
  const portal = (supplier.tradePortal || '').trim()
  const website = (supplier.website || '').trim()
  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)',
      border: `1px solid ${supplier.priority === 'primary' ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 10,
      padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Name + edit toggle */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, color: gold, fontWeight: 600 }}>{supplier.name}</h3>
          {supplier.priority === 'primary' && (
            <span style={{
              display: 'inline-block', marginTop: 4,
              fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700,
              color: gold, padding: '2px 8px', borderRadius: 999,
              background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)',
            }}>Primary</span>
          )}
        </div>
        <button onClick={onEditToggle} style={btnGhost}>{isEditing ? 'Done' : 'Edit'}</button>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {(supplier.categories || []).map(c => (
          <span key={c} style={chip}>{c}</span>
        ))}
      </div>

      {/* Trade portal button — the marquee CTA */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {portal ? (
          <a href={portal} target="_blank" rel="noopener noreferrer" style={btnPrimary}>
            Open trade portal ↗
          </a>
        ) : (
          <span style={btnDisabled}>No portal URL yet</span>
        )}
        {website && website !== portal && (
          <a href={website} target="_blank" rel="noopener noreferrer" style={btnGhost}>
            Website ↗
          </a>
        )}
      </div>

      {/* Fields */}
      <Field label="Address"     value={supplier.address}    onChange={v => onPatch('address', v)} editing={isEditing} multiline />
      <Field label="Phone"       value={supplier.phone}      onChange={v => onPatch('phone', v)} editing={isEditing} type="tel" />
      <Field label="Email"       value={supplier.email}      onChange={v => onPatch('email', v)} editing={isEditing} type="email" />
      <Field label="Rep name"    value={supplier.repName}    onChange={v => onPatch('repName', v)} editing={isEditing} />
      <Field label="Trade portal URL" value={portal} onChange={v => onPatch('tradePortal', v)} editing={isEditing} type="url" mono />
      <Field label="Website URL" value={website} onChange={v => onPatch('website', v)} editing={isEditing} type="url" mono />
      <Field label="Payment terms" value={supplier.paymentTerms} onChange={v => onPatch('paymentTerms', v)} editing={isEditing} />
      <Field label="Notes"       value={supplier.notes}      onChange={v => onPatch('notes', v)} editing={isEditing} multiline />

      {supplier.tradePortalNote && !portal && (
        <div style={{
          fontSize: 11, color: dim, fontStyle: 'italic',
          background: ink2, padding: '8px 10px', borderRadius: 6,
        }}>
          {supplier.tradePortalNote}
        </div>
      )}

      {isEditing && (
        <div style={{ marginTop: 4 }}>
          <button onClick={onResetOne} style={{ ...btnGhost, color: '#FB7185', borderColor: 'rgba(251,113,133,0.3)' }}>
            Reset this card
          </button>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, editing, multiline, type = 'text', mono }) {
  const display = (value || '').toString().trim()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
  fontSize: 10, padding: '3px 8px', borderRadius: 999,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  color: cream, letterSpacing: '0.04em',
}
const inp = {
  background: ink3, border: '1px solid rgba(255,255,255,0.12)', color: cream,
  padding: '6px 8px', borderRadius: 6, fontSize: 13,
}
const btnPrimary = {
  background: 'rgba(201,168,76,0.16)', color: gold,
  border: '1px solid rgba(201,168,76,0.45)',
  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
  textDecoration: 'none', display: 'inline-block', cursor: 'pointer',
  letterSpacing: '0.06em', textTransform: 'uppercase',
}
const btnDisabled = {
  background: 'transparent', color: dim, border: '1px dashed rgba(255,255,255,0.15)',
  padding: '7px 14px', borderRadius: 8, fontSize: 11,
  letterSpacing: '0.06em', textTransform: 'uppercase',
}
const btnGhost = {
  background: 'transparent', color: cream, border: '1px solid rgba(255,255,255,0.18)',
  padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
  textDecoration: 'none', display: 'inline-block',
}
