import React, { useEffect, useState } from 'react'
import { getMenu, saveMenu, uploadPhoto } from './menuApi.js'
import { ON_A_ROLL_LOGO_BW } from './logo.js'
import { ALLERGENS } from './allergens.js'

// Allergen cell cycles none → contains (●) → may-contain/trace (○) → none.
const ALLERGEN_NEXT = { undefined: 'contains', contains: 'trace', trace: undefined }
const ALLERGEN_COLOR = { contains: '#DA1B33', trace: '#F59E0B' }

// 🍔 /ops → Kitchen → Menu. The founder edits the On A Roll menu here — sections,
// items, sell price (inc VAT) + cost → live margin, a photo per item, and beer+burger
// bundles. Saves to menu_catalog (via the `menu` edge fn); the order page + kitchen
// screen read the same doc. "Export branded menu" prints one A4 = two A5 halves.

const GOLD = '#C9A84C', GREEN = '#34D399', RED = '#DA1B33', LINE = 'rgba(201,168,76,0.22)', CARD = 'rgba(255,255,255,0.03)', MUTED = 'rgba(255,255,255,0.55)'
const VAT = 1.2
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
let uid = 1000
const nid = p => `${p}${uid++}`
const pounds = pence => ((pence || 0) / 100).toString()
const toPence = str => Math.round((parseFloat(str) || 0) * 100)
const marginPct = (sellStr, costStr) => { const net = (parseFloat(sellStr) || 0) / VAT; const c = parseFloat(costStr) || 0; return net ? Math.round((net - c) / net * 100) : 0 }
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

const fromDoc = secs => (secs || []).map(s => ({ id: s.id || nid('sec'), name: s.name || '', items: (s.items || []).map(it => ({ id: it.id || nid('it'), name: it.name || '', sell: pounds(it.sell_pence), cost: pounds(it.cost_pence), img: it.img || '', desc: it.desc || '', addons: (it.addons || []).map(a => ({ id: a.id || nid('ao'), name: a.name || '', price: pounds(a.price_pence), cost: pounds(a.cost_pence) })), allergens: it.allergens && typeof it.allergens === 'object' ? it.allergens : {} })) }))
const toDoc = secs => secs.map(s => ({ id: s.id, name: s.name, items: s.items.map(it => ({ id: it.id, name: it.name, sell_pence: toPence(it.sell), cost_pence: toPence(it.cost), img: it.img || '', desc: it.desc || '', addons: (it.addons || []).filter(a => a.name.trim()).map(a => ({ id: a.id, name: a.name.trim(), price_pence: toPence(a.price), cost_pence: toPence(a.cost) })), allergens: it.allergens && typeof it.allergens === 'object' ? it.allergens : {} })) }))
const bundlesFromDoc = bs => (bs || []).map(b => ({ id: b.id || nid('bun'), name: b.name || 'Beer + Burger', burger_id: b.burger_id || '', beer: b.beer_pence != null ? pounds(b.beer_pence) : '6', price: b.price_pence != null ? pounds(b.price_pence) : '', days: Array.isArray(b.days) ? b.days : ['Tue'] }))
const bundlesToDoc = bs => bs.map(b => ({ id: b.id, name: b.name, burger_id: b.burger_id, beer_pence: toPence(b.beer), price_pence: toPence(b.price), days: b.days }))

export default function MenuManager() {
  const [sections, setSections] = useState(null)
  const [bundles, setBundles] = useState([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { (async () => {
    try { const r = await getMenu(); setSections(r.sections?.length ? fromDoc(r.sections) : DEFAULTS); setBundles(bundlesFromDoc(r.bundles)) }
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
    try { await saveMenu(toDoc(sections), bundlesToDoc(bundles)); setDirty(false); setMsg('Saved ✓ — the order page & kitchen screen now use this menu.') }
    catch (e) { setMsg("Couldn't save — " + e.message) } finally { setSaving(false) }
  }

  if (sections == null) return <div style={{ color: MUTED, fontSize: 13, padding: '20px 0' }}>Loading menu…</div>

  const burgerOpts = sections.flatMap(s => s.items.filter(it => it.name).map(it => ({ id: it.id, name: it.name, sell: it.sell })))

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
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Field label="Sell £ inc VAT" value={it.sell} onChange={v => setItem(si, ii, 'sell', v)} />
                      <Field label="Cost £" value={it.cost} onChange={v => setItem(si, ii, 'cost', v)} />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0e0e10', border: `1px solid ${it.sell && it.cost ? mgColor(mp) : LINE}`, borderRadius: 8, padding: '5px 9px' }}
                        title="Gross margin on the ex-VAT price. £ figure = cash profit per item.">
                        <span style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Margin</span>
                        <b style={{ fontSize: 14, color: it.sell && it.cost ? mgColor(mp) : MUTED }}>{it.sell && it.cost ? mp + '%' : '—'}</b>
                        {it.sell && it.cost && <span style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>· £{(parseFloat(it.sell) / VAT - parseFloat(it.cost)).toFixed(2)}</span>}
                      </span>
                      <button onClick={() => delItem(si, ii)} title="Remove item" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 15 }}>×</button>
                    </div>
                    <textarea value={it.desc || ''} placeholder="Description (shown on the printed menu)…" onChange={e => setItem(si, ii, 'desc', e.target.value)} rows={2} style={{ width: '100%', marginTop: 7, background: '#0e0e10', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 8, padding: '7px 9px', fontSize: 12.5, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    <div style={{ marginTop: 8, borderTop: `1px dashed ${LINE}`, paddingTop: 8 }}>
                      <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Add-ons / extras</div>
                      {(it.addons || []).map((a, ai) => {
                        const amp = marginPct(a.price, a.cost)
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
                    <div style={{ marginTop: 8, borderTop: `1px dashed ${LINE}`, paddingTop: 8 }}>
                      <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                        Allergens <span style={{ textTransform: 'none', letterSpacing: 0 }}>— tap once = <b style={{ color: ALLERGEN_COLOR.contains }}>●&nbsp;contains</b>, twice = <b style={{ color: ALLERGEN_COLOR.trace }}>○&nbsp;may&nbsp;contain</b>, again = off. Drives the customer allergy warning.</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {ALLERGENS.map(al => {
                          const st = (it.allergens || {})[al.key]
                          const col = ALLERGEN_COLOR[st]
                          return (
                            <button key={al.key} onClick={() => cycleAllergen(si, ii, al.key)}
                              style={{ fontSize: 11.5, padding: '4px 8px', borderRadius: 999, cursor: 'pointer', fontWeight: st ? 700 : 500,
                                border: `1px solid ${col || LINE}`, background: st ? `${col}22` : 'transparent', color: st ? col : MUTED }}>
                              {st === 'contains' ? '● ' : st === 'trace' ? '○ ' : ''}{al.label}
                            </button>
                          )
                        })}
                      </div>
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
        <button onClick={addBundle} style={addBtn()}>＋ Add a beer + burger bundle</button>
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

// Order-page URL the printed QR points to. UPDATE this to the live order page once
// the customer order+pay page is deployed (customer-site repo).
const ORDER_URL = 'https://nodice.bar/onaroll'

// Branded "On A Roll" menu — one A4 = two identical A5 halves (cut in half), each with
// a "scan to order & pay" QR and the "open til 10pm" line. Opens a print window.
function exportMenu(sections) {
  const secs = (sections || []).filter(s => s.id !== 'bar')
  const inner = secs.map(sec => {
    const its = sec.items.filter(it => it.name)
    if (!its.length) return ''
    const gbp = n => '£' + (n % 1 === 0 ? n : n.toFixed(2))
    const rows = its.map(it => {
      const price = it.sell ? gbp(parseFloat(it.sell)) : ''
      const adds = (it.addons || []).filter(a => a.name && a.name.trim())
      const addLine = adds.length ? `<div class="mao">${adds.map(a => `${esc(a.name.trim())} +${gbp(parseFloat(a.price) || 0)}`).join(' · ')}</div>` : ''
      return `<div class="mrow"><div class="mi"><span class="mn">${esc(it.name)}</span><span class="dots"></span><span class="mp">${price}</span></div>${it.desc ? `<div class="md">${esc(it.desc)}</div>` : ''}${addLine}</div>`
    }).join('')
    return `<div class="msec"><div class="mh">${esc(sec.name)}</div>${rows}</div>`
  }).join('')
  const a5 = `<div class="a5"><img class="logo" src="${ON_A_ROLL_LOGO_BW}" alt="On A Roll"><div class="a5body"><div class="msub">London Fields · open til 10pm</div>${inner}</div><div class="scan"><div class="qr"></div><div class="scantxt"><div class="scanh">Scan to order &amp; pay</div><div class="scansub">Order on your phone — we'll text you the second it's ready. No queue. Open til 10pm.</div></div></div><div class="mfoot">Please inform us of any allergies before ordering · all prices inc VAT</div></div>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>On A Roll menu</title><style>
    @page{ size:A4 landscape; margin:6mm } *{ box-sizing:border-box }
    html,body{ margin:0; padding:0; font-family:Impact,'Arial Narrow Bold',sans-serif; -webkit-print-color-adjust:exact; print-color-adjust:exact }
    .a4{ display:flex; width:283mm; height:195mm; background:#fff; overflow:hidden; page-break-inside:avoid; break-inside:avoid }
    .logo{ width:118px; height:auto; display:block; margin-bottom:3px }
    .a5{ flex:1; min-width:0; padding:8mm 9mm; color:#000; display:flex; flex-direction:column; overflow:hidden } .a5:first-child{ border-right:1px dashed #999 }
    .a5body{ transform-origin:top left }
    .msub{ font-family:Arial; font-size:9.5px; color:#444; margin:2px 0 14px; text-transform:uppercase; letter-spacing:.09em }
    .msec{ margin-bottom:17px } .mh{ font-size:18px; color:#000; letter-spacing:1px; border-bottom:1.5px solid #000; padding-bottom:4px; margin-bottom:9px }
    .mrow{ margin-bottom:12px }
    .mi{ display:flex; align-items:baseline; gap:5px; font-family:Impact,'Arial Narrow Bold',sans-serif; font-size:18px; color:#000 }
    .mi .dots{ flex:1; border-bottom:1px dotted #999 } .mp{ font-weight:800 }
    .md{ font-family:Arial; font-size:12px; color:#222; line-height:1.4; margin-top:3px }
    .mao{ font-family:Arial; font-size:11px; font-style:italic; color:#000; margin-top:3px }
    .scan{ display:flex; gap:11px; align-items:center; margin-top:auto; border-top:2px solid #000; padding-top:10px }
    .qr{ width:92px; height:92px; flex-shrink:0 } .qr img,.qr canvas{ width:92px!important; height:92px!important }
    .scanh{ font-size:16px; color:#000 } .scansub{ font-family:Arial; font-size:9.5px; color:#000; margin-top:3px; line-height:1.35 }
    .mfoot{ font-family:Arial; font-size:8.5px; color:#444; margin-top:10px }
  </style></head><body><div class="a4">${a5}${a5}</div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
  <script>
    // Shrink each A5's menu body until the whole half (logo + menu + QR footer)
    // fits its page — so it always prints on ONE landscape sheet, no overflow to
    // a 2nd sheet and no "fit to page" needed in the printer dialog.
    function fitA5(){document.querySelectorAll('.a5').forEach(function(a5){var b=a5.querySelector('.a5body');if(!b)return;var z=1;b.style.zoom='1';var g=0;while(a5.scrollHeight>a5.clientHeight&&z>0.5&&g<60){z-=0.02;b.style.zoom=String(z);g++;}});}
    window.addEventListener('load',function(){try{document.querySelectorAll('.qr').forEach(function(el){new QRCode(el,{text:${JSON.stringify(ORDER_URL)},width:88,height:88,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M})})}catch(e){}setTimeout(function(){fitA5();setTimeout(function(){window.print()},250)},400)});<\/script>
  </body></html>`
  const w = window.open('', '_blank')
  if (!w) { alert('Allow pop-ups to print the menu.'); return }
  w.document.write(html); w.document.close()
}
const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
