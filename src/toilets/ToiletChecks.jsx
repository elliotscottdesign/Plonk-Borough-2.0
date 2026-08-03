import React, { useEffect, useState, useCallback } from 'react'
import { toiletStatus, toiletComplete, enableReminders, reminderState, pushSupported } from './api.js'

// Staff-facing toilet-hygiene screen (/toilets). The push reminder deep-links
// here. Any signed-in team member can (a) turn reminders on for their phone and
// (b) tap "Done" to clear the current 2-hour check for everyone.
const TOKEN_KEY = 'nd_rota_token'          // set by the rota portal / today hub
const GOLD = '#C9A84C', GREEN = '#34D399', CREAM = '#F5F5F0', DIM = 'rgba(245,245,240,0.6)'

const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = () =>
  (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
  (typeof navigator !== 'undefined' && navigator.standalone === true)

export default function ToiletChecks() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  const [status, setStatus] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [rs, setRs] = useState({ supported: pushSupported(), permission: 'default', subscribed: false })
  const [enabling, setEnabling] = useState(false)
  const [enableMsg, setEnableMsg] = useState('')
  const [enableErr, setEnableErr] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    try { setStatus(await toiletStatus(token)); setErr('') }
    catch (e) { setErr(e.message || 'Could not load') }
  }, [token])

  useEffect(() => { load(); const t = setInterval(load, 60_000); return () => clearInterval(t) }, [load])
  useEffect(() => { reminderState().then(setRs) }, [])

  const markDone = async () => {
    if (busy) return
    setBusy(true); setErr('')
    try { await toiletComplete(token); await load() }
    catch (e) { setErr(e.message || 'Could not save') }
    finally { setBusy(false) }
  }

  const turnOn = async () => {
    setEnabling(true); setEnableErr(''); setEnableMsg('')
    try {
      await enableReminders(token)
      setEnableMsg('Reminders are on for this phone.')
      setRs(await reminderState())
    } catch (e) { setEnableErr(e.message || 'Could not turn on reminders') }
    finally { setEnabling(false) }
  }

  const wrap = { minHeight: '100dvh', background: '#0A0A0F', color: CREAM, fontFamily: "'DM Sans', sans-serif",
    padding: '28px 18px calc(40px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center' }
  const card = { width: '100%', maxWidth: 460, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 22, marginTop: 16 }

  if (!token) {
    return (
      <div style={wrap}>
        <div style={{ maxWidth: 460, textAlign: 'center', marginTop: 40 }}>
          <div style={{ fontSize: 40 }}>🚻</div>
          <h1 className="serif" style={{ color: GOLD, fontSize: 24, margin: '10px 0 8px' }}>Toilet checks</h1>
          <p style={{ color: DIM, lineHeight: 1.6 }}>Sign in first on the daily hub, then come back to this page.</p>
          <a href="/today" style={{ display: 'inline-block', marginTop: 16, background: GOLD, color: '#0A0A0F',
            textDecoration: 'none', padding: '13px 22px', borderRadius: 10, fontWeight: 700 }}>Go to sign-in →</a>
        </div>
      </div>
    )
  }

  const done = status?.done
  const win = status ? `${status.startLabel}–${status.endLabel}` : ''
  const iosNeedsInstall = isIOS() && !isStandalone()

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>🚻</div>
        <h1 className="serif" style={{ color: GOLD, fontSize: 24, margin: '10px 0 4px' }}>Toilet hygiene check</h1>
        <p style={{ color: DIM, fontSize: 13, letterSpacing: '0.04em' }}>Every 2 hours while the bar is open</p>
      </div>

      {/* Current window */}
      <div style={{ ...card, textAlign: 'center' }}>
        {!status ? (
          <p style={{ color: DIM }}>Loading…</p>
        ) : done ? (
          <>
            <div style={{ fontSize: 34 }}>✅</div>
            <p style={{ fontSize: 17, margin: '8px 0 4px', color: GREEN, fontWeight: 700 }}>Done for this window</p>
            <p style={{ color: DIM, fontSize: 14, lineHeight: 1.5 }}>
              {status.doneByName ? <>Cleaned by <strong style={{ color: CREAM }}>{status.doneByName}</strong>. </> : null}
              Next check due at <strong style={{ color: CREAM }}>{status.nextDueLabel}</strong>.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 15, color: DIM, margin: '0 0 4px' }}>This window</p>
            <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px' }}>{win}</p>
            <button onClick={markDone} disabled={busy} style={{
              width: '100%', padding: '18px', fontSize: 17, fontWeight: 800, borderRadius: 12, cursor: 'pointer',
              background: busy ? 'rgba(52,211,153,0.4)' : GREEN, color: '#06281C', border: 'none' }}>
              {busy ? 'Saving…' : '✔ Done — toilets cleaned'}
            </button>
            <p style={{ color: DIM, fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>
              Tapping this stops the reminder going to everyone else on shift until the next check.
            </p>
          </>
        )}
        {err && <p style={{ color: '#F87171', fontSize: 13, marginTop: 12 }}>{err}</p>}
      </div>

      {/* Reminder opt-in */}
      <div style={card}>
        <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>📲 Reminders on this phone</p>
        {!rs.supported ? (
          <p style={{ color: DIM, fontSize: 13.5, lineHeight: 1.6 }}>
            This browser can’t receive push reminders. Open the hub in Chrome (Android) or add it to your Home Screen (iPhone).
          </p>
        ) : iosNeedsInstall ? (
          <p style={{ color: DIM, fontSize: 13.5, lineHeight: 1.6 }}>
            On iPhone, tap the <strong style={{ color: CREAM }}>Share</strong> button then
            <strong style={{ color: CREAM }}> “Add to Home Screen”</strong>, open No Dice from that icon, and the
            <em> Turn on reminders</em> button will appear here.
          </p>
        ) : rs.subscribed ? (
          <p style={{ color: GREEN, fontSize: 13.5, lineHeight: 1.6 }}>✅ Reminders are on. You’ll get a nudge each time a check is due.</p>
        ) : (
          <>
            <p style={{ color: DIM, fontSize: 13.5, lineHeight: 1.6, margin: '0 0 12px' }}>
              Get a push alert on this phone each time the 2-hourly check is due.
            </p>
            <button onClick={turnOn} disabled={enabling} style={{
              width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 10, cursor: 'pointer',
              background: enabling ? 'rgba(201,168,76,0.4)' : GOLD, color: '#0A0A0F', border: 'none' }}>
              {enabling ? 'Turning on…' : 'Turn on reminders'}
            </button>
          </>
        )}
        {enableMsg && <p style={{ color: GREEN, fontSize: 13, marginTop: 10 }}>{enableMsg}</p>}
        {enableErr && <p style={{ color: '#F87171', fontSize: 13, marginTop: 10 }}>{enableErr}</p>}
      </div>

      {status && !status.clockedIn && (
        <p style={{ color: DIM, fontSize: 12.5, marginTop: 16, maxWidth: 460, textAlign: 'center', lineHeight: 1.5 }}>
          You’re not clocked in right now — reminders only go to staff who are on shift.
        </p>
      )}
    </div>
  )
}
