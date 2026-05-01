import React, { useEffect, useState } from 'react'
import { useLockedFunding } from '../components/LockedFundingContext.jsx'

// Borough Growth Drivers Calculator — investor-facing breakdown of HOW
// the deck gets to the headline 10% / 15% / 20% growth scenarios used
// elsewhere. Bar takings + games / golf volume are the two profit
// engines; everything on this slide is a strategy that increases the
// underlying volume (with the exception of Bar Price Uplift, which is
// the only price-side lever and is sized on the 2026 Performance tab).
//
// Self-contained state — values persist in localStorage. Founder lock
// freezes the breakdown into the Custom scenario; non-founders see
// the locked values read-only. Mirrors the Hackney implementation but
// uses Borough's 6 drivers + Borough's 2025 bar baseline.

const STORAGE_KEY        = 'ndb_growth_drivers_v1'
const STORAGE_LOCK_KEY   = 'ndb_growth_drivers_locked_v1'
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
    intro: 'Friday and Saturday late events incremental to walk-in trade. High-margin bar revenue with zero additional fixed cost. Borough Market location draws natural late-night footfall — the audience is already in postcode SE1.',
    color: '#F472B6',
    defaultPct: 2,
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

// 2025 verified bar takings — INCOME_SOURCES "Spend at Bar" line.
const BAR_2025_BOROUGH = 362836

const presetFor = (totalPct) => {
  if (totalPct <= 11) return { label: 'Conservative · +10%', color: '#F87171' }
  if (totalPct <= 17) return { label: 'Base Case · +15%', color: 'var(--gold)' }
  if (totalPct <= 22) return { label: 'Optimistic · +20%', color: '#2DD4BF' }
  return { label: 'Stretch · above optimistic', color: '#A78BFA' }
}

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

// Founder gate — borrowed from FundingSlider's pattern. PasswordGate at
// 888999 sets sessionStorage.ndb_plonk; that's the founder tier here.
const isFounderSession = () => {
  try { return sessionStorage.getItem('ndb_plonk') === '1' } catch { return false }
}

export default function GrowthDrivers() {
  // Eat funding context to keep parity with the rest of the deck even though
  // this slide doesn't directly use the funding amount — ensures the React
  // tree is consistent.
  useLockedFunding()

  const isFounder = isFounderSession()

  // Drivers state — { seo: 3, ads: 3, ... }
  const defaultDrivers = Object.fromEntries(DRIVER_DEFS.map(d => [d.key, d.defaultPct]))
  const [drivers, setDrivers] = useState(() =>
    readPersisted(STORAGE_KEY, defaultDrivers)
  )
  const [driversLocked, setDriversLocked] = useState(() =>
    readPersisted(STORAGE_LOCK_KEY, null)
  )

  // Bar price uplift — sized on the 2026 Performance tab; surfaced read-only here.
  const [barPriceUplift, setBarPriceUpliftLocal] = useState(() =>
    readPersisted(BAR_PRICE_KEY, 0)
  )
  const [barPriceLocked, setBarPriceLocked] = useState(() =>
    readPersisted(BAR_PRICE_LOCK_KEY, null)
  )

  // Subscribe to other tabs' updates (e.g. the bar price calculator on
  // 2026 Performance) so values stay in sync across pages.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === BAR_PRICE_KEY)       setBarPriceUpliftLocal(readPersisted(BAR_PRICE_KEY, 0))
      if (e.key === BAR_PRICE_LOCK_KEY)  setBarPriceLocked(readPersisted(BAR_PRICE_LOCK_KEY, null))
      if (e.key === STORAGE_KEY)         setDrivers(readPersisted(STORAGE_KEY, defaultDrivers))
      if (e.key === STORAGE_LOCK_KEY)    setDriversLocked(readPersisted(STORAGE_LOCK_KEY, null))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLocked = driversLocked !== null
  const canEdit  = isFounder && !isLocked

  // Effective values — locked snapshot wins when present, otherwise live.
  const effectiveDrivers      = isLocked ? driversLocked : drivers
  const effectiveBarUplift    = barPriceLocked != null ? barPriceLocked : barPriceUplift
  const driverTotal           = DRIVER_DEFS.reduce((s, d) => s + (effectiveDrivers[d.key] || 0), 0)
  const total                 = driverTotal + effectiveBarUplift
  const preset                = presetFor(total)

  const setDriver = (key, val) => {
    if (!canEdit) return
    setDrivers(prev => {
      const next = { ...prev, [key]: val }
      writePersisted(STORAGE_KEY, next)
      return next
    })
  }

  const lock = () => {
    if (!isFounder || isLocked) return
    const stamped = { ...drivers, lockedAt: new Date().toISOString() }
    setDriversLocked(stamped)
    writePersisted(STORAGE_LOCK_KEY, stamped)
  }
  const unlock = () => {
    if (!isFounder || !isLocked) return
    setDriversLocked(null)
    clearPersisted(STORAGE_LOCK_KEY)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8, lineHeight: 1.1 }}>
        How we get to +10% / +15% / +20%
      </h2>
      <p style={{ fontSize: 15, color: 'var(--cream-dim)', maxWidth: 760, lineHeight: 1.6, marginBottom: 28 }}>
        Bar takings and games / golf volume are the two profit engines. Everything below is a strategy that lifts that volume — drag each slider to attribute its share of the headline annual uplift. The total is what flows into the Custom scenario for Investor Returns, Cashflow and the KPI strip.
      </p>

      {/* Headline total + lock */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'center',
        padding: '20px 24px', marginBottom: 28,
        background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(34,211,238,0.05))',
        border: `1px solid ${isLocked ? 'rgba(16,185,129,0.45)' : 'rgba(201,168,76,0.3)'}`,
        borderRadius: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--gold-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
            Selected annual uplift
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
            <span className="serif" style={{ fontSize: 48, color: 'var(--cream)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              +{total.toFixed(1)}%
            </span>
            <span style={{ fontSize: 14, color: preset.color, fontWeight: 600 }}>
              {preset.label}
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--cream-dim)' }}>
            {DRIVER_DEFS.length} driver sliders ({driverTotal.toFixed(1)}%) + Bar Price Uplift ({effectiveBarUplift.toFixed(1)}%, sized on 2026 Performance)
          </div>
        </div>
        {isFounder && (
          <button
            onClick={() => (isLocked ? unlock() : lock())}
            style={{
              padding: '10px 22px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
              background: isLocked ? 'transparent' : 'var(--gold)',
              color: isLocked ? 'var(--gold)' : 'var(--ink)',
              border: `1px solid ${isLocked ? 'rgba(201,168,76,0.5)' : 'var(--gold)'}`,
              transition: 'all 0.15s',
            }}
          >
            {isLocked ? '🔓 Unlock' : '🔒 Lock as Custom'}
          </button>
        )}
      </div>

      {/* Driver sliders — 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        {DRIVER_DEFS.map(d => (
          <DriverCard
            key={d.key}
            def={d}
            value={effectiveDrivers[d.key] || 0}
            onChange={(v) => setDriver(d.key, v)}
            disabled={!canEdit}
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
        Sliders above are illustrative attribution — the founder's view of how the headline growth target breaks down across strategies. Locking captures the breakdown as the Custom scenario; unlocked, it's a live preview.
      </p>
    </div>
  )
}

function DriverCard({ def, value, onChange, disabled }) {
  return (
    <div style={{
      background: 'var(--ink-2)',
      border: `1px solid ${def.color}33`,
      borderTop: `3px solid ${def.color}`,
      borderRadius: 10,
      padding: 18,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 13, color: def.color, fontWeight: 600, marginBottom: 4 }}>
          {def.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.55 }}>
          {def.intro}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Contribution to annual uplift
        </span>
        <span className="serif" style={{ fontSize: 22, color: def.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          +{value.toFixed(1)}%
        </span>
      </div>

      <input
        type="range" min={0} max={10} step={0.5}
        value={value} disabled={disabled}
        onChange={(e) => onChange(+e.target.value)}
        style={{
          width: '100%', accentColor: def.color,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--cream-dim)' }}>
        <span>0%</span><span>5%</span><span>10%</span>
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
