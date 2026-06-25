import React, { useEffect, useState } from 'react'
import { djPortal, resizeImage, sessionFor, sessionForSlot, slotLabel, fmtDate, timeLabel, kindFor, SET_TYPES, setTypeLabel } from './api.js'
import { genreOfSub } from './genres.js'
import SubgenrePicker from './SubgenrePicker.jsx'
import FormatPicker, { parseFormats, joinFormats } from './FormatPicker.jsx'
import MonthCalendar from './MonthCalendar.jsx'
import DJRules from './DJRules.jsx'

// DJ portal — the DJ-facing page at /dj?t=<token>. DJ-only: no team/investor access.
// Step 1: fill profile + upload a photo.  Step 2: profile complete unlocks open dates.
// Branded No Dice (red on black). Mobile-first (DJs book from their phones).

const RED = '#DA1B33', INK = '#000000', CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'

const Center = ({ children }) => (
  <div style={{ minHeight: '100vh', background: INK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif", padding: 32, textAlign: 'center', lineHeight: 1.6 }}>{children}</div>
)
const Photo = ({ d, size = 92 }) => {
  if (d?.image_url) return <img src={d.image_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${RED}` }} />
  const initials = (d?.dj_name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#fff', fontSize: size * 0.34, fontWeight: 700, border: `2px dashed ${RED}` }}>{initials}</div>
}

export default function DJPortal() {
  const token = new URLSearchParams(window.location.search).get('t') || ''
  const [st, setSt] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [photoErr, setPhotoErr] = useState('')
  const [eventImg, setEventImg] = useState('')          // per-event image for the booking open in the panel
  const [eventPhotoErr, setEventPhotoErr] = useState('')
  const [claiming, setClaiming] = useState(null)
  const [mode, setMode] = useState('claim')   // 'claim' = booking a new open date · 'edit' = changing one of my bookings
  const [night, setNight] = useState('')
  const [subs, setSubs] = useState([])   // sub-genre names selected for the claim (max 4)
  const [promoTrack, setPromoTrack] = useState('')
  const [promoOk, setPromoOk] = useState(false)
  const [setType, setSetType] = useState('dj_set')
  const now = new Date()
  const [viewY, setViewY] = useState(now.getFullYear())
  const [viewM, setViewM] = useState(now.getMonth())
  const [tab, setTab] = useState('portal')   // 'portal' = profile + nights · 'rules' = how it works
  const [showPast, setShowPast] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [panelAt, setPanelAt] = useState('bottom')   // where the booking panel renders: 'bottom' (calendar) | 'top' (Your dates)
  const [claimSlot, setClaimSlot] = useState('main') // which session-of-the-day the open panel is for
  const [chooser, setChooser] = useState(null)       // { date, slots } when a day has >1 open session
  const [note, setNote] = useState('')               // "Message No Dice" compose box
  const [b2bId, setB2bId] = useState('')             // optional back-to-back partner for the night being booked

  useEffect(() => {
    document.body.style.background = INK; document.body.style.color = '#fff'
    document.title = 'No Dice — DJ Portal'
    if (!token) { setErr('This link is missing its code — ask No Dice for your personal link.'); setLoading(false); return }
    djPortal(token, 'load').then(d => { setSt(d); setForm(d.dj) }).catch(e => setErr(e.message)).finally(() => setLoading(false))
  }, [])

  const refresh = (d) => { setSt(d); setForm(d.dj) }
  const onField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const flash = (m, ms = 3500) => { setMsg(m); setTimeout(() => setMsg(''), ms) }

  const save = async () => {
    setBusy(true)
    try { refresh(await djPortal(token, 'save', { profile: form })); flash('Saved ✓') }
    catch (e) { flash(e.message) } finally { setBusy(false) }
  }
  const sendNote = async () => {
    const t = note.trim(); if (!t) return
    setBusy(true)
    try { refresh(await djPortal(token, 'leaveNote', { body: t })); setNote(''); flash('Sent to No Dice ✓') }
    catch (e) { flash(e.message) } finally { setBusy(false) }
  }
  const onPhoto = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return
    setBusy(true); setPhotoErr(''); setMsg('Saving photo…')
    try {
      await djPortal(token, 'save', { profile: form })   // persist typed details FIRST
      const dataUrl = await resizeImage(file)            // HEIC auto-converts; details already saved
      refresh(await djPortal(token, 'photo', { dataUrl }))
      flash('Photo saved ✓')
    } catch (er) {
      setPhotoErr(er.message || 'Photo upload failed — try a JPG or PNG.')
    } finally { setBusy(false) }
  }
  const onEventPhoto = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return
    const date = claiming, slot = claimSlot
    setBusy(true); setEventPhotoErr(''); setMsg('Saving event image…')
    try {
      const dataUrl = await resizeImage(file)
      const snap = await djPortal(token, 'eventPhoto', { date, slot, dataUrl })
      refresh(snap)
      const b = (snap.myBookings || []).find(x => x.date === date && (x.slot || 'main') === slot)
      setEventImg(b?.event_image_url || '')
      flash('Event image saved ✓')
    } catch (er) {
      setEventPhotoErr(er.message || 'Image upload failed — try a JPG or PNG.')
    } finally { setBusy(false) }
  }
  const removeEventPhoto = async (date) => {
    setBusy(true); setEventPhotoErr('')
    try { refresh(await djPortal(token, 'removeEventPhoto', { date, slot: claimSlot })); setEventImg(''); flash('Event image removed.') }
    catch (e) { setEventPhotoErr(e.message) } finally { setBusy(false) }
  }
  const MAX_SUBS = 4
  const resetPanel = () => { setNight(''); setSubs([]); setPromoTrack(''); setPromoOk(false); setSetType('dj_set'); setEventImg(''); setEventPhotoErr(''); setB2bId('') }
  const closePanel = () => { setClaiming(null); setMode('claim'); setPanelAt('bottom'); setClaimSlot('main'); resetPanel() }
  const prefill = (b) => { setNight(b.night_name || ''); setSubs(b.subgenres || []); setPromoTrack(b.promo_track || ''); setPromoOk(!!b.promo_ok); setSetType(b.set_type || 'dj_set'); setEventImg(b.event_image_url || ''); setEventPhotoErr(''); setB2bId(b.dj_id2 || '') }
  const holdExpired = (heldAt) => !!heldAt && (new Date(heldAt).getTime() + 24 * 3600 * 1000 <= Date.now())
  // If a hold lapsed mid-action, flash + reload the live state and drop the stale panel.
  const handleErr = async (e) => {
    flash(e.message)
    if (/expired|just taken|isn.t being held|isn.t one of your/i.test(e.message || '')) {
      try { refresh(await djPortal(token, 'load')) } catch { /* keep last state */ }
      closePanel()
    }
  }
  // Pick a fresh open date — reserve it (24h hold) THEN open the panel.
  const startClaim = async (date, slot = 'main') => {
    setBusy(true); setChooser(null)
    try {
      refresh(await djPortal(token, 'hold', { date, slot }))
      setMode('claim'); setPanelAt('bottom'); setClaiming(date); setClaimSlot(slot); resetPanel()
      flash('Date held for you — you’ve got 24h to finish.')
    } catch (e) { await handleErr(e) } finally { setBusy(false) }
  }
  // Pick a held draft back up (within the 24h) to keep filling it in.
  const resumeDraft = async (b) => {
    if (holdExpired(b.held_at)) {
      flash('That hold just expired — pick the date again from the calendar.')
      try { refresh(await djPortal(token, 'load')) } catch { /* keep last state */ }
      return
    }
    setMode('claim'); setPanelAt('top'); setClaiming(b.date); setClaimSlot(b.slot || 'main'); prefill(b)
  }
  // Edit an existing pending/confirmed booking.
  const startEdit = (b) => { setMode('edit'); setPanelAt('top'); setClaiming(b.date); setClaimSlot(b.slot || 'main'); prefill(b) }
  const saveDraft = async (date) => {
    setBusy(true)
    const genres = [...new Set(subs.map(genreOfSub).filter(Boolean))]
    try {
      refresh(await djPortal(token, 'draft', { date, slot: claimSlot, nightName: night, genres, subgenres: subs, promoTrack: promoTrack.trim(), promoOk, setType, dj_id2: b2bId }))
      closePanel()
      flash('Draft saved ✓ — finish within your 24h.')
    } catch (e) { await handleErr(e) } finally { setBusy(false) }
  }
  const claim = async (date) => {
    const session = kindFor(date, claimSlot) === 'session'
    if (session && !subs.length) { flash('Pick at least one sub-genre you’ll play.'); return }
    if (!promoTrack.trim()) { flash('Add a track (name or link) to promote your night.'); return }
    if (!promoOk) { flash('Tick that you have the rights to use the track for promo.'); return }
    setBusy(true)
    const genres = [...new Set(subs.map(genreOfSub).filter(Boolean))]
    try {
      const action = mode === 'edit' ? 'edit' : 'claim'
      refresh(await djPortal(token, action, { date, slot: claimSlot, nightName: night, genres, subgenres: subs, promoTrack: promoTrack.trim(), promoOk, setType, dj_id2: b2bId }))
      closePanel()
      flash(mode === 'edit' ? 'Night updated ✓' : 'Date requested ✓ — No Dice will confirm.')
    } catch (e) { await handleErr(e) } finally { setBusy(false) }
  }
  const cancel = async (date, slot = 'main') => {
    setBusy(true)
    try { refresh(await djPortal(token, 'cancel', { date, slot })); flash('Date released.') }
    catch (e) { flash(e.message) } finally { setBusy(false) }
  }

  if (loading) return <Center>Loading…</Center>
  if (err) return <Center><div><img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 200, marginBottom: 24 }} /><div style={{ color: 'rgba(255,255,255,0.8)' }}>{err}</div></div></Center>

  const complete = st.complete
  // What's still missing (from the SAVED profile) — drives the status text + the dates gate.
  const sdj = st.dj || form
  const genreCount = (g) => (g || '').split('/').map(x => x.trim()).filter(Boolean).length
  const need = []
  if (!(sdj.dj_name || '').trim()) need.push('your name')
  if (!sdj.image_url) need.push('a photo')
  if (genreCount(sdj.genres) < 5) need.push('5+ genres')
  if (!(sdj.instagram || '').trim()) need.push('Instagram')
  if (!(sdj.format || '').trim()) need.push('how you play')
  if (!(sdj.phone || '').trim()) need.push('phone')
  if (!(sdj.email || '').trim()) need.push('email')
  const inp = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 15, borderRadius: 8, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none', marginTop: 4 }
  const label = { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }
  // Required-field cues: a red * on each mandatory label, plus a live outline on
  // the pill — red while still empty, green once filled. These 7 fields are what
  // gate the bookings calendar (see `need` above); optional fields stay neutral.
  const req = () => <span title="Required before you can book a date" style={{ color: RED, marginLeft: 5, fontWeight: 700 }}>*</span>
  const reqInp = (v) => ({ ...inp, border: `1px solid ${(v || '').toString().trim() ? '#34D399' : RED}` })
  // Time left on a 24h hold (drafts). held_at + 24h − now.
  const holdLeft = (heldAt) => {
    if (!heldAt) return ''
    const ms = new Date(heldAt).getTime() + 24 * 3600 * 1000 - Date.now()
    if (ms <= 0) return 'expiring…'
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`
  }
  const monthKey = (d) => d.slice(0, 7)
  const bookedSessionMonths = new Set(st.myBookings.filter(b => kindFor(b.date, b.slot) === 'session').map(b => monthKey(b.date)))
  const openByDate = {}
  for (const o of st.openSlots) { if (!openByDate[o.date]) openByDate[o.date] = []; openByDate[o.date].push(o) }
  const mineMap = Object.fromEntries(st.myBookings.map(b => [b.date, b]))
  const shiftMonth = (n) => { let m = viewM + n, y = viewY; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } setViewY(y); setViewM(m) }
  const canPrevMonth = viewY > now.getFullYear() || (viewY === now.getFullYear() && viewM > now.getMonth())
  // Open session-of-day slots a DJ can still book (sessions hidden once their month is used).
  const bookable = (dateStr) => (openByDate[dateStr] || []).filter(o => {
    const isSess = (o.kind || kindFor(dateStr, o.slot)) === 'session'
    return !(isSess && bookedSessionMonths.has(monthKey(dateStr)))
  })
  const cellFor = (dateStr) => {
    const mine = mineMap[dateStr]
    if (mine) return { tone: mine.status === 'confirmed' ? 'mine-confirmed' : 'mine-pending', kind: kindFor(dateStr, mine.slot), disabled: true }
    const slots = openByDate[dateStr]
    if (!slots || !slots.length) return null
    const anySession = slots.some(o => (o.kind || kindFor(dateStr, o.slot)) === 'session')
    // Paid-session date in a month where I've already got my one paid session →
    // keep it tappable so the tap can explain why (instead of a silent dead cell).
    const capped = anySession && bookedSessionMonths.has(monthKey(dateStr)) && !bookable(dateStr).length
    if (capped) return { tone: 'closed', kind: 'session', disabled: false, capped: true }
    if (!bookable(dateStr).length) return { tone: 'closed', kind: anySession ? 'session' : 'opendecks', disabled: true }
    return { tone: 'open', kind: anySession ? 'session' : 'opendecks', disabled: false, slots: slots.length }
  }
  const sessionCapped = (date) => (openByDate[date] || []).some(o => (o.kind || kindFor(date, o.slot)) === 'session') && bookedSessionMonths.has(monthKey(date)) && !bookable(date).length
  // Tap a date: one open session → straight to hold; two+ (Saturdays) → pick afternoon/evening.
  const pickDate = (date) => {
    if (sessionCapped(date)) {
      flash("You've already got a paid session booked this month — it's one paid Thu/Fri/Sat session per DJ a month. Book a paid session next month, or grab a free Open Decks night (Mon/Tue/Wed) this month 🎚️", 9000)
      return
    }
    const slots = bookable(date)
    if (slots.length === 0) return
    if (slots.length === 1) startClaim(date, slots[0].slot)
    else setChooser({ date, slots })
  }

  // Booking panel — shared by "claim a new open date" and "edit one of my dates".
  const renderPanel = () => {
    const date = claiming
    const slotObj = (openByDate[date] || []).find(o => o.slot === claimSlot) || mineMap[date] || {}
    const blocked = slotObj.blocked || []
    const s = sessionForSlot(date, claimSlot)
    const session = s?.kind === 'session'
    const sLabel = slotLabel(date, claimSlot)
    const editing = mode === 'edit'
    const mine = mineMap[date]
    return (
      <div style={{ marginTop: 14, background: CARD, border: '1px solid rgba(218,27,51,0.4)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700 }}>
            {editing && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FCD34D', border: '1px solid rgba(252,211,77,0.5)', borderRadius: 999, padding: '1px 7px', marginRight: 6 }}>Editing</span>}
            {fmtDate(date)} <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: session ? RED : '#F97316', border: `1px solid ${session ? 'rgba(218,27,51,0.5)' : 'rgba(249,115,22,0.5)'}`, borderRadius: 999, padding: '1px 7px', marginLeft: 6 }}>{session ? (sLabel ? `Session · ${sLabel}` : 'Session') : 'Open Decks'}</span>
          </div>
          <button onClick={closePanel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s?.day} · {timeLabel(s)}{session ? '' : ' · unpaid'}</div>
        {!session && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>🎚️ <strong style={{ color: '#fff' }}>Open Decks</strong> — play whatever you like (no genre rules), unpaid, as many Mon–Wed as you want.</div>}
        <input value={night} onChange={e => setNight(e.target.value)} placeholder="Name of the night (optional)" style={inp} />
        {(st.roster || []).length > 0 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Back-to-back with <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.4)' }}>(optional — play this {session ? 'session' : 'night'} b2b with another DJ)</span></div>
            <select value={b2bId} onChange={e => setB2bId(e.target.value)} style={{ ...inp, appearance: 'auto', cursor: 'pointer' }}>
              <option value="">— just me —</option>
              {(st.roster || []).filter(r => r.id !== (st.dj && st.dj.id)).map(r => <option key={r.id} value={r.id}>{r.dj_name}</option>)}
            </select>
            {b2bId && session && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, lineHeight: 1.4 }}>This counts as their one paid session for the month too.</div>}
          </div>
        )}
        {session ? (
          <>
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>What will you play? <span style={{ color: RED }}>tap up to {MAX_SUBS} sub-genres</span> · <span style={{ color: subs.length ? '#34D399' : 'rgba(255,255,255,0.5)' }}>{subs.length}/{MAX_SUBS}</span></div>
            <SubgenrePicker selected={subs} onChange={setSubs} blocked={blocked} max={MAX_SUBS} />
            {blocked.length > 0 && <div style={{ fontSize: 11, color: '#FCD34D', lineHeight: 1.5, marginTop: 6 }}>⚠️ <strong>{blocked.join(', ')}</strong> {blocked.length === 1 ? 'is' : 'are'} greyed out — already booked the night before or after, so {blocked.length === 1 ? "it can't" : "they can't"} go on this date. Pick other genres, or choose another date.</div>}
          </>
        ) : (
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>What kind of night?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{SET_TYPES.map(t => <button key={t.value} type="button" onClick={() => setSetType(t.value)} style={{ padding: '7px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', background: setType === t.value ? RED : 'transparent', color: setType === t.value ? '#fff' : 'rgba(255,255,255,0.82)', border: `1px solid ${setType === t.value ? RED : LINE}`, fontWeight: setType === t.value ? 700 : 400 }}>{t.label}</button>)}</div>
          </div>
        )}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Track to promote this {session ? 'session' : 'night'} · <span style={{ color: RED }}>name or link · required</span></div>
          <input value={promoTrack} onChange={e => setPromoTrack(e.target.value)} placeholder="Track name or SoundCloud / YouTube link" style={inp} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', lineHeight: 1.45 }}>
            <input type="checkbox" checked={promoOk} onChange={e => setPromoOk(e.target.checked)} style={{ marginTop: 2, accentColor: RED }} />
            It's my own mix/edit, or I have the rights to use it for No Dice promo (Instagram etc.).
          </label>
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Event image <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.4)' }}>(optional — used instead of your profile photo for this night)</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {(eventImg || sdj.image_url)
              ? <img src={eventImg || sdj.image_url} alt="" style={{ width: 54, height: 54, borderRadius: 8, objectFit: 'cover', border: `1px solid ${eventImg ? RED : LINE}`, flexShrink: 0 }} />
              : <div style={{ width: 54, height: 54, borderRadius: 8, background: '#1a1a1a', border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>🎵</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={{ display: 'inline-block', fontSize: 12, color: RED, cursor: 'pointer', borderBottom: `1px solid ${RED}` }}>
                {eventImg ? 'Change event image' : 'Upload event image'}
                <input type="file" accept="image/*" onChange={onEventPhoto} style={{ display: 'none' }} />
              </label>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, lineHeight: 1.4 }}>{eventImg ? 'Used for this night.' : 'No event image — your profile photo will be used.'}</div>
              {eventImg && <button type="button" onClick={() => removeEventPhoto(date)} disabled={busy} style={{ background: 'none', border: 'none', color: '#F87171', fontSize: 11, cursor: 'pointer', padding: 0, marginTop: 4 }}>Remove event image</button>}
            </div>
          </div>
          {eventPhotoErr && <div style={{ fontSize: 11, color: '#F87171', marginTop: 6, lineHeight: 1.4 }}>{eventPhotoErr}</div>}
        </div>
        {editing ? (
          <button onClick={() => claim(date)} disabled={busy} style={{ padding: '12px', fontSize: 13, fontWeight: 700, background: RED, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{busy ? '…' : 'Save changes'}</button>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => saveDraft(date)} disabled={busy} style={{ flex: 1, padding: '12px', fontSize: 13, fontWeight: 600, background: 'transparent', color: '#fff', border: `1px solid ${LINE}`, borderRadius: 8, cursor: 'pointer' }}>{busy ? '…' : 'Save draft'}</button>
              <button onClick={() => claim(date)} disabled={busy} style={{ flex: 1, padding: '12px', fontSize: 13, fontWeight: 700, background: RED, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{busy ? '…' : 'Confirm request'}</button>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.5 }}>⏳ This date is held just for you — you've got <strong style={{ color: '#fff' }}>24h</strong> to confirm. <strong>Save draft</strong> keeps your progress so you can finish later.</div>
          </>
        )}
        {editing && mine?.status === 'confirmed' && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>This night is already confirmed — your changes go live straight away.</div>}
        {session && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>🔒 already booked the night before/after — same genre is fine, just not the same sub-genre. One paid session per month.</div>}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: INK, color: '#fff', fontFamily: "'DM Sans',sans-serif", padding: '32px 18px 64px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 170, display: 'block', margin: '0 auto 6px' }} />
        <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: RED, marginBottom: 18 }}>DJ Portal</div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {[['portal', 'My nights'], ['rules', 'How it works']].map(([k, lbl]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: '11px 12px', fontSize: 13, borderRadius: 9, cursor: 'pointer',
              background: tab === k ? RED : 'transparent', color: tab === k ? '#fff' : 'rgba(255,255,255,0.8)',
              border: `1px solid ${tab === k ? RED : LINE}`, fontWeight: tab === k ? 700 : 500,
            }}>{lbl}</button>
          ))}
        </div>

        {msg && <div style={{ background: 'rgba(218,27,51,0.12)', border: `1px solid ${RED}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{msg}</div>}

        {tab === 'rules' && <DJRules />}

        {tab === 'portal' && (<>
        {/* Profile */}
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 20, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <Photo d={form} />
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 20, color: '#fff' }}>{form.dj_name || 'Your profile'}</div>
              <div style={{ fontSize: 12, color: complete ? '#34D399' : '#FCD34D', marginTop: 2, fontWeight: 600 }}>{complete ? '● Profile complete — pick your dates below' : `○ Still needed: ${need.join(', ')}`}</div>
              <label style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: RED, cursor: 'pointer', borderBottom: `1px solid ${RED}` }}>
                {form.image_url ? 'Change photo' : 'Upload a photo *'}
                <input type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
              </label>
              {photoErr && <div style={{ fontSize: 11, color: '#F87171', marginTop: 6, lineHeight: 1.4 }}>{photoErr}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.62)', lineHeight: 1.5, background: 'rgba(218,27,51,0.07)', border: '1px solid rgba(218,27,51,0.25)', borderRadius: 8, padding: '9px 12px' }}>
              <span style={{ color: RED, fontWeight: 700 }}>*</span> = required before you can book a date. Fields outlined in <span style={{ color: RED, fontWeight: 600 }}>red</span> still need filling in — they turn <span style={{ color: '#34D399', fontWeight: 600 }}>green</span> once done.
            </div>
            <div><div style={label}>DJ / artist name{req()}</div><input value={form.dj_name || ''} onChange={e => onField('dj_name', e.target.value)} style={reqInp(form.dj_name)} /></div>
            <div>
              <div style={label}>Music you play{req()} <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.4)' }}>— pick at least 5</span></div>
              <div style={{ marginTop: 8 }}>
                <SubgenrePicker selected={(form.genres || '').split('/').map(x => x.trim()).filter(Boolean)} onChange={names => onField('genres', names.join(' / '))} />
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: genreCount(form.genres) >= 5 ? '#34D399' : RED }}>
                {genreCount(form.genres)}/5 minimum{genreCount(form.genres) >= 5 ? ' ✓' : ''} <span style={{ color: 'rgba(255,255,255,0.4)' }}>· you can change these any time</span>
              </div>
            </div>
            <div><div style={label}>Instagram{req()}</div><input value={form.instagram || ''} onChange={e => onField('instagram', e.target.value)} placeholder="@yourhandle" style={reqInp(form.instagram)} /></div>
            <div>
              <div style={label}>How you play{req()} <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.4)' }}>— tap any that apply</span></div>
              <div style={{ marginTop: 8 }}><FormatPicker selected={parseFormats(form.format)} onChange={a => onField('format', joinFormats(a))} /></div>
              {!(form.format || '').trim() && <div style={{ fontSize: 11, marginTop: 6, color: RED }}>Tap at least one</div>}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><div style={label}>Phone{req()}</div><input value={form.phone || ''} onChange={e => onField('phone', e.target.value)} style={reqInp(form.phone)} /></div>
              <div style={{ flex: 1 }}><div style={label}>Email{req()}</div><input value={form.email || ''} onChange={e => onField('email', e.target.value)} style={reqInp(form.email)} /></div>
            </div>
            <div><div style={label}>SoundCloud <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.35)' }}>(optional)</span></div><input value={form.soundcloud || ''} onChange={e => onField('soundcloud', e.target.value)} placeholder="soundcloud.com/you" style={inp} /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><div style={label}>Spotify <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.35)' }}>(optional)</span></div><input value={form.spotify || ''} onChange={e => onField('spotify', e.target.value)} placeholder="open.spotify.com/…" style={inp} /></div>
              <div style={{ flex: 1 }}><div style={label}>YouTube <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.35)' }}>(optional)</span></div><input value={form.youtube || ''} onChange={e => onField('youtube', e.target.value)} placeholder="youtube.com/@you" style={inp} /></div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
              ℹ️ Your profile will go live on the No Dice site so guests can discover you — we'll add your RA / DICE links and more later. Keep it sharp; you can update it any time.
            </div>
            <button onClick={save} disabled={busy} style={{ marginTop: 4, padding: '13px', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: RED, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{busy ? 'Saving…' : 'Save profile'}</button>
          </div>
        </div>

        {/* Message No Dice — leave a note (the inbound side of the Messages hub) */}
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 20, marginBottom: 18 }}>
          <div className="serif" style={{ fontSize: 18, color: '#fff', marginBottom: 4 }}>Message No Dice</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 10 }}>Leave a note — a question, a date you'd love, anything. We'll see it our side and usually get back to you on WhatsApp.</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Type your message…" style={{ ...inp, resize: 'vertical' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button onClick={sendNote} disabled={busy || !note.trim()} style={{ padding: '11px 20px', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: RED, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: (busy || !note.trim()) ? 0.5 : 1 }}>{busy ? 'Sending…' : 'Send'}</button>
          </div>
          {(st.notes || []).length > 0 && (
            <div style={{ marginTop: 14, borderTop: `1px solid ${LINE}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Your messages</div>
              {(st.notes || []).map(n => (
                <div key={n.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '9px 12px' }}>
                  <div style={{ fontSize: 13, color: '#eee', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{n.body}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{fmtDate((n.created_at || '').slice(0, 10))} · {n.read_at ? '✓ seen by No Dice' : 'sent'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your booked dates */}
        {st.myBookings.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ ...label, marginBottom: 8 }}>Your dates</div>
            {st.myBookings.map(b => {
              const s = sessionForSlot(b.date, b.slot)
              const sLab = slotLabel(b.date, b.slot)
              const held = b.status === 'held'
              const statusColor = b.status === 'confirmed' ? '#34D399' : '#FCD34D'
              const isPrimary = !b.dj_id || b.dj_id === (st.dj && st.dj.id)   // false when I'm the b2b partner (the lead DJ manages it)
              return (
                <div key={b.date + '-' + (b.slot || 'main')} style={{ background: CARD, border: `1px solid ${LINE}`, borderLeft: `3px solid ${statusColor}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {(b.event_image_url || sdj.image_url) && <img src={b.event_image_url || sdj.image_url} alt="" title={b.event_image_url ? 'Event image' : 'Profile photo'} style={{ width: 40, height: 40, borderRadius: 7, objectFit: 'cover', border: `1px solid ${b.event_image_url ? RED : LINE}`, flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{fmtDate(b.date)} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400, fontSize: 12 }}>· {s?.day} {timeLabel(s)}{sLab ? ` · ${sLab}` : ''}</span></div>
                    {b.night_name && <div style={{ fontSize: 12, color: RED }}>"{b.night_name}"</div>}
                    {b.b2b && b.partner && <div style={{ fontSize: 12, color: RED, fontWeight: 600 }}>🔁 Back-to-back with {b.partner}</div>}
                    {(b.subgenres || []).length > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{(b.subgenres || []).join(' · ')}</div>}
                    {b.kind === 'opendecks' && !held && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Open Decks{b.set_type ? ` · ${setTypeLabel(b.set_type)}` : ''}</div>}
                    {held && <div style={{ fontSize: 11, color: '#FCD34D', marginTop: 3, fontWeight: 600 }}>⏳ Draft — finish to confirm · {holdLeft(b.held_at)}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: statusColor }}>{b.status === 'confirmed' ? 'Confirmed' : held ? 'Draft' : 'Requested'}</span>
                    {isPrimary ? (
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => held ? resumeDraft(b) : startEdit(b)} style={{ background: 'none', border: 'none', color: RED, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{held ? 'continue' : 'edit'}</button>
                        {(held || b.status === 'pending') && <button onClick={() => cancel(b.date, b.slot)} style={{ background: 'none', border: 'none', color: '#F87171', fontSize: 12, cursor: 'pointer' }}>{held ? 'release' : 'cancel'}</button>}
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'right', lineHeight: 1.4 }}>{b.partner || 'The lead DJ'}<br />manages this night</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Who's playing — every other DJ's upcoming nights */}
        {(st.schedule || []).length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <button onClick={() => setShowSchedule(s => !s)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '11px 14px', cursor: 'pointer', color: '#fff' }}>
              <span style={{ color: RED, fontSize: 11, transform: showSchedule ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block', width: 10 }}>▶</span>
              <span style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>Who's playing</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{st.schedule.length}</span>
            </button>
            {showSchedule && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, lineHeight: 1.5 }}>Everyone else's upcoming nights — handy to see what's already pencilled in around your dates.</div>
                {st.schedule.map((e, i) => {
                  const s = sessionForSlot(e.date, e.slot)
                  const sLab = slotLabel(e.date, e.slot)
                  const session = e.kind === 'session'
                  return (
                    <div key={e.date + '-' + (e.slot || 'main')} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderLeft: `3px solid ${e.status === 'confirmed' ? '#34D399' : '#FCD34D'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      {e.image && <img src={e.image} alt="" style={{ width: 40, height: 40, borderRadius: 7, objectFit: 'cover', border: `1px solid ${LINE}`, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDate(e.date)} <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400, fontSize: 11 }}>· {s?.day} {timeLabel(s)}{sLab ? ` · ${sLab}` : ''}</span></div>
                          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: e.status === 'confirmed' ? '#34D399' : '#FCD34D', whiteSpace: 'nowrap' }}>{e.status === 'confirmed' ? 'Confirmed' : 'Pencilled'}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#fff', marginTop: 2 }}>{e.dj}{e.b2b && e.dj2 ? <span style={{ color: RED }}> b2b {e.dj2}</span> : null}{e.night_name ? <span style={{ color: RED }}> · "{e.night_name}"</span> : null}</div>
                        {e.subgenres.length > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{e.subgenres.join(' · ')}</div>}
                        {!session && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Open Decks{e.set_type ? ` · ${setTypeLabel(e.set_type)}` : ''}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Past events — collapsible history */}
        {(st.pastBookings || []).length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <button onClick={() => setShowPast(s => !s)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '11px 14px', cursor: 'pointer', color: '#fff' }}>
              <span style={{ color: RED, fontSize: 11, transform: showPast ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block', width: 10 }}>▶</span>
              <span style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>Past events</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{st.pastBookings.length}</span>
            </button>
            {showPast && (
              <div style={{ marginTop: 8 }}>
                {st.pastBookings.map(b => {
                  const s = sessionForSlot(b.date, b.slot)
                  const sLab = slotLabel(b.date, b.slot)
                  return (
                    <div key={b.date + '-' + (b.slot || 'main')} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, opacity: 0.85 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDate(b.date)} <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400, fontSize: 11 }}>· {s?.day} {timeLabel(s)}{sLab ? ` · ${sLab}` : ''}</span></div>
                      {b.night_name && <div style={{ fontSize: 11, color: RED }}>"{b.night_name}"</div>}
                      {b.b2b && b.partner && <div style={{ fontSize: 11, color: RED }}>🔁 b2b {b.partner}</div>}
                      {(b.subgenres || []).length > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{(b.subgenres || []).join(' · ')}</div>}
                      {b.kind === 'opendecks' && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Open Decks{b.set_type ? ` · ${setTypeLabel(b.set_type)}` : ''}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Panel for editing/resuming one of my dates (renders here, next to "Your dates") */}
        {claiming && panelAt === 'top' && renderPanel()}

        {/* Pick a date — calendar */}
        <div className="serif" style={{ fontSize: 18, color: '#fff', marginBottom: 10 }}>Pick a date</div>
        {!complete ? (
          <div style={{ background: CARD, border: `1px dashed ${LINE}`, borderRadius: 12, padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6 }}>
            🔒 Add {need.join(' + ')} above (then tap <strong style={{ color: '#fff' }}>Save profile</strong>) to unlock the calendar.
          </div>
        ) : (
          <>
            <MonthCalendar year={viewY} month={viewM} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} canPrev={canPrevMonth} cellFor={cellFor} onDay={pickDate} selected={claiming}
              legend={<>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: RED, marginRight: 5, verticalAlign: 'middle' }} />Session (paid)</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#F97316', marginRight: 5, verticalAlign: 'middle' }} />Open Decks</span>
                <span style={{ color: '#FCD34D' }}>your bookings highlighted</span>
                <span>🕓 Saturdays have <strong style={{ color: '#fff' }}>two</strong> paid sessions — afternoon <strong style={{ color: '#fff' }}>4–8pm</strong> + evening <strong style={{ color: '#fff' }}>8pm–12am</strong> (tap to pick)</span>
              </>} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, textAlign: 'center' }}>Tap a red-outlined date to hold it — you'll then have 24h to fill in the details.</div>
          </>
        )}
        {/* Two sessions on one day (Saturdays) — pick which before holding. */}
        {chooser && (
          <div style={{ marginTop: 14, background: CARD, border: '1px solid rgba(218,27,51,0.4)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>{fmtDate(chooser.date)} — pick a session</div>
              <button onClick={() => setChooser(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chooser.slots.map(o => {
                const ss = sessionForSlot(chooser.date, o.slot)
                return (
                  <button key={o.slot} onClick={() => startClaim(chooser.date, o.slot)} disabled={busy} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 9, background: 'transparent', border: `1px solid ${RED}`, color: '#fff', cursor: 'pointer', fontSize: 14 }}>
                    <span style={{ fontWeight: 700 }}>{slotLabel(chooser.date, o.slot) || 'Session'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{timeLabel(ss)} · paid</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {claiming && panelAt === 'bottom' && renderPanel()}
        </>)}

        <div style={{ textAlign: 'center', marginTop: 36, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>No Dice · London Fields</div>
      </div>
    </div>
  )
}
