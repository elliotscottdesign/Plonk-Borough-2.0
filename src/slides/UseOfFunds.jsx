import React from 'react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../i18n/format.js'
import {
  STOCK_SETUP_DETAIL,
  HARDWARE_BREAKDOWN,
  USE_OF_FUNDS,
  USE_OF_FUNDS_RANGES,
  computeDealFromInvestment,
} from '../data.js'
import { useLockedFunding } from '../components/LockedFundingContext.jsx'

// UseOfFunds — Borough use-of-funds allocator.
// The funding amount itself is set by the FundingSlider on the Cover
// slide — this slide picks it up via LockedFundingContext and shows
// how that amount breaks down across the 4 spend lines (3 of them
// editable: rent / hardware / stock; IP fixed) plus the residual
// Working Capital line.
//
// Editable sliders mirror Hackney's Use of Funds slide:
//   • Rent     — 1/2/3-month snap (lease cadence)
//   • Hardware — continuous, £0–£24k inc VAT (liquidator cap)
//   • IP       — fixed £12k contractual licence (read-only label)
//   • Stock    — continuous, £3k–£8k around £4.9k default
//   • Working Capital — derived residual (full-width, disabled)
//
// Founder (888999) edits + locks via the Cover FundingSlider OR via
// the lock bar on this slide; the two share the same underlying
// LockedFundingContext snapshot.

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

export default function UseOfFunds() {
  const { t, i18n } = useTranslation('funds')
  const { t: tc } = useTranslation('common')
  const lang = i18n.language
  const fmtL = (n) => formatCurrency(n, lang)
  const vatLabel = tc('units.incVat')

  const {
    effective, snapshot, isLocked, isFounder, canEdit,
    setValue, lock, unlock, reset,
  } = useLockedFunding()
  const display = effective
  const deal    = computeDealFromInvestment(display.total)

  // Stock & Setup detail breakdown (unchanged from prior version)
  const setupItems = {
    alcohol:  { amount:1500, icon:'🍾' },
    soft:     { amount: 300, icon:'🥤' },
    ice:      { amount:  30, icon:'🧊' },
    cleaning: { amount: 250, icon:'🧽' },
    internet: { amount: 300, icon:'📡' },
    app:      { amount: 200, icon:'📱' },
    supplier: { amount: 135, icon:'🤝' },
    xero:     { amount:  75, icon:'📊' },
    rota:     { amount:  75, icon:'🗓️' },
    google:   { amount:  75, icon:'🗂️' },
    spotify:  { amount:  60, icon:'🎵' },
    rates:    { amount:1800, icon:'🏛️' },
    licence:  { amount: 100, icon:'📜' },
  }
  const setupGroups = [
    { key:'stock',      icon:'🥃', accent:'#A78BFA', vatKey:'incVat', items:['alcohol','soft','ice'] },
    { key:'contracts',  icon:'🛠️', accent:'#2DD4BF', vatKey:'incVat', items:['cleaning','internet','app','supplier'] },
    { key:'subs',       icon:'💻', accent:'#4FC3F7', vatKey:'incVat', items:['xero','rota','google','spotify'] },
    { key:'regulatory', icon:'🏛️', accent:'#F59E0B', vatKey:'exempt', items:['rates','licence'] },
  ]
  const groupSubtotal = (g) => g.items.reduce((s, k) => s + setupItems[k].amount, 0)
  const setupTotal = setupGroups.reduce((s, g) => s + groupSubtotal(g), 0)

  const hardwareItems = [
    { key:'minigolf', amount: 4000, icon:'⛳' },
    { key:'barEquip', amount:10000, icon:'🍻' },
    { key:'wetStock', amount: 2000, icon:'🔧' },
    { key:'arcade',   amount: 4000, icon:'🕹️' },
  ]
  const hardwareExVat = hardwareItems.reduce((s, i) => s + i.amount, 0)
  const hardwareIncVat = Math.round(hardwareExVat * 1.2)

  // Look up display labels / notes from USE_OF_FUNDS for slider headers
  const meta = Object.fromEntries(USE_OF_FUNDS.map(u => [u.key, u]))

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 4px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:12, color:'#4FC3F7', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>{t('eyebrow')}</div>
        <h2 className="serif" style={{ fontSize:'clamp(2rem, 4vw, 3rem)', color:'var(--cream)', marginBottom:8 }}>
          {t('title', { investment: fmtL(display.total) })}
        </h2>
        <p style={{ fontSize:14, color:'#9CA3AF', maxWidth:760, lineHeight:1.6 }}>
          The funding amount is set by the slider on the <strong style={{ color:'var(--cream)' }}>Cover slide</strong> — drag it there to size the raise. This page breaks the spend across rent, hardware, IP licence, and stock; Working Capital absorbs whatever's left as float for early trading. Whatever the investor puts in, the founder matches with 50% equity. Pure pro-rata between founder and investor side; within the investor pool, <strong style={{ color:'var(--cream)' }}>A-shares (≥ £10k cheques) are paid first</strong> and <strong style={{ color:'var(--cream)' }}>B-shares (&lt; £10k cheques) are paid after</strong> the A-share allocation is complete.
        </p>
      </div>

      {/* Headline cards — total raise, allocated vs working capital, 50/50 split */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
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
          sub={`${display.total > 0 ? ((display.allocated / display.total) * 100).toFixed(1) : '0.0'}% of raise · 4 lines below`}
        />
        <HeadlineCard
          label="WORKING CAPITAL"
          value={fmt(display.workingCapital)}
          colour={display.overAllocated > 0 ? '#E53935' : '#2DD4BF'}
          sub={display.overAllocated > 0
            ? `Over-allocated by ${fmt(display.overAllocated)}`
            : `${display.total > 0 ? ((display.workingCapital / display.total) * 100).toFixed(1) : '0.0'}% of raise · residual float`}
        />
        <HeadlineCard
          label="50/50 SPLIT"
          value={`${deal.impliedMult.toFixed(2)}× EBITDA`}
          colour="#A78BFA"
          sub={`Post-money ${fmt(deal.postMoney)}`}
        />
      </div>

      {/* Lock / Reset bar — shared with the Cover FundingSlider */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', marginBottom:20, background:'var(--ink-2)', border:`1px solid ${isLocked ? 'rgba(16,185,129,0.4)' : 'rgba(201,168,76,0.2)'}`, borderRadius:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background: isLocked ? '#10B981' : 'var(--gold-dim)' }} />
          <div>
            <div style={{ fontSize:12, color:'var(--cream)', fontWeight:600 }}>
              {isLocked
                ? `Locked · ${snapshot?.lockedAt ? new Date(snapshot.lockedAt).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' }) : ''}`
                : isFounder ? 'Editable — drag the sliders, then Lock to save' : 'Read-only · only the founder (888999) can edit'}
            </div>
            <div style={{ fontSize:11, color:'var(--cream-dim)', marginTop:2 }}>
              Locked values flow into Cover · Investment Summary · Waterfall Returns · Cashflow Forecast.
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={reset} disabled={!isFounder} style={btnStyle({ disabled:!isFounder, ghost:true })}>Reset</button>
          {isLocked ? (
            <button onClick={unlock} disabled={!isFounder} style={btnStyle({ disabled:!isFounder, gold:true })}>Unlock</button>
          ) : (
            <button onClick={lock} disabled={!canEdit} style={btnStyle({ disabled:!canEdit, gold:true })}>Lock</button>
          )}
        </div>
      </div>

      {/* Sliders — 2×2 grid: Rent (snap), Hardware (continuous), Stock (continuous), IP (fixed label) */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <RentSnapSlider
          meta={meta.rent}
          months={display.rentMonths}
          onChange={(m) => setValue('rentMonths', m)}
          disabled={!canEdit}
        />
        <ContinuousSlider
          meta={meta.hardware}
          range={USE_OF_FUNDS_RANGES.hardware}
          value={display.hardware}
          onChange={(v) => setValue('hardware', v)}
          disabled={!canEdit}
          subText="Liquidator quote — capped at £24k inc VAT (£20k ex VAT)"
          colour="#4FC3F7"
        />
        <FixedLine
          meta={meta.ip}
          amount={display.ip}
          colour="#C9A84C"
          subText="Contractual licence to No Dice Bars LTD — no slider"
        />
        <ContinuousSlider
          meta={meta.stock}
          range={USE_OF_FUNDS_RANGES.stock}
          value={display.stock}
          onChange={(v) => setValue('stock', v)}
          disabled={!canEdit}
          subText="£4,900 default · breakdown below"
          colour="#2DD4BF"
        />
      </div>

      {/* Working Capital — full-width residual */}
      <WorkingCapitalSlider
        amount={display.workingCapital}
        target={display.total}
        allocated={display.allocated}
      />

      {/* Per-line summary table */}
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:20, marginTop:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:14 }}>Allocation summary</div>
        {USE_OF_FUNDS.filter(u => u.key !== 'working').map(u => {
          const amount = display[u.key]
          const pct = display.total > 0 ? amount / display.total : 0
          const rentMonthsTag = u.key === 'rent' ? ` (${display.rentMonths} ${display.rentMonths === 1 ? 'month' : 'months'})` : ''
          return (
            <div key={u.key} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
                <span style={{ fontSize:13, color:'var(--cream)' }}>{u.item}{rentMonthsTag}</span>
                <span style={{ fontSize:13, color:'var(--gold)', fontVariantNumeric:'tabular-nums' }}>{fmt(amount)} <span style={{ color:'var(--cream-dim)', fontSize:11 }}>· {(pct * 100).toFixed(1)}%</span></span>
              </div>
              <div style={{ height:4, background:'rgba(201,168,76,0.08)', borderRadius:2 }}>
                <div style={{ width:`${pct * 100}%`, height:'100%', background:'var(--gold)', borderRadius:2 }} />
              </div>
            </div>
          )
        })}
        {/* Working Capital row — derived */}
        {(() => {
          const amount = display.workingCapital
          const pct = display.total > 0 ? amount / display.total : 0
          return (
            <div style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
                <span style={{ fontSize:13, color:'var(--teal)' }}>Working Capital <span style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.06em' }}>· residual</span></span>
                <span style={{ fontSize:13, color:'var(--teal)', fontVariantNumeric:'tabular-nums' }}>{fmt(amount)} <span style={{ color:'var(--cream-dim)', fontSize:11 }}>· {(pct * 100).toFixed(1)}%</span></span>
              </div>
              <div style={{ height:4, background:'rgba(45,212,191,0.08)', borderRadius:2 }}>
                <div style={{ width:`${pct * 100}%`, height:'100%', background:'var(--teal)', borderRadius:2 }} />
              </div>
            </div>
          )
        })()}
        <div style={{ borderTop:'1px solid rgba(201,168,76,0.2)', marginTop:12, paddingTop:10, display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, color:'var(--cream)', fontWeight:600 }}>Total raise</span>
          <span className="serif" style={{ fontSize:18, color: isLocked ? '#10B981' : 'var(--gold)' }}>{fmt(display.total)}</span>
        </div>
      </div>

      {/* Stock & Operational Setup — grouped breakdown (unchanged from prior version) */}
      <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:'20px 24px', marginTop:20, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, color:'#2DD4BF', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>{t('setup.eyebrow')}</div>
            <h3 className="serif" style={{ fontSize:22, color:'var(--cream)', margin:0 }}>{t('setup.title')}</h3>
          </div>
          <div style={{ fontSize:11, color:'#9CA3AF', maxWidth:340, textAlign:'right' }}>{t('setup.subtitle')}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {setupGroups.map(g => {
            const sub = groupSubtotal(g)
            const hex = g.accent
            const bgRgba = `${hex}0D`
            const borderRgba = `${hex}33`
            return (
              <div key={g.key} style={{ background:bgRgba, border:`1px solid ${borderRgba}`, borderRadius:8, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <div style={{ fontSize:18, lineHeight:1 }}>{g.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--cream)', letterSpacing:'0.04em' }}>
                      {t(`setup.groups.${g.key}.title`)}
                    </div>
                  </div>
                  <span style={{ fontSize:9, color:hex, border:`1px solid ${hex}55`, borderRadius:3, padding:'1px 6px', letterSpacing:'0.06em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
                    {t(`setup.vatLabels.${g.vatKey}`)}
                  </span>
                  <span style={{ fontSize:14, fontWeight:700, color:hex, marginLeft:4, whiteSpace:'nowrap' }}>{fmtL(sub)}</span>
                </div>
                <div style={{ fontSize:10, color:'#9CA3AF', marginBottom:10, marginLeft:28 }}>
                  {t(`setup.groups.${g.key}.subtitle`)}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {g.items.map(itemKey => {
                    const item = setupItems[itemKey]
                    return (
                      <div key={itemKey} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0' }}>
                        <div style={{ fontSize:14, lineHeight:1, width:18, textAlign:'center', flexShrink:0 }}>{item.icon}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, color:'var(--cream)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {t(`setup.items.${itemKey}.label`)}
                          </div>
                        </div>
                        <span style={{ fontSize:12, fontWeight:600, color:hex, flexShrink:0 }}>{fmtL(item.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ borderTop:'1px solid rgba(45,212,191,0.2)', marginTop:14, paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'#9CA3AF' }}>{t('setup.totalLabel')}</span>
          <div style={{ display:'flex', alignItems:'center', gap:14, fontSize:11, color:'#9CA3AF' }}>
            {setupGroups.map((g, i) => (
              <span key={g.key} style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:3, background:g.accent, display:'inline-block' }} />
                {fmtL(groupSubtotal(g))}
                {i < setupGroups.length - 1 && <span style={{ color:'#4B5563', marginLeft:9 }}>+</span>}
              </span>
            ))}
            <span style={{ fontSize:14, fontWeight:700, color:'#2DD4BF', marginLeft:8 }}>= {fmtL(setupTotal)}</span>
          </div>
        </div>
      </div>

      {/* Hardware breakdown — unchanged from prior version */}
      <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, color:'#4FC3F7', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>{t('hardware.eyebrow')}</div>
            <h3 className="serif" style={{ fontSize:22, color:'var(--cream)', margin:0 }}>{t('hardware.title')}</h3>
          </div>
          <div style={{ fontSize:11, color:'#9CA3AF', maxWidth:340, textAlign:'right' }}>{t('hardware.subtitle')}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
          {hardwareItems.map(item => (
            <div key={item.key} style={{ background:'rgba(79,195,247,0.04)', border:'1px solid rgba(79,195,247,0.18)', borderRadius:6, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontSize:24, flexShrink:0, lineHeight:1 }}>{item.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--cream)', marginBottom:2 }}>{t(`hardware.items.${item.key}.label`)}</div>
                <div style={{ fontSize:11, color:'#9CA3AF', lineHeight:1.4 }}>{t(`hardware.items.${item.key}.note`)}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#4FC3F7' }}>{fmtL(item.amount)}</div>
                <div style={{ fontSize:9, color:'#6B7280', letterSpacing:'0.06em', textTransform:'uppercase' }}>ex VAT</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid rgba(79,195,247,0.25)', marginTop:14, paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#9CA3AF' }}>{t('hardware.totalLabel')}</span>
          <span style={{ fontSize:14, fontWeight:700, color:'#4FC3F7' }}>{fmtL(hardwareExVat)} ex VAT  ·  {fmtL(hardwareIncVat)} {vatLabel}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────

function HeadlineCard({ label, value, sub, colour }) {
  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:18 }}>
      <div style={{ fontSize:10, color:'var(--cream-dim)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      <div className="serif" style={{ fontSize:'clamp(1.4rem, 2.4vw, 1.8rem)', color:colour, lineHeight:1, marginBottom:6 }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--cream-dim)' }}>{sub}</div>
    </div>
  )
}

function ContinuousSlider({ meta, range, value, onChange, disabled, subText, colour = 'var(--gold)' }) {
  return (
    <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:10, padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
        <span style={{ fontSize:13, color:'var(--cream)', fontWeight:500 }}>{meta.item}</span>
        <span style={{ fontSize:15, color:colour, fontVariantNumeric:'tabular-nums' }}>{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={range.min} max={range.max} step={range.step}
        value={Math.max(range.min, Math.min(range.max, value))}
        onChange={e => onChange(+e.target.value)}
        disabled={disabled}
        style={{ width:'100%', accentColor:colour, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
      />
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--gold-dim)', marginTop:4 }}>
        <span>{fmt(range.min)}</span>
        <span style={{ fontSize:10, color:'var(--cream-dim)' }}>{subText || meta.note}</span>
        <span>{fmt(range.max)}</span>
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
        <span style={{ fontSize:15, color:'#8B5CF6', fontVariantNumeric:'tabular-nums' }}>{fmt(current.amount)}</span>
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
                flex:1, padding:'8px 10px', borderRadius:6, fontSize:12,
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: active ? 'rgba(139,92,246,0.18)' : 'transparent',
                border: `1px solid ${active ? '#8B5CF6' : 'rgba(139,92,246,0.25)'}`,
                color: active ? '#A78BFA' : 'var(--cream-dim)',
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
      <div style={{ fontSize:10, color:'var(--gold-dim)', marginTop:8 }}>Lease cadence — pick 1, 2 or 3 months upfront</div>
    </div>
  )
}

// IP licence is a fixed contractual amount — render as a static card
// styled like a slider but with no interactive control. Makes it visually
// consistent with the other 3 lines while making the "no slider" stance
// obvious.
function FixedLine({ meta, amount, colour, subText }) {
  return (
    <div style={{ background:'rgba(201,168,76,0.04)', border:`1px dashed rgba(201,168,76,0.3)`, borderRadius:10, padding:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
        <span style={{ fontSize:13, color:'var(--cream)', fontWeight:500 }}>{meta.item}</span>
        <span style={{ fontSize:15, color:colour, fontVariantNumeric:'tabular-nums' }}>{fmt(amount)}</span>
      </div>
      <div style={{
        height:6, background:'rgba(201,168,76,0.06)', borderRadius:3,
        position:'relative',
      }}>
        <div style={{ width:'100%', height:'100%', background:colour, borderRadius:3, opacity:0.5 }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:10, color:'var(--gold-dim)', marginTop:6 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:9, color:colour, letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:600 }}>🔒 Contractual · fixed</span>
        <span style={{ fontSize:10, color:'var(--cream-dim)' }}>{subText}</span>
      </div>
    </div>
  )
}

function WorkingCapitalSlider({ amount, target, allocated }) {
  const pct = target > 0 ? Math.min(1, amount / target) : 0
  const overAllocated = Math.max(0, allocated - target)
  return (
    <div style={{ background:'var(--ink-2)', border:`1px solid ${overAllocated > 0 ? 'rgba(229,57,53,0.4)' : 'rgba(45,212,191,0.25)'}`, borderRadius:10, padding:18, marginTop:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
        <span style={{ fontSize:13, color: overAllocated > 0 ? '#E53935' : 'var(--teal)', fontWeight:500 }}>
          Working Capital <span style={{ fontSize:10, color:'var(--cream-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginLeft:8 }}>residual · auto-filled</span>
        </span>
        <span style={{ fontSize:18, color: overAllocated > 0 ? '#E53935' : 'var(--teal)', fontVariantNumeric:'tabular-nums', fontWeight:600 }}>{fmt(amount)}</span>
      </div>
      <div style={{ height:8, background:'rgba(255,255,255,0.04)', borderRadius:4, overflow:'hidden', cursor:'not-allowed' }}>
        <div style={{ height:'100%', width:`${pct * 100}%`, background: overAllocated > 0 ? 'linear-gradient(90deg, #E53935, rgba(229,57,53,0.6))' : 'linear-gradient(90deg, var(--teal), rgba(45,212,191,0.6))', borderRadius:4, transition:'width 0.2s' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--cream-dim)', marginTop:6 }}>
        <span>£0</span>
        <span style={{ fontStyle:'italic', color: overAllocated > 0 ? '#E53935' : 'var(--cream-dim)' }}>
          {overAllocated > 0
            ? `Over-allocated by ${fmt(overAllocated)} — drag a slider down or raise the funding amount on Cover`
            : `= ${fmt(target)} funding − ${fmt(allocated)} allocated across the 4 lines above`}
        </span>
        <span>{fmt(target)}</span>
      </div>
    </div>
  )
}

function btnStyle({ disabled = false, gold = false, ghost = false }) {
  const base = {
    padding:'8px 18px', borderRadius:6, fontSize:12, letterSpacing:'0.05em', fontWeight:600,
    cursor: disabled ? 'not-allowed' : 'pointer', transition:'all 0.15s', opacity: disabled ? 0.4 : 1,
  }
  if (gold)  return { ...base, background:'var(--gold)', color:'var(--ink)', border:'1px solid var(--gold)' }
  if (ghost) return { ...base, background:'transparent', color:'var(--cream-dim)', border:'1px solid rgba(201,168,76,0.3)' }
  return base
}
