import React, { useEffect, useMemo, useState } from 'react'
import { PAGES, totals, LAYOUT_VERSION } from './data/catalogue.js'
import { tillCatalogueCosts } from './api.js'

// ─── TILL — slice 1: the read-only catalogue ─────────────────────────────────
// The new till's layout (726 Lightspeed products → serve-based buttons across
// 14 pages) with GP on every line, straight from the bar lane's cost engine.
// Changes nothing operationally — Lightspeed is untouched. Its whole job is to
// show which lines make money, which lose it, and which we can't cost yet.
//
// GP states, in the spirit of "never invent a price":
//   a number   — price and cost both known (VAT assumed 20%)
//   not costed — the stock product exists but no purchase price is on it yet
//   no recipe  — a mixed item whose recipe hasn't been typed into the bar system
//   no price   — a new line that hasn't been priced yet
//   no stock   — the button has no stock record at all (an honest gap)

const CREAM = 'var(--cream)', DIM = 'rgba(255,255,255,0.55)'
const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33', LINE = 'rgba(255,255,255,0.12)'

const gbp = (n) => '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const VAT = 1.2

// Work out one serve's GP from the loaded cost data. Returns
// { state, gp?, cost?, net? } — state 'ok' | 'time' | 'noPrice' | 'notCosted' | 'noRecipe' | 'noStock' | 'noData'
function serveGP(item, serve, costsByName, marginsByName) {
  if (serve.price == null) return { state: 'noPrice' }
  const net = serve.price / VAT
  if (item.noStock) return { state: 'time', gp: 100, cost: 0, net }
  if (item.stock) {
    if (!costsByName) return { state: 'noData' }
    const row = costsByName[item.stock.toLowerCase()]
    if (!row) return { state: 'noStock' }
    if (row.cost_per_base == null) return { state: 'notCosted' }
    const qty = serve.ml != null ? serve.ml : (serve.each != null ? serve.each : null)
    if (qty == null) return { state: 'notCosted' }
    const cost = qty * Number(row.cost_per_base)
    return { state: 'ok', gp: net > 0 ? (100 * (net - cost)) / net : null, cost, net }
  }
  if (item.recipe) {
    if (!marginsByName) return { state: 'noData' }
    const row = marginsByName[item.recipe.toLowerCase()]
    if (!row || !row.recipe_lines) return { state: 'noRecipe' }
    if (row.unpriced_lines > 0 || row.gp_percent == null) return { state: 'notCosted' }
    return { state: 'ok', gp: Number(row.gp_percent), cost: Number(row.recipe_cost), net: Number(row.net_price) }
  }
  return { state: 'noStock' }
}

const GP_LABEL = {
  noPrice: 'no price', notCosted: 'not costed', noRecipe: 'no recipe',
  noStock: 'no stock record', noData: '…', time: '100%',
}

function gpChip(res) {
  let bg = 'rgba(255,255,255,0.08)', color = DIM, text = GP_LABEL[res.state] || '—'
  if (res.state === 'ok') {
    const gp = res.gp
    text = `${gp.toFixed(0)}% GP`
    if (gp >= 70) { bg = 'rgba(52,211,153,0.15)'; color = GREEN }
    else if (gp >= 55) { bg = 'rgba(245,158,11,0.15)'; color = AMBER }
    else { bg = 'rgba(218,27,51,0.18)'; color = RED }
  } else if (res.state === 'time') { bg = 'rgba(52,211,153,0.15)'; color = GREEN }
  return (
    <span title={res.state === 'ok' ? `costs ${gbp(res.cost)} · net ${gbp(res.net)}` : undefined}
      style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: bg, color, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  )
}

export default function TillCatalogue() {
  const [data, setData] = useState(null)     // { costs, margins }
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(() => new Set([PAGES[1]?.name]))  // draught open by default

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

  // One pass over everything for the header numbers + worst-margin spotlight.
  const stats = useMemo(() => {
    let costed = 0, notCosted = 0, noRecipe = 0, noPrice = 0, noStock = 0
    const priced = []
    for (const page of PAGES) for (const item of page.items) for (const s of item.serves) {
      const r = serveGP(item, s, costsByName, marginsByName)
      if (r.state === 'ok' || r.state === 'time') costed += 1
      else if (r.state === 'notCosted') notCosted += 1
      else if (r.state === 'noRecipe') noRecipe += 1
      else if (r.state === 'noPrice') noPrice += 1
      else if (r.state === 'noStock') noStock += 1
      if (r.state === 'ok') priced.push({ page: page.name, item: item.name, serve: s.label, gp: r.gp, price: s.price })
    }
    priced.sort((a, b) => a.gp - b.gp)
    return { costed, notCosted, noRecipe, noPrice, noStock, worst: priced.slice(0, 8) }
  }, [costsByName, marginsByName])

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
      <div>
        <div className="serif" style={{ fontSize: 24, color: '#fff' }}>🧾 Till — the catalogue</div>
        <div style={{ fontSize: 12, color: DIM, marginTop: 2 }}>
          Slice 1 of our own till: the Lightspeed layout, stripped back. Read-only — nothing here changes the bar.
          Layout {LAYOUT_VERSION}. Prices are as rung in 2025; GP assumes 20% VAT.
        </div>
      </div>

      {/* Header numbers */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {stat(`${totals.source} → ${totals.serves}`, 'buttons, was → now')}
        {stat(totals.pages, 'pages')}
        {stat(data ? stats.costed : '—', 'with a real GP', GREEN)}
        {stat(data ? stats.notCosted : '—', 'not costed yet', AMBER)}
        {stat(data ? stats.noRecipe : '—', 'recipes to type in', AMBER)}
        {stat(stats.noPrice, 'new lines, no price', AMBER)}
        {stat(data ? stats.noStock : '—', 'no stock record', RED)}
      </div>

      {err && (
        <div style={{ background: 'rgba(218,27,51,0.12)', border: '1px solid rgba(218,27,51,0.4)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: CREAM }}>
          Couldn't load costs ({err}) — the layout still shows below, without GP.
        </div>
      )}

      {/* Worst margins — the reason this screen exists */}
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

      {/* The 14 pages */}
      {PAGES.map(page => {
        const isOpen = open.has(page.name)
        const pageUnits = page.items.reduce((s, it) => s + it.serves.reduce((x, sv) => x + (sv.units2025 || 0), 0), 0)
        return (
          <div key={page.name} style={{ border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
            <button onClick={() => toggle(page.name)} style={{
              width: '100%', textAlign: 'left', display: 'flex', alignItems: 'baseline', gap: 10,
              background: 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer',
              padding: '13px 16px', color: CREAM, fontFamily: 'inherit',
            }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '0.04em' }}>{isOpen ? '▾' : '▸'} {page.name}</span>
              <span style={{ fontSize: 11.5, color: DIM }}>
                {page.items.length} buttons · {page.items.reduce((s, it) => s + it.serves.length, 0)} serves
                {pageUnits > 0 && ` · ${pageUnits.toLocaleString('en-GB')} sold in 2025`}
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: '4px 16px 14px' }}>
                {page.blurb && <div style={{ fontSize: 12, color: DIM, padding: '4px 0 10px' }}>{page.blurb}</div>}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {page.items.map(item => (
                    <div key={item.name} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, padding: '7px 0', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                        <span style={{ fontSize: 13.5, color: CREAM, fontWeight: 600 }}>{item.name}</span>
                        {item.note && <span style={{ fontSize: 11.5, color: DIM }}> — {item.note}</span>}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                        {item.serves.map(s => {
                          const r = serveGP(item, s, costsByName, marginsByName)
                          return (
                            <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: `1px solid ${LINE}`, borderRadius: 8, padding: '4px 8px' }}>
                              <span style={{ fontSize: 12, color: CREAM }}>{s.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: s.price != null ? CREAM : DIM }}>{s.price != null ? gbp(s.price) : '—'}</span>
                              {gpChip(r)}
                              {s.units2025 != null && <span style={{ fontSize: 10.5, color: DIM }}>{s.units2025.toLocaleString('en-GB')}/yr</span>}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {page.dropped && (
                  <div style={{ fontSize: 11.5, color: DIM, paddingTop: 10, fontStyle: 'italic' }}>Stripped back: {page.dropped}</div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ fontSize: 11.5, color: DIM, lineHeight: 1.6 }}>
        A button here is a <b>serve</b> of one stock product (a pint of one keg, 25ml of one bottle) or a recipe —
        never a product of its own. That one rule is why 726 Lightspeed products became {totals.serves} buttons.
        "Not costed" means the bar system doesn't know a purchase price yet — put the price on the product in the
        Bar page and the GP appears here on its own. Nothing on this screen writes anywhere.
      </div>
    </div>
  )
}
