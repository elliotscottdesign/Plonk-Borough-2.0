import React, { useState } from 'react'
import { rotaSetRotaRules, rotaCompileRules } from '../../rota/api.js'
import { withDefaults } from '../../rota/rotaEngine.js'
import { fmtMin } from '../../rota/shifts.js'
import DateField from '../../lib/DateField.jsx'

// ─── Rota rules editor (founder) ─────────────────────────────────────────────
// The rules the AI rota builder uses — opening hours, how many people each day,
// the evening bump, holidays and a couple of options. Saved to the rota_rules
// table; the engine reads them (falling back to venue defaults for anything blank).

const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33'
const LINE = 'rgba(255,255,255,0.12)'
const DAYS = [[1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'], [6, 'Saturday'], [0, 'Sunday']]
// Time options every 30 min, 8am → 3am next day (covers late closes).
const TIME_OPTS = []; for (let m = 480; m <= 1620; m += 30) TIME_OPTS.push(m)

export default function RotaRulesEditor({ rules, staff = [], onSaved }) {
  const [draft, setDraft] = useState(() => withDefaults(rules))
  const [busy, setBusy] = useState('')
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  const dirty = JSON.stringify(draft) !== JSON.stringify(withDefaults(rules))
  const setDay = (w, patch) => setDraft(d => ({ ...d, days: { ...d.days, [w]: { ...d.days[w], ...patch } } }))
  const setHoliday = (patch) => setDraft(d => ({ ...d, holiday: { ...d.holiday, ...patch } }))
  const addHoliday = () => setDraft(d => ({ ...d, holidayDates: [...d.holidayDates, ['', '', 'New holiday']] }))
  const setHolidayCell = (i, j, val) => setDraft(d => ({ ...d, holidayDates: d.holidayDates.map((r, k) => k !== i ? r : r.map((c, x) => x === j ? val : c)) }))
  const removeHoliday = (i) => setDraft(d => ({ ...d, holidayDates: d.holidayDates.filter((_, k) => k !== i) }))
  // Free-text house rules
  const addRule = () => setDraft(d => ({ ...d, houseRules: [...(d.houseRules || []), ''] }))
  const setRule = (i, v) => setDraft(d => ({ ...d, houseRules: (d.houseRules || []).map((r, k) => k === i ? v : r) }))
  const removeRule = (i) => setDraft(d => ({ ...d, houseRules: (d.houseRules || []).filter((_, k) => k !== i) }))
  // Per-person strength / priority (1..5)
  const setStrength = (id, v) => setDraft(d => ({ ...d, strength: { ...(d.strength || {}), [id]: v } }))
  const activeStaff = (staff || []).filter(s => s.active !== false)

  const [notice, setNotice] = useState('')
  const save = async () => {
    // Drop half-filled holiday rows so a blank date range can't swallow every day,
    // and blank house-rule lines so an empty box isn't saved.
    const clean = { ...draft, holidayDates: draft.holidayDates.filter(r => r[0] && r[1]), houseRules: (draft.houseRules || []).map(s => s.trim()).filter(Boolean) }
    // Typed rules changed → have the AI re-read them and compile what it can into
    // live directives (compileRules saves the whole object server-side, nothing lost).
    // Otherwise a plain save keeps the existing compiled layer untouched.
    const rulesChanged = JSON.stringify(clean.houseRules) !== JSON.stringify(withDefaults(rules).houseRules)
    setBusy(rulesChanged ? 'ai' : 'save'); setErr(''); setNotice('')
    try {
      const r = rulesChanged ? await rotaCompileRules(clean) : await rotaSetRotaRules(clean)
      setDraft(withDefaults(r.rules))   // sync the fresh compiled layer into the draft
      if (r.setup && r.error) setNotice(r.error)
      setSaved(true); setTimeout(() => setSaved(false), 2500); await onSaved?.()
    }
    catch (e) { setErr(e.message) } finally { setBusy('') }
  }
  const resetDefaults = async () => {
    if (!window.confirm('Reset ALL rota rules back to the venue defaults?')) return
    setBusy('reset'); setErr('')
    try { await rotaSetRotaRules({}); setDraft(withDefaults(null)); await onSaved?.() }
    catch (e) { setErr(e.message) } finally { setBusy('') }
  }

  const timeSel = (value, onChange) => (
    <select value={String(value)} onChange={e => onChange(Number(e.target.value))} style={sel}>
      {TIME_OPTS.map(m => <option key={m} value={m}>{fmtMin(m)}</option>)}
    </select>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
        These are the rules the AI builds from. Change them here and <strong style={{ color: '#fff' }}>Save</strong> — the next time you Generate, it uses your new rules. A manager is always put on from {draft.managerMargin} min before open to {draft.managerMargin} min after close.
      </div>

      {err && <div style={{ fontSize: 12.5, color: '#F87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 8, padding: '9px 12px' }}>{err}</div>}

      {/* Free-text house rules — the founder's own rules, in plain English */}
      <div>
        <div style={sectionHdr}>🧠 House rules <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>· type them — the AI applies them</span></div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 8 }}>
          Type any rule in plain English — “one person opens, one closes”, “prioritise Jordan this week”, “never put Alex and Sam on together”, “max 3 shifts for Ben”. When you <strong style={{ color: '#fff' }}>Save</strong>, the AI reads them and wires what it can straight into the builder — each rule gets a receipt below: <strong style={{ color: GREEN }}>✓ applied</strong> (with what it'll do) or <strong style={{ color: AMBER }}>⚠️ reminder</strong> (shown on every rota for you to check by hand). Delete a rule and Save to un-apply it.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(draft.houseRules || []).length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No house rules yet — add your first below.</div>}
          {(draft.houseRules || []).map((r, i) => {
            // Each rule row carries its own receipt (how the AI read it last save).
            // Edited text no longer matches a saved receipt → show the "re-save" hint.
            const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase()
            const note = (draft.compiledNotes || []).find(n => n && norm(n.rule) === norm(r)) || null
            return (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 13, lineHeight: '30px', flexShrink: 0 }} title={note ? (note.status === 'applied' ? 'Applied — the builder does this automatically' : 'Reminder — check it by hand when you review a week') : 'Not read yet — Save rules'}>{note ? (note.status === 'applied' ? '✅' : '⚠️') : '📝'}</span>
                  <textarea value={r} onChange={e => setRule(i, e.target.value)} rows={1} placeholder="e.g. On weekdays, one person opens and one closes rather than two full shifts" style={{ ...txt, flex: 1, minWidth: 0, resize: 'vertical', lineHeight: 1.4 }} />
                  <button onClick={() => removeRule(i)} title="Delete this rule — then Save rules to make it stick" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7, cursor: 'pointer', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.35)', color: '#F87171', fontSize: 11.5, fontWeight: 700 }}>🗑 Delete</button>
                </div>
                {note
                  ? <div style={{ fontSize: 11.5, color: note.status === 'applied' ? GREEN : AMBER, lineHeight: 1.45, marginTop: 5, paddingLeft: 29 }}>{note.understood}</div>
                  : <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 5, paddingLeft: 29 }}>New or edited — tap <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Save rules</strong> below and the AI will read it.</div>}
              </div>
            )
          })}
        </div>
        <button onClick={addRule} style={{ ...btn('ghost'), marginTop: 8 }}>+ Add a rule</button>
        {notice && <div style={{ fontSize: 12, color: AMBER, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '9px 12px', marginTop: 10, lineHeight: 1.5 }}>{notice}</div>}
      </div>

      {/* Per-day hours + staffing */}
      <div>
        <div style={sectionHdr}>📅 Opening hours &amp; staffing</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DAYS.map(([w, name]) => {
            const d = draft.days[w]
            return (
              <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', minWidth: 78 }}>{name}</div>
                <label style={lbl}>Open</label>{timeSel(d.open, v => setDay(w, { open: v }))}
                <label style={lbl}>Close</label>{timeSel(d.close, v => setDay(w, { close: v }))}
                <label style={lbl}>Staff</label>
                <input type="number" min={0} max={12} value={d.base} onChange={e => setDay(w, { base: Math.max(0, Math.min(12, parseInt(e.target.value) || 0)) })} style={num} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>·</span>
                <label style={lbl}>+extra</label>
                <input type="number" min={0} max={8} value={d.eveAdd} onChange={e => setDay(w, { eveAdd: Math.max(0, Math.min(8, parseInt(e.target.value) || 0)) })} style={num} />
                <label style={lbl}>from</label>
                <span style={{ opacity: d.eveAdd > 0 ? 1 : 0.4, pointerEvents: d.eveAdd > 0 ? 'auto' : 'none' }}>{timeSel(d.eveAt ?? 1080, v => setDay(w, { eveAt: v }))}</span>
                {/* Kitchen column: on/off + the dedicated kitchen shift's exact times */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 6, paddingLeft: 10, borderLeft: `1px solid ${LINE}` }}>
                  <label title="A dedicated kitchen shift on this day (only kitchen-trained staff can fill it) — on top of the Staff number, not counted in it." style={{ ...optRow, cursor: 'pointer', color: d.kitchen === true ? AMBER : 'rgba(255,255,255,0.55)', fontSize: 11.5 }}>
                    <input type="checkbox" checked={d.kitchen === true} onChange={e => setDay(w, e.target.checked ? { kitchen: true, kitchenStart: d.kitchenStart ?? 1020, kitchenEnd: d.kitchenEnd ?? 1380 } : { kitchen: false })} />
                    <span>🍳 Kitchen</span>
                  </label>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, opacity: d.kitchen === true ? 1 : 0.35, pointerEvents: d.kitchen === true ? 'auto' : 'none' }}>
                    {timeSel(d.kitchenStart ?? 1020, v => setDay(w, { kitchenStart: v }))}
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>–</span>
                    {timeSel(d.kitchenEnd ?? 1380, v => setDay(w, { kitchenEnd: v }))}
                  </span>
                </span>
                <label title="Mark this day as usually quiet — the floor gets sent home early (see Options)" style={{ ...optRow, marginLeft: 'auto', cursor: 'pointer', color: d.quiet ? AMBER : 'rgba(255,255,255,0.55)', fontSize: 11.5 }}>
                  <input type="checkbox" checked={d.quiet === true} onChange={e => setDay(w, { quiet: e.target.checked })} />
                  <span>😴 quiet</span>
                </label>
              </div>
            )
          })}
        </div>
        <div style={hint}>“Staff” = manager + bar people on that day (the 🍳 kitchen person is on top of this, not counted in it). “+extra … from” adds more bodies for the evening rush (set extra to 0 for none). <strong style={{ color: AMBER }}>🍳 Kitchen</strong> = a dedicated kitchen shift with those exact times, filled only by kitchen-trained staff — this column beats any typed kitchen rule. Tick <strong style={{ color: AMBER }}>😴 quiet</strong> on your slow days to send the floor home early (by the amount set in Options).</div>
      </div>

      {/* Holidays */}
      <div>
        <div style={sectionHdr}>🏖️ Holidays <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>· these dates run different hours every day</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <label style={lbl}>Holiday hours</label>{timeSel(draft.holiday.open, v => setHoliday({ open: v }))}<span style={{ color: 'rgba(255,255,255,0.4)' }}>–</span>{timeSel(draft.holiday.close, v => setHoliday({ close: v }))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {draft.holidayDates.map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 8, padding: '7px 10px' }}>
              <input value={row[2]} onChange={e => setHolidayCell(i, 2, e.target.value)} placeholder="Name" style={{ ...txt, minWidth: 150, flex: 1 }} />
              <label style={lbl}>from</label><DateField value={row[0]} onChange={v => setHolidayCell(i, 0, v)} style={txt} />
              <label style={lbl}>to</label><DateField value={row[1]} onChange={v => setHolidayCell(i, 1, v)} style={txt} />
              <button onClick={() => removeHoliday(i)} title="Remove" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
        <button onClick={addHoliday} style={{ ...btn('ghost'), marginTop: 8 }}>+ Add a holiday</button>
      </div>

      {/* Staff strength / priority */}
      <div>
        <div style={sectionHdr}>💪 Staff strength / priority <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>· who the builder leans on first</span></div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 8 }}>
          Bump your stronger people up and they get picked <strong style={{ color: '#fff' }}>first &amp; more often</strong>; drop someone down and they get fewer. It's a lean, not a lock — hours still spread so no one's buried or benched. Middle (3) = normal. Change someone to <strong style={{ color: GREEN }}>5</strong> to prioritise them this week, then set them back after.
        </div>
        {activeStaff.length === 0
          ? <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No active team members yet.</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {activeStaff.map(s => {
                const val = (() => { const v = +(draft.strength?.[s.id]); return Number.isFinite(v) && v >= 1 && v <= 5 ? v : 3 })()
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 8, padding: '6px 10px' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name || 'Unnamed'}{s.role ? <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.45)' }}> · {s.role}</span> : null}</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setStrength(s.id, n)} title={n === 3 ? 'Normal' : n === 5 ? 'Top priority' : n === 1 ? 'Least' : ''} style={{ width: 26, height: 26, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: `1px solid ${val === n ? (n >= 4 ? GREEN : n <= 2 ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.15)'}`, background: val === n ? (n >= 4 ? 'rgba(52,211,153,0.18)' : n <= 2 ? 'rgba(248,113,113,0.14)' : 'rgba(255,255,255,0.12)') : 'transparent', color: val === n ? '#fff' : 'rgba(255,255,255,0.4)' }}>{n}</button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>

      {/* Options */}
      <div>
        <div style={sectionHdr}>⚙️ Options</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={optRow}>
            <input type="checkbox" checked={draft.requireKitchen !== false} onChange={e => setDraft(d => ({ ...d, requireKitchen: e.target.checked }))} />
            <span>Always put a <strong style={{ color: '#fff' }}>kitchen-trained</strong> person on each day (and warn if none is free)</span>
          </label>
          <label style={optRow}>
            <input type="checkbox" checked={draft.requireManager !== false} onChange={e => setDraft(d => ({ ...d, requireManager: e.target.checked }))} />
            <span>Always reserve a <strong style={{ color: '#fff' }}>manager / assistant manager</strong> slot</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={lbl}>Manager starts / ends</label>
            <input type="number" min={0} max={120} step={15} value={draft.managerMargin} onChange={e => setDraft(d => ({ ...d, managerMargin: Math.max(0, Math.min(120, parseInt(e.target.value) || 0)) }))} style={num} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>min before open / after close</span>
          </div>
          {/* Opener + closer stagger */}
          <label style={optRow}>
            <input type="checkbox" checked={draft.stagger === true} onChange={e => setDraft(d => ({ ...d, stagger: e.target.checked }))} />
            <span><strong style={{ color: '#fff' }}>One opens, one closes</strong> — instead of two people both doing the full shift, one comes in later and one leaves earlier (the manager covers open &amp; close). Saves the quiet hour at each end.</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: draft.stagger ? 1 : 0.4, pointerEvents: draft.stagger ? 'auto' : 'none', paddingLeft: 24 }}>
            <label style={lbl}>Stagger by</label>
            <input type="number" min={0} max={240} step={15} value={draft.staggerGap} onChange={e => setDraft(d => ({ ...d, staggerGap: Math.max(0, Math.min(240, parseInt(e.target.value) || 0)) }))} style={num} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>min (opener leaves this early / closer starts this late)</span>
          </div>
          {/* Floor stays after close (wind-down with the manager) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={lbl}>Floor staff stay on after close</label>
            <input type="number" min={0} max={120} step={15} value={draft.afterCloseMin} onChange={e => setDraft(d => ({ ...d, afterCloseMin: Math.max(0, Math.min(120, parseInt(e.target.value) || 0)) }))} style={num} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>min — everyone leaves with the manager (a house rule like “1 hour on Fri/Sat” can set this per day)</span>
          </div>
          {/* Quiet-day early cut */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={lbl}>On 😴 quiet days, send the floor home</label>
            <input type="number" min={0} max={120} step={15} value={draft.earlyCutMin} onChange={e => setDraft(d => ({ ...d, earlyCutMin: Math.max(0, Math.min(120, parseInt(e.target.value) || 0)) }))} style={num} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>min early (tick which days are quiet above)</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderTop: `1px dashed ${LINE}`, paddingTop: 12 }}>
        <button onClick={save} disabled={busy === 'save' || busy === 'ai' || !dirty} style={{ ...btn('gold'), opacity: ((busy === 'save' || busy === 'ai') || !dirty) ? 0.5 : 1 }}>{busy === 'ai' ? '🧠 AI reading your rules…' : busy === 'save' ? 'Saving…' : saved ? 'Saved ✓' : dirty ? 'Save rules' : 'Saved ✓'}</button>
        <button onClick={resetDefaults} disabled={!!busy} style={btn('ghost')}>{busy === 'reset' ? '…' : 'Reset to defaults'}</button>
        {dirty && <span style={{ fontSize: 11.5, color: AMBER }}>Unsaved changes — Save, then Generate to use them.</span>}
      </div>
    </div>
  )
}

const sectionHdr = { fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 }
const lbl = { fontSize: 10.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.03em' }
const hint = { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 1.45 }
const sel = { padding: '5px 6px', fontSize: 12, borderRadius: 6, background: '#000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', cursor: 'pointer' }
const num = { width: 46, padding: '5px 6px', fontSize: 12, borderRadius: 6, background: '#000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', textAlign: 'center' }
const txt = { padding: '5px 8px', fontSize: 12, borderRadius: 6, background: '#000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none' }
const optRow = { display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4, cursor: 'pointer' }
const btn = (kind) => {
  const base = { padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: RED, color: '#fff' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
}
