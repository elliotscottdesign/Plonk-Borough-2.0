import React, { useEffect, useRef, useState } from 'react'
import { listOrders, setOrderStatus } from './foodOrders.js'

// 🎫 Kitchen tickets / display. Live paid orders land here, ding on arrival, and
// tapping "Ready" texts the customer (the "food ready" message, sent server-side).
// Styled to match the On A Roll order page — cream/blue/red diner kit.
// Lives in /ops → Kitchen. Polls every 10s so a fresh order shows without a reload.

const BLUE = '#183fa0', RED = '#e0231b', GREEN = '#1f8a4d', INK = '#15305c', LINE = '#cabfa2', MUTED = 'rgba(255,255,255,0.55)'
const HEAVY = "Impact, 'Arial Narrow Bold', sans-serif"
const mmss = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

export default function KitchenTickets() {
  const [orders, setOrders] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [sound, setSound] = useState(true)
  const [, tick] = useState(0)
  const seen = useRef(new Set())
  const soundRef = useRef(true)
  useEffect(() => { soundRef.current = sound }, [sound])

  const beep = () => {
    if (!soundRef.current) return
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)()
      const o = a.createOscillator(), g = a.createGain()
      o.connect(g); g.connect(a.destination); o.type = 'sine'; o.frequency.value = 880
      g.gain.setValueAtTime(0.001, a.currentTime); g.gain.exponentialRampToValueAtTime(0.4, a.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.35); o.start(); o.stop(a.currentTime + 0.36)
    } catch { /* ignore */ }
  }

  const load = async () => {
    try {
      const r = await listOrders(); const list = r.orders || []
      if (seen.current.size) { for (const o of list) { if (!seen.current.has(o.id) && o.status !== 'ready') { beep(); break } } }
      for (const o of list) seen.current.add(o.id)
      setOrders(list); setErr('')
    } catch (e) { setErr(e.message); setOrders(o => (o == null ? [] : o)) }
  }
  useEffect(() => {
    load()
    const poll = setInterval(load, 10000)
    const clock = setInterval(() => tick(t => t + 1), 1000)
    return () => { clearInterval(poll); clearInterval(clock) }
  }, [])   // eslint-disable-line

  const act = async (o, status) => { setBusy(true); try { await setOrderStatus(o.id, status, ''); await load() } catch (e) { alert(e.message) } finally { setBusy(false) } }

  if (orders == null) return <div style={{ color: MUTED, fontSize: 13, padding: '20px 0' }}>Loading orders…</div>

  const active = orders.filter(o => o.status !== 'collected')
  return (
    <div>
      <img src="/on-a-roll-logo.jpg" alt="On A Roll" style={{ height: 42, borderRadius: 8, display: 'block', marginBottom: 12 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{active.length ? `${active.length} live order${active.length > 1 ? 's' : ''}` : 'No live orders'}</div>
        <label style={{ marginLeft: 'auto', fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} /> Ding on new
        </label>
      </div>

      {err && <div style={{ fontSize: 12, color: RED, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px', marginBottom: 12, lineHeight: 1.5 }}>
        Can't reach orders yet — {err}. Orders appear here once the <code>food-order</code> backend is deployed.
      </div>}

      {active.length === 0 && !err && <div style={{ color: MUTED, fontSize: 14, padding: '44px 0', textAlign: 'center' }}>No orders on the go. New paid orders land here and ding. 🔔</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {active.map(o => {
          const items = Array.isArray(o.items) ? o.items : []
          const wait = mmss(Date.now() - new Date(o.created_at).getTime())
          const ready = o.status === 'ready'
          return (
            <div key={o.id} style={{ background: '#fff', border: `2px solid ${ready ? GREEN : BLUE}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: ready ? GREEN : BLUE, color: '#fff', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '7px 12px' }}>
                <span style={{ fontFamily: HEAVY, fontSize: 24, letterSpacing: '1px' }}>#{o.order_no}</span>
                <span style={{ fontSize: 12, opacity: 0.9, textTransform: 'uppercase' }}>{o.customer_name || '—'}{o.paid ? ' · paid' : ''} · {wait}</span>
              </div>
              <div style={{ padding: '11px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 16, fontWeight: 700, color: INK }}>
                      <span style={{ fontFamily: HEAVY, color: RED, minWidth: 22 }}>{it.qty}×</span>
                      <span>{it.name}</span>
                    </div>
                  ))}
                </div>
                {o.allergen_note && <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: RED, borderRadius: 6, padding: '5px 8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>⚠ Allergy: {o.allergen_note}</div>}
                {ready
                  ? <>
                      <div style={{ fontSize: 13, color: GREEN, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✓ Texted — waiting to collect</div>
                      <button disabled={busy} onClick={() => act(o, 'collected')} style={btn(INK, '#fff')}>Collected</button>
                    </>
                  : <>
                      {o.status !== 'preparing' && <button disabled={busy} onClick={() => act(o, 'preparing')} style={btn('#fff', BLUE, BLUE)}>Start cooking</button>}
                      <button disabled={busy} onClick={() => act(o, 'ready')} style={btn(RED, '#fff')}>✓ Ready — text customer</button>
                    </>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
function btn(bg, color, border) { return { border: border ? `2px solid ${border}` : 'none', borderRadius: 9, padding: '12px', fontFamily: HEAVY, fontSize: 16, letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer', background: bg, color } }
