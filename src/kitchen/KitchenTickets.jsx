import React, { useEffect, useRef, useState } from 'react'
import { listOrders, setOrderStatus } from './foodOrders.js'

// 🎫 Kitchen tickets / display. Live paid orders land here, ding on arrival, and
// tapping "Ready" texts the customer (the "food ready" message, sent server-side).
// Lives in /ops → Kitchen. Polls every 10s so a fresh order shows without a reload.

const GOLD = '#E8B84B', GREEN = '#31b46a', LINE = '#2b2c30', CARD = '#17181b', MUTED = 'rgba(255,255,255,0.55)'
const money = p => '£' + ((p || 0) / 100).toFixed(2)
const mmss = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }
const btn = (bg, color) => ({ border: 'none', borderRadius: 11, padding: '12px', fontSize: 14, fontWeight: 800, cursor: 'pointer', background: bg, color })

export default function KitchenTickets() {
  const [orders, setOrders] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [sound, setSound] = useState(true)
  const [, tick] = useState(0)                 // re-render for the waiting timers
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: MUTED }}>{active.length ? `${active.length} live order${active.length > 1 ? 's' : ''}` : 'No live orders'}</div>
        <label style={{ marginLeft: 'auto', fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} /> Ding on new
        </label>
      </div>

      {err && <div style={{ fontSize: 12, color: GOLD, background: 'rgba(232,184,75,0.08)', border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px', marginBottom: 12, lineHeight: 1.5 }}>
        Can't reach orders yet — {err}. Orders appear here once the <code>food-order</code> backend is deployed.
      </div>}

      {active.length === 0 && !err && <div style={{ color: MUTED, fontSize: 14, padding: '44px 0', textAlign: 'center' }}>No orders on the go. New paid orders land here and ding. 🔔</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {active.map(o => {
          const items = Array.isArray(o.items) ? o.items : []
          const wait = mmss(Date.now() - new Date(o.created_at).getTime())
          return (
            <div key={o.id} style={{ background: CARD, border: `1px solid ${o.status === 'ready' ? GREEN : LINE}`, borderRadius: 14, padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>#{o.order_no}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{o.customer_name || '—'}{o.paid ? ' · paid' : ''} · {wait}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 15, color: '#fff' }}>
                {items.map((it, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 800, color: GOLD, minWidth: 20 }}>{it.qty}×</span>
                    <span>{it.name}</span>
                  </div>
                ))}
              </div>
              {o.allergen_note && <div style={{ fontSize: 12, fontWeight: 700, color: '#111', background: '#ffb020', borderRadius: 7, padding: '5px 8px' }}>⚠ Allergy: {o.allergen_note}</div>}
              {o.status === 'ready'
                ? <>
                    <div style={{ fontSize: 12, color: GREEN, fontWeight: 700, textAlign: 'center' }}>✓ Texted — waiting to collect</div>
                    <button disabled={busy} onClick={() => act(o, 'collected')} style={btn('#2b2c30', '#fff')}>Collected</button>
                  </>
                : <>
                    {o.status !== 'preparing' && <button disabled={busy} onClick={() => act(o, 'preparing')} style={btn('rgba(255,255,255,0.06)', '#fff')}>Start cooking</button>}
                    <button disabled={busy} onClick={() => act(o, 'ready')} style={btn(GREEN, '#04240f')}>✓ Ready — text customer</button>
                  </>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
