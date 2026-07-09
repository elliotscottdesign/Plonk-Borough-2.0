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
}
