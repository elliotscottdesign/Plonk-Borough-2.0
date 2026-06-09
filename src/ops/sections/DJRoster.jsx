import React, { useState, useEffect } from 'react'
import { loadRoster, saveRoster, profileComplete } from '../data/djRoster.js'

// ─── DJ Roster — profile database (admin v1) ─────────────────────────────
// Every DJ who's played with us, as an editable profile: name, music, IG, photo.
// The photo is the key bit — once set, it auto-attaches to every event that DJ
// plays (no re-picking images on repeat dates). Seeded from the vetted CSV.
//
// Flow this sets up: (1) profile details complete  →  (2) calendar access.
// v1 is founder-editable + local. Next: invite links so each DJ fills their own
// profile + uploads their photo (Supabase storage), then auto-unlocks the calendar.

export function igHref(ig) {
  if (!ig) return null
  if (ig.startsWith('http')) return ig
  const h = ig.replace(/^@/, '').split(/[\s/.,]/)[0]
  return h ? `https://instagram.com/${h}` : null
}

export function Avatar({ d, size = 46 }) {
  const initials = (d.djName || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = [...((d.id || d.djName || ''))].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  if (d.image) return <img src={d.image} alt={d.djName} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block', border: '1px solid rgba(201,168,76,0.35)' }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `hsl(${hue} 42% 22%)`, color: '#fff', fontSize: size * 0.34, fontWeight: 700, border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>{initials}</div>
  )
}

const split = (s) => s.split(/[/,]/).map(x => x.trim()).filter(Boolean)

export default function DJRoster() {
  const [list, setList] = useState(loadRoster)
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState('')
  useEffect(() => saveRoster(list), [list])

  const update = (id, patch) => setList(l => l.map(d => d.id === id ? { ...d, ...patch } : d))
  const remove = (id) => { if (window.confirm('Remove this DJ profile?')) setList(l => l.filter(d => d.id !== id)) }
  const addNew = () => {
    const id = 'new-' + Date.now()
    setList(l => [{ id, djName: 'New DJ', realName: '', genres: [], genresText: '', instagram: '', format: '', phone: '', email: '', image: '', source: 'manual' }, ...l])
    setEditing(id)
  }

  const filtered = list.filter(d => (d.djName + ' ' + d.realName + ' ' + d.genresText + ' ' + d.instagram).toLowerCase().includes(q.toLowerCase()))
  const ready = list.filter(profileComplete).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 22, color: 'var(--cream)' }}>🎚️ DJ Roster</div>
          <div style={{ fontSize: 12, color: 'var(--cream-dim)', marginTop: 2 }}>
            {list.length} DJs · <span style={{ color: '#34D399' }}>{ready} ready</span> · <span style={{ color: '#FCD34D' }}>{list.length - ready} need a photo / details</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search DJs…" style={inp(170)} />
          <button onClick={addNew} style={btn('gold')}>+ Add DJ</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {filtered.map(d => {
          const done = profileComplete(d)
          const ig = igHref(d.instagram)
          const isEdit = editing === d.id
          return (
            <div key={d.id} style={{ background: 'var(--ink-2)', border: `1px solid ${done ? 'rgba(52,211,153,0.3)' : 'rgba(201,168,76,0.18)'}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Avatar d={d} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cream)' }}>{d.djName || 'Unnamed'}</div>
                  {d.realName && d.realName !== d.djName && <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{d.realName}</div>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {(d.genres || []).slice(0, 4).map((g, i) => <span key={i} style={chip}>{g}</span>)}
                    {d.format && <span style={{ ...chip, color: 'var(--gold)', borderColor: 'rgba(201,168,76,0.4)' }}>{d.format}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, color: 'var(--cream-dim)', flexWrap: 'wrap' }}>
                    {ig && <a href={ig} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none' }}>{d.instagram.split(/[\s/]/)[0]}</a>}
                    {d.phone && <span>{d.phone}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: done ? '#34D399' : '#FCD34D', whiteSpace: 'nowrap' }}>{done ? '● Ready' : '○ Needs photo'}</span>
              </div>

              {isEdit ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <Field label="DJ name"><input value={d.djName} onChange={e => update(d.id, { djName: e.target.value })} style={inp('100%')} /></Field>
                  <Field label="Real name"><input value={d.realName} onChange={e => update(d.id, { realName: e.target.value })} style={inp('100%')} /></Field>
                  <Field label="Music type (use / between)" wide><input value={d.genresText} onChange={e => update(d.id, { genresText: e.target.value, genres: split(e.target.value) })} style={inp('100%')} /></Field>
                  <Field label="Instagram"><input value={d.instagram} onChange={e => update(d.id, { instagram: e.target.value })} style={inp('100%')} /></Field>
                  <Field label="Format (CDJ / Vinyl)"><input value={d.format} onChange={e => update(d.id, { format: e.target.value })} style={inp('100%')} /></Field>
                  <Field label="Phone"><input value={d.phone} onChange={e => update(d.id, { phone: e.target.value })} style={inp('100%')} /></Field>
                  <Field label="Email"><input value={d.email} onChange={e => update(d.id, { email: e.target.value })} style={inp('100%')} /></Field>
                  <Field label="Photo URL (upload coming soon)" wide><input value={d.image} onChange={e => update(d.id, { image: e.target.value })} placeholder="paste an image link for now" style={inp('100%')} /></Field>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                    <button onClick={() => remove(d.id)} style={btn('red')}>Remove</button>
                    <button onClick={() => setEditing(null)} style={btn('gold')}>Done</button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10, textAlign: 'right' }}>
                  <button onClick={() => setEditing(d.id)} style={btn('ghost')}>Edit profile</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: 'var(--cream)' }}>Photos & invites (next step):</strong> right now you can paste a photo link. The proper version gives each DJ an <em>invite link</em> to fill their own profile and upload a photo from their phone — and only once a profile is complete do they unlock the booking calendar. That needs the shared database (Supabase + image storage); say the word and I'll wire it.
      </div>
    </div>
  )
}

function Field({ label, wide, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, gridColumn: wide ? '1 / -1' : 'auto' }}>
      <span style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {children}
    </label>
  )
}

const chip = { fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--cream)' }
const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: 'var(--gold)', color: 'var(--ink)' }
  if (kind === 'red') return { ...base, background: 'transparent', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }
  return { ...base, background: 'rgba(255,255,255,0.05)', color: 'var(--cream)', border: '1px solid rgba(201,168,76,0.3)' }
}
const inp = (w) => ({ width: w, minWidth: 0, padding: '8px 10px', fontSize: 13, borderRadius: 7, background: 'var(--ink)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--cream)', outline: 'none', boxSizing: 'border-box' })
