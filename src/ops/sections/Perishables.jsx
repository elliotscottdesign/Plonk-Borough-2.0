import React, { useState } from 'react'
import { BRAKES } from '../data/brakesData.js'

// ─── Perishables (Brakes) — spend breakdown + forecast ───────────────────
// Real Brakes order history (fruit / garnish veg / herbs / mixers / sundries),
// cross-referenced with till sales so spend can be forecast from projected
// sales: fruit & veg ≈ 0.77% of drink sales; limes ≈ 11 kg / 100 cocktails.

const money = (n) => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })
const MONTH_LABEL = (m) => new Date(m + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
const CAT_COLOR = (n) => n.startsWith('Fruit · citrus') ? '#A3E635' : n.startsWith('Fruit') ? '#FDBA74'
  : n.startsWith('Garnish') ? '#34D399' : n.startsWith('Herbs') ? '#6EE7B7'
  : n.startsWith('Mixers') ? '#67E8F9' : n.startsWith('Coffee') ? '#C4B5FD'
  : n.startsWith('Spirits') ? '#F472B6' : '#94A3B8'

export default function Perishables() {
  const m = BRAKES.meta
  // Forecast: enter expected weekly DRINK sales → perishable spend.
  const [weekSales, setWeekSales] = useState(7000)
  const fruitVegFc = weekSales * BRAKES.forecast.fruitVegPctOfDrinkSales
  // limes scale with sales off the cross-referenced baseline (≈£7k/wk → ~11 kg)
  const limeKgFc = (weekSales / 7000) * 11
  const limeCasesFc = Math.ceil(limeKgFc / 4)
  const maxCat = Math.max(...BRAKES.categories.map(c => c.spend))
  const maxMo = Math.max(...BRAKES.monthly.map(x => x.spend))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="serif" style={{ fontSize: 22, color: 'var(--cream)' }}>Perishables · Brakes</div>
      <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6, maxWidth: 800 }}>
        Your real Brakes order history — fruit, garnish veg, herbs, mixers and sundries — over {m.months} months
        ({m.orders} orders). Citrus dominates; limes alone are ~42% of spend (juice + garnish). Cross-referenced with till
        sales below so you can forecast the spend from projected sales.
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
        {[
          ['Total spend', money(m.totalSpend), m.span],
          ['Per week', money(m.weekly), `~${money(m.monthly)}/mo`],
          ['Fruit & veg', money(m.fruitVegWeekly) + '/wk', 'the forecastable core'],
          ['Orders', m.orders, `~${money(m.totalSpend / m.orders)} each`],
        ].map(([l, v, s]) => (
          <div key={l} style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)' }}>{l}</div>
            <div className="serif" style={{ fontSize: 24, color: 'var(--gold)', lineHeight: 1.2 }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Forecast calculator */}
      <div style={{ background: 'rgba(163,230,53,0.06)', border: '1px solid rgba(163,230,53,0.3)', borderRadius: 10, padding: 18 }}>
        <div className="serif" style={{ fontSize: 16, color: '#A3E635', marginBottom: 4 }}>Forecast from sales</div>
        <div style={{ fontSize: 12, color: 'var(--cream-dim)', marginBottom: 14 }}>
          Fruit &amp; veg tracks drink sales tightly (≈{(BRAKES.forecast.fruitVegPctOfDrinkSales * 100).toFixed(2)}% of drink takings, every month). Enter an expected week:
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, color: 'var(--cream)' }}>
            Expected drink sales / week:{' '}
            <span style={{ color: 'var(--cream-dim)' }}>£</span>
            <input type="number" value={weekSales} min="0" step="500" onChange={e => setWeekSales(Math.max(0, Number(e.target.value)))}
              style={{ width: 100, marginLeft: 4, padding: '6px 8px', fontSize: 13, borderRadius: 6, background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--cream)', outline: 'none' }} />
          </label>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cream-dim)' }}>Fruit &amp; veg spend</div><div className="serif" style={{ fontSize: 22, color: '#A3E635' }}>{money(fruitVegFc)}/wk</div></div>
            <div><div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cream-dim)' }}>Limes</div><div className="serif" style={{ fontSize: 22, color: '#A3E635' }}>~{limeKgFc.toFixed(0)} kg <span style={{ fontSize: 13, color: 'var(--cream-dim)' }}>({limeCasesFc} × 4kg)</span></div></div>
            <div><div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cream-dim)' }}>All Brakes (est.)</div><div className="serif" style={{ fontSize: 22, color: 'var(--gold)' }}>{money(fruitVegFc / 0.73)}/wk</div></div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--cream-dim)', marginTop: 10, fontStyle: 'italic' }}>
          Summer pushes limes ~double on the same sales (more margaritas/spritzes) — lean to the high side Jun–Aug.
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 18 }}>
        <div className="serif" style={{ fontSize: 16, color: 'var(--gold)', marginBottom: 12 }}>Spend by category</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BRAKES.categories.map(c => (
            <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 110px', gap: 10, alignItems: 'center', fontSize: 12 }}>
              <div style={{ color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
              <div style={{ height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${(c.spend / maxCat) * 100}%`, height: '100%', background: CAT_COLOR(c.name) }} />
              </div>
              <div style={{ textAlign: 'right', color: 'var(--cream)', fontVariantNumeric: 'tabular-nums' }}>{money(c.spend)} <span style={{ color: 'var(--cream-dim)' }}>· {money(c.weekly)}/wk</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly trend */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 18 }}>
        <div className="serif" style={{ fontSize: 16, color: 'var(--gold)', marginBottom: 2 }}>Spend by month</div>
        <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 14 }}>Summer (Jul/Aug) runs highest; Jan dips with the part-closure.</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
          {BRAKES.monthly.map(x => (
            <div key={x.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 9, color: 'var(--cream-dim)' }}>{money(x.spend)}</div>
              <div style={{ width: '72%', height: `${(x.spend / maxMo) * 90}px`, background: 'var(--gold)', borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
              <div style={{ fontSize: 9, color: 'var(--cream-dim)' }}>{MONTH_LABEL(x.month)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top items */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 18 }}>
        <div className="serif" style={{ fontSize: 16, color: 'var(--gold)', marginBottom: 12 }}>Top items</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px', gap: 8, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cream-dim)', paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>Item</div><div style={{ textAlign: 'right' }}>Spend</div><div style={{ textAlign: 'right' }}>Qty · pack</div>
        </div>
        {BRAKES.topItems.map(it => (
          <div key={it.name} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px', gap: 8, alignItems: 'center', fontSize: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
            <div style={{ textAlign: 'right', color: 'var(--cream)', fontVariantNumeric: 'tabular-nums' }}>{money(it.spend)}</div>
            <div style={{ textAlign: 'right', color: 'var(--cream-dim)', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>{it.qty}× {it.pack}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, color: 'var(--gold-dim)', lineHeight: 1.6 }}>
        Source · 31 Brakes invoices, {m.span}, parsed line-by-line. Forecast ratios cross-referenced with Lightspeed
        cocktails + drink sales (Oct–Dec, Feb): fruit &amp; veg ≈ {(BRAKES.forecast.fruitVegPctOfDrinkSales * 100).toFixed(2)}% of drink sales,
        limes ≈ {BRAKES.forecast.limesKgPer100Cocktails} kg / 100 cocktails. The fruit order on the Stock Orders tab uses these real quantities.
      </div>
    </div>
  )
}
