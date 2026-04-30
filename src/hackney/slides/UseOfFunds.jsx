import React from 'react'
import {
  USE_OF_FUNDS,
  USE_OF_FUNDS_RANGES,
  computeDealFromInvestment,
} from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

// UseOfFunds — Hackney use-of-funds allocator.
// The funding amount itself is set by the FundingSlider on the Cover
// slide — this slide picks it up via LockedUseOfFundsContext and shows
// how that amount breaks down across 7 spend lines.
//
// Six explicit sliders allocate spend across stock / rent / garden /
// interior / marketing / legals. Working Capital is the 7th line —
// derived as funding minus the sum of the six, displayed full-width
// below as a disabled slider so the residual is visible at a glance.
// Drag stock down → working capital up.
//
// Founder (888999) edits + locks via the Cover FundingSlider; this
// slide's lock UI bar mirrors the same lock state and lets the founder
// trigger lock/unlock from here too without navigating away.

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// Slider order on the slide. `key` matches USE_OF_FUNDS_RANGES + USE_OF_FUNDS.
const ORDER = ['stock', 'rent', 'garden', 'interior', 'marketing', 'legals']

export default function UseOfFunds() {
  const {
    effective, snapshot, isLocked, isFounder, canEdit,
    setValue, lock, unlock, reset,
  } = useLockedUseOfFunds()

  // Display surface = effective (locked snapshot when locked, else live
  // derived). Single source of truth — no local state, no defaultValues.
  const display = effective
  const deal    = computeDealFromInvestment(display.total)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: '#4FC3F7', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Use of Investment Funds</div>
        <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
          {fmt(display.total)} Investment · 50/50 Equity Split
        </h2>
        <p style={{ fontSize: 14, color: '#9CA3AF', maxWidth: 760, lineHeight: 1.6 }}>
          The funding amount is set by the slider on the <strong style={{ color: 'var(--cream)' }}>Cover slide</strong> — drag it there to size the raise. This page breaks the spend down across stock, rent, garden, interior, marketing, and legals; Working Capital absorbs whatever's left, sitting as float for early trading. Whatever the investor puts in, the founder matches with 50% equity. Pure pro-rata between founder and investor side; within the investor pool, <strong style={{ color: 'var(--cream)' }}>A-shares (≥ £10k cheques) are paid first</strong> and <strong style={{ color: 'var(--cream)' }}>B-shares (&lt; £10k cheques) are paid after</strong> the A-share allocation is complete.
        </p>
      </div>

      {/* Headline cards — total raise, allocated vs working capital, 50/50 split */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <HeadlineCard
          label="TOTAL RAISE"
          value={fmt(display.total)}
          colour={isLocked ? '#10B981' : '#C9A84C'}
          sub={isLocked ? 'Locked snapshot · from Cover slider' : 'Live · drag the slider on Cover'}
        />
        <HeadlineCard
          label="ALLOCATED"
          value={fmt(display.allocated)}
          colour="#4FC3F7"
          sub={`${display.total > 0 ? ((display.allocated/display.total)*100).toFixed(1) : '0.0'}% of raise · 6 sliders below`}
        />
        <HeadlineCard
          label="WORKING CAPITAL"
          value={fmt(display.workingCapital)}
          colour={display.overAllocated > 0 ? '#E53935' : '#2DD4BF'}
          sub={display.overAllocated > 0
            ? `Over-allocated by ${fmt(display.overAllocated)}`
            : `${display.total > 0 ? ((display.workingCapital/display.total)*100).toFixed(1) : '0.0'}% of raise · residual float`}
        />
        <HeadlineCard
          label="50/50 SPLIT"
          value={`${deal.impliedMult.toFixed(2)}× EBITDA`}
          colour="#A78BFA"
          sub={`Post-money ${fmt(deal.postMoney)}`}
        />
      </div>

      {/* Lock / Reset / Founder gate — shared lock state with the Cover FundingSlider */}
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
              Locked values flow into Cover · Investment Summary · Waterfall Returns · Cashflow Forecast.
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          <button onClick={reset} disabled={!isFounder} style={btnStyle({ disabled: !isFounder, ghost: true })}>Reset</button>
          {isLocked ? (
            <button onClick={unlock} disabled={!isFounder} style={btnStyle({ disabled: !isFounder, gold: true })}>Unlock</button>
          ) : (
            <button onClick={lock} disabled={!canEdit} style={btnStyle({ disabled: !canEdit, gold: true })}>Lock</button>
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
                months={display.rentMonths}
                onChange={(m) => setValue('rentMonths', m)}
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
              value={display[key]}
              onChange={(v) => setValue(key, v)}
              disabled={!canEdit}
            />
          )
        })}
      </div>

      {/* Working Capital — full-width residual slider, always disabled */}
      <WorkingCapitalSlider amount={display.workingCapital} target={display.total} allocated={display.allocated} />

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
                <span style={{ fontSize: 13, color: 'var(--cream)' }}>{meta.item}{key === 'rent' ? (display.rentMonths === 0 ? ' (paid monthly)' : ` (${display.rentMonths} ${display.rentMonths === 1 ? 'month' : 'months'})`) : ''}</span>
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
  const overAllocated = Math.max(0, allocated - target)
  return (
    <div style={{ background: 'var(--ink-2)', border: `1px solid ${overAllocated > 0 ? 'rgba(229,57,53,0.4)' : 'rgba(45,212,191,0.25)'}`, borderRadius: 10, padding: 18, marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: overAllocated > 0 ? '#E53935' : 'var(--teal)', fontWeight: 500 }}>
          Working Capital <span style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 8 }}>residual · auto-filled</span>
        </span>
        <span style={{ fontSize: 18, color: overAllocated > 0 ? '#E53935' : 'var(--teal)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt(amount)}</span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden', cursor: 'not-allowed' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: overAllocated > 0 ? 'linear-gradient(90deg, #E53935, rgba(229,57,53,0.6))' : 'linear-gradient(90deg, var(--teal), rgba(45,212,191,0.6))', borderRadius: 4, transition: 'width 0.2s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--cream-dim)', marginTop: 6 }}>
        <span>£0</span>
        <span style={{ fontStyle: 'italic', color: overAllocated > 0 ? '#E53935' : 'var(--cream-dim)' }}>
          {overAllocated > 0
            ? `Over-allocated by ${fmt(overAllocated)} — drag a slider down or raise the funding amount on Cover`
            : `= ${fmt(target)} funding − ${fmt(allocated)} allocated across the 6 sliders above`}
        </span>
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
  const current = snaps.find(s => s.months === months) || snaps[0]
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
