import React from 'react'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

// Growth Drivers Calculator — investor-facing breakdown of HOW the deck
// gets to the headline 10% / 15% / 20% growth scenarios used elsewhere.
// Bar takings and games volume are the two profit-lifters; everything on
// this slide is a driver that increases the underlying volume (with the
// exception of Bar Price Uplift, which is the only price-side lever and
// is sized via the calculator on the 2026 Performance tab).
//
// Each driver has a slider (0–10 percentage points) that says: "how much
// of the headline annual uplift does this strategy contribute?" Sum
// across all drivers + the bar price uplift = the Custom scenario %.
// One master Lock button captures the breakdown into the Custom preset
// so it cascades through Investor Returns / Cashflow / KPIs.

const DRIVER_DEFS = [
  {
    key: 'seo',
    title: 'SEO Rebuild from Day 1',
    intro: 'Restore organic search visibility from launch — domain authority preserved via 301 redirect, structured data, local schema, content depth. Drives discovery for high-intent searches (London Fields bar, late-night Hackney, etc.).',
    color: '#22D3EE',
  },
  {
    key: 'organic',
    title: 'Organic & Local Listings',
    intro: 'Time Out, Resident Advisor, Broadway Market guides, Google Business Profile. £2k/yr local listings spend — no paid ads dependency. Drives walk-in footfall from neighbourhood discovery.',
    color: '#A78BFA',
  },
  {
    key: 'corporate',
    title: 'Corporate Events Pipeline',
    intro: 'Private hires, team away days, Christmas parties. Bookings manager focused on day-of-week balance — fills Mon–Wed traditionally underused slots. Higher per-cover spend than walk-ins.',
    color: '#10B981',
  },
  {
    key: 'dj',
    title: 'DJ & Events Programme',
    intro: 'Friday + Saturday late events drive the highest-revenue nights. High-margin bar revenue with minimal additional fixed cost. Existing London Fields late-night demand profile already proven.',
    color: '#F472B6',
  },
  {
    key: 'repricing',
    title: 'Pool & Gaming Volume',
    intro: 'Modest price increases on pool tables and arcade play affecting 10k+ annual plays. Direct margin lift with minimal customer resistance — long-validated price points have not moved in 3+ years.',
    color: '#FBBF24',
  },
  {
    key: 'garden',
    title: 'Frontage Styling Refresh',
    intro: '£12k cosmetic refresh of the garden and front exterior — paint, signage, lighting and planters — to lift kerb appeal and convert more passers-by into walk-in trade. No expansion; styling lift inside the existing footprint.',
    color: '#FB923C',
  },
]

// Map total uplift % to the closest preset name.
const presetFor = (totalPct) => {
  if (totalPct <= 11) return { label: 'Conservative · +10%', color: '#F87171' }
  if (totalPct <= 17) return { label: 'Base Case · +15%', color: 'var(--gold)' }
  if (totalPct <= 22) return { label: 'Optimistic · +20%', color: '#2DD4BF' }
  return { label: 'Stretch · above optimistic', color: '#A78BFA' }
}

export default function GrowthDrivers() {
  const {
    forecastEffective, isForecastLocked, isFounder, canEditForecast,
    setGrowthDriver, lockForecast, unlockForecast,
  } = useLockedUseOfFunds()

  const drivers = forecastEffective.growthDrivers || {}
  const barPriceUplift = forecastEffective.barPriceUplift || 0

  const driverTotal = DRIVER_DEFS.reduce((s, d) => s + (drivers[d.key] || 0), 0)
  const total = driverTotal + barPriceUplift
  const preset = presetFor(total)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8, lineHeight: 1.1 }}>
        How we get to +10% / +15% / +20%
      </h2>
      <p style={{ fontSize: 15, color: 'var(--cream-dim)', maxWidth: 720, lineHeight: 1.6, marginBottom: 28 }}>
        Bar and games volume are the two engines. Everything below is a strategy that lifts that volume — drag each slider to attribute its share of the headline annual uplift. The total is what flows into the Custom scenario for Investor Returns, Cashflow and the KPI strip.
      </p>

      {/* Headline total + lock */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'center',
        padding: '20px 24px', marginBottom: 28,
        background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(34,211,238,0.05))',
        border: `1px solid ${isForecastLocked ? 'rgba(16,185,129,0.45)' : 'rgba(201,168,76,0.3)'}`,
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
            {DRIVER_DEFS.length} driver sliders ({driverTotal.toFixed(1)}%) + Bar Price Uplift ({barPriceUplift.toFixed(1)}%, sized on 2026 Performance)
          </div>
        </div>
        {isFounder && (
          <button
            onClick={() => (isForecastLocked ? unlockForecast() : lockForecast())}
            style={{
              padding: '10px 22px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
              background: isForecastLocked ? 'transparent' : 'var(--gold)',
              color: isForecastLocked ? 'var(--gold)' : 'var(--ink)',
              border: `1px solid ${isForecastLocked ? 'rgba(201,168,76,0.5)' : 'var(--gold)'}`,
              transition: 'all 0.15s',
            }}
          >
            {isForecastLocked ? '🔓 Unlock' : '🔒 Lock as Custom'}
          </button>
        )}
      </div>

      {/* Driver sliders — 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        {DRIVER_DEFS.map(d => (
          <DriverCard
            key={d.key}
            def={d}
            value={drivers[d.key] || 0}
            onChange={(v) => setGrowthDriver(d.key, v)}
            disabled={!canEditForecast}
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
              +{barPriceUplift.toFixed(1)}% on bar prices
            </div>
            <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
              The only price-side driver — every other slider above is a volume lever. Sized using the Bar Price Uplift Calculator on <strong style={{ color: 'var(--cream)' }}>Business Explorer → 2026 Performance</strong> against verified 2025 bar takings. Locked there, surfaced here read-only.
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

// Per-driver card with a 0–10 pp slider and a live readout.
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
