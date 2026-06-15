import React from 'react'
import { ACTUALS_2025, HACKNEY_INVESTOR_RETURNS } from '../../data/hackney.js'
import { useLockedUseOfFunds } from '../components/LockedUseOfFundsContext.jsx'
import AgreementSignBlock, { useAgreementSignatureStatus } from '../components/AgreementSignBlock.jsx'

// MikeAgreement — Round 1 STANDARD TEMPLATE, personalised for Michael Taylor.
//
// Renders the standard Round 1 terms that every external B-share holder
// signs. Personalised with Michael's name + £3k / 3-share figure; the
// substantive clauses are the template every investor sees.
//
// Key terms (per src/data/hackney.js DEAL):
//   • 100 shares issued at £1,000 each (£100k post-money)
//   • Founder 76 A-class voting shares (51 retained + 25 additional
//     subscription), Michael Taylor 3 B-class non-voting (SOLD),
//     Leonie Sands 3 B (SOLD), Lee Trott 1 B (SOLD),
//     17 B-class shares open externally
//   • £3,000 cash subscription = 3 shares = 3% equity
//   • NO preferred yield class — every share entitled to the same £X
//     per-share dividend declared by the directors
//   • Y1 review: single declaration at the 12-month mark
//   • Y2 onwards: semi-annual reviews (every 6 months)
//   • Reserve floor £30k must be met for any declaration
//   • Founder Y3 buyback right (CALL OPTION) at MARKET RATE — Y3 fair
//     value × shares held, no cap
//
// Gated to access codes:
//   • MIKE — Michael Taylor himself
//   • 888999 — Founder, for review before sharing
// All other codes (NODICE88, JOHN1, BRAZIL) filter this tab out of the
// top-tab list — they see the standard investor view without this tab.
//
// Status: ALLOCATION CONFIRMED. Michael's 3% has been sold to him in
// the cap table. The hero + banner drop "Draft" wording when both
// signatures are captured (see useAgreementSignatureStatus).

const INK_BG  = 'var(--ink-2)'
const BORDER  = '1px solid rgba(201,168,76,0.18)'
const GOLD    = 'var(--gold)'
const CREAM   = 'var(--cream)'
const CREAM_D = 'var(--cream-dim)'

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// Indicative return / per-share dividend constants were removed when
// clause 8 (Illustrative returns table) was deleted — the founder's
// instruction is that no specific dividend or capital-return figures
// should appear inside this Agreement. The deck's WaterfallReturns
// slide still carries forecast figures with prominent "not promised"
// disclaimers; the agreement itself stays strictly to terms.

export default function MikeAgreement() {
  // Live read of the founder's Use of Funds state — when 888999 drags
  // the sliders on the Use of Funds slide (or locks a snapshot), the
  // Schedule 2 table + the preamble figures here update automatically.
  const { effective, isLocked } = useLockedUseOfFunds()

  // Drops "Draft" wording from the hero + removes the amber pending
  // banner once both sides have countersigned (per-device).
  const { fullySigned } = useAgreementSignatureStatus('mike')

  return (
    <div data-agreement-body style={{ padding:'32px 48px', maxWidth:1100, margin:'0 auto', color:CREAM, lineHeight:1.6 }}>

      {/* Hero */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:GOLD, letterSpacing:'0.18em', textTransform:'uppercase', fontWeight:700, marginBottom:8 }}>
          {fullySigned
            ? 'Round 1 Investment Terms · For Michael Taylor · Executed'
            : 'Round 1 Draft Terms · For Michael Taylor · Confidential'}
        </div>
        <h1 className="serif" style={{ fontSize:'clamp(2.2rem, 4.4vw, 3rem)', color:CREAM, lineHeight:1.15, margin:0 }}>
          {fullySigned ? 'Investment Agreement — Executed' : 'Draft Investment Terms — For Your Review'}
        </h1>
        <p style={{ fontSize:15, color:CREAM_D, marginTop:10, maxWidth:820 }}>
          {fullySigned ? (
            <>No Dice Hackney Ltd · Round 1 · <strong style={{ color:CREAM }}>£3,000 subscription for 3 shares</strong> (£1,000 each = 3% of the company). <strong style={{ color:CREAM }}>Counter-signed by Investor and Founder.</strong> A signed PDF can be saved at any time from the Signatures block below.</>
          ) : (
            <>No Dice Hackney Ltd · Round 1 · £3,000 subscription for <strong style={{ color:CREAM }}>3 shares</strong> (£1,000 each = 3% of the company). <strong style={{ color:CREAM }}>Allocation confirmed — countersignature pending.</strong> These are the standard terms every external investor in this round signs — the only personalisation is your name and your £3k / 3-share figure. Review, raise any questions, and we'll take them to a solicitor before you countersign.</>
          )}
        </p>
      </div>

      <div className="gold-rule" style={{ width:160, marginBottom:28 }} />

      {/* Status banner — hidden once both sides have signed */}
      {!fullySigned && <NotYetExecutedBanner />}

      {/* 1. Parties */}
      <Section number="1" title="Parties">
        <P>
          <strong style={{ color:CREAM }}>The Company.</strong> No Dice Hackney Ltd, a company incorporated in England and Wales, trading from London Fields, London E8 as a bar with DJ &amp; events, garden, pool, arcades and board games. The Company is a wholly-owned subsidiary of No Dice Bars Ltd.
        </P>
        <P>
          <strong style={{ color:CREAM }}>The Founder.</strong> Elliot Scott, holder of all A-class voting shares.
        </P>
        <P>
          <strong style={{ color:CREAM }}>The Investor.</strong> Michael Taylor (the "<strong style={{ color:CREAM }}>Investor</strong>"), Round 1 B-class subscriber for £3,000 (3 shares = 3% of the Company) — allocation confirmed, subject to countersignature of this Agreement.
        </P>
      </Section>

      {/* 2. The Round + cap table */}
      <Section number="2" title="The Round &amp; cap table">
        <P>
          The Round size is <strong style={{ color:CREAM }}>£49,000</strong> representing 49% of the post-money equity. Pre-money valuation £51,000; post-money £100,000. Implied entry multiple of <strong style={{ color:CREAM }}>1.65×</strong> verified 2025 EBITDA of {fmt(ACTUALS_2025.ebitda)} — explicitly priced below the c.4× sector average to reflect the hurried-sale / post-liquidation restart context.
        </P>

        <CapTable />

        <P style={{ marginTop:16 }}>
          The Company issues <strong style={{ color:CREAM }}>100 shares</strong> at <strong style={{ color:CREAM }}>£1,000 per share</strong> (= £100,000 post-money). The Investor subscribes for <strong style={{ color:GOLD }}>3 shares</strong> (= £3,000, 3% of the company). All external shares are <strong style={{ color:CREAM }}>B-class non-voting</strong>; the Founder holds 100% of the A-class voting shares — a total of <strong style={{ color:CREAM }}>76 A shares</strong> (51 retained from pre-money + 25 newly subscribed at £1k each for £25,000). Alongside the Investor, Leonie Sands (3 B shares) and Lee Trott (1 B share) are also confirmed in this Round.
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
          The Investor holds <strong style={{ color:CREAM }}>3 B-class shares</strong>. If, for example, the directors declare £851.81 per share at the Y1 review (the indicative base-case figure), the Investor receives <strong style={{ color:CREAM }}>3 × £851.81 = £2,555</strong>; the Founder (76 A-class shares) receives 76 × £851.81 = £64,738.
        </P>
        <P>
          <strong style={{ color:CREAM }}>Distribution waterfall per review.</strong> At each review date, distributable profit is applied in this order:
        </P>
        <OrderedList items={[
          'Director\'s salary (set in the FY budget; £15,885 inc employer NI for FY 2026/27) — already deducted before "operating profit".',
          'Working-capital reserve top-up — reserve must be at or above the £30,000 floor at the review date.',
          'Directors, with the agreement of the A-share holders, declare a £X per-share dividend based on the trailing 12 months of trading. The declaration is announced shortly before the review date. No specific £X is promised in this Agreement — the figure is set at each review based on actual trading and outlook.',
          'Every share (76 Founder A and 24 external B alike) is paid the same £X per share. Investor\'s payout = shares held × £X.',
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
          Same rule for everyone — Founder A and external B holders are all paid the same £X per share at the same review date. No within-window priority.
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
          Fair Market Value is determined at the date of exercise by the directors acting reasonably, by reference to a multiple of trailing-12-month EBITDA consistent with sector comparables at the time. <strong style={{ color:CREAM }}>No specific buyback price is promised by this Agreement</strong> — the figure depends on actual trading at Y3, not on the forecast figures shown elsewhere in the deck. The Investor may, at her cost, require an independent valuation by a chartered accountant if she disputes the figure; the independent valuation binds both parties.
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

      {/* 8. Future rounds + pre-emption rights (formal legal language) */}
      <Section number="8" title="Future rounds · pre-emption rights">
        <P>
          The Company may raise further capital in the future (a "<strong style={{ color:CREAM }}>Round 2</strong>" and any subsequent round). Any future issuance of shares is a Reserved Matter requiring Reserved Matters Consent (clause 9), and the timing, total raise, per-share price and any specific mechanics are decided by the <strong style={{ color:CREAM }}>directors and the A-class holders</strong> at that time, with the Founder's A-class voting shares preserving voting control of the Company through any dilution.
        </P>
        <P>
          <strong style={{ color:GOLD }}>Pre-emption rights.</strong> If the Company proposes to issue any new equity securities, each Shareholder shall have the right, but not the obligation, to subscribe for such securities on a pro rata basis in proportion to that Shareholder's percentage ownership of the Company's issued share capital immediately prior to the proposed issuance.
        </P>
        <P>
          The Company shall provide written notice to each eligible Shareholder setting out:
        </P>
        <ul style={ulStyle}>
          <li>(a) the number and class of securities proposed to be issued;</li>
          <li>(b) the subscription price and principal terms of the proposed issuance;</li>
          <li>(c) the maximum number of securities that the Shareholder is entitled to subscribe for in order to maintain its proportionate ownership interest; and</li>
          <li>(d) the period within which the Shareholder must elect to exercise such right, which shall be not less than <strong style={{ color:CREAM }}>14 days</strong> from the date of the notice.</li>
        </ul>
        <P>
          Any Shareholder wishing to exercise its pre-emption right shall notify the Company in writing within the prescribed period and shall complete the subscription for the applicable securities on the terms set out in the notice.
        </P>
        <P>
          To the extent that any eligible Shareholder does not fully exercise its entitlement within the prescribed period, the Company may offer the unsubscribed securities to other persons on <strong style={{ color:CREAM }}>terms no more favourable</strong> than those offered to the existing Shareholders.
        </P>
        <P style={{ fontSize:12, color:CREAM_D, fontStyle:'italic', marginTop:14 }}>
          Practical effect: a Shareholder who does not exercise her pre-emption right within 14 days sees her share count remain unchanged but her percentage of the enlarged share capital shrinks proportionally to the new issuance. The per-share dividend entitlement continues on her existing shares without alteration. The Founder's call right at clause 6 is unchanged — if exercised, the Investor exits before any Round 2 mechanics become relevant for her.
        </P>
      </Section>

      {/* 10. Governance */}
      <Section number="9" title="Governance &amp; reserved matters">
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
      <Section number="10" title="Information rights">
        <ul style={ulStyle}>
          <li><strong style={{ color:CREAM }}>Semi-annual management accounts</strong> within 30 days of each distribution window — revenue, cost categories, EBITDA, Reserve balance, accrued surplus, distribution position.</li>
          <li><strong style={{ color:CREAM }}>Annual accounts</strong> within 90 days of each financial year-end.</li>
          <li><strong style={{ color:CREAM }}>Cap-table</strong> updates within 14 days of any change.</li>
          <li>Reasonable ad-hoc access to the trading data underlying the live deck at nodice.bar/hackney, on reasonable notice during business hours.</li>
        </ul>
      </Section>

      {/* 12. Exit + tag/drag */}
      <Section number="11" title="Sale event · Year-5 exit · tag &amp; drag">
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
      <Section number="12" title="Transfer restrictions">
        <ul style={ulStyle}>
          <li>No transfer of B shares for the first <strong style={{ color:CREAM }}>24 months</strong> without the Founder's written consent.</li>
          <li>After month 24, transfers subject to a <strong style={{ color:CREAM }}>right of first refusal</strong> (Company, then Founder) on 30 days' notice and matching the bona fide third-party offer.</li>
          <li>Transfers to immediate family or family-trust structures permitted at any time, provided the transferee accedes to this Agreement in writing.</li>
        </ul>
      </Section>

      <Section number="13" title="Confidentiality">
        <P>
          The Investor undertakes to keep confidential all non-public information about the Company — financial figures, supplier terms, customer lists, the underlying workbook, and the contents of this Agreement. Confidentiality survives termination and any transfer of B shares.
        </P>
      </Section>

      <Section number="14" title="Warranties">
        <P>
          The Founder warrants on the date of subscription that, to the best of his knowledge: (i) the 2025 actuals shown at nodice.bar/hackney are accurate in all material respects ({fmt(ACTUALS_2025.revenue)} revenue, {fmt(ACTUALS_2025.ebitda)} EBITDA, verified against Monthly Summary G15 / I15); (ii) the Company is not subject to any litigation, insolvency or material adverse claim other than as disclosed; (iii) the trading-premises lease is in good standing on the terms summarised in the deck (£65,000 + VAT per annum, 3-month deposit, 3-month rent-free start, 3% annual uplift); (iv) the Company has not granted any security, debt or option over its shares other than as disclosed in this Agreement.
        </P>
        <P>
          Warranty claims are subject to a <strong style={{ color:CREAM }}>12-month notice cap</strong> from the date of subscription and a financial cap equal to the Investor's subscribed amount, save in the case of fraud or wilful misrepresentation.
        </P>
      </Section>

      <Section number="15" title="General">
        <ul style={ulStyle}>
          <li><strong style={{ color:CREAM }}>Entire agreement.</strong> This Agreement, the Articles, and the Schedules constitute the entire agreement between the parties in relation to the Round.</li>
          <li><strong style={{ color:CREAM }}>Variation.</strong> Any variation requires Reserved Matters Consent (clause 9) and must be in writing.</li>
          <li><strong style={{ color:CREAM }}>Governing law.</strong> Laws of England and Wales; exclusive jurisdiction of the English courts.</li>
          <li><strong style={{ color:CREAM }}>Counterparts.</strong> May be signed in counterparts (including by electronic signature).</li>
          <li><strong style={{ color:CREAM }}>Costs.</strong> Each party bears its own legal and advisory costs.</li>
        </ul>
      </Section>

      {/* Signatures — inline e-signature, print/PDF downloads */}
      <AgreementSignBlock
        agreementId="mike"
        investorName="Michael Taylor"
        founderName="Elliot Scott"
      />
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────

const ulStyle = { margin:'8px 0 12px 0', paddingLeft:20, fontSize:14, color:CREAM_D, lineHeight:1.7 }

function NotYetExecutedBanner() {
  return (
    <div className="agreement-draft-banner" style={{
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
          Allocation confirmed — countersignature pending
        </div>
        <div style={{ fontSize:13, color:'#FDE68A', lineHeight:1.6 }}>
          Your <strong>3% (3 B-class shares, £3,000)</strong> has been allocated to you in the cap table above. These are the standard Round 1 terms every external investor in this round signs — the only personalisation is your name and your £3k / 3-share figure. Read through, leave any questions you have in the Page Notes panel (📝 button top-right), and we'll iron them out before taking the final version to a solicitor and your countersignature.
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
    { who:'Founder — additional subscription',        cls:'A', eq:'25%', cash:fmt(25000), status:'Sold (founder)' },
    { who:'Investor — Michael Taylor (this draft)',     cls:'B', eq:'3%',  cash:fmt(3000),  status:'Sold · countersignature pending', highlight:true },
    { who:'Leonie Sands',                              cls:'B', eq:'3%',  cash:fmt(3000),  status:'Sold' },
    { who:'Lee Trott',                                 cls:'B', eq:'1%',  cash:fmt(1000),  status:'Sold' },
    { who:'Available to new external investors',      cls:'B', eq:'17%', cash:fmt(17000), status:'For sale' },
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
