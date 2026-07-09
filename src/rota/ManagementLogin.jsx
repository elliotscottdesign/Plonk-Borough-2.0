import React, { useState } from 'react'
import { lookupAccess, applyAccessSession } from '../lib/access.js'

// ─── Management log-in (on /today) ───────────────────────────────────────────
// Staff tap their name to clock in; management taps here instead. Entering a
// management code (888999 — or the NDTEAM team code) unlocks the team hub and
// drops them on the team.nodice.bar landing page with Operations, DJ, Marketing
// & the investor decks available — no need to re-enter the code at each door.

const RED = '#DA1B33'
const CARD = '#0A0A0A'
const LINE = 'rgba(255,255,255,0.12)'

export default function ManagementLogin() {
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e?.preventDefault()
    const { candidate, access } = lookupAccess(pw)
    // A "management" code is any that unlocks the internal Operations hub
    // (888999 founder-tier, or the NDTEAM team code) — investor-only codes
    // don't get management access here.
    if (access && access.ops) {
      applyAccessSession(access, candidate)
      window.location.href = '/'          // team hub — doors now open straight through
    } else {
      setErr('That’s not a management code.')
    }
  }

  return (
    <>
      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <button onClick={() => { setOpen(true); setPw(''); setErr('') }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', letterSpacing: '0.02em' }}>
          🔑 Management log-in →
        </button>
      </div>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5vh 18px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: CARD, border: `1px solid ${RED}`, borderRadius: 16, padding: 22, maxWidth: 360, width: '100%' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2, color: '#fff' }}>Management log-in</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>Enter the management password to open the team hub.</div>
            <form onSubmit={submit}>
              <input value={pw} onChange={e => { setPw(e.target.value); setErr('') }} type="password" autoFocus placeholder="Password" autoComplete="off"
                style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 10, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              {err && <div style={{ fontSize: 12.5, color: '#F87171', marginTop: 8 }}>{err}</div>}
              <button type="submit" style={{ width: '100%', padding: 13, marginTop: 14, borderRadius: 10, border: 'none', background: RED, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Enter the hub →</button>
            </form>
            <button onClick={() => setOpen(false)} style={{ width: '100%', padding: 10, marginTop: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}
