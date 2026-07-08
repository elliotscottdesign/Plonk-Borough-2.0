import React, { useState, useEffect, useRef } from 'react'
import { rotaLoad, rotaAddStaff, rotaSaveStaff, rotaRemoveStaff, rotaRemindStaff, rotaGetDoc, STAFF_ROLES } from '../../rota/api.js'
import { ABILITIES } from '../../rota/roles.js'
import { onboardingComplete, requiresOnboarding, onboardingMissing, SOI_VERSION } from '../../rota/statement.js'
import { openDataUrl } from '../../rota/menuFile.js'
import StatementDoc from '../../rota/StatementDoc.jsx'
import { MODULE_META, cocktailKey } from '../../rota/training.js'
import { SPECS } from '../data/cocktailSpecs.js'
import RotaCalendar from './RotaCalendar.jsx'
import ChecklistLog from './ChecklistLog.jsx'
import TrainingMatrix from './TrainingMatrix.jsx'
import MenuAdmin from './MenuAdmin.jsx'

// ─── Staff Rota — team roster (admin) ────────────────────────────────────────
// Reads/writes the Supabase `staff` table via the `rota` edge function. Each
// member has a full profile (contact, next of kin), a role, the skills/stations
// they're signed off on, training + feedback notes, the days they can't work,
// and a login password for the staff portal (Slice 2). Founder-only (/ops).

const TRAINING = ['Trial', 'In training', 'Signed off']
// Common bar stations/skills — quick-add chips (founder can also type their own).
const SKILL_SUGGESTIONS = ['Till', 'Cocktails', 'Draught', 'Barback', 'Floor', 'Open', 'Close', 'Cellar', 'Cash-up', 'Keyholder']

// Each staff row carries a permanent token; this link logs them straight in.
const PORTAL_URL = 'https://team.nodice.bar/rota'
const loginLink = (s) => `${PORTAL_URL}?t=${s.token}`

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
  const [notes, setNotes] = useState([])       // shift notes board
  const [clocks, setClocks] = useState([])     // actual clock in/out records
  const [trained, setTrained] = useState({})   // staff_id → Set(item_key)
  const [docsBy, setDocsBy] = useState({})     // staff_id → { passport, rtw }
  const [viewSoi, setViewSoi] = useState(false)
  const [showStatement, setShowStatement] = useState(false)   // founder's reference copy of the Statement of Intent
  const openDoc = async (staffId, kind) => { try { const r = await rotaGetDoc(staffId, kind); openDataUrl(r.data) } catch (e) { alert(e.message || 'Not uploaded') } }
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
    try {
      const r = await rotaLoad(); setStaff(r.staff || []); setShifts(r.shifts || []); setClaims(r.claims || []); setNotes(r.notes || []); setClocks(r.clocks || [])
      const t = {}; for (const c of r.training || []) (t[c.staff_id] ||= new Set()).add(c.item_key); setTrained(t)
      const dm = {}; for (const d of r.docs || []) (dm[d.staff_id] ||= {})[d.kind] = true; setDocsBy(dm)
    }
    catch (e) { setErr(e.message || 'Could not load the team.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => { if (editing) editRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [editing])

  const startEdit = (s) => { setEditing(s.id); setForm({ ...s, password: '' }); setViewSoi(false) }
  const onField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleSkill = (sk) => setForm(f => {
    const cur = Array.isArray(f.skills) ? f.skills : []
    return { ...f, skills: cur.includes(sk) ? cur.filter(x => x !== sk) : [...cur, sk] }
  })
  const toggleAbility = (ab) => setForm(f => {
    const cur = Array.isArray(f.abilities) ? f.abilities : []
    return { ...f, abilities: cur.includes(ab) ? cur.filter(x => x !== ab) : [...cur, ab] }
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
        abilities: Array.isArray(form.abilities) ? form.abilities : [],
        training_status: form.training_status, training_notes: form.training_notes,
        feedback_notes: form.feedback_notes, work_rules: form.work_rules, active: form.active !== false,
        dob: form.dob, ni_number: form.ni_number, bank_name: form.bank_name, bank_sort: form.bank_sort, bank_account: form.bank_account,
        hourly_rate: form.hourly_rate === '' ? null : form.hourly_rate,
        target_hours: form.target_hours === '' ? null : form.target_hours,
        employment_type: form.employment_type || null,
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
      {showStatement && (
        <div onClick={() => setShowStatement(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#000', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: 20, maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Reference copy — this is what each team member reads &amp; signs · current version {SOI_VERSION}</div>
              <button onClick={() => setShowStatement(false)} style={{ ...btn('ghost'), padding: '4px 10px', flexShrink: 0 }}>✕ Close</button>
            </div>
            <StatementDoc />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['team', '👥 Team'], ['rota', '🗓️ Rota'], ['checklists', '📋 Checklists'], ['training', '🎓 Training'], ['menus', '🍽️ Menus']].map(([k, lbl]) => (
          <button key={k} onClick={() => setView(k)} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer', background: view === k ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)', border: `1px solid ${view === k ? '#DA1B33' : 'rgba(255,255,255,0.1)'}`, color: view === k ? '#DA1B33' : '#FFFFFF', fontWeight: view === k ? 600 : 400 }}>{lbl}</button>
        ))}
      </div>

      {view === 'rota' ? (
        <RotaCalendar staff={staff} shifts={shifts} claims={claims} notes={notes} clocks={clocks} reload={load} />
      ) : view === 'checklists' ? (
        <ChecklistLog />
      ) : view === 'training' ? (
        <TrainingMatrix staff={staff} />
      ) : view === 'menus' ? (
        <MenuAdmin />
      ) : (<>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 22, color: '#FFFFFF' }}>👥 The team</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            {staff.length} team member{staff.length === 1 ? '' : 's'} · <span style={{ color: '#34D399' }}>{readyN} ready to log in</span>{staff.length - readyN > 0 && <> · <span style={{ color: '#FCD34D' }}>{staff.length - readyN} incomplete</span></>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowStatement(true)} style={btn('ghost')}>📄 Statement of Intent</button>
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
                    {(() => { const mods = MODULE_META.filter(m => trained[s.id]?.has(m.key)).length, ck = SPECS.filter(x => trained[s.id]?.has(cocktailKey(x.id))).length; return (
                      <div style={{ marginTop: 7, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>🎓 <strong style={{ color: mods >= MODULE_META.length ? '#34D399' : '#fff' }}>{mods}/{MODULE_META.length}</strong> training · 🍸 <strong style={{ color: ck >= SPECS.length ? '#34D399' : '#fff' }}>{ck}/{SPECS.length}</strong> cocktails</div>
                    ) })()}
                    {requiresOnboarding(s.role) && (onboardingComplete(s, docsBy[s.id])
                      ? <div style={{ fontSize: 11, color: '#34D399', marginTop: 4 }}>✓ Onboarded — statement signed &amp; details complete</div>
                      : <div style={{ fontSize: 11, color: '#FCD34D', marginTop: 4 }}>⏳ Onboarding: {onboardingMissing(s, docsBy[s.id]).length} to do{s.soi_signed_at ? '' : ' · statement unsigned'} — calendar locked</div>)}
                    {(s.interests || []).length > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 5, lineHeight: 1.5 }}>💡 <strong style={{ color: '#fff' }}>Into:</strong> {(s.interests || []).join(' · ')}</div>}
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

                    <div style={{ gridColumn: '1 / -1', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 10 }}>Trained to work — controls which shifts they can take</div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {ABILITIES.map(a => {
                        const on = (form.abilities || []).includes(a.key)
                        return <button key={a.key} type="button" onClick={() => toggleAbility(a.key)} style={{ padding: '6px 12px', fontSize: 12.5, borderRadius: 999, cursor: 'pointer', background: on ? '#34D399' : 'transparent', color: on ? '#06281C' : 'rgba(255,255,255,0.8)', border: `1px solid ${on ? '#34D399' : 'rgba(255,255,255,0.18)'}`, fontWeight: on ? 700 : 400 }}>{a.icon} {a.label}{on ? ' ✓' : ''}</button>
                      })}
                    </div>

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

                    <div style={{ gridColumn: '1 / -1', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 10 }}>Payroll &amp; right to work</div>
                    <Field label="Date of birth"><input type="date" value={form.dob || ''} onChange={e => onField('dob', e.target.value)} style={inp('100%')} /></Field>
                    <Field label="National Insurance no."><input value={form.ni_number || ''} onChange={e => onField('ni_number', e.target.value)} style={inp('100%')} /></Field>
                    <Field label="Bank — account name"><input value={form.bank_name || ''} onChange={e => onField('bank_name', e.target.value)} style={inp('100%')} /></Field>
                    <Field label="Sort code"><input value={form.bank_sort || ''} onChange={e => onField('bank_sort', e.target.value)} style={inp('100%')} /></Field>
                    <Field label="Account number" wide><input value={form.bank_account || ''} onChange={e => onField('bank_account', e.target.value)} style={inp('100%')} /></Field>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      {docsBy[s.id]?.passport ? <button type="button" onClick={() => openDoc(s.id, 'passport')} style={btn('ghost')}>📄 View passport</button> : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Passport ○ not uploaded</span>}
                      {docsBy[s.id]?.rtw ? <button type="button" onClick={() => openDoc(s.id, 'rtw')} style={btn('ghost')}>📄 View right-to-work</button> : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Right-to-work ○ not uploaded</span>}
                    </div>
                    <div style={{ gridColumn: '1 / -1', fontSize: 11.5, color: s.soi_signed_at ? '#34D399' : '#FCD34D', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {s.soi_signed_at ? `✓ Statement signed by ${s.soi_signature || s.name} on ${new Date(s.soi_signed_at).toLocaleDateString('en-GB')}` : '○ Statement of Intent not signed yet'}
                      {s.soi_signed_at && <button type="button" onClick={() => setViewSoi(v => !v)} style={{ ...btn('ghost'), padding: '4px 10px' }}>{viewSoi ? 'Hide' : '📄 View / print'}</button>}
                    </div>
                    {viewSoi && s.soi_signed_at && <div style={{ gridColumn: '1 / -1' }}><StatementDoc signature={s.soi_signature} signedAt={s.soi_signed_at} version={s.soi_version} name={s.name} /></div>}

                    <div style={{ gridColumn: '1 / -1', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 10 }}>Pay &amp; hours <span style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'none', letterSpacing: 0 }}>· management only, never shown to staff</span></div>
                    <Field label="Hourly rate (£)">
                      <input type="number" min={0} step="0.25" value={form.hourly_rate ?? ''} onChange={e => onField('hourly_rate', e.target.value)} placeholder="e.g. 13.50" style={inp('100%')} />
                    </Field>
                    <Field label="Target hours / week">
                      <input type="number" min={0} max={60} step="1" value={form.target_hours ?? ''} onChange={e => onField('target_hours', e.target.value)} placeholder="e.g. 40 full-time, 20 part-time" style={inp('100%')} />
                    </Field>
                    <Field label="Employment type" wide>
                      <select value={form.employment_type || ''} onChange={e => onField('employment_type', e.target.value)} style={inp('100%')}>
                        <option value="">— not set —</option>
                        {['Full-time', 'Part-time', 'Casual'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>

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
                  <CardActions s={s} onEdit={() => startEdit(s)} />
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

// Founder-only footer on each Team card: the staffer's login (email + password,
// so the founder can read/relay it) plus three one-tap ways to send them their
// personal login link — copy, WhatsApp, or a branded email (server-sent).
function CardActions({ s, onEdit }) {
  const [copied, setCopied] = useState('')       // '' | 'link' | 'pw'
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showPw, setShowPw] = useState(false)    // password hidden until the founder taps "show"
  const link = loginLink(s)
  const inactive = s.active === false
  const canSend = !!s.token && !inactive         // the link only works with a token and an active account
  const copy = async (text, tag) => {
    try { await navigator.clipboard.writeText(text); setCopied(tag); setTimeout(() => setCopied(''), 2000) }
    catch { window.prompt('Copy this:', text) }   // clipboard blocked → show it so nothing is lost
  }
  const whatsapp = () => {
    // Best-effort UK normalisation (mirrors the DJ roster): strip 00 / +, turn a
    // leading 0 into 44. Blank = open WhatsApp so the founder picks the contact.
    let d = (s.phone || '').replace(/\D/g, '')
    if (d.startsWith('00')) d = d.slice(2)
    else if (d.startsWith('0')) d = '44' + d.slice(1)
    const msg = `Hi ${(s.name || '').split(' ')[0]}! Here's your No Dice staff login — tap to go straight in, no password needed:\n${link}`
    window.open(`https://wa.me/${d}?text=${encodeURIComponent(msg)}`, '_blank')
  }
  const emailLink = async () => {
    if (!s.email) { alert('Add an email for this person first, then you can send their login.'); return }
    setSending(true)
    try { await rotaRemindStaff(s.id); setSent(true); setTimeout(() => setSent(false), 4000) }
    catch (e) { alert(e.message || 'Could not send the email.') } finally { setSending(false) }
  }
  const code = { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, padding: '1px 6px' }
  const mini = { background: 'none', border: 'none', color: '#DA1B33', fontWeight: 700, fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline' }
  const off = { opacity: 0.4, cursor: 'not-allowed' }
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
        <span>🔑 Login</span>
        {s.email ? <code style={code}>{s.email}</code> : <span style={{ color: '#FCD34D' }}>no email yet</span>}
        <span style={{ opacity: 0.4 }}>·</span>
        {s.password
          ? <><code style={code}>{showPw ? s.password : '••••••••'}</code>
              <button onClick={() => setShowPw(v => !v)} style={mini}>{showPw ? 'hide' : 'show'}</button>
              <button onClick={() => copy(s.password, 'pw')} style={mini}>{copied === 'pw' ? 'Copied ✓' : 'copy'}</button></>
          : <span style={{ color: '#FCD34D' }}>no password set</span>}
      </div>
      {canSend && !s.password && (
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>The login link works even without a password — they just tap it.</div>
      )}
      {inactive && (
        <div style={{ fontSize: 10.5, color: '#FCD34D', marginBottom: 8 }}>Inactive — reactivate them (Edit profile) to send a working login.</div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button onClick={() => copy(link, 'link')} disabled={!canSend} title={canSend ? '' : (inactive ? 'Reactivate first' : 'No login link yet')} style={{ ...btn('ghost'), ...(canSend ? {} : off) }}>{copied === 'link' ? 'Copied ✓' : '🔗 Copy link'}</button>
        <button onClick={whatsapp} disabled={!canSend} title={!canSend ? (inactive ? 'Reactivate first' : 'No login link yet') : (s.phone ? '' : 'No number saved — WhatsApp will let you pick the contact')} style={{ ...btn('ghost'), color: '#25D366', borderColor: 'rgba(37,211,102,0.45)', ...(canSend ? {} : off) }}>WhatsApp</button>
        <button onClick={emailLink} disabled={sending || !canSend || !s.email} title={!s.email ? 'Add an email first' : (canSend ? '' : 'Reactivate first')} style={{ ...btn('ghost'), ...((canSend && s.email) ? {} : off) }}>{sent ? 'Sent ✓' : sending ? 'Sending…' : '✉️ Email login'}</button>
        <button onClick={onEdit} style={btn('ghost')}>Edit profile</button>
      </div>
    </div>
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
