import React, { useMemo, useState } from 'react'
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

// Render the founder's reply (if present) under a note. Read-only.
function FounderReplyBlock({ reply }) {
  if (!reply || !(reply.text || '').trim()) return null
  return (
    <div style={{ marginTop:10, padding:'10px 12px', background:'rgba(192,132,252,0.06)', border:'1px solid rgba(192,132,252,0.25)', borderRadius:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12, marginBottom:4 }}>
        <div style={{ fontSize:10, color:'#C084FC', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>Founder reply</div>
        <div style={{ fontSize:9, color:'var(--cream-dim)' }}>{fmtTs(reply.updatedAt)}</div>
      </div>
      <div style={{ fontSize:13, color:'var(--cream)', whiteSpace:'pre-wrap', lineHeight:1.55 }}>{reply.text}</div>
    </div>
  )
}

// Founder reviewed toggle.
function ReviewedToggle({ targetCode, pageId, reviewed }) {
  const { setNoteReviewed } = useNotes()
  const [busy, setBusy] = useState(false)
  const isReviewed = !!reviewed
  const toggle = async () => {
    setBusy(true)
    await setNoteReviewed(targetCode, pageId, !isReviewed)
    setBusy(false)
  }
  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={isReviewed ? 'Untick to mark as not yet reviewed' : 'Tick to mark this note as reviewed (visitor sees a confirmation badge)'}
      style={{
        display:'inline-flex', alignItems:'center', gap:6,
        padding:'4px 10px', fontSize:11, fontWeight:600, borderRadius:6,
        border:`1px solid ${isReviewed ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.15)'}`,
        background: isReviewed ? 'rgba(16,185,129,0.12)' : 'transparent',
        color: isReviewed ? '#10B981' : 'var(--cream-dim)',
        cursor: busy ? 'wait' : 'pointer',
        letterSpacing:'0.05em',
      }}
    >
      <span style={{ fontSize:13 }}>{isReviewed ? '☑' : '☐'}</span>
      <span>{isReviewed ? 'Reviewed' : 'Mark reviewed'}</span>
    </button>
  )
}

// Visitor reviewed badge.
function ReviewedBadge({ reviewed }) {
  if (!reviewed) return null
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 8px', fontSize:10, fontWeight:700, borderRadius:10, background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.4)', color:'#10B981', letterSpacing:'0.05em', textTransform:'uppercase' }}>
      <span>✓</span><span>Reviewed by founder</span>
      <span style={{ color:'var(--cream-dim)', fontWeight:500, textTransform:'none', letterSpacing:0 }}>· {fmtTs(reviewed.at)}</span>
    </span>
  )
}

// Founder-only reply composer (Hackney variant — same logic, separate
// useNotes context so it talks to the Hackney endpoint).
function ReplyComposer({ targetCode, pageId, existing }) {
  const { replyToNote } = useNotes()
  const [text, setText] = useState((existing?.text) || '')
  const [state, setState] = useState('idle')

  const submit = async () => {
    setState('saving')
    const ok = await replyToNote(targetCode, pageId, text)
    setState(ok ? 'saved' : 'error')
    if (ok) setTimeout(() => setState('idle'), 1500)
  }
  const clear = async () => {
    setText('')
    setState('saving')
    const ok = await replyToNote(targetCode, pageId, '')
    setState(ok ? 'saved' : 'error')
    if (ok) setTimeout(() => setState('idle'), 1500)
  }

  const stateLabel =
    state === 'saving' ? 'Saving…' :
    state === 'saved'  ? 'Saved' :
    state === 'error'  ? 'Failed — retry' : null

  return (
    <div style={{ marginTop:8, padding:'10px 12px', background:'rgba(192,132,252,0.04)', border:'1px dashed rgba(192,132,252,0.3)', borderRadius:6 }}>
      <div style={{ fontSize:10, color:'#C084FC', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600, marginBottom:6 }}>Reply as founder</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a reply — the user sees it on their own deck after refresh."
        rows={3}
        style={{
          width:'100%', resize:'vertical', minHeight:48,
          background:'rgba(0,0,0,0.25)', border:'1px solid rgba(192,132,252,0.25)',
          borderRadius:6, padding:'8px 10px',
          color:'var(--cream)', fontSize:12.5, lineHeight:1.5,
          fontFamily:"'DM Sans',sans-serif", outline:'none',
        }}
      />
      <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:6 }}>
        <button onClick={submit} disabled={state==='saving' || !text.trim()} style={{ padding:'5px 12px', fontSize:11, fontWeight:600, borderRadius:6, border:'1px solid #C084FC', background: state==='saving' ? 'rgba(192,132,252,0.15)' : '#C084FC', color: state==='saving' ? '#C084FC' : 'var(--ink)', cursor: state==='saving' || !text.trim() ? 'not-allowed' : 'pointer', letterSpacing:'0.06em', textTransform:'uppercase', opacity: !text.trim() ? 0.5 : 1 }}>
          {existing ? 'Update reply' : 'Send reply'}
        </button>
        {existing && (
          <button onClick={clear} disabled={state==='saving'} style={{ padding:'5px 12px', fontSize:11, fontWeight:600, borderRadius:6, border:'1px solid rgba(248,113,113,0.4)', background:'transparent', color:'#F87171', cursor: state==='saving' ? 'not-allowed' : 'pointer', letterSpacing:'0.06em', textTransform:'uppercase' }}>
            Clear reply
          </button>
        )}
        {stateLabel && <span style={{ fontSize:11, color: state==='error' ? '#F87171' : 'var(--cream-dim)' }}>{stateLabel}</span>}
      </div>
    </div>
  )
}

function NotesList({ notesBlob, emptyHint, mode = 'self', targetCode, onDelete }) {
  const entries = useMemo(() => {
    const byPage = notesBlob?.byPage || {}
    return Object.entries(byPage)
      .map(([id, v]) => ({
        id, label: v?.label || id, text: v?.text || '',
        updatedAt: v?.updatedAt || '',
        founderReply: v?.founderReply || null,
        reviewed: v?.reviewed || null,
      }))
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
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12, marginBottom:6, flexWrap:'wrap' }}>
            <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:600 }}>{e.label}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              {mode === 'self' && <ReviewedBadge reviewed={e.reviewed} />}
              <div style={{ fontSize:10, color:'var(--cream-dim)' }}>{fmtTs(e.updatedAt)}</div>
            </div>
          </div>
          <div style={{ fontSize:13, color:'var(--cream)', whiteSpace:'pre-wrap', lineHeight:1.55 }}>{e.text}</div>
          <FounderReplyBlock reply={e.founderReply} />

          {mode === 'self' && onDelete && (
            <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
              <button
                onClick={() => {
                  if (window.confirm(`Delete your note on "${e.label}"? This cannot be undone.`)) {
                    onDelete(e.id, e.label)
                  }
                }}
                style={{
                  padding:'4px 10px', fontSize:10, fontWeight:600, borderRadius:6,
                  border:'1px solid rgba(248,113,113,0.4)', background:'transparent',
                  color:'#F87171', cursor:'pointer',
                  letterSpacing:'0.06em', textTransform:'uppercase',
                }}
              >🗑 Delete note</button>
            </div>
          )}

          {mode === 'founder' && targetCode && (
            <>
              <div style={{ marginTop:10, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:6, flexWrap:'wrap' }}>
                {onDelete && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${targetCode}'s note on "${e.label}"? This removes it from their deck and cannot be undone.`)) {
                        onDelete(e.id, e.label)
                      }
                    }}
                    title={`Delete ${targetCode}'s note (founder action — removes the note from the visitor's deck)`}
                    style={{
                      padding:'4px 10px', fontSize:11, fontWeight:600, borderRadius:6,
                      border:'1px solid rgba(248,113,113,0.45)', background:'transparent',
                      color:'#F87171', cursor:'pointer',
                      letterSpacing:'0.05em',
                    }}
                  >🗑 Delete note</button>
                )}
                <ReviewedToggle targetCode={targetCode} pageId={e.id} reviewed={e.reviewed} />
              </div>
              <ReplyComposer targetCode={targetCode} pageId={e.id} existing={e.founderReply} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default function NotesTab() {
  const { notes, isFounder, allRows, refreshAllRows, isLoadingAll, refreshOwnNotes, deleteNoteForPage, deleteVisitorNote } = useNotes()
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
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, marginBottom:10, flexWrap:'wrap' }}>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Your notes · {code || '—'}</div>
            {NOTES_SYNC_URL && (
              <button
                onClick={refreshOwnNotes}
                title="Pull the latest version of your notes from the server (use this to check for founder replies)"
                style={{
                  padding:'5px 12px', fontSize:11, fontWeight:600, borderRadius:6,
                  border:'1px solid rgba(201,168,76,0.4)', background:'transparent',
                  color:'var(--gold)', cursor:'pointer',
                  letterSpacing:'0.06em', textTransform:'uppercase',
                }}
              >↻ Check for replies</button>
            )}
          </div>
          <NotesList
            notesBlob={notes}
            onDelete={(pageId) => deleteNoteForPage(pageId)}
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
                    <NotesList
                      notesBlob={r.notes}
                      mode="founder"
                      targetCode={r.code}
                      onDelete={(pageId) => deleteVisitorNote(r.code, pageId, r.notes)}
                    />
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
