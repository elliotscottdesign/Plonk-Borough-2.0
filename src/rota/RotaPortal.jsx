import React, { useState, useEffect } from 'react'
import { rotaLogin, rotaSignup, rotaMyState, rotaSaveProfile, rotaSaveAvailability, rotaClaimShift, rotaReleaseShift, rotaGetChecklist, rotaToggleChecklist, rotaSaveChecklistMeta, rotaSignStatement, rotaUploadDoc, rotaAddShiftNote, rotaDeleteShiftNote, rotaClockIn, rotaClockOut } from './api.js'
import { calendarLocked, onboardingComplete, ONBOARDING_STEPS, requiresOnboarding } from './statement.js'
import { fileToDataUrl } from './menuFile.js'
import { resizeImage } from '../dj/api.js'
import StatementDoc from './StatementDoc.jsx'
import { fmtMin, shiftTimeLabel, shiftHours, dayName, fmtClockTime, workedMins, hoursLabel } from './shifts.js'
import { getFix, presenceBadge } from './geo.js'
import { canWork, whyCantWork, abilityLabel, abilityIcon, rankLabel, ABILITIES } from './roles.js'
import { CHECKLISTS, CHECKLIST_ORDER, checklistSections, checklistCount, doneCount } from './checklists.js'
import { rotaMenus } from './api.js'
import { openMenu } from './menuFile.js'
import TrainingView from './TrainingView.jsx'
import CocktailSpecs from '../ops/sections/CocktailSpecs.jsx'
import KitchenChecklists from '../kitchen/KitchenChecklists.jsx'

// ─── Staff Rota portal (/rota) ───────────────────────────────────────────────
// Team members log in with their email + password, set the days they're
// available each month, and pick from the shifts the founder has released.
// Token-authed (login → token in localStorage). Founder stays the master login.

// Match the DJ portal exactly — the No Dice portal brand: red on pure black.
const RED = '#DA1B33', GREEN = '#34D399', AMBER = '#F59E0B', BG = '#000000', CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const TOKEN_KEY = 'nd_rota_token'
const INTEREST_SUGGESTIONS = ['Gardening', 'Painting', 'Carpentry', 'Sign-writing', 'Cooking', 'Photography', 'DJ / music', 'Plants', 'Art & design', 'Coffee', 'Sports', 'Gaming']

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
  const [training, setTraining] = useState([])            // completed item_keys
  const [notes, setNotes] = useState([])                  // shift notes (briefings + handovers)
  const [notePopup, setNotePopup] = useState([])          // today's manager briefings shown on open
  const [clock, setClock] = useState(null)                // today's clock in/out
  const [clocks, setClocks] = useState([])                // clock history (past ~90 days), for past-shift actual times
  const [clockMsg, setClockMsg] = useState('')            // transient note after a clock-in (e.g. off-site flag)
  const [rosteredToday, setRosteredToday] = useState(false)
  const [docs, setDocs] = useState({})                    // { passport: bool, rtw: bool }
  const [kitchen, setKitchen] = useState(null)            // { isKitchen, shiftId, date } — food-safety gate
  const [availability, setAvailability] = useState({})   // { 'YYYY-MM': { 'YYYY-MM-DD': {...} } }
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [view, setView] = useState(() => {               // 'shifts' | 'availability' | 'profile' … (deep-linkable via ?tab=)
    const t = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : '') || ''
    return ['shifts', 'notes', 'availability', 'checklists', 'training', 'menus', 'cocktails', 'profile'].includes(t) ? t : 'shifts'
  })
  const now = new Date()
  const [vy, setVy] = useState(now.getFullYear())
  const [vm, setVm] = useState(now.getMonth())
  const [selDate, setSelDate] = useState(null)
  const [login, setLogin] = useState({ name: '', password: '' })
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const joinCode = params.get('join')
  const magicToken = params.get('t')   // personal login link the founder shares — logs straight in
  const preview = params.get('preview') === '1'   // founder's mirror: adopt the token for THIS session only, don't persist
  const [mode, setMode] = useState(joinCode ? 'signup' : 'login')   // 'login' | 'signup'
  const [signup, setSignup] = useState({ name: '', email: '', password: '' })

  useEffect(() => {
    document.body.style.background = BG; document.body.style.color = '#fff'; document.title = 'No Dice · Staff Rota'
  }, [])
  useEffect(() => {
    // A shared login link (?t=<token>) is authoritative — adopt it, then wipe it
    // from the address bar so the token isn't left on screen or re-shared.
    if (magicToken) {
      // Founder preview: use the token for this tab only — don't write it to
      // localStorage or wipe the URL, so the founder's own /rota login is untouched.
      if (preview) { setToken(magicToken); loadState(magicToken); return }
      localStorage.setItem(TOKEN_KEY, magicToken); setToken(magicToken)
      try { window.history.replaceState({}, '', window.location.pathname) } catch { /* ignore */ }
      loadState(magicToken); return
    }
    if (!token) { setReady(true); return }
    loadState(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadState = async (t) => {
    try {
      const r = await rotaMyState(t)
      setStaff(r.staff); setShifts(r.shifts || []); setAvailability(r.availability || {}); setTraining(r.training || []); setDocs(r.docs || {}); setNotes(r.notes || []); setClock(r.clock || null); setClocks(r.clocks || []); setRosteredToday(!!r.rosteredToday); setKitchen(r.kitchen || null); setErr('')
      // Pop up today's management briefings the member hasn't dismissed yet.
      const today = new Date().toISOString().slice(0, 10)
      let seen = []; try { seen = JSON.parse(localStorage.getItem('nd_notes_seen') || '[]') } catch { seen = [] }
      const fresh = (r.notes || []).filter(n => n.kind === 'manager' && n.date === today && !seen.includes(n.id))
      if (fresh.length) setNotePopup(fresh)
    } catch (e) {
      if (/log in/i.test(e.message)) { logout() } else setErr(e.message)
    } finally { setReady(true) }
  }
  const dismissNotePopup = () => {
    try {
      const seen = JSON.parse(localStorage.getItem('nd_notes_seen') || '[]')
      localStorage.setItem('nd_notes_seen', JSON.stringify([...new Set([...seen, ...notePopup.map(n => n.id)])].slice(-200)))
    } catch { /* ignore */ }
    setNotePopup([])
  }
  const doLogin = async (e) => {
    e?.preventDefault?.()
    if (!login.name.trim() || !login.password) { setErr('Enter your name and password.'); return }
    setBusy(true); setErr('')
    try {
      const r = await rotaLogin(login.name.trim(), login.password)
      localStorage.setItem(TOKEN_KEY, r.token); setToken(r.token)
      setStaff(r.staff); await loadState(r.token)
    } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }
  const doSignup = async (e) => {
    e?.preventDefault?.()
    if (!signup.name.trim() || !signup.email.trim() || !signup.password) { setErr('Fill in your name, email and a password.'); return }
    setBusy(true); setErr('')
    try {
      const r = await rotaSignup(signup.name.trim(), signup.email.trim(), signup.password, joinCode || '')
      localStorage.setItem(TOKEN_KEY, r.token); setToken(r.token)
      setStaff(r.staff); await loadState(r.token)
    } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); setStaff(null); setShifts([]); setAvailability({}); setTraining([]) }
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
  const dayOff = (ds) => !!((availability[ds.slice(0, 7)] || {})[ds] || {}).unavailable
  const availOn = (ds) => !dayOff(ds)   // available by default; only an explicit off-mark blocks

  // ── Availability: mark a day OFF / clear it, persist the whole month map ─────
  // Everyone's available by default — a day only counts as "off" when its entry is
  // { unavailable: true }. Marking off never touches a shift you're already on
  // (availability and bookings are separate); we just warn so you tell your manager.
  const toggleAvail = async (ds) => {
    if (ds < todayStr) return
    const mk = ds.slice(0, 7)
    const monthMap = availability[mk] || {}
    const wasOff = !!(monthMap[ds] || {}).unavailable, prevEntry = monthMap[ds]
    if (!wasOff) {
      const booked = (shiftsByDate[ds] || []).some(s => s.mine)
      if (booked && !window.confirm(`You're booked to work ${dayName(ds)} ${ds.slice(8)}/${ds.slice(5, 7)}.\n\nMarking yourself off won't cancel that shift — it stays booked. Let your manager know if you need cover.\n\nMark the day off anyway?`)) return
    }
    const newEntry = wasOff ? undefined : { unavailable: true }
    // Apply/revert only THIS day on the freshest state, so a fast toggle of
    // another day isn't clobbered if one save fails. Revert restores the exact
    // prior entry (never deletes anything the save didn't create).
    const setDay = (a, entry) => { const cur = { ...(a[mk] || {}) }; if (entry === undefined) delete cur[ds]; else cur[ds] = entry; return { ...a, [mk]: cur } }
    const posted = setDay(availability, newEntry)[mk]
    setAvailability(a => setDay(a, newEntry))   // optimistic
    try { await rotaSaveAvailability(token, mk, posted) }
    catch (e) { setAvailability(a => setDay(a, prevEntry)); handleErr(e) }
  }

  const act = async (fn) => { setBusy(true); try { await fn(); await loadState(token) } catch (e) { handleErr(e) } finally { setBusy(false) } }
  const claim = (id) => act(() => rotaClaimShift(token, id))
  const release = (id) => act(() => rotaReleaseShift(token, id))
  const saveProfile = async (patch) => { setBusy(true); try { const r = await rotaSaveProfile(token, patch); setStaff(r.staff) } catch (e) { handleErr(e) } finally { setBusy(false) } }
  const doClockIn = async () => {
    setBusy(true); setClockMsg('')
    try {
      const fix = await getFix()                          // one-off location check (null if denied — never blocks)
      const r = await rotaClockIn(token, fix)
      setClock(r.clock)
      if (r.presence === 'off-site' || r.presence === 'unverified')
        setClockMsg("Clocked in ✓ — we couldn't confirm you're at No Dice, so your manager will just double-check this one.")
    } catch (e) { handleErr(e) } finally { setBusy(false) }
  }
  const doClockOut = async () => {
    if (!window.confirm('End your shift now? This records your finish time.')) return
    setBusy(true); setClockMsg('')
    try {
      const fix = await getFix()
      const r = await rotaClockOut(token, fix)
      setClock(r.clock)
    } catch (e) { handleErr(e) } finally { setBusy(false) }
  }

  // ── Render states ───────────────────────────────────────────────────────────
  if (!ready) return <Center>Loading…</Center>

  if (!token || !staff) {
    return (
      <Shell>
        <div style={{ maxWidth: 380, margin: '11vh auto 0', padding: '0 20px', textAlign: 'center' }}>
          <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 210, maxWidth: '72%', display: 'block', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: RED, fontWeight: 700, marginBottom: 22 }}>{mode === 'signup' ? 'Join the team' : 'Staff Portal'}</div>

          {mode === 'signup' ? (
            <>
              <form onSubmit={doSignup} style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                <input value={signup.name} onChange={e => setSignup(s => ({ ...s, name: e.target.value }))} placeholder="Full name" autoComplete="name" style={inp} />
                <input value={signup.email} onChange={e => setSignup(s => ({ ...s, email: e.target.value }))} placeholder="Email" type="email" autoComplete="email" style={inp} />
                <input value={signup.password} onChange={e => setSignup(s => ({ ...s, password: e.target.value }))} placeholder="Choose a password" type="password" autoComplete="new-password" style={inp} />
                {err && <div style={{ fontSize: 12.5, color: '#F87171' }}>{err}</div>}
                <button type="submit" disabled={busy} style={{ ...btn('red'), padding: '12px', fontSize: 14, marginTop: 4 }}>{busy ? 'Creating…' : 'Sign up'}</button>
              </form>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 16 }}>Already have a login? <button onClick={() => { setMode('login'); setErr('') }} style={linkBtn}>Log in</button></div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 14, lineHeight: 1.6 }}>Next you'll sign the Statement of Intent and add your details — then your shifts unlock.</div>
            </>
          ) : (
            <>
              <form onSubmit={doLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                <input value={login.name} onChange={e => setLogin(l => ({ ...l, name: e.target.value }))} placeholder="Your name" autoComplete="username" style={inp} />
                <input value={login.password} onChange={e => setLogin(l => ({ ...l, password: e.target.value }))} placeholder="Password" type="password" autoComplete="current-password" style={inp} />
                {err && <div style={{ fontSize: 12.5, color: '#F87171' }}>{err}</div>}
                <button type="submit" disabled={busy} style={{ ...btn('red'), padding: '12px', fontSize: 14, marginTop: 4 }}>{busy ? 'Logging in…' : 'Log in'}</button>
              </form>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 18, lineHeight: 1.6 }}>{joinCode ? <>New here? <button onClick={() => { setMode('signup'); setErr('') }} style={linkBtn}>Sign up</button></> : 'No login yet? Ask the manager for a sign-up link.'}</div>
            </>
          )}
        </div>
      </Shell>
    )
  }

  // Kitchen food-safety is its own clear tab for EVERY kitchen-trained member — not
  // buried in the general Checklists tab, and not gated on being rostered today.
  const showKitchen = !!kitchen?.isKitchen
  const TABS = [['shifts', '🗓️', 'Shifts'], ['notes', '📝', 'Notes'], ['availability', '✅', 'Availability'], ['checklists', '📋', 'Checklists'], ...(showKitchen ? [['kitchen', '🌭', 'Kitchen']] : []), ['training', '🎓', 'Training'], ['menus', '🍽️', 'Menus'], ['cocktails', '🍸', 'Cocktails'], ['profile', '👤', 'Profile']]

  return (
    <Shell>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '16px 14px 60px' }}>
        {preview && (
          <div style={{ background: 'rgba(96,165,250,0.14)', border: '1px solid rgba(96,165,250,0.5)', borderRadius: 10, padding: '9px 12px', marginBottom: 14, fontSize: 12.5, color: '#93C5FD', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span>👁 Founder preview — {(staff?.name || '').split(' ')[0] || 'this'}’s portal, exactly as they see it.</span>
            <button onClick={() => window.close()} style={{ background: 'none', border: '1px solid rgba(96,165,250,0.5)', color: '#93C5FD', borderRadius: 6, padding: '3px 9px', fontSize: 11.5, cursor: 'pointer', whiteSpace: 'nowrap' }}>Close</button>
          </div>
        )}
        <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 140, display: 'block', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar name={staff.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staff.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{staff.role || 'Team'}{staff.training_status ? ` · ${staff.training_status}` : ''}</div>
          </div>
          <button onClick={logout} style={btn('ghost')}>Log out</button>
        </div>

        {(rosteredToday || (clock?.clock_in && !clock?.clock_out)) && (() => {
          const fmtT = (t) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          const started = clock?.clock_in, ended = clock?.clock_out
          const workedMin = started && ended ? Math.round((new Date(ended) - new Date(started)) / 60000) : 0
          const wh = Math.floor(workedMin / 60), wm = workedMin % 60
          const bg = ended ? 'rgba(255,255,255,0.05)' : started ? 'rgba(52,211,153,0.10)' : 'rgba(218,27,51,0.12)'
          const bd = ended ? LINE : started ? 'rgba(52,211,153,0.45)' : 'rgba(218,27,51,0.5)'
          const badgeIn = presenceBadge(clock?.presence)
          return (
            <div style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13.5, color: '#fff', fontWeight: 600 }}>
                  {ended ? <>✅ Shift done — you worked <strong>{wh}h{wm ? ` ${wm}m` : ''}</strong> today.</>
                    : started ? <>🟢 On shift since <strong>{fmtT(started)}</strong>.{badgeIn ? <span style={{ fontSize: 11.5, fontWeight: 400, color: badgeIn.color, marginLeft: 8 }}>{badgeIn.icon} {badgeIn.text}</span> : null}</>
                      : <>You're on today — tap to clock in.</>}
                </div>
                {!started && <button onClick={doClockIn} disabled={busy} style={{ ...btn('red'), padding: '10px 16px' }}>{busy ? 'Checking…' : '▶ Start my shift'}</button>}
                {started && !ended && <button onClick={doClockOut} disabled={busy} style={{ ...btn('ghost'), padding: '10px 16px' }}>{busy ? 'Checking…' : '■ End my shift'}</button>}
              </div>
              {!started && <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', marginTop: 8, lineHeight: 1.45 }}>📍 When you start, we do a quick one-off location check to confirm you're at No Dice. We never track you between clock-ins.</div>}
              {clockMsg && <div style={{ fontSize: 11.5, color: '#FCD34D', marginTop: 8, lineHeight: 1.45 }}>{clockMsg}</div>}
            </div>
          )
        })()}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {TABS.map(([k, ic, lbl]) => (
            <button key={k} onClick={() => { setView(k); setSelDate(null) }} style={{ flex: '1 1 28%', minWidth: 92, padding: '10px 4px', fontSize: 12, borderRadius: 8, cursor: 'pointer', background: view === k ? 'rgba(218,27,51,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${view === k ? RED : LINE}`, color: view === k ? '#fff' : 'rgba(255,255,255,0.8)', fontWeight: view === k ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{ic} {lbl}</button>
          ))}
        </div>

        {view === 'availability' && (
          <>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginTop: 0 }}>You're available by default — just tap the days you <strong style={{ color: '#fff' }}>can't</strong> work this month. <strong style={{ color: RED }}>Red = off.</strong> Tap again to clear. Saved automatically.</p>
            <MiniCal year={vy} month={vm} onPrev={() => stepMonth(-1)} onNext={() => stepMonth(1)} canPrev={!atCurrentMonth}
              clickable={(ds) => ds >= todayStr} onDay={toggleAvail} selected={null}
              renderDay={(ds, d) => {
                const off = dayOff(ds)
                return (<>
                  <span style={{ fontSize: 12, fontWeight: 700, color: off ? RED : undefined }}>{d}</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                    {off && <span style={{ fontSize: 9, color: RED, fontWeight: 700 }}>✕ off</span>}
                  </div>
                </>)
              }} />
            {(() => { const n = Object.keys(monthAvail).filter(k => (monthAvail[k] || {}).unavailable).length; return (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>{n === 0 ? `Available all of ${MONTHS[vm]}.` : `${n} day${n === 1 ? '' : 's'} marked off in ${MONTHS[vm]}.`}</div>
            ) })()}
          </>
        )}

        {view === 'shifts' && calendarLocked(staff, docs) && (
          <Onboarding token={token} staff={staff} docs={docs} reload={() => loadState(token)} goProfile={() => setView('profile')} />
        )}

        {view === 'shifts' && !calendarLocked(staff, docs) && (
          <>
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
                  {!avail && <div style={{ fontSize: 12, color: '#FCD34D' }}>You've marked yourself off this day. Clear it on the Availability tab to grab a shift.</div>}
                  {rows.map(sh => {
                    const need = sh.headcount ?? 1
                    const full = sh.filled >= need
                    const eligible = canWork(staff, sh)
                    const hasReq = (sh.ability && sh.ability !== 'bar') || (sh.min_rank && sh.min_rank > 1)
                    return (
                      <div key={sh.id} style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${sh.mine ? GREEN : full ? 'rgba(255,255,255,0.25)' : eligible ? RED : 'rgba(255,255,255,0.25)'}`, paddingLeft: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{sh.label} <span style={{ color: RED, fontWeight: 700 }}>{shiftTimeLabel(sh)}</span></div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{shiftHours(sh)}h · {sh.filled}/{need} filled{hasReq ? ` · ${abilityIcon(sh.ability || 'bar')} ${abilityLabel(sh.ability || 'bar')}${sh.min_rank > 1 ? ` · ${rankLabel(sh.min_rank)}+` : ''}` : ''}</div>
                        </div>
                        {sh.mine
                          ? (sh.assigned
                            ? <span style={{ fontSize: 11.5, color: GREEN, fontWeight: 700, textAlign: 'right', maxWidth: 120, lineHeight: 1.3 }}>✓ You're on<br /><span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>set by manager</span></span>
                            : <button onClick={() => release(sh.id)} disabled={busy} style={btn('ghost')}>You're on · drop</button>)
                          : full
                            ? <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Full</span>
                            : !eligible
                              ? <span style={{ fontSize: 10.5, color: '#FCD34D', textAlign: 'right', maxWidth: 108, lineHeight: 1.3 }}>{whyCantWork(staff, sh)}</span>
                              : <button onClick={() => claim(sh.id)} disabled={busy || !avail} style={btn(avail ? 'red' : 'muted')}>Grab it</button>}
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {(() => {
              // Past shifts you were on — rostered time vs what you actually clocked.
              const past = shifts.filter(s => s.mine && s.date < todayStr).sort((a, b) => b.date.localeCompare(a.date))
              if (!past.length) return null
              const clockByDate = {}; for (const c of clocks) clockByDate[c.date] = c
              return (
                <div style={{ marginTop: 22 }}>
                  <div className="serif" style={{ fontSize: 17, color: '#fff' }}>Past shifts</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', margin: '2px 0 12px' }}>Your rostered times, alongside what you actually clocked.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {past.map(sh => {
                      const clk = clockByDate[sh.date]
                      const inT = fmtClockTime(clk?.clock_in), outT = fmtClockTime(clk?.clock_out)
                      const worked = workedMins(clk?.clock_in, clk?.clock_out)
                      return (
                        <div key={sh.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{dayName(sh.date).slice(0, 3)} {sh.date.slice(8)} {MONTHS[+sh.date.slice(5, 7) - 1].slice(0, 3)}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{sh.label}</div>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 16px', fontSize: 12.5 }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Rostered <strong style={{ color: '#fff' }}>{shiftTimeLabel(sh)}</strong></span>
                            {inT
                              ? <span style={{ color: 'rgba(255,255,255,0.6)' }}>Clocked <strong style={{ color: '#60A5FA' }}>{inT}–{outT || '…'}</strong>{worked ? <span style={{ color: '#60A5FA' }}> · {hoursLabel(worked)}</span> : (!outT ? <span style={{ color: AMBER }}> · no clock-out</span> : null)}{clk.auto_out ? <span style={{ color: AMBER }} title="You didn't clock out — we estimated your finish from your rostered end. Tell your manager if it's wrong."> · ⏰ auto</span> : null}{clk.approved ? <span style={{ color: GREEN }} title="Approved by manager"> · ✓ approved</span> : null}{(() => { const pb = presenceBadge(clk?.presence); return pb ? <span style={{ color: pb.color }} title={pb.text}> · {pb.icon}</span> : null })()}</span>
                              : <span style={{ color: AMBER }}>Didn't clock in</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </>
        )}

        {view === 'checklists' && <ChecklistView token={token} />}

        {view === 'kitchen' && showKitchen && <KitchenChecklists token={token} kitchen={kitchen} />}

        {view === 'training' && <TrainingView token={token} training={training} onToggle={(key, on) => setTraining(prev => on ? [...new Set([...prev, key])] : prev.filter(k => k !== key))} />}

        {view === 'menus' && <MenusView />}

        {view === 'cocktails' && <CocktailSpecs embedded />}

        {view === 'notes' && <NotesView token={token} notes={notes} staffId={staff?.id} reload={() => loadState(token)} />}

        {view === 'profile' && (
          <ProfileView staff={staff} onSave={saveProfile} busy={busy} token={token} docs={docs} reload={() => loadState(token)} />
        )}
      </div>

      {notePopup.length > 0 && (
        <div onClick={dismissNotePopup} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5vh 16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0A0A0A', border: `1px solid ${RED}`, borderRadius: 14, padding: 20, maxWidth: 420, width: '100%', maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: RED, fontWeight: 700, marginBottom: 4 }}>📣 Notes for today</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>From management — please read before your shift.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notePopup.map(n => (
                <div key={n.id} style={{ background: 'rgba(218,27,51,0.08)', border: '1px solid rgba(218,27,51,0.35)', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{n.body}</div>
              ))}
            </div>
            <button onClick={dismissNotePopup} style={{ ...btn('red'), width: '100%', padding: '12px', marginTop: 16 }}>Got it</button>
          </div>
        </div>
      )}
    </Shell>
  )
}

// Notes tab — today's briefings + the shift handover log, and add your own note.
function NotesView({ token, notes, staffId, reload }) {
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const add = async () => {
    const t = body.trim(); if (!t) return
    setBusy(true)
    try { await rotaAddShiftNote(token, today, t); setBody(''); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const del = async (id) => { setBusy(true); try { await rotaDeleteShiftNote(token, id); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const fmtWhen = (d, created) => {
    const day = new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    const t = created ? new Date(created).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''
    return `${day}${t ? ' · ' + t : ''}`
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Full-width, roomy note box. 16px font stops iOS zooming in on tap
            (the main reason it felt fiddly); drag the corner to make it taller. */}
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Leave a handover note for the next shift… e.g. glasswasher needs salt, low on tonic" style={{ width: '100%', minHeight: 120, padding: '13px 14px', fontSize: 16, lineHeight: 1.5, borderRadius: 10, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        <button onClick={add} disabled={busy || !body.trim()} style={{ ...btn('red'), width: '100%', padding: '13px', fontSize: 15, opacity: body.trim() ? 1 : 0.5 }}>{busy ? 'Posting…' : 'Post note'}</button>
      </div>
      {notes.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', padding: '18px 0', textAlign: 'center' }}>No notes yet. Management briefings and shift handovers show up here.</div>}
      {notes.map(n => {
        const mgr = n.kind === 'manager'
        return (
          <div key={n.id} style={{ background: mgr ? 'rgba(218,27,51,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${mgr ? 'rgba(218,27,51,0.35)' : LINE}`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', marginBottom: 3 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: mgr ? RED : GREEN }}>{mgr ? '📣 ' : '↪ '}{n.author_name || (mgr ? 'Management' : 'Staff')}</span>
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>{fmtWhen(n.date, n.created_at)}</span>
            </div>
            <div style={{ fontSize: 14, color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{n.body}</div>
            {n.staff_id && n.staff_id === staffId && <button onClick={() => del(n.id)} disabled={busy} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', padding: '4px 0 0', textDecoration: 'underline' }}>delete</button>}
          </div>
        )
      })}
    </div>
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
          const c = CHECKLISTS[k], total = checklistCount(k, today), done = doneCount(k, subs[k]?.items || {}, today), sub = subs[k]?.submitted
          return (
            <button key={k} onClick={() => open(k)} style={{ textAlign: 'left', background: CARD, border: `1px solid ${sub ? 'rgba(52,211,153,0.4)' : LINE}`, borderRadius: 12, padding: 14, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{c.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{c.title} {sub && <span style={{ fontSize: 10, color: GREEN, fontWeight: 700 }}>✓ submitted</span>}</div>
                {c.blurb && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1, lineHeight: 1.4 }}>{c.blurb}</div>}
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{done}/{total} done</div>
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
  const c = CHECKLISTS[openKey], secs = checklistSections(openKey, today), total = checklistCount(openKey, today), done = doneCount(openKey, items, today)
  const multi = secs.length > 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => { setOpenKey(null); loadAll() }} style={btn('ghost')}>‹ Back</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{c.icon} {c.title}</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>{done}/{total} done{busy ? ' · saving…' : savedAt ? ' · saved ✓' : ''}</div>
        </div>
      </div>

      {secs.map((sec, si) => (
        <div key={si} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
          {multi && <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: RED, fontWeight: 700, padding: '10px 14px 4px' }}>{sec.title}</div>}
          {sec.items.map((text, ii) => {
            const on = !!items[text]
            return (
              <button key={ii} onClick={() => toggle(text)} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, width: '100%', textAlign: 'left', padding: '11px 14px', background: on ? 'rgba(52,211,153,0.07)' : 'transparent', border: 'none', borderTop: ii === 0 && !multi ? 'none' : `1px solid rgba(255,255,255,0.06)`, cursor: 'pointer', color: '#fff' }}>
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

// Menus — the founder's uploaded menus; tap to open + print to the bar printer.
function MenusView() {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  useEffect(() => { rotaMenus().then(r => setMenus(r.menus || [])).catch(() => {}).finally(() => setLoading(false)) }, [])
  const open = async (id) => { setBusy(true); try { await openMenu(id) } catch (e) { alert(e.message) } finally { setBusy(false) } }
  if (loading) return <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Loading menus…</div>
  if (!menus.length) return <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '20px 16px', lineHeight: 1.6 }}>No menus up yet — check back before your shift.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>Tap a menu to open it, then print from your browser to the bar printer.</div>
      {menus.map(m => (
        <button key={m.id} onClick={() => open(m.id)} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, cursor: 'pointer', color: '#fff' }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>{m.kind === 'image' ? '🖼️' : '📄'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Open &amp; print</div>
          </div>
          <span style={{ fontSize: 18 }}>🖨️</span>
        </button>
      ))}
    </div>
  )
}

// Onboarding gate — shown on the Shifts tab until a freelance member has signed
// the statement + completed all their payroll / right-to-work details.
function Onboarding({ token, staff, docs, reload, goProfile }) {
  const [sig, setSig] = useState('')
  const [busy, setBusy] = useState(false)
  const signed = !!staff.soi_signed_at
  const sign = async () => {
    if (sig.trim().length < 2) { alert('Type your full name to sign.'); return }
    setBusy(true)
    try { await rotaSignStatement(token, sig.trim()); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const detailsMissing = ONBOARDING_STEPS.some(s => s.key !== 'statement' && !s.done(staff, docs || {}))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.3)', borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>🔒 Your shift calendar is locked</div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 4, lineHeight: 1.5 }}>Finish the steps below to unlock shifts — it's how we make sure we can pay you and that you're set up to work legally in the UK.</div>
      </div>
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 8 }}>Onboarding checklist</div>
        {ONBOARDING_STEPS.map(step => {
          const done = step.done(staff, docs || {})
          return (
            <div key={step.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', fontSize: 13 }}>
              <span style={{ color: done ? GREEN : 'rgba(255,255,255,0.3)', fontWeight: 800, flexShrink: 0 }}>{done ? '✓' : '○'}</span>
              <span style={{ color: done ? 'rgba(255,255,255,0.55)' : '#fff' }}>{step.label}</span>
            </div>
          )
        })}
        {detailsMissing && <button onClick={goProfile} style={{ ...btn('red'), marginTop: 10 }}>Complete your details in Profile →</button>}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{signed ? '✓ You’ve signed the Statement of Intent' : 'Read & sign the Statement of Intent'}</div>
        <StatementDoc signature={staff.soi_signature} signedAt={staff.soi_signed_at} version={staff.soi_version} name={staff.name} />
        {!signed && (
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>Type your full name to confirm you've read and understood the above.</div>
            <input value={sig} onChange={e => setSig(e.target.value)} placeholder="Your full name" style={inp} />
            <button onClick={sign} disabled={busy} style={{ ...btn('red'), padding: '12px' }}>{busy ? 'Signing…' : "I've read & agree — sign"}</button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileView({ staff, onSave, busy, token, docs, reload }) {
  const [f, setF] = useState({
    name: staff.name || '', phone: staff.phone || '', email: staff.email || '', address: staff.address || '',
    emergency_name: staff.emergency_name || '', emergency_phone: staff.emergency_phone || '', emergency_relation: staff.emergency_relation || '',
    dob: staff.dob || '', ni_number: staff.ni_number || '', bank_name: staff.bank_name || '', bank_sort: staff.bank_sort || '', bank_account: staff.bank_account || '',
    interests: Array.isArray(staff.interests) ? staff.interests : [],
  })
  const on = (k, v) => setF(s => ({ ...s, [k]: v }))
  const addInterest = (v) => { const t = String(v || '').trim(); if (!t) return; setF(s => ({ ...s, interests: [...new Set([...(s.interests || []), t])] })) }
  const rmInterest = (v) => setF(s => ({ ...s, interests: (s.interests || []).filter(x => x !== v) }))
  const [uploading, setUploading] = useState('')
  const upload = async (kind, e) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return
    setUploading(kind)
    try {
      const url = file.type.startsWith('image/') ? await resizeImage(file) : await fileToDataUrl(file)
      await rotaUploadDoc(token, kind, url); await reload?.()
    } catch (er) { alert(er.message || 'Upload failed') } finally { setUploading('') }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Managers/Asst Managers: jump straight to the /ops team hub (or the DJ section). */}
      {['Manager', 'Asst. Manager'].includes(staff.role) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a href="/ops" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '20px', borderRadius: 12, background: RED, color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '0.02em', boxShadow: '0 4px 18px rgba(218,27,51,0.4)' }}>⚙️ Open the Operations hub →</a>
          <a href="/ops?tab=djbookings" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`, color: '#fff', fontWeight: 700, fontSize: 14.5 }}>🎧 Straight to DJ bookings →</a>
        </div>
      )}
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Set by the manager</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {staff.role && <span style={chip}>{staff.role}</span>}
          {(staff.abilities || []).map((a, i) => <span key={i} style={{ ...chip, color: GREEN, borderColor: 'rgba(52,211,153,0.4)' }}>{abilityIcon(a)} {abilityLabel(a)}</span>)}
          {(staff.skills || []).map((s, i) => <span key={i} style={chip}>{s}</span>)}
          {staff.training_status && <span style={{ ...chip, color: GREEN, borderColor: 'rgba(52,211,153,0.4)' }}>{staff.training_status}</span>}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>{(staff.abilities || []).length ? 'You can pick up ' + (staff.abilities || []).map(abilityLabel).join(', ') + ' shifts.' : "You're not signed off for any shift type yet — ask the manager."}</div>
        {staff.training_notes && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 10, lineHeight: 1.5 }}><strong style={{ color: '#fff' }}>Training:</strong> {staff.training_notes}</div>}
        {staff.feedback_notes && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.5 }}><strong style={{ color: '#fff' }}>Feedback:</strong> {staff.feedback_notes}</div>}
        {staff.work_rules && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 6, lineHeight: 1.5 }}><strong style={{ color: '#fff' }}>Notes:</strong> {staff.work_rules}</div>}
      </div>

      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ gridColumn: '1 / -1', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Your details — keep these up to date</div>
        <L label="Full name" wide><input value={f.name} onChange={e => on('name', e.target.value)} style={inp} /></L>
        <L label="Phone"><input value={f.phone} onChange={e => on('phone', e.target.value)} style={inp} /></L>
        <L label="Email (your login)"><input value={f.email} onChange={e => on('email', e.target.value)} type="email" autoComplete="email" placeholder="you@email.com" style={inp} /></L>
        <L label="Home address" wide><input value={f.address} onChange={e => on('address', e.target.value)} style={inp} /></L>
        <div style={{ gridColumn: '1 / -1', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', borderTop: `1px dashed ${LINE}`, paddingTop: 10 }}>Next of kin / emergency contact</div>
        <L label="Name"><input value={f.emergency_name} onChange={e => on('emergency_name', e.target.value)} style={inp} /></L>
        <L label="Their phone"><input value={f.emergency_phone} onChange={e => on('emergency_phone', e.target.value)} style={inp} /></L>
        <L label="Relationship" wide><input value={f.emergency_relation} onChange={e => on('emergency_relation', e.target.value)} style={inp} /></L>

        <div style={{ gridColumn: '1 / -1', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', borderTop: `1px dashed ${LINE}`, paddingTop: 10 }}>Payroll &amp; right to work</div>
        <L label="Date of birth"><input type="date" value={f.dob} onChange={e => on('dob', e.target.value)} style={inp} /></L>
        <L label="National Insurance no."><input value={f.ni_number} onChange={e => on('ni_number', e.target.value)} placeholder="QQ 12 34 56 C" style={inp} /></L>
        <L label="Bank — account name" wide><input value={f.bank_name} onChange={e => on('bank_name', e.target.value)} style={inp} /></L>
        <L label="Sort code"><input value={f.bank_sort} onChange={e => on('bank_sort', e.target.value)} placeholder="00-00-00" style={inp} /></L>
        <L label="Account number"><input value={f.bank_account} onChange={e => on('bank_account', e.target.value)} style={inp} /></L>
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => onSave(f)} disabled={busy} style={btn('red')}>{busy ? 'Saving…' : 'Save details'}</button>
        </div>
      </div>

      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Interests &amp; hobbies</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, lineHeight: 1.5 }}>Tell us what you're into — add at least 5. We might match these to jobs around the bar (gardening, painting, carpentry, sign-writing…).</div>
        {(f.interests || []).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {(f.interests || []).map((it, i) => (
              <span key={i} style={{ ...chip, display: 'inline-flex', alignItems: 'center', gap: 6 }}>{it}<button onClick={() => rmInterest(it)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button></span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {INTEREST_SUGGESTIONS.filter(s => !(f.interests || []).includes(s)).map(s => (
            <button key={s} onClick={() => addInterest(s)} style={{ padding: '5px 11px', fontSize: 12, borderRadius: 999, cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.8)', border: `1px solid ${LINE}` }}>+ {s}</button>
          ))}
        </div>
        <input placeholder="Add your own (press Enter)" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest(e.target.value); e.target.value = '' } }} style={{ ...inp, marginTop: 10 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: (f.interests || []).length >= 5 ? GREEN : '#FCD34D' }}>{(f.interests || []).length >= 5 ? `✓ ${(f.interests || []).length} added` : `${(f.interests || []).length}/5 — add ${5 - (f.interests || []).length} more`}</span>
          <button onClick={() => onSave(f)} disabled={busy} style={btn('red')}>{busy ? 'Saving…' : 'Save interests'}</button>
        </div>
      </div>

      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Documents — passport &amp; right to work</div>
        {[['passport', 'Passport / photo ID'], ['rtw', 'Proof of right to work in the UK']].map(([kind, label]) => (
          <div key={kind} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: docs?.[kind] ? GREEN : 'rgba(255,255,255,0.3)', fontWeight: 800, flexShrink: 0 }}>{docs?.[kind] ? '✓' : '○'}</span>
            <div style={{ flex: 1, minWidth: 130, fontSize: 13, color: '#fff' }}>{label}{docs?.[kind] && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 6 }}>uploaded ✓</span>}</div>
            <label style={{ ...btn('ghost'), cursor: 'pointer' }}>{uploading === kind ? 'Uploading…' : docs?.[kind] ? 'Replace' : 'Upload'}<input type="file" accept="image/*,application/pdf" onChange={e => upload(kind, e)} disabled={!!uploading} style={{ display: 'none' }} /></label>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Photo or PDF. Held securely — only used to pay you and meet legal duties.</div>
      </div>

      {staff.soi_signed_at && (
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Your signed Statement of Intent</div>
          <StatementDoc signature={staff.soi_signature} signedAt={staff.soi_signed_at} version={staff.soi_version} name={staff.name} />
        </div>
      )}
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
const linkBtn = { background: 'none', border: 'none', padding: 0, color: RED, fontWeight: 700, fontSize: 'inherit', cursor: 'pointer', textDecoration: 'underline' }
