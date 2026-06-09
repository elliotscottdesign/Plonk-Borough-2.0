import React, { useEffect, useState } from 'react'
import { djPortal, resizeImage, sessionFor, fmtDate, timeLabel, kindFor, SET_TYPES, setTypeLabel } from './api.js'
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
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#fff', fontSize: size * 0.34, fontWeight: 700, border: `1px solid ${LINE}` }}>{initials}</div>
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

  useEffect(() => {
    document.body.style.background = INK; document.body.style.color = '#fff'
    document.title = 'No Dice — DJ Portal'
    if (!token) { setErr('This link is missing its code — ask No Dice for your personal link.'); setLoading(false); return }
    djPortal(token, 'load').then(d => { setSt(d); setForm(d.dj) }).catch(e => setErr(e.message)).finally(() => setLoading(false))
  }, [])

  const refresh = (d) => { setSt(d); setForm(d.dj) }
  const onField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500) }

  const save = async () => {
    setBusy(true)
    try { refresh(await djPortal(token, 'save', { profile: form })); flash('Saved ✓') }
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
  const MAX_SUBS = 4
  const resetPanel = () => { setNight(''); setSubs([]); setPromoTrack(''); setPromoOk(false); setSetType('dj_set') }
  const closePanel = () => { setClaiming(null); setMode('claim'); resetPanel() }
  const startClaim = (date) => { setMode('claim'); setClaiming(date); resetPanel() }
  const startEdit = (b) => {
    setMode('edit'); setClaiming(b.date)
    setNight(b.night_name || ''); setSubs(b.subgenres || [])
    setPromoTrack(b.promo_track || ''); setPromoOk(!!b.promo_ok); setSetType(b.set_type || 'dj_set')
  }
  const claim = async (date) => {
    const session = kindFor(date) === 'session'
    if (session && !subs.length) { flash('Pick at least one sub-genre you’ll play.'); return }
    if (!promoTrack.trim()) { flash('Add a track (name or link) to promote your night.'); return }
    if (!promoOk) { flash('Tick that you have the rights to use the track for promo.'); return }
    setBusy(true)
    const genres = [...new Set(subs.map(genreOfSub).filter(Boolean))]
    try {
      const action = mode === 'edit' ? 'edit' : 'claim'
      refresh(await djPortal(token, action, { date, nightName: night, genres, subgenres: subs, promoTrack: promoTrack.trim(), promoOk, setType }))
      closePanel()
      flash(mode === 'edit' ? 'Night updated ✓' : 'Date requested ✓ — No Dice will confirm.')
    } catch (e) { flash(e.message) } finally { setBusy(false) }
  }
  const cancel = async (date) => {
    setBusy(true)
    try { refresh(await djPortal(token, 'cancel', { date })); flash('Date released.') }
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
  const monthKey = (d) => d.slice(0, 7)
  const bookedSessionMonths = new Set(st.myBookings.filter(b => kindFor(b.date) === 'session').map(b => monthKey(b.date)))
  const openMap = Object.fromEntries(st.openSlots.map(o => [o.date, o]))
  const mineMap = Object.fromEntries(st.myBookings.map(b => [b.date, b]))
  const shiftMonth = (n) => { let m = viewM + n, y = viewY; if (m < 0) { m = 11; y-- } if (m > 11) { m = 0; y++ } setViewY(y); setViewM(m) }
  const canPrevMonth = viewY > now.getFullYear() || (viewY === now.getFullYear() && viewM > now.getMonth())
  const cellFor = (dateStr) => {
    const mine = mineMap[dateStr]
    if (mine) return { tone: mine.status === 'confirmed' ? 'mine-confirmed' : 'mine-pending', kind: kindFor(dateStr), disabled: true }
    const op = openMap[dateStr]
    if (!op) return null
    const session = (op.kind || kindFor(dateStr)) === 'session'
    if (session && bookedSessionMonths.has(monthKey(dateStr))) return { tone: 'closed', kind: 'session', disabled: true }
    return { tone: 'open', kind: session ? 'session' : 'opendecks', disabled: false }
  }

  // Booking panel — shared by "claim a new open date" and "edit one of my dates".
  const renderPanel = () => {
    const date = claiming
    const op = openMap[date] || mineMap[date] || {}
    const blocked = op.blocked || []
    const session = (op.kind || kindFor(date)) === 'session'
    const s = sessionFor(date)
    const editing = mode === 'edit'
    const mine = mineMap[date]
    return (
      <div style={{ marginTop: 14, background: CARD, border: '1px solid rgba(218,27,51,0.4)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700 }}>
            {editing && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FCD34D', border: '1px solid rgba(252,211,77,0.5)', borderRadius: 999, padding: '1px 7px', marginRight: 6 }}>Editing</span>}
            {fmtDate(date)} <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: session ? RED : '#34D399', border: `1px solid ${session ? 'rgba(218,27,51,0.5)' : 'rgba(52,211,153,0.5)'}`, borderRadius: 999, padding: '1px 7px', marginLeft: 6 }}>{session ? 'Session' : 'Open Decks'}</span>
          </div>
          <button onClick={closePanel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s?.day} · {timeLabel(s)}{session ? '' : ' · unpaid'}</div>
        {!session && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>🎚️ <strong style={{ color: '#fff' }}>Open Decks</strong> — play whatever you like (no genre rules), unpaid, as many Mon–Wed as you want.</div>}
        <input value={night} onChange={e => setNight(e.target.value)} placeholder="Name of the night (optional)" style={inp} />
        {session ? (
          <>
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>What will you play? <span style={{ color: RED }}>tap up to {MAX_SUBS} sub-genres</span> · <span style={{ color: subs.length ? '#34D399' : 'rgba(255,255,255,0.5)' }}>{subs.length}/{MAX_SUBS}</span></div>
            <SubgenrePicker selected={subs} onChange={setSubs} blocked={blocked} max={MAX_SUBS} />
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
        <button onClick={() => claim(date)} disabled={busy} style={{ padding: '12px', fontSize: 13, fontWeight: 700, background: RED, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{busy ? '…' : (editing ? 'Save changes' : 'Confirm request')}</button>
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
                {form.image_url ? 'Change photo' : 'Upload a photo'}
                <input type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
              </label>
              {photoErr && <div style={{ fontSize: 11, color: '#F87171', marginTop: 6, lineHeight: 1.4 }}>{photoErr}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><div style={label}>DJ / artist name</div><input value={form.dj_name || ''} onChange={e => onField('dj_name', e.target.value)} style={inp} /></div>
            <div>
              <div style={label}>Music you play <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.4)' }}>— pick at least 5</span></div>
              <div style={{ marginTop: 8 }}>
                <SubgenrePicker selected={(form.genres || '').split('/').map(x => x.trim()).filter(Boolean)} onChange={names => onField('genres', names.join(' / '))} />
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: genreCount(form.genres) >= 5 ? '#34D399' : '#FCD34D' }}>
                {genreCount(form.genres)}/5 minimum{genreCount(form.genres) >= 5 ? ' ✓' : ''} <span style={{ color: 'rgba(255,255,255,0.4)' }}>· you can change these any time</span>
              </div>
            </div>
            <div><div style={label}>Instagram</div><input value={form.instagram || ''} onChange={e => onField('instagram', e.target.value)} placeholder="@yourhandle" style={inp} /></div>
            <div>
              <div style={label}>How you play <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.4)' }}>— tap any that apply</span></div>
              <div style={{ marginTop: 8 }}><FormatPicker selected={parseFormats(form.format)} onChange={a => onField('format', joinFormats(a))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><div style={label}>Phone</div><input value={form.phone || ''} onChange={e => onField('phone', e.target.value)} style={inp} /></div>
              <div style={{ flex: 1 }}><div style={label}>Email</div><input value={form.email || ''} onChange={e => onField('email', e.target.value)} style={inp} /></div>
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

        {/* Your booked dates */}
        {st.myBookings.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ ...label, marginBottom: 8 }}>Your dates</div>
            {st.myBookings.map(b => {
              const s = sessionFor(b.date)
              return (
                <div key={b.date} style={{ background: CARD, border: `1px solid ${LINE}`, borderLeft: `3px solid ${b.status === 'confirmed' ? '#34D399' : '#FCD34D'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{fmtDate(b.date)} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400, fontSize: 12 }}>· {s?.day} {timeLabel(s)}</span></div>
                    {b.night_name && <div style={{ fontSize: 12, color: RED }}>"{b.night_name}"</div>}
                    {(b.subgenres || []).length > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{(b.subgenres || []).join(' · ')}</div>}
                    {b.kind === 'opendecks' && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Open Decks{b.set_type ? ` · ${setTypeLabel(b.set_type)}` : ''}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: b.status === 'confirmed' ? '#34D399' : '#FCD34D' }}>{b.status === 'confirmed' ? 'Confirmed' : 'Requested'}</span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => startEdit(b)} style={{ background: 'none', border: 'none', color: RED, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>edit</button>
                      {b.status === 'pending' && <button onClick={() => cancel(b.date)} style={{ background: 'none', border: 'none', color: '#F87171', fontSize: 12, cursor: 'pointer' }}>cancel</button>}
                    </div>
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
                  const s = sessionFor(e.date)
                  const session = e.kind === 'session'
                  return (
                    <div key={e.date + '-' + i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderLeft: `3px solid ${e.status === 'confirmed' ? '#34D399' : '#FCD34D'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDate(e.date)} <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400, fontSize: 11 }}>· {s?.day} {timeLabel(s)}</span></div>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: e.status === 'confirmed' ? '#34D399' : '#FCD34D', whiteSpace: 'nowrap' }}>{e.status === 'confirmed' ? 'Confirmed' : 'Pencilled'}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#fff', marginTop: 2 }}>{e.dj}{e.night_name ? <span style={{ color: RED }}> · "{e.night_name}"</span> : null}</div>
                      {e.subgenres.length > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{e.subgenres.join(' · ')}</div>}
                      {!session && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Open Decks{e.set_type ? ` · ${setTypeLabel(e.set_type)}` : ''}</div>}
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
                  const s = sessionFor(b.date)
                  return (
                    <div key={b.date} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, opacity: 0.85 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDate(b.date)} <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400, fontSize: 11 }}>· {s?.day} {timeLabel(s)}</span></div>
                      {b.night_name && <div style={{ fontSize: 11, color: RED }}>"{b.night_name}"</div>}
                      {(b.subgenres || []).length > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{(b.subgenres || []).join(' · ')}</div>}
                      {b.kind === 'opendecks' && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Open Decks{b.set_type ? ` · ${setTypeLabel(b.set_type)}` : ''}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Edit panel for one of my dates (renders here, next to "Your dates") */}
        {claiming && mode === 'edit' && renderPanel()}

        {/* Pick a date — calendar */}
        <div className="serif" style={{ fontSize: 18, color: '#fff', marginBottom: 10 }}>Pick a date</div>
        {!complete ? (
          <div style={{ background: CARD, border: `1px dashed ${LINE}`, borderRadius: 12, padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6 }}>
            🔒 Add {need.join(' + ')} above (then tap <strong style={{ color: '#fff' }}>Save profile</strong>) to unlock the calendar.
          </div>
        ) : (
          <>
            <MonthCalendar year={viewY} month={viewM} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} canPrev={canPrevMonth} cellFor={cellFor} onDay={startClaim} selected={claiming}
              legend={<>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: RED, marginRight: 5, verticalAlign: 'middle' }} />Session (paid)</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#34D399', marginRight: 5, verticalAlign: 'middle' }} />Open Decks</span>
                <span style={{ color: '#FCD34D' }}>your bookings highlighted</span>
              </>} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, textAlign: 'center' }}>Tap a red-outlined date to book it.</div>
          </>
        )}
        {claiming && mode !== 'edit' && renderPanel()}
        </>)}

        <div style={{ textAlign: 'center', marginTop: 36, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>No Dice · London Fields</div>
      </div>
    </div>
  )
}
