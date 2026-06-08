import React, { useState } from 'react'
import { insertSubscriber, BACKEND_READY } from '../data/backend.js'

// Newsletter sign-up form. Captures email + consent → Supabase (insert-only).
// Reusable: drop it on the customer site or an in-bar sign-up screen too.
// When the backend isn't configured yet it stays in a harmless preview state.
export default function SignupForm({ source = 'marketing-preview' }) {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(true)
  const [status, setStatus] = useState(null) // null | 'sending' | 'done' | error string

  const submit = async (e) => {
    e.preventDefault()
    if (!/.+@.+\..+/.test(email)) { setStatus('Enter a valid email'); return }
    if (!consent) { setStatus('Tick consent to subscribe'); return }
    if (!BACKEND_READY) { setStatus('preview'); return }
    setStatus('sending')
    try { await insertSubscriber({ email, source, consent }); setStatus('done'); setEmail('') }
    catch (err) { setStatus(String(err.message || err)) }
  }

  const inp = { flex: 1, minWidth: 180, padding: '10px 12px', fontSize: 14, borderRadius: 8, background: '#0A0A0A', border: '1px solid rgba(218,27,51,0.4)', color: '#FFFFFF', outline: 'none' }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={inp} />
        <button type="submit" style={{ padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, background: '#DA1B33', color: '#FFFFFF', border: 'none' }}>
          {status === 'sending' ? 'Joining…' : 'Sign up'}
        </button>
      </div>
      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
        I agree to receive emails from No Dice (unsubscribe anytime).
      </label>
      {status === 'done' && <div style={{ fontSize: 12, color: '#34D399' }}>✓ You're on the list.</div>}
      {status === 'preview' && <div style={{ fontSize: 12, color: '#FCD34D' }}>Preview only — connects to Supabase once the backend is configured.</div>}
      {status && !['done', 'preview', 'sending'].includes(status) && <div style={{ fontSize: 12, color: '#F87171' }}>{status}</div>}
    </form>
  )
}
