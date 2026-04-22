import React from 'react'
import { IP_LICENSING_GRAND_2025, IP_LICENSING_PAYMENT_FEE_PCT } from '../data.js'

const fmt0 = n => '£' + Math.round(n).toLocaleString()
const fmt2 = n => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// --- Savings breakdown: annualised cost lines that move from venue P&L to Plonk Golf under the franchise ---
const onlinePaymentFee = IP_LICENSING_GRAND_2025.onlineRev * IP_LICENSING_PAYMENT_FEE_PCT // 1.5% of actual 2025 online
const HOSTING_LITHOS = 3492                     // £291/mth — Lithos website maintenance
const BOOKINGS_MGR_WEEKLY = 660                 // £660/wk gross wages
const BOOKINGS_MGR_ANNUAL = BOOKINGS_MGR_WEEKLY * 52
const SEO_LITHOS = 10464                         // £872/mth — Lithos SEO + outreach
const IP_ONE_OFF_SAVING = 50000                  // £50k + VAT — compared to the previous £72k IP & Goodwill purchase

const ANNUAL_SAVINGS = [
  {
    label: 'Online payment fees',
    annual: onlinePaymentFee,
    detail: '1.5% of online ticket gross — Plonk Golf absorbs this via its Stripe account.',
    basis: `£${IP_LICENSING_GRAND_2025.onlineRev.toLocaleString('en-GB',{minimumFractionDigits:2})} 2025 online × 1.5%`,
    accent: '#4FC3F7',
  },
  {
    label: 'Web hosting (Lithos)',
    annual: HOSTING_LITHOS,
    detail: 'Plonk Golf runs the website and booking system — venue no longer needs its own Lithos plan.',
    basis: '£291 / month × 12',
    accent: '#2DD4BF',
  },
  {
    label: 'Bookings manager wage',
    annual: BOOKINGS_MGR_ANNUAL,
    detail: 'Online chatbot + AI booking replace the office bookings role. Group bookings 12+ are handled by venue management directly.',
    basis: '£660 / week × 52',
    accent: '#C9A84C',
  },
  {
    label: 'SEO management',
    annual: SEO_LITHOS,
    detail: 'Plonk Golf runs a non-venue-specific SEO programme at its own cost. No venue-level SEO retainer required.',
    basis: '£872 / month × 12',
    accent: '#E67E22',
  },
]

const totalAnnual = ANNUAL_SAVINGS.reduce((s, r) => s + r.annual, 0)

// --- Commercial offer (moved from Plonk Cover) ---
const OFFERS = [
  {
    label: 'Franchise Commission',
    body: 'A % on golf ticket sales routed through the Plonk online booking system — and, optionally, on office-handled bookings if Plonk Golf provides a bookings manager. Pool tables, private events and group bookings 12+ remain venue-managed.',
    accent: '#4FC3F7',
    pill: 'Recurring',
  },
  {
    label: 'Hardware Purchase Fee',
    body: 'One-off fee for the Plonk course and equipment — built bespoke for the venue, delivered and installed. Hardware is bought outright by the venue.',
    accent: '#C9A84C',
    pill: 'One-off',
  },
  {
    label: 'Maintenance Plan (optional)',
    body: '£400 / month for London-based venues — includes one on-site day per month. Plan holders also unlock discounts on all new hardware and equipment orders.',
    accent: '#2DD4BF',
    pill: '£400 / mo',
  },
]

const WARRANTY_TERMS = [
  { label: 'Warranty', value: 'Valid only while a Maintenance Plan is active. No maintenance plan = no warranty cover.', tone: 'warn' },
  { label: 'Maintenance visit', value: '1 on-site day per month · London venues · £400 / month', tone: 'ok' },
  { label: 'Hardware discounts', value: 'Plan holders get discounted rates on all new hardware and equipment.', tone: 'ok' },
  { label: 'Vandalism', value: 'Not covered under warranty or maintenance plan — venue\'s responsibility.', tone: 'warn' },
]

export default function PlonkHowItWorks() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Hero */}
      <div>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>
          How It Works · Plonk Golf × No Dice Borough
        </div>
        <h1 className="serif" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', lineHeight: 1.05, color: 'var(--cream)', marginBottom: 14 }}>
          What the franchise saves the venue
        </h1>
        <p style={{ fontSize: 15, color: 'var(--cream-dim)', lineHeight: 1.6, maxWidth: 780 }}>
          Under the franchise model with No Dice Borough, Plonk Golf takes on the digital funnel, payment processing, group bookings, hosting, and SEO for all crazy golf tickets. All money goes directly into the franchisee account, with Plonk taking a direct debit post payment for their commission. A small one-off fee is paid upfront for use of the name.
        </p>
        <div style={{ height: 1, background: 'linear-gradient(90deg, var(--gold), transparent)', marginTop: 22 }} />
      </div>

      {/* Headline savings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <HeadlineStat label="Annual savings" value={fmt0(totalAnnual)} sub="Recurring per year" accent="#2DD4BF" />
        <HeadlineStat label="One-off IP saving" value="£50,000 + VAT" sub="vs. the previous £72,000 IP &amp; Goodwill purchase under the old deal" accent="#C9A84C" />
        <HeadlineStat label="Year 1 total saving" value={fmt0(totalAnnual + IP_ONE_OFF_SAVING) + '+'} sub="Annual + one-off (ex VAT on the IP line)" accent="var(--gold)" />
      </div>

      {/* Line-by-line savings */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
          What comes off the venue P&amp;L
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ANNUAL_SAVINGS.map(item => (
            <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 160px', gap: 20, background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${item.accent}`, borderRadius: 8, padding: '14px 20px', alignItems: 'center' }}>
              <div>
                <div className="serif" style={{ fontSize: 22, color: item.accent, lineHeight: 1 }}>{fmt0(item.annual)}</div>
                <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>per year</div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.55 }}>{item.detail}</div>
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', textAlign: 'right', fontStyle: 'italic' }}>{item.basis}</div>
            </div>
          ))}

          {/* One-off IP purchase line */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 160px', gap: 20, background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.35)', borderLeft: '3px solid var(--gold)', borderRadius: 8, padding: '14px 20px', alignItems: 'center' }}>
            <div>
              <div className="serif" style={{ fontSize: 22, color: 'var(--gold)', lineHeight: 1 }}>£50,000</div>
              <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>one-off + VAT</div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>IP purchase — replaced with IP License Fee</div>
              <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.55 }}>
                Original deal included £72,000 Plonk IP &amp; Goodwill. Under the franchise model the venue licenses the IP for a fraction of that upfront, saving ~£50,000 + VAT on the initial capital stack.
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', textAlign: 'right', fontStyle: 'italic' }}>vs. old Use of Funds</div>
          </div>
        </div>
      </div>

      {/* What the venue gives back */}
      <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, padding: '18px 22px' }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
          What the venue gives back in return
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.65 }}>
          Plonk Golf earns its income from a <strong style={{ color: 'var(--gold)' }}>commission % on golf ticket sales</strong> routed through the online booking system, plus a customer-paid <strong style={{ color: 'var(--gold)' }}>10% booking fee</strong> added at checkout. Pool, events, bar, private hire and group bookings 12+ stay with the venue 100%. Net benefit depends on commission rate and ticket volume — see the IP &amp; Licensing tab to model it.
        </div>
      </div>

      {/* Divider before moved section */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', margin: '8px 0' }} />

      {/* --- Moved from Plonk Cover: The New Model commercial levers --- */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
          The New Model · 2026 &amp; On
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginBottom: 16, maxWidth: 720, lineHeight: 1.6 }}>
          Plonk Golf licenses the IP, sells the hardware, and runs the digital funnel. Venues run the day-to-day. Three commercial levers:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {OFFERS.map(o => (
            <div key={o.label} style={{ background: 'var(--ink-2)', border: `1px solid ${o.accent}40`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, color: o.accent, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{o.label}</div>
                <div style={{ fontSize: 10, color: o.accent, border: `1px solid ${o.accent}60`, borderRadius: 20, padding: '2px 10px', letterSpacing: '0.05em' }}>{o.pill}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.6 }}>{o.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Moved from Plonk Cover: Maintenance & Warranty terms --- */}
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
          Maintenance &amp; Warranty Terms
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {WARRANTY_TERMS.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: t.tone === 'warn' ? 'rgba(239,68,68,0.06)' : 'rgba(45,212,191,0.06)', border: `1px solid ${t.tone === 'warn' ? 'rgba(239,68,68,0.25)' : 'rgba(45,212,191,0.25)'}`, borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: t.tone === 'warn' ? '#EF4444' : '#2DD4BF', flexShrink: 0, width: 22, textAlign: 'center' }}>{t.tone === 'warn' ? '!' : '✓'}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cream)', marginBottom: 3 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.5 }}>{t.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeadlineStat({ label, value, sub, accent }) {
  return (
    <div style={{ background: 'var(--ink-2)', border: `1px solid ${accent === 'var(--gold)' ? 'rgba(201,168,76,0.4)' : accent + '40'}`, borderRadius: 10, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div className="serif" style={{ fontSize: 32, color: 'var(--cream)', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  )
}
