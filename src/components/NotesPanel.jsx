import React, { useEffect, useRef } from 'react'
import { useNotes } from './NotesContext.jsx'
import { getAccessCode } from '../lib/access-code.js'
import { NOTES_SYNC_URL } from '../data.js'

// ─── NotesPanel ───────────────────────────────────────────────────────
// Slide-out side panel anchored to the right edge of the deck. Opens
// when the user clicks the Notes button in the header; closes via the
// × in its own header, an outside click, or Escape. The textarea binds
// to the active page's note (NotesContext.activePage). Every keystroke
// auto-saves locally and queues a debounced server POST that triggers
// the founder email.

export default function NotesPanel() {
  const {
    isOpen, close,
    activePage, notes, setNoteForPage, deleteNoteForPage,
    saveState, lastSavedAt, refreshOwnNotes,
  } = useNotes()

  const code = getAccessCode()
  const pageId = activePage?.id || null
  const pageLabel = activePage?.label || 'Current page'
  const pageEntry = pageId ? notes.byPage?.[pageId] : null
  const currentNote = pageEntry?.text || ''
  const founderReply = pageEntry?.founderReply
  const reviewed = pageEntry?.reviewed

  const handleDelete = () => {
    if (!pageId) return
    if (window.confirm(`Delete your note on "${pageLabel}"? This cannot be undone.`)) {
      deleteNoteForPage(pageId)
    }
  }

  const textareaRef = useRef(null)

  // Auto-focus textarea on open so the user can start typing immediately.
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      const t = setTimeout(() => textareaRef.current?.focus(), 220)
      return () => clearTimeout(t)
    }
  }, [isOpen, pageId])

  // Escape closes the panel.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  const formatSaveLabel = () => {
    if (saveState === 'saving') return 'Saving…'
    if (saveState === 'error') return 'Save failed — kept locally'
    if (lastSavedAt) {
      try {
        const t = new Date(lastSavedAt)
        const hh = String(t.getHours()).padStart(2, '0')
        const mm = String(t.getMinutes()).padStart(2, '0')
        return `Saved · ${hh}:${mm}`
      } catch { return 'Saved' }
    }
    if (!NOTES_SYNC_URL) return 'Saved locally · server sync disabled'
    return 'Saved locally'
  }

  const saveColor =
    saveState === 'saving' ? '#FBBF24' :
    saveState === 'error'  ? '#F87171' :
    saveState === 'saved'  ? '#10B981' : '#9CA3AF'

  return (
    <>
      {/* Dim overlay behind panel */}
      {isOpen && (
        <div
          onClick={close}
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.35)',
            zIndex:50, transition:'opacity 0.15s', opacity:1,
          }}
        />
      )}

      {/* Side panel */}
      <aside
        aria-hidden={!isOpen}
        style={{
          position:'fixed', top:0, right:0, height:'100vh',
          width: 'min(420px, 92vw)',
          background:'var(--ink-2)',
          borderLeft:'1px solid rgba(201,168,76,0.25)',
          boxShadow:'-12px 0 32px rgba(0,0,0,0.45)',
          transform: isOpen ? 'translateX(0)' : 'translateX(110%)',
          transition:'transform 0.22s ease',
          zIndex:60,
          display:'flex', flexDirection:'column',
        }}
      >
        {/* Panel header */}
        <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(201,168,76,0.15)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexShrink:0 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>Notes</div>
            <div className="serif" style={{ fontSize:18, color:'var(--cream)', marginTop:4, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{pageLabel}</div>
            <div style={{ fontSize:10, color:'var(--cream-dim)', marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:saveColor }} />
              <span>{formatSaveLabel()}</span>
              {code && <span style={{ color:'#6B7280' }}>· as <strong style={{ color:'var(--cream-dim)' }}>{code}</strong></span>}
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close notes"
            style={{
              border:'1px solid rgba(201,168,76,0.3)', background:'transparent',
              color:'var(--cream-dim)', fontSize:14, lineHeight:1,
              width:28, height:28, borderRadius:6, cursor:'pointer', flexShrink:0,
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, padding:'14px 18px 18px', display:'flex', flexDirection:'column', minHeight:0 }}>
          {!pageId ? (
            <div style={{ fontSize:12, color:'var(--cream-dim)', lineHeight:1.6 }}>
              Open any deck slide or tab and your notes for that page will appear here.
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={currentNote}
                onChange={(e) => setNoteForPage(e.target.value)}
                placeholder={`Type a note about ${pageLabel}. Auto-saves as you type.`}
                style={{
                  flex:1, minHeight:0,
                  width:'100%',
                  background:'rgba(0,0,0,0.25)',
                  border:'1px solid rgba(201,168,76,0.18)',
                  borderRadius:8, padding:'12px 14px',
                  color:'var(--cream)', fontSize:13, lineHeight:1.55,
                  fontFamily:"'DM Sans',sans-serif",
                  resize:'none', outline:'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(201,168,76,0.45)' }}
                onBlur={(e)  => { e.target.style.borderColor = 'rgba(201,168,76,0.18)' }}
              />

              {/* Reviewed badge — founder has marked this note as seen. */}
              {reviewed && (
                <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:6, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12, color:'#10B981', fontWeight:700 }}>✓</span>
                  <span style={{ fontSize:11, color:'#10B981', letterSpacing:'0.05em', fontWeight:600 }}>Reviewed by founder</span>
                  <span style={{ fontSize:10, color:'var(--cream-dim)', marginLeft:'auto' }}>{(() => { try { const t = new Date(reviewed.at); const hh = String(t.getHours()).padStart(2,'0'); const mm = String(t.getMinutes()).padStart(2,'0'); return `${hh}:${mm} · ${t.toLocaleDateString('en-GB', { day:'numeric', month:'short' })}` } catch { return '' } })()}</span>
                </div>
              )}

              {/* Founder reply (read-only) — shown if the founder has
                  responded to this specific page note. The user pulls
                  the latest via the refresh button below. */}
              {founderReply && (founderReply.text || '').trim() && (
                <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(192,132,252,0.08)', border:'1px solid rgba(192,132,252,0.3)', borderRadius:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12, marginBottom:4 }}>
                    <div style={{ fontSize:10, color:'#C084FC', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>Founder reply</div>
                    <div style={{ fontSize:9, color:'var(--cream-dim)' }}>{(() => { try { const t = new Date(founderReply.updatedAt); const hh = String(t.getHours()).padStart(2,'0'); const mm = String(t.getMinutes()).padStart(2,'0'); return `${hh}:${mm} · ${t.toLocaleDateString('en-GB', { day:'numeric', month:'short' })}` } catch { return '' } })()}</div>
                  </div>
                  <div style={{ fontSize:13, color:'var(--cream)', whiteSpace:'pre-wrap', lineHeight:1.55 }}>{founderReply.text}</div>
                </div>
              )}

              <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                {currentNote.trim().length > 0 && (
                  <button
                    onClick={handleDelete}
                    title="Delete this note (cannot be undone)"
                    style={{
                      flexShrink:0, padding:'5px 10px', fontSize:10, fontWeight:600, borderRadius:6,
                      border:'1px solid rgba(248,113,113,0.4)', background:'transparent',
                      color:'#F87171', cursor:'pointer',
                      letterSpacing:'0.06em', textTransform:'uppercase',
                    }}
                  >🗑 Delete note</button>
                )}
                {NOTES_SYNC_URL && (
                  <button
                    onClick={refreshOwnNotes}
                    title="Pull the latest version of your notes (use this to see if the founder has replied)"
                    style={{
                      flexShrink:0, padding:'5px 10px', fontSize:10, fontWeight:600, borderRadius:6,
                      border:'1px solid rgba(201,168,76,0.35)', background:'transparent',
                      color:'var(--gold)', cursor:'pointer',
                      letterSpacing:'0.06em', textTransform:'uppercase',
                    }}
                  >↻ Replies</button>
                )}
              </div>
              <div style={{ marginTop:10, fontSize:10, color:'var(--cream-dim)', lineHeight:1.55 }}>
                Notes are private to your access code. They auto-save{NOTES_SYNC_URL ? ' across devices' : ' on this device'} and the founder is notified by email when you leave a note (throttled to once every 5 minutes per user).
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
