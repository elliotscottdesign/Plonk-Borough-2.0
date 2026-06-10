// NO DICE HACKNEY LTD — FRAMEWORK DATA FILE
//
// Mirrors the export shape of src/data.js (Borough) so the cloned Hackney
// slides can read the same constants by name. Hackney values are populated
// where verified against the workbook; everywhere else carries a clearly-
// marked TBD placeholder.
//
// Structural decisions vs Borough:
//   • Single share class (no A/B distinction). 50/50 founder/investor.
//   • No preferred return. Pure pro-rata distribution by equity %.
//   • Bar-only entity — mini golf excluded from every line.
//   • No paid Google Ads — organic + local + events only.
//   • Plonk Golf IP/licensing model not applicable here (kept as empty
//     stubs so the Plonk tab can render without breaking).
//
// Source workbook: No_Dice_Hackney_Bar_Only_Investor_Pack.xlsx (39 sheets,
// 3,751 formulas, 0 errors). DO NOT modify the workbook.

// Sentinel marker — used in slides to render a "TBD" pill for missing values.
// Importing modules can check `value === TBD` before rendering.
export const TBD = '__TBD__'

export const BUSINESS = {
  name: 'No Dice Hackney Ltd',
  location: 'London Fields, London E8',
  description: 'Bar · DJ & events · Garden · Pool · Arcades · Board games',
}

// === EXTERNAL WORKBOOK ===
// Hackney financial workbook — investors view monthly P&L, scenarios,
// valuation breakdowns alongside the deck. Mirrors the Borough setup
// (Google Sheets, "Anyone with link · Viewer"). Update this URL after
// every workbook restructure so the React deck and the Sheets stay in
// lockstep.
export const WORKBOOK_URL = 'https://docs.google.com/spreadsheets/d/1ICwGynpIMGDZHS4C0dJ0GUilZRgD1UdTmTGWAe7m5bg/edit?usp=sharing'

// === LOCK SYNC ENDPOINT ===
// Hackney's deployed Apps Script web app — separate from Borough's
// (see infra/lock-sync-apps-script-hackney.gs). Each deck MUST hit its
// own endpoint; sharing one would cause the two decks to overwrite each
// other's locked container on every founder lock. Empty = localStorage-
// only (no cross-device sync).
export const LOCK_SYNC_URL = 'https://script.google.com/macros/s/AKfycbxksN8yyi-G0rI59O8j20v12tpk0vT1oWPUNMTvgPj--9DZGXT2OglCDvQUSuKRCPPD/exec'
export const LOCK_SYNC_SECRET = ''

// === NOTES SYNC ENDPOINT ============================================
// Hackney's deployed Apps Script web app for the per-page notes
// feature — separate from Borough's (and from the Hackney lock-sync).
// Each deck has its own Notes sheet so investor notes against the
// Borough deck never bleed into the Hackney one. Empty = localStorage-
// only mode (notes work, but no cross-device sync + no founder email).
//
// Deployment instructions in infra/notes-apps-script-hackney.gs.
//
// Endpoints (handled by infra/notes-apps-script-hackney.gs):
//   GET  ?code=<CODE>           → { notes: <blob>|null }
//   GET  ?all=1&secret=<SECRET> → { rows: [{ code, notes, updatedAt }] }
//   POST { code, notes, page, text, secret? } → upserts row + emails founder
export const NOTES_SYNC_URL = 'https://script.google.com/macros/s/AKfycbxnfgCTDYsjvQdBWwO3Fjta6tQiFCsWkSHuSJUvvfXidawoEhPg7eHsNX6rm4ZEk60osg/exec'
export const NOTES_SYNC_SECRET = ''
// Founder email — receives a notification when any user leaves a note.
export const NOTES_FOUNDER_EMAIL = 'elliotscottdesign@gmail.com'

// === DEAL STRUCTURE ===
// RESTRUCTURED MAY 2026 · £49,000 total round for 49% of the company.
// Founder retains 51% A-shares pre-money (voting, not for sale) AND
// personally buys back £25,000 of the round (= 25% of the company) —
// so post-round the founder holds 76% (51% A + 25% B). The remaining
// 24% of the company (£24k) is the available external pool, of which
// 5% (£5k) is intended for Leonie Sands (pending — see DEAL.commitments)
// and 19% (£19k) is open for new investors. £49k for 49% implies
// pre-money £51k, post-money £100k, entry 1.65× the £30,896 verified
// 2025 profit — well below the 4.1× sector average, reflecting the
// hurried-sale / post-liquidation restart.
//
// Cap table — live state of the round:
//   Founder retained (pre-money holdback, A-shares) 51%   £0    — not for sale
//   Founder buyback                  (B-shares)     25%   £25k  — SOLD (founder)
//   Leonie Sands                     (B-shares)      5%   £5k   — PENDING (external)
//   Available to new investors       (B-shares)     19%   £19k  — FOR SALE
//                                                  ----   ----
//                                                  100%   £49k
//
// Returns shown on the deck assume a NEW external investor takes their
// own slice of the available £19k. The default models a single investor
// taking the full £19k (= 19% equity). The FundingSlider on Cover lets
// them model a smaller stake (£5k → 5%, £10k → 10%, etc.). Equity is
// always investment / £100k post-money. Founder slice of profits =
// 76% (= retained 51% A + 25% buyback B); Leonie (if she subscribes)
// takes 5%; the new investor takes whatever they subscribe for, up to
// the £19k available.
export const DEAL = {
  // === ROUND 1 — PER-SHARE DIVIDEND MODEL ===
  //
  // The company issues 100 shares at £1,000 each = £100,000 post-money.
  // Every share (A or B) is entitled to the same £X per-share dividend
  // when declared. There is NO preferred yield class — dividends are
  // pure per-share, declared by the directors at each review window.
  //
  // Cap table by share count (full subscription):
  //   Founder retained A (voting)     51 shares    £0       — pre-money holdback
  //   Founder buyback B (non-voting)  25 shares    £25,000  — sold (founder)
  //   Leonie (intended)               5  shares    £5,000   — pending external
  //   Available externally B          19 shares    £19,000  — for sale (£1k = 1 share)
  //                                  ---           --------
  //                                  100 shares    £49,000  total round
  //
  // Implied entry: post-money £100k, pre-money £51k, multiple 1.65×
  // verified 2025 EBITDA of £30,896. Still well below the 4.1× sector
  // average — reflects the hurried-sale / post-liquidation restart.
  //
  // ── DISTRIBUTION SCHEDULE ─────────────────────────────────────────
  //
  // Director-declared per-share dividend. At each review date the
  // directors look at the trailing 12 months of trading and announce a
  // £X-per-share dividend, paid to every shareholder regardless of
  // class. No within-window priority — Founder A, Founder B and
  // external B all receive the same £X per share they hold.
  //
  // Review cadence:
  //   Y1 (mo 1-11)  → lockup; reserve build, no distributions
  //   Mo 12         → FIRST review (12-month mark). Directors declare
  //                    the Y1 dividend per share based on Y1 P&L.
  //   Mo 18, 24,    → SEMI-ANNUAL reviews from Y2 onwards (every 6 mo,
  //   30, 36, …       trailing-12-month basis).
  //
  // Conditions for ANY dividend declaration:
  //   1. Director salary already deducted from operating profit
  //   2. Working-capital reserve at or above £30k floor at review date
  //   3. Directors confirm the declaration based on trading + outlook
  //
  // If reserve below floor: window is skipped; nothing is declared.
  // Amounts simply build into the reserve and become available for the
  // next eligible window's declaration. No automatic catch-up.
  //
  // Indicative per-share dividend (forecast base case):
  //   Y1 trading: £85,181 op profit ÷ 100 shares = £851.81 per share
  //   Y2 trading: £96,857 ÷ 100 = £968.57 per share (paid mo 18 + mo 24)
  //   Y3 trading: £124,929 ÷ 100 = £1,249.29 per share
  //   Y4 trading: £155,193 ÷ 100 = £1,551.93 per share
  //   Y5 trading: £187,818 ÷ 100 = £1,878.18 per share
  // ACTUAL dividends are at director discretion — these are indicative
  // only, assuming directors elect to distribute substantially all of
  // distributable profit each year.
  //
  // ── Y3 FOUNDER BUYBACK RIGHT (CALL OPTION) ────────────────────────
  //
  // Founder has the right (NOT the investor — this is reversed from the
  // earlier model) to call back any external B-share holder at the end
  // of Y3. Caps founder's long-term equity dilution.
  //
  //   Buyback price = LOWER of:
  //     (a) fair market value × investor's equity %, OR
  //     (b) 3× original cash invested
  //
  // For full subscription (£19k cheque): max buyback £57k + ~£35k
  // cumulative dividends Y2-Y3 = ~£92k total return. MoM ~4.8×, IRR ~45%
  // at Y3 if founder calls. If held to Y5 (no call): ~£100k dividends +
  // ~£142k pro-rata exit = ~£242k = ~12.7× MoM, ~30% IRR.

  // === SHARE STRUCTURE ===========================================
  // The company issues 100 shares at £1,000 each. £1k cheque = 1 share.
  // All cap-table % calculations below derive from share-count maths.
  totalShares:      100,         // 100 shares × £1k = £100k post-money
  pricePerShare:   1000,         // £1,000 per share

  // Single-investor view (drives the deck's headline numbers / returns)
  investment: 19000,             // max a NEW investor can take = full available external slice (19 shares)
  investorEq: 0.19,              // 19 shares = 19%
  founderEq: 0.76,               // Founder A 51 + Founder B 25 = 76 shares = 76%

  // Round-level breakdown (informational — shown on Investment Summary)
  roundSize:        49000,       // total raise this round = founder buyback (£25k) + external (up to £24k)
  roundEquity:      0.49,        // 49 of 100 shares being sold this round
  founderRetained:  0.51,        // pre-money holdback A-shares (51 shares) — never sold
  founderBuyback:   25000,       // 25 B-shares founder-bought
  founderBuybackEq: 0.25,

  // Founder share split: 51 A + 25 B = 76 shares total.
  founderASharesCount: 51,
  founderBSharesCount: 25,

  // Commitments — Leonie has NOT yet signed/paid (May 2026). She remains
  // in active discussion at the standard terms below; her £5k is held in
  // the available external pool until she countersigns. The Investment
  // Summary's RoundProgressBlock iterates over `commitments` to render
  // the cap-table + progress bar — only entries with status === 'sold'
  // are treated as locked in.
  commitments: [
    { label: 'Founder buyback', amount: 25000, equity: 0.25, shares: 25, type: 'founder',  status: 'sold'    },
    { label: 'Leonie Sands',    amount:  5000, equity: 0.05, shares:  5, type: 'external', status: 'pending' },
  ],

  availableAmount:  24000,       // = roundSize - founder buyback (24 shares available externally)
  availableShares:    24,        // 24 shares × £1k each
  availableEq:      0.24,        // = roundEquity - founder buyback equity
  founderTotalPost: 0.76,        // 51 A + 25 B = 76 shares
  externalPostEq:   0.24,        // available externally (5 intended for Leonie + 19 open)

  // Share / governance
  shareClass: 'B (non-voting)',  // Round 1: external + founder buyback are all B-class. Founder retains 100% of A.
  totalBEquity:     0.49,        // 49 of 100 shares are B-class
  multiple: 1.6507,              // entry multiple — preMoney / 2025 EBITDA (51000 / 30896.17)
  exitMultiple: 4,               // exit multiple at Y5 — held at sector average
  preMoney: 51000,
  postMoney: 100000,
  aShareThreshold: 5000,         // 5% of post-money £100k — governance floor

  // === DISTRIBUTION CADENCE — PER-SHARE MODEL ===================
  // No preferred yield. Each window the directors declare a £X per-share
  // dividend; every share (A or B) receives the same £X.
  y1ReviewMonth:           12,   // Y1: single declaration at the 12-month mark
  semiAnnualReviewMonths:   6,   // Y2 onwards: every 6 months
  reserveFloorPounds:  30000,    // declaration is skipped if reserve < floor at review date

  // === FUTURE ROUNDS · PRE-EMPTION RIGHTS · DILUTION ============
  // Any future capital raise (Round 2 onwards) is decided by the
  // directors + A-class holders, subject to Reserved Matters Consent.
  // Mechanics:
  //   • New shares issued as B-class at the prevailing per-share value
  //     set by the directors based on trading + sector multiples.
  //   • Dilution falls on B-class. A-class voting shares preserve voting
  //     control regardless of B-class issuance count.
  //   • Existing B holders get a 14-day pre-emption right: they may
  //     subscribe for new B shares at the new per-share price,
  //     pro-rata to their existing stake, sufficient to maintain
  //     their pre-round ownership %.
  //   • If a B holder declines to pre-empt, their share count stays
  //     unchanged but their % of the enlarged share base shrinks.
  preemptionWindowDays:   14,
  preemptionRightsClass:  'B',     // pre-emption available to all B holders
  aClassVotingProtected:  true,    // A retains voting control through dilution

  // === Y3 FOUNDER BUYBACK RIGHT (CALL OPTION) ================
  // Replaces the previous "investor Y3 put" model. Founder may call any
  // external B-share holder back at the end of Y3 — but at MARKET RATE,
  // not at a capped multiple. The investor is paid fair market value
  // × their equity %, with no multiple-of-money ceiling.
  //
  // Why no cap: the deal narrative is "fair exit, founder triggers".
  // The cap was investor-unfriendly (3× looks generous on a £1k cheque
  // but punishes a £19k cheque if business booms). Removing it makes
  // the deal cleaner — investor knows they get true market value if
  // bought back early, and the founder pays for the optionality.
  founderBuybackYear:        3,
  founderBuybackCap:         null,     // null = no cap; price is fair value × equity %
  founderBuybackStaggerMonths: 12,     // simultaneous exercises stagger over up to 12 months
  founderBuybackWaiverOnRound2: true,  // an investor who converts to Round 2 is not callable

  // === LEGACY FIELDS — kept for back-compat. The cap fields are
  // retained but set to null so older consumers reading buybackCap
  // can branch on truthy/null without breaking.
  buybackYear:           3,
  buybackCap:            null,
  buybackStaggerMonths: 12,
  buybackWaiverOnRound2: true,

  // Headline numbers for the single-investor view — recomputed in
  // HACKNEY_INVESTOR_RETURNS below under the new semi-annual + Y1
  // lockup schedule. Kept here so older slides that read DEAL.*
  // don't blow up before they're updated.
  investorDividend:    0,         // Y1 = 0 (lockup); first window at month 12 → see HACKNEY_INVESTOR_RETURNS
  totalInvestorReturn: 0,
  coc:                 0,         // not meaningful in Y1 under lockup
  payback:             3,         // approximate — investor recovers cash ~end of Y3
}

// computeBuybackValue — Y3 founder-call payout for an external B-class
// investor. Returns the fair-value pro-rata share — NO multiple-of-money
// cap. The deal pays out at market rate when the founder exercises the
// call right.
//
//   investment = original cash invested (£)
//   fairValue  = total business value at exercise year (£)
//   opts.investorEq  — overrides equity % (default = investment / postMoney)
//   opts.postMoney   — overrides £100k post-money
//
// Returns { fairShare, capped, payout, hitCap } for backward-compat with
// UI consumers. Under the market-rate model: capped === fairShare,
// payout === fairShare, hitCap === false. The `capped` field is retained
// in the return shape only so existing slide code doesn't crash.
//
// Examples (Y3 fair value ~£500k, full forecast EBITDA × 4× exit multiple):
//   £19k invested at 19% → fairShare £95,000, payout £95,000
//   £5k  invested at  5% → fairShare £25,000, payout £25,000
//   £1k  invested at  1% → fairShare  £5,000, payout  £5,000
export function computeBuybackValue(investment, fairValue, opts) {
  opts = opts || {}
  const inv = Math.max(0, investment || 0)
  const fv  = Math.max(0, fairValue  || 0)
  const pm  = opts.postMoney  ?? 100000
  const eq  = opts.investorEq ?? (pm > 0 ? inv / pm : 0)
  const fairShare = fv * eq
  // Market-rate buyback — no cap. The fair-share value IS the buyback price.
  const payout    = fairShare
  return { fairShare, capped: fairShare, payout, hitCap: false }
}

// === 2025 ACTUALS (BAR-ONLY, MINI GOLF EXCLUDED) ===
// Verified from the workbook: Monthly Summary!ANNUAL TOTAL row.
// Borough categorises costs into 9 lines (drinks/gas, cleaning, arcades, etc.).
// Hackney's workbook only splits Fixed / Variable / Wages / VAT — sub-category
// breakdown is TBD pending a separate restatement of the 2025 P&L.
export const ACTUALS_2025 = {
  revenue: 538090.57,            // Excel: Monthly Summary!C15
  wages: 179871.99,              // Excel: Monthly Summary!G15 (fully-loaded inc 21.4% NIC + pension + holiday)
  fixedCosts: 114880,            // Excel: Monthly Summary!E15
  variableCosts: 167448.63,      // Excel: Monthly Summary!F15
  vatNet: 44993.78,              // Excel: Monthly Summary!H15
  profit: 30896.17,              // Excel: Monthly Summary!I15
  ebitda: 30896.17,              // Bar-only entity — EBITDA = profit (no D&A line)
  // TBD: Borough-style category breakdown below. Re-extract from weekly P&L
  // when we restate Hackney 2025 into the same nine-category schema.
  drinksGas: TBD,
  cleaning: TBD,
  arcades: TBD,
  food: TBD,
  googleAds: 0,                  // Hackney runs zero paid search
  cardCharges: TBD,
}

// === 2026/27 FORECAST (Base Case +15%) ===
// Forecast period: May 2026 → Apr 2027. Rebuilt April 2026 with the new
// lease terms per user direction (see HACKNEY_FIXED_COSTS_2026):
// £65,000 + VAT per annum, 3-month deposit, 3% annual uplift.
//
// Build:
//   Revenue        538,090.57 × 1.15  =     618,804.17
//   Wages           179,872 (PL_WAGE_BASE — calculator default)
//   Variable +10%   2025 stock + variable cats × 1.10
//                   = (134,123 + 7,887 + 16,492 + 10,300 + 8,202) × 1.10
//                   = 177,004 × 1.10 ≈ 194,704
//   Fixed Y1:       Other fixed (£23,490) × 1.10 = £25,839
//                   + new rent £48,750 (9 paying months × £65k/12; 3-mo rent-free)
//                   + rates £16,830 (2025 × 1.10, pending Hackney confirm)
//                   = £91,419
//   VAT             44,994 × 1.15 = £51,743 (scales with revenue)
//   Director         15,885 (separate line)
//   Op profit (after director) ≈ £85,181 → margin ≈ 13.8%
//
// Lease economics: £65,000 + VAT per annum (NET in P&L — VAT-registered
// bar recovers input VAT). Forecast year May 2026 → Apr 2027 has 3
// months rent-free at the start (May–Jul 2026), then 9 paying months
// at £65k/12 = £48,750. Steady state Y2 = £65,000 net. Y3 onwards
// grows at +3% pa (lease uplift clause). Old Plonk arrangement was
// £94,146/yr — the new lease saves ~£29k/yr at steady state, plus an
// additional ~£16,250 in Y1 from the rent-free start.
// REVENUE — BAR-ONLY basis. Golf is a separate operator entity going forward
// (legal separation; venue operates the same), so its turnover is OUT of the
// 2026 forecast: base = the bar-only 2025 income (HACKNEY_SCENARIO_LEVERS sum
// = £523,398, golf excluded) × 1.15 = £601,908. 2025 ACTUALS stay as-traded
// (with golf) — history is not restated. Profit/returns are HELD: golf
// transferred with its own costs, so it was net-neutral to the bar's bottom
// line — only the top-line turnover changes. Consequently margin rises (~14%)
// as the lower-margin golf turnover drops out. (Was 538,090 × 1.15 = 618,804
// on the old golf-inclusive basis.)
export const FORECAST = {
  revenue:    601908,           // BAR-ONLY: £523,398 × 1.15 (golf turnover removed)
  wages:      179872,
  variable:   194704,           // sum of stock + operational variable, all × 1.10
  fixed:       91419,           // rent £48,750 + rates £16,830 + other fixed × 1.10
  vatNet:      51743,           // 2025 VAT × 1.15 (scales with revenue)
  director:    15885,           // separate line (inc £885 employer NI)
  rent:        48750,           // Y1 with 3-mo rent-free; £65,000 / 12 × 9 paying months (net)
  rates:       16830,           // 2025 × 1.10 — Hackney Council confirmation pending
  profit:      85181,           // HELD — golf moved out with its costs (net-neutral to the bar)
  margin:       0.1415,         // profit / bar-only revenue (↑ from 0.1377 as golf turnover drops out)
}

// === INCOME BY SOURCE (Jan–Dec 2025, BAR-ONLY VIEW) ===
// Hackney is presented as a Bar entity going forward — the Plonk Golf
// course is a separately-incorporated operator and its golf-round
// revenue does NOT belong in No Dice Hackney's historic sales mix.
// The "Online golf (DMN)" line that was previously here (£39,288)
// has been removed from this breakdown — that revenue stream is
// shown on the Plonk page (HACKNEY_GOLF_2025) instead.
//
// Source: Weekly Merged 2024-2026 tab, Jan–Dec 2025 columns aggregated,
// minus the online-golf row. Bar-only sources sum to £523,398 (was
// £562,686 with golf included). The deck uses Monthly Summary's £538k
// as the headline annual revenue elsewhere; this breakdown represents
// the relative shares of each bar-side income source for the donut.
//
// Notes on what stays here:
//   • Game & Drink — drink component is bar revenue and stays 100%
//     with No Dice per the Plonk Operations agreement (the drink
//     dwarfs the bundled golf round)
//   • Pool tournament entries + Pool tickets — bar-side activity,
//     stays 100% with No Dice
export const INCOME_SOURCES = [
  { name: 'Bar takings',                amount: 484684, pct: 92.6, color: '#0D1F4C' },
  { name: 'Office bookings / hires',    amount:  28120, pct:  5.4, color: '#1976D2' },
  { name: 'Game & Drink',               amount:   4824, pct:  0.9, color: '#F59E0B' },
  { name: 'Pool tournament entries',    amount:   3570, pct:  0.7, color: '#1E88E5' },
  { name: 'Pool tickets (DMN)',         amount:   2200, pct:  0.4, color: '#039BE5' },
  { name: 'Service charge',             amount:      0, pct:  0.0, color: '#4FC3F7' },
]

// === FIXED COSTS — 2025 SUB-LINE BREAKDOWN ===
// Source: Weekly Merged 2024-2026 tab, fixed-cost rows aggregated for 2025.
// Used to drive the 2026 forecast: rent and rates are replaced with the new
// lease + Hackney Council figures; the rest of the fixed-cost base uplifts
// by +10%.
export const HACKNEY_FIXED_COSTS_2025 = [
  { key: 'rent',        label: 'Rent',          amount: 94146 },
  { key: 'rates',       label: 'Business Rates',amount: 15300 },
  { key: 'electricity', label: 'Electricity',   amount: 12750 },
  { key: 'water',       label: 'Water',         amount:  2550 },
  { key: 'insurance',   label: 'Insurance',     amount:  2754 },
  { key: 'license',     label: 'License',       amount:  1275 },
  { key: 'prsPpl',      label: 'PRS / PPL',     amount:  1530 },
  { key: 'internet',    label: 'Internet',      amount:  1445 },
  { key: 'lightspeed',  label: 'Lightspeed',    amount:   931 },
  { key: 'tvLicense',   label: 'TV License',    amount:   255 },
]

// === FIXED COSTS — 2026 FORECAST RULES ===
// Per user direction (May 2026):
//   • Rent: NEW lease — £65,000 + VAT per annum (net in P&L). 3-month
//     rent-free start (May–Jul 2026). 3-month deposit on signing.
//     3% annual uplift on rent.
//       Y1 = 9 paying months × (£65k/12) = £48,750
//       Y2 = £65,000 (full year, headline)
//       Y3 = £65,000 × 1.03  = £66,950
//       Y4 = £65,000 × 1.03² = £68,959
//       Y5 = £65,000 × 1.03³ = £71,027
//   • Business Rates: 2025 actual × 1.10 = £16,830. Subject to Hackney
//     Council assessment with the relief change (75% → 40% in 2025/26)
//     so this is a placeholder pending confirmation.
//   • All other fixed lines (electricity, water, insurance, license,
//     PRS/PPL, internet, lightspeed, TV license): +10% on 2025 actuals.
export const HACKNEY_FIXED_COSTS_2026 = {
  rentAnnualNet:    65000,              // £65,000 + VAT pa (net in P&L)
  rentY1:           48750,              // 9 paying months × £65k/12 (3 months rent-free)
  rentSteady:       65000,              // Y2 full year
  rentUplift:       0.03,               // 3% annual uplift on rent (Y3+ compounds)
  rentFreeMonths:   3,                  // May–Jul 2026
  depositMonths:    3,                  // 3-month deposit
  depositInc:       19500,              // 3 × £6,500 inc VAT — paid monthly during rent-free
  depositPaidMonthly: true,             // £6,500/mo across the first 3 trading months
                                        // (= the 3 rent-free months) so does not consume Day-1 raise
  rates:            16830,
  otherUplift:      0.10,               // applied to non-rent, non-rates lines
}

// === COSTS BY CATEGORY (Jan–Dec 2025) ===
// Source: Weekly Merged 2024-2026 tab. Category-header rows aggregate the
// sub-line items below them (verified: sum of category headers = sheet's
// row 79 "Costs TOTAL inc VAT" = £485,470). Total runs £23k higher than
// Monthly Summary's £462,201 due to categorisation differences (some
// items in Weekly Merged are pre-restatement). Monthly Summary remains
// the canonical totals; this table shows the cost-mix shares.
// Palette designed for dark-background legibility — Tailwind 400-level
// hues so every category reads cleanly in chart bars / lines AND in
// tooltip text. Wages and Drinks & Gas (biggest two) take the warmest
// reds; Fixed Costs steps to purple so it stands out from the warm
// cost family without breaking the cost-side feel; the smaller
// categories spread across pink / orange / amber / yellow.
export const COST_CATEGORIES = [
  { name: 'Wages',          amount: 175531, pct: 36.2, color: '#F87171' }, // red 400
  { name: 'Drinks & Gas',   amount: 134123, pct: 27.6, color: '#FB923C' }, // orange 400
  { name: 'Fixed Costs',    amount: 132936, pct: 27.4, color: '#C084FC' }, // purple 400 — stands out
  { name: 'Cleaning',       amount:  16492, pct:  3.4, color: '#F472B6' }, // pink 400
  { name: 'DJs',            amount:  10300, pct:  2.1, color: '#FCA5A5' }, // rose 300
  { name: 'Arcades',        amount:   8202, pct:  1.7, color: '#FDBA74' }, // orange 300
  { name: 'Food',           amount:   7887, pct:  1.6, color: '#FBBF24' }, // amber 400
]

// === MONTHLY DATA (Jan–Dec 2025) ===
// Excel: Monthly Summary!C3:I14. Income + profit verified;
// monthly cost-by-category split is TBD.
export const MONTHLY_INCOME = [
  { month: 'Jan', amount: 26867    },
  { month: 'Feb', amount: 32999.58 },
  { month: 'Mar', amount: 52040.38 },
  { month: 'Apr', amount: 48158.36 },
  { month: 'May', amount: 43489.18 },
  { month: 'Jun', amount: 62703.56 },
  { month: 'Jul', amount: 44999.83 },
  { month: 'Aug', amount: 63368.62 },
  { month: 'Sep', amount: 38564.91 },
  { month: 'Oct', amount: 39863.27 },
  { month: 'Nov', amount: 48740.74 },
  { month: 'Dec', amount: 36295.14 },
]

// Per-month cost split by category. Source: Weekly Merged 2024-2026 tab,
// 2025 columns aggregated by week-end month. Each row is gross-of-VAT per
// the Weekly Merged convention. Annual sums match COST_CATEGORIES totals.
// VAT, card-charges, Google-Ads not separately tracked in Weekly Merged
// (Google Ads = £0 anyway for Hackney; VAT recorded as a single annual
// difference in Monthly Summary).
export const MONTHLY_COSTS = [
  { month:'Jan', wages:  6116, fixed:  7770, drinks:  3753, cleaning:  567, arcades:  637, food:  738, djs:  600 },
  { month:'Feb', wages: 12740, fixed: 10360, drinks:  8993, cleaning: 1239, arcades:  310, food: 1003, djs:  800 },
  { month:'Mar', wages: 14164, fixed: 12950, drinks:  9777, cleaning: 1829, arcades: 1227, food:  375, djs: 1000 },
  { month:'Apr', wages: 13603, fixed: 10360, drinks: 13596, cleaning:  993, arcades:  374, food:  372, djs:  800 },
  { month:'May', wages: 14503, fixed: 10360, drinks: 13960, cleaning: 1110, arcades:  763, food:  591, djs:  800 },
  { month:'Jun', wages: 19250, fixed: 12950, drinks: 15369, cleaning: 1642, arcades:  868, food: 1024, djs: 1000 },
  { month:'Jul', wages: 14058, fixed: 10360, drinks: 11045, cleaning: 1718, arcades:  430, food:  690, djs:  800 },
  { month:'Aug', wages: 18243, fixed: 12950, drinks: 16718, cleaning: 1173, arcades: 1090, food:  655, djs: 1200 },
  { month:'Sep', wages: 16931, fixed: 10559, drinks:  9679, cleaning: 1181, arcades:  654, food:  910, djs:  800 },
  { month:'Oct', wages: 13157, fixed: 10559, drinks:  8873, cleaning: 2234, arcades:  330, food:  360, djs:  800 },
  { month:'Nov', wages: 19314, fixed: 13199, drinks: 11945, cleaning: 1603, arcades:  733, food:  659, djs: 1000 },
  { month:'Dec', wages: 13453, fixed: 10559, drinks: 10414, cleaning: 1203, arcades:  785, food:  510, djs:  700 },
]

export const MONTHLY_PROFIT = [
  { month: 'Jan', income: 26867,    profit:   703.39 },
  { month: 'Feb', income: 32999.58, profit: -1449.55 },
  { month: 'Mar', income: 52040.38, profit:  9183.67 },
  { month: 'Apr', income: 48158.36, profit:  7356.63 },
  { month: 'May', income: 43489.18, profit:  1192.78 },
  { month: 'Jun', income: 62703.56, profit:  7773.94 },
  { month: 'Jul', income: 44999.83, profit:  4684.73 },
  { month: 'Aug', income: 63368.62, profit:  8506.70 },
  { month: 'Sep', income: 38564.91, profit: -3331.77 },
  { month: 'Oct', income: 39863.27, profit:  1174.53 },
  { month: 'Nov', income: 48740.74, profit: -1928.63 },
  { month: 'Dec', income: 36295.14, profit: -2970.25 },
]

// === 2026/27 CASH FLOW FORECAST (May 2026 – Apr 2027) ===
// Excel: Cash Flow Forecast!B30:M31 (net flow + cumulative cash).
// Peak £76,920 (Aug), low £33,833 (Feb), year-end £67,046 (Apr).
//
// Rent-free period change (May 2026): the lease moved from a 4-month
// rent-free start (May–Aug 26) to a 3-month rent-free start (May–Jul
// 26). Net effect on Y1 cashflow: Aug 26 now has £5,416.67 of rent
// added, and every subsequent closing balance drops by the same
// amount. Pattern below: rows 1-3 (May-Jul) unchanged from the
// rent-free Excel snapshot; row 4 (Aug 26) net reduced by £5,416.67;
// rows 5-12 closings each shifted -£5,416.67 vs the workbook's
// original 4-mo-rent-free numbers. The May/Jun/Jul nets and Sep-Apr
// nets stay the same — only Aug 26 gains a rent line.
export const HACKNEY_CASHFLOW = [
  { month: 'May 26', net:  19889.52, closing: 19889.52 },
  { month: 'Jun 26', net:  33900.15, closing: 53789.67 },
  { month: 'Jul 26', net:   9146.58, closing: 62936.25 },
  { month: 'Aug 26', net:  13984.25, closing: 76920.50 },   // rent now starts here (was 19400.92 / 82337.17 under 4-mo rent-free)
  { month: 'Sep 26', net:  -4703.39, closing: 72217.11 },
  { month: 'Oct 26', net:     94.91, closing: 72312.02 },
  { month: 'Nov 26', net:  -9186.49, closing: 63125.53 },
  { month: 'Dec 26', net:  -5509.88, closing: 57615.65 },
  { month: 'Jan 27', net:  -8369.97, closing: 49245.68 },
  { month: 'Feb 27', net: -15412.44, closing: 33833.24 },
  { month: 'Mar 27', net:  20129.18, closing: 53962.42 },
  { month: 'Apr 27', net:  13083.32, closing: 67045.74 },
]

// Working-capital safety zone — the bank balance the company commits to
// keeping at all times once the reserve is built.
//   • FLOOR  £30,000 — three months' rent equivalent. Operational red line;
//                      we never let the bank balance fall below this.
//   • TARGET £45,000 — floor + £15k cushion for VAT bills, supplier swings
//                      and one-off equipment / repairs. Once we're here we
//                      consider the working-capital pot fully built.
// Investor dividends are gated on the reserve sitting AT OR ABOVE the FLOOR.
// The founder draws their quarterly share regardless, since they cannot
// wait for the pot to build. Investor's deferred quarters get caught up
// later, once the reserve is fully built (≥ TARGET).
export const HACKNEY_WORKING_CAPITAL_FLOOR  = 30000
export const HACKNEY_WORKING_CAPITAL_TARGET = 45000

export const HACKNEY_CASH = {
  peak: 82337,        // Aug 2026
  low: 39250,         // Feb 2027
  yearEnd: 72462,     // Apr 2027
  safetyFloor:  HACKNEY_WORKING_CAPITAL_FLOOR,   // £30k red line
  safetyTarget: HACKNEY_WORKING_CAPITAL_TARGET,  // £45k fully-funded target
}

// === WAGES — 2025 ROTA REFERENCE (4-role calculator basis) ===
// Source: live rota Google Sheets (sheet 1NgIp2TcNPcf9pWcD5CVELexarlmnxe9jeC61aTCZKy0)
// Aggregated 2025 bar-only shifts. Filters applied:
//   • Roles kept: Bar Staff, Supervisor, Assistant Manager, Manager
//   • Roles excluded: Golf Host (mini-golf), Kitchen, blank-role rows
//   • Date validation: dropped rows with empty / unparseable dates
//   • Day-of-week validation: zero mismatches in the source
// Hourly rotaed totals from the source: Bar Staff 4,506.3 · Supervisor
// 1,216.5 · Asst. Manager 1,796.2 · Manager 1,375.1.
//
// Manual correction — Manager + Asst. Manager set to 2,080 hrs (40 ×
// 52, full-time salaried basis). The rota cloud under-records these
// two salaried roles because it only logs on-floor scheduled shifts
// — it does not capture management / admin / supplier / HR time
// that's part of their salaried scope. The financial truth
// (PL_WAGE_BASE £179,872 from Weekly Merged G15) already pays both
// roles for full-time work, so 2,080 hrs is the correct hours basis
// for any £-derivation. Bar Staff and Supervisor stay at the
// rota-recorded figures (these are paid hourly and the rota is the
// truth for those).
export const WAGE_RATES = [
  { role: 'Bar Staff',     rate: 13.82, hours: 4506.3, color: '#E67E22' },
  { role: 'Supervisor',    rate: 15.12, hours: 1216.5, color: '#D4A843' },
  { role: 'Asst. Manager', rate: 16.46, hours: 2080,   color: '#94A3B8' },  // 40 × 52 (salaried)
  { role: 'Manager',       rate: 18.26, hours: 2080,   color: '#0D9488' },  // 40 × 52 (salaried)
]

// Raw rota figures as recorded in the live rota cloud — kept here so the
// 2025 Performance tab can render a transparent investor-facing wage
// reconciliation (raw rota → manual salaried correction → financial truth).
// These are the figures an investor will see if they pull the rota Google
// Sheet directly; the two salaried roles come in below 40 × 52 because the
// rota only logs on-floor scheduled shifts, not management / admin time.
export const WAGE_RATES_ROTA_RAW_2025 = [
  { role: 'Bar Staff',     rate: 13.82, hoursRaw: 4506.3, hoursAdjusted: 4506.3, salaried: false, color: '#E67E22' },
  { role: 'Supervisor',    rate: 15.12, hoursRaw: 1216.5, hoursAdjusted: 1216.5, salaried: false, color: '#D4A843' },
  { role: 'Asst. Manager', rate: 16.46, hoursRaw: 1796.2, hoursAdjusted: 2080,   salaried: true,  color: '#94A3B8' },
  { role: 'Manager',       rate: 18.26, hoursRaw: 1375.1, hoursAdjusted: 2080,   salaried: true,  color: '#0D9488' },
]

// === WAGE FINANCIAL TRUTH — Weekly Merged 2024-2026 ==================
// Methodology rule for the Hackney deck: the only true financial wage
// data for 2025 comes from Weekly Merged 2024-2026 (which is what
// Monthly Summary G15 aggregates). The live rota Google Sheet is for
// HOURS / DATE / TIME / ROLE allocation only — never for £ figures.
// Weekly Merged splits wages by COMPONENT (gross pay, NIC, pension,
// holiday, sick, freelance) — NOT by ROLE — so any role-level £
// attribution (e.g. Golf Host, Bar Staff) is an estimate derived
// from rota hours × rate, not financial truth.
export const PL_WAGE_BASE = 179872            // 2025 financial-truth wage line — Monthly Summary G15 (= Weekly Merged 2024-2026 wage rows aggregated)
// ROTA_TOTAL derives from WAGE_RATES so any hours/rate correction
// (e.g. Manager + Asst. Manager set to 2,080 full-time-salaried
// basis) keeps the multiplier in sync. With the corrected salaried
// hours, ROTA_TOTAL ≈ £152,888 and WAGE_OVERHEAD_MULT ≈ 1.176 —
// closer to the true ~17–21% NIC + pension + holiday loading than
// the old empirical 1.355 figure (which was inflated because the
// rota under-counted salaried hours).
export const ROTA_TOTAL = WAGE_RATES.reduce((s, r) => s + r.rate * r.hours, 0)
export const WAGE_OVERHEAD_MULT = PL_WAGE_BASE / ROTA_TOTAL   // empirical multiplier reconciling rota gross to financial-truth payroll · derived, not contractual

// === MODELLED STAFFING — full 12-role build-out ===
// Source: Wages Breakdown sheet, modelled staffing block (rows 10–40).
// This is the venue at full operational capacity (£387,795.30/yr fully-loaded).
// Differs from PL_WAGE_BASE (£179,872 — 2025 actuals at lean staffing) because
// it shows what the venue COULD cost if every modelled role is filled. Useful
// as a reference panel on the Business Explorer 2025 Performance tab.
export const HACKNEY_WAGE_MODEL = {
  loadingPct: 0.214,            // employer NIC + pension + holiday
  totals: {
    grossWeekly:    6143,
    grossMonthly:   26619.67,
    grossAnnual:    319436,
    loadedWeekly:   7457.60,
    loadedMonthly:  32316.28,
    loadedAnnual:   387795.30,
  },
  groups: [
    { key: 'management', title: '1. Management', subtotal: 72259.20, roles: [
      { role: 'Director / Owner',                 headcount: 1, hours: 'salary', rate: null,   weekly:  305.48, annual: 15885 },
      { role: 'General Manager',                  headcount: 1, hours: 40,        rate: 18.26,  weekly:  730.40, annual: 37980.80 },
      { role: 'Assistant Manager',                headcount: 1, hours: 40,        rate: 16.48,  weekly:  659.20, annual: 34278.40 },
    ] },
    { key: 'supervisory', title: '2. Supervisory', subtotal: 50186.24, roles: [
      { role: 'Supervisor (Senior)',              headcount: 1, hours: 40,        rate: 15.08,  weekly:  603.20, annual: 31366.40 },
      { role: 'Supervisor (Junior / Cover)',      headcount: 1, hours: 24,        rate: 15.08,  weekly:  361.92, annual: 18819.84 },
    ] },
    { key: 'barStaff', title: '3. Bar Staff', subtotal: 128419.20, roles: [
      { role: 'Bar Lead / Head Bartender',        headcount: 1, hours: 40,        rate: 14.31,  weekly:  572.40, annual: 29764.80 },
      { role: 'Bartender (FT)',                   headcount: 2, hours: 40,        rate: 13.81,  weekly: 1104.80, annual: 57449.60 },
      { role: 'Bartender (PT)',                   headcount: 2, hours: 20,        rate: 13.81,  weekly:  552.40, annual: 28724.80 },
      { role: 'Bar Back / Runner (PT)',           headcount: 1, hours: 24,        rate: 10.00,  weekly:  240.00, annual: 12480 },
    ] },
    { key: 'floorEvents', title: '4. Floor & Events', subtotal: 50793.60, roles: [
      { role: 'Floor Staff / Events Host (FT)',   headcount: 1, hours: 40,        rate: 12.21,  weekly:  488.40, annual: 25396.80 },
      { role: 'Floor Staff / Events Host (PT)',   headcount: 2, hours: 20,        rate: 12.21,  weekly:  488.40, annual: 25396.80 },
    ] },
    { key: 'cleaningMaintenance', title: '5. Cleaning & Maintenance', subtotal: 17777.76, roles: [
      { role: 'Cleaning Staff',                   headcount: 1, hours: 20,        rate: 12.21,  weekly:  244.20, annual: 12698.40 },
      { role: 'Maintenance / Handyperson',        headcount: 1, hours:  8,        rate: 12.21,  weekly:   97.68, annual:  5079.36 },
    ] },
  ],
}

// === DIGITAL MARKETING ===
// Hackney runs zero paid search. Channels: organic social, local listings,
// events & partnerships. Total ~£8k/yr (~1% of forecast revenue).
export const MARKETING = {
  // 2025 actuals — Hackney has no Google Ads history
  googleAdsSpend2025: 0,
  googleAdsClicks: 0,
  googleAdsCPC: 0,
  googleAdsConversions: 0,
  googleAdsCostPerConv: 0,
  googleAdsActiveDays: 0,
  organicSessions2025: TBD,
  organicSessions2024: TBD,
  // 2026 plan — organic / local / events only
  websiteMaintenance: TBD,
  seoOutreach: 3000,             // organic social allowance
  googleAdsBudget2026: 0,        // intentionally zero
  totalDigital2026: 8000,        // £3k organic + £2k local + £3k events
}

// === WATERFALL ===
// Round 1 PER-SHARE MODEL (May 2026). 100 shares × £1,000 each = £100k
// post-money. Every share (A or B) is entitled to the same £X per-share
// dividend when declared. NO preferred class.
//
// At each review date (Y1 = month 12 only; Y2+ = every 6 months) the
// directors declare a £X per-share rate based on the trailing 12-month
// trading. Indicative base case: total distributable profit / 100 shares.
//
// Y1 indicative (forecast £85,181 operating profit, 100 shares):
//   • Per-share dividend:        £851.81
//   • Founder (76 shares):       £64,738
//   • Leonie if signs (5):       £4,259
//   • New investor (19):         £16,184
//
// Slides recompute live via computeInvestorDividend(); this constant
// is the un-locked fallback only.
export const WATERFALL = {
  operatingProfit:  85181,
  perShareDividend: 851.81,        // £85,181 / 100 shares (Y1 indicative)
  remainingPool:    85181,         // entire profit distributable (no preferred siphon)
  investorDividend: 16184,         // 19 shares × £851.81
  founderDividend:  64738,         // 76 shares × £851.81 (Founder A + Founder B)
  totalInvestor:    16184,
  totalFounder:     64738,
}

// === 5-YEAR INVESTOR RETURNS ===
// PER-SHARE DIVIDEND MODEL (May 2026). 100 shares × £1,000 each, every
// share entitled to the same £X per-share dividend at each review date.
// Y1 = single review at month 12; Y2+ = every 6 months. Founder Y3
// call at MARKET RATE (no cap).
//
// Per-share dividends are INDICATIVE based on forecast operating profit
// ÷ 100 shares. Directors retain discretion to declare less in practice
// (e.g. to retain capital for new venues or in low-confidence years).
//
// Two scenarios per investor:
//
//   (A) HELD TO Y5 — founder does NOT exercise the Y3 call. Investor
//       collects every declared per-share dividend + their pro-rata
//       slice of the Y5 exit at 4× EBITDA.
//
//   (B) FOUNDER CALLS AT Y3 — investor exits at the end of Y3 at
//       MARKET RATE (no cap). 19% × Y3 fair value = ~£95k buyback,
//       plus cumulative Y1-Y3 dividends.
//
// Full-subscription assumptions:
//   • 100 shares total
//   • Founder 76 shares (51 A + 25 B)
//   • Leonie 5 shares (pending signature)
//   • New investor 19 shares (£19k cheque)
//
// 'investorShare' = 19 × per-share dividend that year
// 'founderShare'  = 76 × per-share dividend (A + B combined)
//                 (Leonie's 5 × per-share reported separately if she signs)
export const HACKNEY_INVESTOR_RETURNS = {
  year1: {
    profit:          85181,
    investorEq:      0.19,
    investorShares:  19,
    perShare:        851.81,           // 85181 / 100
    investorReturn:  16184,            // 19 × £851.81 (annual entitlement; cash paid at month 12)
    coc:              0.8518,          // 16184 / 19000
    paybackYears:     1.174,           // 19000 / 16184 (entitlement basis)
  },
  fiveYear: [
    { year: 'Y1 2026/27', revenue: 618804.17, profit:  85181.41, perShare:   851.81, investorShare: 16184.47, founderShare:  64737.87 },
    { year: 'Y2 2027/28', revenue: 665214.48, profit:  96856.85, perShare:   968.57, investorShare: 18402.80, founderShare:  73611.20 },
    { year: 'Y3 2028/29', revenue: 715105.57, profit: 124928.65, perShare:  1249.29, investorShare: 23736.44, founderShare:  94945.77 },
    { year: 'Y4 2029/30', revenue: 768738.49, profit: 155192.97, perShare:  1551.93, investorShare: 29486.66, founderShare: 117946.66 },
    { year: 'Y5 2030/31', revenue: 826393.88, profit: 187818.27, perShare:  1878.18, investorShare: 35685.47, founderShare: 142741.88 },
  ],
  cumulativeDividends: 123495.84,     // 19 shares × (sum of 5-yr per-share dividends)
  exit: {
    y5Ebitda:         187818.27,
    multiple:         4,
    businessValue:    751273.08,
    perShareExit:     7512.73,
    investorProceeds: 142741.89,      // 19 × £7,512.73 (held-to-Y5, no founder call)
    founderProceeds:  571167.54,      // 76 × £7,512.73
    leonieProceeds:    37563.65,      // 5 × £7,512.73 (reported separately)
  },
  totalReturned:      266237.73,      // cumulativeDividends + exit.investorProceeds
  multipleOfMoney:   14.0125,         // 266,238 / 19,000 (held-to-Y5 case)
  irr:                1.18,           // IRR on annual flows with Y1 lockup at month 12

  // === Y3 FOUNDER-CALL SCENARIO ===
  // Market-rate buyback at Y3 (no cap). If founder exercises:
  //   - Investor receives cumulative Y1-Y3 dividends:
  //     19 × (851.81 + 968.57 + 1249.29) = £58,324
  //   - Plus market-rate buyback at Y3:
  //     Y3 fair value £499,716 ÷ 100 = £4,997.16 per share
  //     19 × £4,997.16 = £94,946
  //   - Total returned: £153,270 = ~8.07× MoM on £19k
  //   - IRR: ~95% (lump at Y3 amplifies time-weighted return)
  callScenario: {
    cumulativeDividendsToY3: 58323.71,
    perShareBuybackY3:       4997.16,        // £499,716 fair value / 100
    buybackPrice:            94946,          // 19 × £4,997.16
    totalReturned:          153269.71,
    multipleOfMoney:         8.07,
    irrApprox:               0.95,
  },
}

// === GOVERNANCE ===
// Mirrors Borough's reserved-matters list — confirm any Hackney-specific
// additions (e.g. landlord consents) before sign-off.
export const GOVERNANCE = {
  ordinaryThreshold: 0.50,
  reservedThreshold: 0.75,
  aShareMinEquity: 0.05,
  reservedMatters: [
    'Sale of the business or any material asset',
    'Winding up or dissolution of the company',
    'Issuance of new shares or new share classes',
    'Amendment to Articles or Shareholders Agreement',
    'Taking on debt above £25,000',
    'Acquisition of another business',
    'Change of business purpose or trading name',
    'Appointment or removal of a Director',
    'Distributions exceeding the approved waterfall',
    'Related-party transactions above £10,000',
  ],
}

// === RAISE TARGET ===
// Default for the new-investor slider — the max single cheque available
// (£19k, assuming Leonie subscribes for her intended £5k slice). The
// Use-of-Funds capital pool is computed in deriveSnapshot (see
// LockedUseOfFundsContext) as investment + founder buyback (£25k) +
// committed external (Leonie £5k), so the total spending pool is up to
// £49k — not just the new investor's £19k. Slider allocates across
// explicit buckets; Working Capital absorbs the residual.
export const HACKNEY_RAISE_TARGET = 19000

// === USE OF FUNDS ===
// Six EXPLICIT slider categories (stock, rent, garden, interior, marketing,
// legals + restart). Working Capital is the 7th line, derived as
// HACKNEY_RAISE_TARGET minus the sum of the six. Defaults below are the
// "headline" values for each line; founder drags to reallocate.
export const USE_OF_FUNDS = [
  { key: 'stock',     item: 'Assets — Liquidator (all bar fit-out)', amount: 12000, vat: 'inc VAT', note: 'All bar assets from the liquidator — £10k + VAT = £12k inc VAT. Renegotiated May 2026; ~50% saving on the original quote. Covers bar equipment, kitchen, fridges/cellar, glassware, POS, games — operational from Day 1.' },
  { key: 'rent',      item: 'Landlord — Rent Deposit (3 mo)',   amount:     0, vat: null,      note: 'Lease deposit £19,500 inc VAT (3 mo × £6,500). Paid monthly from trading cash during the 3-month rent-free period — does NOT consume Day-1 raise. Slider lets the founder elect to ring-fence the deposit upfront instead (1 / 2 / 3 months at the inc-VAT figure).' },
  { key: 'garden',    item: 'Garden Refurbishment',             amount: 12000, vat: 'inc VAT', note: 'Outdoor trading area refurb — soundproofing investment is the priority spend.' },
  { key: 'interior',  item: 'Interior Completion & Signage',    amount: 10000, vat: 'inc VAT', note: 'Fit-out completion, signage, internal acoustic treatment.' },
  { key: 'marketing', item: 'Marketing — Pre-launch & Year 1',  amount:  3000, vat: 'inc VAT', note: 'Organic / local listings / events — no paid Google Ads spend.' },
  { key: 'legals',    item: 'Legals & Restart',                 amount:  2000, vat: null,      note: 'Solicitor fees, share registry, restart admin.' },
]

// === USE OF FUNDS — slider ranges ===
// Drives the calculator on the Use of Funds slide. Rent is a snap slider
// (1 / 2 / 3 months). Everything else is continuous within min/max with a
// £500 step. Founder locks a snapshot which then flows into Investment
// Summary, Waterfall Returns, and Cash Flow Forecast downstream.
export const USE_OF_FUNDS_RANGES = {
  stock:     { min: 0,    max: 12000, step: 500, label: 'Assets — Liquidator (all bar fit-out)' },
  rent:      { snaps: [
    { months: 0, amount:     0, label: 'Paid monthly' },
    { months: 1, amount:  6500, label: '1 month' },
    { months: 2, amount: 13000, label: '2 months' },
    { months: 3, amount: 19500, label: '3 months' },
  ], label: 'Landlord — Rent Deposit' },
  garden:    { min: 1000, max: 12000, step: 500, label: 'Garden Refurbishment' },
  interior:  { min: 1000, max: 12000, step: 500, label: 'Interior Completion & Signage' },
  marketing: { min: 1000, max:  6000, step: 500, label: 'Marketing — Pre-launch & Year 1' },
  legals:    { min: 1000, max:  3000, step: 500, label: 'Legals & Restart' },
}

// LEGACY COMMENT (pre-May-2026). Distribution model is now per-share
// dividends declared by directors at each review window. 100 shares ×
// £1,000 each; every share entitled to the same £X declared. Cap table
// is 76/24 (Founder 51 A + 25 B / external 24 B). See DEAL.* constants
// at the top of this file for the live structure.
//
//   investorEq = 0.5 (fixed)
//   founderEq  = 0.5 (fixed)
//   preMoney   = investment           (so 50/50 holds)
//   postMoney  = investment × 2
//   multiple   = preMoney / 2025 EBITDA  (derived — see helper below)
//
// Smaller raise = smaller implied pre-money = smaller implied multiple. The
// founder gives up the same 50%, just on a smaller pie. Logic checks out
// when the raise is sized to "minimum-viable to get safe and reopen" —
// further rounds price off live trading, not the seed pre-money.
// Live forecast operating profit — accepts an optional wages override
// (e.g. the locked Wage Calculator total). Wages reduce profit 1:1 (every
// other line in FORECAST is independent of wages), so we compute as a
// delta against PL_WAGE_BASE rather than re-deriving the full P&L. When
// no override is provided, returns the static FORECAST.profit.
export function computeForecastProfit(wagesOverride) {
  const wages = Number.isFinite(wagesOverride) && wagesOverride > 0 ? wagesOverride : PL_WAGE_BASE
  const wageDelta = wages - PL_WAGE_BASE
  return FORECAST.profit - wageDelta
}

// === 2026 PERFORMANCE — TAB CONSTANTS ================================
// Mirrors Borough's BusinessExplorer 2026 tab structure but adapted to
// Hackney's bar-only post-restructure shape:
//   • Golf is moving to a separate operator entity, so the golf
//     growth lever is dropped (4 levers, not 5)
//   • Rent is the £65k+VAT lease (Y1 £48,750 with 3-mo rent-free,
//     Y2+ £65,000 with 3% annual uplift) — NOT 15% of turnover
//   • Office Costs structure is copied from Borough (same line items,
//     same defaults — per founder direction)

// Donut palette for the 2026 Income breakdown (cyan family). Borough
// uses #0E7490..#A5F3FC; we use the same for visual consistency.
export const INCOME_2026_COLORS = ['#0E7490','#0891B2','#06B6D4','#22D3EE','#67E8F9','#A5F3FC']

// Custom Scenario levers — one per commercial revenue line. Keys map
// to the forecast.growth state shape ({ bar, office, tournament, pool }).
// Service Charge is intentionally excluded (derived passive line).
// Golf is intentionally excluded (moving to operator entity).
// Bases pulled from INCOME_SOURCES (= 2025 actuals).
export const HACKNEY_SCENARIO_LEVERS = [
  { key: 'bar',        labelKey: 'Bar',                    incomeKey: 'Bar takings',             color: INCOME_2026_COLORS[0], base: 484684 },
  { key: 'office',     labelKey: 'Office bookings / hires', incomeKey: 'Office bookings / hires', color: INCOME_2026_COLORS[2], base:  28120 },
  // Game & Drink bundles a round of golf with a venue drink. Despite
  // the round, 100% of the revenue stays with No Dice (per Plonk
  // Operations going-forward agreement) — the drink component is bar
  // revenue and dwarfs the golf-round portion. Total 2025 G&D sales
  // £4,824 = £4,714 online + £110 office (DMN SKUs).
  { key: 'gameDrink',  labelKey: 'Game & Drink (golf + drink bundle)', incomeKey: 'Game & Drink', color: INCOME_2026_COLORS[1], base: 4824 },
  { key: 'tournament', labelKey: 'Pool tournament entries', incomeKey: 'Pool tournament entries',  color: INCOME_2026_COLORS[3], base:   3570 },
  { key: 'pool',       labelKey: 'Pool tickets (DMN)',      incomeKey: 'Pool tickets (DMN)',       color: INCOME_2026_COLORS[5], base:   2200 },
]

// Office Costs — annual £ defaults per line. Same line items + values
// as Borough (founder confirmed the data is shared).
export const HACKNEY_OFFICE_COST_ITEMS = [
  { id: 'xero',         label: 'Xero accounting',            note: '£25/mo × 12' },
  { id: 'rotacloud',    label: 'RotaCloud',                  note: '~£40/mo for 10 users × 12' },
  { id: 'claude',       label: 'Claude Pro',                 note: '£20/mo × 12' },
  { id: 'google',       label: 'Google Workspace',           note: '£25/mo × 12' },
  { id: 'webhosting',   label: 'Web hosting',                note: 'Annual prepay (~£42/mo equiv.)' },
  { id: 'amazonPrime',  label: 'Amazon Prime',               note: '£8.99/mo × 12 — venue stock + supplies' },
  { id: 'accounting',   label: 'Accounting fees',            note: 'Annual fees' },
  { id: 'director',     label: "Directors' compensation",    note: 'Total director comp budget' },
]
export const HACKNEY_OFFICE_COSTS_2026_DEFAULTS = {
  xero:         300,
  rotacloud:    480,
  claude:       240,
  google:       300,
  webhosting:   500,
  amazonPrime:  108,
  accounting:  3000,
  director:   30000,
}
export const sumHackneyOfficeCosts = (state = {}) =>
  HACKNEY_OFFICE_COST_ITEMS.reduce(
    (sum, item) => sum + (state[item.id] ?? HACKNEY_OFFICE_COSTS_2026_DEFAULTS[item.id]),
    0,
  )

// Fixed Cost editor — line items match HACKNEY_FIXED_COSTS_2025 minus
// rent (rent is driven by FORECAST_RULES.rentY1, not the editor) and
// minus rates (which is the council line and gets its own toggle).
// Defaults are 2025 actuals × 1.10 inflation, per the FORECAST_RULES
// fixedUplift rule.
export const HACKNEY_FIXED_COST_ITEMS = [
  { id: 'rates',       label: 'Business Rates',  ref2025: 15300, note: 'Hackney Council · 2025 × 1.10' },
  { id: 'electricity', label: 'Electricity',     ref2025: 12750, note: '2025 × 1.10' },
  { id: 'water',       label: 'Water',           ref2025:  2550, note: '2025 × 1.10' },
  { id: 'insurance',   label: 'Insurance',       ref2025:  2754, note: '2025 × 1.10' },
  { id: 'license',     label: 'License',         ref2025:  1275, note: '2025 × 1.10' },
  { id: 'prsPpl',      label: 'PRS / PPL',       ref2025:  1530, note: '2025 × 1.10' },
  { id: 'internet',    label: 'Internet',        ref2025:  1445, note: '2025 × 1.10' },
  { id: 'lightspeed',  label: 'Lightspeed',      ref2025:   931, note: '2025 × 1.10' },
  { id: 'tvLicense',   label: 'TV License',      ref2025:   255, note: '2025 × 1.10' },
]
export const HACKNEY_FIXED_COSTS_2026_DEFAULTS = HACKNEY_FIXED_COST_ITEMS.reduce(
  (acc, it) => { acc[it.id] = Math.round(it.ref2025 * 1.10); return acc },
  {},
)
export const sumHackneyFixedCostsAnnual = (state = {}) =>
  HACKNEY_FIXED_COST_ITEMS.reduce(
    (sum, it) => sum + (state[it.id] ?? HACKNEY_FIXED_COSTS_2026_DEFAULTS[it.id]),
    0,
  )

// === FORECAST RULES (2026 Performance) ==============================
// Single source of truth for the cost-uplift assumptions. Consumed by
// BusinessExplorer's 2026 tab AND the WaterfallReturns distribution
// calendar (so monthly profit numbers stay consistent across slides).
export const FORECAST_RULES = {
  revenueGrowth:   0.15,                // base case
  variableUplift:  0.10,                // stock + variable cats
  fixedUplift:     0.10,                // non-rent, non-rates fixed lines
  rentAnnualNet:   65000,
  rentY1:          48750,               // 9 paying months × £65k/12 (3-mo rent-free)
  rentSteady:      65000,
  rentUplift:      0.03,
  rates:           16830,               // 2025 × 1.10
}

// Monthly forecast — 12 rows, May 2026 → Apr 2027 trading year (presented
// in calendar Jan-Dec order using the 2025 monthly seasonality scaled to
// 2026 rules). Output rows: { month, income, profit, wages, fixed, ... }.
// `wagesOverride` cascades the locked Wage Calculator into per-month
// wages by scaling proportionally so seasonality is preserved.
export function computeForecastMonthly(wagesOverride) {
  const r = 1 + FORECAST_RULES.revenueGrowth
  const v = 1 + FORECAST_RULES.variableUplift
  const f = 1 + FORECAST_RULES.fixedUplift
  const monthlyRates = FORECAST_RULES.rates / 12
  const otherFixed2025Total = HACKNEY_FIXED_COSTS_2025
    .filter(l => l.key !== 'rent' && l.key !== 'rates')
    .reduce((s, l) => s + l.amount, 0)
  const monthlyFixedTotal2025 = MONTHLY_COSTS.reduce((s, m) => s + m.fixed, 0)
  const targetWageAnnual = Number.isFinite(wagesOverride) && wagesOverride > 0 ? wagesOverride : PL_WAGE_BASE
  const wageScale = PL_WAGE_BASE > 0 ? targetWageAnnual / PL_WAGE_BASE : 1
  const monthlyRentAvg = FORECAST_RULES.rentY1 / 12

  return MONTHLY_INCOME.map((row, i) => {
    const mc = MONTHLY_COSTS[i]
    const variable = (mc.drinks + mc.cleaning + mc.djs + mc.arcades + mc.food) * v
    const otherFixedShare = monthlyFixedTotal2025 > 0
      ? mc.fixed * (otherFixed2025Total / monthlyFixedTotal2025) * f
      : 0
    const fixed = otherFixedShare + monthlyRentAvg + monthlyRates
    const wages = mc.wages * wageScale
    const income = row.amount * r
    const totalCost = variable + fixed + wages
    return {
      month: row.month,
      income,
      profit: income - totalCost,
      wages, fixed,
      rent: monthlyRentAvg,
      rates: monthlyRates,
      drinks: mc.drinks * v, cleaning: mc.cleaning * v,
      djs: mc.djs * v, arcades: mc.arcades * v, food: mc.food * v,
    }
  })
}

// === DISTRIBUTION CALENDAR (12-month, quarterly dividends) ============
// Working-capital-first model with investor-priority quarterly draws:
//
//   1. Every month's operating profit refills the working-capital
//      reserve toward `reserveTarget` (default £30k). Anything beyond
//      the target accrues into the quarterly dividend pool.
//   2. At each calendar quarter-end (Mar/Jun/Sep/Dec):
//        - If reserve ≥ floor AND there's positive accrual to distribute:
//          investor is paid their pro-rata share FIRST, founder draws
//          their pro-rata share AFTER.
//        - If reserve < floor: the quarter is deferred. The investor's
//          share is tracked in `deferredInvestor` and is paid down on
//          a later quarter where the reserve has rebuilt to target.
//          Founder also waits (founder is paid AFTER the investor —
//          if the investor doesn't get paid this quarter, neither does
//          the founder; tracked in `deferredFounder`).
//        - Catch-up: when reserve ≥ target at quarter-end, any
//          deferred investor amount is paid down on top of the current
//          quarter's investor share (founder catch-up follows the same
//          rule — deferred founder paid after deferred investor is
//          cleared).
//   3. A loss month eats into the reserve before it eats into accrued
//      surplus, identical to the prior model.
//
// Numerical equivalence with the prior model: in the Y1 base case the
// reserve fills inside the first few months, never dips below the
// floor, and every quarter pays both shares — so totalInvestor /
// totalFounder are unchanged. The deferral path only activates in
// stress scenarios (loss months that dip the reserve below floor).
//
// Output:
//   calendar    — 12 rows, one per month, with reserveBalance,
//                  reserveAdd, surplus, cumulativeAccrual,
//                  isQuarterEnd, dividendPaid, investorShare,
//                  founderShare, investorCatchup, founderCatchup,
//                  deferredInvestor, deferredFounder (running totals).
//   quarterly   — 4 rows (Q1–Q4) summarising each payout.
//   summary     — totals + reserveFloor, reserveTarget, reserveFullMonth,
//                  deferredInvestor / deferredFounder still owed at
//                  year-end, yearEndAccrual, yearEndReserve.
export const HACKNEY_WORKING_CAPITAL_RESERVE = 30000

export function computeDistributionCalendar(wagesOverride, opts = {}) {
  // ── DISTRIBUTION MODEL (May 2026 restructure) ─────────────────────
  //
  // Single rule, single cadence: SEMI-ANNUAL distributions to all
  // holders, GATED by the £30k working-capital reserve floor, with a
  // hard Y1 LOCKUP (first window lands at month 12 = end of Y1, not
  // before).
  //
  // The 12-month Y1 calendar that this function returns therefore has
  // exactly ONE distribution window: month 11 (the 12th forecast row,
  // = Apr 2027 under the May 2026 → Apr 2027 trading year).
  //
  //   Months 0-10  →  accrue only (lockup)
  //   Month 11     →  if reserve ≥ floor: pay full Y1 accrual; else defer
  //   Month 12+    →  out of scope for the Y1 calendar; the calling
  //                   slide draws the year-2 schedule from
  //                   HACKNEY_INVESTOR_RETURNS.fiveYear[]
  //
  // Investor / founder split within a distribution window: pro-rata to
  // the equity percentages passed in `opts`. There is no within-window
  // priority any more (Founder A 51% + Founder B 25% + external B 24%
  // all draw at the same time, in proportion to their slices).
  //
  // For backward compatibility the function still returns:
  //   • a 12-row monthly calendar (same shape as before)
  //   • a `quarterly` array — but it now contains a single row for the
  //     month-11 distribution window. Renamed semantically to
  //     `distributions` (alias kept on `quarterly` for old consumers).
  //   • summary totals (yearEndReserve, deferred amounts, totals)

  const reserveTarget = opts.reserveTarget ?? HACKNEY_WORKING_CAPITAL_RESERVE
  // reserveFloor defaults to reserveTarget so the legacy single-number
  // model is preserved when callers don't pass a separate floor.
  const reserveFloor  = opts.reserveFloor  ?? reserveTarget
  const investorEq    = opts.investorEq    ?? 0.5
  const founderEq     = opts.founderEq     ?? (1 - investorEq)
  const monthly       = computeForecastMonthly(wagesOverride)

  let reserveBalance     = 0
  let cumulativeAccrual  = 0     // surplus accrued since last distribution window
  let deferredInvestor   = 0     // investor share owed from skipped windows
  let deferredFounder    = 0     // founder share owed from skipped windows
  let reserveFullMonth   = null

  // Distribution-window indices within the 12-month Y1 calendar. Under
  // the semi-annual + Y1-lockup model there is exactly ONE window in
  // Y1: month index 11 (Dec / the 12th row), being the end of Y1.
  // Months 0-10 are pure accrual.
  const WINDOW_END_IDX = new Set([11])

  const calendar = monthly.map((row, i) => {
    const monthlyProfit = row.profit
    let reserveAdd = 0
    let surplus    = 0

    if (monthlyProfit >= 0) {
      // Refill reserve first, then any leftover becomes surplus.
      const room = Math.max(0, reserveTarget - reserveBalance)
      reserveAdd = Math.min(monthlyProfit, room)
      reserveBalance += reserveAdd
      surplus = monthlyProfit - reserveAdd
    } else {
      // A loss eats into the reserve before it eats into accrued surplus.
      const loss = -monthlyProfit
      const fromReserve = Math.min(reserveBalance, loss)
      reserveBalance -= fromReserve
      reserveAdd = -fromReserve
      const remainder = loss - fromReserve
      surplus = -remainder
    }

    cumulativeAccrual += surplus
    if (reserveBalance >= reserveTarget && !reserveFullMonth) reserveFullMonth = row.month

    const isDistributionWindow = WINDOW_END_IDX.has(i)
    // Backward-compat alias for consumers that haven't migrated yet.
    const isQuarterEnd = isDistributionWindow
    let dividendPaid    = 0
    let investorShare   = 0
    let founderShare    = 0
    let investorCatchup = 0
    let founderCatchup  = 0

    if (isDistributionWindow) {
      // Only positive cumulative accrual is distributable; a deficit
      // carries forward (no clawback).
      const distributable = Math.max(0, cumulativeAccrual)

      if (distributable > 0) {
        if (reserveBalance >= reserveFloor) {
          // Pro-rata split. No within-window priority any more — all
          // holders draw at the same time in proportion to their
          // equity slice (Founder A 51% + Founder B 25% bundled into
          // `founderEq`; external B 24% in `investorEq`).
          investorShare = distributable * investorEq
          founderShare  = distributable * founderEq

          // Catch-up for previously deferred windows. When the reserve
          // is above target, drain any owed amounts from the post-target
          // headroom (investor first, then founder — purely a
          // book-keeping order, not a payment priority).
          if (reserveBalance >= reserveTarget) {
            const headroom = Math.max(0, reserveBalance - reserveTarget)
            investorCatchup = Math.min(deferredInvestor, headroom)
            reserveBalance  -= investorCatchup
            deferredInvestor -= investorCatchup
            investorShare    += investorCatchup

            const headroom2 = Math.max(0, reserveBalance - reserveTarget)
            founderCatchup   = Math.min(deferredFounder, headroom2)
            reserveBalance  -= founderCatchup
            deferredFounder -= founderCatchup
            founderShare    += founderCatchup
          }

          dividendPaid     = investorShare + founderShare
          cumulativeAccrual -= distributable
        } else {
          // Reserve below floor → defer the entire window. Owed amounts
          // tracked in deferredInvestor / deferredFounder; the physical
          // cash sits in the reserve to help rebuild it.
          deferredInvestor  += distributable * investorEq
          deferredFounder   += distributable * founderEq
          reserveBalance    += distributable
          cumulativeAccrual -= distributable
        }
      }
    }

    return {
      month: row.month,
      profit: monthlyProfit,
      reserveAdd,
      reserveBalance,
      surplus,
      cumulativeAccrual,
      isDistributionWindow,
      isQuarterEnd,             // backward-compat alias
      dividendPaid,
      investorShare,
      founderShare,
      investorCatchup,
      founderCatchup,
      deferredInvestor,
      deferredFounder,
      reservePct: Math.min(1, reserveBalance / reserveTarget),
    }
  })

  // New semantic name: `distributions`. Backward-compat alias `quarterly`
  // preserved so existing slides keep rendering until they're updated.
  const distributions = calendar
    .filter(c => c.isDistributionWindow)
    .map((q, i) => ({
      window: `W${i + 1}`,             // "W1", "W2", ... — semi-annual windows
      quarter: `H${i + 1}`,            // backward-compat label (H = half-year)
      endMonth: q.month,
      dividend: q.dividendPaid,
      investorShare: q.investorShare,
      founderShare: q.founderShare,
      investorCatchup: q.investorCatchup,
      founderCatchup: q.founderCatchup,
    }))
  const quarterly = distributions   // alias for backward compat

  const totalDividends = quarterly.reduce((s, q) => s + q.dividend, 0)
  const totalInvestor  = quarterly.reduce((s, q) => s + q.investorShare, 0)
  const totalFounder   = quarterly.reduce((s, q) => s + q.founderShare, 0)
  const annualProfit   = monthly.reduce((s, m) => s + m.profit, 0)

  return {
    calendar,
    quarterly,         // backward-compat alias
    distributions,
    summary: {
      reserveTarget,
      reserveFloor,
      reserveFullMonth: reserveFullMonth ?? 'not reached in Y1',
      annualProfit,
      totalDividends,
      totalInvestor,
      totalFounder,
      // Deferred amounts still owed at year-end. Non-zero only when a
      // loss month dipped the reserve below floor before a quarter end.
      deferredInvestor,
      deferredFounder,
      // Surplus still accrued at year-end (didn't pay out as a quarterly
      // dividend — usually £0 if Dec is a quarter-end).
      yearEndAccrual: cumulativeAccrual,
      yearEndReserve: reserveBalance,
    },
  }
}

export function computeDealFromInvestment(investment) {
  // ROUND 1 RESTRUCTURED (May 2026). Post-money valuation FIXED at £100k.
  // Cap table: Founder retains 51% A + 25% B buyback = 76%. Available
  // externally = 24% (£24k pool, of which 5% intended for Leonie + 19%
  // open for new investors).
  //
  //   £5k  → 5%  equity (Leonie's intended slice)
  //   £10k → 10% equity
  //   £19k → 19% equity (max for a single new investor — full external slice
  //                       remaining after Leonie if she subscribes)
  //   £24k → 24% equity (full external pool if Leonie doesn't subscribe)
  //
  // The cap below is `DEAL.externalPostEq` (0.24) — the total externally-
  // available equity. Any single cheque is capped at that total since
  // there's no scenario where one investor takes more than the full
  // external pool.
  const POST_MONEY = 100000
  const postMoney  = POST_MONEY
  const externalCap = DEAL.externalPostEq ?? 0.24
  const investorEq = Math.min(externalCap, Math.max(0, investment / postMoney))
  const founderEq  = 1 - investorEq
  const preMoney   = postMoney - investment
  const ebitda     = 30896.17                       // = ACTUALS_2025.profit
  const impliedMult = ebitda > 0 ? preMoney / ebitda : 0
  return { investment, preMoney, postMoney, investorEq, founderEq, impliedMult }
}

// computeInvestorDividend — Round 1 PER-SHARE dividend model.
//
// Mechanic (at each review date, after director salary + working-capital
// top-up):
//   1. Reserve floor check (£30k) — declaration skipped if below floor.
//   2. Directors declare a £X per-share dividend based on trailing-12-month
//      trading. Indicative basis = annual operating profit ÷ totalShares.
//   3. Every share (A or B) receives the same £X. No preferred class.
//
// `investmentAmount` is the new investor's £ cheque. With £1k per share,
// share count = investmentAmount / 1000. The investor's annual dividend
// entitlement = shares × per-share rate.
//
// Examples (Y1 indicative dividend ≈ £851.81 per share, 100 shares):
//   Invest £19k → 19 shares × £851.81 = £16,184 annual entitlement
//   Invest £10k → 10 shares × £851.81 = £8,518
//   Invest  £5k → 5  shares × £851.81 = £4,259
//   Invest  £1k → 1  share  × £851.81 = £852
//
// Y1 LOCKUP REMINDER: this function returns the ANNUAL ENTITLEMENT. Under
// the new schedule no dividend is declared until month 12 — Y1's full
// entitlement is paid in a single declaration then. Y2 onwards splits
// across two semi-annual declarations.
export function computeInvestorDividend(profit, investmentAmount, opts) {
  opts = opts || {}
  const totalShares  = opts.totalShares  ?? DEAL.totalShares  ?? 100
  const pricePerShare = opts.pricePerShare ?? DEAL.pricePerShare ?? 1000
  const inv = Math.max(0, investmentAmount || 0)
  const p   = Math.max(0, profit || 0)

  // Indicative per-share dividend = total distributable profit / share count.
  // Directors retain discretion to declare less than this in practice.
  const perShare = totalShares > 0 ? p / totalShares : 0

  // Investor's share count = their £ cheque / £1k.
  const investorShares = pricePerShare > 0 ? inv / pricePerShare : 0
  return investorShares * perShare
}

// === HARDWARE FROM LIQUIDATORS — itemised breakdown ===
// TBD: Hackney's £42,000 stock-purchase line isn't yet itemised by category.
// Likely splits: bar equipment, kitchen, fridges/cellar, glassware/POS,
// games (pool, arcades). Confirm with the liquidator inventory.
export const HARDWARE_BREAKDOWN = [
  { item: 'Bar equipment & cellar',   amount: TBD, note: 'Beer lines, fridges, glasswash, taps, ice machine, POS hardware' },
  { item: 'Kitchen equipment',        amount: TBD, note: 'Counters, fridges, prep, small wares' },
  { item: 'Glassware & wet stock',    amount: TBD, note: 'Glassware, cleaning chemicals, repair tools, hand-trolleys, small wares' },
  { item: 'Games & furniture',        amount: TBD, note: 'Pool tables, arcades, board game stock, seating, lighting fittings' },
]

// === STOCK & OPERATIONAL SETUP — itemised breakdown ===
// TBD: Hackney's £9,250 "Legals, Restart & Working Capital" line and parts
// of the £10k Interior Completion line will need a similar itemisation.
// For now, all rows TBD — populate from the workbook once available.
export const STOCK_SETUP_DETAIL = [
  { item: 'Alcohol stock (opening fill)',     amount: TBD, type: 'oneOff',     vatExempt: false, note: 'Wines, spirits, beer for Day 1 trading' },
  { item: 'Soft drinks & mixers',              amount: TBD, type: 'oneOff',     vatExempt: false, note: 'Cocktail mixers, soft drinks, juices' },
  { item: 'Cleaning contracts restart',        amount: TBD, type: 'oneOff',     vatExempt: false, note: 'Deep clean + first month commercial cleaning' },
  { item: 'Internet — Starlink / BT Business', amount: TBD, type: 'setupPlus1', vatExempt: false, note: 'Hardware setup + first month connectivity' },
  { item: 'Booking platform setup',            amount: TBD, type: 'oneOff',     vatExempt: false, note: 'Booking system, delivery app integrations' },
  { item: 'Xero accounting',                   amount: TBD, type: 'sub3mo',     vatExempt: false, note: 'Cloud accounting' },
  { item: 'Rota Cloud — staff scheduling',     amount: TBD, type: 'sub3mo',     vatExempt: false, note: 'Rota & timesheet system' },
  { item: 'Spotify Business',                  amount: TBD, type: 'sub3mo',     vatExempt: false, note: 'Bar music licensing' },
  { item: 'Business rates (first month)',      amount: TBD, type: 'monthly',    vatExempt: true,  note: 'First month UK business rates — Hackney Council (post-relief)' },
  { item: 'Alcohol licence change (DPS)',      amount: TBD, type: 'oneOff',     vatExempt: true,  note: 'Designated Premises Supervisor change fee — Hackney Licensing' },
]

// === GOLF OPERATIONS — 2025 ACTUALS + GO-FORWARD STRUCTURE ===========
// Pre-liquidation, the mini-golf course operated next door (Mentmore
// Terrace adjacent site). Customers bought tickets two ways:
//   1. Online via Design My Night (DMN) — £-priced ticket SKUs.
//      Some SKUs include arcade-token bundles (e.g. "Golf + 4 Tokens"
//      includes 4 tokens used in the venue's arcade machines). Tokens
//      are NOT a redemption mechanic for the £ ticket value — the
//      ticket pays for the round of golf, the tokens are an arcade
//      add-on bundled into certain SKUs.
//   2. At the till — direct cash/card sale at the venue (golf round
//      only, no token bundle).
// Customers played golf and (with tokens) used the arcades. Bar / food
// / party spend was incremental on top.
//
// Going forward (2026+), the golf course is being separated:
//   • Golf operated by a SEPARATE company (own entity, own books)
//   • No Dice continues to HOST + OPERATE the course (still the
//     customer-facing operator on site)
//   • No Dice keeps:
//       - 100% of bar revenue (unchanged)
//       - 100% of food revenue (unchanged)
//       - 100% of party / private hire revenue (unchanged)
//       - 100% of arcade token revenue — both online ticket-bundled
//         tokens AND tokens sold at the bar till. The operator
//         takes NO share of token value; tokens are entirely a
//         No Dice revenue line.
//   • Golf operator keeps:
//       - 100% of till ticket sales (was No Dice's)
//       - The £-ticket portion of online sales (golf round component)
//
// Cost structure for the golf side in 2025 (per founder):
//   • Rent — yes (course site is a separate lease)
//   • Some host wages — yes (busy times only — course was always
//     OPEN regardless of whether a dedicated host was rota'd; bar
//     staff and supervisors covered the host role outside busy times)
//   • Maintenance — yes (founder to approximate)
//   • Upgrade — yes (founder to approximate)
//   • Bills — NONE (no utilities billed against the course)
//   • Business rates — NONE (no rates paid on the course site)
//
// Sources for figures below:
//   • onlineTickets   — Design My Night sales export, Hackney venue,
//                        1.1.2025 – 31.12.2025. Sourced from the live
//                        per-SKU breakdown (HACKNEY_DMN_SKUS_ONLINE_2025,
//                        £44,812.35) — NOT from INCOME_SOURCES, which is
//                        the bar-only view and no longer carries an
//                        Online golf line (golf moved to the operator
//                        entity for the going-forward bar narrative).
//   • Pool tournament entries are NOT a golf line — they're bar-side
//     and stay 100% with No Dice. Tracked on Business Explorer via
//     INCOME_SOURCES["Pool tournament entries"] (2025) and HACKNEY_SCENARIO_LEVERS
//     ["tournament"] (2026 forecast).
//   • tillTickets     — Weekly Merged 2024-2026 row 3, walk-in
//                        ticket sales for 1.1.2025 – 31.12.2025
//   • hostWages       — live rota Google Sheet, "Golf host" role
//                        rows (course always open; host scheduled
//                        for busy periods only)
//   • rentShare       — TBD (lease apportioned to course site only)
//   • maintenance / upgrade — founder approximations, TBD
export const HACKNEY_GOLF_2025 = {
  // Revenue lines (what came IN to No Dice as the operating venue in 2025)
  revenue: {
    onlineTickets:    44812,    // £ — Hackney DMN online ticket sales (status=complete).
                                //     Source: Design My Night sales export aggregated
                                //     from HACKNEY_DMN_SKUS_ONLINE_2025 (£44,812.35)
    tillTickets:      25503,    // £ — direct ticket sales at venue till. Source: Weekly
                                //     Merged 2024-2026 row 3 ("Total Walk In Golf
                                //     Tickets"), 52 weeks of 2025 summed (£25,502.77)
    // POOL tournament entries removed from this object — they are NOT a
    // golf line. Pool tournaments (Doubles + Singles Pool Tournament SKUs
    // sold via DMN, £3,570 in 2025) are bar-side activity and stay 100%
    // with No Dice. They're tracked on the main 2025 income breakdown via
    // INCOME_SOURCES['Pool tournament entries'] and forecast on the 2026
    // Performance tab via HACKNEY_SCENARIO_LEVERS['tournament']. They do
    // not feature in the golf P&L.
  },
  // Costs attributable to running the golf course in 2025.
  //
  // METHODOLOGY NOTE — wages: Weekly Merged 2024-2026 (rows 14-24) is
  // the only true financial source for 2025 wage spend, but it splits
  // wages by COMPONENT (gross pay, NIC, pension, holiday, sick,
  // freelance) — NOT by ROLE. There is no "Golf Host" line in the
  // financials. The hostWages figure below is therefore a rota-derived
  // operational allocation, not financial truth: 248.2 hrs × £13.15
  // rota rate × WAGE_OVERHEAD_MULT (≈1.355 for NIC + pension + holiday)
  // ≈ £4,423 fully-loaded. Use it as the founder's working estimate;
  // refine via payroll re-cut if a hard P&L attribution is ever needed.
  costs: {
    hostWages:         4423,    // £ — rota-derived estimate (248.2 hrs ×
                                //     £13.15 × 1.355). Operational
                                //     allocation, not Weekly Merged truth.
    rentShare:        24000,    // £ — separate course-site lease, £24,000/yr inc VAT (founder)
    maintenance:       3000,    // £ — founder approximation, 2025
    upgrade:          20000,    // £ — founder approximation, 2025: new holes
                                //     installed, new paint job, new theming
                                //     extending from the bar side
    utilities:            0,    // £ — no bills paid for the course
    businessRates:        0,    // £ — no rates paid on the course site
  },
}

// === GOLF HOST — 2025 MONTHLY ROTA AGGREGATE ==========================
// OPERATIONAL DATA ONLY — hours scheduled per role per month.
// Pulled from the live rota Google Sheet (Role = "Golf host", date in
// calendar-year 2025). Surfaces the seasonal pattern of when a
// dedicated host was rota'd: Jan–Apr ran consistently, May–Jun dark,
// summer pickup Jul–Aug, then dark Sep–Dec onwards. (Note: course
// was always OPEN regardless — bar staff / supervisors covered the
// host role outside dedicated host shifts.)
//
// `costGross` shown below is the rota's own Cost column (hours ×
// rota hourly rate) — included for operational reference only. It
// is NOT the financial wage attribution. Weekly Merged 2024-2026
// is the financial source of truth for wages and does not break
// out a Golf Host line, so any £ attribution to this role is an
// estimate, not a P&L figure.
export const HACKNEY_GOLF_HOST_2025_MONTHLY = [
  { month: 'Jan', shifts: 6, hours: 41.5, costGross:  546 },
  { month: 'Feb', shifts: 7, hours: 38.5, costGross:  506 },
  { month: 'Mar', shifts: 5, hours: 34.0, costGross:  447 },
  { month: 'Apr', shifts: 7, hours: 48.2, costGross:  634 },
  { month: 'May', shifts: 0, hours:  0.0, costGross:    0 },
  { month: 'Jun', shifts: 0, hours:  0.0, costGross:    0 },
  { month: 'Jul', shifts: 2, hours: 21.5, costGross:  283 },
  { month: 'Aug', shifts: 6, hours: 64.5, costGross:  848 },
  { month: 'Sep', shifts: 0, hours:  0.0, costGross:    0 },
  { month: 'Oct', shifts: 0, hours:  0.0, costGross:    0 },
  { month: 'Nov', shifts: 0, hours:  0.0, costGross:    0 },
  { month: 'Dec', shifts: 0, hours:  0.0, costGross:    0 },
]

export const HACKNEY_GOLF_HOST_2025_TOTALS = {
  // Operational rota data only. costGross is the rota Cost column
  // (rota rate × hours) — useful for "would the £ be material?"
  // sanity but not a financial-truth wage figure.
  shifts:     33,        // total 2025 shifts
  hours:     248.2,      // total 2025 hours
  costGross: 3265,       // £3,264.55 rounded — rota Cost column. OPERATIONAL ONLY
                         // (Weekly Merged 2024-2026 is the financial source of
                         // truth; it does not break out Golf Host as a line)
  activeMonths: 6,       // Jan, Feb, Mar, Apr, Jul, Aug
  darkMonths:  6,        // May, Jun, Sep, Oct, Nov, Dec
}

// === WALK-IN GOLF TILL TICKETS — 2025 MONTHLY =========================
// Pulled from Weekly Merged 2024-2026 row 3 ("Total Walk In Golf
// Tickets"). 52 weeks of 2025 aggregated by week-start month. Total
// 2025 = £25,502.77 (rounded to £25,503 in HACKNEY_GOLF_2025.revenue.
// tillTickets above). Note: till sales ran every month of 2025 — even
// in May / Jun / Sep / Oct / Nov / Dec when the rota had ZERO Golf
// Host shifts — meaning bar staff and supervisors were ringing up
// walk-in tickets at the till even when the dedicated host role wasn't
// rota'd. That's part of the investor narrative for why the course
// was a hidden cost-of-distraction on the bar P&L.
export const HACKNEY_GOLF_TILL_2025_MONTHLY = [
  { month: 'Jan', weeks: 4, revenue:  1048 },
  { month: 'Feb', weeks: 4, revenue:  1611 },
  { month: 'Mar', weeks: 5, revenue:  2954 },
  { month: 'Apr', weeks: 4, revenue:  2435 },
  { month: 'May', weeks: 4, revenue:  2446 },
  { month: 'Jun', weeks: 5, revenue:  2627 },
  { month: 'Jul', weeks: 4, revenue:  2628 },
  { month: 'Aug', weeks: 3, revenue:  2588 },
  { month: 'Sep', weeks: 6, revenue:  2554 },
  { month: 'Oct', weeks: 4, revenue:  2002 },
  { month: 'Nov', weeks: 4, revenue:  1353 },
  { month: 'Dec', weeks: 5, revenue:  1260 },
]

// === WALK-IN GOLF — TILL SKU BREAKDOWN (Goodtill 2025 Jan–23 Sep, CLEAN) =====
// Per-product aggregate of every till transaction tagged either OTHER - GOLF
// or OTHER - GOLF & GAMES that represents a golf round (or a golf+token
// bundle). No scanning happens at Hackney, so each line is a real cash
// transaction at the bar till.
//
// Source: data/hackney_2025_till_sales_clean.csv (deduplicated). The raw
// Goodtill export at data/hackney_2025_till_sales.csv had ~26.7% of all
// rows as exact duplicates (same Sale ID + second + product + price + qty
// + discount + total + takeaway flag + notes). Genuine 2-unit purchases
// would appear as a single qty=2 line; repeated qty=1 clones at the same
// instant are not legitimate distinct purchases.
//
// Headline impact for golf specifically:
//   Pre-dedup:  9,915 lines · 10,437 units · £95,861.58
//   Post-dedup: 5,693 lines ·  6,221 units · £58,242.97  (−39.2% revenue,
//                                                         −42.6% lines)
//
// Schema mirrors HACKNEY_DMN_SKUS_ONLINE_2025 (sku, rounds, tokens, price,
// sold, revenue) so the same SkuTable renderer is reusable. `sold` counts
// units (Goodtill Quantity column), not lines.
export const HACKNEY_GOLF_TILL_SKUS_2025 = [
  { sku: 'Peak Adult — Round of Golf',                       rounds: 1, tokens: 0, price: 12.87, sold: 1914, revenue: 24641.77 },
  { sku: 'Adult — Round of Golf (legacy £5/£6 button)',      rounds: 1, tokens: 0, price:  5.26, sold: 1743, revenue:  9173.80 },
  { sku: 'Off Peak Adult — Round of Golf',                   rounds: 1, tokens: 0, price:  9.86, sold:  911, revenue:  8981.28 },
  { sku: 'Peak Adult — Golf and Five Arcade Tokens',         rounds: 1, tokens: 5, price: 15.94, sold:  405, revenue:  6456.00 },
  { sku: 'Off Peak Adult — Golf and Five Arcade Tokens',     rounds: 1, tokens: 5, price: 12.35, sold:  166, revenue:  2050.92 },
  { sku: 'Under 18s — Round of Golf (legacy)',               rounds: 1, tokens: 0, price:  5.22, sold:  355, revenue:  1851.40 },
  { sku: 'Off Peak Under 18s — Round of Golf',               rounds: 1, tokens: 0, price:  5.49, sold:  286, revenue:  1569.15 },
  { sku: 'Peak Under 18s — Round of Golf',                   rounds: 1, tokens: 0, price:  7.43, sold:  193, revenue:  1434.75 },
  { sku: 'Peak Under 18s — Golf and Five Arcade Tokens',     rounds: 1, tokens: 5, price: 11.91, sold:   41, revenue:   488.40 },
  { sku: 'Off Peak Under 18s — Golf and Five Arcade Tokens', rounds: 1, tokens: 5, price: 10.00, sold:   39, revenue:   390.00 },
  { sku: 'Adult — Round of Golf & Four Tokens',              rounds: 1, tokens: 4, price:  8.63, sold:   45, revenue:   388.41 },
  { sku: 'Peak Adult — Round of Golf & Four Tokens',         rounds: 1, tokens: 4, price: 11.30, sold:   23, revenue:   260.00 },
  { sku: 'Night Golf',                                       rounds: 1, tokens: 0, price:  5.29, sold:   45, revenue:   238.25 },
  { sku: '2-4-1 — Adult — Round of Golf',                    rounds: 1, tokens: 0, price:  4.60, sold:   30, revenue:   138.03 },
  { sku: 'Under 18s — Round of Golf & Four Tokens',          rounds: 1, tokens: 4, price:  8.50, sold:    9, revenue:    76.50 },
  { sku: 'Off Peak Adult — Round of Golf & Four Tokens',     rounds: 1, tokens: 4, price:  8.50, sold:    7, revenue:    59.50 },
  { sku: '2-4-1 — Adult — Round of Golf & Four Tokens',      rounds: 1, tokens: 4, price:  8.41, sold:    2, revenue:    16.81 },
  { sku: 'Under 18s — Round of Golf (£6 button)',            rounds: 1, tokens: 0, price:  6.00, sold:    2, revenue:    12.00 },
  { sku: '2-4-1 — Under 18s — Round of Golf',                rounds: 1, tokens: 0, price:  5.00, sold:    2, revenue:    10.00 },
  { sku: 'Plonk Medal',                                      rounds: 1, tokens: 0, price:  6.00, sold:    1, revenue:     6.00 },
  { sku: 'Mothers Day Golf (£0 — staff comp)',               rounds: 1, tokens: 0, price:  0.00, sold:    2, revenue:     0.00 },
]

// Aggregate roll-ups for the headline strip on the Walk-In Till section.
// Pre-computed so the React layer can render them without re-summing.
// All values are post-dedup (data/hackney_2025_till_sales_clean.csv).
export const HACKNEY_GOLF_TILL_SKUS_GRAND_2025 = {
  totalSold:        6221,
  totalRevenue:     58242.97,
  // Split between pure golf rounds and golf+token bundles for the headline.
  roundsSold:       5484,    // qty across SKUs with tokens === 0
  roundsRevenue:    48056.43,
  bundlesSold:      737,
  bundlesRevenue:   10186.54,
  // Bundled tokens carried inside the Golf+Tokens SKUs above (units ×
  // tokens-per-unit, summed). 100% of token revenue stays with No Dice.
  tokensTotal:      3599,
}

// Monthly walk-in golf till totals — per-month £ summed across every
// golf-tagged line in the cleaned Goodtill export. Used as the till-side
// bar chart on the Walk-In Till section. Sep is partial (Goodtill data
// ends 23 Sep when Hackney migrated to Lightspeed); Oct–Dec are not in
// this dataset.
export const HACKNEY_GOLF_TILL_SKUS_MONTHLY_2025 = [
  { month: 'Jan', revenue: 4645 },
  { month: 'Feb', revenue: 6079 },
  { month: 'Mar', revenue: 6904 },
  { month: 'Apr', revenue: 6349 },
  { month: 'May', revenue: 7986 },
  { month: 'Jun', revenue: 6084 },
  { month: 'Jul', revenue: 7349 },
  { month: 'Aug', revenue: 9818 },
  { month: 'Sep', revenue: 3028 },
]

// Go-forward (2026+) revenue split between the new golf operator and No Dice.
// Each line records what NO DICE retains under the new structure. Anything
// the operator takes as their share is the complement (1 - retained).
export const HACKNEY_GOLF_GOING_FORWARD = {
  structure: {
    operator:   'Separate company (newly incorporated)',
    host:       'No Dice — continues to host + operate the course on site',
    cashflow:   'Settled monthly between the two entities',
  },
  noDiceRetains: [
    { line: 'Bar revenue',                pct: 1.00, note: 'Unchanged — 100% to No Dice' },
    { line: 'Food revenue',               pct: 1.00, note: 'Unchanged — 100% to No Dice' },
    { line: 'Party / private hire',       pct: 1.00, note: 'Unchanged — 100% to No Dice' },
    { line: 'Arcade token revenue',       pct: 1.00, note: '100% to No Dice — operator takes no share of token value' },
    { line: 'Online ticket — golf round', pct: 0.00, note: 'Operator keeps the £-ticket portion (it is their core business)' },
    { line: 'Till ticket sales',          pct: 0.00, note: 'Operator keeps it (it is their core business)' },
    { line: 'Pool tournament entries',    pct: 1.00, note: '100% to No Dice — pool tournaments are a bar-side activity, operator takes no share' },
  ],
  noDiceTakesOver: [
    'Course hosting + operations on site (course was always open in 2025; bar staff covered the host role outside dedicated host shifts)',
    'Customer-facing presence — bar / food / party / token spend continues to land with No Dice',
    'Token sales — both bundled inside online tickets and walk-up at the bar till; 100% revenue retained',
  ],
  golfCompanyTakesOver: [
    '100% of till ticket sales (formerly No Dice revenue)',
    'The £-ticket portion of online sales (golf round component)',
    'Golf course cost base — rent, maintenance, upgrades, dedicated host wages',
  ],
}

// === HACKNEY DMN ONLINE TICKETS — 2025 ACTUALS =======================
// Source: Design My Night sales export (Hackney sheet, gid=1525692404)
// Filtered: Venue = "Plonk Golf - Hackney", Event Date in 2025.
//   • Status "complete"  → online portal revenue (£ recorded on sheet)
//   • Status "external"  → in-venue / office sales (sheet records £0;
//                          imputed below at average online unit price
//                          per archetype, identical method to Borough)
//   • Status "rejected"  → excluded
//
// IMPORTANT — TOKEN MODEL (correcting earlier deck copy):
// Tickets are NOT redeemed for tokens at the bar. Some SKUs (e.g.
// "Adult — Golf + 4 Tokens") BUNDLE arcade tokens into the ticket
// price; the customer uses those tokens in the venue's arcade
// machines. Tokens are an arcade add-on inside the SKU, not a £
// redemption mechanic.
//
// GO-FORWARD ECONOMICS (2026+):
// Tokens continue to be sold by No Dice — both bundled inside
// online tickets AND at the bar till — and 100% of token revenue
// stays with No Dice. The operator takes NO share of token value;
// tokens are entirely a No Dice revenue line.

// 2025 Hackney SKUs sold ONLINE (status = complete on the DMN sheet).
// Aggregated by archetype (time-of-day slot suffix stripped). Revenue
// is the actual sum of "Total Item Price" rows. `tokens` is the
// number of arcade tokens bundled per SKU; `rounds` is the number
// of golf rounds. price = average unit price observed in 2025 (some
// SKUs vary across the day — peak / off-peak — so this is the
// blended figure, not a single list price).
export const HACKNEY_DMN_SKUS_ONLINE_2025 = [
  { sku: 'Adult — Golf + 4 Tokens',                 rounds: 1, tokens: 4, price:  8.94, sold: 3429, revenue: 30622.20 },
  { sku: 'Under 18s — Round of Golf',                rounds: 1, tokens: 0, price:  5.43, sold:  472, revenue:  2558.00 },
  { sku: 'Adult — Round of Golf',                    rounds: 1, tokens: 0, price:  5.54, sold:  378, revenue:  2109.00 },
  { sku: 'Pool Table Reservation — 30 Mins',         rounds: 0, tokens: 0, price:  5.00, sold:  383, revenue:  1913.00 },
  { sku: 'Adult — Game & Drink',                     rounds: 1, tokens: 3, price: 10.00, sold:  176, revenue:  1760.00 },
  { sku: 'Under 18s — Golf + 4 Tokens',              rounds: 1, tokens: 4, price:  8.93, sold:  166, revenue:  1477.15 },
  { sku: 'Doubles Pool Tournament Team Entry',       rounds: 0, tokens: 0, price:  9.96, sold:  129, revenue:  1285.00 },
  { sku: 'Plonk Bottomless Brunch',                  rounds: 0, tokens: 0, price: 35.00, sold:   25, revenue:   875.00 },
  { sku: "Add a Jug of Plonker's Punch",             rounds: 0, tokens: 0, price: 25.00, sold:   24, revenue:   600.00 },
  { sku: 'Singles Pool Tournament Entry',            rounds: 0, tokens: 0, price:  5.00, sold:  113, revenue:   565.00 },
  { sku: 'Add a Bucket of Beers',                    rounds: 0, tokens: 0, price: 25.00, sold:   17, revenue:   425.00 },
  { sku: 'Pool Table Reservation — One Hour',        rounds: 0, tokens: 0, price:  5.00, sold:   41, revenue:   205.00 },
  { sku: 'Add a Tray of Shots',                      rounds: 0, tokens: 0, price: 18.00, sold:    9, revenue:   162.00 },
  { sku: 'Add Five Arcade Tokens (add-on)',          rounds: 0, tokens: 5, price:  3.36, sold:   38, revenue:   130.00 },
  { sku: 'Pumpkin Carving',                          rounds: 0, tokens: 0, price:  5.00, sold:   18, revenue:    90.00 },
  { sku: 'Round of Golf (legacy SKU)',               rounds: 1, tokens: 0, price:  6.00, sold:    6, revenue:    36.00 },
]

// 2025 Hackney SKUs sold OFFICE / EXTERNAL (status = external; payment
// at venue till, sheet records £0). Revenue imputed at the average
// online unit price per archetype × quantity sold — same method as
// Borough. Gives a complete picture of total venue volume.
export const HACKNEY_DMN_SKUS_OFFICE_2025 = [
  { sku: 'Adult — Golf + 4 Tokens',                 rounds: 1, tokens: 4, price: 8.94, sold: 1041, revenue:  9310.92 },
  { sku: 'Under 18s — Round of Golf',                rounds: 1, tokens: 0, price: 5.43, sold:  147, revenue:   798.91 },
  { sku: 'Singles Pool Tournament Entry',            rounds: 0, tokens: 0, price: 5.00, sold:   90, revenue:   450.00 },
  { sku: 'Adult — Round of Golf',                    rounds: 1, tokens: 0, price: 5.54, sold:   88, revenue:   487.84 },
  { sku: 'Doubles Pool Tournament Team Entry',       rounds: 0, tokens: 0, price: 9.96, sold:   84, revenue:   836.44 },
  { sku: 'Pool Table Reservation — 30 Mins',         rounds: 0, tokens: 0, price: 5.00, sold:   41, revenue:   205.00 },
  { sku: 'Under 18s — Golf + 4 Tokens',              rounds: 1, tokens: 4, price: 8.93, sold:   37, revenue:   330.36 },
  { sku: 'Plonk Bottomless Brunch',                  rounds: 0, tokens: 0, price:35.00, sold:   16, revenue:   560.00 },
  { sku: 'Adult — Game & Drink',                     rounds: 1, tokens: 3, price:10.00, sold:   11, revenue:   110.00 },
  { sku: 'Pool Table Reservation — One Hour',        rounds: 0, tokens: 0, price: 5.00, sold:    2, revenue:    10.00 },
]

// Per-month split: online (actual portal revenue) vs office (imputed).
export const HACKNEY_DMN_MONTHLY_2025 = [
  { month: 'Jan', onlineQty: 362, onlineRev: 2656.50, officeQty:  14, officeRev:   94.79 },
  { month: 'Feb', onlineQty: 325, onlineRev: 2586.30, officeQty:  94, officeRev:  775.15 },
  { month: 'Mar', onlineQty: 420, onlineRev: 3218.00, officeQty: 144, officeRev: 1036.44 },
  { month: 'Apr', onlineQty: 565, onlineRev: 4618.15, officeQty: 173, officeRev: 1893.40 },
  { month: 'May', onlineQty: 586, onlineRev: 4635.70, officeQty:  74, officeRev:  588.71 },
  { month: 'Jun', onlineQty: 540, onlineRev: 4072.70, officeQty: 132, officeRev: 1017.14 },
  { month: 'Jul', onlineQty: 496, onlineRev: 4543.00, officeQty: 159, officeRev: 1229.56 },
  { month: 'Aug', onlineQty: 623, onlineRev: 5527.90, officeQty:  97, officeRev:  820.24 },
  { month: 'Sep', onlineQty: 417, onlineRev: 3643.40, officeQty: 154, officeRev: 1273.14 },
  { month: 'Oct', onlineQty: 430, onlineRev: 3591.20, officeQty:  93, officeRev:  745.41 },
  { month: 'Nov', onlineQty: 381, onlineRev: 3111.50, officeQty: 127, officeRev:  966.90 },
  { month: 'Dec', onlineQty: 279, onlineRev: 2608.00, officeQty: 306, officeRev: 2658.59 },
]

// Grand totals — online actual revenue + office imputed revenue.
export const HACKNEY_DMN_GRAND_2025 = {
  onlineQty:  5424, onlineRev: 44812.35,                 // status=complete
  officeQty:  1567, officeRev: 13099.48,                 // status=external, imputed
  totalQty:   6991, totalRev:  57911.83,                 // combined Hackney 2025 DMN volume
  // Token analytics — 100% No Dice revenue, no operator share
  tokensOnline:    15098,                                // 4-token SKUs × qty + Add-Five × qty
  tokensOffice:     4385,                                // same calc for external SKUs
  tokensTotal:     19483,                                // bundled into Hackney DMN tickets in 2025
  // The actual £ paid out to arcade-machine operators per token is
  // already booked inside the bar P&L's "Arcades" cost category
  // (COST_CATEGORIES → Arcades, ~£8,202 for 2025). The Weekly Merged
  // 2024-2026 sheet's ARCADES rows (Pinball Geoff + LTF/JP) net to
  // £7,850.19 across 52 weeks of 2025 — small variance to the £8,202
  // P&L figure is normal categorisation rounding. No separate token-
  // settlement line needs to be modelled — this cost is already inside
  // the Variable Costs / Arcades line on the 2025 Performance tab.
  arcadesPaidWeeklyMerged2025: 7850.19,                  // financial truth from Weekly Merged ARCADES rows
}

// === IP & LICENSING — NOT APPLICABLE TO HACKNEY ===
// Plonk Golf IP/licensing model is Borough-specific (the franchise dev area).
// Stubs kept so the cloned Plonk tab can render without import errors —
// every value empty/zero. If Hackney later adopts a Plonk Golf relationship,
// populate these from the equivalent Hackney IP & Licensing workbook.
export const IP_LICENSING_TOKEN_VALUE = 0
export const IP_LICENSING_BOOKING_FEE_PCT = 0
export const IP_LICENSING_PAYMENT_FEE_PCT = 0
export const IP_LICENSING_SKUS_ONLINE_2025 = []
export const IP_LICENSING_SKUS_OFFICE_2025 = []
export const IP_LICENSING_MONTHLY_2025 = []
export const IP_LICENSING_GRAND_2025 = {
  onlineQty: 0, onlineRev: 0,
  officeQty: 0, officeRev: 0,
  totalQty: 0,  totalRev: 0,
}
export const IP_LICENSING_COMMISSION_2025 = {
  onlineTicketCommission: 0,
  source: 'N/A — Plonk Golf model not in scope for Hackney bar-only entity.',
  note: 'TBD: revisit if Hackney adopts a Plonk Golf relationship.',
}
