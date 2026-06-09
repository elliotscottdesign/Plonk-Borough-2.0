import React from 'react'

// Branded No Dice tick-box selector for how a DJ plays: CDJ / Vinyl / Live.
// Multi-select (a DJ can do more than one). Stored as a " / "-joined string in
// the existing `format` column so it stays backward-compatible with old text
// values like "CDJ" or "Vinyl / CDJ".
//   selected : string[]  canonical formats currently picked
//   onChange : (string[]) => void
const RED = '#DA1B33', LINE = 'rgba(255,255,255,0.12)'
export const FORMATS = ['CDJ', 'Vinyl', 'Live']

// Parse a stored format string ("CDJ / Vinyl", "VINYL", "") → canonical array.
export const parseFormats = (s) => {
  const out = []
  for (const part of String(s || '').split('/').map(x => x.trim()).filter(Boolean)) {
    const m = FORMATS.find(f => f.toLowerCase() === part.toLowerCase())
    if (m && !out.includes(m)) out.push(m)
  }
  return out
}
export const joinFormats = (arr) => (arr || []).join(' / ')

export default function FormatPicker({ selected = [], onChange }) {
  const has = (f) => selected.includes(f)
  const toggle = (f) => has(f) ? onChange(selected.filter(x => x !== f)) : onChange([...selected, f])
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {FORMATS.map(f => {
        const on = has(f)
        return (
          <button key={f} type="button" onClick={() => toggle(f)} style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '10px 15px', borderRadius: 10, cursor: 'pointer',
            background: on ? 'rgba(218,27,51,0.12)' : 'transparent', border: `1px solid ${on ? RED : LINE}`,
            color: '#fff', fontSize: 14, fontWeight: on ? 700 : 400,
          }}>
            <span style={{
              width: 19, height: 19, borderRadius: 5, flexShrink: 0,
              border: `1px solid ${on ? RED : 'rgba(255,255,255,0.32)'}`, background: on ? RED : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700,
            }}>{on ? '✓' : ''}</span>
            {f}
          </button>
        )
      })}
    </div>
  )
}
