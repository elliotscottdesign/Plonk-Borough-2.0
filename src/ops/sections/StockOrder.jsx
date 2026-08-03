import React, { useState, useEffect } from 'react'
import {
  PINT_LITRES, WASTAGE, AVG_WEEK_REVENUE, DOW_SHARE, WEEKEND_SHARE,
  DRAUGHT, SPIRITS, COCKTAIL_BASES, SOFTS, FRESH, PRESETS,
} from '../data/stockBaseline.js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../marketing/data/backend.js'

// ─── Stock Order calculator ──────────────────────────────────────────────
// Scales the February baseline by a single "how busy" multiplier and prints
// kegs / bottles (by product) / cans to order, plus the weekend-loading split.

const money = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const ceil = (n) => Math.ceil(n - 1e-9)
const groupOrdered = (arr, key) => {
  const order = [], map = {}
  arr.forEach(x => { if (!map[x[key]]) { map[x[key]] = []; order.push(x[key]) } map[x[key]].push(x) })
  return order.map(g => ({ group: g, items: map[g] }))
}

function Panel({ title, sub, accent, children }) {
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div className="serif" style={{ fontSize: 18, color: accent || 'var(--gold)' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

const cell = { padding: '8px 6px', fontSize: 13, color: 'var(--cream)', fontVariantNumeric: 'tabular-nums' }
const head = { padding: '6px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cream-dim)', textAlign: 'right', fontWeight: 600 }

// Baseline for the "load from bookings" heuristic. Roughly what a February
// week nets in bar-side bookings — a 100% multiplier corresponds to about
// this many booked covers over Mon–Sun. Adjust once we have 3 months of live
// booking data to compare against actual weekly takings.
const BASELINE_WEEK_COVERS = 100

export default function StockOrder() {
  const [mult, setMult] = useState(1.0)
  const [copied, setCopied] = useState(false)
  const weekRev = AVG_WEEK_REVENUE * mult

  // Live "how much is already booked for this Mon-Sun" pulled straight from
  // the shared Supabase so staff can dial the multiplier honestly instead of
  // guessing. Non-blocking: renders as null until it arrives, so the page is
  // instantly usable even without a Supabase connection.
  const [weekBookings, setWeekBookings] = useState(null)
  useEffect(() => {
    let cancelled = false
    const today = new Date()
    // Monday of this week (JS Sunday=0, adjust so Mon=0)
    const day = (today.getDay() + 6) % 7
    const mon = new Date(today); mon.setDate(today.getDate() - day)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const from = iso(mon), to = iso(sun)
    const h = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    Promise.allSettled([
      fetch(`${SUPABASE_URL}/rest/v1/bar_reservations?select=party_size&status=eq.confirmed&reservation_date=gte.${from}&reservation_date=lte.${to}`, { headers: h }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/tournament_entries?select=team_name,captain_name,tournaments!inner(event_date)&status=eq.paid&tournaments.event_date=gte.${from}&tournaments.event_date=lte.${to}`, { headers: h }).then(r => r.json()),
    ]).then(([barR, tournR]) => {
      if (cancelled) return
      const bar = barR.status === 'fulfilled' && Array.isArray(barR.value) ? barR.value : []
      const tourn = tournR.status === 'fulfilled' && Array.isArray(tournR.value) ? tournR.value : []
      let covers = 0, count = 0, big = 0
      for (const r of bar) { covers += r.party_size || 0; count++; if ((r.party_size || 0) >= 8) big++ }
      for (const t of tourn) { covers += (t.team_name && t.team_name !== t.captain_name) ? 2 : 1; count++ }
      setWeekBookings({ covers, count, big, from, to })
    }).catch(() => setWeekBookings({ covers: 0, count: 0, big: 0, from, to }))
    return () => { cancelled = true }
  }, [])
  // Turn booked covers into a suggested multiplier, clamped to the dial's
  // 50–200% range. Rounded to the nearest 5% so it snaps cleanly.
  const suggestedMult = weekBookings
    ? Math.max(0.5, Math.min(2.0, Math.round((weekBookings.covers / BASELINE_WEEK_COVERS) * 20) / 20))
    : null

  // Draught: pints → litres (+wastage) → kegs (weekly)
  const draught = DRAUGHT.map(d => {
    const pints = d.pintsPerWeek * mult
    const litres = pints * PINT_LITRES * (1 + WASTAGE)
    const kegsRaw = litres / d.kegL
    return { ...d, pints, litres, kegsRaw, order: ceil(kegsRaw) }
  })
  const totalKegs = draught.reduce((s, d) => s + d.order, 0)

  // Spirits BY PRODUCT — slow movers, ordered to cover ~4 weeks.
  const spirits = SPIRITS.map(s => {
    const per4wk = s.bpw * mult * 4
    return { ...s, perWeek: s.bpw * mult, per4wk, order: Math.round(per4wk) }
  })
  const spiritGroups = groupOrdered(spirits, 'cat')
  const spirit4wkTotal = Math.round(spirits.reduce((s, x) => s + x.per4wk, 0))
  const cocktailBottles = COCKTAIL_BASES.bottlesPerWeek * mult

  // Softs BY PRODUCT, grouped.
  const softs = SOFTS.map(s => ({ ...s, qty: s.perWeek * mult, order: ceil(s.perWeek * mult) }))
  const softGroups = groupOrdered(softs, 'group')
  const cansWkTotal = Math.round(softs.filter(s => s.group.startsWith('Cans')).reduce((s, x) => s + x.qty, 0))

  // Fresh produce (fruit / veg / herbs, all Brakes) — scales with the busy dial.
  const fresh = FRESH.map(f => ({ ...f, order: ceil(f.perWeek * mult) }))
  const freshGroups = groupOrdered(fresh, 'group')
  const freshSpend = fresh.reduce((s, f) => s + f.order * f.unitCost, 0)

  const weekendKegs = draught.map(d => ({ label: d.label, kegs: d.kegsRaw * WEEKEND_SHARE }))

  // ─── Export — a product-level checklist for the Drinks Club basket ────────
  const orderText = () => {
    const L = []
    L.push('NO DICE HACKNEY · STOCK ORDER')
    L.push(`Week estimate: ~${money(weekRev)}  (${Math.round(mult * 100)}% of a Feb average)`)
    L.push('')
    L.push('DRAUGHT (kegs) · Drinks Club')
    draught.forEach(d => {
      const note = d.kegsRaw < 0.6 ? `   [1 keg lasts ~${Math.round(1 / Math.max(d.kegsRaw, 0.01))} wks]` : ''
      L.push(`  ${d.label} — ${d.brand} (${d.kegL}L):  ${d.order} keg${d.order > 1 ? 's' : ''}${note}`)
    })
    L.push('')
    L.push('SPIRITS (700ml bottles · ~4-week cover) · Drinks Club')
    spiritGroups.forEach(g => {
      L.push(`  [${g.group}]`)
      g.items.forEach(s => L.push(`    ${s.name}:  ${s.order > 0 ? s.order + ' × 700ml' : '— (top up as needed)'}`))
    })
    L.push(`  + Cocktails draw ~${Math.round(cocktailBottles)} btl/wk of base spirits (not brand-split): ${COCKTAIL_BASES.brands}`)
    L.push('')
    L.push('SOFT DRINKS · Drinks Club')
    softGroups.forEach(g => {
      L.push(`  [${g.group}]`)
      g.items.forEach(s => {
        const val = g.group.startsWith('Cans') ? `${s.order} ${s.unit}/wk` : `~${s.qty.toFixed(1)} ${s.unit}/wk`
        L.push(`    ${s.name}:  ${val}`)
      })
    })
    L.push('')
    L.push('FRESH — FRUIT / VEG / HERBS · Brakes')
    freshGroups.forEach(g => {
      L.push(`  [${g.group}]`)
      g.items.forEach(f => L.push(`    ${f.name}:  ${f.order} × ${f.unit}`))
    })
    return L.join('\n')
  }

  const orderCsv = () => {
    const rows = [['Category', 'Product', 'Order', 'Unit / note']]
    draught.forEach(d => rows.push(['Draught', `${d.label} (${d.brand})`, d.order, `keg ${d.kegL}L`]))
    spirits.forEach(s => rows.push([`Spirits · ${s.cat}`, s.name, s.order, '700ml bottle · ~4wk cover']))
    softs.forEach(s => rows.push([`Soft · ${s.group}`, s.name, s.group.startsWith('Cans') ? s.order : s.qty.toFixed(1), `${s.unit}/wk`]))
    fresh.forEach(f => rows.push([`Fresh · ${f.group} (Brakes)`, f.name, f.order, f.unit]))
    return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  }

  const copyOrder = async () => {
    const text = orderText()
    try { await navigator.clipboard.writeText(text) }
    catch {
      const ta = document.createElement('textarea')
      ta.value = text; document.body.appendChild(ta); ta.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      document.body.removeChild(ta)
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const downloadCsv = () => {
    const blob = new Blob([orderCsv()], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'nodice-hackney-stock-order.csv'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, maxWidth: 760 }}>
        Order quantities for <strong style={{ color: 'var(--cream)' }}>one week</strong>, by product, scaled from your
        February baseline. Drag the dial to match how busy you expect the week to be. Draught & soft cans are weekly;
        spirits are slow per line, so they're shown to cover ~4 weeks. {Math.round(WASTAGE * 100)}% draught wastage included.
      </div>

      {/* Busy dial */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div className="serif" style={{ fontSize: 16, color: 'var(--gold)' }}>How busy is the week?</div>
          <div style={{ fontSize: 13, color: 'var(--cream-dim)' }}>
            ≈ <strong style={{ color: 'var(--cream)' }}>{money(weekRev)}</strong> week · {Math.round(mult * 100)}% of a Feb average
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {PRESETS.map(p => {
            const on = Math.abs(mult - p.mult) < 0.001
            return (
              <button key={p.key} onClick={() => setMult(p.mult)} style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                background: on ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${on ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
                color: on ? 'var(--gold)' : 'var(--cream)', fontWeight: on ? 600 : 400,
              }}>{p.label} <span style={{ opacity: 0.6 }}>·{Math.round(p.mult * 100)}%</span></button>
            )
          })}
        </div>
        <input type="range" min="0.5" max="2" step="0.05" value={mult}
          onChange={e => setMult(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--gold)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--cream-dim)', marginTop: 4 }}>
          <span>50% (very quiet)</span><span>100% (Feb avg)</span><span>200% (peak summer)</span>
        </div>

        {/* Booked-this-week reference — pulled live from nodice.bar's booking
            tables. Shows what's already committed so staff can dial the
            multiplier honestly instead of guessing. "Use this" snaps the dial
            to a suggested multiplier (booked covers ÷ Feb baseline). */}
        {weekBookings && (
          <div style={{ marginTop: 14, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.28)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#93C5FD', fontWeight: 700, whiteSpace: 'nowrap' }}>📇 Booked this week ({weekBookings.from.slice(5)} → {weekBookings.to.slice(5)}):</span>
            <span style={{ fontSize: 13, color: 'var(--cream)' }}>
              <strong>{weekBookings.covers}</strong> cover{weekBookings.covers === 1 ? '' : 's'} across <strong>{weekBookings.count}</strong> booking{weekBookings.count === 1 ? '' : 's'}
              {weekBookings.big > 0 && <span style={{ color: '#F59E0B', fontWeight: 700 }}> · {weekBookings.big} big part{weekBookings.big === 1 ? 'y' : 'ies'} (8+)</span>}
            </span>
            {suggestedMult != null && Math.abs(suggestedMult - mult) > 0.02 && (
              <button
                onClick={() => setMult(suggestedMult)}
                style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: 'rgba(96,165,250,0.18)', border: '1px solid #60A5FA', color: '#93C5FD' }}
                title={`Snap the dial to ${Math.round(suggestedMult * 100)}% based on ${weekBookings.covers} booked covers vs a ${BASELINE_WEEK_COVERS}-cover baseline week`}
              >
                Use {Math.round(suggestedMult * 100)}%
              </button>
            )}
          </div>
        )}
      </div>

      {/* Headline tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
        {[
          ['Draught', `${totalKegs} kegs`, 'this week'],
          ['Spirits', `${spirit4wkTotal} btl`, '≈4-week order · + cocktails'],
          ['Soft cans', `${cansWkTotal}/wk`, 'per week'],
          ['Est. week', money(weekRev), 'till sales'],
        ].map(([l, v, s]) => (
          <div key={l} style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)' }}>{l}</div>
            <div className="serif" style={{ fontSize: 24, color: 'var(--gold)', lineHeight: 1.2 }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Export */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ flex: '1 1 240px', fontSize: 13, color: 'var(--cream)', lineHeight: 1.5 }}>
          <strong>Order ready.</strong> Copy it, then set these quantities against your saved Drinks Club basket.
        </div>
        <button onClick={copyOrder} style={{ padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, background: copied ? '#34D399' : 'var(--gold)', color: 'var(--ink)', border: 'none', transition: 'background 0.15s' }}>
          {copied ? '✓ Copied' : 'Copy order'}
        </button>
        <button onClick={downloadCsv} style={{ padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, background: 'rgba(255,255,255,0.05)', color: 'var(--cream)', border: '1px solid rgba(201,168,76,0.4)' }}>
          Download CSV
        </button>
      </div>

      {/* Draught */}
      <Panel title="Draught beer — kegs/week" sub="halves counted as ½ · +5% wastage">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ ...head, textAlign: 'left' }}>Tap</th>
            <th style={head}>Pints</th><th style={head}>Litres</th><th style={head}>Keg</th>
            <th style={head}>Kegs/wk</th><th style={{ ...head, color: 'var(--gold)' }}>Order</th>
          </tr></thead>
          <tbody>
            {draught.map(d => (
              <tr key={d.key} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ ...cell, textAlign: 'left' }}>{d.label} <span style={{ color: 'var(--cream-dim)', fontSize: 11 }}>· {d.brand}</span></td>
                <td style={{ ...cell, textAlign: 'right' }}>{Math.round(d.pints)}</td>
                <td style={{ ...cell, textAlign: 'right' }}>{Math.round(d.litres)} L</td>
                <td style={{ ...cell, textAlign: 'right', color: 'var(--cream-dim)' }}>{d.kegL}L</td>
                <td style={{ ...cell, textAlign: 'right', color: 'var(--cream-dim)' }}>{d.kegsRaw.toFixed(1)}</td>
                <td style={{ ...cell, textAlign: 'right', color: 'var(--gold)', fontWeight: 700 }}>
                  {d.order}{d.kegsRaw < 0.6 ? <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--cream-dim)' }}> (1 / {Math.round(1 / Math.max(d.kegsRaw, 0.01))} wks)</span> : ''}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: '1px solid rgba(201,168,76,0.25)' }}>
              <td style={{ ...cell, textAlign: 'left', fontWeight: 700, color: 'var(--gold)' }}>Total</td>
              <td colSpan={4} />
              <td style={{ ...cell, textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>{totalKegs} kegs</td>
            </tr>
          </tbody>
        </table>
      </Panel>

      {/* Weekend timing */}
      <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
          ⏱ Get it in before Friday — {Math.round(WEEKEND_SHARE * 100)}% of the week is Fri–Sun (Sat alone is 42%)
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.6 }}>
          On your 2-day order cycle, make the <strong>Thursday delivery the big one</strong>. For this week, have roughly{' '}
          <strong style={{ color: 'var(--gold)' }}>{Math.ceil(weekendKegs[0].kegs)} lager</strong> +{' '}
          <strong style={{ color: 'var(--gold)' }}>{Math.ceil(weekendKegs[1].kegs)} pale</strong> kegs connected/spare for the weekend,
          plus the Cazcabel and the canned softs. Mon–Thu is only ~23% of the week — keep midweek top-ups small.
        </div>
      </div>

      {/* Spirits by product */}
      <Panel title="Liquor — by product" sub="700ml bottles · order ≈ 4-week cover" accent="#4FD1C5">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ ...head, textAlign: 'left' }}>Product</th>
            <th style={head}>Bottles/wk</th><th style={head}>/ 4 wks</th><th style={{ ...head, color: '#4FD1C5' }}>Order</th>
          </tr></thead>
          <tbody>
            {spiritGroups.map(g => (
              <React.Fragment key={g.group}>
                <tr><td colSpan={4} style={{ padding: '10px 6px 4px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4FD1C5', fontWeight: 700 }}>{g.group}</td></tr>
                {g.items.map(s => (
                  <tr key={s.name} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ ...cell, textAlign: 'left' }}>{s.name}</td>
                    <td style={{ ...cell, textAlign: 'right', color: 'var(--cream-dim)' }}>{s.perWeek.toFixed(2)}</td>
                    <td style={{ ...cell, textAlign: 'right', color: 'var(--cream-dim)' }}>{s.per4wk.toFixed(1)}</td>
                    <td style={{ ...cell, textAlign: 'right', color: s.order > 0 ? '#4FD1C5' : 'var(--cream-dim)', fontWeight: s.order > 0 ? 700 : 400 }}>{s.order > 0 ? s.order : '—'}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(79,209,197,0.07)', border: '1px solid rgba(79,209,197,0.3)', borderRadius: 6, fontSize: 12, color: '#A7F3EB', lineHeight: 1.55 }}>
          <strong>+ Cocktails:</strong> add ~{Math.round(cocktailBottles)} bottles/wk of base spirits beyond the measures above — the till can't split these to a brand, so top up by feel: {COCKTAIL_BASES.brands}.
        </div>
      </Panel>

      {/* Softs by product */}
      <Panel title="Soft drinks — by product" sub="per week" accent="#6FA8DC">
        {softGroups.map(g => (
          <div key={g.group} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6FA8DC', fontWeight: 700, marginBottom: 6 }}>{g.group}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {g.items.map(s => (
                <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, fontSize: 13, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '6px 4px 0' }}>
                  <div style={{ color: 'var(--cream)' }}>{s.name}</div>
                  <div style={{ color: '#6FA8DC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {g.group.startsWith('Cans') ? `${s.order} ${s.unit}` : `~${s.qty.toFixed(1)} ${s.unit}`}
                  </div>
                </div>
              ))}
            </div>
            {g.group.startsWith('Post-mix') && <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 6, fontStyle: 'italic' }}>From BIB syrup — one box per line lasts well over a week; just keep Coke + tonic topped up before the weekend.</div>}
            {g.group.startsWith('Juice') && <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 6, fontStyle: 'italic' }}>~1 carton covers a week of each at this volume.</div>}
          </div>
        ))}
      </Panel>

      {/* Fresh produce — fruit / veg / herbs (Brakes) */}
      <Panel title="Fresh — fruit, veg & herbs" sub={`Brakes · per week · ~£${freshSpend.toFixed(2)}`} accent="#A3E635">
        {freshGroups.map(g => (
          <div key={g.group} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A3E635', fontWeight: 700, marginBottom: 4 }}>{g.group}</div>
            {g.items.map(f => (
              <div key={f.name} style={{ display: 'grid', gridTemplateColumns: '130px 120px 1fr', gap: 12, alignItems: 'baseline', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '6px 4px 0' }}>
                <div style={{ fontSize: 13, color: 'var(--cream)' }}>{f.name}</div>
                <div style={{ fontSize: 15, color: '#A3E635', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{f.order} <span style={{ fontSize: 11, color: 'var(--cream-dim)', fontWeight: 400 }}>× {f.unit}</span></div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.4 }}>{f.note}</div>
              </div>
            ))}
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 4, fontStyle: 'italic' }}>
          From your <strong>real Brakes order history</strong> (Jun 2025–Mar 2026), in Brakes pack sizes. Limes lead (juice +
          garnish) and run ~double in summer. Herbs are perishable — order little &amp; often. Full picture on the Perishables tab.
        </div>
      </Panel>

      {/* Caveat */}
      <div style={{ fontSize: 11, color: 'var(--gold-dim)', lineHeight: 1.6 }}>
        Baseline = February 2026 (first full post-reopening month, a quiet time of year). You're heading into summer, which
        trades higher — use the “Going into June” preset (+35%) for the fast movers and recalibrate after the first couple of
        weekends. Spirit lines are direct-measure rates; cocktails add the base-spirit top-up noted above. Kegs are whole
        units; don't stack up stout & cider (one keg of each covers 1½–2 weeks).
      </div>
    </div>
  )
}
