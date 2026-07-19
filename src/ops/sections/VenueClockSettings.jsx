import React, { useEffect, useState } from 'react'
import { rotaGetVenueConfig, rotaSetVenueConfig, rotaSetVenueLocation, rotaTestPresence } from '../../rota/api.js'
import { getFix, presenceBadge } from '../../rota/geo.js'

// ─── Venue clock-in check (founder settings) ─────────────────────────────────
// Staff clock-in/out is checked against the venue: on the venue Wi-Fi (IP match)
// OR within a GPS radius. Off-site punches are ALLOWED but flagged (never blocked,
// unless the founder turns on the advanced "also block" toggle). Config lives in
// the venue_presence table — the founder pastes the setup SQL once, then pins the
// venue by standing inside the bar and tapping "Pin to my location".

const GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33'
const CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'

const SETUP_SQL = `-- No Dice venue clock-in check — paste this whole block into the
-- Supabase SQL editor and click Run. Safe to run more than once.
create table if not exists venue_presence (
  id            int primary key default 1,
  enabled       boolean not null default false,
  mode          text    not null default 'warn',   -- 'warn' (flag only) or 'block'
  venue_ip      text,
  venue_ip6     text,
  venue_lat     numeric,
  venue_lng     numeric,
  radius_m      int     not null default 150,
  ip_history    jsonb   not null default '[]'::jsonb,
  updated_at    timestamptz not null default now(),
  constraint venue_presence_singleton check (id = 1)
);
insert into venue_presence (id) values (1) on conflict (id) do nothing;

alter table shift_clock add column if not exists ip           text;
alter table shift_clock add column if not exists lat          numeric;
alter table shift_clock add column if not exists lng          numeric;
alter table shift_clock add column if not exists accuracy_m   numeric;
alter table shift_clock add column if not exists presence     text;
alter table shift_clock add column if not exists presence_out text;`

export default function VenueClockSettings() {
  const [config, setConfig] = useState(null)
  const [ready, setReady] = useState(true)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')          // '' | 'pin' | 'test' | 'save'
  const [err, setErr] = useState('')
  const [test, setTest] = useState(null)         // last "check my location" result
  const [ipDraft, setIpDraft] = useState('')
  const [radiusDraft, setRadiusDraft] = useState('')
  const [showSql, setShowSql] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await rotaGetVenueConfig()
      setConfig(r.config); setReady(r.ready)
      setIpDraft(r.config?.venue_ip || ''); setRadiusDraft(String(r.config?.radius_m ?? 150))
      setErr('')
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const save = async (patch, tag = 'save') => {
    setBusy(tag); setErr('')
    try { const r = await rotaSetVenueConfig(patch); setConfig(r.config); setReady(true) }
    catch (e) { setErr(e.message) } finally { setBusy('') }
  }

  const pin = async () => {
    setBusy('pin'); setErr(''); setTest(null)
    const fix = await getFix()
    if (!fix) { setErr('Could not read your location — allow location access for this site and try again (best done on your phone, standing in the bar).'); setBusy(''); return }
    try {
      const r = await rotaSetVenueLocation(fix, { alsoSetIp: true })
      setConfig(r.config); setReady(true)
      setTest({ pinned: true, accuracy: fix.accuracy, ip: r.capturedIp })
    } catch (e) { setErr(e.message) } finally { setBusy('') }
  }

  const checkNow = async () => {
    setBusy('test'); setErr(''); setTest(null)
    const fix = await getFix()
    try { const r = await rotaTestPresence(fix); setTest({ ...r, accuracy: fix?.accuracy ?? null }) }
    catch (e) { setErr(e.message) } finally { setBusy('') }
  }

  const copySql = async () => { try { await navigator.clipboard.writeText(SETUP_SQL); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ } }

  const on = !!config?.enabled
  const hasCoords = config?.venue_lat != null && config?.venue_lng != null
  const hasIp = !!config?.venue_ip
  const blockMode = config?.mode === 'block'

  if (loading) return <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', padding: 20 }}>Loading…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      <div>
        <div className="serif" style={{ fontSize: 20, color: '#fff' }}>📍 Venue clock-in check</div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 3, lineHeight: 1.5 }}>
          Staff can only be confirmed "at No Dice" when they're on the venue Wi-Fi <em>or</em> standing within {config?.radius_m ?? 150}m by GPS.
          Off-site clock-ins still go through — they're just <strong style={{ color: '#fff' }}>flagged for you</strong>, never blocked.
        </div>
      </div>

      {err && <div style={{ fontSize: 12.5, color: '#F87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 8, padding: '9px 12px' }}>{err}</div>}

      {!ready && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: `1px solid ${AMBER}66`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: AMBER, marginBottom: 4 }}>⚠️ One-time setup needed</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 10 }}>
            Paste the setup code below into your Supabase SQL editor and click Run — that creates the storage this feature needs. It only takes a moment and is safe to run again.
          </div>
          <button onClick={copySql} style={btn('gold')}>{copied ? 'Copied ✓' : '📋 Copy the setup SQL'}</button>
          <pre style={preStyle}>{SETUP_SQL}</pre>
        </div>
      )}

      {/* Status + master switch */}
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{on ? '🟢 Check is ON' : '⚪ Check is OFF'}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              {on ? 'Every clock-in is being location-checked and flagged.' : 'Clock-ins work as normal, with no location check.'}
            </div>
          </div>
          <button onClick={() => save({ enabled: !on }, 'save')} disabled={busy === 'save' || !ready || !hasCoords} style={on ? btn('ghost') : btn('gold')}
            title={!hasCoords ? 'Pin the venue location first' : ''}>
            {busy === 'save' ? '…' : on ? 'Turn off' : 'Turn on'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 12 }}>
          <span style={{ color: hasCoords ? GREEN : 'rgba(255,255,255,0.45)' }}>{hasCoords ? '✓' : '○'} GPS point {hasCoords ? 'set' : 'not set'}</span>
          <span style={{ color: hasIp ? GREEN : 'rgba(255,255,255,0.45)' }}>{hasIp ? '✓' : '○'} Venue Wi-Fi {hasIp ? `set (${config.venue_ip})` : 'not set'}</span>
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>Radius {config?.radius_m ?? 150}m</span>
          <span style={{ color: blockMode ? AMBER : 'rgba(255,255,255,0.55)' }}>{blockMode ? '🚫 also blocks off-site' : '🚩 flags only'}</span>
        </div>
      </div>

      {/* Pin the venue */}
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>1 · Pin where No Dice is</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 10 }}>
          Do this <strong style={{ color: '#fff' }}>once, on your phone, standing inside the bar and on the venue Wi-Fi</strong>. It saves this exact spot as "the venue" and captures the Wi-Fi in one tap.
        </div>
        <button onClick={pin} disabled={busy === 'pin' || !ready} style={btn('gold')}>{busy === 'pin' ? 'Getting your location…' : '📍 Pin No Dice to where I am now'}</button>
        {hasCoords && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>Currently pinned at {Number(config.venue_lat).toFixed(5)}, {Number(config.venue_lng).toFixed(5)}{config.updated_at ? ` · updated ${new Date(config.updated_at).toLocaleDateString('en-GB')}` : ''}</div>}
        {test?.pinned && <div style={{ fontSize: 12, color: GREEN, marginTop: 8 }}>✓ Pinned (±{test.accuracy}m accuracy){test.ip ? ` · captured Wi-Fi ${test.ip}` : ' · no Wi-Fi captured — are you on the venue Wi-Fi?'}</div>}
      </div>

      {/* Test my location */}
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>2 · Check what the system sees</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 10 }}>Runs the exact check a staff clock-in would — without recording anything.</div>
        <button onClick={checkNow} disabled={busy === 'test' || !ready} style={btn('ghost')}>{busy === 'test' ? 'Checking…' : '🧭 Check my location now'}</button>
        {test && !test.pinned && (() => {
          const pb = presenceBadge(test.label)
          const ipMatch = test.ip && config?.venue_ip && test.ip === config.venue_ip
          return (
            <div style={{ marginTop: 10, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              <div>Result: {pb ? <strong style={{ color: pb.color }}>{pb.icon} {pb.text}</strong> : <strong style={{ color: 'rgba(255,255,255,0.5)' }}>check is off</strong>}</div>
              {test.distance != null && <div>Distance from venue: <strong style={{ color: '#fff' }}>{test.distance}m</strong>{test.accuracy != null ? ` (±${test.accuracy}m)` : ''}</div>}
              <div>Your Wi-Fi/IP: <strong style={{ color: '#fff' }}>{test.ip || 'unknown'}</strong> {ipMatch ? <span style={{ color: GREEN }}>· matches venue ✓</span> : <span style={{ color: 'rgba(255,255,255,0.45)' }}>· not the venue Wi-Fi</span>}</div>
            </div>
          )
        })()}
      </div>

      {/* Advanced */}
      <details style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '0 14px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', padding: '14px 0' }}>⚙️ Advanced settings</summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 14 }}>
          <div>
            <label style={lbl}>Radius (metres)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={radiusDraft} onChange={e => setRadiusDraft(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" style={inp(110)} />
              <button onClick={() => save({ radius_m: Math.max(30, Math.min(2000, Number(radiusDraft) || 150)) }, 'save')} disabled={busy === 'save'} style={btn('ghost')}>Save radius</button>
            </div>
            <div style={hint}>How close counts as "at the venue". 150m is a good default — tighter risks false flags from GPS drift indoors.</div>
          </div>
          <div>
            <label style={lbl}>Venue Wi-Fi address (IP)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={ipDraft} onChange={e => setIpDraft(e.target.value.trim())} placeholder="e.g. 81.2.69.144" style={inp(180)} />
              <button onClick={() => save({ venue_ip: ipDraft }, 'save')} disabled={busy === 'save'} style={btn('ghost')}>Save IP</button>
            </div>
            <div style={hint}>Usually captured automatically when you pin the venue. Set manually only if your broadband gives you a fixed (static) IP.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Also block clearly off-site clock-ins</div>
              <div style={hint}>Off by default (your choice — off-site is allowed but flagged). If on, someone with a good GPS fix more than 1km away can't clock in.</div>
            </div>
            <button onClick={() => save({ mode: blockMode ? 'warn' : 'block' }, 'save')} disabled={busy === 'save'} style={blockMode ? btn('gold') : btn('ghost')}>{blockMode ? 'On' : 'Off'}</button>
          </div>
          <button onClick={() => setShowSql(s => !s)} style={{ ...btn('ghost'), alignSelf: 'flex-start' }}>{showSql ? 'Hide' : 'Show'} setup SQL</button>
          {showSql && (<><button onClick={copySql} style={{ ...btn('ghost'), alignSelf: 'flex-start' }}>{copied ? 'Copied ✓' : '📋 Copy'}</button><pre style={preStyle}>{SETUP_SQL}</pre></>)}
        </div>
      </details>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
        <strong style={{ color: '#fff' }}>Worth knowing:</strong> this is a deterrent, not a lock — it makes clocking in from home inconvenient and visible, but a determined person could fake a location. If your broadband IP changes (router reboot), just tap "Pin" again from the bar to re-capture the Wi-Fi. A fixed/static IP from your provider (~£5–15/mo) makes the Wi-Fi check rock-solid.
      </div>
    </div>
  )
}

const btn = (kind) => {
  const base = { padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: RED, color: '#fff' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
}
const inp = (w) => ({ width: w, padding: '8px 10px', fontSize: 13, borderRadius: 8, background: '#000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none' })
const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }
const hint = { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6, lineHeight: 1.45 }
const preStyle = { marginTop: 10, padding: 12, background: '#000', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, fontSize: 10.5, color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap', overflowX: 'auto', fontFamily: 'ui-monospace, monospace', lineHeight: 1.5 }
