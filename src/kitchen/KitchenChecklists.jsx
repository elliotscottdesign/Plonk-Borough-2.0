import React, { useEffect, useRef, useState } from 'react'
import { KITCHEN_CADENCES, KITCHEN_TEMPLATES, templateItems, tempFails, targetLabel, tempOptions } from './templates.js'
import { ALLERGENS, allergenLabel, STATUS_META, statusOf } from './allergens.js'
import { DEFAULT_MATRIX } from './allergens.js'
import { kitchenGetDay, kitchenSaveRun, kitchenAddWaste, kitchenDeleteWaste } from './api.js'
import useIsMobile from '../lib/useIsMobile.js'

const RED = '#DA1B33', GREEN = '#34D399', AMBER = '#F59E0B', BLUE = '#60A5FA'
const CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'

// Merge saved allergen overrides (by dish) over the built-in defaults.
function mergeMatrix(saved) {
  const byDish = {}
  for (const r of DEFAULT_MATRIX) byDish[r.dish] = { ...r }
  for (const r of saved || []) byDish[r.dish] = { dish: r.dish, allergens: r.allergens || {}, notes: r.notes }
  return Object.values(byDish)
}

// Kitchen food-safety checklists — shown in the staff portal to a kitchen-trained
// member on a kitchen shift today. Each run is the shared sheet for (date, cadence).
export default function KitchenChecklists({ token, kitchen }) {
  const [day, setDay] = useState(null)     // { date, runs:{cadence:run}, matrix:[] }
  const [openKey, setOpenKey] = useState(null)
  const [local, setLocal] = useState({})   // key -> { done, issue, value, text, corrective }
  const [busy, setBusy] = useState(false)
  const [showMatrix, setShowMatrix] = useState(false)
  const [waste, setWaste] = useState({ product: '', reason: '', quantity: '' })
  const [savedFlash, setSavedFlash] = useState(null)   // cadence just saved-as-progress (transient ✓)
  const panelRef = useRef(null)
  const isMobile = useIsMobile()

  const date = kitchen?.date
  const load = async () => { try { setDay(await kitchenGetDay(token, date)) } catch (e) { alert(e.message) } }

  // ── Live refresh (20s) — the sheet is SHARED per day, so statuses/ticks from a
  // teammate's phone should appear without leave-and-return. Safety rules:
  //   • a poll requested before your own latest save is discarded (stale guard)
  //   • an open sheet you've STARTED EDITING is never touched (kitchen fields
  //     save on Save/Submit, so a refresh mid-entry would wipe half-typed temps);
  //     an open sheet you're only LOOKING at does live-update.
  const dirtyRef = useRef(false)         // edited since opening the sheet?
  const openKeyRef = useRef(null)
  const lastMutation = useRef(0)
  useEffect(() => { openKeyRef.current = openKey }, [openKey])
  const refresh = async () => {
    const startedAt = Date.now()
    try {
      const d = await kitchenGetDay(token, date)
      if (startedAt < lastMutation.current) return   // our own save is newer — discard
      setDay(d)
      const ok = openKeyRef.current
      if (ok && !dirtyRef.current) setLocal(seedFromRun(d?.runs?.[ok]))   // viewer only — live-merge
    } catch { /* silent — next poll tries again */ }
  }
  useEffect(() => {
    load()
    const id = setInterval(() => { if (!document.hidden) refresh() }, 20000)
    return () => clearInterval(id)
  }, [])   // eslint-disable-line

  // Hydrate local editing state from a saved run's entries.
  const seedFromRun = (run) => {
    const seed = {}
    for (const e of run?.entries || []) {
      seed[e.key] = {
        done: e.type === undefined ? (e.checked && !e.is_fail) : (e.checked && !e.is_fail),
        issue: !!e.is_fail && (e.value_numeric == null),   // a flagged check (not a temp)
        value: e.value_numeric == null ? '' : String(e.value_numeric),
        text: e.value_text || '',
        corrective: e.corrective_action || '',
      }
    }
    return seed
  }
  const openCadence = (k) => {
    setLocal(seedFromRun(day?.runs?.[k]))
    dirtyRef.current = false
    setOpenKey(k)
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  const set = (key, patch) => { dirtyRef.current = true; setLocal(s => ({ ...s, [key]: { ...(s[key] || {}), ...patch } })) }

  // Per-item state → fail? answered?
  const itemFail = (item, e) => {
    if (!e) return false
    if (item.type === 'temp') return tempFails(item.target, e.value)
    if (item.type === 'check') return !!e.issue
    return false
  }
  const itemAnswered = (item, e) => {
    if (item.type === 'text') return true
    if (!e) return false
    if (item.type === 'temp') return e.value !== '' && e.value != null && !Number.isNaN(Number(e.value))
    return !!e.done || !!e.issue
  }

  const buildEntries = (cadence) => templateItems(cadence).map(item => {
    const e = local[item.key] || {}
    const is_fail = itemFail(item, e)
    return {
      key: item.key,
      type: item.type,
      checked: item.type === 'check' ? !!e.done : itemAnswered(item, e),
      value_numeric: item.type === 'temp' && e.value !== '' && e.value != null ? Number(e.value) : null,
      value_text: item.type === 'text' ? (e.text || null) : null,
      is_fail,
      corrective_action: is_fail ? (e.corrective || null) : null,
    }
  })

  const save = async (cadence, submit) => {
    const items = templateItems(cadence)
    if (submit) {
      const unanswered = items.filter(it => !itemAnswered(it, local[it.key]))
      if (unanswered.length) { alert(`Answer every item first — ${unanswered.length} still to do.`); return }
      const needsNote = items.filter(it => itemFail(it, local[it.key]) && !(local[it.key]?.corrective || '').trim())
      if (needsNote.length) { alert(`Add a corrective-action note to each failed check (${needsNote.length}).`); return }
    }
    setBusy(true)
    lastMutation.current = Date.now()
    try {
      await kitchenSaveRun(token, { date, cadence, entries: buildEntries(cadence), submit, shiftId: kitchen?.shiftId })
      lastMutation.current = Date.now()   // saved — polls requested before this are stale
      dirtyRef.current = false            // local sheet now matches the server
      await load()
      if (submit) setOpenKey(null)
      else { setSavedFlash(cadence); setTimeout(() => setSavedFlash(f => (f === cadence ? null : f)), 2600) }
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  const addWaste = async () => {
    const product = waste.product.trim(); if (!product) { alert('What was thrown out?'); return }
    setBusy(true)
    lastMutation.current = Date.now()
    try { await kitchenAddWaste(token, { date, product, reason: waste.reason.trim(), quantity: waste.quantity.trim() }); lastMutation.current = Date.now(); setWaste({ product: '', reason: '', quantity: '' }); await load() }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const delWaste = async (id) => { setBusy(true); lastMutation.current = Date.now(); try { await kitchenDeleteWaste(token, id); lastMutation.current = Date.now(); await load() } catch (e) { alert(e.message) } finally { setBusy(false) } }

  if (!day) return <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, padding: '20px 0' }}>Loading kitchen checklists…</div>

  const matrix = mergeMatrix(day.matrix)
  // A cadence with a `weekday` (Monday deep clean = 1) only shows on that day — but stays
  // visible if a run already exists for it that day (mid-shift resume / back-fill).
  const dow = date ? new Date(date + 'T12:00:00').getDay() : null   // 0 Sun … 1 Mon … 6 Sat
  const cadences = KITCHEN_CADENCES.filter(k => {
    const wd = KITCHEN_TEMPLATES[k].weekday
    return wd == null || dow === wd || !!day.runs?.[k]
  })

  return (
    <div>
      <div className="serif" style={{ fontSize: 18, color: '#fff' }}>🌭 Kitchen — food safety</div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', margin: '3px 0 14px', lineHeight: 1.5 }}>
        Safer Food, Better Business. Complete each sheet on shift — temperatures and critical checks are logged for the EHO, and a failed check pings the manager.
      </div>

      <button onClick={() => setShowMatrix(m => !m)} style={pill(showMatrix)}>🥜 Allergen matrix {showMatrix ? '▲' : '▼'}</button>
      {showMatrix && (isMobile ? <AllergenList matrix={matrix} /> : <AllergenGrid matrix={matrix} />)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        {cadences.map(k => {
          const t = KITCHEN_TEMPLATES[k], run = day.runs?.[k]
          const isGuidance = !!t.guidance
          const done = run?.status === 'completed'
          const failed = !!run?.has_failure
          const inProgress = run && !done
          const status = isGuidance ? { t: 'Guidance', c: BLUE }
            : done ? (failed ? { t: '⚠ Submitted — failure logged', c: RED } : { t: '✓ Submitted', c: GREEN })
            : inProgress ? { t: 'In progress', c: AMBER } : { t: 'Not started', c: 'rgba(255,255,255,0.4)' }
          return (
            <div key={k}>
              <button onClick={() => openKey === k ? setOpenKey(null) : openCadence(k)}
                style={{ width: '100%', textAlign: 'left', background: CARD, border: `1px solid ${openKey === k ? BLUE : LINE}`, borderRadius: 12, padding: '13px 14px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span>
                    <span style={{ fontSize: 14.5, fontWeight: 700 }}>{t.title}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>{t.blurb}</span>
                  </span>
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: status.c, whiteSpace: 'nowrap' }}>{status.t}</span>
              </button>

              {openKey === k && (
                <div ref={panelRef} style={{ border: `1px solid ${LINE}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 14, marginTop: -4, background: 'rgba(255,255,255,0.02)' }}>
                  {t.groups.map(g => (
                    <div key={g.title} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{g.title}</div>
                      {isGuidance ? (
                        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {g.items.map(item => (
                            <li key={item.key} style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>
                              {item.label}{item.type === 'temp' && item.target ? ` — ${targetLabel(item.target)}` : ''}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                          {g.items.map(item => <KitchenItem key={item.key} item={item} e={local[item.key] || {}} set={p => set(item.key, p)} fail={itemFail(item, local[item.key])} />)}
                        </div>
                      )}
                    </div>
                  ))}
                  {!isGuidance && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
                      <button onClick={() => save(k, false)} disabled={busy} style={btn('ghost')}>Save progress</button>
                      <button onClick={() => save(k, true)} disabled={busy} style={btn('red')}>Submit checklist</button>
                      {savedFlash === k && <span style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>✓ Progress saved</span>}
                    </div>
                  )}
                  {!isGuidance && done && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Already submitted — you can update it and submit again.</div>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Stock wastage log — anything binned, with a reason ── */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: '#fff' }}>🗑️ Stock wastage</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '3px 0 10px', lineHeight: 1.5 }}>Log anything thrown out — what it was and why. Keeps a record for ordering & the EHO.</div>
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={waste.product} onChange={e => setWaste(w => ({ ...w, product: e.target.value }))} placeholder="Product — what was thrown out?" style={wInp} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={waste.quantity} onChange={e => setWaste(w => ({ ...w, quantity: e.target.value }))} placeholder="Qty (e.g. 2 kg, 5 buns)" style={{ ...wInp, flex: '0 0 40%' }} />
            <input value={waste.reason} onChange={e => setWaste(w => ({ ...w, reason: e.target.value }))} placeholder="Reason (out of date, dropped, spoiled…)" style={{ ...wInp, flex: 1 }} />
          </div>
          <button onClick={addWaste} disabled={busy || !waste.product.trim()} style={{ ...btn('red'), opacity: waste.product.trim() ? 1 : 0.5 }}>+ Log wastage</button>
        </div>
        {(day.waste || []).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</div>
            {day.waste.map(w => (
              <div key={w.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{w.product}{w.quantity ? <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}> · {w.quantity}</span> : null}</div>
                  {w.reason && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{w.reason}</div>}
                </div>
                <button onClick={() => delWaste(w.id)} disabled={busy} title="Remove" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// One checklist item — check (✓/⚠), temp (°C + live fail), or text.
function KitchenItem({ item, e, set, fail }) {
  const critical = item.critical
  return (
    <div style={{ background: CARD, border: `1px solid ${fail ? RED : LINE}`, borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.4 }}>
          {item.label}
          {critical && <span style={{ fontSize: 9.5, color: RED, fontWeight: 800, marginLeft: 6, verticalAlign: 'middle', letterSpacing: '0.04em' }}>CRITICAL</span>}
          {item.type === 'temp' && <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Target {targetLabel(item.target)}</span>}
        </div>

        {item.type === 'check' && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => set({ done: true, issue: false })} style={toggle(e.done, GREEN)}>✓</button>
            <button onClick={() => set({ done: false, issue: true })} style={toggle(e.issue, RED)}>⚠</button>
          </div>
        )}
        {item.type === 'temp' && (
          <TempField target={item.target} value={e.value} onChange={v => set({ value: v })} fail={fail} />
        )}
      </div>

      {item.type === 'text' && (
        <input type="text" value={e.text ?? ''} onChange={ev => set({ text: ev.target.value })}
          placeholder="Type here…" style={{ width: '100%', marginTop: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${LINE}`, background: '#000', color: '#fff', fontSize: 13 }} />
      )}

      {fail && (
        <div style={{ marginTop: 9 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: RED, marginBottom: 4 }}>⚠ Failed — what did you do about it? (required)</div>
          <input type="text" value={e.corrective ?? ''} onChange={ev => set({ corrective: ev.target.value })}
            placeholder="e.g. moved stock to fridge 2, called engineer, binned affected food…"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${RED}`, background: 'rgba(218,27,51,0.06)', color: '#fff', fontSize: 12.5 }} />
        </div>
      )}
    </div>
  )
}

// Temperature entry — a native <select> "scroller" of sensible preset °C values
// (incl. NEGATIVES, which a phone number-pad can't type — the old typed input made
// the freezer impossible to log and instantly flagged a false fail), PLUS a
// "Type it…" escape that opens a free box accepting a minus for any odd reading.
function TempField({ target, value, onChange, fail }) {
  const opts = tempOptions(target)
  const v = value == null ? '' : String(value)
  const isPreset = v === '' || opts.some(t => String(t) === v)
  const [typing, setTyping] = useState(!isPreset)   // start typing if a saved value isn't a preset
  const box = { padding: '8px 8px', borderRadius: 8, border: `1px solid ${fail ? RED : LINE}`, background: '#000', color: fail ? RED : '#fff', fontSize: 15, fontWeight: 700 }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
      {typing ? (
        <>
          <input type="text" inputMode="text" value={v} placeholder="e.g. -18" autoFocus
            onChange={ev => onChange(sanitizeTempInput(ev.target.value))}
            style={{ ...box, width: 72, textAlign: 'center' }} />
          {opts.length > 0 && (
            <button type="button" onClick={() => { setTyping(false); onChange('') }} title="Back to the picker"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 15, padding: 0 }}>↺</button>
          )}
        </>
      ) : (
        <select value={v} onChange={ev => { if (ev.target.value === '__type__') { setTyping(true); onChange('') } else onChange(ev.target.value) }}
          style={{ ...box, width: 98 }}>
          <option value="">— °C —</option>
          {opts.map(t => <option key={t} value={t}>{t} °C</option>)}
          <option value="__type__">⌨︎ Type it…</option>
        </select>
      )}
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>°C</span>
    </div>
  )
}
// Keep only a leading minus, digits, and one decimal point while typing a temp.
function sanitizeTempInput(s) {
  let out = String(s).replace(/[^0-9.\-]/g, '')
  const neg = out.startsWith('-')
  out = out.replace(/-/g, '')
  const parts = out.split('.')
  out = parts.shift() + (parts.length ? '.' + parts.join('') : '')
  return (neg ? '-' : '') + out
}

// Read-only allergen grid for staff to check an allergy order against.
function AllergenGrid({ matrix }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 10, border: `1px solid ${LINE}`, borderRadius: 12 }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 11.5, minWidth: 640 }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: 'left', position: 'sticky', left: 0, background: '#111' }}>Dish</th>
            {ALLERGENS.map(a => <th key={a.key} style={th}>{a.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.map(row => (
            <tr key={row.dish}>
              <td style={{ ...td, textAlign: 'left', fontWeight: 700, color: '#fff', position: 'sticky', left: 0, background: '#0d0d0d', whiteSpace: 'nowrap' }}>{row.dish}</td>
              {ALLERGENS.map(a => {
                const st = statusOf(row.allergens?.[a.key]); const m = STATUS_META[st]
                return <td key={a.key} style={{ ...td, color: m.color, fontWeight: 800, fontSize: 14 }} title={`${allergenLabel(a.key)}: ${m.label}`}>{m.symbol}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '8px 12px', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
        <span><b style={{ color: RED }}>●</b> Contains</span>
        <span><b style={{ color: AMBER }}>○</b> May contain / cross-contact</span>
        <span><b style={{ color: BLUE }}>⧗</b> Checking</span>
      </div>
    </div>
  )
}

// Phone-friendly allergen view — one card per dish listing ONLY the allergens that
// apply, so nothing runs off the side of the screen (the full grid needs horizontal
// scroll on a phone). Grouped Contains ● / May contain ○ / Checking ⧗.
function AllergenList({ matrix }) {
  const group = (row, status) => ALLERGENS.filter(a => statusOf(row.allergens?.[a.key]) === status).map(a => a.label)
  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {matrix.map(row => {
        const contains = group(row, 'contains'), trace = group(row, 'trace'), pending = group(row, 'pending')
        const none = !contains.length && !trace.length && !pending.length
        return (
          <div key={row.dish} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', marginBottom: none ? 0 : 6 }}>{row.dish}</div>
            {contains.length > 0 && <AllergenRow color={RED} sym="●" label="Contains" items={contains} />}
            {trace.length > 0 && <AllergenRow color={AMBER} sym="○" label="May contain" items={trace} />}
            {pending.length > 0 && <AllergenRow color={BLUE} sym="⧗" label="Checking" items={pending} />}
            {none && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>No listed allergens.</div>}
          </div>
        )
      })}
    </div>
  )
}
function AllergenRow({ color, sym, label, items }) {
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 12, lineHeight: 1.5, marginTop: 2 }}>
      <span style={{ color, fontWeight: 800, flexShrink: 0 }}>{sym}</span>
      <span style={{ color: 'rgba(255,255,255,0.85)' }}><strong style={{ color }}>{label}:</strong> {items.join(', ')}</span>
    </div>
  )
}

const th = { padding: '8px 7px', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontWeight: 700, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap' }
const td = { padding: '7px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }
const pill = (on) => ({ padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, background: on ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? BLUE : LINE}`, color: on ? '#fff' : 'rgba(255,255,255,0.8)' })
const wInp = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${LINE}`, background: '#000', color: '#fff', fontSize: 14, outline: 'none' }
const toggle = (on, color) => ({ width: 38, height: 38, borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 800, background: on ? color : 'rgba(255,255,255,0.05)', border: `1px solid ${on ? color : LINE}`, color: on ? '#000' : 'rgba(255,255,255,0.6)' })
const btn = (kind) => {
  const base = { padding: '10px 16px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, border: '1px solid transparent' }
  if (kind === 'red') return { ...base, background: RED, color: '#fff' }
  return { ...base, background: 'rgba(255,255,255,0.05)', color: '#fff', border: `1px solid ${LINE}` }
}
