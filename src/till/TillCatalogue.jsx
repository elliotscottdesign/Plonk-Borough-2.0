import React, { useEffect, useMemo, useState } from 'react'
import liveTill from './data/liveTill.json'
import { tillCatalogueCosts } from './api.js'
import { serveGP, gbp } from './gp.js'
import { pageColor } from './colors.js'
import { PAGES } from './data/happyHour.js'
import costFeed from './data/costProposals.json'
import recipesFeed from './data/recipesDraft.json'
import { barSaveProduct } from '../ops/barApi.js'
import { tillHQ, tillDayState, tillVoucherList } from './api.js'
import { adoptTillAppIdentity } from './pwa.js'
import TillScreen from './TillScreen.jsx'
import ReceiptPreview from './ReceiptPreview.jsx'

// ─── The TILL tab in /ops ────────────────────────────────────────────────────
// (File name is the OpsApp mount point — this default export is the whole tab.)
// Two views on the same data:
//   🛎 Till       — the ringing screen (demo, writes nothing) — TillScreen.jsx
//   📖 Catalogue  — every button with GP on the line, from the bar cost engine
//
// The data is the LIVE Hackney till: data/hackney_till_products_2026-08-20.csv
// (K Series export) → scripts/tillLiveMenu.py → data/liveTill.json. Re-run the
// script when the founder drops a fresh export.
//
// GP states, in the spirit of "never invent a price":
//   a number   — price and cost both known (VAT assumed 20%)
//   not costed — the stock product exists but no purchase price is on it yet
//   no recipe  — a mixed item whose recipe hasn't been typed into the bar system
//   no stock   — the button has no stock record at all (an honest gap)

const CREAM = 'var(--cream)', DIM = 'rgba(255,255,255,0.55)', GOLD = 'var(--gold)'
const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33', LINE = 'rgba(255,255,255,0.12)'

export default function TillTab() {
  const [view, setView] = useState('till')
  // (An olive-green till background was tried and reverted same day —
  // founder's call, 20 Aug 2026. The till sits on the standard dark ground.)
  // While the Till is open, Add to Home Screen installs "No Dice Till".
  useEffect(() => adoptTillAppIdentity(), [])
  const tabBtn = (k, label) => (
    <button onClick={() => setView(k)} style={{
      padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
      background: view === k ? 'rgba(201,168,76,0.15)' : 'transparent',
      border: `1.5px solid ${view === k ? GOLD : LINE}`,
      color: view === k ? GOLD : CREAM, fontWeight: view === k ? 700 : 400,
    }}>{label}</button>
  )
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Compact header — the register needs every vertical pixel (iPad,
          no-scroll law). The catalogue view keeps the explainer line. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
          <div className="serif" style={{ fontSize: 18, color: '#fff', whiteSpace: 'nowrap' }}>🧾 Till</div>
          {view === 'catalogue' && (
            <div style={{ fontSize: 11.5, color: DIM }}>
              Our own till, building up alongside Lightspeed. Live layout &amp; prices ({liveTill.source}).
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {tabBtn('till', '🛎 Till')}
          {tabBtn('catalogue', '📖 Catalogue & margins')}
          {tabBtn('hq', '📊 HQ')}
          {tabBtn('receipts', '🧾 Receipts')}
        </div>
      </div>
      {view === 'till' ? <TillScreen /> : view === 'hq' ? <HQView /> : view === 'receipts' ? <ReceiptPreview /> : <CatalogueView />}
      </div>
    </div>
  )
}

// ─── 📊 HQ — the founder's one-glance morning view ──────────────────────────
// Today's live day, the Z-read history, redeemed vouchers, and the two counts
// that measure how ready the costing engine is. Everything read-only.
function HQView() {
  const [day, setDay] = useState(null)
  const [hq, setHq] = useState(null)
  const [hqErr, setHqErr] = useState('')
  const [cat, setCat] = useState(null)
  const [outstanding, setOutstanding] = useState(null)
  useEffect(() => {
    tillDayState().then(setDay).catch(() => {})
    tillHQ().then(setHq).catch(e => setHqErr(e.message || 'unavailable'))
    tillCatalogueCosts().then(setCat).catch(() => {})
    tillVoucherList().then(r => setOutstanding((r.vouchers || []).length)).catch(() => {})
  }, [])

  const uncosted = cat ? (cat.costs || []).filter(c => c.cost_per_base == null).length : null
  const costed = cat ? (cat.costs || []).filter(c => c.cost_per_base != null).length : null
  const recipesIn = cat ? (cat.margins || []).filter(m => m.recipe_lines > 0).length : null
  const openOrders = day?.orders?.length ?? 0
  const s = day?.session

  const card = (title, children) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 12, padding: '13px 16px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.13em', textTransform: 'uppercase', color: DIM, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {card('Today', s ? (
        <div style={{ fontSize: 13.5, color: CREAM }}>
          🔒 Day OPEN since {String(s.opened_at || '').slice(11, 16)}{s.opened_by ? ` (${s.opened_by})` : ''} ·
          float {gbp((s.float_start_pence || 0) / 100)} · <b>{openOrders}</b> open order{openOrders === 1 ? '' : 's'}{' '}
          ({gbp((day.orders || []).reduce((t, o) => t + (o.total_pence || 0), 0) / 100)} on the floor)
        </div>
      ) : (
        <div style={{ fontSize: 13.5, color: DIM }}>The day isn't open. (⊞ Floor → OPEN THE DAY when service starts.)</div>
      ))}

      {card('Z-reads — the last 14 days', hqErr ? (
        <div style={{ fontSize: 12.5, color: AMBER }}>History arrives with the next service update ({hqErr}).</div>
      ) : !hq ? <div style={{ fontSize: 12.5, color: DIM }}>Loading…</div> : (hq.zreads || []).length === 0 ? (
        <div style={{ fontSize: 12.5, color: DIM }}>No closed days yet — the first real Z will appear here.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {hq.zreads.map(z => (
            <div key={z.z} style={{ display: 'flex', gap: 12, fontSize: 13, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <b style={{ color: GOLD, minWidth: 42 }}>Z #{z.z}</b>
              <span style={{ color: DIM, minWidth: 84 }}>{String(z.closed_at || '').slice(0, 10)}</span>
              <span style={{ color: CREAM }}>gross <b>{gbp(z.gross_pence / 100)}</b></span>
              <span style={{ color: DIM }}>cash {gbp(z.cash_pence / 100)} · vouchers {gbp(z.voucher_pence / 100)}</span>
              <span style={{ fontWeight: 700, color: z.over_short_pence === 0 ? GREEN : z.over_short_pence > 0 ? AMBER : RED }}>
                {z.over_short_pence === 0 ? 'drawer spot on' : `${z.over_short_pence > 0 ? 'over' : 'short'} ${gbp(Math.abs(z.over_short_pence) / 100)}`}
              </span>
            </div>
          ))}
        </div>
      ))}

      {card('Vouchers', (
        <div style={{ fontSize: 13, color: CREAM, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>{outstanding == null ? '…' : <><b>{outstanding}</b> outstanding in the wild</>}</span>
          {hq && (hq.redeemed || []).slice(0, 6).map(v => (
            <span key={v.code} style={{ fontSize: 12, color: DIM }}>
              ✓ {String(v.redeemed_at).slice(0, 10)} · {v.display_name || v.code} · {gbp(v.amount_pence / 100)} · by {v.redeemed_by || '—'}
            </span>
          ))}
        </div>
      ))}

      {card('Costing engine readiness', (
        <div style={{ fontSize: 13, color: CREAM }}>
          {cat ? <>
            <b style={{ color: GREEN }}>{costed}</b> products costed · <b style={{ color: AMBER }}>{uncosted}</b> still uncosted
            (the 💷 Costs inbox fills these) · <b style={{ color: recipesIn ? GREEN : AMBER }}>{recipesIn}</b> recipes in the engine
            (🧪 {recipesFeed.drafts.filter(d => d.ready).length} drafted, loading on the next service update)
          </> : 'Loading…'}
        </div>
      ))}
      <div style={{ fontSize: 10.5, color: DIM }}>Read-only. The same numbers can land in your inbox each morning — say the word.</div>
    </div>
  )
}

// ─── 📖 Catalogue & margins ──────────────────────────────────────────────────
function CatalogueView() {
  const [data, setData] = useState(null)     // { costs, margins }
  const [err, setErr] = useState('')
  const pages = PAGES        // Happy Hour first, then the live K Series pages
  const [open, setOpen] = useState(() => new Set([pages[1]?.name]))

  useEffect(() => {
    tillCatalogueCosts().then(setData).catch(e => setErr(e.message || 'Could not reach the till service.'))
  }, [])

  const costsByName = useMemo(() => {
    if (!data) return null
    const m = {}
    for (const r of data.costs || []) m[String(r.name).toLowerCase()] = r
    return m
  }, [data])
  const marginsByName = useMemo(() => {
    if (!data) return null
    const m = {}
    for (const r of data.margins || []) m[String(r.name).toLowerCase()] = r
    return m
  }, [data])

  const totals = useMemo(() => {
    let products = 0, serves = 0
    for (const pg of pages) for (const p of pg.products) { products += 1; serves += p.serves.length }
    return { pages: pages.length, products, serves }
  }, [pages])

  const stats = useMemo(() => {
    let costed = 0, notCosted = 0, noRecipe = 0, noStock = 0
    const priced = []
    for (const pg of pages) for (const p of pg.products) for (const s of p.serves) {
      const r = serveGP(p, s, costsByName, marginsByName)
      if (r.state === 'ok' || r.state === 'time') costed += 1
      else if (r.state === 'notCosted') notCosted += 1
      else if (r.state === 'noRecipe') noRecipe += 1
      else if (r.state === 'noStock') noStock += 1
      if (r.state === 'ok') priced.push({ page: pg.name, item: p.name, serve: s.label, gp: r.gp, price: s.price })
    }
    priced.sort((a, b) => a.gp - b.gp)
    return { costed, notCosted, noRecipe, noStock, worst: priced.slice(0, 8) }
  }, [pages, costsByName, marginsByName])

  const toggle = (name) => setOpen(prev => {
    const next = new Set(prev)
    next.has(name) ? next.delete(name) : next.add(name)
    return next
  })

  const stat = (n, label, color) => (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 14px', minWidth: 92 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || CREAM }}>{n}</div>
      <div style={{ fontSize: 10.5, color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {stat(`${totals.products} · ${totals.serves}`, 'products · buttons')}
        {stat(totals.pages, 'pages')}
        {stat(data ? stats.costed : '—', 'with a real GP', GREEN)}
        {stat(data ? stats.notCosted : '—', 'not costed yet', AMBER)}
        {stat(data ? stats.noRecipe : '—', 'recipes to type in', AMBER)}
        {stat(data ? stats.noStock : '—', 'no stock record', RED)}
      </div>

      {err && (
        <div style={{ background: 'rgba(218,27,51,0.12)', border: '1px solid rgba(218,27,51,0.4)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: CREAM }}>
          Couldn't load costs ({err}) — the layout still shows below, without GP.
        </div>
      )}

      <CostsInbox costsByName={costsByName} onApplied={() => tillCatalogueCosts().then(setData).catch(() => {})} />
      <RecipeDrafts marginsByName={marginsByName} />

      {stats.worst.length > 0 && (
        <div style={{ background: 'rgba(218,27,51,0.07)', border: '1px solid rgba(218,27,51,0.3)', borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: CREAM, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Thinnest margins on the till
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {stats.worst.map((w, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
                <span style={{ color: CREAM }}>{w.item} <span style={{ color: DIM }}>· {w.serve} {gbp(w.price)} · {w.page}</span></span>
                <span style={{ fontWeight: 700, color: w.gp >= 70 ? GREEN : w.gp >= 55 ? AMBER : RED }}>{w.gp.toFixed(0)}% GP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pages.map(pg => {
        const isOpen = open.has(pg.name)
        return (
          <div key={pg.name} style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
            <button onClick={() => toggle(pg.name)} style={{
              width: '100%', textAlign: 'left', display: 'flex', alignItems: 'baseline', gap: 10,
              background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer',
              padding: '13px 16px', color: CREAM, fontFamily: 'inherit',
            }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '0.04em' }}>
                {isOpen ? '▾' : '▸'} <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: pageColor(pg.name), verticalAlign: 'baseline', marginRight: 2 }} /> {pg.name}
              </span>
              <span style={{ fontSize: 11.5, color: DIM }}>
                {pg.products.length} products · {pg.products.reduce((s, p) => s + p.serves.length, 0)} buttons
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: '4px 16px 14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {pg.products.map(p => (
                    <div key={p.sku} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                        <span style={{ fontSize: 13.5, color: CREAM, fontWeight: 600 }}>{p.name}</span>
                        {p.stock && <span style={{ fontSize: 10.5, color: DIM }}> → {p.stock}</span>}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                        {p.serves.map(s => {
                          const r = serveGP(p, s, costsByName, marginsByName)
                          return (
                            <span key={s.label + s.price} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE}`, borderRadius: 8, padding: '4px 8px' }}>
                              <span style={{ fontSize: 12, color: CREAM }}>{s.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: CREAM }}>{gbp(s.price)}</span>
                              <GpChip r={r} />
                              {p.units2025 != null && s === p.serves[0] && <span style={{ fontSize: 10.5, color: DIM }}>{p.units2025.toLocaleString('en-GB')} in 2025</span>}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div style={{ fontSize: 11.5, color: DIM, lineHeight: 1.6 }}>
        A button is a <b>serve</b> of one stock product (a pint of one keg, 25ml of one bottle) or a recipe — never a
        product of its own. "Not costed" means the bar system doesn't know a purchase price yet — put the price on the
        product in the Bar page and GP appears here on its own. "No stock record" means the product isn't in the bar
        stock system at all yet. GP assumes 20% VAT. Nothing on this screen writes anywhere.
      </div>
    </div>
  )
}

// ─── 💷 Costs inbox — the invoice → cost feed's approval queue ──────────────
// Proposed pack costs (scripts/costProposals.py: the Drinks Club 26-27 invoice
// list where marked, ballparks flagged amber). NOTHING applies without a tap;
// Apply writes pack_cost through the bar fn's founder-gated action, and GP
// across the till updates itself.
function CostsInbox({ costsByName, onApplied }) {
  const [open, setOpen] = useState(false)
  const [applied, setApplied] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const rows = costFeed.proposals.map(p => {
    const live = costsByName ? costsByName[p.stock.toLowerCase()] : null
    return { ...p, product_id: live?.product_id || null, alreadyCosted: live ? live.cost_per_base != null : null }
  })
  const applicable = rows.filter(r => r.product_id && !applied.has(r.stock))
  const confidentTodo = applicable.filter(r => r.confident && !r.alreadyCosted)

  const applyOne = async (r) => {
    if (!r.product_id) return
    try {
      await barSaveProduct({ id: r.product_id, pack_cost: r.pack_cost })
      setApplied(prev => new Set(prev).add(r.stock))
    } catch (e) { alert(`${r.stock}: ${e.message || 'failed'}`) }
  }
  const applyAll = async () => {
    setBusy(true)
    for (const r of confidentTodo) await applyOne(r)   // sequential, gentle
    setBusy(false)
    onApplied()
  }

  return (
    <div style={{ border: `1.5px solid ${GOLD}`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
        background: 'rgba(201,168,76,0.08)', border: 'none', cursor: 'pointer', padding: '13px 16px', color: CREAM, fontFamily: 'inherit',
      }}>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: GOLD }}>{open ? '▾' : '▸'} 💷 Costs inbox</span>
        <span style={{ fontSize: 11.5, color: DIM }}>
          {costFeed.proposals.length} proposed pack costs · {costFeed.generated}
        </span>
      </button>
      {open && (
        <div style={{ padding: '4px 16px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {confidentTodo.length > 0 && (
            <button onClick={applyAll} disabled={busy} style={{
              alignSelf: 'flex-start', padding: '11px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: GOLD, color: '#141414', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, opacity: busy ? 0.6 : 1,
            }}>
              {busy ? 'Applying…' : `APPLY ALL ${confidentTodo.length} INVOICE-LISTED COSTS`}
            </button>
          )}
          {rows.map(r => {
            const done = applied.has(r.stock)
            return (
              <div key={r.stock} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                <span style={{ flex: '1 1 200px', fontSize: 13, color: CREAM, fontWeight: 600 }}>
                  {r.stock}
                  <span style={{ fontSize: 10.5, color: DIM, fontWeight: 400 }}> · {r.supplier || '—'} · {r.ref.slice(0, 46)}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: r.confident ? GREEN : AMBER, whiteSpace: 'nowrap' }}>
                  {gbp(r.pack_cost)} <span style={{ fontWeight: 400, color: DIM, fontSize: 10.5 }}>{r.pack_label} ex-VAT</span>
                </span>
                <span style={{ fontSize: 10, color: r.confident ? GREEN : AMBER }}>{r.confident ? 'invoice list' : 'ballpark'}</span>
                {r.alreadyCosted && !done && <span style={{ fontSize: 10, color: DIM }}>has a cost</span>}
                {done
                  ? <span style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>✓ applied</span>
                  : r.product_id
                    ? <button onClick={() => { applyOne(r).then(onApplied) }} style={{
                        padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${GOLD}`, background: 'rgba(201,168,76,0.1)',
                        color: GOLD, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800,
                      }}>APPLY</button>
                    : <span style={{ fontSize: 10.5, color: DIM }}>waiting for cost data…</span>}
              </div>
            )
          })}
          <div style={{ fontSize: 10.5, color: DIM, paddingTop: 8, lineHeight: 1.5 }}>
            Green = the Drinks Club 26-27 wholesale list (real invoice prices, ex-VAT). Amber = industry ballpark — apply
            only if it looks right, and replace it when the real invoice lands. Next stage: prices read straight off
            supplier invoice PDFs (Xero bills only carry one-line totals — the detail is in the attachments).
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 🧪 Recipe drafts — the recipes sprint's review sheet ───────────────────
// 97 recipes drafted from the costing sheet (every line joined to a real
// stock product; garnish/soda omissions and skips shown honestly). They load
// into the costing engine on the next service update — this is the founder's
// eyeball pass.
function RecipeDrafts({ marginsByName }) {
  const [open, setOpen] = useState(false)
  const drafts = recipesFeed.drafts
  const ready = drafts.filter(d => d.ready)
  const inEngine = (name) => marginsByName && marginsByName[name.toLowerCase()]?.recipe_lines > 0
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer', padding: '13px 16px', color: CREAM, fontFamily: 'inherit',
      }}>
        <span style={{ fontSize: 14.5, fontWeight: 700 }}>{open ? '▾' : '▸'} 🧪 Recipe drafts</span>
        <span style={{ fontSize: 11.5, color: DIM }}>
          {ready.length} ready of {drafts.length} · {recipesFeed.generated}
        </span>
      </button>
      {open && (
        <div style={{ padding: '4px 16px 14px', display: 'flex', flexDirection: 'column' }}>
          {drafts.map(d => (
            <div key={d.costing_name} style={{ display: 'flex', gap: 10, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', alignItems: 'baseline' }}>
              <span style={{ flex: '1 1 180px', fontSize: 13, fontWeight: 600, color: d.ready ? CREAM : DIM }}>
                {d.name} <span style={{ fontSize: 10.5, color: DIM, fontWeight: 400 }}>· {gbp(d.sell)}</span>
                {inEngine(d.name) && <span style={{ fontSize: 10.5, color: GREEN }}> · in the engine ✓</span>}
              </span>
              <span style={{ flex: '2 1 300px', fontSize: 11.5, color: d.ready ? DIM : AMBER }}>
                {d.ready
                  ? d.lines.map(l => `${l.disp} ${l.product}`).join(' + ') + (d.omitted.length ? `  (omits: ${d.omitted.join(', ')})` : '')
                  : `SKIPPED — not in the stock system: ${d.missing.join(', ')}`}
              </span>
            </div>
          ))}
          <div style={{ fontSize: 10.5, color: DIM, paddingTop: 8, lineHeight: 1.5 }}>
            Drafted from the costing sheet's own recipes. Garnish and gun-soda are omitted (pennies a serve); fresh
            lime/lemon juice and sugar syrup become proper "made" prep products costed from limes, lemons and sugar.
            Skipped recipes name products the stock system doesn't carry yet. Spot anything wrong? Say so — one line
            fixes it before the load.
          </div>
        </div>
      )}
    </div>
  )
}

const GP_LABEL = { noPrice: 'no price', notCosted: 'not costed', noRecipe: 'no recipe', noStock: 'no stock record', noData: '…', time: '100%' }

function GpChip({ r }) {
  let bg = 'rgba(255,255,255,0.08)', color = DIM, text = GP_LABEL[r.state] || '—'
  if (r.state === 'ok') {
    text = `${r.gp.toFixed(0)}% GP`
    if (r.gp >= 70) { bg = 'rgba(52,211,153,0.15)'; color = GREEN }
    else if (r.gp >= 55) { bg = 'rgba(245,158,11,0.15)'; color = AMBER }
    else { bg = 'rgba(218,27,51,0.18)'; color = RED }
  } else if (r.state === 'time') { bg = 'rgba(52,211,153,0.15)'; color = GREEN }
  return (
    <span title={r.state === 'ok' ? `costs ${gbp(r.cost)} · net ${gbp(r.net)}` : undefined}
      style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: bg, color, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  )
}
