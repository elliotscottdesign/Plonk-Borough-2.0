import React, { useState } from 'react'

const PASSWORD = 'TEST1'

export default function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const attempt = () => {
    if (input === PASSWORD) {
      onUnlock()
    } else {
      setError(true)
      setInput('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div style={{
      height:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--ink)', flexDirection:'column', gap:32,
    }}>
      {/* Logo */}
      <div style={{ textAlign:'center' }}>
        <div className="serif" style={{ fontSize:52, color:'var(--gold)', lineHeight:1, marginBottom:12 }}>
          No Dice<br/>Borough
        </div>
        <div style={{ fontSize:11, color:'var(--cream-dim)', letterSpacing:'0.2em', textTransform:'uppercase' }}>
          Investor Presentation · Confidential
        </div>
      </div>

      <div className="gold-rule" style={{ width:200 }} />

      {/* Password input */}
      <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>
        <div style={{ fontSize:11, color:'var(--cream-dim)', letterSpacing:'0.1em' }}>
          Enter access code
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            autoFocus
            style={{
              padding:'10px 16px', fontSize:14, borderRadius:8, width:200,
              background:'var(--ink-2)', border:`1px solid ${error ? '#E53935' : 'rgba(201,168,76,0.3)'}`,
              color:'var(--cream)', outline:'none', letterSpacing:'0.1em',
              transition:'border-color 0.2s',
            }}
            placeholder="••••••••••"
          />
          <button onClick={attempt} style={{
            padding:'10px 20px', borderRadius:8, fontSize:13,
            background:'var(--gold)', color:'var(--ink)', border:'none',
            cursor:'pointer', fontWeight:500,
          }}>Enter</button>
        </div>
        {error && (
          <div style={{ fontSize:11, color:'#E53935' }}>Incorrect access code</div>
        )}
      </div>

      <div style={{ fontSize:10, color:'var(--gold-dim)', letterSpacing:'0.08em', marginTop:16 }}>
        For investor use only · Borough Market SE1
      </div>
    </div>
  )
}
