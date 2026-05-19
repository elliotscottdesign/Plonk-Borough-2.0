import React from 'react'
import { ACTUALS_2025, HACKNEY_INVESTOR_RETURNS } from '../../data/hackney.js'

// LeonieAgreement — private investor's agreement tab.
//
// Specific to Leonie Sands (Investor #1, Round 1 Hackney):
//   • £5,000 cash subscription
//   • 5% B-class non-voting equity
//   • 10% non-cumulative preferred yield on her £5k = £500/yr
//   • Investor-priority quarterly draws with deferred catch-up
//   • Y3 Put option: fair market value × her 5% equity — NO multiple-of-money
//     cap (Leonie specifically: she can sell at market value on exercise)
//   • Y5 exit: pro-rata, uncapped (illustrative 5% of £751k = £37.5k)
//
// Gated to access codes:
//   • LEONIE — the investor herself
//   • 888999 — Elliot, for review before sharing
// All other codes filter this tab out of the top-tab list entirely so it
// never appears for TEST1 / BRAZIL / JOHN1 / new investors.
//
// This is a DRAFT for solicitor review — banner at the top makes that
// explicit. Live numbers pulled from data/hackney.js so they stay in
// lockstep with the rest of the deck.

const INK_BG  = 'var(--ink-2)'
const BORDER  = '1px solid rgba(201,168,76,0.18)'
const GOLD    = 'var(--gold)'
const CREAM   = 'var(--cream)'
const CREAM_D = 'var(--cream-dim)'

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// Leonie-specific 5-year projection (assumes she is the sole external
// B-class holder — i.e. no new investor takes the remaining £25k). If a
// new investor subscribes, her preferred share stays at £500/yr but the
// residual pool shrinks by their preferred entitlement; reflected in
// the deck's main WaterfallReturns slide.
const LEONIE_EQUITY    = 0.05
const LEONIE_CASH      = 5000
const LEONIE_PREF_YEAR = 500          // 10% of £5k
const LEONIE_RETURNS = HACKNEY_INVESTOR_RETURNS.fiveYear.map(yr => {
  const preferred = Math.min(LEONIE_PREF_YEAR, yr.profit)
  const residual  = Math.max(0, yr.profit - preferred) * LEONIE_EQUITY
  return {
    year: yr.year,
    profit: yr.profit,
    preferred,
    residual,
    total: preferred + residual,
  }
})
const LEONIE_CUM_DIV   = LEONIE_RETURNS.reduce((s, y) => s + y.total, 0)
const LEONIE_Y5_EXIT   = HACKNEY_INVESTOR_RETURNS.exit.businessValue * LEONIE_EQUITY
const LEONIE_TOTAL_RET = LEONIE_CUM_DIV + LEONIE_Y5_EXIT
const LEONIE_MOM       = LEONIE_TOTAL_RET / LEONIE_CASH

export default function LeonieAgreement() {
  return (
    <div style={{ padding:'32px 48px', maxWidth:1100, margin:'0 auto', color:CREAM, lineHeight:1.6 }}>

      {/* Hero */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:GOLD, letterSpacing:'0.18em', textTransform:'uppercase', fontWeight:700, marginBottom:8 }}>
          Private · For Leonie Sands · Confidential
        </div>
        <h1 className="serif" style={{ fontSize:'clamp(2.2rem, 4.4vw, 3rem)', color:CREAM, lineHeight:1.15, margin:0 }}>
          Investors' Agreement
        </h1>
        <p style={{ fontSize:15, color:CREAM_D, marginTop:10, maxWidth:820 }}>
          No Dice Hackney Ltd · Round 1 (Hurried Sale) · £5,000 subscription for 5% B-class equity. This is a private draft prepared for you to review ahead of taking it to a solicitor to finalise.
        </p>
      </div>

      <div className="gold-rule" style={{ width:160, marginBottom:28 }} />

      {/* Draft banner */}
      <DraftBanner />

      {/* 1. Parties */}
      <Section number="1" title="Parties">
        <P>
          <strong style={{ color:CREAM }}>The Company.</strong> No Dice Hackney Ltd, a company incorporated in England and Wales, trading from London Fields, London E8 as a bar with DJ &amp; events, garden, pool, arcades and board games.
        </P>
        <P>
          <strong style={{ color:CREAM }}>The Founder.</strong> Elliot Scott, holder of 100% of the A-class voting shares.
        </P>
        <P>
          <strong style={{ color:CREAM }}>The Investor.</strong> Leonie Sands (the "<strong style={{ color:CREAM }}>Investor</strong>"), Round 1 B-class subscriber for £5,000.
        </P>
      </Section>

      {/* 2. The Round + cap table */}
      <Section number="2" title="The Round &amp; cap table">
        <P>
          The Round size is <strong style={{ color:CREAM }}>£50,000</strong> representing 50% of the post-money equity. Pre-money valuation £50,000; post-money £100,000. Implied entry multiple of <strong style={{ color:CREAM }}>1.62×</strong> verified 2025 EBITDA of {fmt(ACTUALS_2025.ebitda)} — explicitly priced below sector average to reflect the hurried-sale context.
        </P>

        <CapTable />

        <P style={{ marginTop:16 }}>
          The Investor subscribes for <strong style={{ color:GOLD }}>5%</strong> of the post-money equity at £1,000 per 1% (= £5,000 total). All Round 1 shares are <strong style={{ color:CREAM }}>B-class non-voting</strong>; the Founder retains 100% of the A-class voting shares.
        </P>
      </Section>

      {/* 3. Use of funds */}
      <Section number="3" title="Use of funds">
        <P>
          Round proceeds are applied substantially in accordance with the Use of Funds tool published on the live deck (Use of Funds slide). Headline allocation across the £25k externally raised + £20k Founder buyback:
        </P>
        <UseOfFundsTable />
        <P style={{ marginTop:12 }}>
          The Founder may reallocate within the ranges shown on the live Use of Funds tool. The £19,500 inc-VAT rent deposit is paid monthly out of trading cash during the three-month rent-free period — it does not consume Day-1 Round proceeds.
        </P>
      </Section>

      {/* 4. Preferred yield + distribution */}
      <Section number="4" title="Preferred dividend &amp; distribution waterfall">
        <P>
          The Investor is entitled to a <strong style={{ color:GOLD }}>10% per annum non-cumulative preferred dividend</strong> on her £5,000 subscription (= <strong style={{ color:CREAM }}>£500/yr</strong>). The preferred is paid from operating profit each year <em>before</em> any pro-rata residual distribution. Unpaid preferred does NOT roll forward into later years.
        </P>
        <P>
          The Founder's £20,000 Buyback B shares rank pari passu for residual distributions but receive <em>no preferred yield</em>. The Investor (and any future external B holder) ranks <strong style={{ color:CREAM }}>ahead</strong> of the Founder's Buyback B in the dividend queue.
        </P>
        <P>
          <strong style={{ color:CREAM }}>Annual distribution order.</strong> Each financial year, distributable profit is applied in this order:
        </P>
        <OrderedList items={[
          'Director\'s salary (set in the FY budget; £15,885 inc employer NI for FY 2026/27).',
          'Working capital top-up to the Reserve Target (see clause 5).',
          'Preferred yield to external B holders (the Investor + any future external).',
          'Residual — split pro-rata across all equity (A + B, including Founder Buyback B).',
        ]} />
        <P>
          Distributions are paid <strong style={{ color:CREAM }}>quarterly in arrears</strong> at calendar quarter-ends (Mar / Jun / Sep / Dec).
        </P>
      </Section>

      {/* 5. Working capital reserve */}
      <Section number="5" title="Working-capital reserve · investor-priority mechanics">
        <ul style={ulStyle}>
          <li><strong style={{ color:CREAM }}>Floor: £30,000</strong> — operational red line; the Company will not let the bank balance fall below this.</li>
          <li><strong style={{ color:CREAM }}>Target: £45,000</strong> — fully-funded position (Floor + £15k cushion for VAT, supplier swings and one-off repairs).</li>
        </ul>
        <P>
          At each calendar quarter-end:
        </P>
        <ul style={ulStyle}>
          <li>If the Reserve is at or above the <strong style={{ color:CREAM }}>Floor</strong> and there is positive accrued surplus, the <strong style={{ color:GOLD }}>Investor's pro-rata share is paid first</strong>; the Founder takes their share after.</li>
          <li>If the Reserve is below the Floor, the entire quarter's distribution is <strong style={{ color:CREAM }}>deferred</strong> for both parties (the Founder is paid after the Investor, so neither is paid). Cash sits in the Reserve to help rebuild it.</li>
          <li>Once the Reserve is at or above the <strong style={{ color:CREAM }}>Target</strong>, deferred Investor amounts are paid down on top of the current quarter's share. Investor catch-up is paid before any Founder catch-up.</li>
        </ul>
      </Section>

      {/* 6. Y3 Put */}
      <Section number="6" title="Year-3 buyback right (put option)">
        <P>
          The Investor is granted the right, exercisable in the 30-day window following the issue of the Year-3 audited (or director-certified) accounts, to require the Company to repurchase all (but not part) of her B shares.
        </P>
        <P>
          <strong style={{ color:CREAM }}>Y3 Put price</strong> = <strong style={{ color:GOLD }}>Fair Market Value</strong> of the Company at the exercise date × the Investor's 5% equity. <strong style={{ color:CREAM }}>No multiple-of-money cap applies</strong> — the Investor can sell her shares at full market value on exercise.
        </P>
        <P>
          Fair Market Value is determined by the directors acting reasonably (by reference to a multiple of trailing-12-month EBITDA consistent with sector comparables). The Investor may, at her cost, require an independent valuation by a chartered accountant if she disputes the figure; the independent valuation binds both parties.
        </P>
        <P>
          If multiple Investors exercise in the same window, payments are <strong style={{ color:CREAM }}>staggered over up to 12 months</strong> to protect the Company's operating cash.
        </P>
        <P>
          If the Investor elects to convert her Round 1 B shares into Round 2 equity (where Round 2 is offered), she <strong style={{ color:CREAM }}>waives the Y3 Put</strong> — this prevents a "convert + immediately put" arbitrage. The Year-5 exit remains uncapped and pro-rata for everyone.
        </P>
      </Section>

      {/* 7. Returns table — Leonie specific */}
      <Section number="7" title="Illustrative returns · £5,000 at 5%">
        <P>
          The table below assumes the Investor is the <em>sole external B holder</em> (i.e. no new investor takes the remaining £25,000). If a new external investor does subscribe, the Investor's preferred stays at £500/yr but the residual pool shrinks by the new investor's preferred entitlement — broadly unchanged at her 5% share.
        </P>
        <ReturnsTable />
        <ReturnsSummary />
        <P style={{ fontSize:12, color:CREAM_D, fontStyle:'italic', marginTop:14 }}>
          Indicative only — not a forecast or guarantee. Drawn from the forecast in the live deck (HACKNEY_INVESTOR_RETURNS.fiveYear) on the date this agreement was prepared.
        </P>
      </Section>

      {/* 8. Governance */}
      <Section number="8" title="Governance &amp; reserved matters">
        <P>
          <strong style={{ color:CREAM }}>Ordinary Consent</strong> — 50% of A-class votes. <strong style={{ color:CREAM }}>Reserved Matters Consent</strong> — 75% of total issued share capital (A + B, voting together as one class for this purpose only). The following matters require Reserved Matters Consent:
        </P>
        <OrderedList items={[
          'Sale of the business or any material asset.',
          'Winding-up or dissolution of the Company.',
          'Issuance of new shares or new share classes.',
          'Amendment to the Articles of Association or this Agreement.',
          'Taking on debt above £25,000.',
          'Acquisition of another business.',
          'Change of business purpose or trading name.',
          'Appointment or removal of a director.',
          'Distributions exceeding the approved waterfall.',
          'Related-party transactions above £10,000.',
        ]} />
      </Section>

      {/* 9. Information rights */}
      <Section number="9" title="Information rights">
        <ul style={ulStyle}>
          <li><strong style={{ color:CREAM }}>Quarterly management accounts</strong> within 30 days of each calendar quarter-end — revenue, cost categories, EBITDA, Reserve balance, accrued surplus, current distribution position.</li>
          <li><strong style={{ color:CREAM }}>Annual accounts</strong> within 90 days of each financial year-end.</li>
          <li><strong style={{ color:CREAM }}>Cap table</strong> updates within 14 days of any change.</li>
          <li>Reasonable ad-hoc access to the trading data underlying the live deck at nodice.bar/hackney, on reasonable notice during business hours.</li>
        </ul>
      </Section>

      {/* 10. Exit + tag/drag */}
      <Section number="10" title="Sale event · Year-5 exit · tag &amp; drag">
        <P>
          The Founder intends to pursue a Year-5 Sale Event at approximately 4× steady-state EBITDA (illustrative business value c.{fmt(HACKNEY_INVESTOR_RETURNS.exit.businessValue)} on the Y5 forecast EBITDA of {fmt(HACKNEY_INVESTOR_RETURNS.exit.y5Ebitda)}). On a Sale Event, proceeds are distributed <strong style={{ color:CREAM }}>pro-rata across all equity</strong> with no preferred return and no cap.
        </P>
        <P>
          <strong style={{ color:CREAM }}>Drag-along.</strong> If holders of more than 75% of the issued share capital (A + B combined) accept a bona fide offer for 100% of the Company, they may require remaining holders to sell on the same terms.
        </P>
        <P>
          <strong style={{ color:CREAM }}>Tag-along.</strong> If the Founder proposes to sell any A shares to a third party, the Investor has the right to tag her B shares into the same sale on the same per-share terms, pro-rata to her holding.
        </P>
      </Section>

      {/* 11. Transfers / confidentiality / warranties / general */}
      <Section number="11" title="Transfer restrictions">
        <ul style={ulStyle}>
          <li>No transfer of B shares for the first <strong style={{ color:CREAM }}>24 months</strong> without the Founder's written consent.</li>
          <li>After month 24, transfers subject to a <strong style={{ color:CREAM }}>right of first refusal</strong> (Company, then Founder) on 30 days' notice and matching the bona fide third-party offer.</li>
          <li>Transfers to immediate family or family-trust structures permitted at any time, provided the transferee accedes to this Agreement in writing.</li>
        </ul>
      </Section>

      <Section number="12" title="Confidentiality">
        <P>
          The Investor undertakes to keep confidential all non-public information about the Company — financial figures, supplier terms, customer lists, the underlying workbook, and the contents of this Agreement. Confidentiality survives termination and any transfer of B shares.
        </P>
      </Section>

      <Section number="13" title="Warranties">
        <P>
          The Founder warrants on the date of subscription that, to the best of his knowledge: (i) the 2025 actuals shown at nodice.bar/hackney are accurate in all material respects ({fmt(ACTUALS_2025.revenue)} revenue, {fmt(ACTUALS_2025.ebitda)} EBITDA, verified against Monthly Summary G15 / I15); (ii) the Company is not subject to any litigation, insolvency or material adverse claim other than as disclosed; (iii) the trading-premises lease is in good standing on the terms summarised in the deck (£65,000 + VAT per annum, 3-month deposit, 3-month rent-free start, 3% annual uplift); (iv) the Company has not granted any security, debt or option over its shares other than as disclosed in this Agreement.
        </P>
        <P>
          Warranty claims are subject to a <strong style={{ color:CREAM }}>12-month notice cap</strong> from the date of subscription and a financial cap equal to the Investor's subscribed amount, save in the case of fraud or wilful misrepresentation.
        </P>
      </Section>

      <Section number="14" title="General">
        <ul style={ulStyle}>
          <li><strong style={{ color:CREAM }}>Entire agreement.</strong> This Agreement, the Articles, and the Schedules constitute the entire agreement between the parties in relation to the Round.</li>
          <li><strong style={{ color:CREAM }}>Variation.</strong> Any variation requires Reserved Matters Consent (clause 8) and must be in writing.</li>
          <li><strong style={{ color:CREAM }}>Governing law.</strong> Laws of England and Wales; exclusive jurisdiction of the English courts.</li>
          <li><strong style={{ color:CREAM }}>Counterparts.</strong> May be signed in counterparts (including by electronic signature).</li>
          <li><strong style={{ color:CREAM }}>Costs.</strong> Each party bears its own legal and advisory costs.</li>
        </ul>
      </Section>

      {/* Signatures */}
      <div style={{ marginTop:36, padding:'24px 26px', background:INK_BG, border:BORDER, borderRadius:12 }}>
        <div style={{ fontSize:11, color:GOLD, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, marginBottom:14 }}>
          Signatures
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          <SignBlock name="Elliot Scott" role="Founder" />
          <SignBlock name="Leonie Sands" role="Investor" />
        </div>
      </div>

      <div style={{ marginTop:24, fontSize:11, color:CREAM_D, textAlign:'center', opacity:0.75 }}>
        Subject to contract · Draft for solicitor review · Confidential
      </div>
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────

const ulStyle = { margin:'8px 0 12px 0', paddingLeft:20, fontSize:14, color:CREAM_D, lineHeight:1.7 }

function DraftBanner() {
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:14,
      padding:'14px 18px',
      background:'rgba(248,113,113,0.10)',
      border:'1px solid rgba(248,113,113,0.45)',
      borderLeft:'4px solid #F87171',
      borderRadius:8,
      marginBottom:28,
    }}>
      <div style={{ fontSize:22, lineHeight:1, color:'#F87171', paddingTop:2 }}>⚠</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:11, color:'#FCA5A5', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>
          Draft for solicitor review — not legal advice
        </div>
        <div style={{ fontSize:13, color:'#FECACA', lineHeight:1.6 }}>
          This document is a working draft prepared from the deal terms shown on this site. It is intended as a structured brief for a qualified solicitor to convert into a binding Shareholders' Agreement and accompanying Articles of Association. It has not been reviewed by a lawyer. Do not sign in its current form. Leonie — please read through, leave any questions you have in the Page Notes (📝 button top-right) and we'll iron them out before the lawyer drafts the final version.
        </div>
      </div>
    </div>
  )
}

function Section({ number, title, children }) {
  return (
    <div style={{ marginBottom:30 }}>
      <h2 className="serif" style={{ fontSize:22, color:GOLD, margin:'0 0 12px 0', lineHeight:1.25 }}>
        <span style={{ color:CREAM_D, fontSize:14, marginRight:10, letterSpacing:'0.08em' }}>{number}.</span>
        <span dangerouslySetInnerHTML={{ __html: title }} />
      </h2>
      <div style={{ fontSize:14, color:CREAM, lineHeight:1.7 }}>
        {children}
      </div>
    </div>
  )
}

function P({ children, style }) {
  return (
    <p style={{ margin:'0 0 12px 0', color:CREAM_D, ...style }}>
      {children}
    </p>
  )
}

function OrderedList({ items }) {
  return (
    <ol style={{ margin:'8px 0 12px 0', paddingLeft:24, fontSize:14, color:CREAM_D, lineHeight:1.7 }}>
      {items.map((it, i) => <li key={i} style={{ marginBottom:4 }}>{it}</li>)}
    </ol>
  )
}

function CapTable() {
  const rows = [
    { who:'Founder — retained holdback (pre-money)', cls:'A', eq:'50%', cash:fmt(0),     status:'Not for sale' },
    { who:'Founder — buyback',                        cls:'B', eq:'20%', cash:fmt(20000), status:'Sold' },
    { who:'Investor #1 — Leonie Sands',               cls:'B', eq:'5%',  cash:fmt(5000),  status:'Sold · this Agreement', highlight:true },
    { who:'Available to new external investors',      cls:'B', eq:'25%', cash:fmt(25000), status:'For sale' },
  ]
  return (
    <div style={{ background:INK_BG, border:BORDER, borderRadius:10, padding:'4px 8px', marginTop:8, overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr>
            <Th>Holder</Th><Th>Class</Th><Th>Equity</Th><Th>Cash</Th><Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: r.highlight ? 'rgba(201,168,76,0.10)' : 'transparent', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              <Td highlight={r.highlight}>{r.who}</Td>
              <Td>{r.cls}</Td>
              <Td highlight={r.highlight}>{r.eq}</Td>
              <Td>{r.cash}</Td>
              <Td>{r.status}</Td>
            </tr>
          ))}
          <tr style={{ borderTop:'2px solid rgba(201,168,76,0.4)' }}>
            <Td bold>Total</Td><Td>—</Td><Td bold>100%</Td><Td bold>{fmt(50000)}</Td><Td>—</Td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function UseOfFundsTable() {
  const lines = [
    ['Assets — Liquidator (all bar fit-out, inc VAT)', fmt(12000)],
    ['Garden Refurbishment (inc VAT)',                 fmt(12000)],
    ['Interior Completion & Signage (inc VAT)',        fmt(10000)],
    ['Marketing — Pre-launch & Year 1 (inc VAT)',       fmt(3000)],
    ['Legals & Restart',                                fmt(2000)],
    ['Rent Deposit (paid monthly from trading cash)',   '£0 from Round'],
    ['Working Capital (derived residual)',              'balancing figure'],
  ]
  return (
    <div style={{ background:INK_BG, border:BORDER, borderRadius:10, padding:'4px 8px', marginTop:8, overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr><Th>Line</Th><Th align="right">Headline £</Th></tr>
        </thead>
        <tbody>
          {lines.map(([k, v], i) => (
            <tr key={i} style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              <Td>{k}</Td>
              <Td align="right">{v}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReturnsTable() {
  return (
    <div style={{ background:INK_BG, border:BORDER, borderRadius:10, padding:'4px 8px', marginTop:8, overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr>
            <Th>Year</Th><Th align="right">Op profit</Th><Th align="right">Preferred (£500)</Th><Th align="right">Residual @ 5%</Th><Th align="right">Total to Leonie</Th>
          </tr>
        </thead>
        <tbody>
          {LEONIE_RETURNS.map((r, i) => (
            <tr key={i} style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              <Td>{r.year}</Td>
              <Td align="right">{fmt(r.profit)}</Td>
              <Td align="right">{fmt(r.preferred)}</Td>
              <Td align="right">{fmt(r.residual)}</Td>
              <Td align="right" bold>{fmt(r.total)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReturnsSummary() {
  const items = [
    { label:'5-yr cumulative dividends', value:fmt(LEONIE_CUM_DIV) },
    { label:'Y5 exit (5% × ' + fmt(HACKNEY_INVESTOR_RETURNS.exit.businessValue) + ')', value:fmt(LEONIE_Y5_EXIT) },
    { label:'Total returned',            value:fmt(LEONIE_TOTAL_RET) },
    { label:'Money-on-money',            value: LEONIE_MOM.toFixed(2) + '×' },
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginTop:14 }}>
      {items.map((it, i) => (
        <div key={i} style={{ padding:'12px 14px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.32)', borderRadius:8 }}>
          <div style={{ fontSize:10, color:'#34D399', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>{it.label}</div>
          <div className="serif" style={{ fontSize:20, color:'#10B981', fontWeight:600 }}>{it.value}</div>
        </div>
      ))}
    </div>
  )
}

function Th({ children, align='left' }) {
  return (
    <th style={{ padding:'10px 12px', textAlign:align, fontSize:11, color:CREAM_D, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>
      {children}
    </th>
  )
}

function Td({ children, align='left', bold, highlight }) {
  return (
    <td style={{ padding:'10px 12px', textAlign:align, color: highlight ? GOLD : CREAM, fontWeight: bold ? 600 : 400, fontVariantNumeric:'tabular-nums' }}>
      {children}
    </td>
  )
}

function SignBlock({ name, role }) {
  return (
    <div>
      <div style={{ fontSize:11, color:CREAM_D, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>{role}</div>
      <div className="serif" style={{ fontSize:16, color:CREAM, marginBottom:18 }}>{name}</div>
      <div style={{ borderBottom:'1px solid rgba(201,168,76,0.4)', height:32 }} />
      <div style={{ fontSize:11, color:CREAM_D, marginTop:6 }}>Signature</div>
      <div style={{ borderBottom:'1px solid rgba(201,168,76,0.4)', height:32, marginTop:12 }} />
      <div style={{ fontSize:11, color:CREAM_D, marginTop:6 }}>Date</div>
    </div>
  )
}
