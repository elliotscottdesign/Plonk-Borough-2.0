import React, { useEffect, useState } from 'react'
import { useLockedFunding } from '../components/LockedFundingContext.jsx'
import { ACTUALS_2025 } from '../data.js'

// Borough Growth Drivers Calculator — investor-facing breakdown of HOW
// the deck gets to the headline 10% / 15% / 20% growth scenarios used
// elsewhere. Bar takings + games / golf volume are the two profit
// engines; everything on this slide is a strategy that increases the
// underlying volume (with the exception of Bar Price Uplift, which is
// the only price-side lever and is sized on the 2026 Performance tab).
//
// Layout:
//   • Three Conservative / Base Case / Optimistic scenario cards at the
//     top — read-only "thermometer" highlighting whichever bracket the
//     current slider sum falls into (10% / 15% / 20%).
//   • A live total strip with the £ uplift value the slider sum produces
//     against the 2025 baseline.
//   • Six driver sliders, each with its own 🔒 Lock button (founder
//     only) so the founder can pin individual lines while still letting
//     others stay editable.
//   • Bar Price Uplift section — read-only here, sized on 2026 Performance.

// v2 = bumped when DJ default lifted from 2% → 10% to reflect the
// £1,500/week DJ uplift assumption (Sat £1k + Fri £500). Keeps stale
// localStorage values from masking the new default.
const STORAGE_KEY        = 'ndb_growth_drivers_v2'
const STORAGE_LOCKS_KEY  = 'ndb_growth_drivers_locks_v2'
const BAR_PRICE_KEY      = 'ndb_bar_price_uplift_v1'
const BAR_PRICE_LOCK_KEY = 'ndb_bar_price_uplift_locked_v1'

const DRIVER_DEFS = [
  {
    key: 'seo',
    title: 'SEO Rebuild from Day 1',
    intro: 'Restore organic search rankings under No Dice Borough — Lithos SEO programme rebuilds authority lost in the brand transition. 301 redirects preserve domain authority; structured data + local schema lift visibility for "Borough Market bar", "late-night SE1" and adjacent searches.',
    color: '#22D3EE',
    defaultPct: 3,
  },
  {
    key: 'ads',
    title: 'Google Ads at Scale',
    intro: 'Proven £0.32 CPC and 5.7% conversion rate from the Nov–Dec 2025 campaign — 105 conversions in 37 days at £580 spend. Scale to £600/mth = ~107 conversions/month with verified unit economics. Direct, measurable demand capture.',
    color: '#A78BFA',
    defaultPct: 3,
  },
  {
    key: 'corporate',
    title: 'Corporate Events Pipeline',
    intro: 'Private hire revenue £44,999 in 2025. Bookings manager focused on team away days, exclusive hires and Christmas parties. High-margin, pre-paid bookings with minimal incremental cost — fills the Mon–Wed slots that under-trade.',
    color: '#10B981',
    defaultPct: 3,
  },
  {
    key: 'dj',
    title: 'DJ Nights Programme',
    intro: 'Anchor lever for the weekend bar. A good Saturday today rings ~£3,500 inc VAT on the bar; a great Saturday with a busy DJ room takes us to £5,000 — DJ programming is worth ~£1,000/Sat of that uplift. Same playbook on Fridays adds ~£500/Fri inc VAT. £1,500/week × 52 = £78k/year inc VAT, all incremental to walk-in trade with zero additional fixed cost. Borough Market location draws natural late-night footfall.',
    color: '#F472B6',
    defaultPct: 10,
  },
  {
    key: 'repricing',
    title: 'Gaming Repricing',
    intro: '+£1 across pool and mini golf affects 100k+ annual plays. Minimal customer resistance — current price points have not moved in 3+ years. Direct P&L impact with zero cost increase.',
    color: '#FBBF24',
    defaultPct: 2,
  },
  {
    key: 'development',
    title: 'Development Licence',
    intro: '500m² of developable basement directly under the venue (rights held in the lease, structural costs landlord-borne), front-yard reclaimable on next breach, and a licence variation pipeline to extend trading hours. Material capacity uplift inside the existing footprint.',
    color: '#FB923C',
    defaultPct: 2,
  },
]

// 2025 verified figures — sourced from data.js so the £ contributions
// stay in sync with the rest of the deck if the baseline ever shifts.
const BAR_2025_BOROUGH = 362836
const REVENUE_2025     = ACTUALS_2025.revenue   // £741,644

const SCENARIOS = [
  { key:'conservative', label:'Conservative', pct:10, color:'#F87171',     bgActive:'rgba(248,113,113,0.15)', borderActive:'#F87171' },
  { key:'base',         label:'Base Case',    pct:15, color:'var(--gold)', bgActive:'rgba(201,168,76,0.15)',  borderActive:'var(--gold)' },
  { key:'optimistic',   label:'Optimistic',   pct:20, color:'#2DD4BF',     bgActive:'rgba(45,212,191,0.15)',  borderActive:'#2DD4BF' },
]

// Map a live total to whichever scenario card should highlight. >22% still
// pins to Optimistic — the live total banner reads the actual figure, so
// over-shoots are visible there.
const activeScenarioFor = (total) => {
  if (total < 12.5) return 'conservative'
  if (total < 17.5) return 'base'
  return 'optimistic'
}

const fmtMoney = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// Persistence helpers — small enough to inline, no need for a context.
const readPersisted = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed != null ? parsed : fallback
  } catch { return fallback }
}
const writePersisted = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}
const clearPersisted = (key) => {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}

// Founder gate — PasswordGate at 888999 sets sessionStorage.ndb_founder
// (NOT ndb_plonk — that's a legacy key actively removed at login).
const isFounderSession = () => {
  try { return sessionStorage.getItem('ndb_founder') === '1' } catch { return false }
}

const emptyLocks = () => Object.fromEntries(DRIVER_DEFS.map(d => [d.key, null]))

export default function GrowthDrivers() {
  // Eat funding context to keep parity with the rest of the deck even though
  // this slide doesn't directly use the funding amount — ensures the React
  // tree is consistent.
  useLockedFunding()

  const isFounder = isFounderSession()

  // Drivers state — { seo: 3, ads: 3, ... }. Locks are per-driver:
  // { seo: 3.0 | null, ads: null, ... } — null means unlocked.
  const defaultDrivers = Object.fromEntries(DRIVER_DEFS.map(d => [d.key, d.defaultPct]))
  const [drivers, setDrivers] = useState(() => readPersisted(STORAGE_KEY, defaultDrivers))
  const [locks, setLocks]     = useState(() => readPersisted(STORAGE_LOCKS_KEY, emptyLocks()))

  // Bar price uplift — sized on the 2026 Performance tab; surfaced read-only here.
  const [barPriceUplift, setBarPriceUpliftLocal] = useState(() => readPersisted(BAR_PRICE_KEY, 0))
  const [barPriceLocked, setBarPriceLocked]      = useState(() => readPersisted(BAR_PRICE_LOCK_KEY, null))

  // Subscribe to other tabs' updates so values stay in sync across pages.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === BAR_PRICE_KEY)       setBarPriceUpliftLocal(readPersisted(BAR_PRICE_KEY, 0))
      if (e.key === BAR_PRICE_LOCK_KEY)  setBarPriceLocked(readPersisted(BAR_PRICE_LOCK_KEY, null))
      if (e.key === STORAGE_KEY)         setDrivers(readPersisted(STORAGE_KEY, defaultDrivers))
      if (e.key === STORAGE_LOCKS_KEY)   setLocks(readPersisted(STORAGE_LOCKS_KEY, emptyLocks()))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Effective values — locked snapshot wins per-driver when present.
  const effectiveDrivers = Object.fromEntries(
    DRIVER_DEFS.map(d => [d.key, locks[d.key] != null ? locks[d.key] : (drivers[d.key] || 0)])
  )
  const effectiveBarUplift = barPriceLocked != null ? barPriceLocked : barPriceUplift
  const driverTotal        = DRIVER_DEFS.reduce((s, d) => s + effectiveDrivers[d.key], 0)
  const total              = driverTotal + effectiveBarUplift
  const totalGBP           = REVENUE_2025 * (total / 100)
  const activeKey          = activeScenarioFor(total)

  const setDriver = (key, val) => {
    if (!isFounder || locks[key] != null) return
    setDrivers(prev => {
      const next = { ...prev, [key]: val }
      writePersisted(STORAGE_KEY, next)
      return next
    })
  }

  const lockDriver = (key) => {
    if (!isFounder || locks[key] != null) return
    const nextLocks = { ...locks, [key]: drivers[key] }
    setLocks(nextLocks)
    writePersisted(STORAGE_LOCKS_KEY, nextLocks)
  }

  const unlockDriver = (key) => {
    if (!isFounder || locks[key] == null) return
    const nextLocks = { ...locks, [key]: null }
    setLocks(nextLocks)
    writePersisted(STORAGE_LOCKS_KEY, nextLocks)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8, lineHeight: 1.1 }}>
        How we get to +10% / +15% / +20%
      </h2>
      <p style={{ fontSize: 15, color: 'var(--cream-dim)', maxWidth: 760, lineHeight: 1.6, marginBottom: 28 }}>
        Bar takings and games / golf volume are the two profit engines. Drag each slider below to attribute its share of the headline annual uplift; the scenario indicator at the top reflects whichever bracket the live total falls into. The total is what flows into the Custom scenario for Investor Returns, Cashflow and the KPI strip.
      </p>

      {/* Top scenario indicator — read-only, derived from driver totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {SCENARIOS.map(sc => {
          const isActive = sc.key === activeKey
          return (
            <div key={sc.key} style={{
              padding: '16px 20px', borderRadius: 10,
              background: isActive ? sc.bgActive : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isActive ? sc.borderActive : 'rgba(255,255,255,0.06)'}`,
              opacity: isActive ? 1 : 0.5,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
            }}>
              <div>
                <div style={{ fontSize: 10, color: isActive ? sc.color : 'var(--cream-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                  {sc.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 4 }}>
                  on £{REVENUE_2025.toLocaleString('en-GB')} 2025 baseline
                </div>
              </div>
              <div className="serif" style={{ fontSize: 30, color: isActive ? sc.color : 'var(--cream-dim)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                +{sc.pct}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Live total strip — moves only as the sliders below move */}
      <div style={{
        padding: '18px 22px', marginBottom: 28,
        background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(34,211,238,0.05))',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
              Live total · driven by sliders below
            </div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <span className="serif" style={{ fontSize: 40, color: 'var(--cream)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                +{total.toFixed(1)}%
              </span>
              <span className="serif" style={{ fontSize: 22, color: 'var(--gold)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {fmtMoney(totalGBP)} / yr
              </span>
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--cream-dim)', fontStyle: 'italic' }}>
            🔒 read-only — derived from the {DRIVER_DEFS.length} driver sliders + Bar Price Uplift
          </span>
        </div>

        {/* Visual track 0% to 25% with marks at 10/15/20 */}
        <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${Math.min(100, total / 25 * 100)}%`,
            background: 'linear-gradient(90deg, #F87171, var(--gold), #2DD4BF)',
            borderRadius: 4, transition: 'width 0.2s',
          }} />
          {[10, 15, 20].map(p => (
            <div key={p} style={{
              position: 'absolute', left: `${p / 25 * 100}%`, top: -3,
              width: 1, height: 14, background: 'rgba(255,255,255,0.4)',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--cream-dim)', marginTop: 6 }}>
          <span>0%</span><span>10%</span><span>15%</span><span>20%</span><span>25%</span>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--cream-dim)' }}>
          {DRIVER_DEFS.length} driver sliders ({driverTotal.toFixed(1)}%) + Bar Price Uplift ({effectiveBarUplift.toFixed(1)}%, sized on 2026 Performance)
        </div>
      </div>

      {/* Driver sliders — 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        {DRIVER_DEFS.map(d => (
          <DriverCard
            key={d.key}
            def={d}
            value={effectiveDrivers[d.key]}
            isLocked={locks[d.key] != null}
            isFounder={isFounder}
            total={total}
            onChange={(v) => setDriver(d.key, v)}
            onLock={() => lockDriver(d.key)}
            onUnlock={() => unlockDriver(d.key)}
          />
        ))}
      </div>

      {/* Bar Price Uplift section — read-only here, sized on 2026 Performance */}
      <div style={{
        padding: '18px 22px', borderRadius: 12,
        background: 'rgba(201,168,76,0.04)',
        border: '1px dashed rgba(201,168,76,0.4)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
              Bar Price Uplift · controlled from 2026 Performance
            </div>
            <div className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginBottom: 6 }}>
              +{effectiveBarUplift.toFixed(1)}% on bar prices
              <span style={{ fontSize: 14, color: 'var(--gold)', marginLeft: 12, fontVariantNumeric: 'tabular-nums' }}>
                {fmtMoney(BAR_2025_BOROUGH * effectiveBarUplift / 100)} / yr
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
              The only price-side driver — every other slider above is a volume lever. Sized using the Bar Price Uplift Calculator on <strong style={{ color: 'var(--cream)' }}>Business Explorer → 2026 Performance</strong> against the 2025 bar baseline of <strong style={{ color: 'var(--cream)' }}>£{BAR_2025_BOROUGH.toLocaleString('en-GB')}</strong>. Locked there, surfaced here read-only.
            </div>
          </div>
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.3)',
            fontSize: 11, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            🔗 See 2026 Performance
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p style={{ marginTop: 28, fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
        Sliders above are illustrative attribution — the founder's view of how the headline growth target breaks down across strategies. Each slider has its own 🔒 lock so individual lines can be pinned without freezing the whole breakdown. £ contributions are sized on the 2025 total revenue baseline of £{REVENUE_2025.toLocaleString('en-GB')}.
      </p>
    </div>
  )
}

function DriverCard({ def, value, isLocked, isFounder, total, onChange, onLock, onUnlock }) {
  const dragDisabled    = isLocked || !isFounder
  const contributionGBP = (value / 100) * REVENUE_2025
  const shareOfTotal    = total > 0 ? (value / total) * 100 : 0
  const lockButtonColor = def.color === 'var(--gold)' ? 'var(--gold)' : def.color

  return (
    <div style={{
      background: 'var(--ink-2)',
      border: `1px solid ${isLocked ? 'rgba(16,185,129,0.45)' : `${def.color}33`}`,
      borderTop: `3px solid ${def.color}`,
      borderRadius: 10,
      padding: 18,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Title row + per-driver lock */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: def.color, fontWeight: 600, marginBottom: 4 }}>
            {def.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.55 }}>
            {def.intro}
          </div>
        </div>
        {isFounder && (
          <button
            onClick={() => isLocked ? onUnlock() : onLock()}
            style={{
              padding: '4px 10px', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              borderRadius: 6, cursor: 'pointer',
              background: isLocked ? 'rgba(16,185,129,0.12)' : 'transparent',
              color: isLocked ? '#10B981' : lockButtonColor,
              border: `1px solid ${isLocked ? 'rgba(16,185,129,0.45)' : `${lockButtonColor}66`}`,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
            title={isLocked ? 'Unlock this slider' : 'Lock this value into the total'}
          >
            {isLocked ? '🔓 Unlock' : '🔒 Lock'}
          </button>
        )}
      </div>

      {/* Headline contribution % */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Contribution to annual uplift
        </span>
        <span className="serif" style={{ fontSize: 22, color: def.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          +{value.toFixed(1)}%
        </span>
      </div>

      {/* Slider */}
      <input
        type="range" min={0} max={12} step={0.5}
        value={value} disabled={dragDisabled}
        onChange={(e) => onChange(+e.target.value)}
        style={{
          width: '100%', accentColor: def.color,
          cursor: dragDisabled ? 'not-allowed' : 'pointer',
          opacity: dragDisabled ? 0.5 : 1,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--cream-dim)' }}>
        <span>0%</span><span>3%</span><span>6%</span><span>9%</span><span>12%</span>
      </div>

      {/* £ uplift + share-of-total stats */}
      <div style={{
        marginTop: 4, paddingTop: 12,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            £ uplift / year
          </div>
          <div className="serif" style={{ fontSize: 16, color: 'var(--cream)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {fmtMoney(contributionGBP)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Share of total uplift
          </div>
          <div className="serif" style={{ fontSize: 16, color: def.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {shareOfTotal.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  )
}

// Public hook for the Bar Price Uplift Calculator on 2026 Performance —
// reads/writes the same localStorage keys this slide subscribes to.
export function useBarPriceUplift() {
  const [pct, setPct] = useState(() => readPersisted(BAR_PRICE_KEY, 0))
  const [locked, setLocked] = useState(() => readPersisted(BAR_PRICE_LOCK_KEY, null))

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === BAR_PRICE_KEY)      setPct(readPersisted(BAR_PRICE_KEY, 0))
      if (e.key === BAR_PRICE_LOCK_KEY) setLocked(readPersisted(BAR_PRICE_LOCK_KEY, null))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const isFounder = isFounderSession()
  const isLocked  = locked != null
  const canEdit   = isFounder && !isLocked
  const effective = isLocked ? locked : pct

  const setValue = (v) => {
    if (!canEdit) return
    setPct(v)
    writePersisted(BAR_PRICE_KEY, v)
  }
  const lock = () => {
    if (!isFounder || isLocked) return
    setLocked(pct)
    writePersisted(BAR_PRICE_LOCK_KEY, pct)
  }
  const unlock = () => {
    if (!isFounder || !isLocked) return
    setLocked(null)
    clearPersisted(BAR_PRICE_LOCK_KEY)
  }

  return { value: effective, setValue, isLocked, isFounder, canEdit, lock, unlock, baseline: BAR_2025_BOROUGH }
}
