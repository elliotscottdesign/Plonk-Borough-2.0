import React, { useState, useEffect } from 'react'
import { KITCHEN_CADENCES, KITCHEN_TEMPLATES } from '../../kitchen/templates.js'
import { CHECKLIST_ORDER, CHECKLISTS } from '../../rota/checklists.js'
import { useChecklistOverrides, effectiveKitchen, effectiveShift, saveChecklistDef, resetChecklistDef, fetchChecklistOverrides } from '../../lib/liveChecklists.js'

// ─── Checklist Editor (founder) ──────────────────────────────────────────────
// Add / edit / reorder / delete lines on ANY checklist — the kitchen food-safety
// sheets and the bar shift lists — without a code change. Saves an override per
// checklist; a checklist with no override uses the built-in default (and "Reset"
// removes the override to go back to it). Edits show live in the staff portal.

const GOLD = '#C9A84C', GREEN = '#34D399', RED = '#DA1B33', BLUE = '#60A5FA'
const CREAM = 'rgba(255,255,255,0.9)', DIM = 'rgba(255,255,255,0.55)'
const CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.14)'
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]   // Mon → Sun

const clone = (x) => JSON.parse(JSON.stringify(x))
const genKey = (base) => `${base}.c${Date.now().toString(36)}${Math.floor(Math.random() * 10000)}`

function buildDraft(system, key, ov) {
  const src = system === 'kitchen' ? effectiveKitchen(ov) : effectiveShift(ov)
  const def = clone(src[key])
  const common = { system, key, orig: def, title: def.title || '', icon: def.icon || '', blurb: def.blurb || '' }
  if (system === 'kitchen') return { ...common, mode: 'kitchen', groups: def.groups || [] }
  if (def.byWeekday) {
    const bw = {}; for (const d of WEEK_ORDER) bw[d] = (def.byWeekday[d] || []).slice()
    return { ...common, mode: 'weekday', byWeekday: bw }
  }
  return { ...common, mode: 'sections', groups: def.sections || [] }
}

function draftToDef(d) {
  const base = { ...d.orig, title: d.title.trim(), icon: d.icon.trim(), blurb: d.blurb.trim() }
  if (d.mode === 'kitchen') {
    base.groups = d.groups.map(g => ({
      title: g.title.trim(),
      items: g.items.filter(it => (it.label || '').trim()).map(it => {
        const o = { key: it.key || genKey(d.key), label: it.label.trim(), type: it.type || 'check' }
        if (it.critical) o.critical = true
        if (o.type === 'temp') {
          const t = { unit: 'C' }
          if (it.target && it.target.min !== '' && it.target.min != null) t.min = Number(it.target.min)
          if (it.target && it.target.max !== '' && it.target.max != null) t.max = Number(it.target.max)
          o.target = t
        }
        return o
      }),
    }))
    return base
  }
  if (d.mode === 'weekday') {
    const bw = {}; for (const day of WEEK_ORDER) bw[day] = (d.byWeekday[day] || []).map(s => s.trim()).filter(Boolean)
    base.byWeekday = bw; delete base.sections
    return base
  }
  base.sections = d.groups.map(g => ({ title: g.title.trim(), items: g.items.map(s => s.trim()).filter(Boolean) }))
  delete base.byWeekday
  return base
}

export default function ChecklistEditor() {
  const hookOv = useChecklistOverrides()
  const [ov, setOv] = useState(null)
  useEffect(() => { if (hookOv) setOv(hookOv) }, [hookOv])
  const [system, setSystem] = useState('shift')
  const [key, setKey] = useState(null)
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const keys = system === 'kitchen' ? KITCHEN_CADENCES : CHECKLIST_ORDER
  const base = system === 'kitchen' ? KITCHEN_TEMPLATES : CHECKLISTS
  const overridden = (sys, k) => !!(ov && ov[sys] && ov[sys][k])

  const pick = (sys, k) => {
    if (!ov) return
    setSystem(sys); setKey(k); setMsg('')
    setDraft(buildDraft(sys, k, ov))
  }
  const switchSystem = (sys) => { setSystem(sys); setKey(null); setDraft(null); setMsg('') }

  // Immutable edit: clone the draft, mutate the clone, store it.
  const edit = (fn) => setDraft(d => { const n = clone(d); fn(n); return n })

  const save = async () => {
    setBusy(true); setMsg('')
    try {
      await saveChecklistDef(draft.system, draft.key, draftToDef(draft), 'founder')
      setOv(await fetchChecklistOverrides())
      setMsg('Saved — staff see this now.')
    } catch (e) { setMsg(e.message || 'Could not save') } finally { setBusy(false) }
  }
  const reset = async () => {
    if (!window.confirm('Reset this checklist back to the built-in default? Your edits to it will be removed.')) return
    setBusy(true); setMsg('')
    try {
      await resetChecklistDef(draft.system, draft.key)
      const o = await fetchChecklistOverrides(); setOv(o)
      setDraft(buildDraft(draft.system, draft.key, o))
      setMsg('Reset to the built-in default.')
    } catch (e) { setMsg(e.message || 'Could not reset') } finally { setBusy(false) }
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="serif" style={{ fontSize: 22, color: GOLD, margin: '0 0 4px' }}>✏️ Checklist Editor</div>
      <p style={{ color: DIM, fontSize: 13, lineHeight: 1.6, margin: '0 0 14px' }}>
        Add, edit, reorder or delete any line on any checklist. Changes save straight to the staff portal —
        no app update needed. Nothing changes until you edit and save; “Reset” puts a checklist back to the original.
      </p>

      {/* System toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['shift', '🍸 Bar / venue lists'], ['kitchen', '🌭 Kitchen food-safety']].map(([s, l]) => (
          <button key={s} onClick={() => switchSystem(s)} style={tab(system === s)}>{l}</button>
        ))}
      </div>

      {/* Checklist picker */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {keys.map(k => (
          <button key={k} onClick={() => pick(system, k)} disabled={!ov} style={chip(key === k, overridden(system, k))}>
            {(base[k]?.icon || '📋')} {base[k]?.title || k}{overridden(system, k) ? ' •' : ''}
          </button>
        ))}
      </div>
      {!ov && <div style={{ color: DIM, fontSize: 13 }}>Loading…</div>}

      {draft && (
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: 16, background: 'rgba(255,255,255,0.02)' }}>
          {/* Header fields */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input value={draft.icon} onChange={e => edit(d => { d.icon = e.target.value })} placeholder="icon" style={{ ...inp, width: 54, textAlign: 'center' }} />
            <input value={draft.title} onChange={e => edit(d => { d.title = e.target.value })} placeholder="Checklist title" style={{ ...inp, flex: 1, fontWeight: 700 }} />
          </div>
          <input value={draft.blurb} onChange={e => edit(d => { d.blurb = e.target.value })} placeholder="Short description (optional)" style={{ ...inp, width: '100%', marginBottom: 16 }} />

          {draft.mode === 'weekday'
            ? <WeekdayEditor draft={draft} edit={edit} />
            : <GroupsEditor draft={draft} edit={edit} kitchen={draft.mode === 'kitchen'} />}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={save} disabled={busy} style={btn('gold')}>{busy ? 'Saving…' : '💾 Save changes'}</button>
            <button onClick={reset} disabled={busy || !overridden(draft.system, draft.key)} style={btn('ghost')}>↺ Reset to default</button>
            {msg && <span style={{ fontSize: 12.5, color: msg.startsWith('Could') ? '#F87171' : GREEN }}>{msg}</span>}
          </div>
          {draft.system === 'shift' && (
            <p style={{ color: DIM, fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>
              Tip: on the bar lists, each line’s wording is its identity — renaming a line starts it fresh
              (older tick history stays under the old wording).
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Groups of items — kitchen (rich items) or shift sections (plain lines).
function GroupsEditor({ draft, edit, kitchen }) {
  const groups = draft.groups || []
  const moveGroup = (gi, dir) => edit(d => { const a = d.groups; const j = gi + dir; if (j < 0 || j >= a.length) return;[a[gi], a[j]] = [a[j], a[gi]] })
  const addGroup = () => edit(d => { d.groups.push({ title: 'New section', items: [] }) })
  const delGroup = (gi) => edit(d => { d.groups.splice(gi, 1) })
  const addItem = (gi) => edit(d => { d.groups[gi].items.push(kitchen ? { key: '', label: '', type: 'check' } : '') })
  const delItem = (gi, ii) => edit(d => { d.groups[gi].items.splice(ii, 1) })
  const moveItem = (gi, ii, dir) => edit(d => { const a = d.groups[gi].items; const j = ii + dir; if (j < 0 || j >= a.length) return;[a[ii], a[j]] = [a[j], a[ii]] })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {groups.map((g, gi) => (
        <div key={gi} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, background: CARD }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
            <input value={g.title} onChange={e => edit(d => { d.groups[gi].title = e.target.value })} placeholder="Section heading" style={{ ...inp, flex: 1, color: BLUE, fontWeight: 700 }} />
            <MoveBtns onUp={() => moveGroup(gi, -1)} onDown={() => moveGroup(gi, 1)} />
            <button onClick={() => delGroup(gi)} title="Delete section" style={xBtn}>🗑️</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {g.items.map((it, ii) => kitchen
              ? <KitchenItemRow key={ii} it={it} edit={edit} gi={gi} ii={ii} onDel={() => delItem(gi, ii)} onUp={() => moveItem(gi, ii, -1)} onDown={() => moveItem(gi, ii, 1)} />
              : (
                <div key={ii} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input value={it} onChange={e => edit(d => { d.groups[gi].items[ii] = e.target.value })} placeholder="Task wording" style={{ ...inp, flex: 1 }} />
                  <MoveBtns onUp={() => moveItem(gi, ii, -1)} onDown={() => moveItem(gi, ii, 1)} />
                  <button onClick={() => delItem(gi, ii)} title="Delete line" style={xBtn}>✕</button>
                </div>
              ))}
            <button onClick={() => addItem(gi)} style={addBtn}>＋ Add line</button>
          </div>
        </div>
      ))}
      <button onClick={addGroup} style={{ ...addBtn, alignSelf: 'flex-start' }}>＋ Add section</button>
    </div>
  )
}

// Kitchen item — label + type + critical + temp target.
function KitchenItemRow({ it, edit, gi, ii, onDel, onUp, onDown }) {
  const set = (patch) => edit(d => { Object.assign(d.groups[gi].items[ii], patch) })
  const setTarget = (which, val) => edit(d => { const item = d.groups[gi].items[ii]; item.target = { ...(item.target || {}), unit: 'C', [which]: val } })
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: 8, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input value={it.label} onChange={e => set({ label: e.target.value })} placeholder="Item wording" style={{ ...inp, flex: 1 }} />
        <MoveBtns onUp={onUp} onDown={onDown} />
        <button onClick={onDel} title="Delete line" style={xBtn}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
        <select value={it.type || 'check'} onChange={e => set({ type: e.target.value })} style={{ ...inp, width: 'auto', padding: '6px 8px' }}>
          <option value="check">☐ Tick</option>
          <option value="temp">🌡️ Temperature</option>
          <option value="text">✎ Note</option>
        </select>
        <label style={{ fontSize: 12, color: CREAM, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!it.critical} onChange={e => set({ critical: e.target.checked })} /> Critical
        </label>
        {it.type === 'temp' && (
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: DIM }}>
            target
            <input value={it.target?.min ?? ''} onChange={e => setTarget('min', e.target.value)} placeholder="min" inputMode="numeric" style={{ ...inp, width: 60, padding: '6px 8px' }} />
            <input value={it.target?.max ?? ''} onChange={e => setTarget('max', e.target.value)} placeholder="max" inputMode="numeric" style={{ ...inp, width: 60, padding: '6px 8px' }} />
            °C
          </span>
        )}
      </div>
    </div>
  )
}

// FOH-style checklist whose tasks change by weekday.
function WeekdayEditor({ draft, edit }) {
  const bw = draft.byWeekday
  const add = (day) => edit(d => { d.byWeekday[day].push('') })
  const del = (day, ii) => edit(d => { d.byWeekday[day].splice(ii, 1) })
  const move = (day, ii, dir) => edit(d => { const a = d.byWeekday[day]; const j = ii + dir; if (j < 0 || j >= a.length) return;[a[ii], a[j]] = [a[j], a[ii]] })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {WEEK_ORDER.map(day => (
        <div key={day} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, background: CARD }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{DAY_NAMES[day]}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(bw[day] || []).map((it, ii) => (
              <div key={ii} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={it} onChange={e => edit(d => { d.byWeekday[day][ii] = e.target.value })} placeholder="Task wording" style={{ ...inp, flex: 1 }} />
                <MoveBtns onUp={() => move(day, ii, -1)} onDown={() => move(day, ii, 1)} />
                <button onClick={() => del(day, ii)} title="Delete line" style={xBtn}>✕</button>
              </div>
            ))}
            <button onClick={() => add(day)} style={addBtn}>＋ Add task</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function MoveBtns({ onUp, onDown }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <button onClick={onUp} title="Move up" style={moveBtn}>▲</button>
      <button onClick={onDown} title="Move down" style={moveBtn}>▼</button>
    </span>
  )
}

const inp = { padding: '9px 10px', borderRadius: 8, border: `1px solid ${LINE}`, background: '#000', color: '#fff', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }
const tab = (on) => ({ padding: '9px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: on ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.04)', border: `2px solid ${on ? GOLD : LINE}`, color: on ? GOLD : CREAM })
const chip = (on, over) => ({ padding: '7px 11px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, background: on ? 'rgba(96,165,250,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? BLUE : over ? 'rgba(201,168,76,0.5)' : LINE}`, color: on ? '#fff' : CREAM })
const moveBtn = { width: 24, height: 17, lineHeight: '15px', fontSize: 9, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`, borderRadius: 4, color: DIM, padding: 0 }
const xBtn = { width: 30, height: 34, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`, borderRadius: 7, color: '#F87171', fontSize: 13 }
const addBtn = { padding: '8px 12px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: `1px dashed ${LINE}`, borderRadius: 8, color: CREAM, fontSize: 12.5, fontWeight: 600 }
const btn = (kind) => {
  const b = { padding: '11px 18px', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, border: '1px solid transparent' }
  if (kind === 'gold') return { ...b, background: GOLD, color: '#0A0A0F' }
  return { ...b, background: 'rgba(255,255,255,0.05)', color: '#fff', border: `1px solid ${LINE}` }
}
