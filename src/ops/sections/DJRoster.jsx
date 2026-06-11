import React, { useState, useEffect, useRef } from 'react'
import { djAdmin, inviteLink, resizeImage } from '../../dj/api.js'
import SubgenrePicker from '../../dj/SubgenrePicker.jsx'
import FormatPicker, { parseFormats, joinFormats } from '../../dj/FormatPicker.jsx'

// ─── DJ Roster — live profile database (admin) ───────────────────────────
// Reads/writes the Supabase `djs` table via dj-admin. Each DJ has a private
// invite link (their token) — copy it and text/email it so they fill their own
// profile + upload a photo, which then auto-attaches to their events.

export function igHref(ig) {
  if (!ig) return null
  if (ig.startsWith('http')) return ig
  const h = ig.replace(/^@/, '').split(/[\s/.,]/)[0]
  return h ? `https://instagram.com/${h}` : null
}
export function Avatar({ d, size = 46 }) {
  const img = d?.image_url || d?.image
  const name = d?.dj_name || d?.djName || '?'
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = [...((d?.id || name))].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  if (img) return <img src={img} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', border: '1px solid rgba(218,27,51,0.45)' }} />
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `hsl(${hue} 42% 22%)`, color: '#fff', fontSize: size * 0.34, fontWeight: 700, border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>{initials}</div>
}
const ext = (v) => v ? (/^https?:/.test(v) ? v : 'https://' + v) : null
const genreCount = (g) => (g || '').split('/').map(x => x.trim()).filter(Boolean).length
// All fields required except Spotify/YouTube, and at least 5 genres.
const complete = (d) => !!(d && d.dj_name && genreCount(d.genres) >= 5 && d.instagram && d.format && d.phone && d.email && d.image_url)
const chips = (g) => (g || '').split(/[/,]/).map(x => x.trim()).filter(Boolean)

export default function DJRoster({ djs, reload }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState(null)
  const [busy, setBusy] = useState(false)

  const editRef = useRef(null)
  // When a profile opens for editing (esp. a freshly-added one), scroll it into view.
  useEffect(() => { if (editing) editRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [editing])
  const startEdit = (d) => { setEditing(d.id); setForm({ ...d }) }
  const onField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const saveEdit = async () => { setBusy(true); try { await djAdmin('saveDj', { id: editing, profile: form }); setEditing(null); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const addNew = async () => {
    setBusy(true); setQ('')   // clear search so the new profile is visible
    try {
      const res = await djAdmin('addDj', { profile: { dj_name: 'New DJ' } })
      await reload()
      if (res?.id) startEdit({ id: res.id, dj_name: 'New DJ' })   // open the new profile straight away
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const removeDj = async (id) => { if (!window.confirm('Remove this DJ profile?')) return; setBusy(true); try { await djAdmin('removeDj', { id }); setEditing(null); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const copyInvite = (d) => { try { navigator.clipboard.writeText(inviteLink(d.token)) } catch { /* ignore */ } setCopied(d.id); setTimeout(() => setCopied(null), 1600) }
  // Normalise a stored phone to WhatsApp's international form (digits only).
  // UK mobiles are saved as 07… → 447…; respects +/00 country prefixes too.
  const waNumber = (phone) => {
    let n = String(phone || '').replace(/[^\d+]/g, '')
    if (!n) return ''
    if (n.startsWith('+')) n = n.slice(1)
    else if (n.startsWith('00')) n = n.slice(2)
    else if (n.startsWith('0')) n = '44' + n.slice(1)
    return n
  }
  // Open WhatsApp with the DJ's personal link + a ready-written invite. The
  // founder just hits send (sent from their own WhatsApp — no API needed).
  const waInvite = (d) => {
    const num = waNumber(d.phone)
    const msg = `Hey ${d.dj_name || 'there'}, I hope you are well! I have nearly got the business back open and I wanna book the DJs and events in again.\n\nI am struggling a bit to get open with money etc, literally doing this on empty right now, so if there is any way you can do a set for £60 (what I pay bar staff for 4 hours) and drinks and food that would be amazing.\n\nI am hoping to get sponsorship for events soon to get back to normal. I am also making a promotional tool to make DJs more money for mates they bring. So…. either way of course I wanna get you back in again!! So.....\n\nWelcome to the No Dice DJ roster….\n\nHere's your private link to set up your profile and grab the nights you want to play:\n${inviteLink(d.token)}\n\nIt walks you through everything, any questions, give us a shout. I hope the app makes everyone's lives easier! Much love E`
    const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  const onPhoto = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file || !editing) return
    setBusy(true)
    try {
      const dataUrl = await resizeImage(file)   // HEIC auto-converts
      const snap = await djAdmin('photo', { id: editing, dataUrl })
      const u = (snap.djs || []).find(d => d.id === editing)
      if (u) setForm(u)
      await reload()
    } catch (er) { alert(er.message || 'Photo upload failed') } finally { setBusy(false) }
  }

  const filtered = (djs || []).filter(d => `${d.dj_name} ${d.real_name || ''} ${d.genres || ''} ${d.instagram || ''}`.toLowerCase().includes(q.toLowerCase()))
  const ready = (djs || []).filter(complete).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 22, color: '#FFFFFF' }}>🎚️ DJ Roster</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            {(djs || []).length} DJs · <span style={{ color: '#34D399' }}>{ready} ready</span> · <span style={{ color: '#FCD34D' }}>{(djs || []).length - ready} incomplete</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search DJs…" style={inp(170)} />
          <button onClick={addNew} disabled={busy} style={btn('gold')}>+ Add DJ</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {filtered.map(d => {
          const done = complete(d)
          const ig = igHref(d.instagram)
          const isEdit = editing === d.id
          return (
            <div key={d.id} ref={isEdit ? editRef : null} style={{ background: '#0A0A0A', border: `1px solid ${isEdit ? '#DA1B33' : done ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.10)'}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Avatar d={d} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>{d.dj_name || 'Unnamed'}</div>
                  {d.real_name && d.real_name !== d.dj_name && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{d.real_name}</div>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {chips(d.genres).slice(0, 4).map((g, i) => <span key={i} style={chip}>{g}</span>)}
                    {d.format && <span style={{ ...chip, color: '#DA1B33', borderColor: 'rgba(218,27,51,0.45)' }}>{d.format}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.6)', flexWrap: 'wrap' }}>
                    {ig && <a href={ig} target="_blank" rel="noreferrer" style={{ color: '#DA1B33', textDecoration: 'none' }}>{(d.instagram || '').split(/[\s/]/)[0]}</a>}
                    {d.soundcloud && <a href={ext(d.soundcloud)} target="_blank" rel="noreferrer" style={{ color: '#DA1B33', textDecoration: 'none' }}>SoundCloud</a>}
                    {d.spotify && <a href={ext(d.spotify)} target="_blank" rel="noreferrer" style={{ color: '#DA1B33', textDecoration: 'none' }}>Spotify</a>}
                    {d.youtube && <a href={ext(d.youtube)} target="_blank" rel="noreferrer" style={{ color: '#DA1B33', textDecoration: 'none' }}>YouTube</a>}
                    {d.phone && <span>{d.phone}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: done ? '#34D399' : '#FCD34D', whiteSpace: 'nowrap' }}>{done ? '● Ready' : '○ Incomplete'}</span>
              </div>

              {isEdit ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <Field label="DJ name"><input value={form.dj_name || ''} onChange={e => onField('dj_name', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="Real name"><input value={form.real_name || ''} onChange={e => onField('real_name', e.target.value)} style={inp('100%')} /></Field>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Music type — tap genres (min 5) · add your own under each</div>
                    <SubgenrePicker selected={(form.genres || '').split('/').map(x => x.trim()).filter(Boolean)} onChange={names => onField('genres', names.join(' / '))} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Format — how they play (tap any)</div>
                    <FormatPicker selected={parseFormats(form.format)} onChange={a => onField('format', joinFormats(a))} />
                  </div>
                  <Field label="Instagram"><input value={form.instagram || ''} onChange={e => onField('instagram', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="Phone"><input value={form.phone || ''} onChange={e => onField('phone', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="Email" wide><input value={form.email || ''} onChange={e => onField('email', e.target.value)} style={inp('100%')} /></Field>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar d={form} size={48} />
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Photo</div>
                      <label style={{ display: 'inline-block', marginTop: 4, fontSize: 12, color: '#DA1B33', cursor: 'pointer', borderBottom: '1px solid #DA1B33' }}>
                        {form.image_url ? 'Change photo' : 'Upload a photo'}
                        <input type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
                      </label>
                      {busy && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 10 }}>working…</span>}
                    </div>
                  </div>
                  <Field label="SoundCloud"><input value={form.soundcloud || ''} onChange={e => onField('soundcloud', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="Spotify"><input value={form.spotify || ''} onChange={e => onField('spotify', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="YouTube" wide><input value={form.youtube || ''} onChange={e => onField('youtube', e.target.value)} style={inp('100%')} /></Field>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                    <button onClick={() => removeDj(d.id)} style={btn('red')}>Remove</button>
                    <button onClick={saveEdit} disabled={busy} style={btn('gold')}>{busy ? 'Saving…' : 'Save'}</button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {d.phone && <button onClick={() => waInvite(d)} style={btn('green')}>📲 WhatsApp invite</button>}
                  <button onClick={() => copyInvite(d)} style={btn(copied === d.id ? 'green' : 'gold')}>{copied === d.id ? '✓ Link copied' : '🔗 Copy link'}</button>
                  <button onClick={() => startEdit(d)} style={btn('ghost')}>Edit</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: '#fff' }}>Invite a DJ:</strong> tap <em>📲 WhatsApp invite</em> — it opens WhatsApp with their personal link and a ready-written message, you just hit send. No number on file? Use <em>Copy link</em>, or add their number via <em>Edit</em>. They open the link, fill their profile + photo, and can then claim your open dates (their photo auto-attaches to every event they play).
      </div>
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
