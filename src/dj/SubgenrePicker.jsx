import React, { useState } from 'react'
import { GENRES, GENRE_NAMES, ALL_SUBGENRES } from './genres.js'

// Reusable No Dice genre → sub-genre picker (tap to select, "add your own" box
// per genre). Works on a flat array of sub-genre NAMES.
//   selected : string[]              currently picked sub-genres
//   onChange : (string[]) => void
//   blocked  : string[]  (optional)  shown 🔒 + disabled (adjacent-day rule)
//   max      : number    (0 = unlimited)
const RED = '#DA1B33', LINE = 'rgba(255,255,255,0.12)'

export default function SubgenrePicker({ selected, onChange, blocked = [], max = 0 }) {
  const [text, setText] = useState({})
  const has = (n) => selected.includes(n)
  const atMax = max > 0 && selected.length >= max
  const toggle = (n) => { if (has(n)) onChange(selected.filter(x => x !== n)); else if (!atMax) onChange([...selected, n]) }
  const add = (g) => {
    const n = (text[g] || '').trim()
    setText(t => ({ ...t, [g]: '' }))
    if (!n || atMax || has(n)) return
    onChange([...selected, n])
  }
  const customs = selected.filter(n => !ALL_SUBGENRES.includes(n))

  const chip = (n, { isB = false, isSel = false, full = false, custom = false }) => (
    <button key={n} disabled={isB || full} onClick={() => toggle(n)} title={isB ? 'Booked the night before/after' : (full ? 'Max reached' : '')}
      style={{ padding: '6px 11px', borderRadius: 999, fontSize: 12, cursor: (isB || full) ? 'not-allowed' : 'pointer',
        background: (isSel || custom) ? RED : 'transparent',
        color: isB ? 'rgba(255,255,255,0.25)' : ((isSel || custom) ? '#fff' : (full ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.82)')),
        border: `1px solid ${(isSel || custom) ? RED : isB ? 'rgba(255,255,255,0.08)' : LINE}`,
        textDecoration: isB ? 'line-through' : 'none', fontWeight: (isSel || custom) ? 700 : 400 }}>
      {n}{isB ? ' 🔒' : custom ? ' ✕' : ''}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {GENRE_NAMES.map(g => (
        <div key={g}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: '2px 0 6px' }}>{g}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {GENRES[g].map(sub => chip(sub, { isB: blocked.includes(sub), isSel: has(sub), full: atMax && !has(sub) }))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input value={text[g] || ''} onChange={e => setText(t => ({ ...t, [g]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(g) } }} placeholder={`Add your own ${g} sub-genre…`}
              style={{ flex: 1, minWidth: 0, padding: '7px 10px', fontSize: 12, borderRadius: 7, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none' }} />
            <button onClick={() => add(g)} disabled={atMax || !(text[g] || '').trim()} style={{ padding: '7px 12px', fontSize: 12, borderRadius: 7, background: 'transparent', color: RED, border: `1px solid ${RED}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
          </div>
        </div>
      ))}
      {customs.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: '2px 0 6px' }}>Your own</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{customs.map(n => chip(n, { custom: true }))}</div>
        </div>
      )}
    </div>
  )
}
