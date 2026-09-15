import React, { useState, useRef } from 'react'
import { rotaAddTrial, rotaSaveTrial, rotaRemoveTrial, rotaUploadTrialCV, rotaGetTrialCV, rotaAddTrialShift, rotaRemoveTrialShift } from '../../rota/api.js'
import { fmtMin } from '../../rota/shifts.js'
import { openDataUrl } from '../../rota/menuFile.js'
import DateField from '../../lib/DateField.jsx'

// ─── 🎓 Interviewees — the trials ledger (management only) ────────────────────
// People coming in for a trial / interview. NOT staff: no login, no shift-
// claiming, no system access. One card each: contact details, their scheduled
// trial shift(s) (duty managers see these on the Rota), a CV, and notes +
// feedback all in one place so nothing's lost. Add a trial shift here or from
// the Rota day panel; either way it shows on the rota under the bar team.

const RED = '#DA1B33', GREEN = '#34D399', AMBER = '#F59E0B', BLUE = '#60A5FA', TRIAL = '#F0ABFC'
const dayLabel = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const STATUS = { trial: { label: 'Trial', color: TRIAL }, hired: { label: 'Hired ✓', color: GREEN }, declined: { label: 'Not proceeding', color: 'rgba(255,255,255,0.5)' } }

export default function Interviewees({ trials = [], trialShifts = [], reload }) {
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [newForm, setNewForm] = useState(null)   // { name, phone, email } | null
  const shiftsByTrial = {}
  for (const sh of trialShifts) (shiftsByTrial[sh.trial_id] ||= []).push(sh)

  const addTrial = async () => {
    if (!newForm?.name?.trim()) { alert('Give the interviewee a name.'); return }
    setBusy(true)
    try { const r = await rotaAddTrial(newForm.name.trim(), newForm.phone, newForm.email); setNewForm(null); await reload(); setOpenId(r.trial?.id) }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 22, color: '#fff' }}>🎓 Interviewees</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 3, lineHeight: 1.6 }}>
            Everyone coming in for a <strong style={{ color: TRIAL }}>trial or interview</strong> — contact details, their trial shift, CV, and your notes &amp; feedback in one place. They're <strong style={{ color: '#fff' }}>not on the system</strong> (no login, no shifts to claim). Their trial shift shows on the Rota under the bar team so the duty manager knows they're coming.
          </div>
        </div>
        <button onClick={() => setNewForm({ name: '', phone: '', email: '' })} style={btn('gold')}>+ New interviewee</button>
      </div>

      {newForm && (
        <div style={{ background: '#0A0A0A', border: `1px solid ${TRIAL}66`, borderRadius: 12, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Name" wide><input autoFocus value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="Their name" style={inp} /></Field>
          <Field label="Phone"><input value={newForm.phone} onChange={e => setNewForm(f => ({ ...f, phone: e.target.value }))} placeholder="Mobile — so the DM can reach them" style={inp} /></Field>
          <Field label="Email"><input value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} placeholder="Optional" style={inp} /></Field>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setNewForm(null)} style={btn('ghost')}>Cancel</button>
            <button onClick={addTrial} disabled={busy} style={btn('gold')}>{busy ? 'Adding…' : 'Add interviewee'}</button>
          </div>
        </div>
      )}

      {trials.length === 0 && !newForm && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', padding: '20px 0', textAlign: 'center' }}>No interviewees yet — tap <strong style={{ color: '#fff' }}>+ New interviewee</strong> to add the first.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {trials.map(t => (
          <TrialCard key={t.id} trial={t} shifts={shiftsByTrial[t.id] || []} open={openId === t.id} onToggle={() => setOpenId(o => o === t.id ? null : t.id)} reload={reload} />
        ))}
      </div>
    </div>
  )
}

function TrialCard({ trial: t, shifts, open, onToggle, reload }) {
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState(t.notes || '')
  const [feedback, setFeedback] = useState(t.feedback || '')
  const [addShift, setAddShift] = useState(null)   // { date, start, end } | null
  const fileRef = useRef(null)
  const st = STATUS[t.status] || STATUS.trial
  const nextShift = shifts.slice().sort((a, b) => a.date.localeCompare(b.date))[0]
  const wa = t.phone ? `https://wa.me/${String(t.phone).replace(/[^0-9]/g, '').replace(/^0/, '44')}` : null

  const act = async (fn) => { setBusy(true); try { await fn(); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const saveText = () => act(() => rotaSaveTrial(t.id, { notes, feedback }))
  const setStatus = (status) => act(() => rotaSaveTrial(t.id, { status }))
  const remove = () => { if (window.confirm(`Remove ${t.name} and their trial shifts + CV? This can't be undone.`)) act(() => rotaRemoveTrial(t.id)) }
  const onCV = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    if (f.size > 5 * 1024 * 1024) { alert('CV too big — keep it under 5MB.'); return }
    const rd = new FileReader(); rd.onload = () => act(() => rotaUploadTrialCV(t.id, rd.result, f.name)); rd.readAsDataURL(f)
  }
  const viewCV = () => act(async () => { const r = await rotaGetTrialCV(t.id); openDataUrl(r.data) })
  const doAddShift = () => {
    if (!addShift?.date || addShift.start == null || addShift.end == null || addShift.end <= addShift.start) { alert('Pick the day and valid times (end after start).'); return }
    act(async () => { await rotaAddTrialShift(t.id, addShift.date, addShift.start, addShift.end); setAddShift(null) })
  }

  return (
    <div style={{ background: '#0A0A0A', border: `1px solid ${open ? TRIAL + '66' : 'rgba(255,255,255,0.12)'}`, borderRadius: 12, padding: 14 }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', cursor: 'pointer' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
        <div style={{ minWidth: 130 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{t.name}</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>{t.phone || 'no number'}{t.email ? ` · ${t.email}` : ''}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: st.color, border: `1px solid ${st.color}66`, borderRadius: 999, padding: '2px 9px' }}>{st.label}</span>
        {nextShift && <span style={{ fontSize: 12, color: TRIAL }}>🎓 trial {dayLabel(nextShift.date)} {fmtMin(nextShift.start_min)}–{fmtMin(nextShift.end_min)}</span>}
        {t.cv_name && <span style={{ fontSize: 11, color: BLUE }}>📄 CV</span>}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{open ? '▴' : '▾'}</span>
      </div>

      {open && (
        <div style={{ marginTop: 12, borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Contact quick actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {t.phone && <a href={`tel:${t.phone}`} style={{ ...btn('ghost'), textDecoration: 'none' }}>📞 Call</a>}
            {wa && <a href={wa} target="_blank" rel="noreferrer" style={{ ...btn('ghost'), color: '#25D366', borderColor: 'rgba(37,211,102,0.45)', textDecoration: 'none' }}>WhatsApp</a>}
            {t.email && <a href={`mailto:${t.email}`} style={{ ...btn('ghost'), textDecoration: 'none' }}>✉️ Email</a>}
          </div>

          {/* Trial shifts */}
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', marginBottom: 6 }}>🎓 Trial / interview shifts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {shifts.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>None booked yet.</div>}
              {shifts.slice().sort((a, b) => a.date.localeCompare(b.date)).map(sh => (
                <div key={sh.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: `${TRIAL}14`, border: `1px solid ${TRIAL}44`, borderRadius: 8, padding: '7px 10px', fontSize: 12.5 }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{dayLabel(sh.date)}</span>
                  <span style={{ color: TRIAL, fontWeight: 700 }}>{fmtMin(sh.start_min)}–{fmtMin(sh.end_min)}</span>
                  <button onClick={() => act(() => rotaRemoveTrialShift(sh.id))} disabled={busy} title="Remove" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13 }}>✕</button>
                </div>
              ))}
            </div>
            {addShift ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 10 }}>
                <Field label="Day"><DateField value={addShift.date} onChange={v => setAddShift(a => ({ ...a, date: v }))} /></Field>
                <Field label="Start"><TimeSel value={addShift.start} onChange={v => setAddShift(a => ({ ...a, start: v }))} /></Field>
                <Field label="End"><TimeSel value={addShift.end} onChange={v => setAddShift(a => ({ ...a, end: v }))} /></Field>
                <button onClick={doAddShift} disabled={busy} style={btn('gold')}>Add</button>
                <button onClick={() => setAddShift(null)} style={btn('ghost')}>Cancel</button>
              </div>
            ) : <button onClick={() => setAddShift({ date: '', start: 1020, end: 1320 })} style={{ ...btn('ghost'), marginTop: 8 }}>+ Add trial shift</button>}
          </div>

          {/* CV */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>📄 CV</span>
            {t.cv_name ? <button onClick={viewCV} disabled={busy} style={btn('ghost')}>View {t.cv_name}</button> : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>none uploaded</span>}
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,image/*" onChange={onCV} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current?.click()} disabled={busy} style={btn('ghost')}>{t.cv_name ? 'Replace' : '↑ Upload CV'}</button>
          </div>

          {/* Notes + feedback */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Notes (before / general)" wide><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Who referred them, what they've done before, anything to know…" style={{ ...inp, resize: 'vertical' }} /></Field>
            <Field label="Trial feedback (after)" wide><textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={2} placeholder="How the trial went — hire, hold, or pass?" style={{ ...inp, resize: 'vertical' }} /></Field>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={saveText} disabled={busy} style={btn('gold')}>{busy ? 'Saving…' : 'Save notes'}</button>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>Outcome:</span>
            {['trial', 'hired', 'declined'].map(k => (
              <button key={k} onClick={() => setStatus(k)} disabled={busy} style={{ padding: '5px 11px', fontSize: 11.5, borderRadius: 999, cursor: 'pointer', fontWeight: t.status === k ? 700 : 400, background: t.status === k ? `${STATUS[k].color}22` : 'rgba(255,255,255,0.05)', border: `1px solid ${t.status === k ? STATUS[k].color : 'rgba(255,255,255,0.15)'}`, color: t.status === k ? '#fff' : 'rgba(255,255,255,0.7)' }}>{STATUS[k].label}</button>
            ))}
            <button onClick={remove} disabled={busy} style={{ ...btn('ghost'), marginLeft: 'auto', color: '#F87171', borderColor: 'rgba(248,113,113,0.4)' }}>Remove</button>
          </div>
        </div>
      )}
    </div>
  )
}

function TimeSel({ value, onChange }) {
  const opts = []; for (let m = 600; m <= 1560; m += 30) opts.push(m)
  return <select value={value} onChange={e => onChange(Number(e.target.value))} style={inp}>{opts.map(m => <option key={m} value={m}>{fmtMin(m)}</option>)}</select>
}
function Field({ label, wide, children }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 3, gridColumn: wide ? '1 / -1' : 'auto' }}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>{children}</label>
}
const inp = { padding: '8px 10px', fontSize: 13, borderRadius: 8, background: '#000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', boxSizing: 'border-box', width: '100%' }
const btn = (kind) => {
  const base = { padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, border: '1px solid transparent', whiteSpace: 'nowrap', display: 'inline-block' }
  if (kind === 'gold') return { ...base, background: RED, color: '#fff' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
}
