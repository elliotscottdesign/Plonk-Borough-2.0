import React, { useState, useRef, useEffect } from 'react'
import { rotaCompleteTraining, rotaUncompleteTraining } from './api.js'
import { MODULES, MODULE_META, TRAINING_CATEGORIES, moduleByKey, cocktailKey } from './training.js'
import { SPECS, SPEC_SECTIONS } from '../ops/data/cocktailSpecs.js'

// ─── Staff training (portal) ─────────────────────────────────────────────────
// Read the No Dice training modules + Bar Manual and mark each complete, plus a
// Cocktails subsection (live specs) with a "trained" box per drink. Phone-first.

const RED = '#DA1B33', GREEN = '#34D399', CARD = '#111113', LINE = 'rgba(255,255,255,0.12)'

// Render a body string that uses "\n• " bullet lines.
function Body({ text }) {
  return <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', whiteSpace: 'pre-wrap' }}>{text}</div>
}

export default function TrainingView({ token, training = [], onToggle }) {
  const [done, setDone] = useState(() => new Set(training))
  const [sel, setSel] = useState(null)   // null | moduleKey | 'cocktails'
  const isDone = (key) => done.has(key)
  const mounted = useRef(true)
  useEffect(() => () => { mounted.current = false }, [])

  const toggle = (key) => {
    const on = !done.has(key)
    setDone(s => { const n = new Set(s); on ? n.add(key) : n.delete(key); return n })
    onToggle?.(key, on)   // keep the parent (and a tab-switch remount) in sync
    const call = on ? rotaCompleteTraining : rotaUncompleteTraining
    call(token, key).catch(e => {
      onToggle?.(key, !on)   // parent stays mounted — always revert there
      if (mounted.current) { setDone(s => { const n = new Set(s); on ? n.delete(key) : n.add(key); return n }); alert(e.message) }
    })
  }

  // ── Cocktails subsection ──
  if (sel === 'cocktails') {
    const trainedN = SPECS.filter(s => isDone(cocktailKey(s.id))).length
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setSel(null)} style={btn('ghost')}>‹ Back</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>🍸 Cocktails</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>{trainedN}/{SPECS.length} trained · tick each when you can make it to spec</div>
          </div>
        </div>
        {SPEC_SECTIONS.map(group => {
          const rows = SPECS.filter(s => s.section === group.key)
          if (!rows.length) return null
          return (
            <div key={group.key} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: RED, fontWeight: 700, padding: '10px 14px 4px' }}>{group.label}</div>
              {rows.map((s, i) => {
                const k = cocktailKey(s.id), on = isDone(k)
                return (
                  <button key={s.id} onClick={() => toggle(k)} style={rowBtn(i, on)}>
                    <Check on={on} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: on ? 'rgba(255,255,255,0.6)' : '#fff' }}>{s.name}</span>
                    <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{s.method}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Specs live in Operations · Cocktail Specs — ask a manager to run through any you haven't ticked.</div>
      </div>
    )
  }

  // ── A single module ──
  if (sel && sel !== 'cocktails') {
    const m = moduleByKey(sel)
    if (!m) return null   // (Back resets sel; every real module key resolves)
    const on = isDone(m.key)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setSel(null)} style={btn('ghost')}>‹ Back</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{m.icon} {m.title}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>{m.category}</div>
          </div>
        </div>
        {m.intro && <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>{m.intro}</div>}
        {m.sections.map((sec, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{sec.heading}</div>
            <Body text={sec.body} />
          </div>
        ))}
        {m.keyPoints?.length > 0 && (
          <div style={{ background: 'rgba(218,27,51,0.06)', border: '1px solid rgba(218,27,51,0.3)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Must remember</div>
            {m.keyPoints.map((k, i) => <div key={i} style={{ fontSize: 13, lineHeight: 1.5, color: '#fff', display: 'flex', gap: 8, marginTop: i ? 6 : 0 }}><span style={{ color: RED, flexShrink: 0 }}>›</span>{k}</div>)}
          </div>
        )}
        <button onClick={() => toggle(m.key)} style={{ ...btn(on ? 'ghost' : 'red'), padding: '13px', fontSize: 14, width: '100%' }}>
          {on ? '✓ Completed — tap to undo' : "I've read this — mark complete"}
        </button>
      </div>
    )
  }

  // ── Overview ──
  const total = MODULE_META.length, doneModules = MODULE_META.filter(m => isDone(m.key)).length
  const cocktailN = SPECS.filter(s => isDone(cocktailKey(s.id))).length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>Your No Dice training. Read each one and mark it complete — <strong style={{ color: GREEN }}>{doneModules}/{total} modules</strong> done.</div>

      {TRAINING_CATEGORIES.map(cat => {
        const rows = MODULES.filter(m => m.category === cat)
        if (!rows.length) return null
        return (
          <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{cat}</div>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
              {rows.map((m, i) => {
                const on = isDone(m.key)
                return (
                  <button key={m.key} onClick={() => setSel(m.key)} style={rowBtn(i, false)}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{m.icon}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: '#fff' }}>{m.title}</span>
                    {on ? <span style={{ fontSize: 11, color: GREEN, fontWeight: 700, whiteSpace: 'nowrap' }}>✓ done</span> : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>read ›</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Bar craft</div>
        <button onClick={() => setSel('cocktails')} style={{ ...rowBtn(0, false), background: CARD, border: `1px solid ${LINE}`, borderRadius: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🍸</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, color: '#fff' }}>Cocktails</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{cocktailN}/{SPECS.length} trained</div>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>›</span>
        </button>
      </div>
    </div>
  )
}

const Check = ({ on }) => (
  <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, border: `2px solid ${on ? GREEN : 'rgba(255,255,255,0.3)'}`, background: on ? GREEN : 'transparent', color: '#06281C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>{on ? '✓' : ''}</span>
)
const rowBtn = (i, on) => ({ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', padding: '12px 14px', background: on ? 'rgba(52,211,153,0.06)' : 'transparent', border: 'none', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', color: '#fff' })
const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'red') return { ...base, background: RED, color: '#fff' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }
}
