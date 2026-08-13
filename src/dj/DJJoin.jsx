import React, { useEffect, useState } from 'react'
import { djSignup, resizeImage, PHOTO_MAX_PX, PHOTO_QUALITY } from './api.js'
import SubgenrePicker from './SubgenrePicker.jsx'
import FormatPicker, { parseFormats, joinFormats } from './FormatPicker.jsx'

// Public "Become a No Dice DJ" application — the open front door at /dj/join
// (also shown at /dj with no token). A brand-new DJ fills this in and lands on a
// simple thank-you; NO calendar opens. The booking team approves them in the
// back end, then sends their private portal link. Branded No Dice (red on black),
// mobile-first (DJs apply from their phones).

const RED = '#DA1B33', INK = '#000000', CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'

// Shared anti-bot access code. The edge fn re-checks this server-side (env
// DJ_JOIN_CODE, same default), so changing it there is the source of truth — this
// client copy just gates the form early. Keep the two in sync if it's rotated.
const JOIN_CODE = '6699'

// The three fields the back end needs to create a roster entry.
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim())

export default function DJJoin() {
  const [f, setF] = useState({ dj_name: '', real_name: '', genres: '', instagram: '', format: '', phone: '', email: '', soundcloud: '', spotify: '', youtube: '' })
  const [photo, setPhoto] = useState('')          // data URL of an optional profile photo
  const [photoErr, setPhotoErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [code, setCode] = useState('')            // access code entered on the gate
  const [unlocked, setUnlocked] = useState(false) // gate passed → show the form
  const [gateErr, setGateErr] = useState('')

  useEffect(() => {
    document.body.style.background = INK; document.body.style.color = '#fff'
    document.title = 'No Dice — Become a DJ'
  }, [])

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const onPhoto = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return
    setPhotoErr('')
    try { setPhoto(await resizeImage(file, PHOTO_MAX_PX, PHOTO_QUALITY)) }   // HEIC auto-converts; high-res for social reposts
    catch (er) { setPhotoErr(er.message || 'Photo upload failed — try a JPG or PNG.') }
  }

  const ready = !!f.dj_name.trim() && isEmail(f.email) && !!f.instagram.trim() && !!f.phone.trim()
  const submit = async () => {
    setErr('')
    if (!f.dj_name.trim()) return setErr('Please add your DJ / artist name.')
    if (!f.instagram.trim()) return setErr('Please add your Instagram so we can hear your sound.')
    if (!isEmail(f.email)) return setErr('Please add a valid email so we can reach you.')
    if (!f.phone.trim()) return setErr('Please add a phone number so we can reach you.')
    setBusy(true)
    try {
      await djSignup({ ...f, source: 'website' }, photo || undefined, code.trim())
      setDone(true)
      window.scrollTo(0, 0)
    } catch (e) { setErr(e.message || 'Something went wrong — please try again.') }
    finally { setBusy(false) }
  }

  const enterGate = () => {
    if (code.trim() === JOIN_CODE) { setUnlocked(true); setGateErr('') }
    else setGateErr("That code isn't right — ask No Dice for the DJ sign-up code.")
  }

  const inp = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 15, borderRadius: 8, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none', marginTop: 4 }
  const label = { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }
  const req = () => <span title="Required" style={{ color: RED, marginLeft: 5, fontWeight: 700 }}>*</span>
  const reqInp = (v, valid = null) => ({ ...inp, border: `1px solid ${(valid == null ? (v || '').toString().trim() : valid) ? '#34D399' : RED}` })

  // Plain function (NOT a component) so it doesn't remount the subtree — and drop
  // input focus — on every keystroke. Called as wrap(<>…</>), not <Wrap>.
  const wrap = (children) => (
    <div style={{ minHeight: '100vh', background: INK, color: '#fff', fontFamily: "'DM Sans',sans-serif", padding: '32px 18px 64px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 170, display: 'block', margin: '0 auto 6px' }} />
        <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: RED, marginBottom: 22 }}>Become a DJ</div>
        {children}
      </div>
    </div>
  )

  if (done) return wrap(
    <>
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🎧</div>
        <div className="serif" style={{ fontSize: 26, color: '#fff', marginBottom: 12 }}>Thanks for signing up{f.dj_name.trim() ? `, ${f.dj_name.trim()}` : ''}!</div>
        <div style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>We've got your details. Our booking team will have a listen and be in touch.</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)' }}>Nothing else to do for now. Keep an eye on your email — that's where your personal booking link will land once you're approved.</div>
        <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://www.instagram.com/nodice.bar/" target="_blank" rel="noopener noreferrer" style={{ padding: '11px 22px', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: '#fff', background: RED, borderRadius: 8, textDecoration: 'none' }}>Follow @nodice.bar</a>
          <a href="/" style={{ padding: '11px 22px', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: '#fff', background: 'transparent', border: `1px solid ${LINE}`, borderRadius: 8, textDecoration: 'none' }}>Back to nodice.bar</a>
        </div>
      </div>
    </>
  )

  if (!unlocked) return wrap(
    <>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 20 }}>
        Want to play at No Dice, London Fields? Enter the DJ sign-up code to start your profile.
      </div>
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 20 }}>
        <div style={label}>Sign-up code{req()}</div>
        <input
          value={code}
          onChange={e => { setCode(e.target.value); setGateErr('') }}
          onKeyDown={e => { if (e.key === 'Enter') enterGate() }}
          inputMode="numeric" autoComplete="off" placeholder="Enter code"
          style={{ ...inp, letterSpacing: '0.3em', textAlign: 'center', fontSize: 18 }}
        />
        {gateErr && <div style={{ fontSize: 13, color: '#F87171', marginTop: 10, lineHeight: 1.5 }}>{gateErr}</div>}
        <button onClick={enterGate} disabled={!code.trim()} style={{ marginTop: 14, width: '100%', padding: '14px', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: RED, color: '#fff', border: 'none', borderRadius: 8, cursor: code.trim() ? 'pointer' : 'default', opacity: code.trim() ? 1 : 0.5 }}>Continue</button>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.5, marginTop: 12 }}>Don't have the code? Ask us on <a href="https://www.instagram.com/nodice.bar/" target="_blank" rel="noopener noreferrer" style={{ color: RED, textDecoration: 'none' }}>@nodice.bar</a>.</div>
      </div>
    </>
  )

  return wrap(
    <>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 20 }}>
        Want to play at No Dice, London Fields? Tell us about yourself and our booking team will be in touch — no need to know anyone, just send us your sound.
      </div>

      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.62)', lineHeight: 1.5, background: 'rgba(218,27,51,0.07)', border: '1px solid rgba(218,27,51,0.25)', borderRadius: 8, padding: '9px 12px' }}>
            <span style={{ color: RED, fontWeight: 700 }}>*</span> = required. Everything else is optional — the more you add, the better we can pitch you a night.
          </div>

          {/* Optional profile photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {photo
              ? <img src={photo} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${RED}` }} />
              : <div style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', border: `2px dashed ${RED}`, fontSize: 24 }}>🎵</div>}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'inline-block', fontSize: 12, color: RED, cursor: 'pointer', borderBottom: `1px solid ${RED}` }}>
                {photo ? 'Change photo' : 'Add a photo (optional)'}
                <input type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
              </label>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, lineHeight: 1.4 }}>A press shot helps us picture your night.</div>
              {photoErr && <div style={{ fontSize: 11, color: '#F87171', marginTop: 6, lineHeight: 1.4 }}>{photoErr}</div>}
            </div>
          </div>

          <div><div style={label}>DJ / artist name{req()}</div><input value={f.dj_name} onChange={e => set('dj_name', e.target.value)} style={reqInp(f.dj_name)} /></div>
          <div><div style={label}>Real name <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.4)' }}>(optional)</span></div><input value={f.real_name} onChange={e => set('real_name', e.target.value)} style={inp} /></div>
          <div>
            <div style={label}>Music you play <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.4)' }}>— optional, pick any that fit</span></div>
            <div style={{ marginTop: 8 }}>
              <SubgenrePicker selected={(f.genres || '').split('/').map(x => x.trim()).filter(Boolean)} onChange={names => set('genres', names.join(' / '))} />
            </div>
          </div>
          <div><div style={label}>Instagram{req()}</div><input value={f.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@yourhandle" style={reqInp(f.instagram)} /></div>
          <div>
            <div style={label}>How you play <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.4)' }}>— optional, tap any that apply</span></div>
            <div style={{ marginTop: 8 }}><FormatPicker selected={parseFormats(f.format)} onChange={a => set('format', joinFormats(a))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><div style={label}>Phone{req()}</div><input value={f.phone} onChange={e => set('phone', e.target.value)} inputMode="tel" style={reqInp(f.phone)} /></div>
            <div style={{ flex: 1 }}><div style={label}>Email{req()}</div><input value={f.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" style={reqInp(f.email, f.email.trim() ? isEmail(f.email) : false)} /></div>
          </div>
          <div><div style={label}>SoundCloud <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.35)' }}>(optional)</span></div><input value={f.soundcloud} onChange={e => set('soundcloud', e.target.value)} placeholder="soundcloud.com/you" style={inp} /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><div style={label}>Spotify <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.35)' }}>(optional)</span></div><input value={f.spotify} onChange={e => set('spotify', e.target.value)} placeholder="open.spotify.com/…" style={inp} /></div>
            <div style={{ flex: 1 }}><div style={label}>YouTube <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.35)' }}>(optional)</span></div><input value={f.youtube} onChange={e => set('youtube', e.target.value)} placeholder="youtube.com/@you" style={inp} /></div>
          </div>

          {err && <div style={{ fontSize: 13, color: '#F87171', lineHeight: 1.5, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '9px 12px' }}>{err}</div>}

          <button onClick={submit} disabled={busy || !ready} style={{ marginTop: 4, padding: '14px', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: RED, color: '#fff', border: 'none', borderRadius: 8, cursor: (busy || !ready) ? 'default' : 'pointer', opacity: (busy || !ready) ? 0.5 : 1 }}>{busy ? 'Sending…' : 'Sign up to the roster'}</button>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.5 }}>We'll only use your details to book you for nights at No Dice.</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.6 }}>
        Already a No Dice DJ? Use the personal link we sent you to manage your profile and dates.
      </div>
    </>
  )
}
