import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

// ─── Access codes ──────────────────────────────────────────────────────
// Each code grants a role with three orthogonal flags:
//   - plonk:    can see the Plonk top-tab (IP & Licensing + Digital
//               Marketing + How It Works + Cover + SEO Marketing)
//   - founder:  full edit access on the 2026 Performance tab — drives
//               canEdit on every slider/input via LockedForecastContext
//   - role:     a string tag persisted to sessionStorage so individual
//               components can branch behaviour (e.g. a BRAZIL viewer
//               sees the ticket slider locked even though everything
//               else is read-only by default for non-founders too)
//
// Plonk is now PRIVATE — only 888999 (founder) and JOHN1 see it.
// TEST1, BRAZIL and LEONIE get the standard 3-tab investor view
// (Investor Deck · Venue Info · Business Explorer). Brazilian
// Portuguese remains an in-app EN | PT toggle (no code).
//
// JOHN1 is an "observer-founder" tier — same slider + lock access as
// the real founder (can drag every slider, lock every value) AND now
// has Plonk-tab visibility. Role tag stays 'observer' so any future
// external-sheet-write or document-edit flow gates against it. The
// deck itself doesn't currently push to external sheets from the UI,
// so JOHN1's in-app permissions are functionally equivalent to 888999.
// ───────────────────────────────────────────────────────────────────────
const ACCESS_CODES = {
  '888999': { plonk: true,  founder: true,  role: 'founder'  },
  'JOHN1':  { plonk: true,  founder: true,  role: 'observer' },
  'TEST1':  { plonk: false, founder: false, role: 'test'     },
  'BRAZIL': { plonk: false, founder: false, role: 'brazil'   },
  'LEONIE': { plonk: false, founder: true,  role: 'leonie'   },
}

export default function PasswordGate({ onUnlock }) {
  const { t } = useTranslation('gate')
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const attempt = () => {
    // Codes are case-sensitive on the digit form (888999) but the named
    // codes (TEST1, BRAZIL, JOHN1, LEONIE) accept any case for friendliness.
    const candidate = /^[0-9]+$/.test(input) ? input : input.toUpperCase()
    const access = ACCESS_CODES[candidate]
    if (access) {
      // Pass the canonical access code through alongside the role flags
      // so App.jsx can use it as the per-tenant key for lock-sync.
      onUnlock({ ...access, lang: 'en', accessCode: candidate })
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
      {/* Logo — shared gate for both decks (Borough at /, Hackney at /hackney).
           Stays brand-neutral so the venue name only resolves after unlock. */}
      <div style={{ textAlign:'center' }}>
        <div className="serif" style={{ fontSize:52, color:'var(--gold)', lineHeight:1, marginBottom:12 }}>
          No Dice
        </div>
        <div style={{ fontSize:11, color:'var(--cream-dim)', letterSpacing:'0.2em', textTransform:'uppercase' }}>
          {t('eyebrow')}
        </div>
      </div>

      <div className="gold-rule" style={{ width:200 }} />

      {/* Password input */}
      <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>
        <div style={{ fontSize:11, color:'var(--cream-dim)', letterSpacing:'0.1em' }}>
          {t('prompt')}
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
          }}>{t('enter')}</button>
        </div>
        {error && (
          <div style={{ fontSize:11, color:'#E53935' }}>{t('incorrect')}</div>
        )}
      </div>

      <div style={{ fontSize:10, color:'var(--gold-dim)', letterSpacing:'0.08em', marginTop:16 }}>
        {t('footer')}
      </div>
    </div>
  )
}
