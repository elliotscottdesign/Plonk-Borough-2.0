import React, { useState } from 'react'
import KitchenTickets from '../kitchen/KitchenTickets.jsx'
import MenuManager from '../kitchen/MenuManager.jsx'

// On A Roll MANAGEMENT app — the kitchen order display + menu manager, on its OWN
// page (team.nodice.bar/onaroll) behind a simple code, separate from both the
// staff /ops profile AND the customer order page (nodice.bar/onaroll). The backend
// actions are still SEND_SECRET-gated; this code is just the door to the app UI.
const CODE = '9119'   // ← truck access code (entrance)
const GOLD = '#C9A84C'

export default function OnARollApp() {
  const [ok, setOk] = useState(() => { try { return sessionStorage.getItem('onaroll_ok') === '1' } catch { return false } })
  const [tab, setTab] = useState('orders')

  if (!ok) return <Gate onOk={() => { try { sessionStorage.setItem('onaroll_ok', '1') } catch { /* */ } setOk(true) }} />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: '#fff', padding: '14px 16px 44px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 1000, margin: '0 auto 14px', flexWrap: 'wrap' }}>
        <img src="/on-a-roll-logo.png?v=3" alt="On A Roll" style={{ height: 52 }} />
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {[['orders', '🎫 Orders'], ['menu', '🍔 Menu']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={tabBtn(tab === k)}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {tab === 'orders' ? <KitchenTickets /> : <MenuManager />}
      </div>
    </div>
  )
}

function Gate({ onOk }) {
  const [v, setV] = useState('')
  const [err, setErr] = useState(false)
  const submit = () => { if (v.trim().toLowerCase() === CODE) onOk(); else setErr(true) }
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 320, width: '100%' }}>
        <img src="/on-a-roll-logo.png?v=3" alt="On A Roll" style={{ width: 200, maxWidth: '76%', marginBottom: 18 }} />
        <input value={v} autoFocus placeholder="Enter code"
          onChange={e => { setV(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: `1px solid ${err ? '#DA1B33' : 'rgba(255,255,255,0.2)'}`, background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 16, textAlign: 'center' }} />
        <button onClick={submit} style={{ width: '100%', marginTop: 10, padding: '13px', borderRadius: 10, border: 'none', background: '#e0231b', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Enter</button>
        {err && <div style={{ color: '#DA1B33', fontSize: 13, marginTop: 8 }}>Wrong code — try again.</div>}
      </div>
    </div>
  )
}

const tabBtn = on => ({ padding: '9px 15px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, background: on ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.05)', border: `1px solid ${on ? GOLD : 'rgba(255,255,255,0.15)'}`, color: on ? GOLD : '#fff' })
