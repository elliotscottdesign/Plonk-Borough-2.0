import React from 'react'
import WorldCupPage from '../../worldcup/WorldCupPage.jsx'

// ─── Ops · World Cup ────────────────────────────────────────────────
// Wraps the founder-only World Cup 2026 planning sheet so it lives
// inside the Operations hub instead of behind its own /worldcup URL.
// (The /worldcup + /world-cup routes were colliding with the new
// customer-facing site in the nodice.bar repo, so the standalone
// routes here were removed — see App.jsx.)
//
// We render WorldCupPage exactly as it was. It carries its own header
// chrome ("World Cup 2026 · No Dice London Fields") which now reads
// as a section banner. The component is fully self-contained — no
// shared state with the investor deck.
export default function WorldCup() {
  return (
    <div style={{ margin: '-28px -24px -64px' }}>
      {/* Cancel the OpsApp body padding so WorldCupPage can use its
          own full-bleed gold-bordered header without a gutter. */}
      <WorldCupPage />
    </div>
  )
}
