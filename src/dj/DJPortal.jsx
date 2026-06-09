import React, { useEffect, useState } from 'react'
import { djPortal, resizeImage, sessionFor, fmtDate, timeLabel } from './api.js'

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
  const [claiming, setClaiming] = useState(null)
  const [night, setNight] = useState('')

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
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true); setMsg('Uploading photo…')
    try { const dataUrl = await resizeImage(file); refresh(await djPortal(token, 'photo', { dataUrl })); flash('Photo updated ✓') }
    catch (er) { flash(er.message || 'Upload failed') } finally { setBusy(false) }
  }
  const claim = async (date) => {
    setBusy(true)
    try { refresh(await djPortal(token, 'claim', { date, nightName: night })); setClaiming(null); setNight(''); flash('Date requested ✓ — No Dice will confirm.') }
    catch (e) { flash(e.message) } finally { setBusy(false) }
  }
  const cancel = async (date) => {
    setBusy(true)
    try { refresh(await djPortal(token, 'cancel', { date })); flash('Date released.') }
    catch (e) { flash(e.message) } finally { setBusy(false) }
  }

  if (loading) return <Center>Loading…</Center>
  if (err) return <Center><div><img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 200, marginBottom: 24 }} /><div style={{ color: 'rgba(255,255,255,0.8)' }}>{err}</div></div></Center>

  const complete = st.complete
  const inp = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 15, borderRadius: 8, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none', marginTop: 4 }
  const label = { fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }

  return (
    <div style={{ minHeight: '100vh', background: INK, color: '#fff', fontFamily: "'DM Sans',sans-serif", padding: '32px 18px 64px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 170, display: 'block', margin: '0 auto 6px' }} />
        <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: RED, marginBottom: 26 }}>DJ Portal</div>

        {msg && <div style={{ background: 'rgba(218,27,51,0.12)', border: `1px solid ${RED}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{msg}</div>}

        {/* Profile */}
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 20, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <Photo d={form} />
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 20, color: '#fff' }}>{form.dj_name || 'Your profile'}</div>
              <div style={{ fontSize: 12, color: complete ? '#34D399' : '#FCD34D', marginTop: 2, fontWeight: 600 }}>{complete ? '● Profile complete' : '○ Add a photo + music to finish'}</div>
              <label style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: RED, cursor: 'pointer', borderBottom: `1px solid ${RED}` }}>
                {form.image_url ? 'Change photo' : 'Upload a photo'}
                <input type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><div style={label}>DJ / artist name</div><input value={form.dj_name || ''} onChange={e => onField('dj_name', e.target.value)} style={inp} /></div>
            <div><div style={label}>Music you play</div><input value={form.genres || ''} onChange={e => onField('genres', e.target.value)} placeholder="e.g. Disco / Funk / House" style={inp} /></div>
            <div><div style={label}>Instagram</div><input value={form.instagram || ''} onChange={e => onField('instagram', e.target.value)} placeholder="@yourhandle" style={inp} /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><div style={label}>Format</div><input value={form.format || ''} onChange={e => onField('format', e.target.value)} placeholder="CDJ / Vinyl" style={inp} /></div>
              <div style={{ flex: 1 }}><div style={label}>Phone</div><input value={form.phone || ''} onChange={e => onField('phone', e.target.value)} style={inp} /></div>
            </div>
            <div><div style={label}>Email</div><input value={form.email || ''} onChange={e => onField('email', e.target.value)} style={inp} /></div>
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
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: b.status === 'confirmed' ? '#34D399' : '#FCD34D' }}>{b.status === 'confirmed' ? 'Confirmed' : 'Requested'}</span>
                  {b.status === 'pending' && <button onClick={() => cancel(b.date)} style={{ background: 'none', border: 'none', color: '#F87171', fontSize: 12, cursor: 'pointer' }}>cancel</button>}
                </div>
              )
            })}
          </div>
        )}

        {/* Open dates */}
        <div className="serif" style={{ fontSize: 18, color: '#fff', marginBottom: 10 }}>Open dates</div>
        {!complete ? (
          <div style={{ background: CARD, border: `1px dashed ${LINE}`, borderRadius: 12, padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6 }}>
            🔒 Finish your profile above (a <strong style={{ color: '#fff' }}>photo</strong> and your <strong style={{ color: '#fff' }}>music</strong>) to unlock the dates you can book.
          </div>
        ) : st.openSlots.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>No open dates right now — check back soon.</div>
        ) : (
          st.openSlots.map(date => {
            const s = sessionFor(date)
            const isClaiming = claiming === date
            return (
              <div key={date} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{fmtDate(date)}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s?.day} · {timeLabel(s)}</div>
                  </div>
                  {!isClaiming && <button onClick={() => { setClaiming(date); setNight('') }} disabled={busy} style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700, background: RED, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Request</button>}
                </div>
                {isClaiming && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${LINE}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input value={night} onChange={e => setNight(e.target.value)} placeholder="Name of the night (optional)" style={inp} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => claim(date)} disabled={busy} style={{ flex: 1, padding: '11px', fontSize: 13, fontWeight: 700, background: RED, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{busy ? '…' : 'Confirm request'}</button>
                      <button onClick={() => setClaiming(null)} style={{ padding: '11px 16px', fontSize: 13, background: 'transparent', color: 'rgba(255,255,255,0.6)', border: `1px solid ${LINE}`, borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}

        <div style={{ textAlign: 'center', marginTop: 36, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>No Dice · London Fields</div>
      </div>
    </div>
  )
}
