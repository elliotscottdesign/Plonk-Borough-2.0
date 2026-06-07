import React from 'react'
import WorldCupPage from '../../worldcup/WorldCupPage.jsx'

// ─── Ops · World Cup ────────────────────────────────────────────────
// Wraps the founder-only World Cup 2026 planning sheet so it lives
// inside the Operations hub instead of behind its own /worldcup URL.
// (The /worldcup + /world-cup routes were colliding with the new
// customer-facing site in the nodice.bar repo, so the standalone
// routes here were removed — see App.jsx.)
//
// `embedded` tells WorldCupPage to drop its standalone-page chrome
// (full-screen background, "World Cup 2026" wordmark header, "back to
// nodice.bar" link) so it sits flush inside the OpsApp shell, which
// already supplies its own header and outer padding.
export default function WorldCup() {
  return <WorldCupPage embedded />
}
