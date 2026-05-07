import React from 'react'
import {
  IP_LICENSING_GRAND_2025,
  IP_LICENSING_VENUE_SAVINGS,
  IP_LICENSING_VENUE_SAVINGS_ANNUAL,
} from '../data.js'

const fmt0 = n => '£' + Math.round(n).toLocaleString()
const fmt2 = n => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Savings figures live in data.js (IP_LICENSING_VENUE_SAVINGS) so the
// 2026 Performance "Savings vs old model" callout and this How-it-works
// breakdown stay in lockstep.

const ANNUAL_SAVINGS = [
  {
    label: 'Online payment fees',
    annual: IP_LICENSING_VENUE_SAVINGS.onlinePaymentFees,
    detail: '1.5% of online ticket gross — Plonk Golf absorbs this via its Stripe account.',
    basis: `£${IP_LICENSING_GRAND_2025.onlineRev.toLocaleString('en-GB',{minimumFractionDigits:2})} 2025 online × 1.5%`,
    accent: '#4FC3F7',
  },
  {
    label: 'Web hosting (Lithos)',
    annual: IP_LICENSING_VENUE_SAVINGS.webHostingLithos,
    detail: 'Plonk Golf runs the website and booking system — venue no longer needs its own Lithos plan.',
    basis: '£291 / month × 12',
    accent: '#2DD4BF',
  },
  {
    label: 'Bookings manager wage',
    annual: IP_LICENSING_VENUE_SAVINGS.bookingsManagerAnnual,
    detail: 'Online chatbot + AI booking replace the office bookings role. Group bookings 12+ are handled by venue management directly.',
    basis: '£660 / week × 52',
    accent: '#C9A84C',
  },
  {
    label: 'SEO management',
    annual: IP_LICENSING_VENUE_SAVINGS.seoLithos,
    detail: 'Plonk Golf runs a non-venue-specific SEO programme at its own cost. No venue-level SEO retainer required.',
    basis: '£872 / month × 12',
    accent: '#E67E22',
  },
]

const totalAnnual = IP_LICENSING_VENUE_SAVINGS_ANNUAL

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
          Under the franchise model with No Dice Borough, Plonk Golf takes on the digital funnel, payment processing, group bookings, web hosting, and SEO for all crazy golf tickets. All money goes directly into the franchisee account, with Plonk taking a direct debit post payment for their commission. A small one-off fee is paid upfront for use of the name. All over-the-counter golf ticket sales go directly to the franchisee with no commission taken.
        </p>
        <div style={{ height: 1, background: 'linear-gradient(90deg, var(--gold), transparent)', marginTop: 22 }} />
      </div>

      {/* Headline savings */}
      <div>
        <HeadlineStat label="Annual savings" value={fmt0(totalAnnual)} sub="Recurring per year" accent="#2DD4BF" />
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
