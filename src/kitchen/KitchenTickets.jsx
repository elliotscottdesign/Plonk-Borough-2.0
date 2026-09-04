import React, { useEffect, useRef, useState } from 'react'
import { listOrders, setOrderStatus, listHistory, getStatus, setSettings, resendReady, textCustomer, markPaidAtBar } from './foodOrders.js'

// 🎫 Kitchen tickets / display. Live paid orders land here, ding on arrival, and
// tapping "Ready" texts the customer (the "food ready" message, sent server-side).
// Styled to match the On A Roll order page — cream/blue/red diner kit.
// Lives in /ops → Kitchen. Polls every 10s so a fresh order shows without a reload.

const BLUE = '#183fa0', RED = '#e0231b', GREEN = '#1f8a4d', INK = '#15305c', LINE = '#cabfa2', MUTED = 'rgba(255,255,255,0.55)'
const AMBER = '#E8B84B', STAFF = '#78716c'
const HEAVY = "Impact, 'Arial Narrow Bold', sans-serif"
const FLAG_MS = 12 * 60 * 1000    // flag any order still open past 12 minutes
const mmss = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export default function KitchenTickets() {
  const [orders, setOrders] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [sound, setSound] = useState(true)
  const [flashOn, setFlashOn] = useState(true)
  const [view, setView] = useState('live')   // 'live' | 'history' | 'failed'
  const [history, setHistory] = useState(null)
  const [pause, setPause] = useState(null)
  const [stats, setStats] = useState({ avgSec: null, count: 0, tipsPence: 0 })
  const [flash, setFlash] = useState(0)   // bumps on a new order → full-screen white flash
  const [, tick] = useState(0)
  const seen = useRef(new Set())
  const soundRef = useRef(true)
  const flashRef = useRef(true)
  const audioRef = useRef(null)
  const acting = useRef(new Set())          // order ids mid-action → ignore rapid re-taps
  const [soundReady, setSoundReady] = useState(false)
  useEffect(() => { soundRef.current = sound }, [sound])
  useEffect(() => { flashRef.current = flashOn }, [flashOn])

  // One shared AudioContext, resumed on a user gesture — browsers keep audio
  // SUSPENDED until the user interacts, which is why the ding wasn't firing.
  const ensureAudio = () => {
    try {
      if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = audioRef.current
      if (ctx.state === 'suspended') ctx.resume().then(() => setSoundReady(ctx.state === 'running')).catch(() => {})
      else setSoundReady(ctx.state === 'running')
      return ctx
    } catch { return null }
  }
  const beep = () => {
    if (!soundRef.current) return
    const ctx = ensureAudio()
    if (!ctx || ctx.state !== 'running') return
    try {
      const ping = (freq, t0, dur) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = freq
        const t = ctx.currentTime + t0
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
        o.start(t); o.stop(t + dur + 0.02)
      }
      ping(880, 0, 0.32); ping(1245, 0.16, 0.42)   // two-tone ding-dong
    } catch { /* ignore */ }
  }

  const load = async () => {
    try {
      const r = await listOrders(); const list = r.orders || []
      if (seen.current.size) { for (const o of list) { if (!seen.current.has(o.id) && o.status === 'new') { beep(); if (flashRef.current) setFlash(f => f + 1); break } } }
      for (const o of list) seen.current.add(o.id)
      setOrders(list); setErr('')
    } catch (e) { setErr(e.message); setOrders(o => (o == null ? [] : o)) }
  }
  const loadPause = async () => { try { setPause(await getStatus()) } catch { /* ignore */ } }
  // Avg time-to-service tonight: mean of (ready_at − created_at) over today's orders
  // that have been marked ready. Reads the order history (last 200).
  const loadStats = async () => {
    try {
      const r = await listHistory(); const now = new Date(); const orders = r.orders || []
      const done = orders.filter(o => o.ready_at && sameDay(new Date(o.created_at), now))
      const tipsPence = orders.filter(o => o.paid && sameDay(new Date(o.created_at), now)).reduce((s, o) => s + (o.tip_pence || 0), 0)
      const avgSec = done.length ? Math.round(done.reduce((s, o) => s + (new Date(o.ready_at) - new Date(o.created_at)), 0) / done.length / 1000) : null
      setStats({ avgSec, count: done.length, tipsPence })
    } catch { /* ignore */ }
  }
  useEffect(() => {
    load(); loadPause(); loadStats()
    const poll = setInterval(() => { load(); loadPause() }, 10000)
    const statsPoll = setInterval(loadStats, 30000)
    const clock = setInterval(() => tick(t => t + 1), 1000)
    const unlock = () => ensureAudio()   // first tap/key unlocks the ding
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => { clearInterval(poll); clearInterval(statsPoll); clearInterval(clock); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock) }
  }, [])   // eslint-disable-line

  // Instant, optimistic status change: update the card immediately, fire the server
  // call in the background, and IGNORE re-taps on the same order for 600ms so a
  // double-tap can't skip a step (e.g. collected before it's even cooked).
  const act = (o, status) => {
    if (acting.current.has(o.id)) return
    acting.current.add(o.id)
    setOrders(list => (list || []).map(x => x.id === o.id ? { ...x, status, ...(status === 'ready' ? { ready_at: new Date().toISOString() } : {}) } : x))
    setOrderStatus(o.id, status, '')
      .catch(e => { alert(e.message); load() })
      .finally(() => { setTimeout(() => { acting.current.delete(o.id); load(); loadStats() }, 600) })
  }
  const resend = async (o) => { setBusy(true); try { const r = await resendReady(o.id); alert(r.texted ? `Re-sent the “ready” text to ${o.customer_name || 'the customer'}.` : 'Could not send — check the number.') } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const reply = async (o) => { const m = prompt(`Text ${o.customer_name || 'the customer'} (Order #${o.order_no}):`, ''); if (!m || !m.trim()) return; setBusy(true); try { const r = await textCustomer(o.id, m.trim()); alert(r.texted ? 'Sent ✓' : 'Could not send — check the number.') } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const paidAtBar = async (o) => { setBusy(true); try { await markPaidAtBar(o.id); await load(); loadStats() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const openHistory = async () => { setView('history'); setHistory(null); try { const r = await listHistory(); setHistory(r.orders || []) } catch (e) { alert(e.message); setHistory([]) } }
  const togglePause = async () => { setBusy(true); try { setPause(await setSettings({ paused: !pause?.paused })) } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const setAuto = async (on) => { try { setPause(await setSettings({ auto_pause: on })) } catch (e) { alert(e.message) } }
  const setThreshold = async (n) => { try { setPause(await setSettings({ auto_threshold: Math.max(0, n) })) } catch (e) { alert(e.message) } }
  const setCloseTime = async (v) => { try { setPause(await setSettings({ close_hhmm: v })) } catch (e) { alert(e.message) } }

  if (orders == null) return <div style={{ color: MUTED, fontSize: 13, padding: '20px 0' }}>Loading orders…</div>

  const failed = orders.filter(o => o.status === 'card_failed')
  const active = orders.filter(o => o.status !== 'collected' && o.status !== 'card_failed')
  const flagged = active.filter(o => o.status !== 'ready' && o.code_kind !== 'staff' && Date.now() - new Date(o.created_at).getTime() > FLAG_MS)
  const avgColor = stats.avgSec == null ? MUTED : stats.avgSec > 12 * 60 ? RED : stats.avgSec > 8 * 60 ? AMBER : GREEN
  return (
    <div>
      <style>{`@keyframes oarflash{0%,100%{box-shadow:0 0 0 0 rgba(224,35,27,.65)}50%{box-shadow:0 0 0 5px rgba(224,35,27,0)}}@keyframes oarwhite{0%{opacity:.92}100%{opacity:0}}`}</style>
      {flash > 0 && <div key={flash} style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 9999, pointerEvents: 'none', animation: 'oarwhite 0.55s ease-out forwards' }} />}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ flex: '1 1 190px', background: '#0e0e10', border: `1px solid ${LINE}`, borderRadius: 12, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>⏱ Avg time to service · tonight</div>
          <div style={{ fontFamily: HEAVY, fontSize: 36, color: avgColor, lineHeight: 1.05 }}>{stats.avgSec == null ? '—' : mmss(stats.avgSec * 1000)}</div>
          <div style={{ fontSize: 11.5, color: MUTED }}>{stats.count ? `${stats.count} order${stats.count > 1 ? 's' : ''} served · target under 12:00` : 'no orders served yet'}</div>
        </div>
        <div style={{ flex: '1 1 150px', background: '#0e0e10', border: `1px solid ${LINE}`, borderRadius: 12, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💛 Tips tonight · kitchen</div>
          <div style={{ fontFamily: HEAVY, fontSize: 36, color: GREEN, lineHeight: 1.05 }}>£{(stats.tipsPence / 100).toFixed(2)}</div>
          <div style={{ fontSize: 11.5, color: MUTED }}>100% to the kitchen team</div>
        </div>
        {flagged.length > 0 && (
          <div style={{ flex: '1 1 190px', background: RED, borderRadius: 12, padding: '10px 14px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', animation: 'oarflash 1.2s infinite' }}>
            <div style={{ fontFamily: HEAVY, fontSize: 24, letterSpacing: '0.5px' }}>🚨 {flagged.length} over 12 min</div>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>#{flagged.map(o => o.order_no).join(', #')} — push these out</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[['live', `🎫 Live${active.length ? ` · ${active.length}` : ''}`], ['history', '📋 History'], ...(failed.length ? [['failed', `❌ Card failed · ${failed.length}`]] : [])].map(([k, l]) => (
          <button key={k} onClick={() => k === 'history' ? openHistory() : setView(k)}
            style={{ fontSize: 14, fontWeight: 800, background: view === k ? (k === 'failed' ? RED : BLUE) : 'none', border: `1px solid ${view === k ? (k === 'failed' ? RED : BLUE) : LINE}`, color: '#fff', borderRadius: 9, padding: '10px 16px', cursor: 'pointer' }}>{l}</button>
        ))}
        {sound && !soundReady && (
          <button onClick={() => { ensureAudio(); setTimeout(beep, 150) }} style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, background: AMBER, color: '#1a1a1a', border: 'none', borderRadius: 9, padding: '9px 14px', cursor: 'pointer', animation: 'oarflash 1.4s infinite' }}>🔊 Tap to enable sound</button>
        )}
        <label style={{ marginLeft: soundReady || !sound ? 'auto' : 0, fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={sound} onChange={e => { setSound(e.target.checked); if (e.target.checked) ensureAudio() }} /> Ding on new {sound && soundReady ? '🔊' : ''}
        </label>
        <label style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={flashOn} onChange={e => setFlashOn(e.target.checked)} /> ⚡ Flash on new
        </label>
      </div>

      {view === 'history' && <HistoryView history={history} />}

      {view === 'failed' && (
        <div>
          <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>Cards that declined — the customer may think they've ordered. Take the money at the bar and “make it”, text them, or dismiss.</div>
          {failed.length === 0
            ? <div style={{ color: MUTED, fontSize: 14, padding: '30px 0', textAlign: 'center' }}>No failed card payments right now.</div>
            : failed.map(o => {
                const its = (Array.isArray(o.items) ? o.items : []).map(it => `${it.qty}× ${it.name}`).join(', ')
                return (
                  <div key={o.id} style={{ background: '#fff', border: `2px solid ${RED}`, borderRadius: 12, padding: '13px 15px', marginBottom: 10, color: INK }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: HEAVY, fontSize: 24, color: RED }}>#{o.order_no}</span>
                      <span style={{ fontSize: 16, flex: 1, minWidth: 0 }}><b>{o.customer_name || '—'}</b> · {its || '—'} · <b>£{(o.total_pence / 100).toFixed(2)}</b></span>
                    </div>
                    {o.customer_note && <div style={{ fontSize: 14, color: BLUE, marginTop: 4 }}>📝 {o.customer_note}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
                      <button disabled={busy} onClick={() => paidAtBar(o)} style={{ ...btn(GREEN, '#fff'), flex: 2 }}>✓ Paid at bar — make it</button>
                      {o.customer_phone && <button disabled={busy} onClick={() => reply(o)} style={{ ...btn('#fff', BLUE, BLUE), flex: 1 }}>💬 Text</button>}
                      <button disabled={busy} onClick={() => act(o, 'cancelled')} style={{ ...btn('#fff', '#8a8275', LINE), flex: 1 }}>✕ Dismiss</button>
                    </div>
                  </div>
                )
              })}
        </div>
      )}

      {view === 'live' && <>
      {pause && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={togglePause} disabled={busy} style={{ ...btn(pause.paused ? GREEN : RED, '#fff'), padding: '10px 16px' }}>{pause.paused ? '▶ Reopen orders' : '⏸ Pause orders'}</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#fff' }}>
              <input type="checkbox" checked={!!pause.auto} onChange={e => setAuto(e.target.checked)} /> Auto-pause at
              <input type="number" min="0" value={pause.threshold ?? 8} onChange={e => setThreshold(parseInt(e.target.value, 10) || 0)} style={{ width: 52, background: '#0e0e10', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 6, padding: '5px 6px', textAlign: 'center' }} /> live orders
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#fff' }}>
              🌙 Auto-close at
              <input type="time" value={pause.close_hhmm || '22:00'} onChange={e => setCloseTime(e.target.value)} style={{ background: '#0e0e10', border: `1px solid ${LINE}`, color: '#fff', borderRadius: 6, padding: '5px 8px' }} />
            </label>
            {pause.waiting > 0 && <span style={{ fontSize: 12, color: '#E8B84B', fontWeight: 700 }}>{pause.waiting} waiting to be texted</span>}
          </div>
          {!pause.open && (
            <div style={{ marginTop: 8, background: RED, color: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {pause.reason === 'closed'
                ? `🌙 Closed for the night (after ${pause.close_hhmm || '22:00'}). Customers can't order or pay — they see a "closed til tomorrow" message. Reopens automatically inside service hours.`
                : <>⏸ Ordering paused{pause.autoTripped ? ` — auto (busy: ${pause.active} live)` : ''}. Customers see “a few orders ahead”. Reopen to text {pause.waiting} waiting {pause.waiting === 1 ? 'person' : 'people'} (1 a minute).</>}
            </div>
          )}
        </div>
      )}
      {err && <div style={{ fontSize: 12, color: RED, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px', marginBottom: 12, lineHeight: 1.5 }}>
        Can't reach orders yet — {err}. Orders appear here once the <code>food-order</code> backend is deployed.
      </div>}

      {active.length === 0 && !err && <div style={{ color: MUTED, fontSize: 14, padding: '44px 0', textAlign: 'center' }}>No orders on the go. New paid orders land here and ding. 🔔</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(232px, 1fr))', gap: 14 }}>
        {active.map(o => {
          const items = Array.isArray(o.items) ? o.items : []
          const waitMs = Date.now() - new Date(o.created_at).getTime()
          const wait = mmss(waitMs)
          const ready = o.status === 'ready'
          const isStaff = o.code_kind === 'staff'
          const overdue = !ready && !isStaff && waitMs > FLAG_MS
          const headBg = overdue ? RED : ready ? GREEN : isStaff ? STAFF : BLUE
          return (
            <div key={o.id} style={{ background: '#fff', border: `2px solid ${headBg}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: overdue ? 'oarflash 1.2s infinite' : 'none' }}>
              <div style={{ background: headBg, color: '#fff', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '9px 13px' }}>
                <span style={{ fontFamily: HEAVY, fontSize: 30, letterSpacing: '1px' }}>#{o.order_no}</span>
                <span style={{ fontSize: 13.5, opacity: 0.95, textTransform: 'uppercase', fontWeight: overdue ? 800 : 400 }}>{o.customer_name || '—'}{o.paid ? ' · paid' : ''} · {overdue ? '⚠ ' : ''}{wait}</span>
              </div>
              <div style={{ padding: '13px 13px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                {o.order_code && <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', background: isStaff ? STAFF : '#5B8DEF', borderRadius: 6, padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>🎟 {o.code_label || o.order_code}{isStaff ? ' · STAFF — no rush' : ' · on tab'}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {items.map((it, i) => {
                    const opts = Array.isArray(it.options) ? it.options : []
                    // a "Make it a …" add-on RENAMES the dish (Chips → Cheesy Chip Butty); others are extras.
                    const renameOpt = opts.find(o => /^make it /i.test(o.name || ''))
                    const title = renameOpt ? (renameOpt.name || '').replace(/^make it (a |an |the )?/i, '').trim() : it.name
                    const extras = opts.filter(o => o !== renameOpt)
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', gap: 10, fontSize: 19, fontWeight: 700, color: INK }}>
                          <span style={{ fontFamily: HEAVY, color: RED, minWidth: 26 }}>{it.qty}×</span>
                          <span>{title}</span>
                        </div>
                        {extras.map((o, j) => <div key={j} style={{ marginLeft: 36, fontSize: 15, fontWeight: 600, color: '#5a6' }}>＋ {o.name}</div>)}
                      </div>
                    )
                  })}
                </div>
                {o.allergen_note && <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: RED, borderRadius: 6, padding: '5px 8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>⚠ Allergy: {o.allergen_note}</div>}
                {o.customer_note && <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: BLUE, borderRadius: 6, padding: '6px 9px' }}>📝 {o.customer_note}</div>}
                {ready
                  ? <>
                      <div style={{ fontSize: 13, color: GREEN, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✓ Texted — waiting to collect</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button disabled={busy} onClick={() => resend(o)} style={{ ...btn('#fff', BLUE, BLUE), flex: 1, fontSize: 15, padding: '13px' }}>🔁 Resend text</button>
                        <button onClick={() => act(o, 'collected')} style={{ ...btn(INK, '#fff'), flex: 1 }}>Collected</button>
                      </div>
                    </>
                  : <>
                      {o.status !== 'preparing' && <button onClick={() => act(o, 'preparing')} style={btn('#fff', BLUE, BLUE)}>Start cooking</button>}
                      <button onClick={() => act(o, 'ready')} style={btn(GREEN, '#fff')}>✓ Ready — text customer</button>
                    </>}
                {o.customer_phone && <button disabled={busy} onClick={() => reply(o)} style={{ background: 'none', border: 'none', color: '#8a8275', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '2px', textDecoration: 'underline' }}>💬 Text customer</button>}
              </div>
            </div>
          )
        })}
      </div>
      </>}
    </div>
  )
}

function HistoryView({ history }) {
  const [filter, setFilter] = useState('done')   // 'done' = real orders · 'abandoned' = unpaid checkouts
  if (history == null) return <div style={{ color: MUTED, fontSize: 13, padding: '20px 0' }}>Loading history…</div>
  const done = history.filter(o => o.status !== 'pending')
  const abandoned = history.filter(o => o.status === 'pending')
  const rows = filter === 'abandoned' ? abandoned : done
  const tab = (k, label, n) => (
    <button onClick={() => setFilter(k)} style={{ fontSize: 12, fontWeight: 700, background: filter === k ? (k === 'abandoned' ? RED : BLUE) : 'none', border: `1px solid ${filter === k ? (k === 'abandoned' ? RED : BLUE) : LINE}`, color: '#fff', borderRadius: 8, padding: '6px 11px', cursor: 'pointer' }}>{label} ({n})</button>
  )
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {tab('done', '✅ Orders', done.length)}
        {tab('abandoned', '🛒 Abandoned', abandoned.length)}
      </div>
      {filter === 'abandoned' && (
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>Carts where “Continue to pay” was tapped but payment was never completed — no money taken, never sent to the kitchen.</div>
      )}
      {rows.length === 0
        ? <div style={{ color: MUTED, fontSize: 14, padding: '30px 0', textAlign: 'center' }}>{filter === 'abandoned' ? 'No abandoned checkouts.' : 'No orders yet.'}</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.map(o => {
              const items = (Array.isArray(o.items) ? o.items : []).map(it => `${it.qty}× ${it.name}`).join(', ')
              const when = new Date(o.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              const sc = o.status === 'collected' ? GREEN : o.status === 'cancelled' ? RED : o.status === 'ready' ? BLUE : o.status === 'pending' ? '#b58a00' : 'rgba(255,255,255,0.5)'
              const label = o.status === 'pending' ? 'unpaid' : o.status
              return (
                <div key={o.id} style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10, color: INK, opacity: o.status === 'pending' ? 0.72 : 1 }}>
                  <span style={{ fontFamily: HEAVY, fontSize: 17, color: BLUE, minWidth: 44 }}>#{o.order_no}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}><b>{o.customer_name || '—'}</b> · {items || '—'}</span>
                  <span style={{ fontSize: 11.5, color: '#8a8275', whiteSpace: 'nowrap' }}>{when}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: sc, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
              )
            })}
          </div>}
    </div>
  )
}
function btn(bg, color, border) { return { border: border ? `2px solid ${border}` : 'none', borderRadius: 10, padding: '16px 12px', fontFamily: HEAVY, fontSize: 19, letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer', background: bg, color } }
