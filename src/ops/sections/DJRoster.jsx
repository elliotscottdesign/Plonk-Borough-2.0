import React, { useState } from 'react'
import { djAdmin, inviteLink } from '../../dj/api.js'

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
const complete = (d) => !!(d && d.dj_name && genreCount(d.genres) >= 5 && d.instagram && d.format && d.phone && d.email && d.image_url && d.soundcloud)
const chips = (g) => (g || '').split(/[/,]/).map(x => x.trim()).filter(Boolean)

export default function DJRoster({ djs, reload }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState(null)
  const [busy, setBusy] = useState(false)

  const startEdit = (d) => { setEditing(d.id); setForm({ ...d }) }
  const onField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const saveEdit = async () => { setBusy(true); try { await djAdmin('saveDj', { id: editing, profile: form }); setEditing(null); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const addNew = async () => { setBusy(true); try { await djAdmin('addDj', { profile: { dj_name: 'New DJ' } }); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const removeDj = async (id) => { if (!window.confirm('Remove this DJ profile?')) return; setBusy(true); try { await djAdmin('removeDj', { id }); setEditing(null); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const copyInvite = (d) => { try { navigator.clipboard.writeText(inviteLink(d.token)) } catch { /* ignore */ } setCopied(d.id); setTimeout(() => setCopied(null), 1600) }

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
            <div key={d.id} style={{ background: '#0A0A0A', border: `1px solid ${done ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.10)'}`, borderRadius: 12, padding: 14 }}>
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
                  <Field label="Music type (use / between)" wide><input value={form.genres || ''} onChange={e => onField('genres', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="Instagram"><input value={form.instagram || ''} onChange={e => onField('instagram', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="Format (CDJ / Vinyl)"><input value={form.format || ''} onChange={e => onField('format', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="Phone"><input value={form.phone || ''} onChange={e => onField('phone', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="Email"><input value={form.email || ''} onChange={e => onField('email', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="Photo URL (or DJ uploads via their link)" wide><input value={form.image_url || ''} onChange={e => onField('image_url', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="SoundCloud"><input value={form.soundcloud || ''} onChange={e => onField('soundcloud', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="Spotify"><input value={form.spotify || ''} onChange={e => onField('spotify', e.target.value)} style={inp('100%')} /></Field>
                  <Field label="YouTube" wide><input value={form.youtube || ''} onChange={e => onField('youtube', e.target.value)} style={inp('100%')} /></Field>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                    <button onClick={() => removeDj(d.id)} style={btn('red')}>Remove</button>
                    <button onClick={saveEdit} disabled={busy} style={btn('gold')}>{busy ? 'Saving…' : 'Save'}</button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => copyInvite(d)} style={btn(copied === d.id ? 'green' : 'gold')}>{copied === d.id ? '✓ Link copied' : '🔗 Copy invite link'}</button>
                  <button onClick={() => startEdit(d)} style={btn('ghost')}>Edit</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: '#fff' }}>Invite a DJ:</strong> hit <em>Copy invite link</em> and text/email it to them. They open it, fill their profile + upload a photo, and only then can they claim your open dates. Their photo auto-attaches to every event they play.
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
