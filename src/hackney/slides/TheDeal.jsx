import React from 'react'
import {
  HACKNEY_DEAL,
  HACKNEY_USE_OF_FUNDS,
  HACKNEY_ACTUALS_2025,
  HACKNEY_SECTOR,
} from '../../data/hackney.js'

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const pct = (n, d=2) => (n*100).toFixed(d) + '%'

export default function TheDeal() {
  const totalUseOfFunds = HACKNEY_USE_OF_FUNDS.reduce((s, r) => s + r.amount, 0)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>The Deal</div>
        <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05, color: 'var(--cream)', marginBottom: 14 }}>
          {fmt(HACKNEY_DEAL.investment)} for {pct(HACKNEY_DEAL.investorEq)} of the post-money business.
        </h2>
        <p style={{ fontSize: 17, color: 'var(--cream-dim)', maxWidth: 720, lineHeight: 1.6 }}>
          Priced at <strong style={{ color: 'var(--cream)' }}>{HACKNEY_DEAL.multiple.toFixed(1)}× verified 2025 EBITDA</strong> — the hospitality sector average per Houlihan Lokey H1 2025. Defensible benchmark, no multiple-expansion bet.
        </p>
      </div>

      <div className="gold-rule" style={{ marginBottom: 28 }} />

      {/* VALUATION BUILD */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>Valuation build</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, alignItems: 'stretch' }}>
          {[
            { label: '2025 EBITDA',     value: fmt(HACKNEY_ACTUALS_2025.profit), sub: 'Verified bar-only profit' },
            { label: '× Multiple',      value: `${HACKNEY_DEAL.multiple.toFixed(1)}×`, sub: 'Hospitality sector average' },
            { label: 'Pre-money',       value: fmt(HACKNEY_DEAL.preMoney), sub: 'Founder retained value' },
            { label: 'Post-money',      value: fmt(HACKNEY_DEAL.postMoney), sub: `+ ${fmt(HACKNEY_DEAL.investment)} investment` },
          ].map((c, i) => (
            <div key={c.label} style={{ padding: '0 18px', borderRight: i < 3 ? '1px solid rgba(201,168,76,0.15)' : 'none' }}>
              <div style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{c.label}</div>
              <div className="serif" style={{ fontSize: '1.7rem', color: i === 3 ? 'var(--gold)' : 'var(--cream)', lineHeight: 1, marginBottom: 6 }}>{c.value}</div>
              <div style={{ fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.4 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* USE OF FUNDS */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>Use of funds</div>
            <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{fmt(totalUseOfFunds)} total</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {HACKNEY_USE_OF_FUNDS.map(r => {
              const pctOfTotal = r.amount / totalUseOfFunds
              return (
                <div key={r.label} style={{ padding: '12px 0', borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ color: 'var(--cream)', fontSize: 14, fontWeight: 500 }}>{r.label}</span>
                    <span style={{ color: 'var(--gold)', fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{fmt(r.amount)}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(201,168,76,0.08)', borderRadius: 2, marginBottom: 6 }}>
                    <div style={{ width: `${pctOfTotal*100}%`, height: '100%', background: 'var(--gold)', borderRadius: 2 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--cream-dim)' }}>
                    <span>{r.note}</span>
                    <span>{r.vat} · {pct(pctOfTotal, 1)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* SHARE STRUCTURE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card-highlight" style={{ padding: 22 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Share structure</div>
            <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 14, border: '1px solid rgba(201,168,76,0.2)' }}>
              <div style={{ width: `${HACKNEY_DEAL.founderEq*100}%`, background: 'var(--gold-dim)' }} />
              <div style={{ width: `${HACKNEY_DEAL.investorEq*100}%`, background: 'var(--gold)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--cream-dim)' }}>A-shares (Founder)</span>
                <span style={{ color: 'var(--cream)', fontVariantNumeric: 'tabular-nums' }}>{pct(HACKNEY_DEAL.founderEq)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--cream-dim)' }}>B-shares (Investor)</span>
                <span style={{ color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>{pct(HACKNEY_DEAL.investorEq)}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>A = B equal</div>
            <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
              No founder priority slice. After the 8% preferred return and the reserve gate, all profit splits pro-rata by equity. Pure pass-through.
            </div>
          </div>
        </div>
      </div>

      {/* SECTOR BENCHMARK */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Why 4× — sector context</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'UK mid-market avg',    value: `${HACKNEY_SECTOR.ukMidMarketAvg.toFixed(1)}×`, tone: 'dim' },
            { label: 'Hospitality avg',       value: `${HACKNEY_SECTOR.hospitalityAvgMultiple.toFixed(1)}×`, tone: 'dim' },
            { label: 'Small single-site',     value: HACKNEY_SECTOR.smallSiteRange, tone: 'dim' },
            { label: 'This deal',             value: `${HACKNEY_SECTOR.thisDeal.toFixed(1)}×`, tone: 'gold' },
          ].map(c => (
            <div key={c.label} style={{ padding: '12px 14px', background: c.tone === 'gold' ? 'rgba(201,168,76,0.1)' : 'var(--ink-3)', borderRadius: 8, border: c.tone === 'gold' ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(201,168,76,0.08)' }}>
              <div style={{ fontSize: 10, color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{c.label}</div>
              <div className="serif" style={{ fontSize: '1.5rem', color: c.tone === 'gold' ? 'var(--gold)' : 'var(--cream)', lineHeight: 1 }}>{c.value}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 12, lineHeight: 1.5 }}>
          Source: CLFI M&amp;A Monitor H1 2025 · Houlihan Lokey hospitality sector data. Distressed/liquidation comparable trades 2–3×.
        </div>
      </div>
    </div>
  )
}
