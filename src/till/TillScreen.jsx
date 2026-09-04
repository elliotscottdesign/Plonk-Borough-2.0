import React, { useEffect, useMemo, useState } from 'react'
import { PAGES, HH_PAGE } from './data/happyHour.js'
import liveTill from './data/liveTill.json'
import { tillFloorGet, tillFloorSave, tillReservationsToday, tillVoucherList, tillVoucherLookup, tillVoucherRedeem } from './api.js'
import { gbp } from './gp.js'
import { pageColor, tint } from './colors.js'
import useIsMobile from '../lib/useIsMobile.js'

// ─── TILL — the register, K Series layout (demo) ────────────────────────────
// Founder (20 Aug 2026): "layout should mimic Lightspeed K Series — stock on
// right, calculator and list of orders on left — discount section inline with
// Lightspeed." So the register is:
//
//   LEFT  — the ticket: order lines (tap a line to select it), running total,
//           a numeric keypad (type 3, tap Corona → 3 × Corona, exactly like
//           K Series), and the function row: SEND · DISC · ADDITION.
//   RIGHT — the stock: page rail + product buttons.
//
// Discounts, K Series style: preset % buttons, comp (100%), or a custom % / £
// typed on the keypad — applied to the SELECTED LINE if one is selected,
// otherwise to the whole order, always with its name printed on the ticket
// and the addition. Removing one is one tap in the same panel.
//
// DEMO discipline unchanged: orders persist in this device's browser only,
// nothing is written server-side, Lightspeed stays the till of record.

const CREAM = 'var(--cream)', DIM = 'rgba(255,255,255,0.55)', GOLD = 'var(--gold)'
const LINE = 'rgba(255,255,255,0.12)', GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33'

// ── The drawn room ───────────────────────────────────────────────────────────
// Tables live at % coordinates so the same room fits any iPad. Editable in
// place (✏️ Edit room); synced through till_settings once the fn is deployed,
// localStorage until then. Seeded with a plausible room — the founder redraws
// it to match the venue. LATER STAGE (founder, 21 Aug 2026): reservations from
// the booking system get dropped onto tables to hold them under the booking's
// name — the `note` field on a table is the landing slot for that.
const FLOOR_STORE = 'nd_till_floor_v1'
const DEFAULT_FLOOR = { tables: [
  { id: 't1', name: 'Booth 1', x: 3, y: 4, w: 20, h: 17 },
  { id: 't2', name: 'Booth 2', x: 26, y: 4, w: 20, h: 17 },
  { id: 't3', name: 'Booth 3', x: 49, y: 4, w: 20, h: 17 },
  { id: 't4', name: 'Booth 4', x: 72, y: 4, w: 20, h: 17 },
  { id: 't5', name: 'T1', x: 3, y: 30, w: 14, h: 15 }, { id: 't6', name: 'T2', x: 20, y: 30, w: 14, h: 15 },
  { id: 't7', name: 'T3', x: 37, y: 30, w: 14, h: 15 }, { id: 't8', name: 'T4', x: 54, y: 30, w: 14, h: 15 },
  { id: 't9', name: 'T5', x: 3, y: 50, w: 14, h: 15 }, { id: 't10', name: 'T6', x: 20, y: 50, w: 14, h: 15 },
  { id: 't11', name: 'T7', x: 37, y: 50, w: 14, h: 15 }, { id: 't12', name: 'T8', x: 54, y: 50, w: 14, h: 15 },
  { id: 't13', name: 'Bar 1', x: 3, y: 72, w: 30, h: 16 }, { id: 't14', name: 'Bar 2', x: 38, y: 72, w: 30, h: 16 },
] }
const loadFloor = () => {
  try { const f = JSON.parse(localStorage.getItem(FLOOR_STORE)); if (f && Array.isArray(f.tables)) return f } catch { /* fresh */ }
  return DEFAULT_FLOOR
}

const STORE = 'nd_till_demo_orders_v1'
const loadOrders = () => {
  try { return JSON.parse(localStorage.getItem(STORE)) || {} } catch { return {} }
}
let nextId = Date.now()
const newOrder = (kind, ref, name) => ({
  id: 'o' + (nextId++), kind, ref, name: name || null, lines: [], disc: null, openedAt: new Date().toISOString(), status: 'open',
})

// ── discount arithmetic (all inc-VAT money) ──────────────────────────────────
const lineGross = (l) => l.qty * l.price
const lineDiscAmt = (l) => !l.disc ? 0
  : l.disc.kind === 'pct' ? lineGross(l) * l.disc.value / 100
  : Math.min(l.disc.value, lineGross(l))
const lineTotal = (l) => lineGross(l) - lineDiscAmt(l)
const orderSub = (o) => o.lines.reduce((s, l) => s + lineTotal(l), 0)
const orderDiscAmt = (o) => !o.disc ? 0
  : o.disc.kind === 'pct' ? orderSub(o) * o.disc.value / 100
  : Math.min(o.disc.value, orderSub(o))
const orderTotal = (o) => orderSub(o) - orderDiscAmt(o)
// What's left to pay after an applied voucher (never below zero — no change
// given on a voucher).
const voucherAmt = (o) => o.voucher ? Math.min(o.voucher.amount_pence / 100, orderTotal(o)) : 0
const orderDue = (o) => +(orderTotal(o) - voucherAmt(o)).toFixed(2)

export default function TillScreen() {
  const isMobile = useIsMobile()
  const pages = PAGES

  // Happy hour clock (founder, 21 Aug 2026): buttons live ALL DAY Monday till
  // 11pm, and Tue–Fri until 19:10 sharp — outside that they cannot be used.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id) }, [])
  const hhOpen = (() => {
    const d = now.getDay(), h = now.getHours(), m = now.getMinutes()
    if (d === 1) return h < 23                                  // Monday, all day till 11pm
    if (d >= 2 && d <= 5) return h < 19 || (h === 19 && m < 10) // Tue–Fri till 19:10
    return false                                                // weekend: no happy hour
  })()
  const [orders, setOrders] = useState(loadOrders)
  const [currentId, setCurrentId] = useState(null)
  const [screen, setScreen] = useState('floor')          // 'floor' | 'ring' | 'bill'
  const [pageName, setPageName] = useState(pages[0]?.name)
  const [query, setQuery] = useState('')
  const [closed, setClosed] = useState(null)
  const [selKey, setSelKey] = useState(null)             // selected ticket line
  const [padOpen, setPadOpen] = useState(false)          // keypad hidden until asked for
  const [buf, setBuf] = useState('')                     // keypad buffer
  const [discOpen, setDiscOpen] = useState(false)
  const [splitN, setSplitN] = useState(0)                // 0 = no split
  const [sharesPaid, setSharesPaid] = useState([])       // one bool per share
  const [vCode, setVCode] = useState('')                 // voucher code being typed
  const [vBusy, setVBusy] = useState(false)
  const [vErr, setVErr] = useState('')
  const [vListOpen, setVListOpen] = useState(false)      // browse-all-vouchers panel
  const [vList, setVList] = useState(null)               // loaded outstanding vouchers
  const [vFilter, setVFilter] = useState('')
  const [folder, setFolder] = useState(null)             // null | 'Spirits' — the open category folder
  const [mixerFor, setMixerFor] = useState(null)         // { b, qty } — spirit awaiting its mixer choice
  const [infoFor, setInfoFor] = useState(null)           // product shown in the long-press info popup
  const [dealFor, setDealFor] = useState(null)           // { b, qty, cfg, picks } — deal awaiting its drink choices

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(orders)) } catch { /* private mode */ }
  }, [orders])

  // Land on a Quick Sale register, ready to ring (founder, 20 Aug 2026) — the
  // floor is one tap away. Resumes an unfinished quick sale if one exists.
  useEffect(() => {
    const quick = Object.values(loadOrders()).find(o => o.status === 'open' && o.kind === 'quick')
    if (quick) { setCurrentId(quick.id); setScreen('ring') }
    else start('quick', null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── The room + the tab list ──────────────────────────────────────────────
  const [floorPlan, setFloorPlan] = useState(loadFloor)
  const [editRoom, setEditRoom] = useState(false)
  const [selTable, setSelTable] = useState(null)         // selected table id (edit mode)
  const [moveOrderId, setMoveOrderId] = useState(null)   // order being re-homed via the floor

  // ── Reservations dropped onto tables (founder, 21 Aug 2026) ──────────────
  // Today's bookings load from bar_reservations; tap one, then tap table(s) to
  // hold them under the booking's name. Tapping a held table when the group
  // arrives seats them: the order opens pre-named and the holds clear.
  const HOLDS_STORE = 'nd_till_holds_v1'
  const [holds, setHolds] = useState(() => {
    try { const h = JSON.parse(localStorage.getItem(HOLDS_STORE)); if (h && h.map) return h } catch { /* fresh */ }
    return { date: null, map: {} }
  })
  const [resList, setResList] = useState(null)
  const [resDay, setResDay] = useState(null)
  const [resDropId, setResDropId] = useState(null)       // reservation being placed
  const saveHolds = (h) => { setHolds(h); try { localStorage.setItem(HOLDS_STORE, JSON.stringify(h)) } catch { /* private mode */ } }
  useEffect(() => {
    if (screen !== 'floor') return
    let stop = false
    const load = () => tillReservationsToday().then(r => {
      if (stop) return
      setResList(r.list); setResDay(r.day)
      setHolds(h => h.date === r.day ? h : { date: r.day, map: {} })   // yesterday's holds expire
    }).catch(() => { if (!stop) setResList([]) })
    load()
    const id = setInterval(load, 60000)
    return () => { stop = true; clearInterval(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])
  const dragRef = React.useRef(null)
  const canvasRef = React.useRef(null)
  useEffect(() => {   // pull the shared room once the fn is live; silent until then
    tillFloorGet().then(r => { if (r.floor) { setFloorPlan(r.floor); try { localStorage.setItem(FLOOR_STORE, JSON.stringify(r.floor)) } catch {} } }).catch(() => {})
  }, [])
  const saveFloor = (plan) => {
    setFloorPlan(plan)
    try { localStorage.setItem(FLOOR_STORE, JSON.stringify(plan)) } catch { /* private mode */ }
    tillFloorSave(plan).catch(() => { /* syncs when the fn is deployed */ })
  }

  const open = Object.values(orders).filter(o => o.status === 'open')
  const orderFor = (kind, ref) => open.find(o => o.kind === kind && o.ref === ref)
  const current = currentId ? orders[currentId] : null
  const unsentOf = (o) => o.lines.reduce((s, l) => s + Math.max(0, l.qty - (l.sentQty || 0)), 0)
  const refLabel = (o) => o.kind === 'table' ? (o.name ? `${o.ref} · ${o.name}` : o.ref)
    : o.kind === 'tab' ? `Tab · ${o.name || o.ref}` : 'Quick sale'

  const start = (kind, ref, name) => {
    const existing = orderFor(kind, ref)
    if (existing) { setCurrentId(existing.id); setScreen('ring'); return }
    const o = newOrder(kind, ref, name)
    setOrders(prev => ({ ...prev, [o.id]: o }))
    setCurrentId(o.id); setScreen('ring')
  }

  // Re-home an order: onto a table, or off the floor into the named-tab list.
  const moveOrderToTable = (tableName) => {
    const clash = open.find(o => o.kind === 'table' && o.ref === tableName && o.id !== moveOrderId)
    if (clash) { alert(`${tableName} already has an open order (${gbp(orderTotal(clash))}).`) ; return }
    patch(moveOrderId, o => ({ ...o, kind: 'table', ref: tableName }))
    setCurrentId(moveOrderId); setMoveOrderId(null); setScreen('ring')
  }
  const moveOrderToTab = () => {
    const o = orders[moveOrderId]
    const name = prompt('Name for the tab?', o?.name || '')
    if (!name?.trim()) return
    patch(moveOrderId, x => ({ ...x, kind: 'tab', ref: name.trim(), name: name.trim() }))
    setCurrentId(moveOrderId); setMoveOrderId(null); setScreen('ring')
  }
  const patch = (id, fn) => setOrders(prev => ({ ...prev, [id]: fn(prev[id]) }))
  const resetRingUi = () => { setSelKey(null); setBuf(''); setDiscOpen(false); setSplitN(0); setSharesPaid([]); setVCode(''); setVErr(''); setVBusy(false) }

  const openVoucherBrowse = async () => {
    setVListOpen(true); setVFilter(''); setVErr('')
    if (!vList) {
      try { const r = await tillVoucherList(); setVList(r.vouchers || []) }
      catch (e) { setVErr(e.message || 'Could not load the voucher list.'); setVListOpen(false) }
    }
  }
  const pickVoucher = (v) => {
    patch(currentId, o => ({ ...o, voucher: { code: v.code, name: v.name, amount_pence: v.amount_pence, source: v.source } }))
    setVListOpen(false)
  }

  const applyVoucher = async () => {
    setVBusy(true); setVErr('')
    try {
      const r = await tillVoucherLookup(vCode)
      const v = r.voucher
      if (v.redeemed_at) { setVErr(`Already redeemed${v.redeemed_by ? ` by ${v.redeemed_by}` : ''} on ${String(v.redeemed_at).slice(0, 10)}.`); setVBusy(false); return }
      patch(currentId, o => ({ ...o, voucher: { code: v.code, name: v.name, amount_pence: v.amount_pence, source: v.source } }))
      setVCode('')
    } catch (e) { setVErr(e.message || 'Could not check that code.') }
    setVBusy(false)
  }
  const chooseSplit = (n) => { setSplitN(n); setSharesPaid(n > 0 ? Array(n).fill(false) : []) }

  const toFloor = () => {
    const o = orders[currentId]
    if (o && o.lines.length === 0) {
      setOrders(prev => { const n = { ...prev }; delete n[currentId]; return n })
    }
    setCurrentId(null); setScreen('floor'); resetRingUi()
  }

  // ── ring actions ──────────────────────────────────────────────────────────
  // Mixers, K Series style (founder, 20 Aug 2026): tapping a SPIRIT asks for a
  // mixer — Coke / Coke Zero / Lemonade / Tonic at £1 a splash, or none. The
  // Double Deal: on the £6 house spirits ONLY, a double + dash is £10 flat.
  const MIXERS = ['Coke', 'Coke Zero', 'Lemonade', 'Tonic']
  const MIXER_PRICE = 1.0
  const isDoubleDealSpirit = (product) =>
    product.serves.some(s => s.label === 'Single' && s.price === 6.0)

  const pushLine = (key, name, price, qty, food) => patch(currentId, o => {
    const hit = o.lines.find(l => l.key === key)
    return {
      ...o,
      lines: hit
        ? o.lines.map(l => l.key === key ? { ...l, qty: l.qty + qty } : l)
        : [...o.lines, { key, name, price, qty, sentQty: 0, disc: null, food }],
    }
  })

  // Deals must record WHICH drinks are poured (founder, 20 Aug 2026) — a "2
  // for £12" that doesn't name the cocktails can never deplete stock. Each
  // deal opens a picker; the choices are written into the ticket line.
  // Deal rules come from Lightspeed's OWN combo definitions (mined into
  // liveTill.combos by scripts/tillLiveMenu.py): the choice list and the pick
  // count are the till's, not guessed. Single-option groups (e.g. the Tuesday
  // deal's golf round + tokens) are auto-included, no tap needed.
  const productNamesOf = (pageNames) =>
    pages.filter(pg => pageNames.includes(pg.name)).flatMap(pg => pg.products.map(p => p.name))
  const dealCfg = (product) => {
    const c = liveTill.combos && liveTill.combos[product.name]
    if (c && c.choices && c.choices.length) {
      const auto = c.choices.filter(ch => ch.options.length === 1 && ch.min >= 1).map(ch => ch.options[0])
      const pickable = c.choices.filter(ch => ch.options.length > 1)
      if (pickable.length) {
        const g = pickable[0]
        const picks = Math.max(1, g.max)
        return { picks, title: `${g.name} — pick ${picks}`, opts: g.options, auto }
      }
      if (auto.length) return { picks: 0, title: '', opts: [], auto }
    }
    // Fallbacks for buttons with no combo definition in the export.
    const n = product.name.toUpperCase()
    if (n.includes('SHOOTER')) return { picks: 3, title: 'Which 3 shooters?', opts: productNamesOf(['Shots']) }
    if (n.includes('GAME & DRINK')) return { picks: 1, title: 'Which drink?', opts: productNamesOf(['Beer & Cider', 'Cocktails & Warmers', 'Softs & Hot Drinks']) }
    if (n.includes('HOT DOG & DRINK') || n.includes('HOTDOG & DRINK')) return { picks: 1, title: 'Which drink?', opts: productNamesOf(['Beer & Cider', 'Softs & Hot Drinks']) }
    return null
  }

  const add = (b) => {
    const qty = Math.max(1, Math.min(99, parseInt(buf || '1', 10) || 1))
    setBuf('')
    if (b.page === HH_PAGE) {
      if (!hhOpen) return                          // happy hour is over — dead button
      if (b.product.hh) {
        setDealFor({ b, qty, cfg: { picks: 1, title: b.product.hh.title, opts: b.product.hh.opts }, picks: [], hhMixer: b.product.hh.mixer })
        return
      }
      pushLine(`${b.product.sku}`, `${b.product.name} · HH`, b.serve.price, qty, false)
      return
    }
    const cfg = dealCfg(b.product)
    if (cfg) {
      if (cfg.picks === 0) {   // fully fixed deal — everything auto-included
        pushLine(`${b.product.sku}`, `${b.product.name} (${cfg.auto.join(', ')})`, b.serve.price, qty, b.page === 'Snacks & Food')
        return
      }
      setDealFor({ b, qty, cfg, picks: [] }); return
    }
    if (b.page.startsWith('Spirits — ') && b.serve.label !== 'Bottle') {
      setMixerFor({ b, qty })                      // ask for the mixer first
      return
    }
    const label = b.serve.label && b.serve.label !== 'Each' ? ` — ${b.serve.label}` : ''
    pushLine(`${b.product.sku}·${b.serve.label}`, `${b.product.name}${label}`, b.serve.price, qty, b.page === 'Snacks & Food')
  }

  const addDeal = () => {
    const { b, qty, picks, hhMixer } = dealFor
    setDealFor(null)
    if (hhMixer) {
      // £6 Double (+£1 mixer) / £7 Long Drink (mixer included) — pick the
      // spirit first, then the usual mixer question.
      setMixerFor({
        qty, base: b.serve.price, mixerAdd: hhMixer === 'included' ? 0 : MIXER_PRICE,
        b: { product: { name: `${picks[0]} · ${b.product.name}`, sku: `${b.product.sku}·${picks[0]}`, serves: [] }, serve: { label: 'Each', price: b.serve.price }, page: HH_PAGE },
      })
      return
    }
    const all = [...(dealFor.cfg?.auto || []), ...picks]
    pushLine(`${b.product.sku}·${picks.join('+')}`, `${b.product.name} (${all.join(', ')})`, b.serve.price, qty, b.page === 'Snacks & Food')
  }

  const addSpirit = (mixer) => {                   // mixer = name string or null
    const { b, qty, base, mixerAdd } = mixerFor    // base/mixerAdd set on HH deals
    setMixerFor(null)
    const label = b.serve.label && b.serve.label !== 'Each' ? ` — ${b.serve.label}` : ''
    const start = base != null ? base : b.serve.price
    if (!mixer) {
      pushLine(`${b.product.sku}·${b.serve.label}`, `${b.product.name}${label}`, start, qty, false)
      return
    }
    const deal = base == null && b.serve.label === 'Double' && isDoubleDealSpirit(b.product)
    const price = deal ? 10.0 : start + (mixerAdd != null ? mixerAdd : MIXER_PRICE)
    const name = `${b.product.name}${label} + ${mixer}${deal ? ' · Double Deal' : ''}`
    pushLine(`${b.product.sku}·${b.serve.label}·${mixer}`, name, price, qty, false)
  }
  const bump = (key, d) => patch(currentId, o => ({
    ...o,
    lines: o.lines.map(l => l.key === key ? { ...l, qty: Math.max(l.sentQty || 0, l.qty + d) } : l)
      .filter(l => l.qty > 0),
  }))
  const send = () => patch(currentId, o => ({ ...o, lines: o.lines.map(l => ({ ...l, sentQty: l.qty })) }))
  const [paying, setPaying] = useState(false)
  const pay = async () => {
    const o = orders[currentId]
    // The one REAL action in the demo till: an applied voucher is redeemed in
    // the live voucher system (same rows the staff-portal Prizes flow marks).
    if (o.voucher) {
      setPaying(true)
      try { await tillVoucherRedeem(o.voucher.code, 'Till') }
      catch (e) {
        setPaying(false)
        alert(`Voucher NOT redeemed — ${e.message || 'no connection'}. Remove the voucher or try again.`)
        return
      }
      setPaying(false)
    }
    setClosed({ ref: refLabel(o), total: orderDue(o), voucher: o.voucher || null })
    resetRingUi()
    // Straight into the next sale — a fresh Quick Sale register, K Series style.
    const fresh = newOrder('quick', null)
    setOrders(prev => { const n = { ...prev }; delete n[currentId]; n[fresh.id] = fresh; return n })
    setCurrentId(fresh.id); setScreen('ring')
  }

  // ── discounts ─────────────────────────────────────────────────────────────
  const applyDisc = (disc) => {          // disc = {kind,value,name} or null to remove
    if (selKey) {
      patch(currentId, o => ({ ...o, lines: o.lines.map(l => l.key === selKey ? { ...l, disc } : l) }))
    } else {
      patch(currentId, o => ({ ...o, disc }))
    }
    setDiscOpen(false); setBuf('')
  }

  // ── product buttons ───────────────────────────────────────────────────────
  const buttons = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = []
    for (const pg of pages) {
      if (!q && pg.name !== pageName) continue
      for (const p of pg.products) {
        if (p.nav) { if (!q) out.push({ nav: p.nav, name: p.name, page: pg.name, product: p, serve: { label: 'Each' } }); continue }
        for (const s of p.serves) {
          if (q && !(`${p.name} ${s.label} ${s.button || ''}`.toLowerCase().includes(q))) continue
          out.push({ product: p, serve: s, page: pg.name })
        }
      }
    }
    return out
  }, [pages, pageName, query])

  // iPad law (founder, 21 Aug 2026): the till NEVER scrolls. The register
  // measures the space it actually has (below the headers, above the shell's
  // bottom padding) and locks itself to it; big pages flip with ◀ ▶.
  const frameRef = React.useRef(null)
  const [frameH, setFrameH] = useState(null)
  useEffect(() => {
    const fit = () => {
      const el = frameRef.current
      if (!el) return
      setFrameH(Math.max(430, window.innerHeight - el.getBoundingClientRect().top - window.scrollY - 78))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
    // re-measure whenever the register (re)appears — it doesn't exist on the
    // floor/bill screens, so a mount-only measure would never see it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])
  // Page size = however many tiles genuinely FIT in the measured grid box —
  // a clipped row would make its buttons unreachable.
  const gridRef = React.useRef(null)
  const [pageSize, setPageSize] = useState(24)
  React.useLayoutEffect(() => {
    if (isMobile) { setPageSize(12); return }
    const fit = () => {
      const el = gridRef.current
      if (!el) return
      const cols = Math.max(1, Math.floor((el.clientWidth + 8) / 156))
      const rows = Math.max(1, Math.floor((el.clientHeight + 8) / (76 + 8)))
      setPageSize(Math.max(4, cols * rows))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
    // deps: the grid box changes size when the register appears, the frame is
    // measured, or a page adds/removes its banner — re-fit on all of them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, frameH, screen, pageName, query])
  const [gridPage, setGridPage] = useState(0)
  const [overflowView, setOverflowView] = useState(false)   // inside a page's 📁 More folder
  useEffect(() => { setGridPage(0); setOverflowView(false) }, [pageName, query, folder, pageSize])
  const spiritsView = !query && pageName.startsWith('Spirits — ')

  // HARD LAW (founder, 21 Aug 2026): EVERY item page fits ONE screen — never a
  // pager on a main page. Whatever fits (minus folder tiles) stays; the rest
  // lives behind a 📁 More tile (cocktails spill into their Classics folder
  // instead). Folders themselves may page — main screens never do.
  const COCKTAILS = 'Cocktails & Warmers', CLASSICS = 'Cocktails — Classics'
  const entriesFor = (pgName) => {
    const pg = pages.find(p => p.name === pgName)
    if (!pg) return []
    const out = []
    for (const p of pg.products) {
      if (p.nav) { out.push({ nav: p.nav, name: p.name, page: pgName, product: p, serve: { label: 'Each' } }); continue }
      for (const s of p.serves) out.push({ product: p, serve: s, page: pgName })
    }
    return out
  }
  const cocktailCap = Math.max(1, pageSize - 1)   // one tile reserved for 📁 Classics
  const MORE = { navMore: true, sku: 'NAV.more', name: '📁 More' }
  const BACK = { navBack: true, sku: 'NAV.backmore', name: '← Back' }
  let gridList
  let onePage = false
  if (query) {
    gridList = buttons                                       // search results may page
  } else if (pageName === COCKTAILS) {
    const items = buttons.filter(b => !b.nav)
    gridList = [...items.slice(0, cocktailCap), ...buttons.filter(b => b.nav)]
    onePage = true
  } else if (pageName === CLASSICS) {
    const overflow = entriesFor(COCKTAILS).filter(b => !b.nav).slice(cocktailCap)
    gridList = [...buttons.filter(b => b.nav), ...overflow, ...buttons.filter(b => !b.nav)]
  } else {
    const list = spiritsView ? (pages.find(pg => pg.name === pageName)?.products || []) : buttons
    const hidden = pages.find(pg => pg.name === pageName)?.hidden
    if (hidden) gridList = list                              // folders may page
    else if (overflowView) gridList = [BACK, ...list.slice(pageSize - 1)]
    else if (list.length > pageSize) { gridList = [...list.slice(0, pageSize - 1), MORE]; onePage = true }
    else { gridList = list; onePage = true }
  }
  const gridPages = onePage ? 1 : Math.max(1, Math.ceil(gridList.length / pageSize))
  const gridSlice = gridList.slice(gridPage * pageSize, (gridPage + 1) * pageSize)

  // ═══ FLOOR — the drawn room + the tab list ════════════════════════════════
  if (screen === 'floor') {
    const tabs = open.filter(o => o.kind === 'tab' || o.name)
    const tableOrder = (name) => open.find(o => o.kind === 'table' && o.ref === name)
    const moving = moveOrderId ? orders[moveOrderId] : null

    const pctFromEvent = (e) => {
      const r = canvasRef.current.getBoundingClientRect()
      return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
    }
    // One pointer engine, two modes: drag a table to place it, drag the ◢
    // corner handle to size it — draw the room right on the venue plan.
    const beginPointer = (e, t, mode) => {
      if (!editRoom) return
      e.preventDefault()
      if (mode === 'resize') e.stopPropagation()
      const p = pctFromEvent(e)
      dragRef.current = { id: t.id, mode, moved: false, sx: p.x, sy: p.y, x0: t.x, y0: t.y, w0: t.w, h0: t.h }
      const onMove = (ev) => {
        const d = dragRef.current
        if (!d) return
        const q = pctFromEvent(ev)
        d.moved = true
        setFloorPlan(fp => ({ ...fp, tables: fp.tables.map(x => {
          if (x.id !== d.id) return x
          if (d.mode === 'resize') {
            return { ...x,
              w: Math.min(60, Math.max(4, d.w0 + (q.x - d.sx))),
              h: Math.min(60, Math.max(4, d.h0 + (q.y - d.sy))) }
          }
          return { ...x,
            x: Math.min(100 - x.w, Math.max(0, d.x0 + (q.x - d.sx))),
            y: Math.min(100 - x.h, Math.max(0, d.y0 + (q.y - d.sy))) }
        }) }))
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        if (dragRef.current?.moved) setFloorPlan(fp => { saveFloor(fp); return fp })
        dragRef.current = null
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    }
    const beginDrag = (e, t) => beginPointer(e, t, 'move')
    const tapTable = (t) => {
      if (editRoom) { setSelTable(selTable === t.id ? null : t.id); return }
      if (moveOrderId) { moveOrderToTable(t.name); return }
      if (resDropId) {                                  // placing a booking: toggle the hold
        const r = (resList || []).find(x => x.id === resDropId)
        if (!r) { setResDropId(null); return }
        const map = { ...holds.map }
        if (map[t.name]?.resId === resDropId) delete map[t.name]
        else map[t.name] = { resId: r.id, name: r.name || 'Guest', time: (r.start_time || '').slice(0, 5), party: r.party_size || 0 }
        saveHolds({ date: resDay || holds.date, map })
        return
      }
      const hold = holds.map[t.name]
      if (hold && !tableOrder(t.name)) {                // they've arrived — seat them
        if (confirm(`Seat ${hold.name}${hold.party ? ` (party of ${hold.party})` : ''} at ${t.name}?`)) {
          const map = Object.fromEntries(Object.entries(holds.map).filter(([, v]) => v.resId !== hold.resId))
          saveHolds({ ...holds, map })
          start('table', t.name, hold.name)
        }
        return
      }
      start('table', t.name)
    }
    const addTable = (w, h) => {
      const name = prompt('Name for the new table? (e.g. "T9", "Golf sofa")')
      if (!name?.trim()) return
      const nt = { id: 'u' + Date.now(), name: name.trim(), x: 42, y: 42, w, h }
      saveFloor({ ...floorPlan, tables: [...floorPlan.tables, nt] }); setSelTable(nt.id)
    }
    const renameTable = () => {
      const t = floorPlan.tables.find(x => x.id === selTable); if (!t) return
      const name = prompt('Rename table:', t.name); if (!name?.trim()) return
      saveFloor({ ...floorPlan, tables: floorPlan.tables.map(x => x.id === selTable ? { ...x, name: name.trim() } : x) })
    }
    const deleteTable = () => {
      const t = floorPlan.tables.find(x => x.id === selTable); if (!t) return
      if (tableOrder(t.name)) { alert('That table has an open order — close or move it first.'); return }
      if (!confirm(`Remove "${t.name}" from the room?`)) return
      saveFloor({ ...floorPlan, tables: floorPlan.tables.filter(x => x.id !== selTable) }); setSelTable(null)
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...(isMobile ? {} : { height: frameH ? `${frameH + 40}px` : 'calc(100dvh - 220px)', minHeight: 460, overflow: 'hidden' }) }}>
        {closed && (
          <div style={{ fontSize: 13, color: GREEN, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, padding: '8px 12px', flexShrink: 0 }}>
            ✓ {closed.ref} paid {gbp(closed.total)}{closed.voucher ? ` · 🎟 ${closed.voucher.code} REDEEMED` : ''} — demo only.
          </div>
        )}
        {resDropId ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#60A5FA' }}>
              📅 Placing {(resList || []).find(r => r.id === resDropId)?.name || 'booking'} — tap table(s) to hold them (tap again to unhold)
            </span>
            <button onClick={() => setResDropId(null)} style={{ ...bigBtn(true), padding: '10px 22px' }}>DONE</button>
          </div>
        ) : moving ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: GOLD }}>⇄ Moving {refLabel(moving)} ({gbp(orderTotal(moving))}) — tap a table…</span>
            <button onClick={moveOrderToTab} style={bigBtn(false)}>…or make it a NAMED TAB</button>
            <button onClick={() => { setCurrentId(moveOrderId); setMoveOrderId(null); setScreen('ring') }} style={btn()}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
            <button onClick={() => start('quick', null)} style={bigBtn(true)}>⚡ Quick sale</button>
            <button onClick={() => { const name = prompt('Name for the tab? (e.g. "Sarah — blue jacket")'); if (name?.trim()) start('tab', name.trim(), name.trim()) }} style={bigBtn(false)}>✍️ Open a tab</button>
            <button onClick={() => { setEditRoom(!editRoom); setSelTable(null) }} style={{ ...bigBtn(false), marginLeft: 'auto', ...(editRoom ? { background: GOLD, color: '#141414', border: 'none' } : {}) }}>
              {editRoom ? '✓ DONE EDITING' : '✏️ Edit room'}
            </button>
          </div>
        )}
        {editRoom && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            <button onClick={() => addTable(8, 9)} style={btn()}>➕ Small table</button>
            <button onClick={() => addTable(14, 13)} style={btn()}>➕ Table</button>
            <button onClick={() => addTable(22, 18)} style={btn()}>➕ Large table</button>
            {selTable && (<>
              <button onClick={renameTable} style={btn()}>Rename</button>
              <button onClick={deleteTable} style={{ ...btn(), color: RED, borderColor: RED }}>Delete</button>
            </>)}
            <span style={{ fontSize: 11.5, color: DIM }}>{selTable ? 'Drag to place · drag the ◢ corner to size it.' : 'Tap a table to select, drag anywhere to place it on the plan.'}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
          {/* THE ROOM — the real Hackney floorplan (from the investor pages),
              landscape, with the tables drawn on top of it. Fixed aspect ratio
              so table positions line up with the plan on every device. */}
          <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div ref={canvasRef} style={{ position: 'relative', height: '100%', maxWidth: '100%', aspectRatio: '2480 / 1753', border: `2px solid rgba(255,255,255,0.18)`, borderRadius: 14, background: '#e9e6df', overflow: 'hidden', touchAction: editRoom ? 'none' : 'auto' }}>
            <img src="/hackney/floorplan_1.png" alt="" draggable={false}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', opacity: 0.92, pointerEvents: 'none', userSelect: 'none' }} />
            {floorPlan.tables.map(t => {
              const o = tableOrder(t.name)
              const hold = !o && holds.map[t.name]
              const sel = editRoom && selTable === t.id
              return (
                <div key={t.id}
                  onPointerDown={(e) => beginDrag(e, t)}
                  onClick={() => { if (!dragRef.current?.moved) tapTable(t) }}
                  style={{
                    position: 'absolute', left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}%`, height: `${t.h}%`,
                    borderRadius: 10, cursor: editRoom ? 'grab' : 'pointer', userSelect: 'none', WebkitUserSelect: 'none',
                    // Solid fills so tables read clearly on the white plan.
                    background: o ? 'rgba(58,48,18,0.96)' : hold ? 'rgba(17,34,58,0.96)' : 'rgba(22,22,26,0.88)',
                    border: hold ? '2px dashed #60A5FA'
                      : `2px solid ${sel ? '#22D3EE' : o ? GOLD : (moveOrderId || resDropId) ? 'rgba(52,211,153,0.9)' : 'rgba(255,255,255,0.35)'}`,
                    color: CREAM, padding: '6px 8px', boxSizing: 'border-box', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: o ? GOLD : hold ? '#60A5FA' : CREAM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.name}{o?.name ? <span style={{ fontWeight: 500 }}> · {o.name}</span> : hold ? <span style={{ fontWeight: 500 }}> · {hold.name}</span> : null}
                  </span>
                  {o
                    ? <span style={{ fontSize: 11.5 }}>{o.lines.reduce((s, l) => s + l.qty, 0)} items · <b>{gbp(orderTotal(o))}</b>{unsentOf(o) > 0 ? <span style={{ color: AMBER }}> ·!</span> : null}</span>
                    : hold
                      ? <span style={{ fontSize: 10.5, color: '#60A5FA' }}>📅 {hold.time}{hold.party ? ` · ${hold.party} ppl` : ''}</span>
                      : <span style={{ fontSize: 10.5, color: DIM }}>free</span>}
                  {sel && (
                    <div onPointerDown={(e) => beginPointer(e, t, 'resize')} style={{
                      position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: '10px 0 8px 0',
                      background: '#22D3EE', color: '#08222a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 900, cursor: 'nwse-resize', touchAction: 'none',
                    }}>◢</div>
                  )}
                </div>
              )
            })}
          </div>
          </div>

          {/* THE TAB LIST — who owes us, wherever they've wandered */}
          <div style={{ width: isMobile ? 180 : 250, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: DIM, flexShrink: 0 }}>✍️ Tabs — {tabs.length} open</div>
            {tabs.length === 0 && <div style={{ fontSize: 12, color: DIM }}>No tabs. "✍️ Open a tab" signs someone in.</div>}
            {tabs.map(o => (
              <button key={o.id} onClick={() => { if (!moveOrderId && !resDropId) { setCurrentId(o.id); setScreen('ring') } }} style={{
                borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', padding: '11px 12px', textAlign: 'left',
                background: 'rgba(201,168,76,0.1)', border: `1.5px solid ${GOLD}`, color: CREAM, flexShrink: 0,
              }}>
                <span style={{ fontSize: 13.5, fontWeight: 800 }}>{o.name || o.ref}</span>
                <span style={{ fontSize: 11.5, color: DIM }}> {o.kind === 'table' ? `· at ${o.ref}` : ''}</span>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: GOLD }}>{gbp(orderTotal(o))}</div>
              </button>
            ))}

            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: DIM, flexShrink: 0, marginTop: 10 }}>
              📅 Bookings today{resList ? ` — ${resList.length}` : ''}
            </div>
            {resList === null && <div style={{ fontSize: 12, color: DIM }}>Loading…</div>}
            {resList && resList.length === 0 && <div style={{ fontSize: 12, color: DIM }}>No bookings today.</div>}
            {(resList || []).map(r => {
              const heldAt = Object.entries(holds.map).filter(([, v]) => v.resId === r.id).map(([k]) => k)
              const active = resDropId === r.id
              return (
                <button key={r.id} onClick={() => setResDropId(active ? null : r.id)} style={{
                  borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', padding: '11px 12px', textAlign: 'left',
                  background: active ? 'rgba(96,165,250,0.18)' : 'rgba(96,165,250,0.07)',
                  border: `1.5px ${heldAt.length ? 'solid' : 'dashed'} #60A5FA`, color: CREAM, flexShrink: 0,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#60A5FA' }}>{(r.start_time || '').slice(0, 5)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}> {r.name || 'Guest'}</span>
                  <span style={{ fontSize: 11.5, color: DIM }}>{r.party_size ? ` · ${r.party_size} ppl` : ''}{r.kind ? ` · ${r.kind}` : ''}</span>
                  <div style={{ fontSize: 11, color: heldAt.length ? '#60A5FA' : DIM }}>
                    {heldAt.length ? `→ ${heldAt.join(', ')}` : active ? 'tap tables on the room…' : 'tap to place on the room'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: DIM, flexShrink: 0 }}>
          Demo till — orders live in this browser only. ✏️ Edit room to draw YOUR venue (drag, rename, resize) — the layout syncs to every till once the back end is live. Later: reservations drop onto tables from the booking system.
        </div>
      </div>
    )
  }

  if (!current) { setScreen('floor'); return null }

  // ═══ ADDITION (the bill) ══════════════════════════════════════════════════
  if (screen === 'bill') {
    const sub = orderSub(current), oDisc = orderDiscAmt(current), total = orderTotal(current)
    const vAmt = voucherAmt(current), due = orderDue(current)
    return (
      <div style={{ maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE}`, borderRadius: 12, padding: 18 }}>
          <div className="serif" style={{ fontSize: 18, color: '#fff' }}>No Dice — London Fields</div>
          <div style={{ fontSize: 10.5, color: DIM, marginBottom: 12 }}>No Dice Hackney Ltd · 407 Mentmore Terrace, E8 3PH · DEMO BILL — NOT A VAT RECEIPT</div>
          <div style={{ fontSize: 12.5, color: CREAM, marginBottom: 10, fontWeight: 700 }}>{refLabel(current)}</div>
          <div style={{ maxHeight: '38vh', overflowY: 'auto' }}>
          {current.lines.map(l => (
            <div key={l.key} style={{ padding: '3px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                <span style={{ color: CREAM }}>{l.qty} × {l.name}</span>
                <span style={{ color: CREAM, fontWeight: 600 }}>{gbp(lineGross(l))}</span>
              </div>
              {l.disc && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: AMBER }}>
                  <span>&nbsp;&nbsp;{l.disc.name}</span><span>−{gbp(lineDiscAmt(l))}</span>
                </div>
              )}
            </div>
          ))}
          </div>
          {current.disc && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, color: AMBER, borderTop: `1px solid ${LINE}`, marginTop: 8, paddingTop: 8 }}>
              <span>{current.disc.name} (whole order)</span><span>−{gbp(oDisc)}</span>
            </div>
          )}
          <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, color: DIM }}>Total (inc VAT)</span>
            <span className="serif" style={{ fontSize: 24, color: '#fff' }}>{gbp(total)}</span>
          </div>
          <div style={{ fontSize: 10.5, color: DIM, marginTop: 2 }}>includes VAT {gbp(total - total / 1.2)} @ 20%{sub !== total ? ` · before discounts ${gbp(sub + 0)}` : ''}</div>
          {current.voucher && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, color: GREEN, borderTop: `1px solid ${LINE}`, marginTop: 8, paddingTop: 8 }}>
              <span>🎟 Voucher {current.voucher.code}{current.voucher.name ? ` (${current.voucher.name})` : ''}</span>
              <span style={{ fontWeight: 800 }}>−{gbp(vAmt)}</span>
            </div>
          )}
        </div>

        {/* 🎟 Pay with a voucher — tournament prizes & goodwill vouchers, the
            same codes the staff portal redeems. Marked redeemed FOR REAL the
            moment PAY is hit. */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}>🎟 Voucher</div>
          {current.voucher ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13.5, color: GREEN, fontWeight: 700 }}>
                {current.voucher.code} · {gbp(current.voucher.amount_pence / 100)}{current.voucher.name ? ` · ${current.voucher.name}` : ''}
              </span>
              <button onClick={() => patch(currentId, o => ({ ...o, voucher: null }))} style={{ ...btn(), marginLeft: 'auto' }}>Remove</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input value={vCode} onChange={e => setVCode(e.target.value)} placeholder="Voucher code (e.g. ND-…)"
                style={{ flex: 1, minWidth: 160, minHeight: 46, padding: '8px 12px', borderRadius: 9, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.05)', color: CREAM, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }} />
              <button onClick={applyVoucher} disabled={!vCode.trim() || vBusy} style={{ ...bigBtn(false), padding: '10px 18px', opacity: vCode.trim() && !vBusy ? 1 : 0.45 }}>
                {vBusy ? 'Checking…' : 'APPLY'}
              </button>
              <button onClick={openVoucherBrowse} style={{ ...bigBtn(false), padding: '10px 18px' }}>📋 BROWSE</button>
            </div>
          )}
          {vErr && <div style={{ fontSize: 12.5, color: RED, fontWeight: 600 }}>{vErr}</div>}
          <div style={{ fontSize: 10.5, color: DIM }}>Works with tournament prize codes and manager goodwill vouchers. The code is redeemed for real when you hit PAY — no change given.</div>
        </div>
        {/* Split the bill — ÷2 / ÷3 / ÷4 or any number. Real version runs one
            card checkout per share (Square's Terminal API can't split one
            checkout, so the till owns the split — by design). */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}>Split the bill</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {[0, 2, 3, 4].map(n => (
              <button key={n} onClick={() => chooseSplit(n)} style={{
                padding: '10px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
                background: splitN === n ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${splitN === n ? GOLD : LINE}`, color: splitN === n ? GOLD : CREAM,
              }}>{n === 0 ? 'No split' : `÷ ${n}`}</button>
            ))}
            <button onClick={() => { const v = parseInt(prompt('Split how many ways? (2–20)') || '', 10); if (v >= 2 && v <= 20) chooseSplit(v) }} style={{
              padding: '10px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
              background: splitN > 4 ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${splitN > 4 ? GOLD : LINE}`, color: splitN > 4 ? GOLD : CREAM,
            }}>{splitN > 4 ? `÷ ${splitN}` : 'Custom…'}</button>
          </div>
          {splitN > 1 && (() => {
            const share = Math.floor((due / splitN) * 100) / 100
            const last = +(due - share * (splitN - 1)).toFixed(2)
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Array.from({ length: splitN }, (_, i) => {
                  const amt = i === splitN - 1 ? last : share
                  const paid = sharesPaid[i]
                  return (
                    <button key={i} onClick={() => setSharesPaid(p => p.map((x, j) => j === i ? !x : x))} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                      padding: '11px 13px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5,
                      background: paid ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${paid ? GREEN : LINE}`, color: paid ? GREEN : CREAM,
                    }}>
                      <span>Share {i + 1} of {splitN}</span>
                      <span style={{ fontWeight: 800 }}>{paid ? `✓ paid ${gbp(amt)}` : gbp(amt)}</span>
                    </button>
                  )
                })}
                <div style={{ fontSize: 11, color: DIM }}>Tap each share as it's paid — cash or card per share. Close unlocks when every share is in.</div>
              </div>
            )
          })()}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setScreen('ring')} style={btn()}>← Back to order</button>
          {splitN > 1 ? (
            <button onClick={pay} disabled={!sharesPaid.every(Boolean) || paying} style={{ ...bigBtn(true), flex: 1, opacity: sharesPaid.every(Boolean) && !paying ? 1 : 0.45 }}>
              {paying ? 'Redeeming voucher…' : `CLOSE — ${sharesPaid.filter(Boolean).length}/${splitN} shares paid`}
            </button>
          ) : (
            <button onClick={pay} disabled={paying} style={{ ...bigBtn(true), flex: 1, opacity: paying ? 0.6 : 1 }}>
              {paying ? 'Redeeming voucher…' : due === 0 && current.voucher ? 'PAID BY VOUCHER — close' : `PAY ${gbp(due)} — close (demo)`}
            </button>
          )}
        </div>
        <div style={{ fontSize: 10.5, color: DIM }}>Real version: this prints on the receipt printer (the "addition"), then takes cash or Square per share. Demo: it just closes the order.</div>

        {/* 📋 Browse all outstanding vouchers — pick one to apply it */}
        {vListOpen && (
          <div onClick={() => setVListOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--ink-2)', border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, width: 440, maxWidth: '94vw', maxHeight: '82vh', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: CREAM }}>🎟 Outstanding vouchers</div>
              <input value={vFilter} onChange={e => setVFilter(e.target.value)} placeholder="🔍 filter by name or code…"
                style={{ minHeight: 44, padding: '8px 12px', borderRadius: 9, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.05)', color: CREAM, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }} />
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {vList === null && <div style={{ fontSize: 13, color: DIM, padding: 8 }}>Loading…</div>}
                {vList && vList
                  .filter(v => !vFilter.trim() || `${v.name} ${v.code}`.toLowerCase().includes(vFilter.trim().toLowerCase()))
                  .map(v => (
                    <button key={v.source + v.code} onClick={() => pickVoucher(v)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 13px', borderRadius: 10, cursor: 'pointer',
                      fontFamily: 'inherit', textAlign: 'left', background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`, color: CREAM,
                    }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{v.name || '(no name)'}</span>
                        <span style={{ fontSize: 11.5, color: DIM }}> · {v.code} · {v.source === 'manager' ? 'goodwill' : v.source === 'pool' ? 'pool prize' : 'ping pong prize'}</span>
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: GREEN, whiteSpace: 'nowrap' }}>{gbp(v.amount_pence / 100)}</span>
                    </button>
                  ))}
                {vList && vList.length === 0 && <div style={{ fontSize: 13, color: DIM, padding: 8 }}>No outstanding vouchers.</div>}
              </div>
              <button onClick={() => setVListOpen(false)} style={btn()}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ═══ REGISTER — ticket + keypad LEFT · stock RIGHT (K Series layout) ═══════
  const total = orderTotal(current)
  const unsent = unsentOf(current)
  const foodUnsent = current.lines.reduce((s, l) => s + (l.food ? Math.max(0, l.qty - (l.sentQty || 0)) : 0), 0)
  const selLine = current.lines.find(l => l.key === selKey) || null

  const keypadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '⌫']
  const pressKey = (k) => {
    if (k === 'C') return setBuf('')
    if (k === '⌫') return setBuf(b => b.slice(0, -1))
    setBuf(b => (b + k).slice(0, 4))
  }

  const ticket = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 12, padding: 12, width: isMobile ? '100%' : 330, flexShrink: 0, height: isMobile ? 'auto' : '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: GOLD, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{refLabel(current)}</span>
        <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => { setMoveOrderId(currentId); setScreen('floor') }} title="Move to a table or make it a tab" style={{ ...btn(), padding: '5px 10px', fontSize: 11.5 }}>⇄ Move</button>
          <button onClick={toFloor} style={{ ...btn(), padding: '5px 10px', fontSize: 11.5 }}>⊞ Floor</button>
        </span>
      </div>

      {closed && current.lines.length === 0 && (
        <div style={{ fontSize: 12, color: GREEN }}>
          ✓ {closed.ref} paid {gbp(closed.total)}{closed.voucher ? ` · 🎟 ${closed.voucher.code} REDEEMED` : ''} — demo order, {closed.voucher ? 'voucher redemption was real' : 'nothing recorded'}.
        </div>
      )}

      {/* the ticket lines — tap a line to select it (for line discounts).
          The ONE place internal scrolling is allowed: a 40-line order must
          not push the keypad off screen. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minHeight: 46, overflowY: 'auto' }}>
        {current.lines.length === 0 && <div style={{ fontSize: 12.5, color: DIM, padding: '4px 0' }}>Tap stock buttons to ring.</div>}
        {current.lines.map(l => (
          <div key={l.key} onClick={() => setSelKey(selKey === l.key ? null : l.key)} style={{
            display: 'flex', flexDirection: 'column', gap: 1, padding: '5px 6px', borderRadius: 8, cursor: 'pointer',
            background: selKey === l.key ? 'rgba(201,168,76,0.14)' : 'transparent',
            border: `1px solid ${selKey === l.key ? GOLD : 'transparent'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
              <button onClick={(e) => { e.stopPropagation(); bump(l.key, -1) }} style={qtyBtn()}>−</button>
              <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 700, color: GOLD }}>{l.qty}</span>
              <button onClick={(e) => { e.stopPropagation(); bump(l.key, +1) }} style={qtyBtn()}>+</button>
              <span style={{ flex: 1, color: CREAM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {l.name}{(l.sentQty || 0) >= l.qty && l.qty > 0 && <span title="sent" style={{ color: GREEN }}> ✓</span>}
              </span>
              <span style={{ fontWeight: 700, color: CREAM, whiteSpace: 'nowrap' }}>{gbp(lineTotal(l))}</span>
            </div>
            {l.disc && <div style={{ fontSize: 11, color: AMBER, paddingLeft: 96 }}>{l.disc.name} −{gbp(lineDiscAmt(l))}</div>}
          </div>
        ))}
      </div>

      {/* totals */}
      {current.disc && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: AMBER }}>
          <span>{current.disc.name} (order)</span><span>−{gbp(orderDiscAmt(current))}</span>
        </div>
      )}
      <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: DIM }}>Total</span>
        <span className="serif" style={{ fontSize: 26, color: '#fff' }}>{gbp(total)}</span>
      </div>

      {/* Keypad lives behind a button (founder, 21 Aug 2026) — the primary
          view is the ticket; open the pad only when you need ×qty or a custom
          discount number. */}
      {padOpen ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, flex: 1 }}>
            {keypadKeys.map(k => (
              <button key={k} onClick={() => pressKey(k)} style={{
                padding: '13px 0', borderRadius: 8, border: `1px solid ${LINE}`, cursor: 'pointer', fontFamily: 'inherit',
                background: 'rgba(255,255,255,0.05)', color: CREAM, fontSize: 16, fontWeight: 600,
              }}>{k}</button>
            ))}
          </div>
          <div style={{ width: 96, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {/* The multiplier readout: type 3, tap a drink → 3 × that drink. */}
            <div style={{ flex: 1, borderRadius: 8, border: `1px solid ${buf ? GOLD : LINE}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: 'rgba(255,255,255,0.03)', padding: '6px 4px', textAlign: 'center' }}>
              <span style={{ fontSize: 9.5, letterSpacing: '0.14em', color: DIM }}>QUANTITY</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: buf ? GOLD : DIM }}>{buf ? `×${buf}` : '×1'}</span>
              <span style={{ fontSize: 9, color: DIM, lineHeight: 1.3 }}>type a number,<br />then tap a drink</span>
            </div>
            <button onClick={() => setPadOpen(false)} style={{ ...btn(), padding: '8px 0', textAlign: 'center', fontSize: 12 }}>▾ hide</button>
            <button onClick={() => setDiscOpen(true)} disabled={current.lines.length === 0} style={{
              padding: '10px 0', borderRadius: 8, border: `1.5px solid ${AMBER}`, cursor: 'pointer', fontFamily: 'inherit',
              background: 'rgba(245,158,11,0.1)', color: AMBER, fontSize: 12.5, fontWeight: 800, opacity: current.lines.length ? 1 : 0.45,
            }}>DISC</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPadOpen(true)} style={{
            flex: 1, padding: '12px 0', borderRadius: 8, border: `1px solid ${buf ? GOLD : LINE}`, cursor: 'pointer',
            fontFamily: 'inherit', background: 'rgba(255,255,255,0.05)', color: buf ? GOLD : CREAM, fontSize: 13.5, fontWeight: 700,
          }}>🔢 Keypad{buf ? ` · ×${buf}` : ''}</button>
          <button onClick={() => setDiscOpen(true)} disabled={current.lines.length === 0} style={{
            flex: 1, padding: '12px 0', borderRadius: 8, border: `1.5px solid ${AMBER}`, cursor: 'pointer', fontFamily: 'inherit',
            background: 'rgba(245,158,11,0.1)', color: AMBER, fontSize: 13, fontWeight: 800, opacity: current.lines.length ? 1 : 0.45,
          }}>DISC</button>
        </div>
      )}

      {/* function row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={send} disabled={unsent === 0} style={{ ...bigBtn(false), flex: 1, opacity: unsent ? 1 : 0.45, padding: '12px 8px' }}>
          SEND{unsent > 0 ? ` (${unsent})` : ''}
        </button>
        <button onClick={() => { chooseSplit(0); setScreen('bill') }} disabled={current.lines.length === 0} style={{ ...bigBtn(true), flex: 1.3, opacity: current.lines.length ? 1 : 0.45, padding: '12px 8px' }}>
          ADDITION
        </button>
      </div>
      {foodUnsent > 0 && <div style={{ fontSize: 11, color: AMBER }}>SEND will fire {foodUnsent} food item{foodUnsent > 1 ? 's' : ''} to the kitchen printer (real version).</div>}
      <div style={{ fontSize: 10.5, color: DIM, lineHeight: 1.5 }}>Demo — nothing is recorded. Lightspeed is still the till of record.</div>
    </div>
  )

  const discPanel = discOpen && (
    <div onClick={() => setDiscOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--ink-2)', border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, width: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: CREAM }}>Discount</div>
        <div style={{ fontSize: 12, color: selLine ? GOLD : DIM }}>
          {selLine ? <>On the selected line: <b>{selLine.qty} × {selLine.name}</b></> : <>On the <b>whole order</b> — tap a ticket line first to discount just that line.</>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
          {[10, 20, 50].map(v => (
            <button key={v} onClick={() => applyDisc({ kind: 'pct', value: v, name: `${v}% off` })} style={discBtn()}>{v}% off</button>
          ))}
          <button onClick={() => applyDisc({ kind: 'pct', value: 100, name: 'Comp' })} style={discBtn()}>Comp (100%)</button>
          <button onClick={() => { const v = parseFloat(buf); if (v > 0 && v <= 100) applyDisc({ kind: 'pct', value: v, name: `${v}% off` }) }} disabled={!buf} style={{ ...discBtn(), opacity: buf ? 1 : 0.4 }}>
            {buf ? `${buf}% off` : 'Custom % (keypad)'}
          </button>
          <button onClick={() => { const v = parseFloat(buf); if (v > 0) applyDisc({ kind: 'amt', value: v, name: `£${v} off` }) }} disabled={!buf} style={{ ...discBtn(), opacity: buf ? 1 : 0.4 }}>
            {buf ? `£${buf} off` : 'Custom £ (keypad)'}
          </button>
        </div>
        {(selLine ? selLine.disc : current.disc) && (
          <button onClick={() => applyDisc(null)} style={{ ...discBtn(), borderColor: RED, color: RED, background: 'rgba(218,27,51,0.08)' }}>
            Remove {selLine ? 'this line\'s' : 'the order'} discount
          </button>
        )}
        <button onClick={() => setDiscOpen(false)} style={btn()}>Cancel</button>
        <div style={{ fontSize: 10.5, color: DIM }}>Real version: every discount and comp lands in the audit trail with who and why.</div>
      </div>
    </div>
  )

  // Middle column — the categories, between the calculator and the products
  // (founder, 20 Aug 2026), with clear rules either side so the register reads
  // as three sections: TICKET | CATEGORIES | STOCK.
  //
  // The eight spirits pages live behind ONE "Spirits" tile that opens as a
  // folder — a fresh list with a back tile, not a drop-down (founder, 20 Aug).
  const SPIRITS_PREFIX = 'Spirits — '
  const spiritsPages = pages.filter(pg => pg.name.startsWith(SPIRITS_PREFIX))
  // Tiles FLEX to share the column exactly — the category list must fill the
  // iPad screen with zero scrolling, whatever the orientation.
  const catTile = (key, label, c, active, onClick) => (
    <button key={key} onClick={onClick} style={{
      flex: '1 1 0', minHeight: 34, padding: '4px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
      fontSize: 13, textAlign: 'left', lineHeight: 1.15, display: 'flex', alignItems: 'center',
      background: active ? tint(c, '3D') : tint(c, '14'),
      border: `2px solid ${active ? c : tint(c, '73')}`,
      color: active ? c : CREAM, fontWeight: active ? 800 : 600,
    }}>{label}</button>
  )

  let catTiles
  if (folder === 'Spirits') {
    const violet = pageColor('Spirits — Gin')
    catTiles = [
      catTile('back', '← All categories', '#9CA3AF', false, () => setFolder(null)),
      ...spiritsPages.map(pg =>
        catTile(pg.name, pg.name.slice(SPIRITS_PREFIX.length), violet, !query && pg.name === pageName,
          () => { setQuery(''); setPageName(pg.name) })),
    ]
  } else {
    catTiles = []
    let spiritsInserted = false
    for (const pg of pages) {
      if (pg.hidden) continue          // sub-folders (Cocktails — Classics) have no column tile
      if (pg.name.startsWith(SPIRITS_PREFIX)) {
        if (!spiritsInserted) {
          spiritsInserted = true
          const violet = pageColor(pg.name)
          const active = !query && pageName.startsWith(SPIRITS_PREFIX)
          catTiles.push(catTile('spirits-folder', 'Spirits 🥃', violet, active, () => {
            setFolder('Spirits'); setQuery('')
            if (!pageName.startsWith(SPIRITS_PREFIX)) setPageName(spiritsPages[0]?.name)
          }))
        }
        continue
      }
      catTiles.push(catTile(pg.name, pg.name, pageColor(pg.name), !query && pg.name === pageName,
        () => { setFolder(null); setQuery(''); setPageName(pg.name) }))
    }
  }

  const catColumn = (
    <div style={{
      width: isMobile ? '100%' : 200, flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: 6,
      ...(isMobile
        ? { borderTop: `2px solid rgba(255,255,255,0.18)`, borderBottom: `2px solid rgba(255,255,255,0.18)`, padding: '12px 0' }
        : { borderLeft: `2px solid rgba(255,255,255,0.18)`, borderRight: `2px solid rgba(255,255,255,0.18)`, padding: '0 12px', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }),
    }}>
      <input
        value={query} onChange={e => setQuery(e.target.value)} placeholder="🔍 Find anything…"
        style={{ minHeight: 58, padding: '8px 14px', borderRadius: 12, border: `2px solid ${query ? GOLD : 'rgba(255,255,255,0.25)'}`, background: 'rgba(255,255,255,0.07)', color: CREAM, fontFamily: 'inherit', fontSize: 16, fontWeight: 600, width: '100%', boxSizing: 'border-box', flexShrink: 0 }}
      />
      {catTiles}
    </div>
  )

  const stock = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, height: isMobile ? 'auto' : '100%', overflow: 'hidden' }}>
      {pageName === HH_PAGE && !hhOpen && !query && (
        <div style={{ background: 'rgba(218,27,51,0.12)', border: '1px solid rgba(218,27,51,0.45)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: CREAM, fontWeight: 600 }}>
          ⏰ Happy hour is OFF — these buttons can't be used right now. Monday all day till 11pm · Tue–Fri till 19:10.
        </div>
      )}
      <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 140 : 148}px, 1fr))`, gridAutoRows: 76, gap: 8, alignContent: 'start', flex: 1, overflow: 'hidden' }}>
        {/* Spirits pages: ONE tile per spirit — tap = single, "+ Double" on the
            tile, long-press = product info (founder, 20 Aug 2026). */}
        {spiritsView
          ? gridSlice.map(p => {
              if (p.navMore || p.navBack) return (
                <button key={p.sku} onClick={() => setOverflowView(!!p.navMore)} style={folderTile(pageColor(pageName))}>{p.name}</button>
              )
              return (
                <SpiritTile key={p.sku} p={p} color={pageColor(pageName)}
                  onAdd={(serve) => add({ product: p, serve, page: pageName })}
                  onInfo={() => setInfoFor(p)} />
              )
            })
          : gridSlice.map(b => {
              if (b.navMore || b.navBack) return (
                <button key={b.sku} onClick={() => setOverflowView(!!b.navMore)} style={folderTile(pageColor(pageName))}>{b.name}</button>
              )
              const c = pageColor(b.page)
              if (b.nav) return (
                <button key={b.product.sku} onClick={() => setPageName(b.nav)} style={{
                  minHeight: 62, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  background: 'transparent', border: `2px dashed ${tint(c, '99')}`, color: c, fontFamily: 'inherit',
                  fontSize: 14, fontWeight: 800,
                }}>{b.name}</button>
              )
              const dead = b.page === HH_PAGE && !hhOpen
              return (
                <button key={`${b.product.sku}·${b.serve.label}·${b.page}`} onClick={() => add(b)} disabled={dead} style={{
                  minHeight: 62, padding: '8px 10px', borderRadius: 10, cursor: dead ? 'not-allowed' : 'pointer', textAlign: 'left',
                  background: tint(c, '14'), border: `1px solid ${tint(c, '73')}`, borderLeft: `4px solid ${c}`,
                  color: CREAM, fontFamily: 'inherit', opacity: dead ? 0.35 : 1,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 4,
                }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25 }}>
                    {b.product.name}{b.serve.label && b.serve.label !== 'Each' && b.serve.label !== 'HH' ? <span style={{ color: DIM, fontWeight: 400 }}> · {b.serve.label}</span> : null}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: c }}>{gbp(b.serve.price)}</span>
                </button>
              )
            })}
        {query && buttons.length === 0 && <div style={{ fontSize: 13, color: DIM, padding: 12 }}>Nothing matches "{query}".</div>}
      </div>
      {gridPages > 1 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <button onClick={() => setGridPage(p => Math.max(0, p - 1))} disabled={gridPage === 0}
            style={{ ...bigBtn(false), padding: '10px 26px', opacity: gridPage === 0 ? 0.35 : 1 }}>◀</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: CREAM, minWidth: 54, textAlign: 'center' }}>{gridPage + 1} / {gridPages}</span>
          <button onClick={() => setGridPage(p => Math.min(gridPages - 1, p + 1))} disabled={gridPage >= gridPages - 1}
            style={{ ...bigBtn(false), padding: '10px 26px', opacity: gridPage >= gridPages - 1 ? 0.35 : 1 }}>▶</button>
        </div>
      )}
    </div>
  )

  const mixerPanel = mixerFor && (() => {
    const { b, qty, base, mixerAdd } = mixerFor
    const start = base != null ? base : b.serve.price
    const addOn = mixerAdd != null ? mixerAdd : MIXER_PRICE
    const deal = base == null && b.serve.label === 'Double' && isDoubleDealSpirit(b.product)
    const label = b.serve.label && b.serve.label !== 'Each' ? ` — ${b.serve.label}` : ''
    return (
      <div onClick={() => setMixerFor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'var(--ink-2)', border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, width: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: CREAM }}>
            {qty > 1 ? `${qty} × ` : ''}{b.product.name}{label} <span style={{ color: DIM, fontWeight: 400 }}>· add a mixer?</span>
          </div>
          {deal && (
            <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, background: 'rgba(201,168,76,0.1)', border: `1px solid ${GOLD}`, borderRadius: 9, padding: '8px 11px' }}>
              ⭐ Double Deal — double + any dash £10.00
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
            {MIXERS.map(m => (
              <button key={m} onClick={() => addSpirit(m)} style={{
                minHeight: 56, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 14, fontWeight: 700, textAlign: 'left',
                background: 'rgba(34,211,238,0.08)', border: '1.5px solid rgba(34,211,238,0.5)', color: CREAM,
              }}>
                {m}<div style={{ fontSize: 12, fontWeight: 800, color: deal ? GOLD : '#22D3EE', marginTop: 3 }}>
                  {deal ? `£10.00 all in` : addOn === 0 ? `included → ${gbp(start)}` : `+ ${gbp(addOn)} → ${gbp(start + addOn)}`}
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => addSpirit(null)} style={{ ...bigBtn(true), width: '100%' }}>
            NO MIXER — {gbp(start)}
          </button>
          <button onClick={() => setMixerFor(null)} style={btn()}>Cancel</button>
        </div>
      </div>
    )
  })()

  const infoPanel = infoFor && (
    <div onClick={() => setInfoFor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--ink-2)', border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, width: 340, display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: CREAM }}>{infoFor.name}</div>
        <div style={{ fontSize: 12, color: DIM }}>{infoFor.page}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: `1px solid ${LINE}`, paddingTop: 9 }}>
          {infoFor.serves.map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span style={{ color: CREAM }}>{s.label === 'Each' ? 'Serve' : s.label}{s.ml ? <span style={{ color: DIM }}> · {s.ml}ml</span> : null}</span>
              <span style={{ fontWeight: 700, color: GOLD }}>{s.price != null ? gbp(s.price) : 'no price'}</span>
            </div>
          ))}
          {isDoubleDealSpirit(infoFor) && <div style={{ fontSize: 12, color: GOLD }}>⭐ Double Deal — double + any dash £10.00</div>}
        </div>
        <div style={{ fontSize: 12, color: DIM, borderTop: `1px solid ${LINE}`, paddingTop: 9 }}>
          {infoFor.stock ? <>Stock: <b style={{ color: CREAM }}>{infoFor.stock}</b></> : infoFor.recipe ? <>Recipe: <b style={{ color: CREAM }}>{infoFor.recipe}</b></> : 'No stock record yet'}
          {infoFor.units2025 ? <> · {infoFor.units2025.toLocaleString('en-GB')} sold in 2025</> : null}
        </div>
        <button onClick={() => setInfoFor(null)} style={btn()}>Close</button>
      </div>
    </div>
  )

  const dealPanel = dealFor && (() => {
    const { b, qty, cfg, picks } = dealFor
    const done = picks.length >= cfg.picks
    return (
      <div onClick={() => setDealFor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'var(--ink-2)', border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, width: 460, maxWidth: '94vw', maxHeight: '84vh', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: CREAM }}>
            {qty > 1 ? `${qty} × ` : ''}{b.product.name} · {gbp(b.serve.price)}
          </div>
          <div style={{ fontSize: 13, color: picks.length < cfg.picks ? GOLD : GREEN, fontWeight: 700 }}>
            {cfg.title} — {picks.length}/{cfg.picks} picked
          </div>
          {picks.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {picks.map((name, i) => (
                <button key={i} onClick={() => setDealFor(d => ({ ...d, picks: d.picks.filter((_, j) => j !== i) }))} style={{
                  padding: '8px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
                  background: 'rgba(52,211,153,0.12)', border: `1.5px solid ${GREEN}`, color: GREEN,
                }}>✓ {name} ✕</button>
              ))}
            </div>
          )}
          <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, paddingRight: 2 }}>
            {cfg.opts.map(name => (
              <button key={name} disabled={done} onClick={() => setDealFor(d => ({ ...d, picks: [...d.picks, name] }))} style={{
                minHeight: 46, padding: '8px 10px', borderRadius: 9, cursor: done ? 'default' : 'pointer', fontFamily: 'inherit',
                fontSize: 12.5, fontWeight: 600, textAlign: 'left', opacity: done ? 0.4 : 1,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`, color: CREAM,
              }}>{name}</button>
            ))}
          </div>
          <button onClick={addDeal} disabled={!done} style={{ ...bigBtn(true), width: '100%', opacity: done ? 1 : 0.45 }}>
            ADD DEAL — {gbp(b.serve.price)}
          </button>
          <button onClick={() => setDealFor(null)} style={btn()}>Cancel</button>
        </div>
      </div>
    )
  })()

  return (
    // Locked to the screen — the page never scrolls on the iPad; big pages
    // flip inside the grid instead.
    <div ref={frameRef} style={{
      display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch',
      ...(isMobile ? {} : { height: frameH ? `${frameH}px` : 'calc(100dvh - 260px)', minHeight: 430, overflow: 'hidden' }),
    }}>
      {ticket}
      {catColumn}
      {stock}
      {discPanel}
      {mixerPanel}
      {infoPanel}
      {dealPanel}
    </div>
  )
}

// One tile per spirit: tap = single, "+ Double" corner button, long-press
// (~half a second) = product info. Suppresses the tap that ends a long-press.
function SpiritTile({ p, color, onAdd, onInfo }) {
  const timer = React.useRef(null)
  const fired = React.useRef(false)
  const single = p.serves.find(s => s.label === 'Single') || p.serves[0]
  const double = p.serves.find(s => s.label === 'Double' && s !== single)
  const down = () => { fired.current = false; timer.current = setTimeout(() => { fired.current = true; onInfo() }, 500) }
  const up = () => clearTimeout(timer.current)
  return (
    <div
      onPointerDown={down} onPointerUp={up} onPointerLeave={up}
      onContextMenu={e => e.preventDefault()}
      onClick={() => { if (!fired.current) onAdd(single) }}
      style={{
        minHeight: 76, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
        background: `${color}14`, border: `1px solid ${color}73`, borderLeft: `4px solid ${color}`,
        color: 'var(--cream)', fontFamily: 'inherit', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 5,
      }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25 }}>{p.name}</span>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color }}>{single?.price != null ? gbp(single.price) : '—'}</span>
        {double && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onAdd(double) }}
            style={{
              padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 11.5, fontWeight: 800, background: `${color}2E`, border: `1.5px solid ${color}`, color,
              whiteSpace: 'nowrap',
            }}>
            + Double {gbp(double.price)}
          </button>
        )}
      </span>
    </div>
  )
}

const btn = () => ({
  padding: '8px 12px', borderRadius: 8, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.05)',
  color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5,
})
const bigBtn = (primary) => ({
  padding: '13px 18px', borderRadius: 10, border: primary ? 'none' : `1.5px solid ${GOLD}`,
  background: primary ? GOLD : 'rgba(201,168,76,0.1)', color: primary ? '#141414' : GOLD,
  cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, letterSpacing: '0.02em',
})
const qtyBtn = () => ({
  width: 34, height: 34, borderRadius: 8, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,0.06)',
  color: CREAM, cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, lineHeight: 1, flexShrink: 0,
})
const folderTile = (c) => ({
  minHeight: 62, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
  background: 'transparent', border: `2px dashed ${c}99`, color: c, fontFamily: 'inherit',
  fontSize: 14, fontWeight: 800,
})
const discBtn = () => ({
  padding: '11px 8px', borderRadius: 9, border: `1.5px solid ${AMBER}`, background: 'rgba(245,158,11,0.08)',
  color: AMBER, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
})
