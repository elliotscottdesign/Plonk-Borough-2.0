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
//   • 100 shares issued at £1,000 each (£100k post-money)
//   • Founder 76 shares (51 A + 25 B), Leonie's intended 5 shares,
//     19 shares open externally
//   • £5,000 cash subscription = 5 shares = 5% equity
//   • NO preferred yield class — every share entitled to the same £X
//     per-share dividend declared by the directors
//   • Y1 review: single declaration at the 12-month mark
//   • Y2 onwards: semi-annual reviews (every 6 months)
//   • Reserve floor £30k must be met for any declaration
//   • Founder Y3 buyback right (CALL OPTION) at MARKET RATE — Y3 fair
//     value × shares held, no cap
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

// Leonie at 5 shares, £5k cheque, under the per-share dividend model.
// Every share entitled to the same £X declared each window — Leonie's
// dividend = 5 × per-share rate that year.
const LEONIE_SHARES    = 5
const LEONIE_EQUITY    = 0.05
const LEONIE_CASH      = 5000
const LEONIE_RETURNS = HACKNEY_INVESTOR_RETURNS.fiveYear.map(yr => {
  // Indicative per-share dividend = year profit / 100 shares.
  // Directors retain discretion to declare less in practice.
  const perShare = (yr.perShare ?? (yr.profit / 100))
  return {
    year:     yr.year,
    profit:   yr.profit,
    perShare,
    total:    LEONIE_SHARES * perShare,
  }
})
const LEONIE_CUM_DIV   = LEONIE_RETURNS.reduce((s, y) => s + y.total, 0)
const LEONIE_Y5_EXIT   = HACKNEY_INVESTOR_RETURNS.exit.businessValue * LEONIE_EQUITY
const LEONIE_TOTAL_RET = LEONIE_CUM_DIV + LEONIE_Y5_EXIT
const LEONIE_MOM       = LEONIE_TOTAL_RET / LEONIE_CASH

// Y3 founder-call scenario for Leonie: market-rate buyback (no cap).
// Buyback = 5 shares × Y3 per-share fair value + cumulative Y1-Y3 dividends.
const LEONIE_CALL_DIVS = LEONIE_RETURNS.slice(0, 3).reduce((s, y) => s + y.total, 0)
const LEONIE_PER_SHARE_Y3 = (HACKNEY_INVESTOR_RETURNS.callScenario?.perShareBuybackY3) ?? 4997.16
const LEONIE_CALL_BUYBACK = LEONIE_SHARES * LEONIE_PER_SHARE_Y3
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
          No Dice Hackney Ltd · Round 1 · £5,000 indicative subscription for <strong style={{ color:CREAM }}>5 shares</strong> (£1,000 each = 5% of the company). <strong style={{ color:CREAM }}>Not yet executed.</strong> These are the standard terms every external investor in this round signs — the only personalisation is your name and the £5k figure. Review, raise any questions, and we'll take them to a solicitor before you countersign.
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
          The Company issues <strong style={{ color:CREAM }}>100 shares</strong> at <strong style={{ color:CREAM }}>£1,000 per share</strong> (= £100,000 post-money). The Investor would subscribe for <strong style={{ color:GOLD }}>5 shares</strong> (= £5,000, 5% of the company). All Round 1 external shares are <strong style={{ color:CREAM }}>B-class non-voting</strong>; the Founder retains 100% of the A-class voting shares (51 shares).
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

      {/* 4. Per-share dividend mechanism */}
      <Section number="4" title="Per-share dividend &amp; distribution waterfall">
        <P>
          Dividends are declared by the directors as a <strong style={{ color:GOLD }}>£X per share</strong>. The Company has issued 100 shares in total; every share (A or B) is entitled to the same per-share amount when a dividend is declared. There is <strong style={{ color:CREAM }}>no preferred class</strong> — the Investor's payout for each window = her shares held × the per-share rate declared.
        </P>
        <P>
          The Investor holds <strong style={{ color:CREAM }}>5 shares</strong>. If, for example, the directors declare £851.81 per share at the Y1 review (the indicative base-case figure), the Investor receives <strong style={{ color:CREAM }}>5 × £851.81 = £4,259</strong>; the Founder (76 A+B shares) receives 76 × £851.81 = £64,738.
        </P>
        <P>
          <strong style={{ color:CREAM }}>Distribution waterfall per review.</strong> At each review date, distributable profit is applied in this order:
        </P>
        <OrderedList items={[
          'Director\'s salary (set in the FY budget; £15,885 inc employer NI for FY 2026/27) — already deducted before "operating profit".',
          'Working-capital reserve top-up — reserve must be at or above the £30,000 floor at the review date.',
          'Directors declare a £X per-share dividend based on the trailing 12 months of trading. The declaration is announced shortly before the review date.',
          'Every share (Founder A, Founder B and external B alike) is paid the same £X per share. Investor\'s payout = shares held × £X.',
        ]} />
      </Section>

      {/* 5. Review cadence + working capital reserve */}
      <Section number="5" title="Review cadence · Y1 12-month review · Y2+ semi-annual">
        <P>
          Dividends are declared by the directors at scheduled review dates. <strong style={{ color:GOLD }}>Year 1 has a single review at the 12-month mark</strong>; from <strong style={{ color:CREAM }}>Year 2 onwards reviews happen twice a year</strong> (every 6 months). The per-share dividend declared at each review is based on the trailing 12 months of trading and the directors' view of the outlook.
        </P>
        <ul style={ulStyle}>
          <li><strong style={{ color:CREAM }}>Y1 review:</strong> month 12 — directors review Y1 trading and declare the Y1 per-share dividend. No earlier distributions; the first 12 months are a hard lockup while the venue stabilises and the reserve builds.</li>
          <li><strong style={{ color:CREAM }}>Y2 onwards:</strong> reviews at months 18, 24, 30, 36, … — every 6 months — based on the trailing-12-month figures at each review date.</li>
          <li><strong style={{ color:CREAM }}>Reserve floor £30,000</strong> — operational red line. If the working-capital reserve is below the floor at a review date, no dividend is declared. The reserve rebuilds and the next review takes the catch-up into account.</li>
          <li><strong style={{ color:CREAM }}>Reserve target £45,000</strong> — fully-funded position (floor + £15k cushion for VAT bills, supplier swings, repairs). Once at target, declarations distribute substantially all of distributable profit.</li>
        </ul>
        <P>
          Same rule for everyone — Founder A, Founder B and external B holders are all paid the same £X per share at the same review date. No within-window priority.
        </P>
      </Section>

      {/* 6. Y3 Founder Buyback Right (Call Option) at market rate */}
      <Section number="6" title="Year-3 Founder Buyback Right (Call Option, market rate)">
        <P>
          The <strong style={{ color:CREAM }}>Founder</strong> is granted the right, exercisable in the 30-day window following the issue of the Year-3 audited (or director-certified) accounts, to require the Investor to sell all (but not part) of her B shares back to the Company.
        </P>
        <P>
          <strong style={{ color:CREAM }}>Founder Y3 Call price</strong> = <strong style={{ color:GOLD }}>Y3 Fair Market Value × the Investor's shares held</strong>. There is <strong style={{ color:CREAM }}>no multiple-of-money cap</strong> — the Investor is paid the full market rate at Y3 valuation for her shares.
        </P>
        <P>
          Worked example on the base-case forecast: Y3 fair value ≈ {fmt(HACKNEY_INVESTOR_RETURNS.exit.businessValue * (HACKNEY_INVESTOR_RETURNS.fiveYear[2].profit / HACKNEY_INVESTOR_RETURNS.exit.y5Ebitda))} (Y3 EBITDA × 4× exit multiple). That implies a per-share Y3 value of ≈ <strong style={{ color:CREAM }}>£{LEONIE_PER_SHARE_Y3.toFixed(2)}</strong>, so the Investor's 5 shares would be bought back at ≈ <strong style={{ color:GOLD }}>{fmt(LEONIE_CALL_BUYBACK)}</strong>.
        </P>
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

      {/* 7. Company Repurchase Right — general / open-ended */}
      <Section number="7" title="Company Repurchase Right">
        <P>
          The Shareholder acknowledges and agrees that the Company shall have the right, but <strong style={{ color:CREAM }}>not the obligation</strong>, to repurchase all or any portion of the Shares acquired under this Agreement, subject to applicable law and the Company's constitutional documents.
        </P>
        <P>
          The Company may exercise such right by providing written notice to the Shareholder at any time after <strong style={{ color:GOLD }}>[insert period or triggering event]</strong>, specifying the number of Shares to be repurchased and the proposed completion date.
        </P>
        <P>
          Unless otherwise agreed in writing by the parties, the repurchase price shall be the <strong style={{ color:CREAM }}>fair market value</strong> of the Shares as of the date of the notice, determined in good faith by the Board of Directors. In the event of a dispute regarding valuation, the fair market value shall be determined by an <strong style={{ color:CREAM }}>independent chartered accountant or business valuation expert</strong> appointed jointly by the Company and the Shareholder, whose determination shall be final and binding.
        </P>
        <P>
          The Shareholder agrees to execute all documents and take all actions reasonably necessary to give effect to any such repurchase.
        </P>
        <P>
          Nothing in this clause shall require the Company to exercise its repurchase right, and any repurchase shall remain subject to the Company satisfying all legal requirements applicable to the purchase of its own shares.
        </P>
        <P style={{ fontSize:12, color:CREAM_D, fontStyle:'italic', marginTop:14 }}>
          Note on overlap with clause 6: clause 6 (Y3 Founder Buyback Right) is the Founder's personal call option, exercisable only in the 30-day window after the Y3 accounts. This clause 7 is the <em>Company's</em> general repurchase right, exercisable at any time after the trigger event the parties agree. The clauses are independent and may co-exist; the Shareholder receives whichever pricing mechanism applies under the clause being exercised.
        </P>
      </Section>

      {/* 8. Returns table — Leonie specific */}
      <Section number="8" title="Illustrative returns · £5,000 = 5 shares">
        <P>
          The table below shows indicative per-share dividends if the directors distribute substantially all of distributable profit each year. Actual dividends remain at director discretion based on trading and outlook at each review date.
        </P>
        <ReturnsTable />
        <ReturnsSummary />
        <P style={{ fontSize:12, color:CREAM_D, fontStyle:'italic', marginTop:14 }}>
          Indicative only — not a forecast or guarantee. If the Y3 Founder Call is exercised, the Investor receives {fmt(LEONIE_CALL_BUYBACK)} buyback (5 shares × Y3 fair value per share) plus cumulative Y1-Y3 dividends ≈ {fmt(LEONIE_CALL_DIVS)} — total ≈ <strong style={{ color:CREAM }}>{fmt(LEONIE_CALL_TOTAL)} = {LEONIE_CALL_MOM.toFixed(1)}× MoM</strong>. If held to Y5, total ≈ <strong style={{ color:CREAM }}>{fmt(LEONIE_TOTAL_RET)} = {LEONIE_MOM.toFixed(1)}× MoM</strong>. Drawn from HACKNEY_INVESTOR_RETURNS.fiveYear on the date this draft was prepared.
        </P>
      </Section>

      {/* 9. Future rounds + pre-emption rights */}
      <Section number="9" title="Future rounds · dilution · pre-emption rights">
        <P>
          The Company may raise further capital in the future (a "<strong style={{ color:CREAM }}>Round 2</strong>" and any subsequent round). Any future issuance of shares is a Reserved Matter requiring Reserved Matters Consent (clause 10), and the timing, total raise, per-share price and any specific Round-2 mechanics are decided by the <strong style={{ color:CREAM }}>directors and the A-class holders</strong> at that time.
        </P>
        <P>
          When a future round is approved:
        </P>
        <ul style={ulStyle}>
          <li><strong style={{ color:CREAM }}>New shares are issued at the prevailing per-share value.</strong> The Round-2 per-share price is set by the directors at an arm's-length valuation supported by trading performance, financial position and sector comparables at the time. New shares are issued as B-class.</li>
          <li><strong style={{ color:CREAM }}>Dilution falls on B-class shareholders.</strong> Existing B-class holders (the Investor included) see their proportional B-class stake diluted by the new issuance unless they exercise their pre-emption right below.</li>
          <li><strong style={{ color:CREAM }}>A-class voting control preserved.</strong> The Founder's A-class voting shares retain voting control of the Company in all circumstances, regardless of any subsequent B-class issuance.</li>
          <li><strong style={{ color:GOLD }}>Pre-emption right for existing B holders.</strong> The Investor (and every other existing B holder) has the right to participate in any future round on a <strong style={{ color:CREAM }}>pro-rata basis</strong> — i.e. to subscribe for new B-class shares at the new per-share value, in proportion to her existing share count, sufficient to maintain her pre-round ownership percentage. The Investor is <em>not obliged</em> to participate.</li>
          <li><strong style={{ color:CREAM }}>Notice period.</strong> The Company will give the Investor at least <strong style={{ color:CREAM }}>14 days' written notice</strong> of any future round and her pre-emption entitlement, specifying the new per-share value, the number of shares she may subscribe for, and the closing date for exercising the right.</li>
          <li><strong style={{ color:CREAM }}>If the Investor declines to participate</strong>, her share count remains unchanged but her percentage of the enlarged company shrinks proportionally. The per-share dividend entitlement continues to apply to her existing shares without alteration.</li>
        </ul>
        <P>
          Standard form: existing pre-emption rights apply equally to every B-class holder, so no single investor is favoured over another at Round 2. The Founder's call right at Y3 (clause 6) is unchanged — if exercised, the Investor exits before Round 2 mechanics become relevant for her.
        </P>
      </Section>

      {/* 10. Governance */}
      <Section number="10" title="Governance &amp; reserved matters">
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

      {/* 11. Information rights */}
      <Section number="11" title="Information rights">
        <ul style={ulStyle}>
          <li><strong style={{ color:CREAM }}>Semi-annual management accounts</strong> within 30 days of each distribution window — revenue, cost categories, EBITDA, Reserve balance, accrued surplus, distribution position.</li>
          <li><strong style={{ color:CREAM }}>Annual accounts</strong> within 90 days of each financial year-end.</li>
          <li><strong style={{ color:CREAM }}>Cap-table</strong> updates within 14 days of any change.</li>
          <li>Reasonable ad-hoc access to the trading data underlying the live deck at nodice.bar/hackney, on reasonable notice during business hours.</li>
        </ul>
      </Section>

      {/* 12. Exit + tag/drag */}
      <Section number="12" title="Sale event · Year-5 exit · tag &amp; drag">
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

      {/* 13. Transfers */}
      <Section number="13" title="Transfer restrictions">
        <ul style={ulStyle}>
          <li>No transfer of B shares for the first <strong style={{ color:CREAM }}>24 months</strong> without the Founder's written consent.</li>
          <li>After month 24, transfers subject to a <strong style={{ color:CREAM }}>right of first refusal</strong> (Company, then Founder) on 30 days' notice and matching the bona fide third-party offer.</li>
          <li>Transfers to immediate family or family-trust structures permitted at any time, provided the transferee accedes to this Agreement in writing.</li>
        </ul>
      </Section>

      <Section number="14" title="Confidentiality">
        <P>
          The Investor undertakes to keep confidential all non-public information about the Company — financial figures, supplier terms, customer lists, the underlying workbook, and the contents of this Agreement. Confidentiality survives termination and any transfer of B shares.
        </P>
      </Section>

      <Section number="15" title="Warranties">
        <P>
          The Founder warrants on the date of subscription that, to the best of his knowledge: (i) the 2025 actuals shown at nodice.bar/hackney are accurate in all material respects ({fmt(ACTUALS_2025.revenue)} revenue, {fmt(ACTUALS_2025.ebitda)} EBITDA, verified against Monthly Summary G15 / I15); (ii) the Company is not subject to any litigation, insolvency or material adverse claim other than as disclosed; (iii) the trading-premises lease is in good standing on the terms summarised in the deck (£65,000 + VAT per annum, 3-month deposit, 3-month rent-free start, 3% annual uplift); (iv) the Company has not granted any security, debt or option over its shares other than as disclosed in this Agreement.
        </P>
        <P>
          Warranty claims are subject to a <strong style={{ color:CREAM }}>12-month notice cap</strong> from the date of subscription and a financial cap equal to the Investor's subscribed amount, save in the case of fraud or wilful misrepresentation.
        </P>
      </Section>

      <Section number="16" title="General">
        <ul style={ulStyle}>
          <li><strong style={{ color:CREAM }}>Entire agreement.</strong> This Agreement, the Articles, and the Schedules constitute the entire agreement between the parties in relation to the Round.</li>
          <li><strong style={{ color:CREAM }}>Variation.</strong> Any variation requires Reserved Matters Consent (clause 10) and must be in writing.</li>
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
            <Th>Year</Th><Th align="right">Op profit</Th><Th align="right">Indicative £/share (÷ 100)</Th><Th align="right">Leonie's 5 shares</Th><Th align="right">Total to Leonie</Th>
          </tr>
        </thead>
        <tbody>
          {LEONIE_RETURNS.map((r, i) => (
            <tr key={i} style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              <Td>{r.year}</Td>
              <Td align="right">{fmt(r.profit)}</Td>
              <Td align="right">£{r.perShare.toFixed(2)}</Td>
              <Td align="right">5 × £{r.perShare.toFixed(2)}</Td>
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
