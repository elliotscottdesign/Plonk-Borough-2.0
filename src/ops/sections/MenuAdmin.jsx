import React, { useState, useEffect } from 'react'
import { rotaMenus, rotaAddMenu, rotaDeleteMenu } from '../../rota/api.js'
import { openMenu, fileToDataUrl } from '../../rota/menuFile.js'

// ─── Menus (founder) ─────────────────────────────────────────────────────────
// Upload the week's menus (PDF or image). Staff view + print them from their
// portal. Files are stored as data URLs via the `rota` fn.

const RED = '#DA1B33', LINE = 'rgba(255,255,255,0.12)'
const fmt = (t) => t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

export default function MenuAdmin() {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')

  const load = async () => { setLoading(true); try { const r = await rotaMenus(); setMenus(r.menus || []) } catch (e) { /* */ } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const onFile = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    const kind = f.type.includes('pdf') ? 'pdf' : f.type.startsWith('image/') ? 'image' : ''
    if (!kind) { alert('Upload a PDF or an image.'); return }
    setBusy(true)
    try {
      const dataUrl = await fileToDataUrl(f)
      await rotaAddMenu(title.trim() || f.name.replace(/\.[^.]+$/, ''), kind, dataUrl)
      setTitle(''); await load()
    } catch (er) { alert(er.message) } finally { setBusy(false) }
  }
  const remove = async (m) => { if (!window.confirm(`Delete "${m.title}"?`)) return; setBusy(true); try { await rotaDeleteMenu(m.id); await load() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const view = async (m) => { try { await openMenu(m.id) } catch (e) { alert(e.message) } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="serif" style={{ fontSize: 22, color: '#fff' }}>🍽️ Menus</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Upload the week's menus — staff view &amp; print them from their portal.</div>
      </div>

      <div style={{ background: '#0A0A0A', border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Menu name (e.g. Drinks — w/c 21 Jul)" style={{ flex: 1, minWidth: 180, padding: '9px 11px', fontSize: 13.5, borderRadius: 8, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none' }} />
        <label style={{ ...btn('gold'), display: 'inline-block' }}>{busy ? 'Uploading…' : '⬆ Upload PDF / image'}<input type="file" accept="application/pdf,image/*" onChange={onFile} disabled={busy} style={{ display: 'none' }} /></label>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', padding: '20px 0', textAlign: 'center' }}>Loading…</div>
      ) : menus.length === 0 ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '20px 16px' }}>No menus uploaded yet. Add this week's menus above.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {menus.map(m => (
            <div key={m.id} style={{ background: '#0A0A0A', border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>{m.kind === 'image' ? '🖼️' : '📄'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{m.kind.toUpperCase()} · added {fmt(m.created_at)}</div>
              </div>
              <button onClick={() => view(m)} style={btn('ghost')}>View / print</button>
              <button onClick={() => remove(m)} disabled={busy} style={btn('red')}>Delete</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 8, padding: '12px 14px' }}>
        Keep files under ~4MB. Staff open <strong style={{ color: '#fff' }}>Menus</strong> in their portal, tap a menu, and print from the browser to the on-site printer.
      </div>
    </div>
  )
}

const btn = (kind) => {
  const base = { padding: '8px 13px', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: RED, color: '#fff' }
  if (kind === 'red') return { ...base, background: 'transparent', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }
}
