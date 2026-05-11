import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { NOTES_SYNC_URL, NOTES_SYNC_SECRET } from '../../data/hackney.js'
import { getAccessCode, namespacedKey } from '../../lib/access-code.js'

// ─── Hackney NotesContext ─────────────────────────────────────────────
// Sibling to src/components/NotesContext.jsx (Borough). Independent
// localStorage namespace AND independent server endpoint so investor
// notes against the Hackney deck never bleed into the Borough Notes
// sheet.
//
// • Local persistence: localStorage key `ndh_notes_v1__<ACCESS_CODE>`
//   stores the user's full notes blob. Survives reload, scoped by code.
// • Server sync: each save POSTs the blob (debounced ~1.2s) to the
//   Hackney NOTES_SYNC_URL → Apps Script that upserts a row in the
//   Hackney Notes sheet and emails the founder (throttled to once per
//   5 min per code).
// • Founder cross-user view: when isFounder is true the provider also
//   GETs ?all=1 on mount so the master Main Notes tab can render every
//   visitor's notes.
//
// Shape of the user-level blob:
//   { byPage: { [pageId]: { text: string, label: string, updatedAt: ISO } } }

const NOTES_KEY = 'ndh_notes_v1'
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
  setNoteForPage: () => {},

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
  // Founder-only: delete a visitor's note.
  deleteVisitorNote: async () => false, // (targetCode, pageId, targetNotes) → boolean
  // User-side: delete a note for a page (clears the entry locally + on server).
  deleteNoteForPage: () => {},        // (pageId)
  // User-side: re-fetch own row from server (picks up founder replies).
  refreshOwnNotes: async () => {},
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

  const isFounder = readIsFounder()

  useEffect(() => {
    try { localStorage.setItem(namespacedKey(NOTES_KEY), JSON.stringify(notes)) } catch {}
  }, [notes])

  // ─── Server hydrate on mount ─────────────────────────────────────
  useEffect(() => {
    if (!NOTES_SYNC_URL) return
    const code = getAccessCode()
    if (!code) return
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
        if (data && isValidNotesBlob(data.notes)) {
          setNotes(data.notes)
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[hackney notes] hydrate failed, using local state:', e.message)
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      console.warn('[hackney notes] all-rows fetch failed:', e.message)
    } finally {
      setIsLoadingAll(false)
    }
  }, [isFounder])

  useEffect(() => {
    if (isFounder) refreshAllRows()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFounder])

  // ─── Auto-save: debounced POST ──────────────────────────────────
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
        console.warn('[hackney notes] POST failed:', e.message)
      }
    }, SAVE_DEBOUNCE_MS)
  }, [])

  const setNoteForPage = useCallback((idArg, textArg, labelArg) => {
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
  // `replyColor` carries the founder's swatch choice (cyan/magenta/
  // yellow/white). Apps Script saves it on the reply record so the
  // visitor sees the chosen colour. Optional — older scripts ignore.
  const replyToNote = useCallback(async (targetCode, pageId, replyText, replyColor) => {
    if (!NOTES_SYNC_URL) return false
    const code = getAccessCode()
    if (!code || !targetCode || !pageId) return false
    try {
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
      refreshAllRows()
      return true
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[hackney notes] reply POST failed:', e.message)
      return false
    }
  }, [refreshAllRows])

  // ─── Founder reviewed-flag API ────────────────────────────────────
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
      console.warn('[hackney notes] setNoteReviewed POST failed:', e.message)
      return false
    }
  }, [refreshAllRows])

  // ─── Founder visitor-note delete ──────────────────────────────────
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
          secret: NOTES_SYNC_SECRET || undefined,
        }),
      })
      if (!res.ok) return false
      refreshAllRows()
      return true
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[hackney notes] deleteVisitorNote failed:', e.message)
      return false
    }
  }, [refreshAllRows])

  // ─── User-side delete ─────────────────────────────────────────────
  const deleteNoteForPage = useCallback((pageId) => {
    if (!pageId) return
    setNotes(prev => {
      const nextByPage = { ...(prev.byPage || {}) }
      delete nextByPage[pageId]
      const next = { ...prev, byPage: nextByPage }
      queuePOST(next, pageId, '')
      return next
    })
  }, [queuePOST])

  // ─── User-side refresh ────────────────────────────────────────────
  const refreshOwnNotes = useCallback(async () => {
    if (!NOTES_SYNC_URL) return
    const code = getAccessCode()
    if (!code) return
    try {
      const res = await fetch(`${NOTES_SYNC_URL}?code=${encodeURIComponent(code)}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (data && isValidNotesBlob(data.notes)) setNotes(data.notes)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[hackney notes] refreshOwnNotes failed:', e.message)
    }
  }, [])

  const value = useMemo(() => ({
    isOpen, open, close, toggle,
    activePage, setActivePage,
    notes, setNoteForPage, deleteNoteForPage,
    isFounder,
    allRows, refreshAllRows, isLoadingAll,
    saveState, lastSavedAt,
    replyToNote, setNoteReviewed, deleteVisitorNote, refreshOwnNotes,
  }), [isOpen, open, close, toggle, activePage, setActivePage, notes, setNoteForPage, deleteNoteForPage, isFounder, allRows, refreshAllRows, isLoadingAll, saveState, lastSavedAt, replyToNote, setNoteReviewed, deleteVisitorNote, refreshOwnNotes])

  return <NotesCtx.Provider value={value}>{children}</NotesCtx.Provider>
}

export function useNotes() {
  return useContext(NotesCtx)
}
