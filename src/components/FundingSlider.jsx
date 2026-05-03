import React from 'react'
import { useLockedFunding, FUNDING_RANGE } from './LockedFundingContext.jsx'
import { computeDealFromInvestment } from '../data.js'

// FundingSlider — single root funding control for the Borough deck.
// Lives on the Cover slide. All financial outputs across the site flow
// from this slider via LockedFundingContext.
//
// Mirrors the Hackney FundingSlider component exactly — same lock /
// unlock UX, same range display, same valuation summary footer.
//
// Behaviour:
//   • Drag — updates effective.investment live; every consumer slide
//     (Cover stat cards, UseOfFunds totals, InvestmentSummary Explore
//     panel, Waterfall returns, Cashflow tab capital recovery) recomputes
//     immediately.
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
const pct = (n) => (n * 100).toFixed(1) + '%'

// Operating profit anchor for the personal-cheque dividend math.
// Mirrors InvestmentSummary's OPERATING_PROFIT_BASE — base case 2026
// operating profit under the new cost rules (wages +10%, non-rent fixed
// +10%, drinks 30% of bar, rent 15% of turnover).
const OPERATING_PROFIT_BASE = 124000

export default function FundingSlider({ compact = false }) {
  const { effective, isLocked, isFounder, canEdit, setValue, lock, unlock, snapshot } = useLockedFunding()
  const range = FUNDING_RANGE
  const value = effective.investment
  const deal  = computeDealFromInvestment(value)

  // Share-class + dividend math — moved here from InvestmentSummary's
  // standalone calculator. Under the 50/50 split rule (pre-money = funding)
  // the slider value doubles as the personal cheque, so equity = 50% at
  // the cap. Smaller cheques drop below the A-share floor.
  const equity     = value / Math.max(1, deal.postMoney)
  const isAShare   = value >= deal.aShareFloor
  const dividend   = OPERATING_PROFIT_BASE * equity
  const totalY1    = dividend
  const coc        = value > 0 ? totalY1 / value : 0
  const paybackYrs = totalY1 > 0 ? value / totalY1 : Infinity

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

      {/* Share-class + Year-1 return panel — ported from the InvestmentSummary
          calculator so the slider on Cover is the single source of truth for
          the deal economics. */}
      <div style={{
        marginTop: 18, paddingTop: 16,
        borderTop: '1px solid rgba(201,168,76,0.18)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16,
          padding: '8px 16px', borderRadius: 20,
          background: isAShare ? 'rgba(45,212,191,0.1)' : 'rgba(201,168,76,0.1)',
          border: `1px solid ${isAShare ? 'rgba(45,212,191,0.4)' : 'rgba(201,168,76,0.4)'}`,
          fontSize: 13, color: isAShare ? 'var(--teal)' : 'var(--gold)',
        }}>
          <span>{isAShare ? '✓' : '○'}</span>
          {isAShare ? 'A Shares · Full Voting · Paid First' : 'B Shares · Non-Voting · Paid Second'}
          <span style={{ color: 'var(--cream-dim)', marginLeft: 4 }}>{pct(equity)} equity</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <CalcResult label="Ownership"       value={pct(equity)} />
          <CalcResult label="Equity Dividend" value={fmt(dividend)} />
          <CalcResult label="Total Year 1"    value={fmt(totalY1)} gold />
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
          Cash-on-Cash: <strong style={{ color: 'var(--cream)' }}>{(coc * 100).toFixed(1)}%</strong>
          {' · '}
          Payback: <strong style={{ color: 'var(--cream)' }}>{isFinite(paybackYrs) ? `${paybackYrs.toFixed(2)} years` : 'N/A'}</strong>
          {' · '}
          Minimum for A shares: <strong style={{ color: 'var(--cream)' }}>{fmt(deal.aShareFloor)}</strong>
        </div>

        <details style={{ marginTop: 14, fontSize: 12, color: 'var(--cream-dim)' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.04em' }}>
            ⓘ Why does CoC change as I move the slider?
          </summary>
          <div style={{ marginTop: 10, padding: '14px 16px', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 6, lineHeight: 1.65 }}>
            Year-1 dividend = your equity share × <strong style={{ color: 'var(--cream)' }}>operating profit</strong> ({fmt(OPERATING_PROFIT_BASE)} base case),
            NOT × your cheque. Equity share = your cheque ÷ post-money. Under the fixed 50/50
            split (pre-money = funding) the dividend pool is locked at 50% × {fmt(OPERATING_PROFIT_BASE)},
            so dragging the raise <em>down</em> lifts everyone's cash-on-cash in lockstep — the same
            absolute dividend recovers a smaller cheque faster — and dragging it <em>up</em> dilutes
            it. A shares (full voting, paid first) require a minimum cheque of <strong style={{ color: 'var(--cream)' }}>{fmt(deal.aShareFloor)}</strong>.
          </div>
        </details>
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

function CalcResult({ label, value, gold }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 8, letterSpacing: '0.04em' }}>{label}</div>
      <div className="serif" style={{ fontSize: 22, color: gold ? 'var(--gold)' : 'var(--cream)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
    </div>
  )
}
