import React, { useState, useEffect } from 'react'
import { rotaTodayRoster, rotaClockLogin } from './api.js'
import { fmtMin } from './shifts.js'

// ─── Daily clock-in hub (/today) ─────────────────────────────────────────────
// The one link the team opens each shift (shared in WhatsApp). It shows who's
// rostered TODAY and their live clock status. Tap your name → password → you're
// signed in and sent to your portal, where you Start / End your shift.

const RED = '#DA1B33', GREEN = '#34D399', CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'
const TOKEN_KEY = 'nd_rota_token'

const initials = (name) => (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
const hueOf = (name) => [...(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360

export default function DailyHub() {
  const [roster, setRoster] = useState([])
  const [date, setDate] = useState('')
  const [ready, setReady] = useState(false)
  const [pick, setPick] = useState(null)   // { staffId, first, name }
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    document.body.style.background = '#000'; document.body.style.color = '#fff'; document.title = 'No Dice · Today'
    load()
  }, [])
  const load = async () => {
    try { const r = await rotaTodayRoster(); setRoster(r.roster || []); setDate(r.date || '') }
    catch (e) { setErr(e.message) } finally { setReady(true) }
  }

  const signIn = async () => {
    if (!pw) { setErr('Enter your password.'); return }
    setBusy(true); setErr('')
    try {
      const r = await rotaClockLogin(pick.staffId, pw)
      localStorage.setItem(TOKEN_KEY, r.token)
      window.location.href = '/rota'   // into the portal → note pop-up + Start my shift
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const statusOf = (r) => {
    if (r.clockOut) return { txt: '✅ Finished', color: 'rgba(255,255,255,0.5)' }
    if (r.clockIn) { const t = new Date(r.clockIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); return { txt: `🟢 On shift · in ${t}`, color: GREEN } }
    return { txt: '⚪ Not started', color: 'rgba(255,255,255,0.45)' }
  }
  const dateLabel = date ? new Date(date + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) : ''

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 460, margin: '0 auto', padding: '4vh 18px 40px' }}>
        <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 190, maxWidth: '66%', display: 'block', margin: '0 auto 10px' }} />
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: RED, fontWeight: 700 }}>Today's shift</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{dateLabel}</div>
        </div>

        {!ready ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '30px 0' }}>Loading…</div>
        ) : roster.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', padding: '24px 0', lineHeight: 1.6 }}>
            No one's on the rota for today yet.<br />
            <a href="/rota" style={{ color: RED, fontWeight: 700 }}>Log in to your portal →</a>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 14 }}>Tap your name to clock in for your shift.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {roster.map(r => {
                const st = statusOf(r)
                return (
                  <button key={r.staffId} onClick={() => { setPick(r); setPw(''); setErr('') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 12, cursor: 'pointer', color: '#fff' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `hsl(${hueOf(r.name)} 42% 26%)`, color: '#fff', fontSize: 15, fontWeight: 700 }}>{initials(r.name)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{r.first}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{fmtMin(r.start_min)}–{fmtMin(r.end_min)}</div>
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: st.color, whiteSpace: 'nowrap' }}>{st.txt}</div>
                  </button>
                )
              })}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12 }}>
              <a href="/rota" style={{ color: 'rgba(255,255,255,0.5)' }}>Not on today? Log in here →</a>
            </div>
          </>
        )}
      </div>

      {pick && (
        <div onClick={() => setPick(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5vh 18px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: CARD, border: `1px solid ${RED}`, borderRadius: 16, padding: 22, maxWidth: 360, width: '100%' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>Hi {pick.first} 👋</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>Enter your password to clock in.</div>
            <form onSubmit={e => { e.preventDefault(); signIn() }}>
              <input value={pw} onChange={e => setPw(e.target.value)} type="password" autoFocus placeholder="Password" autoComplete="current-password"
                style={{ width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 10, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              {err && <div style={{ fontSize: 12.5, color: '#F87171', marginTop: 8 }}>{err}</div>}
              <button type="submit" disabled={busy} style={{ width: '100%', padding: 13, marginTop: 14, borderRadius: 10, border: 'none', background: RED, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>{busy ? 'Signing in…' : 'Sign in →'}</button>
            </form>
            <button onClick={() => setPick(null)} style={{ width: '100%', padding: 10, marginTop: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
