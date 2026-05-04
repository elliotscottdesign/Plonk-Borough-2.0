// ─── Active access code ──────────────────────────────────────────────
// The access code entered at the PasswordGate is the user's tenant ID
// for the session. Every locked surface keys its localStorage AND its
// server slot off this string so each code has a private playground:
//
//   • Drags + locks under code A never affect code B's view
//   • Reopening with the same code on any device restores that code's
//     state via the lock-sync server fetch (provider useEffect on mount)
//
// Persisted in sessionStorage (clears when the tab closes — same TTL
// as ndb_unlocked / ndb_founder / ndb_plonk_access). Re-entered every
// time the user reopens the deck, by design.
//
// Empty string ('') means "not signed in" — provider init treats it as
// the read-only / no-server-fetch path so a misconfigured caller can't
// accidentally write to a wildcard slot.

const KEY = 'ndb_access_code'

export function getAccessCode() {
  try { return sessionStorage.getItem(KEY) || '' } catch { return '' }
}

export function setAccessCode(code) {
  try {
    if (code) sessionStorage.setItem(KEY, code)
    else      sessionStorage.removeItem(KEY)
  } catch {}
}

// Suffix a localStorage key with the active access code so two codes
// sharing one browser don't collide. Falls back to the raw key when
// nothing is signed in (rare — most callers run inside a provider that
// only mounts after PasswordGate clears).
export function namespacedKey(baseKey) {
  const code = getAccessCode()
  return code ? `${baseKey}__${code}` : baseKey
}
