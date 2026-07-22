import React, { useState } from 'react'
import { rotaSetRotaRules } from '../../rota/api.js'
import { withDefaults } from '../../rota/rotaEngine.js'
import { fmtMin } from '../../rota/shifts.js'

// ─── Rota rules editor (founder) ─────────────────────────────────────────────
// The rules the AI rota builder uses — opening hours, how many people each day,
// the evening bump, holidays and a couple of options. Saved to the rota_rules
// table; the engine reads them (falling back to venue defaults for anything blank).

const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33'
const LINE = 'rgba(255,255,255,0.12)'
const DAYS = [[1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'], [6, 'Saturday'], [0, 'Sunday']]
// Time options every 30 min, 8am → 3am next day (covers late closes).
const TIME_OPTS = []; for (let m = 480; m <= 1620; m += 30) TIME_OPTS.push(m)

export default function RotaRulesEditor({ rules, onSaved }) {
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

  const save = async () => {
    // Drop half-filled holiday rows so a blank date range can't swallow every day.
    const clean = { ...draft, holidayDates: draft.holidayDates.filter(r => r[0] && r[1]) }
    setBusy('save'); setErr('')
    try { await rotaSetRotaRules(clean); setSaved(true); setTimeout(() => setSaved(false), 2500); await onSaved?.() }
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
              </div>
            )
          })}
        </div>
        <div style={hint}>“Staff” = total people on that day (incl. the manager). “+extra … from” adds more bodies for the evening rush (set extra to 0 for none).</div>
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
              <label style={lbl}>from</label><input type="date" value={row[0]} onChange={e => setHolidayCell(i, 0, e.target.value)} style={txt} />
              <label style={lbl}>to</label><input type="date" value={row[1]} onChange={e => setHolidayCell(i, 1, e.target.value)} style={txt} />
              <button onClick={() => removeHoliday(i)} title="Remove" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
        <button onClick={addHoliday} style={{ ...btn('ghost'), marginTop: 8 }}>+ Add a holiday</button>
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
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderTop: `1px dashed ${LINE}`, paddingTop: 12 }}>
        <button onClick={save} disabled={busy === 'save' || !dirty} style={{ ...btn('gold'), opacity: (busy === 'save' || !dirty) ? 0.5 : 1 }}>{busy === 'save' ? 'Saving…' : saved ? 'Saved ✓' : dirty ? 'Save rules' : 'Saved ✓'}</button>
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
