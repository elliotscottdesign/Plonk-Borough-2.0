import React, { useState, useEffect, useRef } from 'react'
import { rotaLoad, rotaAddStaff, rotaSaveStaff, rotaRemoveStaff, STAFF_ROLES } from '../../rota/api.js'
import RotaCalendar from './RotaCalendar.jsx'

// ─── Staff Rota — team roster (admin) ────────────────────────────────────────
// Reads/writes the Supabase `staff` table via the `rota` edge function. Each
// member has a full profile (contact, next of kin), a role, the skills/stations
// they're signed off on, training + feedback notes, the days they can't work,
// and a login password for the staff portal (Slice 2). Founder-only (/ops).

const TRAINING = ['Trial', 'In training', 'Signed off']
// Common bar stations/skills — quick-add chips (founder can also type their own).
const SKILL_SUGGESTIONS = ['Till', 'Cocktails', 'Draught', 'Barback', 'Floor', 'Open', 'Close', 'Cellar', 'Cash-up', 'Keyholder']

function Avatar({ name, size = 46 }) {
  const initials = (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = [...(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `hsl(${hue} 42% 22%)`, color: '#fff', fontSize: size * 0.34, fontWeight: 700, border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>{initials}</div>
}

// A profile is "ready" for the portal once it can log in (email + password) and
// has a role — that's the minimum to appear on the rota.
const ready = (s) => !!(s && s.name && s.email && s.has_password && s.role)
const missing = (s) => {
  const m = []
  if (!s?.email) m.push('email')
  if (!s?.has_password) m.push('login password')
  if (!s?.role) m.push('role')
  return m
}

export default function StaffRota() {
  const [staff, setStaff] = useState([])
  const [shifts, setShifts] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [view, setView] = useState('team')   // 'team' (roster) | 'rota' (shift calendar)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const editRef = useRef(null)

  const load = async () => {
    setLoading(true); setErr('')
    try { const r = await rotaLoad(); setStaff(r.staff || []); setShifts(r.shifts || []); setClaims(r.claims || []) }
    catch (e) { setErr(e.message || 'Could not load the team.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => { if (editing) editRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [editing])

  const startEdit = (s) => { setEditing(s.id); setForm({ ...s, password: '' }) }
  const onField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleSkill = (sk) => setForm(f => {
    const cur = Array.isArray(f.skills) ? f.skills : []
    return { ...f, skills: cur.includes(sk) ? cur.filter(x => x !== sk) : [...cur, sk] }
  })

  const addNew = async () => {
    setBusy(true); setQ('')
    try {
      const r = await rotaAddStaff({ name: 'New team member' })
      await load()
      if (r?.staff?.id) startEdit(r.staff)
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const save = async () => {
    setBusy(true)
    try {
      const patch = {
        name: form.name, email: form.email, phone: form.phone, address: form.address,
        emergency_name: form.emergency_name, emergency_phone: form.emergency_phone, emergency_relation: form.emergency_relation,
        role: form.role, skills: Array.isArray(form.skills) ? form.skills : [],
        training_status: form.training_status, training_notes: form.training_notes,
        feedback_notes: form.feedback_notes, work_rules: form.work_rules, active: form.active !== false,
      }
      if (form.password && form.password.trim()) patch.password = form.password.trim()   // blank = leave existing
      await rotaSaveStaff(editing, patch)
      setEditing(null); await load()
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const remove = async (id) => {
    if (!window.confirm('Remove this team member? This deletes their profile.')) return
    setBusy(true); try { await rotaRemoveStaff(id); setEditing(null); await load() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  const filtered = staff.filter(s => `${s.name} ${s.role || ''} ${s.email || ''} ${(s.skills || []).join(' ')}`.toLowerCase().includes(q.toLowerCase()))
  const readyN = staff.filter(ready).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[['team', '👥 Team'], ['rota', '🗓️ Rota']].map(([k, lbl]) => (
          <button key={k} onClick={() => setView(k)} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer', background: view === k ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)', border: `1px solid ${view === k ? '#DA1B33' : 'rgba(255,255,255,0.1)'}`, color: view === k ? '#DA1B33' : '#FFFFFF', fontWeight: view === k ? 600 : 400 }}>{lbl}</button>
        ))}
      </div>

      {view === 'rota' ? (
        <RotaCalendar staff={staff} shifts={shifts} claims={claims} reload={load} />
      ) : (<>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 22, color: '#FFFFFF' }}>👥 The team</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            {staff.length} team member{staff.length === 1 ? '' : 's'} · <span style={{ color: '#34D399' }}>{readyN} ready to log in</span>{staff.length - readyN > 0 && <> · <span style={{ color: '#FCD34D' }}>{staff.length - readyN} incomplete</span></>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search team…" style={inp(170)} />
          <button onClick={addNew} disabled={busy} style={btn('gold')}>+ Add team member</button>
        </div>
      </div>

      {err && <div style={{ fontSize: 12.5, color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 12px' }}>{err} {err.includes('staff') || err.includes('relation') ? <span style={{ color: 'rgba(255,255,255,0.7)' }}>— has the rota database been turned on yet? Paste <code>supabase/rota-schema.sql</code> in the Supabase SQL editor.</span> : <button onClick={load} style={{ ...btn('ghost'), marginLeft: 8, padding: '4px 10px' }}>Retry</button>}</div>}

      {loading ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', padding: '24px 0', textAlign: 'center' }}>Loading team…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {filtered.map(s => {
            const isEdit = editing === s.id
            const done = ready(s)
            return (
              <div key={s.id} ref={isEdit ? editRef : null} style={{ background: '#0A0A0A', border: `1px solid ${isEdit ? '#DA1B33' : done ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.10)'}`, borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Avatar name={s.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {s.name || 'Unnamed'}
                      {s.role && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#DA1B33', border: '1px solid rgba(218,27,51,0.4)', borderRadius: 999, padding: '1px 7px' }}>{s.role}</span>}
                      {s.active === false && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '1px 7px' }}>inactive</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {(s.skills || []).slice(0, 6).map((g, i) => <span key={i} style={chip}>{g}</span>)}
                      {s.training_status && <span style={{ ...chip, color: s.training_status === 'Signed off' ? '#34D399' : '#FCD34D', borderColor: s.training_status === 'Signed off' ? 'rgba(52,211,153,0.4)' : 'rgba(252,211,77,0.4)' }}>{s.training_status}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.6)', flexWrap: 'wrap' }}>
                      {s.email && <span>{s.email}</span>}
                      {s.phone && <span>{s.phone}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: done ? '#34D399' : '#FCD34D', whiteSpace: 'nowrap' }}>{done ? '● Ready' : '○ Incomplete'}</span>
                </div>

                {!done && !isEdit && missing(s).length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 11.5, color: '#FCD34D', background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.25)', borderRadius: 7, padding: '7px 10px', lineHeight: 1.5 }}>
                    <strong style={{ color: '#FDE68A' }}>Still needs:</strong> {missing(s).join(' · ')}
                  </div>
                )}

                {isEdit ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Field label="Full name"><input value={form.name || ''} onChange={e => onField('name', e.target.value)} style={inp('100%')} /></Field>
                    <Field label="Role">
                      <select value={form.role || ''} onChange={e => onField('role', e.target.value)} style={inp('100%')}>
                        <option value="">— pick a role —</option>
                        {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </Field>
                    <Field label="Email (their login)"><input value={form.email || ''} onChange={e => onField('email', e.target.value)} style={inp('100%')} /></Field>
                    <Field label="Phone"><input value={form.phone || ''} onChange={e => onField('phone', e.target.value)} style={inp('100%')} /></Field>
                    <Field label="Home address" wide><input value={form.address || ''} onChange={e => onField('address', e.target.value)} style={inp('100%')} /></Field>

                    <div style={{ gridColumn: '1 / -1', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 10 }}>Next of kin / emergency contact</div>
                    <Field label="Name"><input value={form.emergency_name || ''} onChange={e => onField('emergency_name', e.target.value)} style={inp('100%')} /></Field>
                    <Field label="Their phone"><input value={form.emergency_phone || ''} onChange={e => onField('emergency_phone', e.target.value)} style={inp('100%')} /></Field>
                    <Field label="Relationship (e.g. mum, partner)" wide><input value={form.emergency_relation || ''} onChange={e => onField('emergency_relation', e.target.value)} style={inp('100%')} /></Field>

                    <div style={{ gridColumn: '1 / -1', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 10 }}>Skills / stations they're signed off on</div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[...new Set([...SKILL_SUGGESTIONS, ...(form.skills || [])])].map(sk => {
                        const on = (form.skills || []).includes(sk)
                        return <button key={sk} type="button" onClick={() => toggleSkill(sk)} style={{ padding: '5px 11px', fontSize: 12, borderRadius: 999, cursor: 'pointer', background: on ? '#DA1B33' : 'transparent', color: on ? '#fff' : 'rgba(255,255,255,0.8)', border: `1px solid ${on ? '#DA1B33' : 'rgba(255,255,255,0.18)'}` }}>{on ? '✓ ' : ''}{sk}</button>
                      })}
                    </div>
                    <Field label="Add a custom skill (press Enter)" wide>
                      <input placeholder="e.g. Coffee, DJ setup…" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v) { toggleSkill(v); e.target.value = '' } } }} style={inp('100%')} />
                    </Field>

                    <div style={{ gridColumn: '1 / -1', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 10 }}>Training &amp; feedback</div>
                    <Field label="Training status">
                      <select value={form.training_status || ''} onChange={e => onField('training_status', e.target.value)} style={inp('100%')}>
                        <option value="">— not set —</option>
                        {TRAINING.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Active on the rota?">
                      <select value={form.active === false ? 'no' : 'yes'} onChange={e => onField('active', e.target.value === 'yes')} style={inp('100%')}>
                        <option value="yes">Yes — can log in &amp; book</option>
                        <option value="no">No — inactive</option>
                      </select>
                    </Field>
                    <Field label="Training progress notes" wide><textarea value={form.training_notes || ''} onChange={e => onField('training_notes', e.target.value)} rows={2} style={{ ...inp('100%'), resize: 'vertical' }} /></Field>
                    <Field label="Feedback notes" wide><textarea value={form.feedback_notes || ''} onChange={e => onField('feedback_notes', e.target.value)} rows={2} style={{ ...inp('100%'), resize: 'vertical' }} /></Field>

                    <div style={{ gridColumn: '1 / -1', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 10 }}>Shift rules &amp; login</div>
                    <Field label="Days / times they CAN'T work" wide>
                      <textarea value={form.work_rules || ''} onChange={e => onField('work_rules', e.target.value)} rows={2} placeholder="e.g. No Mondays · not before 5pm on weekdays · no doubles" style={{ ...inp('100%'), resize: 'vertical' }} />
                    </Field>
                    <Field label={form.has_password ? 'Reset login password (blank = keep current)' : 'Set login password'} wide>
                      <input value={form.password || ''} onChange={e => onField('password', e.target.value)} placeholder={form.has_password ? '•••••• (unchanged)' : 'Give them a password to log in'} style={inp('100%')} />
                    </Field>

                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4 }}>
                      <button onClick={() => remove(s.id)} style={btn('red')}>Remove</button>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setEditing(null)} style={btn('ghost')}>Cancel</button>
                        <button onClick={save} disabled={busy} style={btn('gold')}>{busy ? 'Saving…' : 'Save'}</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => startEdit(s)} style={btn('ghost')}>Edit profile</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && !err && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px 16px', lineHeight: 1.6 }}>
          {q ? `No team members match "${q}".` : <>No team yet. Tap <strong style={{ color: '#fff' }}>+ Add team member</strong> to create their profile — name, contact, next of kin, role, skills, and a login password.</>}
        </div>
      )}

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: '#fff' }}>How it works:</strong> add each team member here with their full profile, set them a <strong style={{ color: '#fff' }}>login password</strong>, and mark the days they can't work. Once they're <span style={{ color: '#34D399' }}>Ready</span> they'll be able to log into the staff portal, set their monthly availability, and pick from the shifts you release — coming in the next update. You (the founder) stay the master login.
      </div>
      </>)}
    </div>
  )
}

function Field({ label, wide, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, gridColumn: wide ? '1 / -1' : 'auto' }}>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {children}
    </label>
  )
}

const chip = { fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFFFFF' }
const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: '#DA1B33', color: '#FFFFFF' }
  if (kind === 'green') return { ...base, background: '#34D399', color: '#06281C' }
  if (kind === 'red') return { ...base, background: 'transparent', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.18)' }
}
const inp = (w) => ({ width: w, minWidth: 0, padding: '8px 10px', fontSize: 13, borderRadius: 7, background: '#000000', border: '1px solid rgba(255,255,255,0.18)', color: '#FFFFFF', outline: 'none', boxSizing: 'border-box' })
