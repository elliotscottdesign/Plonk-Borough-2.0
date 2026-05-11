import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { NOTES_SYNC_URL, NOTES_SYNC_SECRET } from '../data.js'
import { getAccessCode, namespacedKey } from '../lib/access-code.js'

// ─── NotesContext ─────────────────────────────────────────────────────
// Per-user, per-page note-taking surface.
//
// • Local persistence: localStorage key `ndb_notes_v1__<ACCESS_CODE>`
//   stores the user's full notes blob. Survives reload, scoped by code.
// • Server sync: each save POSTs the blob (debounced ~1.2s) to
//   NOTES_SYNC_URL → Apps Script that upserts a row in the Notes sheet
//   and emails the founder (throttled to once per 5 min per code).
// • Founder cross-user view: when isFounder is true the provider also
//   GETs ?all=1 on mount so the master Notes tab can render every
//   visitor's notes.
//
// Shape of the user-level blob:
//   { byPage: { [pageId]: { text: string, label: string, updatedAt: ISO } } }
//
// Active-page tracking:
//   App.jsx (or any wrapper) calls `setActivePage({ id, label })` when
//   the user navigates. The slide-out panel binds its textarea to the
//   active page's note. Components that render under a page boundary
//   can also call useNotesActivePage(id, label) which sets it on mount
//   and clears it on unmount.

const NOTES_KEY = 'ndb_notes_v1'
const SAVE_DEBOUNCE_MS = 1200
const HYDRATE_TIMEOUT_MS = 8000

const NotesCtx = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},

  activePage: null,                   // { id, label } | null
  setActivePage: () => {},

  notes: { byPage: {} },              // current user's blob
  setNoteForPage: () => {},           // (text) → updates active page (or pass id)

  isFounder: false,
  allRows: [],                        // founder-only [{ code, notes, updatedAt }]
  refreshAllRows: () => {},
  isLoadingAll: false,

  saveState: 'idle',                  // 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: null,                  // ISO of last successful POST

  // Founder-only: post a reply against another user's note.
  replyToNote: async () => false,     // (targetCode, pageId, text) → boolean
  // Founder-only: mark / unmark another user's note as reviewed.
  setNoteReviewed: async () => false, // (targetCode, pageId, reviewed) → boolean
  // Founder-only: delete a visitor's note (removes the page entry from
  // their row — drops the user's text along with any founderReply +
  // reviewed metadata for that page).
  deleteVisitorNote: async () => false, // (targetCode, pageId, targetNotes) → boolean
  // User-side: delete a note for a page (clears the entry locally + on server).
  deleteNoteForPage: () => {},        // (pageId)
  // User-side: re-fetch own row from server (picks up founder replies).
  refreshOwnNotes: async () => {},

  // ─── Safety surfaces ────────────────────────────────────────────
  // hydrateWarning: set when the server returned a thinner blob than
  // the local cache on this mount — local is kept, founder is warned.
  // notesHealth: founder-only ?health=1 probe result.
  hydrateWarning: null,
  notesHealth: { status: 'unknown', sheetRowCount: null, historyRowCount: null, error: null },
})

const isValidNotesBlob = (b) =>
  b && typeof b === 'object' && b.byPage && typeof b.byPage === 'object'

function readPersistedNotes() {
  try {
    const raw = localStorage.getItem(namespacedKey(NOTES_KEY))
    if (!raw) return { byPage: {} }
    const parsed = JSON.parse(raw)
    return isValidNotesBlob(parsed) ? parsed : { byPage: {} }
  } catch { return { byPage: {} } }
}

function readIsFounder() {
  try { return sessionStorage.getItem('ndb_role_founder') === '1' }
  catch { return false }
}

export function NotesProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activePage, setActivePageState] = useState(null)
  const [notes, setNotes] = useState(readPersistedNotes)
  const [allRows, setAllRows] = useState([])
  const [isLoadingAll, setIsLoadingAll] = useState(false)
  const [saveState, setSaveState] = useState('idle')
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [hydrateWarning, setHydrateWarning] = useState(null)
  const [notesHealth, setNotesHealth] = useState({ status: 'unknown', sheetRowCount: null, historyRowCount: null, error: null })

  const isFounder = readIsFounder()

  // Persist locally on every change so a refresh never loses content.
  useEffect(() => {
    try { localStorage.setItem(namespacedKey(NOTES_KEY), JSON.stringify(notes)) } catch {}
  }, [notes])

  // ─── Server hydrate on mount ─────────────────────────────────────
  // SAFETY GUARD: a server response with fewer pages than the local
  // cache is treated as suspicious (likely a misconfigured endpoint
  // or empty backend). We keep the local copy and expose a warning
  // so the founder sees the problem before any saves clobber the
  // good state.
  useEffect(() => {
    if (!NOTES_SYNC_URL) return
    const code = getAccessCode()
    if (!code) return
    const localAtMount = readPersistedNotes()
    const localPageCount = Object.keys(localAtMount?.byPage || {}).length
    let cancelled = false
    ;(async () => {
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), HYDRATE_TIMEOUT_MS)
        const res = await fetch(`${NOTES_SYNC_URL}?code=${encodeURIComponent(code)}`, {
          cache: 'no-store', signal: ctrl.signal,
        })
        clearTimeout(t)
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!data || !isValidNotesBlob(data.notes)) return
        const serverPageCount = Object.keys(data.notes.byPage || {}).length
        if (serverPageCount < localPageCount) {
          // eslint-disable-next-line no-console
          console.warn(`[notes] hydrate guard: server returned ${serverPageCount} pages, local has ${localPageCount}. KEEPING LOCAL.`)
          if (!cancelled) setHydrateWarning({
            localPageCount, serverPageCount, at: new Date().toISOString(),
          })
          return
        }
        if (!cancelled) setNotes(data.notes)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[notes] hydrate failed, using local state:', e.message)
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Founder-only backend health probe ──────────────────────────
  useEffect(() => {
    if (!NOTES_SYNC_URL || !isFounder) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${NOTES_SYNC_URL}?health=1${NOTES_SYNC_SECRET ? `&secret=${encodeURIComponent(NOTES_SYNC_SECRET)}` : ''}`, { cache: 'no-store' })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (cancelled) return
        if (data && data.health === 'ok') {
          const sheetRowCount   = typeof data.sheetRowCount   === 'number' ? data.sheetRowCount   : null
          const historyRowCount = typeof data.historyRowCount === 'number' ? data.historyRowCount : null
          setNotesHealth({
            status: sheetRowCount === 0 ? 'empty' : 'ok',
            sheetRowCount, historyRowCount, error: null,
          })
        } else {
          setNotesHealth({ status: 'unknown', sheetRowCount: null, historyRowCount: null, error: 'old deployment — no /health branch' })
        }
      } catch (e) {
        if (!cancelled) setNotesHealth({ status: 'error', sheetRowCount: null, historyRowCount: null, error: e.message })
      }
    })()
    return () => { cancelled = true }
  }, [isFounder])

  const refreshAllRows = useCallback(async () => {
    if (!NOTES_SYNC_URL || !isFounder) return
    setIsLoadingAll(true)
    try {
      const url = `${NOTES_SYNC_URL}?all=1${NOTES_SYNC_SECRET ? `&secret=${encodeURIComponent(NOTES_SYNC_SECRET)}` : ''}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data?.rows)) setAllRows(data.rows)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[notes] all-rows fetch failed:', e.message)
    } finally {
      setIsLoadingAll(false)
    }
  }, [isFounder])

  useEffect(() => {
    if (isFounder) refreshAllRows()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFounder])

  // ─── Auto-save: debounced POST ──────────────────────────────────
  // Captures the latest "active write" so the email subject reflects
  // the page the user was typing on, not just the blob shape.
  const lastWriteRef = useRef(null)
  const saveTimerRef = useRef(null)
  const queuePOST = useCallback((nextNotes, pageId, text) => {
    const code = getAccessCode()
    if (!NOTES_SYNC_URL || !code) {
      setSaveState('saved')   // local-only mode
      return
    }
    const page = pageId ? { id: pageId, label: nextNotes.byPage[pageId]?.label || pageId } : null
    lastWriteRef.current = { notes: nextNotes, page, text }
    setSaveState('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const payload = lastWriteRef.current
      if (!payload) return
      try {
        const body = {
          code,
          notes: payload.notes,
          page: payload.page,
          text: payload.text,
          secret: NOTES_SYNC_SECRET || undefined,
        }
        const res = await fetch(NOTES_SYNC_URL, {
          method: 'POST',
          mode: 'cors',
          cache: 'no-store',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          setSaveState('saved')
          setLastSavedAt(new Date().toISOString())
        } else {
          setSaveState('error')
        }
      } catch (e) {
        setSaveState('error')
        // eslint-disable-next-line no-console
        console.warn('[notes] POST failed:', e.message)
      }
    }, SAVE_DEBOUNCE_MS)
  }, [])

  const setNoteForPage = useCallback((idArg, textArg, labelArg) => {
    // Two call shapes:
    //   setNoteForPage(text)             → writes to activePage
    //   setNoteForPage(id, text, label?) → writes to specific page
    let id, text, label
    if (typeof textArg === 'undefined') {
      id    = activePage?.id
      label = activePage?.label
      text  = idArg
    } else {
      id    = idArg
      text  = textArg
      label = labelArg
    }
    if (!id) return
    const updatedAt = new Date().toISOString()
    setNotes(prev => {
      const next = {
        ...prev,
        byPage: {
          ...prev.byPage,
          [id]: { text: text || '', label: label || prev.byPage?.[id]?.label || id, updatedAt },
        },
      }
      queuePOST(next, id, text || '')
      return next
    })
  }, [activePage, queuePOST])

  const setActivePage = useCallback((p) => {
    if (!p || !p.id) { setActivePageState(null); return }
    setActivePageState({ id: p.id, label: p.label || p.id })
  }, [])

  const open   = useCallback(() => setIsOpen(true), [])
  const close  = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(o => !o), [])

  // ─── Founder reply API ────────────────────────────────────────────
  // Posts a reply against another user's note. Server validates the
  // founder code (FOUNDER_CODES = ['888999']) so this only succeeds
  // when the active session is the founder's. Refreshes the all-rows
  // view on success so the founder sees their own reply land.
  const replyToNote = useCallback(async (targetCode, pageId, replyText, replyColor) => {
    if (!NOTES_SYNC_URL) return false
    const code = getAccessCode()
    if (!code || !targetCode || !pageId) return false
    try {
      // `replyColor` is the founder's swatch choice (cyan / magenta /
      // yellow / white). Saved on the server-side reply record so the
      // target user sees the founder's chosen text colour. Optional
      // for backward compatibility — Apps Scripts without the update
      // will simply ignore the unknown field.
      const body = {
        code,
        target: { code: targetCode, pageId },
        replyText: replyText || '',
        replyColor: replyColor || undefined,
        secret: NOTES_SYNC_SECRET || undefined,
      }
      const res = await fetch(NOTES_SYNC_URL, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(body),
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data?.error) return false
      // Pull fresh all-rows so the founder UI shows the new reply.
      refreshAllRows()
      return true
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[notes] reply POST failed:', e.message)
      return false
    }
  }, [refreshAllRows])

  // ─── Founder reviewed-flag API ────────────────────────────────────
  // Sets / unsets the `reviewed` flag on another user's note. Server
  // validates the founder code. Refreshes the all-rows view on success.
  const setNoteReviewed = useCallback(async (targetCode, pageId, reviewed) => {
    if (!NOTES_SYNC_URL) return false
    const code = getAccessCode()
    if (!code || !targetCode || !pageId) return false
    try {
      const body = {
        code,
        target: { code: targetCode, pageId },
        reviewed: !!reviewed,
        secret: NOTES_SYNC_SECRET || undefined,
      }
      const res = await fetch(NOTES_SYNC_URL, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(body),
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data?.error) return false
      refreshAllRows()
      return true
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[notes] setNoteReviewed POST failed:', e.message)
      return false
    }
  }, [refreshAllRows])

  // ─── Founder visitor-note delete ──────────────────────────────────
  // Founder-initiated cleanup of a visitor's note. POSTs the visitor's
  // current notes blob with the target page entry stripped — using the
  // visitor's code as the body's `code` field so the existing user-
  // notes write path handles it (no Apps Script change required).
  // The email-on-save path is skipped because we omit `text` from the
  // body (only set when a user is leaving a fresh note, not when
  // cleaning up).
  const deleteVisitorNote = useCallback(async (targetCode, pageId, targetNotes) => {
    if (!NOTES_SYNC_URL) return false
    if (!targetCode || !pageId) return false
    const cleanedByPage = { ...((targetNotes && targetNotes.byPage) || {}) }
    delete cleanedByPage[pageId]
    const cleaned = { ...(targetNotes || {}), byPage: cleanedByPage }
    try {
      const res = await fetch(NOTES_SYNC_URL, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({
          code: targetCode,
          notes: cleaned,
          intent: 'delete',
          deletedPageId: pageId,
          secret: NOTES_SYNC_SECRET || undefined,
        }),
      })
      if (!res.ok) return false
      refreshAllRows()
      return true
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[notes] deleteVisitorNote failed:', e.message)
      return false
    }
  }, [refreshAllRows])

  // ─── User-side delete ─────────────────────────────────────────────
  // Removes a page entry from the local blob and POSTs the cleaned
  // notes payload so the server row reflects the deletion. The
  // founderReply / reviewed metadata for that page is dropped along
  // with the user's text.
  // ─── User-side delete ─────────────────────────────────────────────
  // Sends intent:'delete' so the server-side empty-write guard accepts
  // a legitimate delete-to-zero-pages.
  const deleteNoteForPage = useCallback((pageId) => {
    if (!pageId) return
    setNotes(prev => {
      const nextByPage = { ...(prev.byPage || {}) }
      delete nextByPage[pageId]
      const next = { ...prev, byPage: nextByPage }
      const code = getAccessCode()
      if (NOTES_SYNC_URL && code) {
        ;(async () => {
          try {
            await fetch(NOTES_SYNC_URL, {
              method: 'POST',
              mode: 'cors',
              cache: 'no-store',
              headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
              body: JSON.stringify({
                code,
                notes: next,
                intent: 'delete',
                deletedPageId: pageId,
                secret: NOTES_SYNC_SECRET || undefined,
              }),
            })
          } catch {}
        })()
      }
      return next
    })
  }, [])

  // ─── User-side refresh ────────────────────────────────────────────
  // Same hydrate-guard as the mount effect — never let the server
  // shrink local state.
  const refreshOwnNotes = useCallback(async () => {
    if (!NOTES_SYNC_URL) return
    const code = getAccessCode()
    if (!code) return
    try {
      const res = await fetch(`${NOTES_SYNC_URL}?code=${encodeURIComponent(code)}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (!data || !isValidNotesBlob(data.notes)) return
      const localPageCount  = Object.keys(notes?.byPage || {}).length
      const serverPageCount = Object.keys(data.notes.byPage || {}).length
      if (serverPageCount < localPageCount) {
        // eslint-disable-next-line no-console
        console.warn(`[notes] refresh guard: server returned ${serverPageCount} pages, local has ${localPageCount}. KEEPING LOCAL.`)
        setHydrateWarning({ localPageCount, serverPageCount, at: new Date().toISOString() })
        return
      }
      setNotes(data.notes)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[notes] refreshOwnNotes failed:', e.message)
    }
  }, [notes])

  const value = useMemo(() => ({
    isOpen, open, close, toggle,
    activePage, setActivePage,
    notes, setNoteForPage, deleteNoteForPage,
    isFounder,
    allRows, refreshAllRows, isLoadingAll,
    saveState, lastSavedAt,
    replyToNote, setNoteReviewed, deleteVisitorNote, refreshOwnNotes,
    hydrateWarning, notesHealth,
  }), [isOpen, open, close, toggle, activePage, setActivePage, notes, setNoteForPage, deleteNoteForPage, isFounder, allRows, refreshAllRows, isLoadingAll, saveState, lastSavedAt, replyToNote, setNoteReviewed, deleteVisitorNote, refreshOwnNotes, hydrateWarning, notesHealth])

  return <NotesCtx.Provider value={value}>{children}</NotesCtx.Provider>
}

export function useNotes() {
  return useContext(NotesCtx)
}

// Convenience hook: components inside a page can declare which page
// they belong to. While mounted (and the component is the most recent
// caller), the active page is set to { id, label }.
export function useNotesActivePage(id, label) {
  const { setActivePage } = useNotes()
  useEffect(() => {
    if (!id) return
    setActivePage({ id, label })
    // Don't clear on unmount — App.jsx is the canonical setter and we
    // don't want sub-component remounts to wipe the active scope.
  }, [id, label, setActivePage])
}
