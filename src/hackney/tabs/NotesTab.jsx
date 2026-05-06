import React, { useMemo } from 'react'
import { useNotes } from '../components/NotesContext.jsx'
import { getAccessCode } from '../../lib/access-code.js'
import { NOTES_SYNC_URL } from '../../data/hackney.js'

// ─── NotesTab (Hackney) ───────────────────────────────────────────────
// Master collated view sitting after Workbook on the Hackney header.
// Same layout as the Borough tab, but reads the Hackney notes context
// (separate localStorage namespace + separate Notes sheet on the
// Hackney workbook).
//
// Behaviour by role:
//   • Investors / observers: see THEIR own Hackney notes only — every
//     page they've left a note on, in chronological order.
//   • Founder: also sees a per-user breakdown of every visitor's notes,
//     populated via GET ?all=1 on mount + a Refresh button.

function fmtTs(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' })
  } catch { return String(iso) }
}

function NotesList({ notesBlob, emptyHint }) {
  const entries = useMemo(() => {
    const byPage = notesBlob?.byPage || {}
    return Object.entries(byPage)
      .map(([id, v]) => ({ id, label: v?.label || id, text: v?.text || '', updatedAt: v?.updatedAt || '' }))
      .filter(e => e.text.trim().length > 0)
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  }, [notesBlob])

  if (entries.length === 0) {
    return (
      <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6, padding:'12px 0' }}>
        {emptyHint || 'No notes yet.'}
      </div>
    )
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {entries.map(e => (
        <div key={e.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'12px 14px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12, marginBottom:6 }}>
            <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:600 }}>{e.label}</div>
            <div style={{ fontSize:10, color:'var(--cream-dim)' }}>{fmtTs(e.updatedAt)}</div>
          </div>
          <div style={{ fontSize:13, color:'var(--cream)', whiteSpace:'pre-wrap', lineHeight:1.55 }}>{e.text}</div>
        </div>
      ))}
    </div>
  )
}

export default function NotesTab() {
  const { notes, isFounder, allRows, refreshAllRows, isLoadingAll } = useNotes()
  const code = getAccessCode()

  const founderRows = useMemo(() => {
    if (!isFounder) return []
    return (allRows || []).filter(r => {
      const byPage = r?.notes?.byPage || {}
      return Object.values(byPage).some(v => (v?.text || '').trim().length > 0)
    }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  }, [isFounder, allRows])

  return (
    <div style={{ minHeight:'100%', background:'var(--ink)', color:'var(--cream)', padding:'28px 32px 32px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>Main Notes · Hackney</div>
          <h2 className="serif" style={{ fontSize:28, color:'var(--cream)', margin:0, lineHeight:1.2 }}>Everything you've written, in one place</h2>
          <p style={{ fontSize:13, color:'var(--cream-dim)', maxWidth:760, lineHeight:1.6, marginTop:8 }}>
            Click <strong style={{ color:'var(--cream)' }}>Page Notes</strong> in the header on any page to leave a note for that slide. Everything you type is saved against your access code <strong style={{ color:'var(--cream)' }}>{code || '—'}</strong> and shown here.{NOTES_SYNC_URL ? ' Notes also sync across your devices and the founder gets an email when you save a note.' : ''}
          </p>
        </div>

        {/* Current user's notes */}
        <div style={{ background:'var(--ink-2)', border:'1px solid rgba(201,168,76,0.18)', borderRadius:12, padding:'18px 20px', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Your notes · {code || '—'}</div>
          </div>
          <NotesList
            notesBlob={notes}
            emptyHint="No notes yet. Open any page, click Page Notes in the header, and type — your text appears here automatically."
          />
        </div>

        {/* Founder cross-user view */}
        {isFounder && (
          <div style={{ background:'var(--ink-2)', border:'1px solid rgba(192,132,252,0.25)', borderRadius:12, padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, marginBottom:10, flexWrap:'wrap' }}>
              <div style={{ fontSize:11, color:'#C084FC', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>All visitor notes · founder view</div>
              <button
                onClick={refreshAllRows}
                disabled={isLoadingAll}
                style={{
                  padding:'5px 12px', fontSize:11, fontWeight:600, borderRadius:6,
                  border:'1px solid rgba(192,132,252,0.4)', background:'transparent',
                  color:'#C084FC', cursor: isLoadingAll ? 'wait' : 'pointer',
                  letterSpacing:'0.06em', textTransform:'uppercase',
                }}
              >{isLoadingAll ? 'Refreshing…' : '↻ Refresh'}</button>
            </div>
            {!NOTES_SYNC_URL && (
              <div style={{ fontSize:12, color:'#FBBF24', lineHeight:1.6, padding:'10px 12px', background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.25)', borderRadius:6, marginBottom:14 }}>
                Cross-user notes need NOTES_SYNC_URL configured (see infra/notes-apps-script-hackney.gs). Until then this view shows local-only data.
              </div>
            )}
            {founderRows.length === 0 ? (
              <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6, padding:'12px 0' }}>
                No notes from any visitor yet.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                {founderRows.map(r => (
                  <div key={r.code}>
                    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ fontSize:13, color:'var(--cream)', fontWeight:600 }}>{r.code}</div>
                      <div style={{ fontSize:10, color:'var(--cream-dim)' }}>updated {fmtTs(r.updatedAt)}</div>
                    </div>
                    <NotesList notesBlob={r.notes} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
