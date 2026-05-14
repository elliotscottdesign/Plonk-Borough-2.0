import React, { useState } from 'react'
import { DEAL } from '../../data/hackney.js'

// LoanNotes — investor loan-note tab for the Hackney deck.
//
// A parallel short-term debt offering alongside the £30k equity round:
//   • Principal: £1,000 → £10,000 in £100 steps
//   • Term:       6 → 12 months in 1-month steps
//   • Interest:   20% APR flat
//     → 6 mo  = 10% return on principal
//     → 12 mo = 20% return on principal
//     → Linear in between (rate = months / 12 × 20%)
//   • Convertible: principal + accrued interest can be elected as a
//     PRIORITY SEAT at the next equity round (Round 2). Priority seat =
//     reserved allocation at the Round 2 valuation, no need to compete
//     with new investors for the slice.
//
// Capital at risk. Not regulated by the FCA. Repayment funded out of
// trading cash flow; if the venue underperforms, repayment may be
// delayed or the loan rolled.

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const fmtPct = (n) => (n * 100).toFixed(1) + '%'

const LOAN_RANGE = { min: 1000,  max: 10000, step: 100 }
const TERM_RANGE = { min: 6,     max: 12,    step: 1   }

// Flat 20% APR — pro-rata to the chosen term in months.
function rateForMonths(months) {
  return (months / 12) * 0.20
}

// Tone palette (matches the rest of the deck)
const INK_BG   = 'var(--ink-2)'
const BORDER   = '1px solid rgba(201,168,76,0.18)'
const GOLD     = 'var(--gold)'
const CREAM    = 'var(--cream)'
const CREAM_D  = 'var(--cream-dim)'

export default function LoanNotes() {
  const [amount, setAmount]   = useState(5000)
  const [months, setMonths]   = useState(6)

  const rate     = rateForMonths(months)
  const interest = amount * rate
  const total    = amount + interest
  const annualAPR = 0.20

  // Pretend-conversion at the current Round 1 post-money valuation, just
  // so investors get a feel for what their slice would look like if the
  // priority seat is exercised at the same valuation. The deck makes it
  // clear the actual Round 2 valuation is TBD.
  const round1Post  = DEAL.postMoney || 100000
  const equityAtR1  = total / round1Post

  return (
    <div style={{ padding: '32px 48px', maxWidth: 1180, margin: '0 auto', color: CREAM }}>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          Investor Loan Notes · short-term convertible debt
        </div>
        <h1 className="serif" style={{ fontSize: 'clamp(2.2rem, 4.4vw, 3.2rem)', color: CREAM, lineHeight: 1.15, margin: 0 }}>
          Lend £1k–£10k. Get up to 20% back. Convert to equity at Round 2.
        </h1>
        <p style={{ fontSize: 15, color: CREAM_D, marginTop: 10, lineHeight: 1.6, maxWidth: 880 }}>
          A short-term debt offering that sits alongside the £30k equity round. You loan the bar between £1,000 and £10,000 over a 6-to-12-month term. Interest scales linearly from <strong style={{ color: CREAM }}>10% at 6 months</strong> to <strong style={{ color: CREAM }}>20% at 12 months</strong> (a flat 20% APR). At maturity you can take repayment in cash — or elect a <strong style={{ color: GOLD }}>priority seat</strong> at the Round 2 equity raise and convert principal + interest into shares with no waiting list.
        </p>
      </div>

      {/* Capital at Risk banner — front and centre */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 18px',
        background: 'rgba(248,113,113,0.10)',
        border: '1px solid rgba(248,113,113,0.45)',
        borderLeft: '4px solid #F87171',
        borderRadius: 8,
        marginBottom: 28,
      }}>
        <div style={{ fontSize: 22, lineHeight: 1, color: '#F87171', paddingTop: 2 }}>⚠</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#FCA5A5', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Capital at risk
          </div>
          <div style={{ fontSize: 13, color: '#FECACA', lineHeight: 1.6 }}>
            These loan notes are not regulated by the FCA. Repayment depends on the bar's trading cash flow — if revenue underperforms we may need to delay repayment or roll the loan into the next term. The Round 2 conversion option is exercisable but not guaranteed to be at a favourable valuation. Lend only what you can afford to lose. Subject to contract.
          </div>
        </div>
      </div>

      {/* Two-column: sliders left, calculator right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

        {/* ─── Sliders card ─── */}
        <div style={{ background: INK_BG, border: BORDER, borderRadius: 14, padding: '22px 24px' }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
            Configure your loan
          </div>

          {/* Loan amount slider */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: CREAM_D, letterSpacing: '0.04em' }}>Loan amount</span>
              <span className="serif" style={{ fontSize: 24, color: GOLD, fontWeight: 600 }}>{fmt(amount)}</span>
            </div>
            <input
              type="range"
              min={LOAN_RANGE.min}
              max={LOAN_RANGE.max}
              step={LOAN_RANGE.step}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#C9A84C', height: 6 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: CREAM_D, marginTop: 4 }}>
              <span>{fmt(LOAN_RANGE.min)}</span>
              <span>{fmt(LOAN_RANGE.max)}</span>
            </div>
          </div>

          {/* Term slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: CREAM_D, letterSpacing: '0.04em' }}>Term</span>
              <span className="serif" style={{ fontSize: 24, color: GOLD, fontWeight: 600 }}>{months} months</span>
            </div>
            <input
              type="range"
              min={TERM_RANGE.min}
              max={TERM_RANGE.max}
              step={TERM_RANGE.step}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#A78BFA', height: 6 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: CREAM_D, marginTop: 4 }}>
              <span>6 mo · 10%</span>
              <span>12 mo · 20%</span>
            </div>
          </div>

          {/* Rate explainer */}
          <div style={{ marginTop: 22, padding: '12px 14px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: '#C4B5FD', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
              How the rate works
            </div>
            <div style={{ fontSize: 12, color: CREAM_D, lineHeight: 1.55 }}>
              Flat 20% APR pro-rata to the term you choose. 6 months = 10%, 12 months = 20%, every month in between scales linearly (~1.67% per month). You always earn the same effective annual rate; the term just decides how long your money stays out.
            </div>
          </div>
        </div>

        {/* ─── Calculator card ─── */}
        <div style={{ background: INK_BG, border: BORDER, borderRadius: 14, padding: '22px 24px' }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>
            What you get back
          </div>

          <Row label="Loan amount"      value={fmt(amount)} />
          <Row label="Term"             value={`${months} months`} />
          <Row label="Interest rate"    value={fmtPct(rate)} gold />
          <Row label="Equivalent APR"   value={fmtPct(annualAPR)} />
          <Row label="Interest earned"  value={fmt(interest)} />

          <div style={{ marginTop: 18, padding: '16px 18px', background: 'linear-gradient(135deg, rgba(16,185,129,0.10), rgba(52,211,153,0.05))', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 10 }}>
            <div style={{ fontSize: 10, color: '#34D399', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
              Total repayment at maturity
            </div>
            <div className="serif" style={{ fontSize: 32, color: '#10B981', fontWeight: 600, lineHeight: 1, marginTop: 4 }}>
              {fmt(total)}
            </div>
            <div style={{ fontSize: 12, color: '#86EFAC', marginTop: 6 }}>
              {fmt(amount)} principal + {fmt(interest)} interest, paid in one settlement at month {months}.
            </div>
          </div>
        </div>
      </div>

      {/* Conversion explainer */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201,168,76,0.10), rgba(167,139,250,0.07))',
        border: '1px solid rgba(201,168,76,0.32)',
        borderRadius: 14,
        padding: '22px 26px',
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
          Or convert to equity · Round 2 priority seat
        </div>
        <div className="serif" style={{ fontSize: 22, color: CREAM, lineHeight: 1.25, marginBottom: 14 }}>
          Skip the cash repayment. Convert {fmt(total)} into shares at the next round, ahead of new investors.
        </div>
        <div style={{ fontSize: 13, color: CREAM_D, lineHeight: 1.65, marginBottom: 16 }}>
          At maturity you can elect to convert <strong style={{ color: CREAM }}>principal + accrued interest</strong> into ordinary shares at the Round 2 valuation. A <strong style={{ color: GOLD }}>priority seat</strong> means your slice is reserved — you don't have to compete with new Round 2 investors for allocation. Conversion is at your election; if you prefer cash, you take cash.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <MiniCard label="Eligible to convert"      value={fmt(total)}              note="principal + interest" />
          <MiniCard label="Round 1 reference"         value={fmt(round1Post)}        note={`${fmtPct(equityAtR1)} equity at today's valuation`} />
          <MiniCard label="Round 2 valuation"         value="TBD"                    note="set at the next raise — priority seat reserved regardless" />
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: CREAM_D, fontStyle: 'italic', lineHeight: 1.55 }}>
          Reference equity is shown at today's £{(round1Post/1000).toFixed(0)}k post-money valuation only as a benchmark. The Round 2 valuation may be higher or lower depending on trading performance and the deal structure. The priority-seat reservation does NOT lock in a specific Round 2 price.
        </div>
      </div>

      {/* Headline highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <Highlight title="Short tenor" body="6–12 months. Fast turnaround on your capital — far shorter than the 5-year equity hold." />
        <Highlight title="Flat 20% APR" body="Same effective rate at every term. No early-exit penalties; longer term just means more interest." />
        <Highlight title="Optional equity path" body="At maturity, convert your loan + interest into Round 2 shares with a reserved priority slot. Best of both worlds." />
      </div>

      {/* Caveats */}
      <div style={{ background: INK_BG, border: BORDER, borderRadius: 10, padding: '16px 20px' }}>
        <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          Terms &amp; conditions
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: CREAM_D, lineHeight: 1.75 }}>
          <li>Loan-note minimum £1,000, maximum £10,000 per individual investor. Multiple notes per investor are permitted.</li>
          <li>Interest accrues from the date of advance and is paid in a single settlement at the end of the term (no monthly coupon).</li>
          <li>Term is fixed at issue — there is no early-redemption right and no early-repayment penalty.</li>
          <li>The conversion election (cash repayment vs. Round 2 priority seat) is made by the investor at least 14 days before maturity.</li>
          <li>Repayment is funded from trading cash flow. In the event the venue underperforms, repayment may be delayed by up to 3 months at the founder's discretion; interest continues to accrue at the same rate during any delay.</li>
          <li>Loan notes rank behind any secured creditor (e.g. landlord deposit) and ahead of equity holders in a winding-up scenario, but with no claim against the founder personally.</li>
          <li>These notes are not regulated by the FCA. Subject to contract — full T&amp;Cs supplied in the subscription pack.</li>
        </ul>
      </div>

      <div style={{ marginTop: 18, fontSize: 11, color: 'var(--cream-dim)', textAlign: 'center', opacity: 0.7 }}>
        Subject to contract · Capital at risk · Not regulated by the FCA
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────
function Row({ label, value, gold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14, gap: 12 }}>
      <span style={{ color: CREAM_D }}>{label}</span>
      <span style={{ color: gold ? GOLD : CREAM, fontWeight: gold ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

function MiniCard({ label, value, note }) {
  return (
    <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
      <div style={{ fontSize: 10, color: CREAM_D, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div className="serif" style={{ fontSize: 20, color: CREAM, fontWeight: 600, lineHeight: 1.15, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: CREAM_D, lineHeight: 1.4 }}>{note}</div>
    </div>
  )
}

function Highlight({ title, body }) {
  return (
    <div style={{ padding: '16px 18px', background: INK_BG, border: BORDER, borderRadius: 10 }}>
      <div className="serif" style={{ fontSize: 16, color: GOLD, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: CREAM_D, lineHeight: 1.6 }}>{body}</div>
    </div>
  )
}
