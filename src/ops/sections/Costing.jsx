import React, { useState, useMemo, useEffect } from 'react'
import {
  INGREDIENTS,
  RECIPES,
  CATEGORIES,
  VAT_RATE,
  loadOverrides,
  saveOverrides,
  costForRecipe,
  marginForRecipe,
  priceToHitMargin,
} from '../data/costing.js'
import OpsBrandHeader from '../components/OpsBrandHeader.jsx'

// ─── Stock Costing — live margin tool ─────────────────────────────────
// One tab per drink category (Draught, Cocktails, Wines, etc.). Per row:
// sell price (editable, defaults to menu), live cost-per-serve computed
// from the recipe + ingredient cost map, GP £ and GP %, flag vs target
// margin, and "Suggest £" = the inc-VAT price you'd need to charge to
// hit the target. Click a row to expand the recipe and edit the
// per-ingredient ex-VAT pack cost. All overrides persist to localStorage
// under STORE_KEY in ../data/costing.js.
// ─────────────────────────────────────────────────────────────────────

const gold = 'var(--gold)'
const cream = 'var(--cream)'
const ink2 = 'rgba(255,255,255,0.04)'
const ink3 = 'rgba(255,255,255,0.08)'
const dim = 'rgba(245,239,227,0.6)'
const green = '#86EFAC'
const amber = '#FBBF24'
const red = '#FB7185'

const fmtMoney = (n) => `£${(Math.round(n * 100) / 100).toFixed(2)}`
const fmtPct = (n) => `${Math.round(n * 100)}%`

export default function Costing() {
  const [activeCat, setActiveCat] = useState('cocktail')
  const [state, setState] = useState(() => loadOverrides())
  const [expanded, setExpanded] = useState(null)

  // Persist on every change.
  useEffect(() => { saveOverrides(state) }, [state])

  const { costs, sells, targets, wastagePct } = state

  const setCost = (id, val) => setState((s) => ({ ...s, costs: { ...s.costs, [id]: val } }))
  const setSell = (id, val) => setState((s) => ({ ...s, sells: { ...s.sells, [id]: val } }))
  const setTarget = (key, val) => setState((s) => ({ ...s, targets: { ...s.targets, [key]: val } }))
  const setWastage = (val) => setState((s) => ({ ...s, wastagePct: val }))
  const resetAll = () => {
    if (confirm('Reset all cost overrides + sell-price overrides + targets back to seed defaults?')) {
      setState({ costs: {}, sells: {}, targets: {}, wastagePct: 5 })
      setExpanded(null)
    }
  }

  // Effective target margin for the active category — override or seed.
  const cat = CATEGORIES.find((c) => c.key === activeCat) || CATEGORIES[0]
  const targetGp = targets[activeCat] ?? cat.targetGp

  // Recipes in the active category.
  const recipes = useMemo(() => RECIPES.filter((r) => r.category === activeCat), [activeCat])

  // Quick stats for the category banner.
  const stats = useMemo(() => {
    if (recipes.length === 0) return null
    let hit = 0, near = 0, miss = 0
    let totalGpPct = 0
    for (const r of recipes) {
      const { gpPct } = marginForRecipe(r, costs, sells[r.id], wastagePct)
      totalGpPct += gpPct
      if (gpPct >= targetGp) hit++
      else if (gpPct >= targetGp - 0.05) near++
      else miss++
    }
    return {
      avg: totalGpPct / recipes.length,
      hit, near, miss, total: recipes.length,
    }
  }, [recipes, costs, sells, wastagePct, targetGp])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, color: cream }}>
      {/* ─── No Dice brand header ────────────────────────────── */}
      <OpsBrandHeader
        eyebrow="Operations · Stock Costing"
        title="Margin sheet"
        subtitle={(
          <>
            Live cost-per-serve and gross margin for every line on the menu. Sell prices
            default to today's menu (inc VAT). Ex-VAT cost prices default to real supplier
            invoices where we have them — <strong style={{ color: cream }}>override as new invoices come in</strong> and the
            margins recompute live. All edits save locally to this device.
          </>
        )}
      />
      <style>{`
        @media print {
          @page { size: A4; margin: 28mm 10mm 12mm 10mm; }
          html, body { background: #ffffff !important; color: #000 !important; }
        }
      `}</style>

      {/* ─── Global controls — wastage % + reset ──────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
        background: ink2, border: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 10,
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ color: dim, textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 700 }}>Wastage</span>
          <NumField
            value={wastagePct}
            onChange={(v) => setWastage(v)}
            style={inpSmall}
          />
          <span style={{ color: dim }}>%</span>
        </label>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={resetAll} style={btnGhost}>Reset overrides</button>
        </div>
      </div>

      {/* ─── Category tabs ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATEGORIES.map((c) => {
          const on = c.key === activeCat
          return (
            <button
              key={c.key}
              onClick={() => { setActiveCat(c.key); setExpanded(null) }}
              style={{
                padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                background: on ? 'rgba(201,168,76,0.16)' : ink2,
                border: `2px solid ${on ? gold : 'rgba(255,255,255,0.1)'}`,
                color: on ? gold : cream, letterSpacing: '0.04em', fontWeight: 600,
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* ─── Category banner ──────────────────────────────────────── */}
      {stats && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center',
          background: ink2, border: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', borderRadius: 10,
        }}>
          <Stat label="Items" value={stats.total} />
          <Stat label="Avg GP %" value={fmtPct(stats.avg)} valueColor={stats.avg >= targetGp ? green : stats.avg >= targetGp - 0.05 ? amber : red} />
          <Stat label="Target" value={fmtPct(targetGp)} editable
            onChange={(v) => setTarget(activeCat, v / 100)}
            inputValue={Math.round(targetGp * 100)}
          />
          <Stat label="Hit target" value={`${stats.hit}/${stats.total}`} valueColor={green} />
          <Stat label="Near miss" value={stats.near} valueColor={amber} />
          <Stat label="Below" value={stats.miss} valueColor={red} />
        </div>
      )}

      {/* ─── Recipe table ─────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: ink2 }}>
              <th style={th}>Item</th>
              <th style={th}>Sell £ (inc VAT)</th>
              <th style={th}>Cost £ / serve</th>
              <th style={th}>GP £</th>
              <th style={th}>GP %</th>
              <th style={th}>Flag</th>
              <th style={th}>Suggest £</th>
              <th style={{ ...th, textAlign: 'right' }}>Recipe</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => {
              const { cost, sellInc, gp, gpPct } = marginForRecipe(r, costs, sells[r.id], wastagePct)
              const suggest = priceToHitMargin(cost, targetGp)
              const flag = gpPct >= targetGp ? { sym: '✓', color: green }
                : gpPct >= targetGp - 0.05 ? { sym: '⚠', color: amber }
                : { sym: '✕', color: red }
              const isOpen = expanded === r.id
              return (
                <React.Fragment key={r.id}>
                  <tr style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: isOpen ? 'rgba(201,168,76,0.06)' : 'transparent',
                  }}>
                    <td style={td}>{r.name}</td>
                    <td style={td}>
                      <NumField
                        value={sellInc}
                        onChange={(v) => setSell(r.id, v)}
                        style={inp}
                      />
                    </td>
                    <td style={td}>{fmtMoney(cost)}</td>
                    <td style={td}>{fmtMoney(gp)}</td>
                    <td style={{ ...td, color: flag.color, fontWeight: 700 }}>{fmtPct(gpPct)}</td>
                    <td style={{ ...td, color: flag.color, fontSize: 16, fontWeight: 700 }}>{flag.sym}</td>
                    <td style={{ ...td, color: dim }}>{Number.isFinite(suggest) ? fmtMoney(suggest) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <button onClick={() => setExpanded(isOpen ? null : r.id)} style={btnGhost}>
                        {isOpen ? 'Close' : 'Open'}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <td colSpan={8} style={{ padding: 14 }}>
                        <RecipeEditor
                          recipe={r}
                          costs={costs}
                          setCost={setCost}
                          wastagePct={wastagePct}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 11, color: dim, lineHeight: 1.5 }}>
        Margin = (Net sell − Cost / serve) ÷ Net sell. Net sell strips {Math.round(VAT_RATE * 100)}% VAT off the menu price.
        Cost / serve = sum of (pack £ ÷ pack ml × ml poured) plus {wastagePct}% wastage. Ingredients tagged "each" (lime
        wedge, gilda) are counted, not ml'd.
      </p>
    </div>
  )
}

// ─── Recipe editor — per-ingredient cost + volume ───────────────────
function RecipeEditor({ recipe, costs, setCost, wastagePct }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {recipe.notes && (
        <div style={{ fontSize: 12, color: dim, fontStyle: 'italic' }}>{recipe.notes}</div>
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(180px, 1.4fr) 80px 110px 110px 110px',
        gap: 8, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: dim, fontWeight: 700,
        padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div>Ingredient</div>
        <div style={{ textAlign: 'right' }}>Volume</div>
        <div style={{ textAlign: 'right' }}>Pack £ ex-VAT</div>
        <div style={{ textAlign: 'right' }}>Pack size</div>
        <div style={{ textAlign: 'right' }}>This serve</div>
      </div>
      {recipe.ingredients.map((ing, i) => {
        const item = INGREDIENTS[ing.id]
        if (!item) return null
        const packCost = costs[ing.id] ?? item.defaultCost ?? 0
        const isCount = item.packMl === 1
        const serveCost = packCost && item.packMl ? (packCost / item.packMl) * ing.ml : 0
        return (
          <div key={`${recipe.id}-${ing.id}-${i}`} style={{
            display: 'grid', gridTemplateColumns: 'minmax(180px, 1.4fr) 80px 110px 110px 110px',
            gap: 8, alignItems: 'center', fontSize: 13,
          }}>
            <div>
              {item.name}{' '}
              <span style={{ color: dim, fontSize: 11 }}>· {item.supplier || ''}</span>
              {item.supplierProduct && (
                <div style={{ fontSize: 10, color: dim, marginTop: 2, lineHeight: 1.3 }}>{item.supplierProduct}</div>
              )}
            </div>
            <div style={{ textAlign: 'right', color: dim }}>{isCount ? `× ${ing.ml}` : `${ing.ml} ml`}</div>
            <div style={{ textAlign: 'right' }}>
              <NumField
                value={packCost}
                onChange={(v) => setCost(ing.id, v)}
                style={{ ...inp, width: 90, textAlign: 'right' }}
              />
            </div>
            <div style={{ textAlign: 'right', color: dim }}>{isCount ? 'each' : `${item.packMl} ml`}</div>
            <div style={{ textAlign: 'right' }}>{fmtMoney(serveCost)}</div>
          </div>
        )
      })}
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(180px, 1.4fr) 80px 110px 110px 110px',
        gap: 8, fontSize: 12, color: dim, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div>+ {wastagePct}% wastage</div><div></div><div></div><div></div>
        <div style={{ textAlign: 'right', color: cream, fontWeight: 700 }}>
          {fmtMoney(costForRecipe(recipe, costs, wastagePct))}
        </div>
      </div>
    </div>
  )
}

// ─── Small stat block in the category banner ──────────────────────
function Stat({ label, value, valueColor = cream, editable = false, onChange, inputValue }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: dim, fontWeight: 700 }}>{label}</div>
      {editable ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NumField
            value={inputValue}
            onChange={onChange}
            style={{ ...inpSmall, width: 60 }}
          />
          <span style={{ color: valueColor, fontSize: 14 }}>%</span>
        </div>
      ) : (
        <div style={{ fontSize: 18, fontWeight: 700, color: valueColor }}>{value}</div>
      )}
    </div>
  )
}

// ─── Editable number field ────────────────────────────────────────────
// Fixes the stuck-leading-zero bug. A plain `value={number}` input with
// `parseFloat(...) || 0` coerces the field to 0 on every keystroke, so a
// typed entry leaves a sticky "0" and won't hold. This keeps a local draft
// string while the field is focused (what you type stays put), selects-all
// on focus (your first keystroke replaces the old value instead of appending
// to it), accepts digits + a single decimal point, and commits the real
// number live as you type. Leaving it blank reverts to the saved value.
function NumField({ value, onChange, style }) {
  const [draft, setDraft] = useState(null)
  const shown = draft != null ? draft : (value == null ? '' : String(value))
  return (
    <input
      type="text"
      inputMode="decimal"
      value={shown}
      onFocus={(e) => { setDraft(value == null ? '' : String(value)); e.target.select() }}
      onChange={(e) => {
        let v = e.target.value.replace(/[^0-9.]/g, '')
        const dot = v.indexOf('.')
        if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '')
        setDraft(v)
        const n = parseFloat(v)
        if (!isNaN(n)) onChange(n)
      }}
      onBlur={() => setDraft(null)}
      style={style}
    />
  )
}

// ─── Styles ──
const th = {
  textAlign: 'left', padding: '10px 12px',
  fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: dim, fontWeight: 700,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
}
const td = { padding: '8px 12px', verticalAlign: 'middle' }
const inp = {
  background: ink3, border: '1px solid rgba(255,255,255,0.12)', color: cream,
  padding: '6px 8px', borderRadius: 6, width: 80, fontSize: 13,
}
const inpSmall = {
  background: ink3, border: '1px solid rgba(255,255,255,0.12)', color: cream,
  padding: '4px 6px', borderRadius: 6, width: 60, fontSize: 12,
}
const btnGhost = {
  background: 'transparent', color: cream, border: '1px solid rgba(255,255,255,0.18)',
  padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
}
