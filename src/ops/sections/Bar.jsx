import React, { useState, useEffect, useMemo } from 'react'
import { barCatalogue, barSummary, barOpenStocktake, barSaveCount, barSubmitSheet, barDraftOrders } from '../barApi.js'

// ─── BAR — one sheet ─────────────────────────────────────────────────────────
// Replaces eleven sibling tabs (Stock Orders, Stock List, Stock Check,
// Perishables, Consumables, Suppliers, Costing, Cocktail Specs, Till, CRM,
// Daily Team Help) with a single page: targeted answers at the top, drop-downs
// to the detail underneath.
//
// Founder: "merge into one clever useful set of information with drop downs to
// detailed lists and arrays… All stock reports perishables stock sheets should
// come from one sheet called BAR."
//
// Everything here reads the bar_* tables through the `bar` edge function. The
// old static sheets are still reachable at the bottom, collapsed, while the new
// system builds up its first weeks of counts — they're being retired, not kept.

const GOLD = 'var(--gold)', CREAM = 'var(--cream)', DIM = 'rgba(255,255,255,0.55)'
const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33', LINE = 'rgba(255,255,255,0.12)'
const AREAS = ['Cellar', 'Back bar', 'Fridge', 'Store']

const gbp = (n) => '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const gbp0 = (n) => '£' + Math.round(Number(n || 0)).toLocaleString('en-GB')
const fmtDate = (d) => d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : '—'
const daysSince = (d) => d ? Math.floor((Date.now() - new Date(d + 'T00:00:00Z')) / 86400000) : null
const todayISO = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}` }

export default function Bar() {
  const [cat, setCat] = useState(null)
  const [sum, setSum] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)          // which drop-down is expanded

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const [c, s] = await Promise.all([barCatalogue(), barSummary()])
      setCat(c); setSum(s)
    } catch (e) { setErr(e.message || 'Could not reach the bar service.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const products = cat?.products || []
  const since = daysSince(sum?.lastCount?.taken_on)
  const countDue = since == null || since >= 7
  const toggle = (k) => setOpen(open === k ? null : k)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 24, color: '#fff' }}>🍺 Bar</div>
          <div style={{ fontSize: 12, color: DIM, marginTop: 2 }}>
            Stock, cost, margin and ordering — one sheet.
          </div>
        </div>
        <button onClick={load} disabled={loading} style={btn()}>↻ Refresh</button>
      </div>

      {err && <Note tone="bad">{err}</Note>}
      {loading && !cat && <div style={{ fontSize: 13, color: DIM, padding: '28px 0', textAlign: 'center' }}>Loading…</div>}

      {cat && <>
        {/* ── The answers ─────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          <Stat label="Last count" value={sum?.lastCount ? fmtDate(sum.lastCount.taken_on) : 'Never'}
                sub={since == null ? 'no stocktake yet' : since === 0 ? 'today' : `${since} day${since === 1 ? '' : 's'} ago`}
                tone={countDue ? 'warn' : 'good'} />
          <Stat label="Below par" value={sum?.short?.length ?? 0}
                sub={sum?.short?.length ? 'lines to order' : 'nothing short'}
                tone={sum?.short?.length ? 'warn' : 'good'} />
          <Stat label="Products" value={products.length} sub={`${cat.suppliers?.length || 0} suppliers`} />
          {sum?.admin && (
            <Stat label="Stock value" value={sum.value?.total ? gbp0(sum.value.total) : '—'}
                  sub={sum.value?.uncosted ? `${sum.value.uncosted} not costed` : 'at last paid price'} />
          )}
        </div>

        {/* First-run guidance — the honest state of things, not a fake dashboard */}
        {sum?.countsEver === 0 && (
          <Note tone="info">
            <b>Nothing has been counted yet.</b> The catalogue is loaded — {products.length} lines
            across {cat.suppliers?.length || 0} suppliers — but usage, variance and margin need
            stocktakes to work from. Do the first count below; the second one is when the numbers
            start talking (usage is the gap between two counts).
          </Note>
        )}
        {sum?.countsEver === 1 && (
          <Note tone="info">
            One count in. <b>After the next one</b> this page can show what you actually used,
            what you should have used, and the difference.
          </Note>
        )}

        {/* ── Drop-downs ──────────────────────────────────────────────────── */}
        <Drawer k="count" open={open} onToggle={toggle} icon="📋"
                title="Count the stock"
                hint={countDue ? 'due now' : `counted ${since}d ago`} tone={countDue ? 'warn' : null}>
          <CountSheet products={products} onDone={load} />
        </Drawer>

        <Drawer k="order" open={open} onToggle={toggle} icon="🛒"
                title="What to order"
                hint={sum?.short?.length ? `${sum.short.length} below par` : 'nothing short'}>
          <OrderDraft suppliers={cat.suppliers || []} />
        </Drawer>

        {sum?.admin && (
          <Drawer k="usage" open={open} onToggle={toggle} icon="📉"
                  title="What we're using" hint={sum.countsEver < 2 ? 'needs 2 counts' : 'last period'}>
            <Usage usage={sum.usage} variance={sum.variance} countsEver={sum.countsEver} />
          </Drawer>
        )}

        {sum?.admin && (
          <Drawer k="margin" open={open} onToggle={toggle} icon="💷"
                  title="Margins" hint={sum.margins?.length ? `${sum.margins.length} menu items` : 'no recipes yet'}>
            <Margins margins={sum.margins} />
          </Drawer>
        )}

        <Drawer k="list" open={open} onToggle={toggle} icon="📦"
                title="The full list" hint={`${products.length} lines`}>
          <ProductList products={products} />
        </Drawer>
      </>}
    </div>
  )
}

// ─── The count sheet ─────────────────────────────────────────────────────────
function CountSheet({ products, onDone }) {
  const [area, setArea] = useState(AREAS[0])
  const [sheet, setSheet] = useState(null)
  const [vals, setVals] = useState({})
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const openSheet = async (a) => {
    setBusy(true); setMsg('')
    try {
      const r = await barOpenStocktake(todayISO(), a)
      setSheet(r.sheet)
      const v = {}; for (const l of r.lines || []) v[l.product_id] = String(l.qty)
      setVals(v)
    } catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }
  useEffect(() => { openSheet(area) }, [area])

  const mine = useMemo(
    () => products.filter(p => p.counted && (p.count_area === area || (!p.count_area && area === 'Back bar'))),
    [products, area])

  const save = async (p, qty) => {
    setVals(v => ({ ...v, [p.id]: qty }))
    if (!sheet || qty === '') return
    try { await barSaveCount(sheet.id, p.id, Number(qty)) }
    catch (e) { setMsg(e.message) }
  }
  const submit = async () => {
    if (!sheet) return
    if (!window.confirm(`Submit the ${area} sheet?\n\nOnce every area is in, the stocktake closes and usage is worked out from it.`)) return
    setBusy(true)
    try { const r = await barSubmitSheet(sheet.id); setMsg(r.stocktakeSubmitted ? '✓ Stocktake complete.' : '✓ Area submitted.'); await onDone?.() }
    catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }

  const done = mine.filter(p => vals[p.id] !== undefined && vals[p.id] !== '').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {AREAS.map(a => (
          <button key={a} onClick={() => setArea(a)} style={pill(a === area)}>{a}</button>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: DIM }}>
        {done} of {mine.length} counted · type what you <b>have</b>, it saves as you go
      </div>
      {msg && <Note tone={msg.startsWith('✓') ? 'good' : 'bad'}>{msg}</Note>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {mine.length === 0 && <div style={{ fontSize: 12.5, color: DIM, padding: '14px 0' }}>Nothing filed under {area} yet.</div>}
        {mine.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: CREAM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ fontSize: 10.5, color: DIM }}>{p.category} · counted in {p.count_unit}</div>
            </div>
            <input inputMode="decimal" value={vals[p.id] ?? ''} placeholder="—"
                   onChange={e => save(p, e.target.value.replace(/[^0-9.]/g, ''))}
                   style={{ width: 68, padding: '8px 8px', textAlign: 'center', fontSize: 15, fontWeight: 700,
                            background: 'rgba(0,0,0,0.35)', color: '#fff', border: `1px solid ${LINE}`, borderRadius: 7 }} />
          </div>
        ))}
      </div>

      <button onClick={submit} disabled={busy || !sheet} style={{ ...btn(), background: GREEN, color: '#04220f', border: 'none', fontWeight: 800, padding: '12px 16px' }}>
        Submit {area}
      </button>
    </div>
  )
}

// ─── Order draft ─────────────────────────────────────────────────────────────
function OrderDraft({ suppliers }) {
  const [orders, setOrders] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { barDraftOrders().then(r => setOrders(r.orders || [])).catch(e => setErr(e.message)) }, [])
  const nameOf = (id) => suppliers.find(s => s.id === id)?.name || 'Unassigned supplier'

  if (err) return <Note tone="bad">{err}</Note>
  if (!orders) return <div style={{ fontSize: 12.5, color: DIM }}>Working it out…</div>
  if (orders.length === 0) return (
    <Note tone="info">Nothing is below par — but that needs a stocktake and a par set against each line.
      Pars come from the count sheet once you've set them.</Note>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {orders.map((o, i) => (
        <div key={i} style={{ border: `1px solid ${LINE}`, borderRadius: 9, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
            <b style={{ fontSize: 13.5, color: CREAM }}>{nameOf(o.supplier_id)}</b>
            {o.est > 0 && <span style={{ fontSize: 12.5, color: GOLD }}>≈ {gbp(o.est)}</span>}
          </div>
          {o.lines.map(l => (
            <div key={l.product_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '3px 0', color: 'rgba(255,255,255,0.8)' }}>
              <span>{l.name}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{l.packs ?? '?'} × {l.order_unit}{l.est_cost != null ? ` · ${gbp(l.est_cost)}` : ''}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Usage & variance ────────────────────────────────────────────────────────
function Usage({ usage, variance, countsEver }) {
  if (countsEver < 2) return (
    <Note tone="info">
      Usage is the gap between two stocktakes, so it needs a second count before it can say anything.
      Nothing to show yet — this isn't an error.
    </Note>
  )
  const rows = (usage || []).filter(u => u.complete && u.used_base > 0)
    .sort((a, b) => b.used_base - a.used_base).slice(0, 40)
  const vr = Object.fromEntries((variance || []).map(v => [v.product_id, v]))
  if (!rows.length) return <Note tone="info">Two counts are in, but nothing moved between them.</Note>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ fontSize: 11, color: DIM, marginBottom: 4 }}>
        {fmtDate(rows[0].period_from)} → {fmtDate(rows[0].period_to)}
      </div>
      {rows.map(u => {
        const v = vr[u.product_id]
        const off = v && v.variance_cost != null && Math.abs(v.variance_cost) >= 5
        return (
          <div key={u.product_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: CREAM, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
            <span style={{ whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.75)' }}>
              {Math.round(u.used_base).toLocaleString('en-GB')} {u.base_unit}
              {off && <b style={{ color: v.variance_cost > 0 ? RED : GREEN, marginLeft: 8 }}>
                {v.variance_cost > 0 ? '−' : '+'}{gbp(Math.abs(v.variance_cost))}
              </b>}
            </span>
          </div>
        )
      })}
      <div style={{ fontSize: 11, color: DIM, marginTop: 8, lineHeight: 1.5 }}>
        A red figure is stock that left without being sold — spillage, over-pouring, breakage or loss.
        It only appears once recipes are attached, so the system knows what <i>should</i> have gone.
      </div>
    </div>
  )
}

// ─── Margins ─────────────────────────────────────────────────────────────────
function Margins({ margins }) {
  const rows = margins || []
  if (!rows.length) return (
    <Note tone="info">
      No menu items with recipes yet. Once a drink has a recipe, its margin is worked out from the
      price you <i>actually paid</i> for the ingredients — and repriced automatically when a
      delivery comes in at a new cost.
    </Note>
  )
  const costed = rows.filter(r => r.gp_percent != null).sort((a, b) => a.gp_percent - b.gp_percent)
  const not = rows.filter(r => r.gp_percent == null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {costed.map(r => (
        <div key={r.menu_item_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color: CREAM }}>{r.name}</span>
          <span style={{ whiteSpace: 'nowrap' }}>
            <span style={{ color: DIM }}>{gbp(r.sell_price)} · cost {gbp(r.recipe_cost)}</span>
            <b style={{ marginLeft: 8, color: r.gp_percent >= 70 ? GREEN : r.gp_percent >= 60 ? AMBER : RED }}>{r.gp_percent}%</b>
          </span>
        </div>
      ))}
      {not.length > 0 && (
        <div style={{ fontSize: 11.5, color: AMBER, marginTop: 8 }}>
          {not.length} item{not.length === 1 ? '' : 's'} can't be costed yet — an ingredient has no
          known price. They're left blank on purpose rather than counted as free.
        </div>
      )}
    </div>
  )
}

// ─── Full product list ───────────────────────────────────────────────────────
function ProductList({ products }) {
  const [q, setQ] = useState('')
  const groups = useMemo(() => {
    const f = products.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()))
    const g = {}
    for (const p of f) (g[p.category || 'Other'] ||= []).push(p)
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]))
  }, [products, q])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search the bar…"
             style={{ padding: '10px 12px', fontSize: 13.5, background: 'rgba(0,0,0,0.35)', color: '#fff', border: `1px solid ${LINE}`, borderRadius: 8 }} />
      {groups.map(([cat, items]) => (
        <div key={cat}>
          <div style={{ fontSize: 10.5, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 4px' }}>{cat} · {items.length}</div>
          {items.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '3px 0', color: 'rgba(255,255,255,0.78)' }}>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ color: DIM, whiteSpace: 'nowrap' }}>{p.order_unit}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Bits ────────────────────────────────────────────────────────────────────
function Stat({ label, value, sub, tone }) {
  const col = tone === 'warn' ? AMBER : tone === 'good' ? GREEN : GOLD
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div className="serif" style={{ fontSize: 22, color: col, lineHeight: 1.15, marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Drawer({ k, open, onToggle, icon, title, hint, tone, children }) {
  const isOpen = open === k
  return (
    <div style={{ background: '#0A0A0A', border: `1px solid ${isOpen ? 'rgba(201,168,76,0.4)' : LINE}`, borderRadius: 10, overflow: 'hidden' }}>
      <button onClick={() => onToggle(k)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', textAlign: 'left' }}>
        <span style={{ fontSize: 19 }}><span data-keep-color>{icon}</span></span>
        <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700 }}>{title}</span>
        {hint && <span style={{ fontSize: 11, color: tone === 'warn' ? AMBER : DIM, whiteSpace: 'nowrap' }}>{hint}</span>}
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && <div style={{ padding: '0 14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Founder: "i have 165 lines on the Bar 'The Full List'". An open drawer
            used to make the page thousands of pixels tall, so the header — and the
            ☰ that gets you back to Events — was a very long scroll away. Each
            drawer now scrolls INSIDE itself and never grows past two-thirds of the
            screen, so the page stays a normal length whatever is open. */}
        <div style={{ paddingTop: 14, maxHeight: '62vh', overflowY: 'auto', overscrollBehavior: 'contain' }}>{children}</div>
        {/* The count sheet and the full list run to 160+ rows. Without this the only
            way to close a drawer was to scroll all the way back to its header. */}
        <button onClick={() => onToggle(k)} style={{ ...btn(), marginTop: 14, width: '100%' }}>
          ▲ Close {title.toLowerCase()}
        </button>
      </div>}
    </div>
  )
}

function Note({ tone, children }) {
  const c = tone === 'bad' ? { fg: '#F87171', bg: 'rgba(248,113,113,0.08)', bd: 'rgba(248,113,113,0.3)' }
          : tone === 'good' ? { fg: GREEN, bg: 'rgba(52,211,153,0.08)', bd: 'rgba(52,211,153,0.3)' }
          : { fg: '#FCD34D', bg: 'rgba(252,211,77,0.07)', bd: 'rgba(252,211,77,0.25)' }
  return <div style={{ fontSize: 12.5, color: c.fg, background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 8, padding: '10px 12px', lineHeight: 1.55 }}>{children}</div>
}

const btn = () => ({ padding: '8px 13px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
  background: 'rgba(255,255,255,0.06)', color: '#fff', border: `1px solid rgba(255,255,255,0.18)` })
const pill = (on) => ({ padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: on ? 800 : 600,
  background: on ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.05)', color: on ? GOLD : '#fff',
  border: `1px solid ${on ? 'rgba(201,168,76,0.5)' : LINE}` })
