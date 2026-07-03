import React, { useState, useEffect } from 'react'
import { rotaLogin, rotaMyState, rotaSaveProfile, rotaSaveAvailability, rotaClaimShift, rotaReleaseShift, rotaGetChecklist, rotaToggleChecklist, rotaSaveChecklistMeta } from './api.js'
import { shiftsForDate, fmtMin, shiftTimeLabel, shiftHours, dayName, minToHHMM } from './shifts.js'
import { CHECKLISTS, CHECKLIST_ORDER, checklistCount, doneCount } from './checklists.js'

// ─── Staff Rota portal (/rota) ───────────────────────────────────────────────
// Team members log in with their email + password, set the days they're
// available each month, and pick from the shifts the founder has released.
// Token-authed (login → token in localStorage). Founder stays the master login.

const RED = '#DA1B33', GREEN = '#34D399', AMBER = '#F59E0B', BG = '#0B0B0C', CARD = '#111113', LINE = 'rgba(255,255,255,0.12)'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const TOKEN_KEY = 'nd_rota_token'

// Reusable month grid (weeks start Monday, UTC math). renderDay(dateStr,dayNum)
// returns the cell's inner content; clickable(dateStr) gates taps.
function MiniCal({ year, month, onPrev, onNext, canPrev, renderDay, onDay, clickable, selected }) {
  const startDow = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7) cells.push(null)
  return (
    <div style={{ background: '#000', border: `1px solid ${LINE}`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={onPrev} disabled={!canPrev} style={{ background: 'transparent', border: 'none', color: canPrev ? RED : 'rgba(255,255,255,0.2)', fontSize: 16, cursor: canPrev ? 'pointer' : 'default', padding: '4px 12px' }}>◀</button>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{MONTHS[month]} {year}</div>
        <button onClick={onNext} style={{ background: 'transparent', border: 'none', color: RED, fontSize: 16, cursor: 'pointer', padding: '4px 12px' }}>▶</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 5 }}>
        {DOW.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const ds = iso(year, month, d)
          const ok = clickable(ds)
          return (
            <button key={i} type="button" disabled={!ok} onClick={() => ok && onDay(ds)}
              style={{ minHeight: 46, borderRadius: 8, padding: '3px 3px 4px', textAlign: 'left', background: '#000', color: '#fff', cursor: ok ? 'pointer' : 'default', opacity: ok ? 1 : 0.4, border: selected === ds ? `2px solid ${RED}` : `1px solid ${LINE}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {renderDay(ds, d)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const Avatar = ({ name, size = 34 }) => {
  const initials = (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = [...(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `hsl(${hue} 42% 26%)`, color: '#fff', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
}

export default function RotaPortal() {
  const [token, setToken] = useState(() => (typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null))
  const [staff, setStaff] = useState(null)
  const [shifts, setShifts] = useState([])
  const [availability, setAvailability] = useState({})   // { 'YYYY-MM': { 'YYYY-MM-DD': {...} } }
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [view, setView] = useState('shifts')             // 'shifts' | 'availability' | 'profile'
  const now = new Date()
  const [vy, setVy] = useState(now.getFullYear())
  const [vm, setVm] = useState(now.getMonth())
  const [selDate, setSelDate] = useState(null)
  const [login, setLogin] = useState({ email: '', password: '' })

  useEffect(() => {
    document.body.style.background = BG; document.body.style.color = '#fff'; document.title = 'No Dice · Staff Rota'
  }, [])
  useEffect(() => {
    if (!token) { setReady(true); return }
    loadState(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadState = async (t) => {
    try {
      const r = await rotaMyState(t)
      setStaff(r.staff); setShifts(r.shifts || []); setAvailability(r.availability || {}); setErr('')
    } catch (e) {
      if (/log in/i.test(e.message)) { logout() } else setErr(e.message)
    } finally { setReady(true) }
  }
  const doLogin = async (e) => {
    e?.preventDefault?.()
    if (!login.email.trim() || !login.password) { setErr('Enter your email and password.'); return }
    setBusy(true); setErr('')
    try {
      const r = await rotaLogin(login.email.trim(), login.password)
      localStorage.setItem(TOKEN_KEY, r.token); setToken(r.token)
      setStaff(r.staff); await loadState(r.token)
    } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); setStaff(null); setShifts([]); setAvailability({}) }
  // A stale token can go 401 mid-session ("Please log in again.") — clear it and
  // bounce to login rather than alerting on every action.
  const handleErr = (e) => { if (/log in/i.test(e.message || '')) logout(); else alert(e.message) }

  const monthKey = `${vy}-${String(vm + 1).padStart(2, '0')}`
  const atCurrentMonth = vy === now.getFullYear() && vm === now.getMonth()
  const todayStr = iso(now.getFullYear(), now.getMonth(), now.getDate())
  const stepMonth = (d) => { let m = vm + d, y = vy; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } setVy(y); setVm(m); setSelDate(null) }

  const shiftsByDate = {}
  for (const s of shifts) (shiftsByDate[s.date] ||= []).push(s)
  for (const arr of Object.values(shiftsByDate)) arr.sort((a, b) => (a.start_min || 0) - (b.start_min || 0))
  const monthAvail = availability[monthKey] || {}
  const availOn = (ds) => !!(availability[ds.slice(0, 7)] || {})[ds]

  // ── Availability: toggle a day, persist the whole month map ─────────────────
  const toggleAvail = async (ds) => {
    if (ds < todayStr) return
    const mk = ds.slice(0, 7)
    const monthMap = availability[mk] || {}
    const wasOn = !!monthMap[ds], prevEntry = monthMap[ds]
    const sh = shiftsForDate(ds)
    const newEntry = wasOn ? undefined : (sh.length ? { from: minToHHMM(sh[0].start), to: minToHHMM(sh[sh.length - 1].end) } : { available: true })
    // Apply/revert only THIS day on the freshest state, so a fast toggle of
    // another day isn't clobbered if one save fails.
    const setDay = (a, entry) => { const cur = { ...(a[mk] || {}) }; if (entry === undefined) delete cur[ds]; else cur[ds] = entry; return { ...a, [mk]: cur } }
    const posted = setDay(availability, newEntry)[mk]
    setAvailability(a => setDay(a, newEntry))   // optimistic
    try { await rotaSaveAvailability(token, mk, posted) }
    catch (e) { setAvailability(a => setDay(a, wasOn ? prevEntry : undefined)); handleErr(e) }
  }

  const act = async (fn) => { setBusy(true); try { await fn(); await loadState(token) } catch (e) { handleErr(e) } finally { setBusy(false) } }
  const claim = (id) => act(() => rotaClaimShift(token, id))
  const release = (id) => act(() => rotaReleaseShift(token, id))
  const saveProfile = async (patch) => { setBusy(true); try { const r = await rotaSaveProfile(token, patch); setStaff(r.staff) } catch (e) { handleErr(e) } finally { setBusy(false) } }

  // ── Render states ───────────────────────────────────────────────────────────
  if (!ready) return <Center>Loading…</Center>

  if (!token || !staff) {
    return (
      <Shell>
        <div style={{ maxWidth: 380, margin: '8vh auto 0', padding: '0 4px' }}>
          <div className="serif" style={{ fontSize: 26, color: '#fff', marginBottom: 4 }}>No Dice · Staff</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 22 }}>Log in to set your availability and pick your shifts.</div>
          <form onSubmit={doLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={login.email} onChange={e => setLogin(l => ({ ...l, email: e.target.value }))} placeholder="Email" autoComplete="username" style={inp} />
            <input value={login.password} onChange={e => setLogin(l => ({ ...l, password: e.target.value }))} placeholder="Password" type="password" autoComplete="current-password" style={inp} />
            {err && <div style={{ fontSize: 12.5, color: '#F87171' }}>{err}</div>}
            <button type="submit" disabled={busy} style={{ ...btn('red'), padding: '11px', fontSize: 14, marginTop: 4 }}>{busy ? 'Logging in…' : 'Log in'}</button>
          </form>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 16, lineHeight: 1.6 }}>No login yet? Ask the manager to add you and set your password.</div>
        </div>
      </Shell>
    )
  }

  const TABS = [['shifts', '🗓️', 'Shifts'], ['availability', '✅', 'Availability'], ['checklists', '📋', 'Checklists'], ['profile', '👤', 'Profile']]

  return (
    <Shell>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '18px 14px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar name={staff.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staff.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{staff.role || 'Team'}{staff.training_status ? ` · ${staff.training_status}` : ''}</div>
          </div>
          <button onClick={logout} style={btn('ghost')}>Log out</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 16 }}>
          {TABS.map(([k, ic, lbl]) => (
            <button key={k} onClick={() => { setView(k); setSelDate(null) }} style={{ padding: '10px 6px', fontSize: 12.5, borderRadius: 8, cursor: 'pointer', background: view === k ? 'rgba(218,27,51,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${view === k ? RED : LINE}`, color: view === k ? '#fff' : 'rgba(255,255,255,0.8)', fontWeight: view === k ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ic} {lbl}</button>
          ))}
        </div>

        {view === 'availability' && (
          <>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginTop: 0 }}>Tap the days you can work this month. <strong style={{ color: GREEN }}>Green = available.</strong> You can only pick shifts on days you've marked. Saved automatically.</p>
            <MiniCal year={vy} month={vm} onPrev={() => stepMonth(-1)} onNext={() => stepMonth(1)} canPrev={!atCurrentMonth}
              clickable={(ds) => ds >= todayStr} onDay={toggleAvail} selected={null}
              renderDay={(ds, d) => {
                const on = !!monthAvail[ds]
                return (<>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{d}</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                    {on && <span style={{ fontSize: 9, color: GREEN, fontWeight: 700 }}>✓ free</span>}
                  </div>
                </>)
              }} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>{Object.keys(monthAvail).length} day{Object.keys(monthAvail).length === 1 ? '' : 's'} marked available in {MONTHS[vm]}.</div>
          </>
        )}

        {view === 'shifts' && (
          <>
            {Object.keys(monthAvail).length === 0 && (
              <div style={{ fontSize: 12.5, color: '#FCD34D', background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.25)', borderRadius: 8, padding: '9px 12px', marginBottom: 12, lineHeight: 1.5 }}>
                You haven't marked any availability for {MONTHS[vm]} yet — set it on the <strong style={{ color: '#fff' }}>Availability</strong> tab, then pick shifts here.
              </div>
            )}
            <MiniCal year={vy} month={vm} onPrev={() => stepMonth(-1)} onNext={() => stepMonth(1)} canPrev={!atCurrentMonth}
              clickable={(ds) => (shiftsByDate[ds] || []).length > 0 && ds >= todayStr} onDay={setSelDate} selected={selDate}
              renderDay={(ds, d) => {
                const rows = shiftsByDate[ds] || []
                const mineN = rows.filter(s => s.mine).length
                const openN = rows.filter(s => !s.mine && s.filled < (s.headcount ?? 1)).length
                return (<>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{d}</span>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-end', flex: 1 }}>
                    {mineN > 0 && <span style={{ fontSize: 8.5, color: GREEN, fontWeight: 700 }}>✓{mineN}</span>}
                    {openN > 0 && availOn(ds) && <span style={{ width: 6, height: 6, borderRadius: '50%', background: RED }} />}
                  </div>
                </>)
              }} />
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', marginTop: 8, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span><span style={{ color: GREEN }}>✓</span> you're on</span><span><span style={{ color: RED }}>●</span> shifts you can grab</span>
            </div>

            {selDate && (() => {
              const rows = shiftsByDate[selDate] || []
              const avail = availOn(selDate)
              return (
                <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="serif" style={{ fontSize: 17, color: '#fff' }}>{dayName(selDate)} {selDate.slice(8)} {MONTHS[+selDate.slice(5, 7) - 1]}</div>
                    <button onClick={() => setSelDate(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer' }}>✕</button>
                  </div>
                  {!avail && <div style={{ fontSize: 12, color: '#FCD34D' }}>You're not marked available this day. Mark it on the Availability tab to grab a shift.</div>}
                  {rows.map(sh => {
                    const need = sh.headcount ?? 1
                    const full = sh.filled >= need
                    return (
                      <div key={sh.id} style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${sh.mine ? GREEN : full ? 'rgba(255,255,255,0.25)' : RED}`, paddingLeft: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{sh.label} <span style={{ color: RED, fontWeight: 700 }}>{shiftTimeLabel(sh)}</span></div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{shiftHours(sh)}h · {sh.filled}/{need} filled</div>
                        </div>
                        {sh.mine
                          ? <button onClick={() => release(sh.id)} disabled={busy} style={btn('ghost')}>You're on · drop</button>
                          : full
                            ? <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Full</span>
                            : <button onClick={() => claim(sh.id)} disabled={busy || !avail} style={btn(avail ? 'red' : 'muted')}>Grab it</button>}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </>
        )}

        {view === 'checklists' && <ChecklistView token={token} />}

        {view === 'profile' && (
          <ProfileView staff={staff} onSave={saveProfile} busy={busy} />
        )}
      </div>
    </Shell>
  )
}

// Shift checklists — pick opening / during / closing, tick tasks on your phone.
// Every tap autosaves; "Submit" marks it done for the founder to see.
function ChecklistView({ token }) {
  const dateNow = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  const [today, setToday] = useState(dateNow)   // re-derived each loadAll so a new day (reopened) is correct
  const [subs, setSubs] = useState({})
  const [openKey, setOpenKey] = useState(null)
  const [items, setItems] = useState({})
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [savedAt, setSavedAt] = useState(false)

  useEffect(() => { loadAll() }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  const loadAll = async () => {
    const t = dateNow(); setToday(t); setLoading(true)
    try {
      const res = await Promise.all(CHECKLIST_ORDER.map(k => rotaGetChecklist(token, t, k)))
      const m = {}; CHECKLIST_ORDER.forEach((k, i) => { m[k] = res[i].submission })
      setSubs(m)
    } catch (e) { /* leave empty; portal-level handleErr covers auth */ } finally { setLoading(false) }
  }
  const open = (k) => { const s = subs[k]; setItems(s?.items || {}); setNote(s?.note || ''); setOpenKey(k); setSavedAt(false) }
  // Each task toggle is an atomic per-item save (two phones can tick at once).
  const toggle = (text) => {
    const on = !items[text]
    const next = { ...items }; if (on) next[text] = true; else delete next[text]
    setItems(next)
    setSubs(s => ({ ...s, [openKey]: { ...(s[openKey] || {}), items: next } }))
    rotaToggleChecklist(token, today, openKey, text, on).then(() => setSavedAt(true))
      .catch(e => { setItems(p => { const r = { ...p }; if (on) delete r[text]; else r[text] = true; return r }); alert(e.message) })
  }
  // Note + submit (submit is sticky on the server).
  const saveMeta = (submit) => {
    setBusy(true)
    rotaSaveChecklistMeta(token, today, openKey, note, submit)
      .then(() => { setSubs(s => ({ ...s, [openKey]: { ...(s[openKey] || {}), note, submitted: submit || s[openKey]?.submitted } })); setSavedAt(true) })
      .catch(e => alert(e.message)).finally(() => setBusy(false))
  }
  const submit = () => saveMeta(true)

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Loading checklists…</div>

  // Overview: the three checklists for today.
  if (!openKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>Today · {dayName(today)} {today.slice(8)}. Tick tasks as you go — it saves automatically.</div>
        {CHECKLIST_ORDER.map(k => {
          const c = CHECKLISTS[k], total = checklistCount(k), done = doneCount(k, subs[k]?.items || {}), sub = subs[k]?.submitted
          return (
            <button key={k} onClick={() => open(k)} style={{ textAlign: 'left', background: CARD, border: `1px solid ${sub ? 'rgba(52,211,153,0.4)' : LINE}`, borderRadius: 12, padding: 14, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 24 }}>{c.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{c.title} {sub && <span style={{ fontSize: 10, color: GREEN, fontWeight: 700 }}>✓ submitted</span>}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{done}/{total} done</div>
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', marginTop: 7, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${total ? Math.round((done / total) * 100) : 0}%`, background: done >= total ? GREEN : RED }} />
                </div>
              </div>
              <div style={{ color: RED, fontSize: 18 }}>›</div>
            </button>
          )
        })}
      </div>
    )
  }

  // Open one checklist.
  const c = CHECKLISTS[openKey], total = checklistCount(openKey), done = doneCount(openKey, items)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => { setOpenKey(null); loadAll() }} style={btn('ghost')}>‹ Back</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{c.icon} {c.title}</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>{done}/{total} done{busy ? ' · saving…' : savedAt ? ' · saved ✓' : ''}</div>
        </div>
      </div>

      {c.sections.map((sec, si) => (
        <div key={si} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
          {c.sections.length > 1 && <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: RED, fontWeight: 700, padding: '10px 14px 4px' }}>{sec.title}</div>}
          {sec.items.map((text, ii) => {
            const on = !!items[text]
            return (
              <button key={ii} onClick={() => toggle(text)} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, width: '100%', textAlign: 'left', padding: '11px 14px', background: on ? 'rgba(52,211,153,0.07)' : 'transparent', border: 'none', borderTop: ii === 0 && !(c.sections.length > 1) ? 'none' : `1px solid rgba(255,255,255,0.06)`, cursor: 'pointer', color: '#fff' }}>
                <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, border: `2px solid ${on ? GREEN : 'rgba(255,255,255,0.3)'}`, background: on ? GREEN : 'transparent', color: '#06281C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, marginTop: 1 }}>{on ? '✓' : ''}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.4, color: on ? 'rgba(255,255,255,0.55)' : '#fff', textDecoration: on ? 'line-through' : 'none' }}>{text}</span>
              </button>
            )
          })}
        </div>
      ))}

      <textarea value={note} onChange={e => setNote(e.target.value)} onBlur={() => saveMeta(false)} placeholder="Anything to flag? (low stock, breakages, issues…)" rows={2} style={{ ...inp, resize: 'vertical' }} />

      <button onClick={submit} disabled={busy} style={{ ...btn(subs[openKey]?.submitted ? 'ghost' : 'red'), padding: '13px', fontSize: 14, width: '100%' }}>
        {subs[openKey]?.submitted ? '✓ Submitted — tap to re-submit' : `Submit ${c.title.toLowerCase()} checklist`}
      </button>
    </div>
  )
}

function ProfileView({ staff, onSave, busy }) {
  const [f, setF] = useState({
    name: staff.name || '', phone: staff.phone || '', address: staff.address || '',
    emergency_name: staff.emergency_name || '', emergency_phone: staff.emergency_phone || '', emergency_relation: staff.emergency_relation || '',
  })
  const on = (k, v) => setF(s => ({ ...s, [k]: v }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Set by the manager</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {staff.role && <span style={chip}>{staff.role}</span>}
          {(staff.skills || []).map((s, i) => <span key={i} style={chip}>{s}</span>)}
          {staff.training_status && <span style={{ ...chip, color: GREEN, borderColor: 'rgba(52,211,153,0.4)' }}>{staff.training_status}</span>}
        </div>
        {staff.training_notes && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 10, lineHeight: 1.5 }}><strong style={{ color: '#fff' }}>Training:</strong> {staff.training_notes}</div>}
        {staff.feedback_notes && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.5 }}><strong style={{ color: '#fff' }}>Feedback:</strong> {staff.feedback_notes}</div>}
        {staff.work_rules && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 6, lineHeight: 1.5 }}><strong style={{ color: '#fff' }}>Notes:</strong> {staff.work_rules}</div>}
      </div>

      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ gridColumn: '1 / -1', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Your details — keep these up to date</div>
        <L label="Full name" wide><input value={f.name} onChange={e => on('name', e.target.value)} style={inp} /></L>
        <L label="Phone"><input value={f.phone} onChange={e => on('phone', e.target.value)} style={inp} /></L>
        <L label="Email (login)"><input value={staff.email || ''} disabled style={{ ...inp, opacity: 0.55 }} /></L>
        <L label="Home address" wide><input value={f.address} onChange={e => on('address', e.target.value)} style={inp} /></L>
        <div style={{ gridColumn: '1 / -1', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', borderTop: `1px dashed ${LINE}`, paddingTop: 10 }}>Next of kin / emergency contact</div>
        <L label="Name"><input value={f.emergency_name} onChange={e => on('emergency_name', e.target.value)} style={inp} /></L>
        <L label="Their phone"><input value={f.emergency_phone} onChange={e => on('emergency_phone', e.target.value)} style={inp} /></L>
        <L label="Relationship" wide><input value={f.emergency_relation} onChange={e => on('emergency_relation', e.target.value)} style={inp} /></L>
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => onSave(f)} disabled={busy} style={btn('red')}>{busy ? 'Saving…' : 'Save details'}</button>
        </div>
      </div>
    </div>
  )
}

const L = ({ label, wide, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 3, gridColumn: wide ? '1 / -1' : 'auto' }}>
    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    {children}
  </label>
)
const Shell = ({ children }) => <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>{children}</div>
const Center = ({ children }) => <Shell><div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{children}</div></Shell>

const chip = { fontSize: 10.5, padding: '3px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff' }
const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'red') return { ...base, background: RED, color: '#fff' }
  if (kind === 'muted') return { ...base, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: `1px solid ${LINE}`, cursor: 'default' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }
}
const inp = { width: '100%', minWidth: 0, padding: '10px 12px', fontSize: 14, borderRadius: 8, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none', boxSizing: 'border-box' }
