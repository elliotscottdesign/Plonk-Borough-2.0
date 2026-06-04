import React from 'react'

// Year-specific copy for the shared <TillSalesByCategory /> view.
// Kept out of the data files (which stay pure JSON-ish) and out of the
// component (which stays year-agnostic).

function InfoBox({ children }) {
  return (
    <div style={{ padding: '14px 18px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 18, lineHeight: '18px', color: '#FBBF24' }}>ⓘ</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FCD34D', marginBottom: 4 }}>
          These are till figures, not financial figures
        </div>
        <div style={{ fontSize: 13, color: '#FDE68A', lineHeight: 1.55 }}>{children}</div>
      </div>
    </div>
  )
}

function CalloutBox({ tone = 'amber', title, children }) {
  const c = tone === 'red'
    ? { bg: 'rgba(239,68,68,0.08)', bd: 'rgba(239,68,68,0.35)', icon: '#F87171', head: '#FCA5A5', body: '#FECACA' }
    : { bg: 'rgba(34,211,238,0.06)', bd: 'rgba(34,211,238,0.3)', icon: '#22D3EE', head: '#67E8F9', body: '#A5F3FC' }
  return (
    <div style={{ padding: '14px 18px', background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 6, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 18, lineHeight: '18px', color: c.icon }}>{tone === 'red' ? '⚠' : 'ⓘ'}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.head, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: c.body, lineHeight: 1.55 }}>{children}</div>
      </div>
    </div>
  )
}

export const META_2025 = {
  title: 'Borough 2025 · Till Sales by Category',
  subtitle: 'No Dice Borough · Borough Market SE1 · Goodtill (3 Jan–14 Sep) + Lightspeed (16 Sep–31 Dec) 2025',
  kpiSub: 'Jan → Dec 2025 · inc-VAT',
  coverageValue: 'Full year',
  coverageSub: 'Goodtill + Lightspeed',
  coverageColor: '#34D399',
  infoBox: (
    <InfoBox>
      Numbers below are gross customer payments through the till (inclusive of VAT, after
      discounts / comps at the till, before any subsequent refund / accounting restatement).
      They are useful for understanding <strong>what we sold</strong> and <strong>category mix</strong> —
      they are <strong>not</strong> the canonical revenue figure. For audited / P&amp;L revenue
      see the <strong>2025 Performance</strong> tab, which is sourced from the Weekly Merge
      2024–2026 sheet. Expect the till total here to read higher than the Weekly Merge figure
      (VAT layer, restatements, refunds, golf-line split).
    </InfoBox>
  ),
  calloutBox: (
    <CalloutBox tone="amber" title="Backfilled — Goodtill → Lightspeed migration, mid-Sep 2025">
      Jan → 14 Sep is the original Goodtill export (£263,588). From 16 Sep the venue moved to
      Lightspeed, and 16 Sep → 31 Dec (£126,891) is now backfilled from that export — so the
      year is complete bar a single missing day, <strong>15 Sep</strong> (the migration cut-over).
      September combines both tills. For the Lightspeed period, categories are derived from the
      till's SKU product-type codes mapped onto the original Goodtill category scheme, so the
      whole year reads on one taxonomy (spirit / cocktail sub-splits in that period are
      best-effort).
    </CalloutBox>
  ),
  footnote: (
    <div style={{ fontSize: 10, color: '#6B7280', lineHeight: 1.6 }}>
      Source · Goodtill export (Jan–14 Sep, cleaned, 32,156 rows) + Lightspeed export
      (16 Sep–31 Dec, plonkgolfltd · London Bridge). Single venue — Borough Market SE1 only.
    </div>
  ),
}

export const META_2026 = {
  title: 'Borough 2026 · Till Sales by Category',
  subtitle: 'No Dice Borough · Borough Market SE1 · Lightspeed till data · 1 Jan → 10 Mar 2026',
  kpiSub: 'Jan → 10 Mar 2026 · inc-VAT',
  coverageValue: 'Lightspeed',
  coverageSub: 'March partial (to 10th)',
  coverageColor: '#F87171',
  infoBox: (
    <InfoBox>
      Numbers below are net customer payments through the till (inclusive of VAT, after
      discounts / comps / voids / corrections). They show <strong>what we sold</strong> and
      <strong> category mix</strong> — not the canonical P&amp;L revenue figure. Categories use
      the same SKU product-type mapping as the 2025 Lightspeed period, so 2026 reads
      like-for-like against the back half of 2025.
    </InfoBox>
  ),
  calloutBox: (
    <CalloutBox tone="red" title="2026 is in progress · March is partial">
      This dataset runs to <strong>10 March 2026</strong> only — the March bar reflects the
      first ten days, so it reads low. Jan and Feb are complete months. Figures update as
      later Lightspeed exports land.
    </CalloutBox>
  ),
  footnote: (
    <div style={{ fontSize: 10, color: '#6B7280', lineHeight: 1.6 }}>
      Source · Lightspeed export (plonkgolfltd · London Bridge),
      transactions 1 Jan → 10 Mar 2026. Single venue — Borough Market SE1 only.
    </div>
  ),
}
