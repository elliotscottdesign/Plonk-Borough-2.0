import React, { useState } from 'react'
import { GENRES, GENRE_NAMES, ALL_SUBGENRES } from './genres.js'

// Reusable No Dice genre → sub-genre picker. Collapsible accordion (collapsed by
// default), pure React state so it behaves identically on iOS / Android / desktop.
// Works on a flat array of sub-genre NAMES.
//   selected : string[]              currently picked sub-genres
//   onChange : (string[]) => void
//   blocked  : string[]  (optional)  shown 🔒 + disabled (adjacent-day rule)
//   max      : number    (0 = unlimited)
const RED = '#DA1B33', LINE = 'rgba(255,255,255,0.12)'

export default function SubgenrePicker({ selected, onChange, blocked = [], max = 0 }) {
  const [open, setOpen] = useState({})
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
    <button key={n} type="button" disabled={isB || full} onClick={() => toggle(n)} title={isB ? 'Booked the night before/after' : (full ? 'Max reached' : '')}
      style={{ padding: '6px 11px', borderRadius: 999, fontSize: 12, cursor: (isB || full) ? 'not-allowed' : 'pointer',
        background: (isSel || custom) ? RED : 'transparent',
        color: isB ? 'rgba(255,255,255,0.25)' : ((isSel || custom) ? '#fff' : (full ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.82)')),
        border: `1px solid ${(isSel || custom) ? RED : isB ? 'rgba(255,255,255,0.08)' : LINE}`,
        textDecoration: isB ? 'line-through' : 'none', fontWeight: (isSel || custom) ? 700 : 400 }}>
      {n}{isB ? ' 🔒' : custom ? ' ✕' : ''}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${LINE}`, borderRadius: 10, overflow: 'hidden', background: '#0A0A0A' }}>
      {GENRE_NAMES.map((g, i) => {
        const sel = GENRES[g].filter(s => has(s))
        const isOpen = !!open[g]
        return (
          <div key={g} style={{ borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <button type="button" onClick={() => setOpen(o => ({ ...o, [g]: !o[g] }))}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#fff' }}>
              <span style={{ color: RED, fontSize: 11, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block', width: 10 }}>▶</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{g}</span>
              {sel.length > 0
                ? <span style={{ marginLeft: 'auto', fontSize: 11, color: RED, fontWeight: 600, maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{sel.join(' · ')}</span>
                : <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{isOpen ? '' : 'tap to pick'}</span>}
            </button>
            {isOpen && (
              <div style={{ padding: '0 12px 14px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {GENRES[g].map(sub => chip(sub, { isB: blocked.includes(sub), isSel: has(sub), full: atMax && !has(sub) }))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input value={text[g] || ''} onChange={e => setText(t => ({ ...t, [g]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(g) } }} placeholder={`Add your own ${g}…`}
                    style={{ flex: 1, minWidth: 0, padding: '8px 10px', fontSize: 12, borderRadius: 7, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none' }} />
                  <button type="button" onClick={() => add(g)} disabled={atMax || !(text[g] || '').trim()} style={{ padding: '8px 12px', fontSize: 12, borderRadius: 7, background: 'transparent', color: RED, border: `1px solid ${RED}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
      {customs.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Your own</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{customs.map(n => chip(n, { custom: true }))}</div>
        </div>
      )}
    </div>
  )
}
