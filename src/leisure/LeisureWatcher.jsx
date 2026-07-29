import React, { useEffect, useState, useCallback } from 'react'
import { leisureLive, leisureSetEnabled } from './api.js'

// Leisure Watch — founder-only page (gated by 888999 in App.jsx).
// Live board of open London Fields Lido adult swim slots + the watcher on/off
// switch + recent alert history. Reading availability needs no login; booking
// still happens by hand in the Better/GLL system (the Book buttons deep-link there).

const fmtDay = (date) =>
  new Date(date + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  })
const fmtWhen = (iso) => {
  try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}
const shortName = (n) => (/fitness/i.test(n) ? 'Lanes' : /all/i.test(n) ? 'General' : n)

export default function LeisureWatcher() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setErr('')
      const d = await leisureLive()
      setData(d)
    } catch (e) {
      setErr(e.message || 'Could not reach the watcher')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 60000)   // refresh the board every 60s
    return () => clearInterval(t)
  }, [load])

  const toggle = async () => {
    if (!data) return
    setSaving(true)
    try {
      const next = !data.enabled
      const r = await leisureSetEnabled(next)
      setData((d) => ({ ...d, enabled: r.enabled }))
    } catch (e) {
      setErr(e.message || 'Could not update the watcher')
    } finally {
      setSaving(false)
    }
  }

  // Group open slots by date for the board.
  const open = data?.openSlots || []
  const byDate = {}
  for (const s of open) (byDate[s.date] ||= []).push(s)
  const dates = Object.keys(byDate).sort()

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--ink)', color: 'var(--cream)', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)' }}>No Dice · Leisure Watch</div>
            <h1 className="serif" style={{ fontSize: 30, margin: '6px 0 2px', color: 'var(--cream)' }}>London Fields Lido</h1>
            <div style={{ fontSize: 13, color: 'var(--cream-dim)' }}>Adult lanes &amp; general swim · next 14 days</div>
          </div>
          <a href="/" style={{ fontSize: 11, color: 'var(--cream-dim)', letterSpacing: '0.14em', textDecoration: 'none', paddingTop: 6 }}>← nodice.bar</a>
        </div>

        <div className="gold-rule" style={{ margin: '20px 0' }} />

        {/* Watcher switch */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)' }}>
              Email alerts {data?.enabled ? 'are on' : 'are off'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--cream-dim)', marginTop: 3, maxWidth: 420 }}>
              Checks every minute. Emails elliot@nodice.bar the moment a cancellation frees a spot or a new session is released.
            </div>
          </div>
          <button onClick={toggle} disabled={saving || !data} aria-label="Toggle alerts"
            style={{ position: 'relative', width: 54, height: 30, borderRadius: 30, border: 'none', cursor: saving ? 'wait' : 'pointer',
              background: data?.enabled ? 'var(--teal)' : 'rgba(255,255,255,0.18)', transition: 'background .2s', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: data?.enabled ? 27 : 3, width: 24, height: 24, borderRadius: '50%',
              background: '#fff', transition: 'left .2s' }} />
          </button>
        </div>

        {/* Available now */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '30px 0 12px' }}>
          <h2 className="serif" style={{ fontSize: 20, margin: 0, color: 'var(--gold)' }}>Available now</h2>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>
            {loading ? 'checking…' : data?.checkedAt ? `checked ${fmtWhen(data.checkedAt)}` : ''}
          </div>
        </div>

        {err && (
          <div style={{ background: 'rgba(218,27,51,0.12)', border: '1px solid rgba(218,27,51,0.4)', color: '#F3B4BD',
            borderRadius: 10, padding: '12px 14px', fontSize: 13, marginBottom: 14 }}>{err}</div>
        )}

        {!loading && !err && open.length === 0 && (
          <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
            padding: '28px 20px', textAlign: 'center', color: 'var(--cream-dim)', fontSize: 14 }}>
            Every session in the next 14 days is full right now.<br />
            <span style={{ fontSize: 12.5 }}>The watcher will email you the instant one opens.</span>
          </div>
        )}

        {dates.map((d) => (
          <div key={d} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)', margin: '4px 0 8px' }}>{fmtDay(d)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byDate[d].map((s) => (
                <div key={s.slot_key} style={{ display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)', minWidth: 96 }}>{s.starts_at}–{s.ends_at}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: /fitness/i.test(s.name) ? 'var(--gold)' : 'var(--teal)' }}>{shortName(s.name)}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--cream-dim)', marginLeft: 8 }}>{s.spaces} space{s.spaces > 1 ? 's' : ''}</span>
                  </div>
                  <a href={s.bookUrl} target="_blank" rel="noreferrer"
                    style={{ background: 'var(--gold)', color: 'var(--ink)', textDecoration: 'none', fontWeight: 700, fontSize: 13,
                      padding: '8px 16px', borderRadius: 8, flexShrink: 0 }}>Book →</a>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Recent alerts */}
        <h2 className="serif" style={{ fontSize: 20, margin: '34px 0 12px', color: 'var(--gold)' }}>Recent alerts</h2>
        {(!data?.alerts || data.alerts.length === 0) ? (
          <div style={{ fontSize: 13, color: 'var(--cream-dim)' }}>No alerts sent yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.alerts.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--cream-dim)',
                borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 2px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20,
                  color: '#fff', background: a.kind === 'cancellation' ? 'var(--teal)' : 'var(--gold-dim)' }}>
                  {a.kind === 'cancellation' ? 'Cancellation' : 'New release'}
                </span>
                <span style={{ color: 'var(--cream)' }}>{fmtDay(a.date)} · {a.starts_at}</span>
                <span>{shortName(a.name)}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11 }}>{fmtWhen(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 12, color: 'var(--cream-dim)', marginTop: 28, lineHeight: 1.6 }}>
          Booking and payment happen in the Better/GLL system — the Book button drops you straight onto the right day.
          This watcher only reads the public timetable, gently, once a minute.
        </p>
      </div>
    </div>
  )
}
