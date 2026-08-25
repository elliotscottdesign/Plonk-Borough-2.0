import React, { useEffect, useMemo, useState } from 'react'
import { PAGES, HH_PAGE } from './data/happyHour.js'
import liveTill from './data/liveTill.json'
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

const FLOOR = [
  { zone: 'Booths', spots: ['Booth 1', 'Booth 2', 'Booth 3', 'Booth 4'] },
  { zone: 'Tables', spots: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'] },
  { zone: 'Bar', spots: ['Bar 1', 'Bar 2'] },
]

const STORE = 'nd_till_demo_orders_v1'
const loadOrders = () => {
  try { return JSON.parse(localStorage.getItem(STORE)) || {} } catch { return {} }
}
let nextId = Date.now()
const newOrder = (kind, ref) => ({
  id: 'o' + (nextId++), kind, ref, lines: [], disc: null, openedAt: new Date().toISOString(), status: 'open',
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
  const [buf, setBuf] = useState('')                     // keypad buffer
  const [discOpen, setDiscOpen] = useState(false)
  const [splitN, setSplitN] = useState(0)                // 0 = no split
  const [sharesPaid, setSharesPaid] = useState([])       // one bool per share
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

  const open = Object.values(orders).filter(o => o.status === 'open')
  const orderFor = (kind, ref) => open.find(o => o.kind === kind && o.ref === ref)
  const current = currentId ? orders[currentId] : null
  const unsentOf = (o) => o.lines.reduce((s, l) => s + Math.max(0, l.qty - (l.sentQty || 0)), 0)
  const refLabel = (o) => o.kind === 'table' ? o.ref : o.kind === 'tab' ? `Tab · ${o.ref}` : 'Quick sale'

  const start = (kind, ref) => {
    const existing = orderFor(kind, ref)
    if (existing) { setCurrentId(existing.id); setScreen('ring'); return }
    const o = newOrder(kind, ref)
    setOrders(prev => ({ ...prev, [o.id]: o }))
    setCurrentId(o.id); setScreen('ring')
  }
  const patch = (id, fn) => setOrders(prev => ({ ...prev, [id]: fn(prev[id]) }))
  const resetRingUi = () => { setSelKey(null); setBuf(''); setDiscOpen(false); setSplitN(0); setSharesPaid([]) }
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
  const pay = () => {
    const o = orders[currentId]
    setClosed({ ref: refLabel(o), total: orderTotal(o) })
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

  // ═══ FLOOR ════════════════════════════════════════════════════════════════
  if (screen === 'floor') {
    const tabs = open.filter(o => o.kind === 'tab')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {closed && (
          <div style={{ fontSize: 13, color: GREEN, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, padding: '10px 14px' }}>
            ✓ {closed.ref} paid {gbp(closed.total)} — demo only, nothing recorded. Ring it on Lightspeed for real.
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => start('quick', null)} style={bigBtn(true)}>⚡ Quick sale</button>
          <button onClick={() => { const name = prompt('Name for the tab? (e.g. "Sarah — blue jacket")'); if (name?.trim()) start('tab', name.trim()) }} style={bigBtn(false)}>➕ Open a tab</button>
        </div>
        {FLOOR.map(z => (
          <div key={z.zone}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: DIM, marginBottom: 8 }}>{z.zone}</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 100 : 120}px, 1fr))`, gap: 8 }}>
              {z.spots.map(ref => {
                const o = orderFor('table', ref)
                return (
                  <button key={ref} onClick={() => start('table', ref)} style={{
                    minHeight: 74, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: '10px 12px',
                    background: o ? 'rgba(201,168,76,0.13)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${o ? GOLD : LINE}`, color: CREAM,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 4,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: o ? GOLD : CREAM }}>{ref}</span>
                    {o
                      ? <span style={{ fontSize: 12 }}>{o.lines.reduce((s, l) => s + l.qty, 0)} items · <b>{gbp(orderTotal(o))}</b>{unsentOf(o) > 0 && <span style={{ color: AMBER }}> · unsent</span>}</span>
                      : <span style={{ fontSize: 11.5, color: DIM }}>free</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: DIM, marginBottom: 8 }}>Open tabs</div>
          {tabs.length === 0 && <div style={{ fontSize: 12.5, color: DIM }}>No tabs open.</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tabs.map(o => (
              <button key={o.id} onClick={() => { setCurrentId(o.id); setScreen('ring') }} style={{
                borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', padding: '10px 16px',
                background: 'rgba(201,168,76,0.13)', border: `1.5px solid ${GOLD}`, color: CREAM, fontSize: 13,
              }}>
                🍺 <b>{o.ref}</b> · {gbp(orderTotal(o))}
              </button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: DIM, lineHeight: 1.5 }}>
          Demo till — orders live only in this browser; no sale is recorded anywhere. Lightspeed is still the till of
          record. Table names are placeholders until the venue's real floor plan goes in.
        </div>
      </div>
    )
  }

  if (!current) { setScreen('floor'); return null }

  // ═══ ADDITION (the bill) ══════════════════════════════════════════════════
  if (screen === 'bill') {
    const sub = orderSub(current), oDisc = orderDiscAmt(current), total = orderTotal(current)
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
            const share = Math.floor((total / splitN) * 100) / 100
            const last = +(total - share * (splitN - 1)).toFixed(2)
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
            <button onClick={pay} disabled={!sharesPaid.every(Boolean)} style={{ ...bigBtn(true), flex: 1, opacity: sharesPaid.every(Boolean) ? 1 : 0.45 }}>
              CLOSE — {sharesPaid.filter(Boolean).length}/{splitN} shares paid
            </button>
          ) : (
            <button onClick={pay} style={{ ...bigBtn(true), flex: 1 }}>PAY {gbp(total)} — close (demo)</button>
          )}
        </div>
        <div style={{ fontSize: 10.5, color: DIM }}>Real version: this prints on the receipt printer (the "addition"), then takes cash or Square per share. Demo: it just closes the order.</div>
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
        <span style={{ fontSize: 13.5, fontWeight: 800, color: GOLD }}>{refLabel(current)}</span>
        <button onClick={toFloor} style={{ ...btn(), padding: '5px 10px', fontSize: 11.5 }}>⊞ Floor</button>
      </div>

      {closed && current.lines.length === 0 && (
        <div style={{ fontSize: 12, color: GREEN }}>✓ {closed.ref} paid {gbp(closed.total)} — demo, nothing recorded.</div>
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

      {/* keypad — type a number, tap a product: 3 → Corona = 3 × Corona */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, flex: 1 }}>
          {keypadKeys.map(k => (
            <button key={k} onClick={() => pressKey(k)} style={{
              padding: '13px 0', borderRadius: 8, border: `1px solid ${LINE}`, cursor: 'pointer', fontFamily: 'inherit',
              background: 'rgba(255,255,255,0.05)', color: CREAM, fontSize: 16, fontWeight: 600,
            }}>{k}</button>
          ))}
        </div>
        <div style={{ width: 86, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ flex: 1, borderRadius: 8, border: `1px solid ${buf ? GOLD : LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: buf ? GOLD : DIM, background: 'rgba(255,255,255,0.03)' }}>
            {buf ? `×${buf}` : '×1'}
          </div>
          <button onClick={() => setDiscOpen(true)} disabled={current.lines.length === 0} style={{
            padding: '10px 0', borderRadius: 8, border: `1.5px solid ${AMBER}`, cursor: 'pointer', fontFamily: 'inherit',
            background: 'rgba(245,158,11,0.1)', color: AMBER, fontSize: 12.5, fontWeight: 800, opacity: current.lines.length ? 1 : 0.45,
          }}>DISC</button>
        </div>
      </div>

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
