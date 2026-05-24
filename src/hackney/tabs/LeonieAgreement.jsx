import React from 'react'
import { ACTUALS_2025, HACKNEY_INVESTOR_RETURNS } from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'

// LeonieAgreement — Round 1 STANDARD TEMPLATE, personalised for Leonie.
//
// As of May 2026 this is no longer a Leonie-bespoke agreement. It now
// renders the standard Round 1 terms that every external B-share holder
// signs (Leonie's £5k, future £1k–£24k cheques alike). The page is
// personalised with her name + £5k figure but the substantive clauses
// are the template every investor sees.
//
// Key terms (per src/data/hackney.js DEAL):
//   • Cap table 76 / 24 — Founder 51% A + 25% B, external pool 24% B
//   • £5,000 cash subscription = 5% B-class equity
//   • 10% non-cumulative preferred yield on external B (£500/yr to Leonie)
//   • SEMI-ANNUAL distributions to ALL holders (Founder A 51% + Founder B
//     25% + external 24%) — pro-rata, reserve-gated
//   • Y1 LOCKUP — first distribution window lands at month 12 (end of Y1)
//   • Reserve floor £30k must be met for any distribution window to pay out
//   • Founder Y3 buyback right (CALL OPTION) — founder may call back any
//     external B holder at LOWER of fair value × equity % or 3× cash
//
// Gated to access codes:
//   • LEONIE — Leonie herself
//   • 888999 — Founder, for review before sharing
// All other codes (NODICE88, JOHN1, BRAZIL) filter this tab out of the
// top-tab list — they see the standard investor view without this tab.
//
// Status: NOT YET EXECUTED. Leonie has not countersigned or paid as of
// the page-load date. The banner makes that explicit.

const INK_BG  = 'var(--ink-2)'
const BORDER  = '1px solid rgba(201,168,76,0.18)'
const GOLD    = 'var(--gold)'
const CREAM   = 'var(--cream)'
const CREAM_D = 'var(--cream-dim)'

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// Leonie at 5% equity, £5k cheque, under the new structure (full
// subscription assumed: Founder 76% + Leonie 5% + new investor 19% =
// total external B £24k → annual preferred pool £2,400 → Leonie's
// preferred slice = £500/yr).
const LEONIE_EQUITY    = 0.05
const LEONIE_CASH      = 5000
const LEONIE_PREF_YEAR = 500          // 10% of £5k
const LEONIE_RETURNS = HACKNEY_INVESTOR_RETURNS.fiveYear.map(yr => {
  // Use the same calc the deck-wide WaterfallReturns uses — preferred
  // pool £2,400/yr × (5/24) = £500/yr to Leonie. Residual = profit −
  // £2,400; Leonie's share = 5% of residual.
  const totalPreferredPool = 2400                       // 10% × £24k external B
  const leoniePreferred    = Math.min(LEONIE_PREF_YEAR, yr.profit)
  const residualAvailable  = Math.max(0, yr.profit - totalPreferredPool)
  const leonieResidual     = residualAvailable * LEONIE_EQUITY
  return {
    year:      yr.year,
    profit:    yr.profit,
    preferred: leoniePreferred,
    residual:  leonieResidual,
    total:     leoniePreferred + leonieResidual,
  }
})
const LEONIE_CUM_DIV   = LEONIE_RETURNS.reduce((s, y) => s + y.total, 0)
const LEONIE_Y5_EXIT   = HACKNEY_INVESTOR_RETURNS.exit.businessValue * LEONIE_EQUITY
const LEONIE_TOTAL_RET = LEONIE_CUM_DIV + LEONIE_Y5_EXIT
const LEONIE_MOM       = LEONIE_TOTAL_RET / LEONIE_CASH

// Y3 founder-call scenario for Leonie: 3× cap = £15k buyback + cumulative
// Y1-Y3 dividends ≈ £16k (~£5k + ~£6k + ~£7k under base case forecast)
const LEONIE_CALL_DIVS = LEONIE_RETURNS.slice(0, 3).reduce((s, y) => s + y.total, 0)
const LEONIE_CALL_BUYBACK = LEONIE_CASH * 3
const LEONIE_CALL_TOTAL = LEONIE_CALL_DIVS + LEONIE_CALL_BUYBACK
const LEONIE_CALL_MOM = LEONIE_CALL_TOTAL / LEONIE_CASH

export default function LeonieAgreement() {
  // Live read of the founder's Use of Funds state — when 888999 drags
  // the sliders on the Use of Funds slide (or locks a snapshot), the
  // Schedule 2 table + the preamble figures here update automatically.
  const { effective, isLocked } = useLockedUseOfFunds()

  return (
    <div style={{ padding:'32px 48px', maxWidth:1100, margin:'0 auto', color:CREAM, lineHeight:1.6 }}>

      {/* Hero */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:GOLD, letterSpacing:'0.18em', textTransform:'uppercase', fontWeight:700, marginBottom:8 }}>
          Round 1 Draft Terms · For Leonie Sands · Confidential
        </div>
        <h1 className="serif" style={{ fontSize:'clamp(2.2rem, 4.4vw, 3rem)', color:CREAM, lineHeight:1.15, margin:0 }}>
          Draft Investment Terms — For Your Review
        </h1>
        <p style={{ fontSize:15, color:CREAM_D, marginTop:10, maxWidth:820 }}>
          No Dice Hackney Ltd · Round 1 · £5,000 indicative subscription for 5% B-class equity. <strong style={{ color:CREAM }}>Not yet executed.</strong> These are the standard terms every external investor in this round signs — the only personalisation is your name and the £5k figure. Review, raise any questions, and we'll take them to a solicitor before you countersign.
        </p>
      </div>

      <div className="gold-rule" style={{ width:160, marginBottom:28 }} />

      {/* Status banner */}
      <NotYetExecutedBanner />

      {/* 1. Parties */}
      <Section number="1" title="Parties">
        <P>
          <strong style={{ color:CREAM }}>The Company.</strong> No Dice Hackney Ltd, a company incorporated in England and Wales, trading from London Fields, London E8 as a bar with DJ &amp; events, garden, pool, arcades and board games. The Company is a wholly-owned subsidiary of No Dice Bars Ltd.
        </P>
        <P>
          <strong style={{ color:CREAM }}>The Founder.</strong> Elliot Scott, holder of all A-class voting shares.
        </P>
        <P>
          <strong style={{ color:CREAM }}>The Investor.</strong> Leonie Sands (the "<strong style={{ color:CREAM }}>Investor</strong>"), prospective Round 1 B-class subscriber for £5,000 — subject to execution of this Agreement.
        </P>
      </Section>

      {/* 2. The Round + cap table */}
      <Section number="2" title="The Round &amp; cap table">
        <P>
          The Round size is <strong style={{ color:CREAM }}>£49,000</strong> representing 49% of the post-money equity. Pre-money valuation £51,000; post-money £100,000. Implied entry multiple of <strong style={{ color:CREAM }}>1.65×</strong> verified 2025 EBITDA of {fmt(ACTUALS_2025.ebitda)} — explicitly priced below the c.4× sector average to reflect the hurried-sale / post-liquidation restart context.
        </P>

        <CapTable />

        <P style={{ marginTop:16 }}>
          The Investor would subscribe for <strong style={{ color:GOLD }}>5%</strong> of the post-money equity at £1,000 per 1% (= £5,000 total). All Round 1 shares are <strong style={{ color:CREAM }}>B-class non-voting</strong>; the Founder retains 100% of the A-class voting shares (51% of the company).
        </P>
      </Section>

      {/* 3. Use of funds */}
      <Section number="3" title="Use of funds">
        <P>
          Round proceeds are applied substantially in accordance with the Use of Funds tool published on the live deck (Use of Funds slide). Headline allocation across the <strong style={{ color:CREAM }}>{fmt(effective.investment + effective.committedExternal)}</strong> externally raised + <strong style={{ color:CREAM }}>{fmt(effective.founderBuyback)}</strong> Founder buyback (total capital pool <strong style={{ color:CREAM }}>{fmt(effective.capitalPool)}</strong>):
        </P>
        <UseOfFundsTable effective={effective} isLocked={isLocked} />
        <P style={{ marginTop:12 }}>
          The Founder may reallocate within the ranges shown on the live Use of Funds tool. The £19,500 inc-VAT rent deposit is paid monthly out of trading cash during the three-month rent-free period — it does not consume Day-1 Round proceeds.
        </P>
      </Section>

      {/* 4. Preferred yield + distribution */}
      <Section number="4" title="Preferred dividend &amp; distribution waterfall">
        <P>
          The Investor is entitled to a <strong style={{ color:GOLD }}>10% per annum non-cumulative preferred dividend</strong> on her £5,000 subscription (= <strong style={{ color:CREAM }}>£500/yr</strong>). The preferred is paid each distribution window <em>before</em> any pro-rata residual distribution. Unpaid preferred does NOT roll forward into later years.
        </P>
        <P>
          The Founder's £25,000 Buyback B shares rank pari passu for residual distributions but receive <em>no preferred yield</em>. The Investor (and every other external B holder) ranks <strong style={{ color:CREAM }}>ahead</strong> of the Founder's Buyback B for the preferred slice.
        </P>
        <P>
          <strong style={{ color:CREAM }}>Distribution waterfall per window.</strong> At each distribution window (see clause 5 for cadence), distributable profit is applied in this order:
        </P>
        <OrderedList items={[
          'Director\'s salary (set in the FY budget; £15,885 inc employer NI for FY 2026/27).',
          'Working-capital top-up to the Reserve Target (clause 5).',
          'Preferred yield to external B holders (£500 to Investor for her £5k, plus pro-rata to any other external B holder).',
          'Residual — split pro-rata across all equity (Founder A 51% + Founder B 25% + every external B holder). All shares draw at the same window, in proportion to their slice.',
        ]} />
      </Section>

      {/* 5. Distribution cadence + working capital reserve */}
      <Section number="5" title="Distribution cadence · Y1 lockup · working-capital reserve">
        <P>
          Distributions are paid <strong style={{ color:CREAM }}>semi-annually</strong> (every 6 months) to all holders. There is a hard <strong style={{ color:GOLD }}>Year-1 lockup</strong> — no distributions are paid to any holder (including the Founder) during the first 12 months of trading. All Y1 operating profit accrues into the working-capital reserve.
        </P>
        <ul style={ulStyle}>
          <li><strong style={{ color:CREAM }}>First distribution window:</strong> end of Y1 (month 12) — pays the full accumulated Y1 entitlement to every holder.</li>
          <li><strong style={{ color:CREAM }}>Subsequent windows:</strong> every 6 months thereafter (months 18, 24, 30, 36, …) — each window pays the period's accrued entitlement.</li>
          <li><strong style={{ color:CREAM }}>Reserve floor £30,000</strong> — operational red line. If the working-capital reserve is below the floor at a distribution date, the window is <em>deferred</em>. Amounts simply roll into the next eligible window once the reserve has rebuilt. No catch-up complexity.</li>
          <li><strong style={{ color:CREAM }}>Reserve target £45,000</strong> — fully-funded position. Once at target, any backlog from deferred windows is drained from the headroom above target.</li>
        </ul>
        <P>
          Same rule for everyone — Founder A, Founder B and external B holders all draw at the same window in proportion to their slice. No within-window priority once the lockup has ended.
        </P>
      </Section>

      {/* 6. Y3 Founder Buyback Right (Call Option) */}
      <Section number="6" title="Year-3 Founder Buyback Right (Call Option)">
        <P>
          The <strong style={{ color:CREAM }}>Founder</strong> is granted the right, exercisable in the 30-day window following the issue of the Year-3 audited (or director-certified) accounts, to require the Investor to sell all (but not part) of her B shares back to the Company.
        </P>
        <P>
          <strong style={{ color:CREAM }}>Founder Y3 Call price</strong> = the <em>lower</em> of:
        </P>
        <ul style={ulStyle}>
          <li><strong style={{ color:CREAM }}>(a)</strong> Fair Market Value of the Company at the exercise date × the Investor's 5% equity; or</li>
          <li><strong style={{ color:CREAM }}>(b)</strong> 3× the original cash subscribed (= <strong style={{ color:GOLD }}>£15,000 cap</strong> for the Investor's £5,000).</li>
        </ul>
        <P>
          Fair Market Value is determined by the directors acting reasonably (by reference to a multiple of trailing-12-month EBITDA consistent with sector comparables). The Investor may, at her cost, require an independent valuation by a chartered accountant if she disputes the figure; the independent valuation binds both parties.
        </P>
        <P>
          If the Founder exercises across multiple Investors in the same window, payments may be <strong style={{ color:CREAM }}>staggered over up to 12 months</strong> to protect the Company's operating cash.
        </P>
        <P>
          If the Investor has elected to convert her Round 1 B shares into Round 2 equity (where Round 2 is offered), her shares are <strong style={{ color:CREAM }}>not callable</strong> under this clause — the Founder's call right falls away.
        </P>
        <P>
          <strong style={{ color:GOLD }}>Cumulative dividends paid up to the exercise date are not clawed back.</strong> The Investor keeps everything she has already received in Y1–Y3 distributions, on top of the buyback price.
        </P>
      </Section>

      {/* 7. Returns table — Leonie specific */}
      <Section number="7" title="Illustrative returns · £5,000 at 5%">
        <P>
          The table below assumes full subscription (Founder 76% + Leonie 5% + new external 19% = total external B £24k → annual preferred pool £2,400 of which £500 is the Investor's slice).
        </P>
        <ReturnsTable />
        <ReturnsSummary />
        <P style={{ fontSize:12, color:CREAM_D, fontStyle:'italic', marginTop:14 }}>
          Indicative only — not a forecast or guarantee. The Y3 Founder Call would cap total return at ~{LEONIE_CALL_MOM.toFixed(1)}× MoM (={fmt(LEONIE_CALL_TOTAL)} on £5k); held to Y5 caps at ~{LEONIE_MOM.toFixed(1)}× MoM. Drawn from HACKNEY_INVESTOR_RETURNS.fiveYear on the date this draft was prepared.
        </P>
      </Section>

      {/* 8. Governance */}
      <Section number="8" title="Governance &amp; reserved matters">
        <P>
          <strong style={{ color:CREAM }}>Ordinary Consent</strong> — 50% of A-class votes (Founder controls). <strong style={{ color:CREAM }}>Reserved Matters Consent</strong> — 75% of total issued share capital (A + B, voting together as one class for this purpose only). The following matters require Reserved Matters Consent:
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
          <li><strong style={{ color:CREAM }}>Semi-annual management accounts</strong> within 30 days of each distribution window — revenue, cost categories, EBITDA, Reserve balance, accrued surplus, distribution position.</li>
          <li><strong style={{ color:CREAM }}>Annual accounts</strong> within 90 days of each financial year-end.</li>
          <li><strong style={{ color:CREAM }}>Cap-table</strong> updates within 14 days of any change.</li>
          <li>Reasonable ad-hoc access to the trading data underlying the live deck at nodice.bar/hackney, on reasonable notice during business hours.</li>
        </ul>
      </Section>

      {/* 10. Exit + tag/drag */}
      <Section number="10" title="Sale event · Year-5 exit · tag &amp; drag">
        <P>
          The Founder intends to pursue a Year-5 Sale Event at approximately 4× steady-state EBITDA (illustrative business value c.{fmt(HACKNEY_INVESTOR_RETURNS.exit.businessValue)} on the Y5 forecast EBITDA of {fmt(HACKNEY_INVESTOR_RETURNS.exit.y5Ebitda)}). On a Sale Event, proceeds are distributed <strong style={{ color:CREAM }}>pro-rata across all equity</strong> with no preferred return and no cap. Note: the Y3 Founder Call may have terminated the Investor's holding before Y5 (see clause 6).
        </P>
        <P>
          <strong style={{ color:CREAM }}>Drag-along.</strong> If holders of more than 75% of the issued share capital (A + B combined) accept a bona fide offer for 100% of the Company, they may require remaining holders to sell on the same terms.
        </P>
        <P>
          <strong style={{ color:CREAM }}>Tag-along.</strong> If the Founder proposes to sell any A shares to a third party, the Investor has the right to tag her B shares into the same sale on the same per-share terms, pro-rata to her holding.
        </P>
      </Section>

      {/* 11. Transfers */}
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
          Signatures — to be added on execution
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          <SignBlock name="Elliot Scott" role="Founder" />
          <SignBlock name="Leonie Sands" role="Investor" />
        </div>
      </div>

      <div style={{ marginTop:24, fontSize:11, color:CREAM_D, textAlign:'center', opacity:0.75 }}>
        Subject to contract · Draft pending negotiation &amp; solicitor review · Not yet executed · Confidential
      </div>
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────

const ulStyle = { margin:'8px 0 12px 0', paddingLeft:20, fontSize:14, color:CREAM_D, lineHeight:1.7 }

function NotYetExecutedBanner() {
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:14,
      padding:'14px 18px',
      background:'rgba(252,211,77,0.08)',
      border:'1px solid rgba(252,211,77,0.45)',
      borderLeft:'4px solid #FCD34D',
      borderRadius:8,
      marginBottom:28,
    }}>
      <div style={{ fontSize:22, lineHeight:1, color:'#FCD34D', paddingTop:2 }}>⚠</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:11, color:'#FCD34D', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>
          Not yet executed — draft pending your review &amp; negotiation
        </div>
        <div style={{ fontSize:13, color:'#FDE68A', lineHeight:1.6 }}>
          You have not yet countersigned or paid. These are the standard Round 1 terms every external investor signs — the only personalisation is your name and the £5k figure. Read through, leave any questions you have in the Page Notes panel (📝 button top-right), and we'll iron them out before taking the final version to a solicitor. Until you countersign, your £5k slot is held in the available external pool — not ring-fenced.
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
    { who:'Founder — retained holdback (pre-money)', cls:'A', eq:'51%', cash:fmt(0),     status:'Not for sale' },
    { who:'Founder — buyback',                        cls:'B', eq:'25%', cash:fmt(25000), status:'Sold (founder)' },
    { who:'Investor — Leonie Sands (this draft)',     cls:'B', eq:'5%',  cash:fmt(5000),  status:'Pending · subject to execution', highlight:true },
    { who:'Available to new external investors',      cls:'B', eq:'19%', cash:fmt(19000), status:'For sale' },
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
            <tr key={i} style={{ background: r.highlight ? 'rgba(252,211,77,0.10)' : 'transparent', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              <Td highlight={r.highlight}>{r.who}</Td>
              <Td>{r.cls}</Td>
              <Td highlight={r.highlight}>{r.eq}</Td>
              <Td>{r.cash}</Td>
              <Td>{r.status}</Td>
            </tr>
          ))}
          <tr style={{ borderTop:'2px solid rgba(201,168,76,0.4)' }}>
            <Td bold>Total</Td><Td>—</Td><Td bold>100%</Td><Td bold>{fmt(49000)}</Td><Td>Round size</Td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// UseOfFundsTable — Schedule 2 of the agreement.
//
// Live-reads from useLockedUseOfFunds.effective. When the founder (888999)
// drags the sliders on the Use of Funds slide, these rows update; when
// they lock a snapshot, the rows snap to the locked numbers and a green
// "Locked snapshot" pill appears. Otherwise an amber "Live" indicator
// makes clear the figures are working drafts.
function UseOfFundsTable({ effective, isLocked }) {
  const lines = [
    ['Assets — Liquidator (all bar fit-out, inc VAT)', fmt(effective.stock)],
    ['Garden Refurbishment (inc VAT)',                 fmt(effective.garden)],
    ['Interior Completion & Signage (inc VAT)',        fmt(effective.interior)],
    ['Marketing — Pre-launch & Year 1 (inc VAT)',       fmt(effective.marketing)],
    ['Legals & Restart',                                fmt(effective.legals)],
    ['Rent Deposit (paid monthly from trading cash)',
      effective.rent > 0 ? `${fmt(effective.rent)} ring-fenced` : '£0 from Round'],
    ['Working Capital (derived residual)',
      effective.overAllocated > 0
        ? `Over-allocated by ${fmt(effective.overAllocated)}`
        : fmt(effective.workingCapital)],
  ]
  return (
    <div style={{ background:INK_BG, border:BORDER, borderRadius:10, padding:'4px 8px', marginTop:8, overflow:'hidden' }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'8px 12px 6px 12px',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontSize:10, color:CREAM_D, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:600 }}>
          Schedule 2 · Use of funds (per line)
        </span>
        <span style={{
          fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700,
          padding:'3px 8px', borderRadius:4,
          color: isLocked ? '#10B981' : '#FCD34D',
          background: isLocked ? 'rgba(16,185,129,0.10)' : 'rgba(252,211,77,0.10)',
          border: `1px solid ${isLocked ? 'rgba(16,185,129,0.35)' : 'rgba(252,211,77,0.35)'}`,
        }}>
          {isLocked ? '● Locked snapshot' : '● Live · drag sliders on Use of Funds slide'}
        </span>
      </div>
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
          <tr style={{ borderTop:'2px solid rgba(201,168,76,0.4)' }}>
            <Td bold>Total capital pool</Td>
            <Td align="right" bold>{fmt(effective.capitalPool)}</Td>
          </tr>
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
    { label:'Total returned (held to Y5)', value:fmt(LEONIE_TOTAL_RET) },
    { label:'Money-on-money (held to Y5)', value: LEONIE_MOM.toFixed(2) + '×' },
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
