import React, { useState, useEffect } from 'react'
import {
  USE_OF_FUNDS,
  USE_OF_FUNDS_RANGES,
  computeDealFromInvestment,
} from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

// UseOfFunds — minimum-viable-raise calculator for No Dice Hackney.
// Six sliders (5 continuous + rent snap). Founder (888999) edits and Locks.
// Locked snapshot persists per browser via LockedUseOfFundsContext and flows
// downstream into Investment Summary, Waterfall Returns and the Cashflow
// Forecast sub-tab.
//
// Default starting values come from USE_OF_FUNDS — these are the conservative
// "max ask" for each line. Drag down to find the floor that still gets the
// venue safe and reopen-ready. When trading begins, run further rounds.

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// Slider order on the slide. `key` matches USE_OF_FUNDS_RANGES + USE_OF_FUNDS.
const ORDER = ['stock', 'rent', 'garden', 'interior', 'marketing', 'legals']

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

// Build the snapshot shape from a values map.
function snapshotOf(v) {
  return {
    stock: v.stock,
    rentMonths: v.rentMonths,
    rent: v.rent,
    garden: v.garden,
    interior: v.interior,
    marketing: v.marketing,
    legals: v.legals,
    total: v.stock + v.rent + v.garden + v.interior + v.marketing + v.legals,
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
          {fmt(display.total)} · Minimum Viable Raise
        </h2>
        <p style={{ fontSize: 14, color: '#9CA3AF', maxWidth: 760, lineHeight: 1.6 }}>
          Drag each slider to find how little we need to raise to get the venue safe and reopen-ready. The 50/50 split is fixed (pure pro-rata, single share class) — pre-money flexes to equal the investment so the equity outcome holds, and the implied EBITDA multiple is the derived result. When trading begins we run further rounds priced off live performance, not this seed pre-money.
        </p>
      </div>

      {/* Headline cards — total raise, fixed 50/50 split, implied multiple, post-money */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <HeadlineCard label="TOTAL RAISE"        value={fmt(display.total)}                          colour={isLocked ? '#10B981' : '#C9A84C'} sub={isLocked ? 'Locked snapshot' : 'Live preview'} />
        <HeadlineCard label="50/50 SPLIT"        value="LOCKED"                                       colour="#A78BFA"                          sub="Pure pro-rata · single share class" />
        <HeadlineCard label="IMPLIED MULTIPLE"   value={`${deal.impliedMult.toFixed(2)}×`}            colour="#4FC3F7"                          sub="Pre-money ÷ 2025 EBITDA" />
        <HeadlineCard label="POST-MONEY"          value={fmt(deal.postMoney)}                          colour="#2DD4BF"                          sub={`Pre-money ${fmt(deal.preMoney)} + raise`} />
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

      {/* Sliders */}
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
        <div style={{ borderTop: '1px solid rgba(201,168,76,0.2)', marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 600 }}>Total raise</span>
          <span className="serif" style={{ fontSize: 18, color: isLocked ? '#10B981' : 'var(--gold)' }}>{fmt(display.total)}</span>
        </div>
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
