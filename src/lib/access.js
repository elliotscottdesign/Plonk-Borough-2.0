// ─── Access codes — single source of truth ───────────────────────────────────
// Live codes and the orthogonal role flags each grants. Imported by the
// PasswordGate (the per-door gate) AND the /today management log-in, so there's
// exactly one place that defines what a code unlocks.
//
//   888999   — founder: opens EVERYTHING (ops, marketing, plonk, both decks).
//   NDTEAM   — team staff: Operations + Marketing only (no investor decks).
//   NODICE88 — Hackney investors: the Hackney deck ONLY.
//   NODICE99 — Borough investors: the Borough deck ONLY.
//   LEONIE / LEE01 / MIKE — Round-1 prospectives: Hackney deck + their own
//              bespoke "Your Agreement" tab (gated on `role`).
//
// Flags: plonk · founder (full edit) · hackney · borough · ops · marketing · role.
export const ACCESS_CODES = {
  '888999':   { plonk: true,  founder: true,  hackney: true,  borough: true,  ops: true,  marketing: true,  role: 'founder'          },
  'NDTEAM':   { plonk: false, founder: false, hackney: false, borough: false, ops: true,  marketing: true,  role: 'team'             },
  'NODICE88': { plonk: false, founder: false, hackney: true,  borough: false, ops: false, marketing: false, role: 'hackney-investor' },
  'NODICE99': { plonk: false, founder: false, hackney: false, borough: true,  ops: false, marketing: false, role: 'borough-investor' },
  'LEONIE':   { plonk: false, founder: false, hackney: true,  borough: false, ops: false, marketing: false, role: 'leonie'           },
  'LEE01':    { plonk: false, founder: false, hackney: true,  borough: false, ops: false, marketing: false, role: 'lee'              },
  'MIKE':     { plonk: false, founder: false, hackney: true,  borough: false, ops: false, marketing: false, role: 'mike'             },
}

// Normalise a typed code and look it up. Digit codes (888999) are case-sensitive;
// the named codes accept any case for friendliness.
export function lookupAccess(raw) {
  const input = (raw || '').trim()
  const candidate = /^[0-9]+$/.test(input) ? input : input.toUpperCase()
  return { candidate, access: ACCESS_CODES[candidate] || null }
}

// Write the sessionStorage flags for a granted access code. This is the canonical
// unlock — the PasswordGate flow (App.jsx onUnlock) and the /today management
// log-in both call it, so an unlock means the same thing everywhere.
// (React state + i18n stay in App.jsx; this only touches sessionStorage.)
export function applyAccessSession(access, accessCode) {
  sessionStorage.setItem('ndb_unlocked', '1')
  sessionStorage.removeItem('ndb_plonk')                                   // legacy key, no longer used
  if (accessCode) sessionStorage.setItem('ndb_access_code', accessCode)
  else            sessionStorage.removeItem('ndb_access_code')
  sessionStorage.setItem('ndb_founder', '1')                              // every signed-in user can drag/lock in their own scope
  if (access.founder)   sessionStorage.setItem('ndb_role_founder', '1');    else sessionStorage.removeItem('ndb_role_founder')
  if (access.plonk)     sessionStorage.setItem('ndb_plonk_access', '1');    else sessionStorage.removeItem('ndb_plonk_access')
  if (access.hackney)   sessionStorage.setItem('ndb_hackney_access', '1');  else sessionStorage.removeItem('ndb_hackney_access')
  if (access.ops)       sessionStorage.setItem('ndb_ops_access', '1');      else sessionStorage.removeItem('ndb_ops_access')
  if (access.marketing) sessionStorage.setItem('ndb_marketing_access', '1'); else sessionStorage.removeItem('ndb_marketing_access')
  if (access.borough)   sessionStorage.setItem('ndb_borough_access', '1');  else sessionStorage.removeItem('ndb_borough_access')
  sessionStorage.setItem('ndb_role', access.role || 'investor')
  // Remember this device so the next visit needs no code at all.
  if (accessCode) rememberDevice(access, accessCode)
}

// ─── Remember this device ────────────────────────────────────────────────────
// Founder, 20 Aug 2026: "No login for founder. I can't be fucked to enter the
// codes to get into my own app… it should automatically know it's me."
//
// Everything above writes to sessionStorage, which the browser throws away the
// moment the tab or the installed app is closed — so every single visit meant
// typing the code again. This mirrors the unlock into localStorage, which
// survives, and restores it on the next visit. Sign in once per device, ever.
//
// Security posture is unchanged in kind: these codes already ship in the public
// JS bundle and are documented as a speed bump, not a lock. What DOES change is
// that whoever holds an unlocked phone is inside without typing anything — so
// "Sign out" (forgetDevice) must stay visible and easy to reach.
export const REMEMBER_KEY = 'ndb_device_v1'

export function rememberDevice(access, accessCode) {
  try { localStorage.setItem(REMEMBER_KEY, JSON.stringify({ access, accessCode, at: Date.now() })) }
  catch { /* private mode — this visit stays session-only */ }
}

export function forgetDevice() {
  try { localStorage.removeItem(REMEMBER_KEY) } catch {}
  try { sessionStorage.clear() } catch {}
}

export function rememberedDevice() {
  try {
    const r = JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null')
    // Re-validate against the live code table, so retiring a code in
    // ACCESS_CODES logs that device out instead of leaving it grandfathered in.
    if (!r || !r.accessCode) return null
    const live = ACCESS_CODES[r.accessCode]
    return live ? { access: live, accessCode: r.accessCode } : null
  } catch { return null }
}

// Put a remembered device straight back into the session. Returns true if it
// restored something, so the caller can skip the gate entirely.
export function restoreRememberedSession() {
  const r = rememberedDevice()
  if (!r) return false
  applyAccessSession(r.access, r.accessCode)
  return true
}
