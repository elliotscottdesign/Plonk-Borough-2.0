import React, { useState, useEffect } from 'react'
import { useNotes } from './NotesContext.jsx'

// Founder-only top banner that surfaces two failure modes the deck
// would otherwise hide:
//   1. hydrateWarning — local cache has more pages than the server
//      response on this mount. Means the backend is empty / wired to
//      the wrong sheet / a redeploy went wrong.
//   2. notesHealth.status === 'empty' — the Notes tab on the server
//      reports 0 rows. New investors can save without losing data,
//      but for an established deck this is almost certainly a wiring
//      problem.
//
// Investors never see this — `isFounder` gates the whole render.
// Both states can be dismissed for the session via `dismissed`, so
// the banner doesn't follow you around once you've acknowledged it.
export default function NotesHealthBanner() {
  const { isFounder, hydrateWarning, notesHealth } = useNotes()
  const [dismissed, setDismissed] = useState(false)
  // Reset dismiss state when a new warning arrives.
  useEffect(() => { setDismissed(false) }, [hydrateWarning?.at, notesHealth?.status])

  if (!isFounder || dismissed) return null

  const issues = []
  if (hydrateWarning) {
    issues.push(`Hydrate guard tripped — server returned ${hydrateWarning.serverPageCount} pages, browser cache holds ${hydrateWarning.localPageCount}. Local copy kept. Check the Notes sheet before doing anything.`)
  }
  if (notesHealth?.status === 'empty') {
    issues.push('Notes backend reports 0 rows. The sheet is empty — likely a redeploy pointing at the wrong workbook. Do NOT let investors save until checked.')
  }
  if (notesHealth?.status === 'error') {
    issues.push(`Notes health check failed: ${notesHealth.error || 'unknown error'}. Backend may be unreachable.`)
  }
  if (issues.length === 0) return null

  return (
    <div style={{
      background:'rgba(248,113,113,0.12)',
      borderBottom:'2px solid #F87171',
      color:'#FCA5A5',
      padding:'10px 20px',
      fontSize:12,
      lineHeight:1.5,
      display:'flex',
      alignItems:'flex-start',
      gap:12,
    }}>
      <div style={{ fontSize:14, lineHeight:1, paddingTop:2 }}>⚠</div>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, color:'#F87171', textTransform:'uppercase', letterSpacing:'0.06em', fontSize:10, marginBottom:4 }}>
          Notes backend warning — founder view only
        </div>
        {issues.map((m, i) => <div key={i} style={{ marginBottom: i === issues.length - 1 ? 0 : 4 }}>{m}</div>)}
        <div style={{ marginTop:6, fontSize:10, color:'#FCA5A5', opacity:0.75 }}>
          Recovery: open the Hackney workbook → File · Version history. The
          NotesHistory tab and Notes_Backup_YYYY-MM-DD snapshots also keep
          recoverable copies of every save.
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background:'transparent', border:'1px solid rgba(248,113,113,0.4)',
          color:'#FCA5A5', padding:'4px 10px', borderRadius:4,
          fontSize:10, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.08em',
          alignSelf:'flex-start', flexShrink:0,
        }}
      >Dismiss</button>
    </div>
  )
}
