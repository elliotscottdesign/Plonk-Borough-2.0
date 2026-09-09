import React, { useState, useEffect, useRef } from 'react'
import { djAdmin, djBlastEmail, inviteLink, resizeImage, PHOTO_MAX_PX, PHOTO_QUALITY, fillTemplate, tplBody } from '../../dj/api.js'
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
// Exactly what a profile is still missing — so the admin can see what's blocking a
// DJ from finishing (mirrors the required fields the DJ portal enforces).
const missingFields = (d) => {
  const m = []
  if (!d?.dj_name || d.dj_name === 'New DJ') m.push('a name')
  const gc = genreCount(d?.genres)
  if (gc < 5) m.push(`${gc}/5 genres`)
  if (!d?.instagram) m.push('Instagram')
  if (!d?.format) m.push('format (how they play)')
  if (!d?.phone) m.push('phone')
  if (!d?.email) m.push('email')
  if (!d?.image_url) m.push('a photo')
  return m
}
const chips = (g) => (g || '').split(/[/,]/).map(x => x.trim()).filter(Boolean)
// The release orders the founder can pick from when dropping next month's dates.
const RELEASE_MODES = [
  { key: 'played_first', label: 'Regulars first', desc: 'Residents who played last month get the 24h head-start, then the rest' },
  { key: 'fresh_first', label: 'Fresh faces first', desc: "Residents who didn't play last month go first — spreads nights around" },
  { key: 'all_residents', label: 'All residents at once', desc: 'Message every resident together, no 24h wait' },
  { key: 'everyone', label: 'Open to everyone now', desc: 'Open to all DJs immediately — no resident priority' },
]
const modeLabel = (k) => (RELEASE_MODES.find(m => m.key === k) || {}).label || k

export default function DJRoster({ djs, slots, release, templates, reload }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState(null)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('vetted')        // 'vetted' | 'resident' | 'pending'
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkSource, setBulkSource] = useState('instagram')

  const editRef = useRef(null)
  // When a profile opens for editing (esp. a freshly-added one), scroll it into view.
  useEffect(() => { if (editing) editRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [editing])
  const startEdit = (d) => { setEditing(d.id); setForm({ ...d }) }
  const onField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const saveEdit = async () => { setBusy(true); try { await djAdmin('saveDj', { id: editing, profile: form }); setEditing(null); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const addNew = async () => {
    setBusy(true); setQ('')   // clear search so the new profile is visible
    try {
      const pending = tab === 'pending'
      const res = await djAdmin('addDj', { profile: { dj_name: 'New DJ', status: pending ? 'pending' : 'vetted', source: 'manual' } })
      await reload()
      if (res?.id) startEdit({ id: res.id, dj_name: 'New DJ', status: pending ? 'pending' : 'vetted' })   // open the new profile straight away
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const approve = async (id) => { setBusy(true); try { await djAdmin('approve', { id }); setEditing(null); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  // Turn pasted lines into pending-DJ rows. Flexible: each line can mix name,
  // @instagram, phone, email, genres in any order (comma / tab / pipe separated).
  const parseBulk = (text) => String(text || '').split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const parts = line.split(/[\t,|]+/).map(p => p.trim()).filter(Boolean)
    const row = {}
    for (const p of parts) {
      if (p.startsWith('@') || /instagram\.com/i.test(p)) { if (!row.instagram) row.instagram = p }
      else if (/^\+?\d[\d\s()-]{6,}$/.test(p)) { if (!row.phone) row.phone = p }
      else if (p.includes('@') && /\.[a-z]{2,}$/i.test(p)) { if (!row.email) row.email = p }
      else if (!row.dj_name) row.dj_name = p
      else if (!row.genres) row.genres = p
    }
    if (!row.dj_name && row.instagram) row.dj_name = row.instagram.replace(/^@/, '')
    return row
  }).filter(r => r.dj_name || r.instagram)
  const bulkAdd = async () => {
    const rows = parseBulk(bulkText)
    if (!rows.length) { alert('Paste at least one contact — a name and/or an @handle per line.'); return }
    setBusy(true)
    try {
      const res = await djAdmin('bulkAdd', { list: rows, source: bulkSource })
      const n = res?.added ?? rows.length
      setBulkText(''); setBulkOpen(false); setTab('pending'); await reload()
      alert(`Added ${n} contact${n === 1 ? '' : 's'} to Pending.`)
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
    const msg = fillTemplate(tplBody(templates, 'invite'), { name: d.dj_name || 'there', link: inviteLink(d.token) })
    const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // ── Residents tier + monthly release ──────────────────────────────────────
  const [, setTick] = useState(0)   // re-render each minute so the countdown ticks
  const [pickMode, setPickMode] = useState('played_first')   // release order chosen before starting
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 60000); return () => clearInterval(t) }, [])
  const rel = async (action, payload = {}) => { setBusy(true); try { await djAdmin(action, payload); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const setResident = (d, on) => rel('setResident', { id: d.id, resident: on })

  // Residents who played a confirmed night LAST calendar month = lower-priority batch.
  const isoD = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  const _now = new Date()
  const lmFrom = isoD(new Date(_now.getFullYear(), _now.getMonth() - 1, 1))
  const lmTo = isoD(new Date(_now.getFullYear(), _now.getMonth(), 0))
  const playedLastMonth = new Set((slots || []).filter(s => s.status === 'confirmed' && s.dj_id && s.date >= lmFrom && s.date <= lmTo).map(s => s.dj_id))
  const _nm = new Date(_now.getFullYear(), _now.getMonth() + 1, 1)
  const nextMonthLabel = _nm.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const nextMonthYM = `${_nm.getFullYear()}-${String(_nm.getMonth() + 1).padStart(2, '0')}`

  const waSend = (d, msg) => {
    const num = waNumber(d.phone)
    if (!num) { alert(`No WhatsApp number on file for ${d.dj_name || 'this DJ'} — add one via Edit.`); return }
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
  }
  const tvars = (d) => ({ name: d.dj_name || 'there', link: inviteLink(d.token), month: nextMonthLabel })
  // 'all at once' messages everyone together with no 24h promise → use the
  // second-batch copy, not the first-dibs/"you've got 24 hours" copy.
  const msgNewDates = (d, priority) => fillTemplate(tplBody(templates, (priority && releaseMode !== 'all_residents') ? 'release_first' : 'release_played'), tvars(d))
  const msg6h = (d) => fillTemplate(tplBody(templates, 'release_6h'), tvars(d))

  // One-click EMAIL blast to every vetted DJ — their link + "the {month} dates are
  // open". Month = the latest OPEN (bookable) month. Recipients are built server-side
  // from the roster (the client only sends the month/subject/body), so the secret
  // can't be abused to email arbitrary people.
  const relMax = (slots || []).filter(s => s.status === 'open').reduce((m, s) => (s.date > m ? s.date : m), '')
  const blastMonthLabel = (relMax ? new Date(relMax + 'T00:00:00') : _nm).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const emailAll = async () => {
    const count = (djs || []).filter(d => d.status !== 'pending' && d.email && d.token)
      .reduce((set, d) => set.add(String(d.email).trim().toLowerCase()), new Set()).size
    if (!count) { alert('No DJs with an email address on file yet.'); return }
    if (!window.confirm(`Email all ${count} DJs that the ${blastMonthLabel} dates are open, with their personal booking link?`)) return
    setBusy(true)
    try { const r = await djBlastEmail({ month: blastMonthLabel, subject: `The ${blastMonthLabel} dates are open at No Dice 🎧`, body: tplBody(templates, 'email_dates') }); alert(`✓ Emailed ${r.sent} DJ${r.sent === 1 ? '' : 's'}.`) }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  // Release-window timing (messaging-order, not a hard lock).
  const startedAt = release?.started_at ? new Date(release.started_at).getTime() : null
  const openedAllAt = release?.opened_all_at ? new Date(release.opened_all_at).getTime() : null
  const hrs = startedAt ? (Date.now() - startedAt) / 3600000 : null
  const group2Open = hrs !== null && hrs >= 24
  const within6h = hrs !== null && hrs >= 18 && hrs < 24
  const fmtT = (ms) => new Date(ms).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const resRow = (d, priority) => (
    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
      <Avatar d={d} size={30} />
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.dj_name}{!complete(d) && <span style={{ fontSize: 10, color: '#FCD34D', marginLeft: 6 }}>○ profile incomplete</span>}</div>
      {d.phone
        ? <button onClick={() => waSend(d, msgNewDates(d, priority))} disabled={!priority && !group2Open} style={btn(priority ? 'green' : 'gold')}>📲 Message</button>
        : <span style={{ fontSize: 10, color: '#F87171' }}>no number</span>}
    </div>
  )
  const onPhoto = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file || !editing) return
    setBusy(true)
    try {
      const dataUrl = await resizeImage(file, PHOTO_MAX_PX, PHOTO_QUALITY)   // HEIC auto-converts; high-res for social reposts
      const snap = await djAdmin('photo', { id: editing, dataUrl })
      const u = (snap.djs || []).find(d => d.id === editing)
      if (u) setForm(u)
      await reload()
    } catch (er) { alert(er.message || 'Photo upload failed') } finally { setBusy(false) }
  }

  const statusOf = (d) => d.status || 'vetted'
  const vettedN = (djs || []).filter(d => statusOf(d) === 'vetted').length
  const pendingN = (djs || []).filter(d => statusOf(d) === 'pending').length
  const residentsAll = (djs || []).filter(d => d.resident)
  const residentN = residentsAll.length
  const playedG = residentsAll.filter(d => playedLastMonth.has(d.id))
  const freshG = residentsAll.filter(d => !playedLastMonth.has(d.id))
  // The chosen release order decides who's in the first-dibs batch (g1) vs the
  // after-24h batch (g2). Live mode once started, else the picker value.
  const releaseMode = release?.release_mode || pickMode
  let g1, g2, g1Label, g2Label
  if (releaseMode === 'played_first') { g1 = playedG; g2 = freshG; g1Label = 'Played last month'; g2Label = "Didn't play last month" }
  else if (releaseMode === 'all_residents') { g1 = residentsAll; g2 = []; g1Label = 'All residents'; g2Label = '' }
  else if (releaseMode === 'everyone') { g1 = []; g2 = []; g1Label = ''; g2Label = '' }
  else { g1 = freshG; g2 = playedG; g1Label = "Didn't play last month"; g2Label = 'Played last month' }
  const twoGroup = releaseMode === 'fresh_first' || releaseMode === 'played_first'
  const openNextMonth = new Set((slots || []).filter(s => s.status === 'open' && !s.dj_id && (s.date || '').startsWith(nextMonthYM)).map(s => s.date)).size
  const openAndRelease = async () => {
    if (!window.confirm(`Open every Mon–Sat night in ${nextMonthLabel} for DJs and start the “${modeLabel(pickMode)}” release?`)) return
    setBusy(true)
    try { await djAdmin('openMonth', { month: nextMonthYM }); await djAdmin('releaseStart', { month: nextMonthYM, mode: pickMode }); await reload() }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const inTab = tab === 'resident' ? residentsAll : (djs || []).filter(d => statusOf(d) === tab)
  const filtered = inTab.filter(d => `${d.dj_name} ${d.real_name || ''} ${d.genres || ''} ${d.instagram || ''}`.toLowerCase().includes(q.toLowerCase()))
  const ready = inTab.filter(complete).length

  // ── Broadcast banner — one message that shows as a header in EVERY DJ's portal
  // (stored as dj_templates key='banner'). One-click; no per-DJ WhatsApp needed.
  const liveBanner = tplBody(templates, 'banner')
  const [bcast, setBcast] = useState(liveBanner)
  const postBanner = async () => {
    const body = (bcast || '').trim()
    if (body && !window.confirm('Post this to EVERY DJ\'s portal as a header banner?')) return
    setBusy(true)
    try { await djAdmin('saveTemplate', { key: 'banner', body }); await reload(); alert(body ? 'Posted to all DJ portals ✓' : 'Banner cleared.') }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const clearBanner = async () => { setBcast(''); setBusy(true); try { await djAdmin('saveTemplate', { key: 'banner', body: '' }); await reload(); alert('Banner cleared — it\'s gone from every portal.') } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const whatsappAll = async () => {
    const msg = (bcast || '').trim()
    if (!msg) { alert('Type a message first.'); return }
    if (!window.confirm(`Send this to EVERY DJ on WhatsApp?\n\n"${msg}"`)) return
    setBusy(true)
    try { const r = await djAdmin('whatsappBlast', { body: msg }); alert(`✓ WhatsApp sent to ${r.sent} DJ${r.sent === 1 ? '' : 's'}${r.skipped ? ` · ${r.skipped} skipped (no usable mobile)` : ''}.`) }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Broadcast to all DJ portals */}
      <div style={{ background: '#0A0A0A', border: '1px solid rgba(218,27,51,0.35)', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>📣 Message all DJs</div>
          {liveBanner && <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34D399', border: '1px solid rgba(52,211,153,0.5)', borderRadius: 999, padding: '1px 8px' }}>Live now</span>}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 10 }}>One click — this shows as a red header banner at the top of <strong style={{ color: '#fff' }}>every DJ's portal</strong>. Great for "new month is live — book now". Clear it when it's old.</div>
        <textarea value={bcast} onChange={e => setBcast(e.target.value)} rows={2} placeholder="e.g. October dates are live — book your nights now!" style={{ ...inp('100%'), resize: 'vertical', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={postBanner} disabled={busy || !(bcast || '').trim()} style={btn('gold')}>📣 Post to all DJ portals</button>
          <button onClick={whatsappAll} disabled={busy || !(bcast || '').trim()} style={{ ...btn('gold'), background: '#25D366', borderColor: '#25D366', color: '#04240f' }}>📱 WhatsApp all DJs</button>
          {liveBanner && <button onClick={clearBanner} disabled={busy} style={btn('ghost')}>Clear banner</button>}
        </div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 1.5 }}>WhatsApp uses the same Twilio as tournaments/On-A-Roll — it needs the one-off <strong style={{ color: 'rgba(255,255,255,0.6)' }}>dj_broadcast</strong> template approved first (it'll tell you if not).</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 22, color: '#FFFFFF' }}>🎚️ DJ Roster</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            {tab === 'vetted'
              ? <>{vettedN} vetted · <span style={{ color: '#34D399' }}>{ready} ready</span> · <span style={{ color: '#FCD34D' }}>{vettedN - ready} incomplete</span></>
              : tab === 'resident'
                ? <>{residentN} residents · guaranteed a monthly slot, messaged first when new dates drop</>
                : <>{pendingN} pending — review &amp; <strong style={{ color: '#34D399' }}>Approve</strong> to move into the vetted roster</>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search DJs…" style={inp(170)} />
          {tab === 'pending' && <button onClick={() => setBulkOpen(o => !o)} disabled={busy} style={btn('ghost')}>⇪ Bulk import</button>}
          {tab !== 'resident' && <button onClick={addNew} disabled={busy} style={btn('gold')}>+ Add {tab === 'pending' ? 'pending' : 'DJ'}</button>}
        </div>
      </div>

      {/* Vetted / Pending tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[['vetted', `Vetted (${vettedN})`], ['resident', `★ Residents (${residentN})`], ['pending', `Pending (${pendingN})`]].map(([k, lbl]) => (
          <button key={k} onClick={() => { setTab(k); setEditing(null); setBulkOpen(false); setQ('') }} style={{
            padding: '8px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
            background: tab === k ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${tab === k ? '#DA1B33' : 'rgba(255,255,255,0.1)'}`,
            color: tab === k ? '#DA1B33' : '#FFFFFF', fontWeight: tab === k ? 600 : 400,
          }}>{lbl}</button>
        ))}
      </div>

      {/* Bulk import → Pending */}
      {bulkOpen && (
        <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>Bulk import contacts → Pending</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>One contact per line. Flexible — mix <em>name</em>, <em>@instagram</em>, phone, email, genres in any order (comma / tab / pipe separated). e.g. <span style={{ color: '#DA1B33' }}>Jamie T, @jamiet_dj, House / Disco</span> — or just <span style={{ color: '#DA1B33' }}>@some_dj</span>.</div>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={6} placeholder={'@dj_one\nJamie T, @jamiet_dj, House / Disco\n@dj_three, 07123456789'} style={{ ...inp('100%'), fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Source:</span>
            {['instagram', 'csv-extended', 'manual'].map(s => (
              <button key={s} onClick={() => setBulkSource(s)} style={{ padding: '5px 10px', fontSize: 11, borderRadius: 999, cursor: 'pointer', background: bulkSource === s ? '#DA1B33' : 'transparent', color: bulkSource === s ? '#fff' : 'rgba(255,255,255,0.8)', border: `1px solid ${bulkSource === s ? '#DA1B33' : 'rgba(255,255,255,0.18)'}` }}>{s}</button>
            ))}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{parseBulk(bulkText).length} parsed</span>
            <button onClick={bulkAdd} disabled={busy} style={btn('gold')}>Add to Pending</button>
          </div>
        </div>
      )}

      {tab === 'resident' && (
        <div style={{ background: '#0A0A0A', border: '1px solid rgba(218,27,51,0.3)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div className="serif" style={{ fontSize: 18, color: '#fff' }}>📣 {nextMonthLabel} release</div>
            {startedAt && <button onClick={() => { if (window.confirm('Reset this release? Clears the window so you can start fresh.')) rel('releaseReset') }} disabled={busy} style={btn('ghost')}>↺ Reset</button>}
          </div>

          {/* Not started → open next month + pick the release order */}
          {!startedAt && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}><strong style={{ color: '#fff' }}>{openNextMonth}</strong> night{openNextMonth === 1 ? '' : 's'} already open for {nextMonthLabel}. Pick the release order, then one tap opens every Mon–Sat night and starts it.</div>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Release order</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {RELEASE_MODES.map(m => (
                    <button key={m.key} onClick={() => setPickMode(m.key)} style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 8, cursor: 'pointer', background: pickMode === m.key ? 'rgba(218,27,51,0.14)' : 'rgba(255,255,255,0.04)', border: `1px solid ${pickMode === m.key ? '#DA1B33' : 'rgba(255,255,255,0.12)'}`, color: '#fff' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{pickMode === m.key ? '● ' : '○ '}{m.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={openAndRelease} disabled={busy} style={btn('gold')}>🚀 Open {nextMonthLabel} &amp; release</button>
                <button onClick={() => { if (window.confirm(`Open every Mon–Sat night in ${nextMonthLabel} for DJs (without starting the release yet)?`)) rel('openMonth', { month: nextMonthYM }) }} disabled={busy} style={btn('ghost')}>Just open the dates</button>
              </div>
            </div>
          )}

          {/* One-click email blast — every DJ gets their personal link + "dates open". */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px' }}>
            <button onClick={emailAll} disabled={busy} style={btn('gold')}>📧 Email all DJs — {blastMonthLabel} dates open</button>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', flex: 1, minWidth: 180 }}>One click — every DJ with an email gets their personal booking link. Edit the wording in the <em>“Email blast · new dates open”</em> template. (WhatsApp, sent per-DJ, is below.)</span>
          </div>

          {startedAt && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px', lineHeight: 1.6 }}>
              <strong style={{ color: '#fff' }}>{modeLabel(releaseMode)}</strong> · opened {fmtT(startedAt)}.{' '}
              {releaseMode === 'everyone'
                ? <>Open to <strong style={{ color: '#34D399' }}>everyone</strong> — message all DJs from the Vetted tab.</>
                : releaseMode === 'all_residents'
                  ? <>Message all residents below, then open it to the rest.</>
                  : group2Open
                    ? <><strong style={{ color: '#34D399' }}>24h up — group 2 is open</strong>, message them now.</>
                    : <>Group 2 opens <strong style={{ color: '#FCD34D' }}>{fmtT(startedAt + 24 * 3600000)}</strong> (~{Math.max(0, Math.ceil(24 - hrs))}h).{within6h && <strong style={{ color: '#F59E0B' }}> ⏳ Under 6h left — send the nudge below.</strong>}</>}
            </div>
          )}

          {startedAt && releaseMode !== 'everyone' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{twoGroup ? '① ' : ''}{g1Label} ({g1.length})</div>
              {g1.length === 0 ? <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No residents in this group.</div> : g1.map(d => resRow(d, true))}
            </div>
          )}

          {startedAt && twoGroup && within6h && g1.some(d => d.phone) && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
              <div style={{ fontSize: 11, color: '#F59E0B', marginBottom: 6 }}>⏳ 6-hour closing nudge — send now to first-dibs DJs who haven't booked yet:</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {g1.filter(d => d.phone).map(d => <button key={d.id} onClick={() => waSend(d, msg6h(d))} style={btn('ghost')}>⏳ {d.dj_name}</button>)}
              </div>
            </div>
          )}

          {startedAt && twoGroup && (
            <div style={{ opacity: group2Open ? 1 : 0.5 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>② {g2Label} · message after 24h ({g2.length})</div>
              {!group2Open && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Hold off until the 24h window closes (their buttons unlock then).</div>}
              {g2.length === 0 ? <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>None.</div> : g2.map(d => resRow(d, false))}
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>③ Release to everyone else</div>
              {startedAt && !openedAllAt && (
                <button onClick={() => { if (window.confirm((!twoGroup || group2Open) ? `Open ${nextMonthLabel} to non-resident & pending DJs now?` : "The 24h resident window hasn't closed yet — open to everyone anyway?")) rel('releaseOpenAll') }} disabled={busy} style={btn('gold')}>▶ Open to all (non-residents)</button>)}
              {openedAllAt && <span style={{ fontSize: 11, color: '#34D399', fontWeight: 600 }}>✅ Opened {fmtT(openedAllAt)}</span>}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              {openedAllAt
                ? <>Now message the rest from the <strong style={{ color: '#fff' }}>Vetted</strong> tab (and Pending DJs once approved). Messages send from <em>your</em> WhatsApp (one tap each).</>
                : <>Once residents have had their pick, open it up — then message the rest from the <strong style={{ color: '#fff' }}>Vetted</strong> tab. Messages send from <em>your</em> WhatsApp (one tap each) and carry each DJ's personal booking link. Add a resident with the <strong style={{ color: '#fff' }}>☆ Make resident</strong> button on their card.</>}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {filtered.map(d => {
          const done = complete(d)
          const ig = igHref(d.instagram)
          const isEdit = editing === d.id
          // Self-signups from the public "Become a No Dice DJ" form land here as
          // pending·website — flag them GREEN so the founder knows to review + approve.
          const isNewReview = statusOf(d) === 'pending' && d.source === 'website'
          return (
            <div key={d.id} ref={isEdit ? editRef : null} style={{ background: '#0A0A0A', border: `${isNewReview && !isEdit ? '2px' : '1px'} solid ${isEdit ? '#DA1B33' : isNewReview ? '#34D399' : done ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.10)'}`, boxShadow: isNewReview && !isEdit ? '0 0 0 3px rgba(52,211,153,0.15)' : 'none', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Avatar d={d} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {d.dj_name || 'Unnamed'}
                    {isNewReview
                      ? <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#04240f', background: '#34D399', borderRadius: 999, padding: '2px 9px' }}>New DJ in review</span>
                      : statusOf(d) === 'pending' && d.source && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FCD34D', border: '1px solid rgba(252,211,77,0.4)', borderRadius: 999, padding: '1px 7px' }}>{d.source}</span>}
                  </div>
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
              {!done && !isEdit && missingFields(d).length > 0 && (
                <div style={{ marginTop: 10, fontSize: 11.5, color: '#FCD34D', background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.25)', borderRadius: 7, padding: '7px 10px', lineHeight: 1.5 }}>
                  <strong style={{ color: '#FDE68A' }}>Still needs:</strong> {missingFields(d).join(' · ')}
                </div>
              )}

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
                  {/* Cancel was missing: the only ways out of an edit were Save or
                      Remove — both writes (founder: "no way out"). */}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <button onClick={() => removeDj(d.id)} style={btn('red')}>Remove</button>
                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                      <button onClick={() => setEditing(null)} disabled={busy} style={btn('ghost')}>Cancel</button>
                      <button onClick={saveEdit} disabled={busy} style={btn('gold')}>{busy ? 'Saving…' : 'Save'}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {statusOf(d) === 'pending' ? (
                    <>
                      <button onClick={() => approve(d.id)} disabled={busy} style={btn('green')}>✓ Approve</button>
                      <button onClick={() => startEdit(d)} style={btn('ghost')}>Edit</button>
                      <button onClick={() => removeDj(d.id)} disabled={busy} style={btn('red')}>Remove</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setResident(d, !d.resident)} disabled={busy} style={d.resident ? btn('gold') : btn('ghost')}>{d.resident ? '★ Resident' : '☆ Make resident'}</button>
                      {d.phone && <button onClick={() => waInvite(d)} style={btn('green')}>📲 WhatsApp invite</button>}
                      <button onClick={() => copyInvite(d)} style={btn(copied === d.id ? 'green' : 'gold')}>{copied === d.id ? '✓ Link copied' : '🔗 Copy link'}</button>
                      <button onClick={() => startEdit(d)} style={btn('ghost')}>Edit</button>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px 16px', lineHeight: 1.6 }}>
          {tab === 'pending'
            ? <>No pending DJs yet. Tap <strong style={{ color: '#fff' }}>⇪ Bulk import</strong> to drop in Instagram handles or a contacts list, or <strong style={{ color: '#fff' }}>+ Add pending</strong> one by one. Vetted them later with <strong style={{ color: '#34D399' }}>Approve</strong>.</>
            : tab === 'resident'
              ? <>No residents yet — go to <strong style={{ color: '#fff' }}>Vetted</strong> and tap <strong style={{ color: '#fff' }}>☆ Make resident</strong> on the DJs you want guaranteed a monthly slot.</>
              : (q ? `No DJs match "${q}".` : 'No DJs yet.')}
        </div>
      )}

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        {tab === 'pending'
          ? <><strong style={{ color: '#fff' }}>Pending DJs</strong> are contacts you haven't vetted yet (from Instagram, a contacts sheet, or added by hand). They can't be invited or booked. Review one, <strong style={{ color: '#34D399' }}>Approve</strong> it to move it into the Vetted roster, then send their WhatsApp invite from there.</>
          : <><strong style={{ color: '#fff' }}>Invite a DJ:</strong> tap <em>📲 WhatsApp invite</em> — it opens WhatsApp with their personal link and a ready-written message, you just hit send. No number on file? Use <em>Copy link</em>, or add their number via <em>Edit</em>. They open the link, fill their profile + photo, and can then claim your open dates (their photo auto-attaches to every event they play).</>}
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
// 2026-07-23 — bumped padding + minHeight so every btn() call (used
// dozens of times below for Message / Approve / Remove / Make resident /
// Copy link etc.) hits the 40px+ tap target size that matches the DJ
// portal fix.
const btn = (kind) => {
  const base = { minHeight: 40, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: '#DA1B33', color: '#FFFFFF' }
  if (kind === 'green') return { ...base, background: '#34D399', color: '#06281C' }
  if (kind === 'red') return { ...base, background: 'transparent', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.18)' }
}
const inp = (w) => ({ width: w, minWidth: 0, padding: '8px 10px', fontSize: 13, borderRadius: 7, background: '#000000', border: '1px solid rgba(255,255,255,0.18)', color: '#FFFFFF', outline: 'none', boxSizing: 'border-box' })
