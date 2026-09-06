import React, { useState, useRef, useMemo } from 'react'
import { fmtMin, dayName } from '../../rota/shifts.js'
import useIsMobile from '../../lib/useIsMobile.js'
import { availabilityIndex, availabilityStatus } from '../../rota/availability.js'

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

const ROLE_COLOR = { 'Manager': '#A855F7', 'Asst. Manager': '#3B82F6', 'Supervisor': '#22D3EE', 'Bar Staff': '#34D399', 'Kitchen / Barback': '#FB923C' }
const roleColor = (role) => ROLE_COLOR[role] || '#9CA3AF'
// Row order — house stacking rule (same as the week overview + AI Builder):
// Managers → Kitchen → Bar. Kitchen = the kitchen role OR anyone kitchen-trained;
// Supervisor leads the bar group; alphabetical within each.
const roleRank = (s) => {
  const role = s?.role
  if (role === 'Manager') return 0
  if (role === 'Asst. Manager') return 1
  if (role === 'Kitchen / Barback' || (s?.abilities || []).includes('kitchen')) return 2
  if (role === 'Supervisor') return 3
  return 4
}

const minOfSlot = (slot) => WIN_START + slot * SLOT
const xOfMin = (m) => ((m - WIN_START) / SLOT) * SLOT_W
const clampSlot = (s) => Math.max(0, Math.min(N_SLOTS, s))

// Selectable times for the phone editor — every 30 min across the window.
const TIME_OPTS = []
for (let _m = WIN_START; _m <= WIN_END; _m += SLOT) TIME_OPTS.push({ min: _m, label: fmtMin(_m) })
const selStyle = { fontSize: 14, padding: '9px 10px', borderRadius: 8, background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.22)', outline: 'none' }

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

export default function DayRosterGrid({ date, staff, dayShifts, dayClaims, onSave, busy, availability = [], restWindows = {}, minRestHours = null }) {
  const rows = staff.filter(s => s.active !== false)
    .sort((a, b) => roleRank(a) - roleRank(b) || String(a.name || '').localeCompare(String(b.name || '')))
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

  // Availability — the rota builder and each staffer's "Availability" tab now
  // talk to each other: everyone's available by default, and anyone who marked
  // THIS day off is flagged red and can't have a shift dropped on them by
  // accident. "Book anyway" (tap the flag) overrides it for the odd case where
  // you've cleared it with them. Nothing here removes an existing shift — a day
  // someone's already booked on still shows their shift, just with the flag.
  const avIdx = useMemo(() => availabilityIndex(availability), [availability])
  const [override, setOverride] = useState(() => new Set())
  const avOf = (id) => availabilityStatus(avIdx, id, date)          // 'available' | 'unavailable'
  const blockedFor = (id) => avOf(id) === 'unavailable' && !override.has(id)
  const toggleOverride = (id) => setOverride(o => { const n = new Set(o); n.has(id) ? n.delete(id) : n.add(id); return n })

  const edit = (fn) => { setBlocks(fn); setDirty(true) }

  const mobile = useIsMobile()

  // Phone editor: one shift per person via dropdowns. No finger-drag — on touch
  // it hijacked the page scroll and created shifts by accident. Tap "+ Add
  // shift" to create; pick Start/End; ✕ to remove.
  const setShift = (staffId, start, end) => {
    if (end <= start) end = Math.min(WIN_END, start + SLOT)
    edit(bs => [...bs.filter(b => b.staffId !== staffId), { key: uid(), staffId, start, end }])
  }
  const addShift = (staffId) => { if (blockedFor(staffId)) return; setShift(staffId, 1080, 1380) }   // default 6pm–11pm; adjust with the pickers
  const removeShift = (staffId) => edit(bs => bs.filter(b => b.staffId !== staffId))

  const slotAt = (staffId, clientX) => {
    const rect = trackRefs.current[staffId].getBoundingClientRect()
    return clampSlot(Math.round((clientX - rect.left) / SLOT_W))
  }

  const onDown = (e, staffId) => {
    if (busy || saving || blockedFor(staffId)) return
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
      if (drag.edge === 'l') {   // drag the LEFT edge — moves the start time
        const start = Math.min(drag.fixedSlot - 1, Math.max(0, slot))
        edit(bs => bs.map(b => b.key === drag.key ? { ...b, start: minOfSlot(start) } : b))
      } else {                   // drag the RIGHT edge — moves the end time
        const end = Math.max(drag.fixedSlot + 1, slot)
        edit(bs => bs.map(b => b.key === drag.key ? { ...b, end: minOfSlot(end) } : b))
      }
    }
  }
  const onUp = () => {
    if (!drag) return
    if (drag.mode === 'paint') {
      const lo = Math.min(drag.anchor, drag.cur), hi = Math.max(drag.anchor + 1, drag.cur)
      edit(bs => mergeBlocks([...bs, { key: uid(), staffId: drag.staffId, start: minOfSlot(lo), end: minOfSlot(hi) }]))
    } else if (drag.mode === 'resize') {
      edit(bs => mergeBlocks(bs))   // tidy any overlaps a resize created
    }
    setDrag(null)
  }
  const startResize = (e, block, edge) => {
    if (busy || saving) return
    e.stopPropagation(); e.preventDefault()
    try { trackRefs.current[block.staffId].setPointerCapture(e.pointerId) } catch { /* ignore */ }
    // 'l' fixes the end slot (drag start); 'r' fixes the start slot (drag end).
    const startSlot = (block.start - WIN_START) / SLOT, endSlot = (block.end - WIN_START) / SLOT
    setDrag({ staffId: block.staffId, mode: 'resize', key: block.key, edge, fixedSlot: edge === 'l' ? endSlot : startSlot, pointerId: e.pointerId })
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
          {mobile
            ? 'Tap + Add shift, then set the start & end times. Save when done.'
            : "Drag across a person's row to add their shift · drag the right edge to trim · ✕ to remove."}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}><strong style={{ color: '#fff' }}>{workingCount}</strong> working · <strong style={{ color: '#fff' }}>{totalHours}h</strong></span>
          {blocks.length > 0 && <button onClick={clearAll} disabled={busy || saving} style={btn('ghost')}>Clear day</button>}
          <button onClick={doSave} disabled={busy || saving || !dirty} style={{ ...btn('gold'), opacity: dirty ? 1 : 0.5 }}>{saving ? 'Saving…' : dirty ? 'Save roster' : 'Saved ✓'}</button>
        </div>
      </div>

      {mobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.length === 0 && <div style={{ padding: 20, fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}>No active team members yet — add them in the Team tab.</div>}
          {rows.map(s => {
            const rc = roleColor(s.role)
            const bl = blocksByStaff[s.id] || []
            const sh = bl.length ? { start: Math.min(...bl.map(b => b.start)), end: Math.max(...bl.map(b => b.end)) } : null
            const hrs = sh ? Math.round((sh.end - sh.start) / 60 * 10) / 10 : 0
            const off = avOf(s.id) === 'unavailable'
            const overridden = override.has(s.id)
            const blk = off && !overridden
            return (
              <div key={s.id} style={{ background: '#13131A', border: `1px solid ${blk ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.1)'}`, borderLeft: `3px solid ${rc}`, borderRadius: 10, padding: '11px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: off ? 8 : 10 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: rc, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: off ? (overridden ? '#FBBF24' : '#F87171') : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(s.name || 'Unnamed').split(' ')[0]}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{s.role || '—'}</div>
                  </div>
                  {sh && <span style={{ fontSize: 13, fontWeight: 700, color: rc }}>{hrs}h</span>}
                </div>
                {off && (
                  <button onClick={() => toggleOverride(s.id)} style={{ width: '100%', textAlign: 'left', marginBottom: 10, padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: overridden ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${overridden ? 'rgba(251,191,36,0.5)' : 'rgba(248,113,113,0.5)'}`, color: overridden ? '#FBBF24' : '#F87171' }}>
                    {overridden ? '⚠️ Booking despite being marked off — tap to re-block' : '🚫 Marked unavailable this day — tap to book anyway'}
                  </button>
                )}
                {sh ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select value={sh.start} onChange={e => setShift(s.id, Number(e.target.value), sh.end)} disabled={busy || saving} style={selStyle}>
                      {TIME_OPTS.filter(o => o.min < WIN_END).map(o => <option key={o.min} value={o.min}>{o.label}</option>)}
                    </select>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, flexShrink: 0 }}>to</span>
                    <select value={sh.end} onChange={e => setShift(s.id, sh.start, Number(e.target.value))} disabled={busy || saving} style={selStyle}>
                      {TIME_OPTS.filter(o => o.min > sh.start).map(o => <option key={o.min} value={o.min}>{o.label}</option>)}
                    </select>
                    <button onClick={() => removeShift(s.id)} disabled={busy || saving} title="Remove shift" style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: 8, background: 'rgba(218,27,51,0.14)', border: '1px solid rgba(218,27,51,0.5)', color: '#F87171', fontSize: 15, cursor: 'pointer', flexShrink: 0, padding: 0 }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => addShift(s.id)} disabled={busy || saving || blk} title={blk ? 'Marked unavailable this day' : ''} style={{ padding: '9px 16px', borderRadius: 8, background: `${rc}22`, border: `1px solid ${rc}`, color: '#fff', fontSize: 14, fontWeight: 600, cursor: blk ? 'not-allowed' : 'pointer', opacity: blk ? 0.4 : 1 }}>+ Add shift</button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
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
            const off = avOf(s.id) === 'unavailable'
            const overridden = override.has(s.id)
            const blk = off && !overridden
            const drafting = drag && drag.mode === 'paint' && drag.staffId === s.id
              ? { lo: Math.min(drag.anchor, drag.cur), hi: Math.max(drag.anchor + 1, drag.cur) } : null
            return (
              <div key={s.id} style={{ display: 'flex', height: ROW_H, borderBottom: ri === rows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: NAME_W, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '0 8px', borderRight: '1px solid rgba(255,255,255,0.12)', borderLeft: `3px solid ${rc}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: rc, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: off ? (overridden ? '#FBBF24' : '#F87171') : '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(s.name || 'Unnamed').split(' ')[0]}</div>
                    {off
                      ? <button onClick={() => toggleOverride(s.id)} title={overridden ? 'Booked despite being marked off — click to re-block' : 'Marked unavailable this day — click to book anyway'} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block', maxWidth: '100%', textAlign: 'left', fontSize: 9, fontWeight: 700, color: overridden ? '#FBBF24' : '#F87171', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{overridden ? '⚠ booking anyway' : '🚫 unavailable'}</button>
                      : <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.role || '—'}</div>}
                  </div>
                </div>
                <div
                  ref={el => { trackRefs.current[s.id] = el }}
                  onPointerDown={e => onDown(e, s.id)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
                  style={{ position: 'relative', width: trackW, height: ROW_H, backgroundImage: gridBg, backgroundColor: blk ? 'rgba(248,113,113,0.09)' : undefined, cursor: (busy || saving) ? 'default' : (blk ? 'not-allowed' : 'crosshair'), touchAction: 'none' }}
                >
                  {/* 12h-rest no-go zones (pale red, under the blocks): from their
                      shifts on the days either side. Live: saving the neighbouring
                      day re-syncs these; overlaps light up bright below. */}
                  {(() => {
                    const rw = restWindows[s.id]; if (!rw || !minRestHours) return null
                    const zones = []
                    if (rw.maxEnd != null && rw.maxEnd < WIN_END) zones.push({ a: Math.max(WIN_START, rw.maxEnd), b: WIN_END, edge: 'l', title: `Starts ${fmtMin(rw.nextStart)} tomorrow — ${minRestHours}h rest means they must finish by ${fmtMin(Math.max(WIN_START, rw.maxEnd))}` })
                    if (rw.minStart != null && rw.minStart > WIN_START) zones.push({ a: WIN_START, b: Math.min(WIN_END, rw.minStart), edge: 'r', title: `Finished ${fmtMin(rw.prevEnd)} yesterday — ${minRestHours}h rest means they can't start before ${fmtMin(Math.min(WIN_END, rw.minStart))}` })
                    return zones.filter(z => z.b > z.a).map((z, zi) => (
                      <div key={'rz' + zi} title={z.title} style={{ position: 'absolute', top: 0, height: '100%', left: xOfMin(z.a), width: xOfMin(z.b) - xOfMin(z.a), background: 'rgba(248,113,113,0.15)', borderLeft: z.edge === 'l' ? '2px solid rgba(248,113,113,0.8)' : undefined, borderRight: z.edge === 'r' ? '2px solid rgba(248,113,113,0.8)' : undefined }} />
                    ))
                  })()}
                  {drafting && drafting.hi > drafting.lo && (
                    <div style={{ position: 'absolute', top: 5, height: ROW_H - 10, left: drafting.lo * SLOT_W, width: (drafting.hi - drafting.lo) * SLOT_W, background: `${rc}55`, border: `1px dashed ${rc}`, borderRadius: 6 }} />
                  )}
                  {mine.map(b => {
                    const left = xOfMin(b.start), w = xOfMin(b.end) - xOfMin(b.start)
                    return (
                      <div key={b.key} style={{ position: 'absolute', top: 5, height: ROW_H - 10, left, width: w, background: `${rc}33`, border: `1.5px solid ${rc}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                        {/* LEFT-edge resize handle — drag to change the start time */}
                        <div onPointerDown={e => startResize(e, b, 'l')} title="Drag to change the start" style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, width: 11, height: '100%', cursor: 'ew-resize', background: rc, opacity: 0.6, borderTopLeftRadius: 5, borderBottomLeftRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 9, fontWeight: 900 }}>‖</div>
                        <span style={{ fontSize: 9.5, color: '#fff', fontWeight: 600, padding: '0 12px', whiteSpace: 'nowrap', pointerEvents: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmtMin(b.start)}–{fmtMin(b.end)}</span>
                        {/* RIGHT-edge resize handle — drag to change the end time */}
                        <div onPointerDown={e => startResize(e, b, 'r')} title="Drag to change the end" style={{ position: 'absolute', top: 0, right: 0, zIndex: 2, width: 11, height: '100%', cursor: 'ew-resize', background: rc, opacity: 0.6, borderTopRightRadius: 5, borderBottomRightRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 9, fontWeight: 900 }}>‖</div>
                        {/* Delete — a clear red circle overhanging the top-right corner */}
                        <button onPointerDown={e => e.stopPropagation()} onClick={() => removeBlock(b.key)} title="Remove shift" style={{ position: 'absolute', top: -9, right: -9, zIndex: 6, width: 20, height: 20, borderRadius: '50%', background: '#DA1B33', border: '2px solid #000', color: '#fff', fontSize: 11, lineHeight: 1, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>✕</button>
                      </div>
                    )
                  })}
                  {/* Bright red = the block actually breaks the rest rule (overlap) */}
                  {(() => {
                    const rw = restWindows[s.id]; if (!rw || !minRestHours) return null
                    const zs = []
                    if (rw.maxEnd != null) zs.push([Math.max(WIN_START, rw.maxEnd), WIN_END])
                    if (rw.minStart != null) zs.push([WIN_START, Math.min(WIN_END, rw.minStart)])
                    const outs = []
                    for (const b of mine) for (const [a2, z2] of zs) { const lo = Math.max(b.start, a2), hi = Math.min(b.end, z2); if (hi > lo) outs.push([lo, hi]) }
                    return outs.map(([lo, hi], i) => (
                      <div key={'rx' + i} title={`Breaks the ${minRestHours}h rest rule — ${fmtMin(lo)}–${fmtMin(hi)} clashes with their shift on the day ${rw.maxEnd != null && hi > (rw.maxEnd ?? -1) ? 'after' : 'before'}`} style={{ position: 'absolute', top: 5, height: ROW_H - 10, left: xOfMin(lo), width: xOfMin(hi) - xOfMin(lo), background: 'rgba(255,31,61,0.55)', border: '1.5px solid #FF5A6B', borderRadius: 6, pointerEvents: 'none', zIndex: 5 }} />
                    ))
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      )}

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
