import React, { useEffect, useMemo, useState } from 'react'
import liveTill from './data/liveTill.json'
import { tillCatalogueCosts } from './api.js'
import { serveGP, gbp } from './gp.js'
import { pageColor } from './colors.js'
import { PAGES } from './data/happyHour.js'
import costFeed from './data/costProposals.json'
import { barSaveProduct } from '../ops/barApi.js'
import { adoptTillAppIdentity } from './pwa.js'
import TillScreen from './TillScreen.jsx'

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
        </div>
      </div>
      {view === 'till' ? <TillScreen /> : <CatalogueView />}
      </div>
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
