import React, { useState, useEffect } from 'react'

// ─── Glassware breakage tracker ──────────────────────────────────────────
// Set the baseline at the reopen stock audit (count all glasses). Then, each
// time you re-count, enter glasses received (replacements bought) + the current
// count → breakage = baseline + received − current. Tracks the count and an
// estimated replacement cost, persisted locally. Per-glass costs are rough
// Per-glass costs from the BCS invoices (prices are per CASE):
//   Old Fashioned £11.58/case ÷ 12 = £0.97   ·   Shot £12.73/case ÷ 24 = £0.53
//   Wine Vino £53.14/case ÷ 24 = £2.21
// Tall & Prosecco weren't in those invoices — estimated until an invoice lands.
const GLASSES = [
  { key: 'tall',     label: 'Tall / highball',       target: 100, cost: 1.50, est: true },
  { key: 'rocks',    label: 'Rocks / Old Fashioned',  target: 100, cost: 0.97 },
  { key: 'shot',     label: 'Shot',                   target: 100, cost: 0.53 },
  { key: 'wine',     label: 'Wine',                   target: 60,  cost: 2.21 },
  { key: 'prosecco', label: 'Prosecco / flute',       target: 50,  cost: 2.00, est: true },
]
const KEY = 'ndb_ops_glass_breakage_v1'
const money = (n) => '£' + (Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function GlassBreakage() {
  const [st, setSt] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
  })
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* ignore */ } }, [st])

  const field = (k, f) => st[`${k}_${f}`]
  const setField = (k, f, v) => setSt(s => ({ ...s, [`${k}_${f}`]: v }))
  const num = (k, f, dflt = 0) => {
    const v = field(k, f)
    return v === '' || v == null ? dflt : Number(v)
  }
  const breakageOf = (g) => Math.max(0, num(g.key, 'base', g.target) + num(g.key, 'recv') - num(g.key, 'count', g.target))

  const totalBreak = GLASSES.reduce((s, g) => s + breakageOf(g), 0)
  const totalCost = GLASSES.reduce((s, g) => s + breakageOf(g) * g.cost, 0)

  const setBaselineToTarget = () => {
    const next = { ...st, baselineDate: new Date().toISOString().slice(0, 10) }
    GLASSES.forEach(g => { next[`${g.key}_base`] = g.target; next[`${g.key}_recv`] = ''; next[`${g.key}_count`] = '' })
    setSt(next)
  }

  const inp = { width: '100%', textAlign: 'center', padding: '5px 4px', fontSize: 13, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.25)', color: 'var(--cream)', outline: 'none' }
  const hd = { padding: '4px', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cream-dim)', textAlign: 'center', fontWeight: 600 }

  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 10, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
        <div className="serif" style={{ fontSize: 17, color: '#818CF8' }}>Glassware breakage</div>
        <div style={{ fontSize: 12, color: 'var(--cream-dim)' }}>
          {totalBreak} broken · ~{money(totalCost)} to replace{st.baselineDate ? ` · since ${st.baselineDate}` : ''}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.55, marginBottom: 12 }}>
        Set the <strong>baseline</strong> at your reopen audit (count all glasses). Then each re-count, enter glasses
        <strong> received</strong> (replacements bought) and the <strong>current count</strong> — breakage = baseline + received − current.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px 70px 90px', gap: 8, marginBottom: 4 }}>
        <div style={{ ...hd, textAlign: 'left' }}>Glass</div>
        <div style={hd}>Target</div><div style={hd}>Baseline</div><div style={hd}>Received</div><div style={hd}>Counted</div><div style={hd}>Broken</div>
      </div>
      {GLASSES.map(g => {
        const b = breakageOf(g)
        return (
          <div key={g.key} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px 70px 90px', gap: 8, alignItems: 'center', padding: '5px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 13, color: 'var(--cream)' }}>{g.label}{g.est && <span title="cost estimated — not in BCS invoices" style={{ color: 'var(--gold-dim)' }}>*</span>}</div>
            <div style={{ fontSize: 13, color: 'var(--cream-dim)', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{g.target}</div>
            <input type="number" min="0" style={inp} placeholder={String(g.target)} value={field(g.key, 'base') ?? ''} onChange={e => setField(g.key, 'base', e.target.value)} />
            <input type="number" min="0" style={inp} placeholder="0" value={field(g.key, 'recv') ?? ''} onChange={e => setField(g.key, 'recv', e.target.value)} />
            <input type="number" min="0" style={inp} placeholder="–" value={field(g.key, 'count') ?? ''} onChange={e => setField(g.key, 'count', e.target.value)} />
            <div style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: b > 0 ? '#F87171' : 'var(--cream-dim)' }}>
              {b}{b > 0 && <span style={{ fontSize: 10, color: 'var(--cream-dim)', fontWeight: 400 }}> · {money(b * g.cost)}</span>}
            </div>
          </div>
        )
      })}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 10, flexWrap: 'wrap' }}>
        <button onClick={setBaselineToTarget} style={{ padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: 'rgba(129,140,248,0.16)', border: '1px solid #818CF8', color: '#C7D2FE', fontWeight: 600 }}>
          Set baseline = target (reopen audit)
        </button>
        <div style={{ fontSize: 10, color: 'var(--gold-dim)', lineHeight: 1.5, textAlign: 'right', maxWidth: 320 }}>
          Costs from BCS invoices (per case ÷ size): Rocks £0.97 · Shot £0.53 · Wine £2.21.
          Tall &amp; Prosecco* estimated (not in those invoices) — send one to firm up.
        </div>
      </div>
    </div>
  )
}
