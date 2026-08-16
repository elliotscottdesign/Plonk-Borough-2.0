import React, { useEffect, useState } from 'react'
import { getMenu, saveMenu } from './menuApi.js'

// 🍔 /ops → Kitchen → Menu. The founder edits the On A Roll menu here — sections,
// items, sell price (inc VAT) + cost → live margin, and a photo per item. Saves to
// the menu_catalog table (via the `menu` edge fn); the order page + kitchen screen
// read the same doc. "Export branded menu" prints one A4 = two A5 halves.

const GOLD = '#C9A84C', GREEN = '#34D399', RED = '#DA1B33', LINE = 'rgba(201,168,76,0.22)', CARD = 'rgba(255,255,255,0.03)', MUTED = 'rgba(255,255,255,0.55)'
const VAT = 1.2
let uid = 1000
const nid = p => `${p}${uid++}`
const pounds = pence => (((pence || 0) / 100)).toString()
const toPence = str => Math.round((parseFloat(str) || 0) * 100)
const marginPct = (sellStr, costStr) => { const net = (parseFloat(sellStr) || 0) / VAT; const c = parseFloat(costStr) || 0; return net ? Math.round((net - c) / net * 100) : 0 }
const mgColor = p => p >= 60 ? GREEN : p >= 40 ? GOLD : RED

const DEFAULTS = [
  { id: 'rolls', name: 'Rolls', items: [
    { id: 'cheeseburger', name: 'Cheeseburger', sell: '12', cost: '4.5', img: '' },
    { id: 'halloumi', name: 'Halloumi Burger', sell: '11', cost: '3.8', img: '' },
    { id: 'mortadella', name: 'Bella Mortadella', sell: '10', cost: '3.5', img: '' },
  ] },
  { id: 'sides', name: 'Sides', items: [
    { id: 'padron', name: 'Padron Peppers', sell: '6', cost: '1.8', img: '' },
    { id: 'springrolls', name: "Mumzy's Spring Rolls", sell: '6', cost: '1.5', img: '' },
    { id: 'chips', name: 'Chips', sell: '5', cost: '1.2', img: '' },
  ] },
]

// pence-doc (server) <-> editor strings
const fromDoc = secs => (secs || []).map(s => ({ id: s.id || nid('sec'), name: s.name || '', items: (s.items || []).map(it => ({ id: it.id || nid('it'), name: it.name || '', sell: pounds(it.sell_pence), cost: pounds(it.cost_pence), img: it.img || '' })) }))
const toDoc = secs => secs.map(s => ({ id: s.id, name: s.name, items: s.items.map(it => ({ id: it.id, name: it.name, sell_pence: toPence(it.sell), cost_pence: toPence(it.cost), img: it.img || '' })) }))

export default function MenuManager() {
  const [sections, setSections] = useState(null)
  const [bundles, setBundles] = useState([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { (async () => {
    try { const r = await getMenu(); setSections(r.sections?.length ? fromDoc(r.sections) : DEFAULTS); setBundles(r.bundles || []) }
    catch { setSections(DEFAULTS); setMsg("Backend not reachable yet — you're editing local defaults. Deploy the `menu` function to save.") }
  })() }, [])

  const mutate = fn => { setSections(s => { const c = JSON.parse(JSON.stringify(s)); fn(c); return c }); setDirty(true); setMsg('') }
  const setItem = (si, ii, k, v) => mutate(s => { s[si].items[ii][k] = v })
  const addItem = si => mutate(s => { s[si].items.push({ id: nid('new'), name: '', sell: '', cost: '', img: '' }) })
  const delItem = (si, ii) => mutate(s => { s[si].items.splice(ii, 1) })
  const addSection = () => mutate(s => { s.push({ id: nid('sec'), name: 'New section', items: [] }) })
  const delSection = si => { if (confirm('Delete this whole section?')) mutate(s => { s.splice(si, 1) }) }
  const pic = (si, ii, file) => { if (!file) return; const r = new FileReader(); r.onload = e => setItem(si, ii, 'img', e.target.result); r.readAsDataURL(file) }

  const save = async () => {
    setSaving(true); setMsg('')
    try { await saveMenu(toDoc(sections), bundles); setDirty(false); setMsg('Saved ✓ — the order page & kitchen screen now use this menu.') }
    catch (e) { setMsg("Couldn't save — " + e.message) } finally { setSaving(false) }
  }

  if (sections == null) return <div style={{ color: MUTED, fontSize: 13, padding: '20px 0' }}>Loading menu…</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6, position: 'sticky', top: 46, zIndex: 15, background: 'var(--ink)', paddingBottom: 8 }}>
        <button onClick={save} disabled={saving || !dirty} style={{ ...pill(dirty), opacity: dirty ? 1 : 0.5 }}>{saving ? 'Saving…' : dirty ? '💾 Save menu' : 'Saved'}</button>
        <button onClick={() => exportMenu(sections)} style={pill(false)}>🖨 Export branded menu · A4 = 2× A5</button>
        <span style={{ fontSize: 12, color: MUTED }}>Sell prices are inc VAT (20%); margin is on the ex-VAT price.</span>
      </div>
      {msg && <div style={{ fontSize: 12.5, color: msg.startsWith('Saved') ? GREEN : GOLD, marginBottom: 10, lineHeight: 1.5 }}>{msg}</div>}

      {sections.map((sec, si) => (
        <div key={sec.id} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 6px' }}>
            <input value={sec.name} onChange={e => mutate(s => { s[si].name = e.target.value })}
              style={{ background: 'none', border: 'none', borderBottom: '1px dashed transparent', color: GOLD, fontSize: 17, fontWeight: 800, padding: '2px 0' }}
              onFocus={e => e.target.style.borderBottomColor = GOLD} onBlur={e => e.target.style.borderBottomColor = 'transparent'} />
            <span style={{ fontSize: 11, color: MUTED }}>{sec.items.length} item{sec.items.length !== 1 ? 's' : ''}</span>
            <button onClick={() => delSection(si)} title="Delete section" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>🗑</button>
          </div>

          {sec.items.map((it, ii) => {
            const mp = marginPct(it.sell, it.cost)
            return (
              <div key={it.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '11px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                  <label style={{ width: 56, height: 56, borderRadius: 9, background: it.img ? 'none' : '#26272b', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                    {it.img ? <img src={it.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ opacity: 0.5 }}>📷</span>}
                    <input type="file" accept="image/*" onChange={e => pic(si, ii, e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  </label>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input value={it.name} placeholder="Item name…" onChange={e => setItem(si, ii, 'name', e.target.value)}
                      style={{ width: '100%', background: 'none', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, padding: '0 0 3px' }} />
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Field label="Sell £ inc VAT" value={it.sell} onChange={v => setItem(si, ii, 'sell', v)} />
                      <Field label="Cost £" value={it.cost} onChange={v => setItem(si, ii, 'cost', v)} />
                      <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: 13, color: it.sell ? mgColor(mp) : MUTED }}>{it.sell ? mp + '%' : '—'}</span>
                      <button onClick={() => delItem(si, ii)} title="Remove item" style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 15 }}>×</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <button onClick={() => addItem(si)} style={addBtn()}>＋ Add item to {sec.name}</button>
        </div>
      ))}
      <button onClick={addSection} style={{ ...addBtn(), borderColor: GOLD, color: GOLD, marginTop: 14 }}>＋ Add a new section</button>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#0e0e10', border: `1px solid ${LINE}`, borderRadius: 8, padding: '5px 8px' }}>
      <span style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{label}</span>
      <input value={value} inputMode="decimal" onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
        style={{ width: 46, background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, textAlign: 'right' }} />
    </span>
  )
}

const pill = on => ({ padding: '9px 15px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: on ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? GOLD : LINE}`, color: on ? GOLD : 'rgba(255,255,255,0.85)' })
const addBtn = () => ({ width: '100%', background: 'none', border: `1px dashed ${LINE}`, color: MUTED, borderRadius: 11, padding: '12px', fontSize: 14, cursor: 'pointer' })

// Branded "On A Roll" menu — one A4 = two identical A5 halves (cut in half). Opens a
// print window. (In the real build the founder's "Save to Menus" would drop the PDF
// into the staff Menus section.)
function exportMenu(sections) {
  const secs = (sections || []).filter(s => s.id !== 'bar')
  const inner = secs.map(sec => {
    const its = sec.items.filter(it => it.name)
    if (!its.length) return ''
    return `<div class="msec"><div class="mh">${esc(sec.name)}</div>${its.map(it => `<div class="mi"><span>${esc(it.name)}</span><span class="dots"></span><span>${it.sell ? '£' + (parseFloat(it.sell) % 1 === 0 ? parseFloat(it.sell) : parseFloat(it.sell).toFixed(2)) : ''}</span></div>`).join('')}</div>`
  }).join('')
  const a5 = `<div class="a5"><div class="mtitle">On A Roll</div><div class="msub">London Fields · order at the bar, collect at the van</div>${inner}<div class="mfoot">Please inform us of any allergies before ordering · all prices inc VAT</div></div>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>On A Roll menu</title><style>
    @page{ size:A4 landscape; margin:0 } *{ box-sizing:border-box }
    body{ margin:0; font-family:Impact,'Arial Narrow Bold',sans-serif; }
    .a4{ display:flex; width:297mm; height:210mm; background:#e8e3d0 }
    .a5{ flex:1; padding:14mm 12mm; color:#15305c } .a5:first-child{ border-right:1px dashed #b9b1a1 }
    .mtitle{ font-size:30px; letter-spacing:1px } .msub{ font-family:Arial; font-size:9px; color:#8a8275; margin:2px 0 14px; text-transform:uppercase; letter-spacing:.09em }
    .msec{ margin-bottom:13px } .mh{ font-size:15px; color:#183fa0; letter-spacing:1px; border-bottom:1px solid #e2d9c2; padding-bottom:3px; margin-bottom:6px }
    .mi{ display:flex; align-items:baseline; gap:5px; font-family:Arial; font-weight:700; font-size:13px; margin:4px 0; color:#15305c }
    .mi .dots{ flex:1; border-bottom:1px dotted #c9bfa8 } .mi span:last-child{ color:#e0231b; font-weight:800 }
    .mfoot{ font-family:Arial; font-size:8.5px; color:#8a8275; margin-top:14px }
  </style></head><body><div class="a4">${a5}${a5}</div><script>window.onload=function(){window.print()}<\/script></body></html>`
  const w = window.open('', '_blank')
  if (!w) { alert('Allow pop-ups to print the menu.'); return }
  w.document.write(html); w.document.close()
}
const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
