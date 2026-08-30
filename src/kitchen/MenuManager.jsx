import React, { useEffect, useState } from 'react'
import { getMenu, saveMenu, uploadPhoto } from './menuApi.js'
import { ON_A_ROLL_LOGO_BW } from './logo.js'
import { ALLERGENS } from './allergens.js'
import { exportMenu, ORDER_URL } from './menuExport.js'

// Allergen cell cycles none → contains (●) → may-contain/trace (○) → none.
const ALLERGEN_NEXT = { undefined: 'contains', contains: 'trace', trace: undefined }
const ALLERGEN_COLOR = { contains: '#DA1B33', trace: '#F59E0B' }

// 🍔 /ops → Kitchen → Menu. The founder edits the On A Roll menu here — sections,
// items, sell price + cost → live margin (not VAT registered), a photo per item, and beer+burger
// bundles. Saves to menu_catalog (via the `menu` edge fn); the order page + kitchen
// screen read the same doc. "Export branded menu" prints one A4 = two A5 halves.

const GOLD = '#C9A84C', GREEN = '#34D399', RED = '#DA1B33', LINE = 'rgba(201,168,76,0.22)', CARD = 'rgba(255,255,255,0.03)', MUTED = 'rgba(255,255,255,0.55)'
const VAT_RATE = 1.2   // when VAT registered, margin is on the ex-VAT price (price ÷ 1.2)
const netPrice = (sellStr, vatOn) => (parseFloat(sellStr) || 0) / (vatOn ? VAT_RATE : 1)
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
let uid = 1000
const nid = p => `${p}${uid++}`
const pounds = pence => ((pence || 0) / 100).toString()
const toPence = str => Math.round((parseFloat(str) || 0) * 100)
const marginPct = (sellStr, costStr, vatOn) => { const net = netPrice(sellStr, vatOn); const c = parseFloat(costStr) || 0; return net ? Math.round((net - c) / net * 100) : 0 }
const mgColor = p => p >= 60 ? GREEN : p >= 40 ? GOLD : RED

const DEFAULTS = [
  { id: 'rolls', name: 'Rolls', items: [
    { id: 'cheeseburger', name: 'Cheeseburger', sell: '12', cost: '4.5', img: '', desc: '8oz Wagyu sirloin & ribeye patty, American cheese, caramelised onions, gherkin, burger sauce, on a brioche roll. Served with fries and a sauce.', addons: [{ id: 'ao-patty', name: 'Extra patty', price: '3', cost: '1.5' }, { id: 'ao-bacon', name: 'Smoked bacon', price: '2', cost: '0.8' }], allergens: { celery: 'trace', gluten: 'contains', eggs: 'contains', milk: 'contains', mushroom: 'trace', mustard: 'contains', soya: 'trace', sulphites: 'contains' } },
    { id: 'halloumi', name: 'Halloumi Burger', sell: '11', cost: '3.8', img: '', desc: 'Halloumi cheese, caramelised onions, harissa mayo, in a brioche bun. Served with fries and a sauce.', addons: [], allergens: { celery: 'trace', gluten: 'contains', eggs: 'contains', milk: 'contains', mushroom: 'trace', soya: 'trace', sulphites: 'contains' } },
    { id: 'mortadella', name: 'Bella Mortadella', sell: '10', cost: '3.5', img: '', desc: '“Chopped cheese style” mortadella, mozzarella, fresh tomato, crunchy cornichons, mustard mayo, in a brioche roll. Served with fries and a sauce.', addons: [], allergens: { celery: 'trace', gluten: 'contains', eggs: 'contains', milk: 'contains', mushroom: 'trace', mustard: 'contains', nuts: 'trace', soya: 'trace' } },
  ] },
  { id: 'sides', name: 'Sides', items: [
    { id: 'padron', name: 'Padron Peppers', sell: '6', cost: '1.8', img: '', desc: 'Fried Padron peppers, served with rock salt.', addons: [], allergens: {} },
    { id: 'springrolls', name: "Mumzy's Spring Rolls", sell: '6', cost: '1.5', img: '', desc: 'Homemade shallot, carrot and cabbage spring rolls. Served with sweet chilli sauce and cucumber.', addons: [], allergens: { celery: 'contains', gluten: 'contains', mushroom: 'contains', nuts: 'trace', peanuts: 'trace', sesame: 'trace', soya: 'contains' } },
    { id: 'chips', name: 'Chips', sell: '5', cost: '1.2', img: '', desc: 'Skinny skin-on fries, tossed in Himalayan salt. Served with a sauce.', addons: [{ id: 'ao-butty', name: 'Make it a Cheesy Chip Butty', price: '3', cost: '0.9' }], allergens: { celery: 'trace', gluten: 'trace', mushroom: 'trace', soya: 'trace' } },
  ] },
]

const fromDoc = secs => (secs || []).map(s => ({ id: s.id || nid('sec'), name: s.name || '', special: !!s.special, items: (s.items || []).map(it => ({ id: it.id || nid('it'), name: it.name || '', sell: pounds(it.sell_pence), cost: pounds(it.cost_pence), img: it.img || '', desc: it.desc || '', addons: (it.addons || []).map(a => ({ id: a.id || nid('ao'), name: a.name || '', price: pounds(a.price_pence), cost: pounds(a.cost_pence) })), allergens: it.allergens && typeof it.allergens === 'object' ? it.allergens : {}, stock: Array.isArray(it.stock) ? it.stock : [] })) }))
const toDoc = secs => secs.map(s => ({ id: s.id, name: s.name, special: !!s.special, items: s.items.map(it => ({ id: it.id, name: it.name, sell_pence: toPence(it.sell), cost_pence: toPence(it.cost), img: it.img || '', desc: it.desc || '', addons: (it.addons || []).filter(a => a.name.trim()).map(a => ({ id: a.id, name: a.name.trim(), price_pence: toPence(a.price), cost_pence: toPence(a.cost) })), allergens: it.allergens && typeof it.allergens === 'object' ? it.allergens : {}, stock: Array.isArray(it.stock) ? it.stock : [] })) }))
const bundlesFromDoc = bs => (bs || []).map(b => ({ id: b.id || nid('bun'), name: b.name || 'Beer + Burger', burger_id: b.burger_id || '', beer: b.beer_pence != null ? pounds(b.beer_pence) : '6', price: b.price_pence != null ? pounds(b.price_pence) : '', days: Array.isArray(b.days) ? b.days : ['Tue'] }))
const bundlesToDoc = bs => bs.map(b => ({ id: b.id, name: b.name, burger_id: b.burger_id, beer_pence: toPence(b.beer), price_pence: toPence(b.price), days: b.days }))

export default function MenuManager() {
  const [sections, setSections] = useState(null)
  const [bundles, setBundles] = useState([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [vat, setVat] = useState(false)   // VAT registered? drives margin maths + labels
  const [openAllg, setOpenAllg] = useState(new Set())   // which items have the allergen editor expanded
  const toggleAllg = id => setOpenAllg(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  useEffect(() => { (async () => {
    try { const r = await getMenu(); setSections(r.sections?.length ? fromDoc(r.sections) : DEFAULTS); setBundles(bundlesFromDoc(r.bundles)); setVat(!!r.vat_registered) }
    catch { setSections(DEFAULTS); setMsg("Backend not reachable yet — you're editing local defaults. Deploy the `menu` function to save.") }
  })() }, [])

  const mutate = fn => { setSections(s => { const c = JSON.parse(JSON.stringify(s)); fn(c); return c }); setDirty(true); setMsg('') }
  const mutateB = fn => { setBundles(bs => { const c = JSON.parse(JSON.stringify(bs)); fn(c); return c }); setDirty(true); setMsg('') }
  const setItem = (si, ii, k, v) => mutate(s => { s[si].items[ii][k] = v })
  const addItem = si => mutate(s => { s[si].items.push({ id: nid('new'), name: '', sell: '', cost: '', img: '', desc: '', addons: [], allergens: {} }) })
  const cycleAllergen = (si, ii, key) => mutate(s => { const al = (s[si].items[ii].allergens ||= {}); const nx = ALLERGEN_NEXT[al[key]]; if (nx) al[key] = nx; else delete al[key] })
  const delItem = (si, ii) => mutate(s => { s[si].items.splice(ii, 1) })
  const addAddon = (si, ii) => mutate(s => { (s[si].items[ii].addons ||= []).push({ id: nid('ao'), name: '', price: '', cost: '' }) })
  const setAddon = (si, ii, ai, k, v) => mutate(s => { s[si].items[ii].addons[ai][k] = v })
  const delAddon = (si, ii, ai) => mutate(s => { s[si].items[ii].addons.splice(ai, 1) })
  const addSection = () => mutate(s => { s.push({ id: nid('sec'), name: 'New section', items: [] }) })
  const addSpecials = () => mutate(s => { s.unshift({ id: nid('sec'), name: 'Specials', special: true, items: [{ id: nid('new'), name: '', sell: '', cost: '', img: '', desc: '', addons: [], allergens: {} }] }) })
  const toggleSpecial = si => mutate(s => { s[si].special = !s[si].special })
  const delSection = si => { if (confirm('Delete this whole section?')) mutate(s => { s.splice(si, 1) }) }

  const pic = (si, ii, file) => {
    if (!file) return
    const r = new FileReader()
    r.onload = async e => {
      setItem(si, ii, 'img', e.target.result)                   // instant preview
      try { const res = await uploadPhoto(e.target.result); if (res.url) setItem(si, ii, 'img', res.url) } catch { /* keep data-url until the backend is deployed */ }
    }
    r.readAsDataURL(file)
  }

  const addBundle = () => mutateB(bs => { bs.push({ id: nid('bun'), name: 'Beer + Burger', burger_id: '', beer: '6', price: '', days: ['Tue'] }) })
  const setBundle = (bi, k, v) => mutateB(bs => { bs[bi][k] = v })
  const delBundle = bi => mutateB(bs => { bs.splice(bi, 1) })
  const toggleDay = (bi, d) => mutateB(bs => { const set = new Set(bs[bi].days); set.has(d) ? set.delete(d) : set.add(d); bs[bi].days = [...set] })

  const save = async () => {
    setSaving(true); setMsg('')
    try { await saveMenu(toDoc(sections), bundlesToDoc(bundles), vat); setDirty(false); setMsg('Saved ✓ — the order page & kitchen screen now use this menu.') }
    catch (e) { setMsg("Couldn't save — " + e.message) } finally { setSaving(false) }
  }

  if (sections == null) return <div style={{ color: MUTED, fontSize: 13, padding: '20px 0' }}>Loading menu…</div>

  const burgerOpts = sections.flatMap(s => s.items.filter(it => it.name).map(it => ({ id: it.id, name: it.name, sell: it.sell })))

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6, position: 'sticky', top: 46, zIndex: 15, background: 'var(--ink)', paddingBottom: 8 }}>
        <button onClick={save} disabled={saving || !dirty} style={{ ...pill(dirty), opacity: dirty ? 1 : 0.5 }}>{saving ? 'Saving…' : dirty ? '💾 Save menu' : 'Saved'}</button>
        <button onClick={() => exportMenu(sections, 'print', vat)} style={pill(false)}>🖨 Print menu · A4 = 2× A5</button>
        <button onClick={() => exportMenu(sections, 'pdf', vat)} style={pill(false)}>⬇ Download PDF</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: vat ? GOLD : MUTED, cursor: 'pointer', border: `1px solid ${vat ? GOLD : LINE}`, borderRadius: 8, padding: '7px 11px' }}>
          <input type="checkbox" checked={vat} onChange={e => { setVat(e.target.checked); setDirty(true) }} /> VAT registered (20%)
        </label>
        <span style={{ fontSize: 12, color: MUTED }}>{vat ? 'Prices include VAT; margin is on the ex-VAT price (÷1.2).' : 'Not VAT registered — the sell price is final; margin is price − cost.'}</span>
      </div>
      <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 10, lineHeight: 1.5, background: 'rgba(201,168,76,0.06)', border: `1px solid ${LINE}`, borderRadius: 10, padding: '9px 11px' }}>
        📄 <b style={{ color: '#fff' }}>Live On A Roll menu</b> — share this with all staff; it always shows the latest <b>saved</b> menu (Print / Download PDF on it too):{' '}
        <a href="/onaroll/print" target="_blank" rel="noreferrer" style={{ color: GOLD, fontWeight: 700 }}>team.nodice.bar/onaroll/print</a>
      </div>
      {msg && <div style={{ fontSize: 12.5, color: msg.startsWith('Saved') ? GREEN : GOLD, marginBottom: 10, lineHeight: 1.5 }}>{msg}</div>}

      {sections.map((sec, si) => (
        <div key={sec.id} style={{ marginBottom: 6, ...(sec.special ? { border: `1.5px dashed ${GOLD}`, borderRadius: 12, padding: '2px 12px 10px', background: 'rgba(201,168,76,0.05)' } : {}) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 6px' }}>
            <input value={sec.name} onChange={e => mutate(s => { s[si].name = e.target.value })}
              style={{ background: 'none', border: 'none', borderBottom: '1px dashed transparent', color: GOLD, fontSize: 17, fontWeight: 800, padding: '2px 0' }}
              onFocus={e => e.target.style.borderBottomColor = GOLD} onBlur={e => e.target.style.borderBottomColor = 'transparent'} />
            <span style={{ fontSize: 11, color: MUTED }}>{sec.items.length} item{sec.items.length !== 1 ? 's' : ''}</span>
            <button onClick={() => toggleSpecial(si)} title="Specials board — prints at the very top of the menu in a dotted box"
              style={{ marginLeft: 'auto', background: sec.special ? 'rgba(201,168,76,0.16)' : 'none', border: `1px solid ${sec.special ? GOLD : LINE}`, color: sec.special ? GOLD : MUTED, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {sec.special ? '⭐ Specials board' : '☆ Make specials'}
            </button>
            <button onClick={() => delSection(si)} title="Delete section" style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16 }}>🗑</button>
          </div>

          {sec.items.map((it, ii) => {
            const mp = marginPct(it.sell, it.cost, vat)
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
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Field label={vat ? "Sell £ inc VAT" : "Sell £"} value={it.sell} onChange={v => setItem(si, ii, 'sell', v)} />
                      <Field label="Cost £" value={it.cost} onChange={v => setItem(si, ii, 'cost', v)} />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0e0e10', border: `1px solid ${it.sell && it.cost ? mgColor(mp) : LINE}`, borderRadius: 8, padding: '5px 9px' }}
                        title={vat ? "Gross margin on the ex-VAT price. £ = cash profit per item." : "Gross margin (price − cost). £ = cash profit per item."}>
                        <span style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Margin</span>
                        <b style={{ fontSize: 14, color: it.sell && it.cost ? mgColor(mp) : MUTED }}>{it.sell && it.cost ? mp + '%' : '—'}</b>
                        {it.sell && it.cost && <span style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>· £{(netPrice(it.sell, vat) - (parseFloat(it.cost) || 0)).toFixed(2)}</span>}
                      </span>
                      <button onClick={() => delItem(si, ii)} title="Remove item" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 15 }}>×</button>
                    </div>
                    <textarea value={it.desc || ''} placeholder="Description (shown on the printed menu)…" onChange={e => setItem(si, ii, 'desc', e.target.value)} rows={2} style={{ width: '100%', marginTop: 7, background: '#0e0e10', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 8, padding: '7px 9px', fontSize: 12.5, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    <div style={{ marginTop: 8, borderTop: `1px dashed ${LINE}`, paddingTop: 8 }}>
                      <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Add-ons / extras</div>
                      {(it.addons || []).map((a, ai) => {
                        const amp = marginPct(a.price, a.cost, vat)
                        return (
                        <div key={a.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                          <input value={a.name} placeholder="e.g. Extra patty" onChange={e => setAddon(si, ii, ai, 'name', e.target.value)}
                            style={{ flex: '1 1 120px', minWidth: 0, background: '#0e0e10', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 8, padding: '6px 9px', fontSize: 12.5 }} />
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#0e0e10', border: `1px solid ${LINE}`, borderRadius: 8, padding: '5px 8px' }}>
                            <span style={{ fontSize: 12, color: MUTED, fontWeight: 700 }}>+£</span>
                            <input value={a.price} inputMode="decimal" onChange={e => setAddon(si, ii, ai, 'price', e.target.value.replace(/[^0-9.]/g, ''))}
                              style={{ width: 38, background: 'none', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, textAlign: 'right' }} />
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#0e0e10', border: `1px solid ${LINE}`, borderRadius: 8, padding: '5px 8px' }}>
                            <span style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase' }}>cost £</span>
                            <input value={a.cost} inputMode="decimal" onChange={e => setAddon(si, ii, ai, 'cost', e.target.value.replace(/[^0-9.]/g, ''))}
                              style={{ width: 34, background: 'none', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, textAlign: 'right' }} />
                          </span>
                          <span style={{ fontSize: 12.5, fontWeight: 800, minWidth: 34, textAlign: 'center', color: a.price && a.cost ? mgColor(amp) : MUTED }}>{a.price && a.cost ? amp + '%' : '—'}</span>
                          <button onClick={() => delAddon(si, ii, ai)} title="Remove extra" style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 15 }}>×</button>
                        </div>
                        )
                      })}
                      <button onClick={() => addAddon(si, ii)} style={{ background: 'none', border: `1px dashed ${LINE}`, color: MUTED, borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>＋ Add an extra</button>
                    </div>
                    {(() => {
                      const al = it.allergens || {}
                      const contains = ALLERGENS.filter(a => al[a.key] === 'contains').map(a => a.label)
                      const trace = ALLERGENS.filter(a => al[a.key] === 'trace').map(a => a.label)
                      const open = openAllg.has(it.id)
                      return (
                        <div style={{ marginTop: 8, borderTop: `1px dashed ${LINE}`, paddingTop: 8 }}>
                          <button onClick={() => toggleAllg(it.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                            <span style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Allergens</span>
                            <span style={{ fontSize: 11.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: contains.length ? ALLERGEN_COLOR.contains : MUTED }}>
                              {contains.length ? `● ${contains.join(', ')}` : ''}{contains.length && trace.length ? '  ' : ''}{trace.length ? <span style={{ color: ALLERGEN_COLOR.trace }}>○ {trace.join(', ')}</span> : ''}{!contains.length && !trace.length ? 'none set — tap to add' : ''}
                            </span>
                            <span style={{ fontSize: 12, color: MUTED, flexShrink: 0 }}>{open ? '▾ edit' : '▸ edit'}</span>
                          </button>
                          {open && (
                            <div style={{ marginTop: 8 }}>
                              <div style={{ fontSize: 10.5, color: MUTED, marginBottom: 6, lineHeight: 1.4 }}>tap once = <b style={{ color: ALLERGEN_COLOR.contains }}>●&nbsp;contains</b>, twice = <b style={{ color: ALLERGEN_COLOR.trace }}>○&nbsp;may&nbsp;contain</b>, again = off</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                {ALLERGENS.map(a => {
                                  const st = al[a.key]
                                  const col = ALLERGEN_COLOR[st]
                                  return (
                                    <button key={a.key} onClick={() => cycleAllergen(si, ii, a.key)}
                                      style={{ fontSize: 11.5, padding: '4px 8px', borderRadius: 999, cursor: 'pointer', fontWeight: st ? 700 : 500,
                                        border: `1px solid ${col || LINE}`, background: st ? `${col}22` : 'transparent', color: st ? col : MUTED }}>
                                      {st === 'contains' ? '● ' : st === 'trace' ? '○ ' : ''}{a.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )
          })}
          <button onClick={() => addItem(si)} style={addBtn()}>＋ Add item to {sec.name}</button>
        </div>
      ))}
      {!sections.some(s => s.special) && (
        <button onClick={addSpecials} style={{ ...addBtn(), borderStyle: 'dashed', borderColor: GOLD, color: GOLD, marginTop: 14, background: 'rgba(201,168,76,0.05)' }}>⭐ Add a Specials board — leftovers / BBQ (prints at the top)</button>
      )}
      <button onClick={addSection} style={{ ...addBtn(), borderColor: GOLD, color: GOLD, marginTop: 8 }}>＋ Add a new section</button>

      {/* ── Deals & bundles (beer + burger) ── */}
      <div style={{ marginTop: 30, background: 'rgba(201,168,76,0.06)', border: `1.5px solid ${GOLD}`, borderRadius: 14, padding: '16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: GOLD }}>🍺 Deals &amp; bundles</div>
          <div style={{ fontSize: 12, color: MUTED }}>Beer + burger combos — set the price, pick the days.</div>
        </div>
        <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.45, marginBottom: 12 }}>This is where you build a deal. Choose a burger, set the beer price and the bundle price, and tick the days it runs. The burger goes to the kitchen; the beer becomes a single-use 🎟 voucher redeemed at the bar.</div>
        {bundles.map((bn, bi) => {
          const burger = burgerOpts.find(o => o.id === bn.burger_id)
          const normal = (parseFloat(bn.beer) || 0) + (burger ? (parseFloat(burger.sell) || 0) : 0)
          const saving2 = normal - (parseFloat(bn.price) || 0)
          return (
            <div key={bn.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 9 }}>
                <input value={bn.name} onChange={e => setBundle(bi, 'name', e.target.value)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, flex: 1 }} />
                <button onClick={() => delBundle(bi)} title="Remove bundle" style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 15 }}>×</button>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Burger</div>
              <select value={bn.burger_id} onChange={e => setBundle(bi, 'burger_id', e.target.value)} style={selectStyle}>
                <option value="">— choose —</option>
                {burgerOpts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8, marginTop: 9, alignItems: 'center' }}>
                <Field label="Beer £" value={bn.beer} onChange={v => setBundle(bi, 'beer', v)} />
                <Field label="Bundle £" value={bn.price} onChange={v => setBundle(bi, 'price', v)} />
                <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: 13, color: saving2 > 0 ? GREEN : MUTED }}>{saving2 > 0 ? `save £${saving2.toFixed(2)}` : '—'}</span>
              </div>
              <div style={{ fontSize: 12, color: MUTED, margin: '10px 0 5px' }}>Active on</div>
              <div>{DAYS.map(d => <span key={d} onClick={() => toggleDay(bi, d)} style={dayStyle(bn.days.includes(d))}>{d}</span>)}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 9, lineHeight: 1.4 }}>🍺 The burger goes to the kitchen; the beer is redeemed at the bar as a single-use voucher in your 🎟 Vouchers list.</div>
            </div>
          )
        })}
        <button onClick={addBundle} style={addBtn()}>＋ Add a deal / combo</button>
      </div>
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
const selectStyle = { width: '100%', background: '#0e0e10', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 8, padding: '9px', fontSize: 14 }
const dayStyle = on => ({ display: 'inline-block', border: `1px solid ${on ? GOLD : LINE}`, background: on ? 'rgba(201,168,76,0.16)' : 'transparent', color: on ? GOLD : MUTED, borderRadius: 8, padding: '6px 9px', fontSize: 12, marginRight: 5, marginBottom: 5, cursor: 'pointer' })

