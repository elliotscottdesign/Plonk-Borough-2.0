// No Dice Rota portal API — talks to the `rota` Supabase edge function.
//   admin  : SEND_SECRET-gated — the /ops "Rota" screen manages staff.
//   staff  : email + password login → a personal token for the staff portal.
import { SUPABASE_URL, SEND_SECRET } from '../marketing/data/backend.js'

export const ROTA_FN_URL = `${SUPABASE_URL}/functions/v1/rota`

async function call(payload, opts = {}) {
  const res = await fetch(ROTA_FN_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    // keepalive lets a small request survive the page being backgrounded/closed
    // (used for availability saves so a mark isn't lost on unload). Only for tiny
    // payloads — the browser caps total keepalive body size (~64 KB).
    ...(opts.keepalive ? { keepalive: true } : {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// Roles a staff member can hold (kept in sync with the edge function + data.js).
export const STAFF_ROLES = ['Bar Staff', 'Kitchen / Barback', 'Supervisor', 'Asst. Manager', 'Manager']

// ── Founder admin (gated /ops) ───────────────────────────────────────────────
export const rotaAdmin = () => call({ action: 'admin', secret: SEND_SECRET })
export const rotaAddStaff = (staff) => call({ action: 'addStaff', secret: SEND_SECRET, ...staff })
export const rotaSaveStaff = (id, patch) => call({ action: 'saveStaff', secret: SEND_SECRET, id, ...patch })
export const rotaRemoveStaff = (id) => call({ action: 'removeStaff', secret: SEND_SECRET, id })
export const rotaRemindStaff = (id) => call({ action: 'remindStaff', secret: SEND_SECRET, id })   // email their login link

// Rota calendar: full founder view (staff + upcoming shifts + claims) + release/assign.
export const rotaLoad = () => call({ action: 'load', secret: SEND_SECRET })
export const rotaReleaseMonth = (month, headcount) => call({ action: 'releaseMonth', secret: SEND_SECRET, month, headcount })
export const rotaOpenDay = (date, headcount) => call({ action: 'openDay', secret: SEND_SECRET, date, headcount })
export const rotaAddShift = (date, patch) => call({ action: 'addShift', secret: SEND_SECRET, date, ...patch })   // custom shift: {start_min,end_min,headcount,ability,min_rank,label}
export const rotaEditShift = (shiftId, patch) => call({ action: 'editShift', secret: SEND_SECRET, shiftId, ...patch })   // edit times/name: {start_min,end_min,label}
export const rotaSaveDayRoster = (date, blocks, allowClear = false) => call({ action: 'saveDayRoster', secret: SEND_SECRET, date, blocks, allowClear })   // full-replace a day; allowClear needed to empty a day

// Shift notes — founder briefings (pop up for staff) + staff handover notes.
export const rotaAddDayNote = (date, body) => call({ action: 'addDayNote', secret: SEND_SECRET, date, body })
export const rotaDeleteDayNote = (id) => call({ action: 'deleteDayNote', secret: SEND_SECRET, id })
export const rotaAddShiftNote = (token, date, body) => call({ action: 'addShiftNote', token, date, body })
export const rotaDeleteShiftNote = (token, id) => call({ action: 'deleteShiftNote', token, id })

// Daily clock-in hub — the shared /today link.
export const rotaTodayRoster = () => call({ action: 'todayRoster' })                              // public: who's on today + clock status
export const rotaClockLogin = (staffId, password) => call({ action: 'clockLogin', staffId, password })   // tap name + password → token
export const rotaClockIn = (token, fix) => call({ action: 'clockIn', token, fix })    // fix = {lat,lng,accuracy} | null (venue-presence check)
export const rotaClockOut = (token, fix) => call({ action: 'clockOut', token, fix })
export const rotaSetClock = (staffId, date, patch) => call({ action: 'setClock', secret: SEND_SECRET, staffId, date, ...patch })   // founder adjust/approve
export const rotaCloseShift = (shiftId) => call({ action: 'closeShift', secret: SEND_SECRET, shiftId })
export const rotaSetHeadcount = (shiftId, headcount) => call({ action: 'setHeadcount', secret: SEND_SECRET, shiftId, headcount })
export const rotaAssign = (shiftId, staffId) => call({ action: 'assignShift', secret: SEND_SECRET, shiftId, staffId })
export const rotaUnassign = (shiftId, staffId) => call({ action: 'unassignShift', secret: SEND_SECRET, shiftId, staffId })
export const rotaSetShiftReq = (shiftId, patch) => call({ action: 'setShiftReq', secret: SEND_SECRET, shiftId, ...patch })

// ── Venue clock-in lock (founder, secret-gated) ──────────────────────────────
// Restrict clock-in/out to "at the venue" via venue-wifi IP and/or GPS geofence.
export const rotaGetVenueConfig = () => call({ action: 'getVenueConfig', secret: SEND_SECRET })
export const rotaSetVenueConfig = (config) => call({ action: 'setVenueConfig', secret: SEND_SECRET, config })   // {enabled,mode,venue_ip,venue_lat,venue_lng,radius_m}
export const rotaSetVenueLocation = (fix, opts = {}) => call({ action: 'setVenueLocation', secret: SEND_SECRET, fix, ...opts })   // opts: {alsoSetIp,radius_m,mode,enabled}
export const rotaTestPresence = (fix) => call({ action: 'testPresence', secret: SEND_SECRET, fix })   // dry-run "am I detected on-site?"

// ── AI-rota rules (founder, secret-gated) — editable hours / staffing / holidays ─
export const rotaGetRotaRules = () => call({ action: 'getRotaRules', secret: SEND_SECRET })
export const rotaSetRotaRules = (rules) => call({ action: 'setRotaRules', secret: SEND_SECRET, rules })   // full rules object, or {} to reset to defaults
export const rotaCompileRules = (rules) => call({ action: 'compileRules', secret: SEND_SECRET, rules })   // AI reads houseRules → compiled directives, then saves the whole object
export const rotaSetStaffAvailability = (staffId, month, data) => call({ action: 'setStaffAvailability', secret: SEND_SECRET, staffId, month, data })   // founder edits a staffer's availability

// ── Staff portal (token-authed — login issues the token) ─────────────────────
export const rotaLogin = (name, password) => call({ action: 'login', name, password })   // name + password (same as the /today tap-your-name login)
export const rotaSignup = (name, email, password, code) => call({ action: 'signup', name, email, password, code })
export const rotaMe = (token) => call({ action: 'me', token })
export const rotaMyState = (token) => call({ action: 'myState', token })
export const rotaSaveProfile = (token, patch) => call({ action: 'saveProfile', token, ...patch })
export const rotaSaveAvailability = (token, month, data) => call({ action: 'saveAvailability', token, month, data }, { keepalive: true })
export const rotaClaimShift = (token, shiftId) => call({ action: 'claimShift', token, shiftId })
export const rotaReleaseShift = (token, shiftId) => call({ action: 'releaseShift', token, shiftId })
export const rotaGetChecklist = (token, date, key) => call({ action: 'getChecklist', token, date, key })
export const rotaToggleChecklist = (token, date, key, item, on) => call({ action: 'saveChecklist', token, date, key, toggle: { item, on } })
export const rotaSaveChecklistMeta = (token, date, key, note, submit) => call({ action: 'saveChecklist', token, date, key, note, submit })

// The day's reservations (all staff) + the shared "they've arrived" tick.
// The /ops founder screen calls the same actions with the secret instead of a
// token, so a tick made anywhere shows everywhere.
export const rotaReservationsToday = (token, date) => call({ action: 'reservationsToday', token, date })
export const rotaReservationArrive = (token, kind, refId, date, on) => call({ action: 'reservationArrive', token, kind, refId, date, on })
export const opsReservationArrive = (kind, refId, date, on) => call({ action: 'reservationArrive', secret: SEND_SECRET, kind, refId, date, on })

export const rotaCompleteTraining = (token, itemKey) => call({ action: 'completeTraining', token, itemKey })
export const rotaUncompleteTraining = (token, itemKey) => call({ action: 'uncompleteTraining', token, itemKey })

// Onboarding — sign the statement of intent + upload passport / right-to-work.
export const rotaSignStatement = (token, signature) => call({ action: 'signStatement', token, signature })
export const rotaUploadDoc = (token, kind, data) => call({ action: 'uploadDoc', token, kind, data })
export const rotaGetDoc = (staffId, kind) => call({ action: 'getDoc', secret: SEND_SECRET, staffId, kind })

// Training docs — the built-in seed is the default; founder edits override it.
export const rotaGetTrainingDoc = (moduleKey) => call({ action: 'getTrainingDoc', moduleKey })
export const rotaSaveTrainingDoc = (moduleKey, content) => call({ action: 'saveTrainingDoc', secret: SEND_SECRET, moduleKey, content })
export const rotaResetTrainingDoc = (moduleKey) => call({ action: 'resetTrainingDoc', secret: SEND_SECRET, moduleKey })

// Menus — list (light), fetch one (data); founder upload/delete.
export const rotaMenus = () => call({ action: 'menus' })
export const rotaGetMenu = (id) => call({ action: 'getMenu', id })
export const rotaAddMenu = (title, kind, data) => call({ action: 'addMenu', secret: SEND_SECRET, title, kind, data })
export const rotaDeleteMenu = (id) => call({ action: 'deleteMenu', secret: SEND_SECRET, id })

// Founder: recent checklist submissions + all training completions.
export const rotaChecklistLog = (days) => call({ action: 'checklistLog', secret: SEND_SECRET, days })
export const rotaTrainingLog = () => call({ action: 'trainingLog', secret: SEND_SECRET })
