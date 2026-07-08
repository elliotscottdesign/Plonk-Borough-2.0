import React, { useState, useRef } from 'react'
import { fmtMin, dayName } from '../../rota/shifts.js'

// ─── Day roster grid (founder) ───────────────────────────────────────────────
// Hour-by-hour, 30-minute slots, one row per staff member. The founder drags to
// paint each person's shift for the day; the block's right edge drags to trim/
// extend on 30-min steps; ✕ removes it. "Save" replaces the whole day's roster
// (each block = one person's shift). Blocks are colour-coded by role.
//
// Timeline is a fixed 10:00 → 02:00 (next day) window, so times are stored as
// MINUTES FROM THE DATE'S MIDNIGHT (next-day > 1440), matching staff_shifts.

const WIN_START = 600, WIN_END = 1560, SLOT = 30      // 10:00 … 02:00, 30-min slots
const N_SLOTS = (WIN_END - WIN_START) / SLOT          // 32
const SLOT_W = 26, ROW_H = 40, NAME_W = 134

const ROLE_COLOR = { 'Manager': '#A855F7', 'Asst. Manager': '#3B82F6', 'Supervisor': '#22D3EE', 'Bar Staff': '#34D399' }
const roleColor = (role) => ROLE_COLOR[role] || '#9CA3AF'

const minOfSlot = (slot) => WIN_START + slot * SLOT
const xOfMin = (m) => ((m - WIN_START) / SLOT) * SLOT_W
const clampSlot = (s) => Math.max(0, Math.min(N_SLOTS, s))

let _uid = 0
const uid = () => `b${++_uid}`

// Merge overlapping / touching blocks per staff so a row never has two that collide.
function mergeBlocks(blocks) {
  const byStaff = {}
  for (const b of blocks) (byStaff[b.staffId] ||= []).push(b)
  const out = []
  for (const staffId of Object.keys(byStaff)) {
    const arr = byStaff[staffId].slice().sort((a, b) => a.start - b.start)
    let cur = null
    for (const b of arr) {
      if (cur && b.start <= cur.end) cur.end = Math.max(cur.end, b.end)
      else { cur = { key: uid(), staffId, start: b.start, end: b.end }; out.push(cur) }
    }
  }
  return out
}

export default function DayRosterGrid({ date, staff, dayShifts, dayClaims, onSave, busy }) {
  const rows = staff.filter(s => s.active !== false)
  const shiftById = {}
  for (const s of dayShifts) shiftById[s.id] = s

  const [blocks, setBlocks] = useState(() => {
    const bl = []
    for (const c of dayClaims) {
      const sh = shiftById[c.shift_id]
      if (!sh) continue
      const start = Math.max(WIN_START, sh.start_min), end = Math.min(WIN_END, sh.end_min)
      if (end - start >= 30) bl.push({ key: uid(), staffId: c.staff_id, start, end })   // skip anything not inside the 10am–2am window
    }
    return mergeBlocks(bl)
  })
  const [dirty, setDirty] = useState(false)
  const [drag, setDrag] = useState(null)   // { staffId, mode:'paint'|'resize', anchor, cur, key, startSlot }
  const [saving, setSaving] = useState(false)
  const trackRefs = useRef({})

  const edit = (fn) => { setBlocks(fn); setDirty(true) }

  const slotAt = (staffId, clientX) => {
    const rect = trackRefs.current[staffId].getBoundingClientRect()
    return clampSlot(Math.round((clientX - rect.left) / SLOT_W))
  }

  const onDown = (e, staffId) => {
    if (busy || saving) return
    e.preventDefault()
    const rect = trackRefs.current[staffId].getBoundingClientRect()
    const slot = Math.max(0, Math.min(N_SLOTS - 1, Math.floor((e.clientX - rect.left) / SLOT_W)))
    try { trackRefs.current[staffId].setPointerCapture(e.pointerId) } catch { /* older browsers */ }
    setDrag({ staffId, mode: 'paint', anchor: slot, cur: slot + 1, pointerId: e.pointerId })
  }
  const onMove = (e) => {
    if (!drag) return
    const slot = slotAt(drag.staffId, e.clientX)
    if (drag.mode === 'paint') setDrag(d => ({ ...d, cur: slot }))
    else if (drag.mode === 'resize') {
      const end = Math.max(drag.startSlot + 1, slot)
      edit(bs => bs.map(b => b.key === drag.key ? { ...b, end: minOfSlot(end) } : b))
    }
  }
  const onUp = () => {
    if (!drag) return
    if (drag.mode === 'paint') {
      const lo = Math.min(drag.anchor, drag.cur), hi = Math.max(drag.anchor + 1, drag.cur)
      edit(bs => mergeBlocks([...bs, { key: uid(), staffId: drag.staffId, start: minOfSlot(lo), end: minOfSlot(hi) }]))
    }
    setDrag(null)
  }
  const startResize = (e, block) => {
    if (busy || saving) return
    e.stopPropagation(); e.preventDefault()
    try { trackRefs.current[block.staffId].setPointerCapture(e.pointerId) } catch { /* ignore */ }
    setDrag({ staffId: block.staffId, mode: 'resize', key: block.key, startSlot: (block.start - WIN_START) / SLOT, pointerId: e.pointerId })
  }
  const removeBlock = (key) => edit(bs => bs.filter(b => b.key !== key))
  const clearAll = () => { if (blocks.length && !window.confirm('Clear everyone off this day?')) return; setBlocks([]); setDirty(true) }

  const doSave = async () => {
    setSaving(true)
    try { await onSave(blocks.map(b => ({ staffId: b.staffId, start_min: b.start, end_min: b.end }))); setDirty(false) }
    catch (e) { alert(e.message || 'Could not save the roster.') } finally { setSaving(false) }
  }

  const blocksByStaff = {}
  for (const b of blocks) (blocksByStaff[b.staffId] ||= []).push(b)
  const workingCount = Object.keys(blocksByStaff).length
  const totalHours = Math.round(blocks.reduce((a, b) => a + (b.end - b.start) / 60, 0) * 10) / 10

  const hourTicks = []
  for (let s = 0; s <= N_SLOTS; s += 2) hourTicks.push(s)   // every hour

  const trackW = N_SLOTS * SLOT_W
  const gridBg = `repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px ${SLOT_W}px), repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 1px, transparent 1px ${SLOT_W * 2}px)`

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
          Drag across a person's row to add their shift · drag the right edge to trim · ✕ to remove.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}><strong style={{ color: '#fff' }}>{workingCount}</strong> working · <strong style={{ color: '#fff' }}>{totalHours}h</strong></span>
          {blocks.length > 0 && <button onClick={clearAll} disabled={busy || saving} style={btn('ghost')}>Clear day</button>}
          <button onClick={doSave} disabled={busy || saving || !dirty} style={{ ...btn('gold'), opacity: dirty ? 1 : 0.5 }}>{saving ? 'Saving…' : dirty ? 'Save roster' : 'Saved ✓'}</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, background: '#000' }}>
        <div style={{ minWidth: NAME_W + trackW }}>
          {/* Hour header */}
          <div style={{ display: 'flex', position: 'sticky', top: 0, background: '#0A0A0A', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ width: NAME_W, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.12)' }} />
            <div style={{ position: 'relative', height: 22, width: trackW }}>
              {hourTicks.map(s => (
                <div key={s} style={{ position: 'absolute', left: s * SLOT_W, top: 4, fontSize: 9.5, color: 'rgba(255,255,255,0.5)', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>{fmtMin(minOfSlot(s))}</div>
              ))}
            </div>
          </div>

          {rows.length === 0 && <div style={{ padding: 20, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>No active team members yet — add them in the Team tab.</div>}

          {rows.map((s, ri) => {
            const rc = roleColor(s.role)
            const mine = blocksByStaff[s.id] || []
            const drafting = drag && drag.mode === 'paint' && drag.staffId === s.id
              ? { lo: Math.min(drag.anchor, drag.cur), hi: Math.max(drag.anchor + 1, drag.cur) } : null
            return (
              <div key={s.id} style={{ display: 'flex', height: ROW_H, borderBottom: ri === rows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: NAME_W, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '0 8px', borderRight: '1px solid rgba(255,255,255,0.12)', borderLeft: `3px solid ${rc}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: rc, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(s.name || 'Unnamed').split(' ')[0]}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.role || '—'}</div>
                  </div>
                </div>
                <div
                  ref={el => { trackRefs.current[s.id] = el }}
                  onPointerDown={e => onDown(e, s.id)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
                  style={{ position: 'relative', width: trackW, height: ROW_H, backgroundImage: gridBg, cursor: busy || saving ? 'default' : 'crosshair', touchAction: 'none' }}
                >
                  {drafting && drafting.hi > drafting.lo && (
                    <div style={{ position: 'absolute', top: 5, height: ROW_H - 10, left: drafting.lo * SLOT_W, width: (drafting.hi - drafting.lo) * SLOT_W, background: `${rc}55`, border: `1px dashed ${rc}`, borderRadius: 6 }} />
                  )}
                  {mine.map(b => {
                    const left = xOfMin(b.start), w = xOfMin(b.end) - xOfMin(b.start)
                    return (
                      <div key={b.key} style={{ position: 'absolute', top: 5, height: ROW_H - 10, left, width: w, background: `${rc}33`, border: `1.5px solid ${rc}`, borderRadius: 6, display: 'flex', alignItems: 'center', overflow: 'visible' }}>
                        {/* ✕ on the LEFT so it never overlaps the right-edge resize handle */}
                        <button onPointerDown={e => e.stopPropagation()} onClick={() => removeBlock(b.key)} title="Remove" style={{ position: 'absolute', top: -6, left: -6, zIndex: 3, width: 16, height: 16, borderRadius: '50%', background: '#DA1B33', border: '1px solid #000', color: '#fff', fontSize: 9, lineHeight: 1, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        <span style={{ fontSize: 9.5, color: '#fff', fontWeight: 600, padding: '0 10px 0 5px', whiteSpace: 'nowrap', pointerEvents: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmtMin(b.start)}–{fmtMin(b.end)}</span>
                        {/* right-edge resize handle */}
                        <div onPointerDown={e => startResize(e, b)} title="Drag to trim/extend" style={{ position: 'absolute', top: 0, right: 0, zIndex: 1, width: 9, height: '100%', cursor: 'ew-resize', background: `${rc}`, opacity: 0.55, borderTopRightRadius: 5, borderBottomRightRadius: 5 }} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Role colour legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10, fontSize: 10.5, color: 'rgba(255,255,255,0.55)' }}>
        {Object.entries(ROLE_COLOR).map(([role, col]) => (
          <span key={role} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: col }} />{role}</span>
        ))}
      </div>
    </div>
  )
}

const btn = (kind) => {
  const base = { padding: '7px 13px', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: '#DA1B33', color: '#fff' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }
}
