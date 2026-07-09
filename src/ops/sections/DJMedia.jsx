import React, { useState } from 'react'

// ─── DJ Media library (founder) ──────────────────────────────────────────────
// One place to see and download every image the DJs have uploaded — profile
// photos (djs.image_url) and per-event artwork (dj_slots.event_image_url) — so
// the founder can grab them for reposting / tagging on socials.
//
// Zero quality loss: every download fetches the EXACT file stored in the
// `dj-photos` bucket and saves those bytes as-is — no canvas, no re-encode, no
// resize. (The bucket serves Access-Control-Allow-Origin:* so a cross-origin
// fetch→blob works; if a fetch is ever blocked we fall back to opening the image
// so it can still be saved by hand — never re-compressed.)

const RED = '#DA1B33'

// Turn a display name into a safe filename stem, e.g. "DJ Format" → "DJ-Format".
const sanitize = (s) => (s || 'dj').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'dj'

// Normalise whatever the DJ put in the Instagram field to a bare @handle.
const igHandle = (ig) => {
  if (!ig) return ''
  const h = String(ig).trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/[/?].*$/, '')
    .replace(/^@/, '')
  return h ? '@' + h : ''
}
const igUrl = (ig) => { const h = igHandle(ig).slice(1); return h ? `https://instagram.com/${h}` : null }

const extFromType = (t) => ({ 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/heic': 'heic' })[(t || '').toLowerCase()] || ''
const extFromUrl = (u) => { const m = /\.([a-z0-9]{3,4})(?:\?|#|$)/i.exec(u || ''); return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : '' }

// Save a blob to disk with a chosen filename. Uses an object URL (same-origin
// blob:), so the download attribute + filename are always honoured.
function saveBlob(blob, filename) {
  const obj = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = obj; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(obj), 5000)
}

// Lossless download of ONE image — fetch the stored bytes and save them
// untouched (no canvas / re-encode). Falls back to opening the file if a fetch
// is ever blocked. Returns true if it downloaded.
async function downloadImage(url, baseName) {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const ext = extFromType(blob.type) || extFromUrl(url) || 'jpg'
    saveBlob(blob, `${baseName}.${ext}`)
    return true
  } catch {
    window.open(url, '_blank', 'noopener')   // fallback: user saves manually — still the original file
    return false
  }
}

// JSZip, loaded on demand from a CDN only when a bulk download is triggered —
// same pattern the DJ portal uses for heic2any. Cached after first load.
let _jszip = null
async function loadJSZip() {
  if (_jszip) return _jszip
  const mod = await import(/* @vite-ignore */ 'https://esm.sh/jszip@3.10.1')
  _jszip = mod.default || mod
  return _jszip
}

// Bulk download → ONE .zip of the originals. ZIP is a lossless container (we
// store the fetched bytes verbatim), so no quality is lost. onProgress(done,total)
// reports fetch progress. Returns the number of images that made it in.
async function downloadZip(items, zipName, onProgress) {
  const JSZip = await loadJSZip()
  const zip = new JSZip()
  const used = new Set()
  let done = 0
  for (const it of items) {
    try {
      const res = await fetch(it.url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const ext = extFromType(blob.type) || extFromUrl(it.url) || 'jpg'
      let name = `${it.baseName}.${ext}`
      for (let i = 2; used.has(name); i++) name = `${it.baseName}-${i}.${ext}`   // avoid collisions inside the zip
      used.add(name)
      zip.file(name, blob)
    } catch { /* skip an image that won't fetch; the rest still zip */ }
    done++; onProgress?.(done, items.length)
  }
  const out = await zip.generateAsync({ type: 'blob' })   // default DEFLATE — lossless for the stored bytes
  saveBlob(out, zipName)
  return used.size
}

// One thumbnail tile — shows the image, its real resolution, and a download button.
function Tile({ item }) {
  const [dim, setDim] = useState(null)
  const [busy, setBusy] = useState(false)
  const grab = async () => { setBusy(true); try { await downloadImage(item.url, item.baseName) } finally { setBusy(false) } }
  return (
    <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: 'rgba(255,255,255,0.03)' }}>
        <img src={item.url} alt={item.label} loading="lazy" onLoad={e => setDim({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff', background: item.kind === 'profile' ? 'rgba(218,27,51,0.85)' : 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: 5 }} data-keep-color>{item.kind === 'profile' ? 'Profile' : item.dateLabel}</span>
        {dim && <span style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 9.5, fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 5 }} data-keep-color>{dim.w}×{dim.h}</span>}
      </div>
      <button onClick={grab} disabled={busy} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '8px 10px', fontSize: 12, fontWeight: 600, cursor: busy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {busy ? 'Saving…' : '⬇ Download'}
      </button>
    </div>
  )
}

// One DJ's block — profile photo + any event artwork, with a bulk download.
function DJGroup({ group }) {
  const [running, setRunning] = useState(false)
  const [prog, setProg] = useState(0)
  const items = group.items
  const handle = igHandle(group.dj.instagram)
  const url = igUrl(group.dj.instagram)

  const grabAll = async () => {
    setRunning(true); setProg(0)
    try { await downloadZip(items, `NoDice-${sanitize(group.dj.dj_name)}.zip`, (d) => setProg(d)) }
    catch { for (const it of items) await downloadImage(it.url, it.baseName) }   // CDN blocked → individual saves
    finally { setRunning(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{group.dj.dj_name || 'Unnamed DJ'}</span>
          {handle && (url
            ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: RED, fontWeight: 600, marginLeft: 10, textDecoration: 'none' }}>{handle}</a>
            : <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginLeft: 10 }}>{handle}</span>)}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginLeft: 10 }}>{items.length} image{items.length === 1 ? '' : 's'}</span>
        </div>
        {items.length > 1 && (
          <button onClick={grabAll} disabled={running} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 7, cursor: running ? 'default' : 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', whiteSpace: 'nowrap' }}>
            {running ? `Zipping ${prog}/${items.length}…` : `⬇ Download all ${items.length} (.zip)`}
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {items.map(it => <Tile key={it.key} item={it} />)}
      </div>
    </div>
  )
}

export default function DJMedia({ djs = [], slots = [] }) {
  const [runningAll, setRunningAll] = useState(false)
  const [progAll, setProgAll] = useState(0)

  // Build one group per DJ: profile photo first, then their event artwork.
  const groups = new Map()
  const groupFor = (dj) => {
    const id = dj?.id || 'unknown'
    if (!groups.has(id)) groups.set(id, { dj: dj || { dj_name: 'Event artwork' }, items: [] })
    return groups.get(id)
  }
  for (const d of djs) {
    if (!d?.image_url) continue
    groupFor(d).items.push({
      key: `p-${d.id}`, kind: 'profile', url: d.image_url, label: `${d.dj_name} profile photo`,
      baseName: `NoDice-${sanitize(d.dj_name)}-profile`,
    })
  }
  const seenEvent = new Set()
  for (const s of slots) {
    if (!s?.event_image_url || seenEvent.has(s.event_image_url)) continue
    seenEvent.add(s.event_image_url)
    const dj = s.dj || (s.dj_id ? djs.find(d => d.id === s.dj_id) : null)
    const dateLabel = s.date ? new Date(s.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Event'
    groupFor(dj).items.push({
      key: `e-${s.date}-${s.slot}`, kind: 'event', url: s.event_image_url, dateLabel,
      label: `${dj?.dj_name || s.night_name || 'Event'} — ${dateLabel}`,
      baseName: `NoDice-${sanitize(dj?.dj_name || s.night_name || 'event')}-${s.date || dateLabel}`,
    })
  }

  // DJs with a profile photo first, then alphabetical.
  const list = [...groups.values()]
    .filter(g => g.items.length)
    .sort((a, b) => {
      const ap = a.items.some(i => i.kind === 'profile'), bp = b.items.some(i => i.kind === 'profile')
      if (ap !== bp) return ap ? -1 : 1
      return (a.dj.dj_name || '').localeCompare(b.dj.dj_name || '')
    })
  const allItems = list.flatMap(g => g.items)

  const grabEverything = async () => {
    setRunningAll(true); setProgAll(0)
    try { await downloadZip(allItems, 'NoDice-DJ-images.zip', (d) => setProgAll(d)) }
    catch { for (const it of allItems) await downloadImage(it.url, it.baseName) }   // CDN blocked → individual saves
    finally { setRunningAll(false) }
  }

  if (!allItems.length) {
    return (
      <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 28, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6 }}>
        No DJ images yet.<br />Profile photos and event artwork will appear here automatically as your DJs upload them.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ background: 'rgba(218,27,51,0.06)', border: '1px solid rgba(218,27,51,0.3)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{allItems.length} image{allItems.length === 1 ? '' : 's'} from {list.length} DJ{list.length === 1 ? '' : 's'}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Downloads are the full original file — exactly as uploaded, no quality lost. Tap a DJ's handle to open their profile for tagging.</div>
        </div>
        <button onClick={grabEverything} disabled={runningAll} style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: runningAll ? 'default' : 'pointer', background: RED, color: '#fff', border: 'none', whiteSpace: 'nowrap' }} data-keep-color>
          {runningAll ? `Zipping ${progAll}/${allItems.length}…` : `⬇ Download everything (${allItems.length}) as .zip`}
        </button>
      </div>

      {list.map(g => <DJGroup key={g.dj.id || g.dj.dj_name} group={g} />)}
    </div>
  )
}
