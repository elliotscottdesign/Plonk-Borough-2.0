import React from 'react'
import { useLockedUseOfFunds, FUNDING_RANGE } from './LockedUseOfFundsContext.jsx'
import { computeDealFromInvestment } from '../../data/hackney.js'

// FundingSlider — the single root funding control for the Hackney deck.
// Lives on the Cover slide. All financial outputs across the site flow
// from this slider via LockedUseOfFundsContext.
//
// Behaviour:
//   • Drag — updates `effective.investment` live; every consumer slide
//     (Cover stats, MarketContext multiple, InvestmentSummary, Waterfall
//     5-year breakdown, VenueInfo Development tab) recomputes immediately.
//   • Lock (founder only) — captures the current value into a snapshot
//     persisted to localStorage. Slider freezes; other surfaces show
//     the locked value.
//   • Unlock (founder only) — clears the snapshot; slider becomes
//     editable again.
//   • Non-founder — slider is read-only when locked (shows the founder's
//     locked value). When unlocked, non-founder can drag for a personal
//     preview but their changes don't persist.
//
// Founder access: PasswordGate at 888999 sets sessionStorage.ndb_founder.
// Alternative: ?founder=888999 query promotes the session (handy for
// shareable links).

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

export default function FundingSlider({ compact = false }) {
  const { effective, isLocked, isFounder, canEdit, setValue, lock, unlock, snapshot } = useLockedUseOfFunds()
  const range = FUNDING_RANGE
  const value = effective.investment
  const deal  = computeDealFromInvestment(value)

  // Slider is interactable when canEdit (founder + not locked). Non-founder
  // sees a read-only slider whenever locked; can drag locally when unlocked
  // (their changes don't persist).
  const interactable = !isLocked
  const showLockButton = isFounder

  const lockedAtLabel = snapshot?.lockedAt
    ? new Date(snapshot.lockedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(201,168,76,0.10), rgba(167,139,250,0.07))',
      border: `1px solid ${isLocked ? 'rgba(16,185,129,0.45)' : 'rgba(201,168,76,0.32)'}`,
      borderRadius: 14,
      padding: compact ? 18 : 24,
      marginBottom: compact ? 24 : 32,
    }}>
      {/* Header — eyebrow + lock state pill + lock button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
            Funding Amount
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 12,
            background: isLocked ? 'rgba(16,185,129,0.12)' : 'rgba(201,168,76,0.08)',
            border: `1px solid ${isLocked ? 'rgba(16,185,129,0.4)' : 'rgba(201,168,76,0.2)'}`,
            fontSize: 10, color: isLocked ? '#10B981' : 'var(--gold-dim)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            <span style={{ fontSize: 9 }}>{isLocked ? '🔒' : '○'}</span>
            {isLocked ? 'Locked' : 'Live preview'}
          </span>
        </div>

        {showLockButton && (
          <button
            onClick={() => (isLocked ? unlock() : lock())}
            style={{
              padding: '8px 18px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.15s',
              background: isLocked ? 'transparent' : 'var(--gold)',
              color:      isLocked ? 'var(--gold)'  : 'var(--ink)',
              border: `1px solid ${isLocked ? 'rgba(201,168,76,0.5)' : 'var(--gold)'}`,
            }}
          >
            {isLocked ? '🔓 Unlock' : '🔒 Lock'}
          </button>
        )}
      </div>

      {/* Headline value */}
      <div className="serif" style={{
        fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
        color: 'var(--gold)',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        marginBottom: 14,
      }}>
        {fmt(value)}
      </div>

      {/* Slider */}
      <input
        type="range"
        min={range.min} max={range.max} step={range.step}
        // Visual position clamps even if the underlying value is outside
        // the range (e.g. legacy snapshot at £25k or £200k+ from the old
        // bounds). The state value itself is preserved.
        value={Math.max(range.min, Math.min(range.max, value))}
        onChange={(e) => setValue('investment', +e.target.value)}
        disabled={!interactable}
        style={{
          width: '100%',
          accentColor: 'var(--gold)',
          cursor: interactable ? 'pointer' : 'not-allowed',
          opacity: interactable ? 1 : 0.6,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gold-dim)', marginTop: 6 }}>
        <span>{fmt(range.min)}</span>
        <span style={{ color: 'var(--cream-dim)', fontStyle: 'italic' }}>
          50/50 split fixed · pre-money = funding · multiple flexes
        </span>
        <span>{fmt(range.max)}</span>
      </div>

      {/* Valuation summary — pre-money, post-money, implied multiple */}
      <div style={{
        marginTop: 18, paddingTop: 16,
        borderTop: '1px solid rgba(201,168,76,0.18)',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
      }}>
        <Stat label="Pre-money"  value={fmt(deal.preMoney)} />
        <Stat label="Post-money" value={fmt(deal.postMoney)} />
        <Stat label="Implied EBITDA Multiple" value={`${deal.impliedMult.toFixed(2)}×`} colour="#A78BFA" />
      </div>

      {/* Footnotes — locked timestamp + permission hints */}
      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.5 }}>
        {isLocked && (
          <div style={{ color: '#10B981' }}>
            ✓ Locked snapshot{lockedAtLabel ? ` · ${lockedAtLabel}` : ''} — value cascades to every slide and persists across reloads.
          </div>
        )}
        {!isLocked && isFounder && (
          <div>Drag the slider to size the raise — every figure across the deck recomputes instantly. Click <strong style={{ color: 'var(--gold)' }}>Lock</strong> to commit the value for investor view.</div>
        )}
        {!isLocked && !isFounder && (
          <div>Live preview — drag to model. Founder access (password 888999) required to lock a value for investor view.</div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, colour }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div className="serif" style={{ fontSize: 18, color: colour || 'var(--cream)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
    </div>
  )
}
