import React, { useState, useEffect } from 'react'
import {
  USE_OF_FUNDS,
  USE_OF_FUNDS_RANGES,
  HACKNEY_RAISE_TARGET,
  computeDealFromInvestment,
} from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

// UseOfFunds — Hackney use-of-funds allocator.
// Total raise is fixed at HACKNEY_RAISE_TARGET (£100k). Six explicit sliders
// allocate spend across stock / rent / garden / interior / marketing / legals;
// Working Capital is the 7th line — derived as RAISE_TARGET minus the sum of
// the six, displayed full-width below as a disabled slider so the residual is
// visible at a glance. Drag stock down → working capital up. Founder (888999)
// edits and Locks. Locked snapshot persists via LockedUseOfFundsContext and
// flows into Investment Summary, Waterfall Returns and the Cashflow Forecast.

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// Slider order on the slide. `key` matches USE_OF_FUNDS_RANGES + USE_OF_FUNDS.
const ORDER = ['stock', 'rent', 'garden', 'interior', 'marketing', 'legals']

// Working capital is the residual of the fixed total minus the six explicit
// slider allocations. Returns a positive number; negative would indicate the
// founder has over-allocated, which we cap at zero (and surface visually).
function computeWorkingCapital(snap) {
  const allocated = snap.stock + snap.rent + snap.garden + snap.interior + snap.marketing + snap.legals
  return Math.max(0, HACKNEY_RAISE_TARGET - allocated)
}

// Build a map of defaults from the static USE_OF_FUNDS list. Rent default is
// 3 months (the original spec); others use their static `amount`.
function defaultValues() {
  const byKey = Object.fromEntries(USE_OF_FUNDS.map(u => [u.key, u]))
  return {
    stock:     byKey.stock.amount,      // £24,000
    rentMonths: 3,                      // snap-slider position
    rent:      byKey.rent.amount,       // £26,750
    garden:    byKey.garden.amount,     // £12,000
    interior:  byKey.interior.amount,   // £10,000
    marketing: byKey.marketing.amount,  // £3,000
    legals:    byKey.legals.amount,     // £2,000
  }
}

// Build the snapshot shape from a values map. Total raise is fixed at the
// raise target; working capital absorbs the residual.
function snapshotOf(v) {
  const allocated = v.stock + v.rent + v.garden + v.interior + v.marketing + v.legals
  return {
    stock: v.stock,
    rentMonths: v.rentMonths,
    rent: v.rent,
    garden: v.garden,
    interior: v.interior,
    marketing: v.marketing,
    legals: v.legals,
    workingCapital: Math.max(0, HACKNEY_RAISE_TARGET - allocated),
    total: HACKNEY_RAISE_TARGET,
    allocated,                  // sum of explicit slider amounts (excl. working capital)
  }
}

// Map from rentMonths (1/2/3) to the £ deposit per the lease.
function rentAmountForMonths(months) {
  const snap = USE_OF_FUNDS_RANGES.rent.snaps.find(s => s.months === months)
  return snap ? snap.amount : USE_OF_FUNDS_RANGES.rent.snaps[2].amount
}

export default function UseOfFunds() {
  const { snapshot, isLocked, isFounder, canEdit, lock, unlock } = useLockedUseOfFunds()

  // Live slider state — seeded from locked snapshot (if any) or defaults.
  const [values, setValues] = useState(() =>
    snapshot
      ? { stock: snapshot.stock, rentMonths: snapshot.rentMonths, rent: snapshot.rent,
          garden: snapshot.garden, interior: snapshot.interior, marketing: snapshot.marketing,
          legals: snapshot.legals }
      : defaultValues()
  )

  // If the snapshot changes externally (e.g. founder unlocks elsewhere),
  // re-sync the slider positions.
  useEffect(() => {
    if (snapshot) {
      setValues({
        stock: snapshot.stock, rentMonths: snapshot.rentMonths, rent: snapshot.rent,
        garden: snapshot.garden, interior: snapshot.interior, marketing: snapshot.marketing,
        legals: snapshot.legals,
      })
    }
  }, [snapshot])

  // What the slide currently shows: locked snapshot wins, else live sliders.
  const display = isLocked ? snapshot : snapshotOf(values)
  const deal = computeDealFromInvestment(display.total)

  const set = (k, v) => setValues(prev => {
    const next = { ...prev, [k]: v }
    if (k === 'rentMonths') next.rent = rentAmountForMonths(v)
    return next
  })

  const handleLock = () => lock(snapshotOf(values))
  const handleReset = () => {
    if (!isFounder) return
    if (isLocked) unlock()
    setValues(defaultValues())
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: '#4FC3F7', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Use of Investment Funds</div>
        <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
          {fmt(display.total)} Investment · 50/50 Equity Split
        </h2>
        <p style={{ fontSize: 14, color: '#9CA3AF', maxWidth: 760, lineHeight: 1.6 }}>
          The total raise is fixed at {fmt(HACKNEY_RAISE_TARGET)}. Drag the six sliders to allocate spend across stock, rent, garden, interior, marketing, and legals — Working Capital absorbs whatever's left, sitting as float for early trading. The 50/50 equity split is fixed (pure pro-rata, single share class); pre-money equals the investment, so the implied EBITDA multiple is the derived result. Further rounds price off live trading, not this seed pre-money.
        </p>
      </div>

      {/* Headline cards — total raise, fixed 50/50 split, allocated vs working capital, post-money */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <HeadlineCard label="TOTAL RAISE"        value={fmt(display.total)}                          colour={isLocked ? '#10B981' : '#C9A84C'} sub={isLocked ? 'Locked snapshot' : 'Live preview'} />
        <HeadlineCard label="ALLOCATED"          value={fmt(display.allocated)}                       colour="#4FC3F7"                          sub={`${((display.allocated/display.total)*100).toFixed(1)}% of raise · 6 sliders`} />
        <HeadlineCard label="WORKING CAPITAL"     value={fmt(display.workingCapital)}                  colour="#2DD4BF"                          sub={`${((display.workingCapital/display.total)*100).toFixed(1)}% of raise · residual float`} />
        <HeadlineCard label="50/50 SPLIT"         value={`${deal.impliedMult.toFixed(2)}× EBITDA`}     colour="#A78BFA"                          sub={`Post-money ${fmt(deal.postMoney)}`} />
      </div>

      {/* Lock / Reset / Founder gate */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', marginBottom: 20, background:'var(--ink-2)', border: `1px solid ${isLocked ? 'rgba(16,185,129,0.4)' : 'rgba(201,168,76,0.2)'}`, borderRadius: 10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: isLocked ? '#10B981' : 'var(--gold-dim)' }} />
          <div>
            <div style={{ fontSize: 12, color: 'var(--cream)', fontWeight: 600 }}>
              {isLocked
                ? `Locked · ${snapshot?.lockedAt ? new Date(snapshot.lockedAt).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' }) : ''}`
                : isFounder ? 'Editable — drag the sliders, then Lock to save' : 'Read-only · only the founder (888999) can edit'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 2 }}>
              Locked values flow into Investment Summary · Waterfall Returns · Cashflow Forecast.
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          <button onClick={handleReset} disabled={!isFounder} style={btnStyle({ disabled: !isFounder, ghost: true })}>Reset</button>
          {isLocked ? (
            <button onClick={() => unlock()} disabled={!isFounder} style={btnStyle({ disabled: !isFounder, gold: true })}>Unlock</button>
          ) : (
            <button onClick={handleLock} disabled={!canEdit} style={btnStyle({ disabled: !canEdit, gold: true })}>Lock</button>
          )}
        </div>
      </div>

      {/* Sliders — 6 explicit allocations in a 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {ORDER.map(key => {
          const meta = USE_OF_FUNDS.find(u => u.key === key)
          if (key === 'rent') {
            return (
              <RentSnapSlider
                key={key}
                meta={meta}
                months={isLocked ? snapshot.rentMonths : values.rentMonths}
                onChange={(m) => set('rentMonths', m)}
                disabled={!canEdit}
              />
            )
          }
          const range = USE_OF_FUNDS_RANGES[key]
          return (
            <ContinuousSlider
              key={key}
              meta={meta}
              range={range}
              value={isLocked ? snapshot[key] : values[key]}
              onChange={(v) => set(key, v)}
              disabled={!canEdit}
            />
          )
        })}
      </div>

      {/* Working Capital — full-width residual slider, always disabled */}
      <WorkingCapitalSlider amount={display.workingCapital} target={HACKNEY_RAISE_TARGET} allocated={display.allocated} />

      {/* Per-line summary table */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 10, padding: 20, marginTop: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 14 }}>Allocation summary</div>
        {ORDER.map(key => {
          const meta = USE_OF_FUNDS.find(u => u.key === key)
          const amount = display[key]
          const pct = display.total > 0 ? amount / display.total : 0
          return (
            <div key={key} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--cream)' }}>{meta.item}{key === 'rent' ? ` (${display.rentMonths} ${display.rentMonths === 1 ? 'month' : 'months'})` : ''}</span>
                <span style={{ fontSize: 13, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>{fmt(amount)} <span style={{ color: 'var(--cream-dim)', fontSize: 11 }}>· {(pct * 100).toFixed(1)}%</span></span>
              </div>
              <div style={{ height: 4, background: 'rgba(201,168,76,0.08)', borderRadius: 2 }}>
                <div style={{ width: `${pct * 100}%`, height: '100%', background: 'var(--gold)', borderRadius: 2 }} />
              </div>
            </div>
          )
        })}
        {/* Working Capital row — derived */}
        {(() => {
          const amount = display.workingCapital
          const pct = display.total > 0 ? amount / display.total : 0
          return (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--teal)' }}>Working Capital <span style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>· residual</span></span>
                <span style={{ fontSize: 13, color: 'var(--teal)', fontVariantNumeric: 'tabular-nums' }}>{fmt(amount)} <span style={{ color: 'var(--cream-dim)', fontSize: 11 }}>· {(pct * 100).toFixed(1)}%</span></span>
              </div>
              <div style={{ height: 4, background: 'rgba(45,212,191,0.08)', borderRadius: 2 }}>
                <div style={{ width: `${pct * 100}%`, height: '100%', background: 'var(--teal)', borderRadius: 2 }} />
              </div>
            </div>
          )
        })()}
        <div style={{ borderTop: '1px solid rgba(201,168,76,0.2)', marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600 }}>Total raise</span>
          <span className="serif" style={{ fontSize: 18, color: isLocked ? '#10B981' : 'var(--gold)' }}>{fmt(display.total)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Working Capital — full-width disabled slider (residual display) ──
function WorkingCapitalSlider({ amount, target, allocated }) {
  const pct = target > 0 ? Math.min(1, amount / target) : 0
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 10, padding: 18, marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 500 }}>
          Working Capital <span style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 8 }}>residual · auto-filled</span>
        </span>
        <span style={{ fontSize: 18, color: 'var(--teal)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(amount)}</span>
      </div>
      {/* Visual track — read-only, teal-coloured to distinguish from gold input sliders */}
      <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden', cursor: 'not-allowed' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: 'linear-gradient(90deg, var(--teal), rgba(45,212,191,0.6))', borderRadius: 4, transition: 'width 0.2s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--cream-dim)', marginTop: 6 }}>
        <span>£0</span>
        <span style={{ fontStyle: 'italic' }}>= {fmt(target)} target − {fmt(allocated)} allocated across the 6 sliders above</span>
        <span>{fmt(target)}</span>
      </div>
    </div>
  )
}

function HeadlineCard({ label, value, sub, colour }) {
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 18 }}>
      <div style={{ fontSize: 10, color: 'var(--cream-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div className="serif" style={{ fontSize: 'clamp(1.4rem, 2.4vw, 1.8rem)', color: colour, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{sub}</div>
    </div>
  )
}

function ContinuousSlider({ meta, range, value, onChange, disabled }) {
  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
        <span style={{ fontSize:13, color:'var(--cream)', fontWeight:500 }}>{meta.item}</span>
        <span style={{ fontSize:15, color:'var(--gold)', fontVariantNumeric:'tabular-nums' }}>{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={range.min} max={range.max} step={range.step}
        value={value}
        onChange={e => onChange(+e.target.value)}
        disabled={disabled}
        style={{ width:'100%', accentColor:'var(--gold)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
      />
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--gold-dim)', marginTop:4 }}>
        <span>{fmt(range.min)}</span>
        <span style={{ fontSize:10, color:'var(--cream-dim)' }}>{meta.note}</span>
        <span>{fmt(range.max)} {meta.vat || ''}</span>
      </div>
    </div>
  )
}

function RentSnapSlider({ meta, months, onChange, disabled }) {
  const snaps = USE_OF_FUNDS_RANGES.rent.snaps
  const current = snaps.find(s => s.months === months) || snaps[2]
  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
        <span style={{ fontSize:13, color:'var(--cream)', fontWeight:500 }}>{meta.item}</span>
        <span style={{ fontSize:15, color:'var(--gold)', fontVariantNumeric:'tabular-nums' }}>{fmt(current.amount)}</span>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {snaps.map(s => {
          const active = s.months === months
          return (
            <button
              key={s.months}
              onClick={() => onChange(s.months)}
              disabled={disabled}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 12,
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: active ? 'rgba(201,168,76,0.2)' : 'transparent',
                border: `1px solid ${active ? 'var(--gold)' : 'rgba(201,168,76,0.25)'}`,
                color: active ? 'var(--gold)' : 'var(--cream-dim)',
                fontWeight: active ? 600 : 400,
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              {s.label}
              <span style={{ display:'block', fontSize:10, color:'var(--cream-dim)', marginTop:2 }}>{fmt(s.amount)}</span>
            </button>
          )
        })}
      </div>
      <div style={{ fontSize:10, color:'var(--gold-dim)', marginTop:8 }}>{meta.note}</div>
    </div>
  )
}

function btnStyle({ disabled = false, gold = false, ghost = false }) {
  const base = {
    padding: '8px 18px', borderRadius: 6, fontSize: 12, letterSpacing: '0.05em', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.4 : 1,
  }
  if (gold) return { ...base, background: 'var(--gold)', color: 'var(--ink)', border: '1px solid var(--gold)' }
  if (ghost) return { ...base, background: 'transparent', color: 'var(--cream-dim)', border: '1px solid rgba(201,168,76,0.3)' }
  return base
}
