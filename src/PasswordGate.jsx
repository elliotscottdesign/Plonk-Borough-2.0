import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

// ─── Access codes ──────────────────────────────────────────────────────
// Each code grants a role with four orthogonal flags:
//   - plonk:    can see the Plonk top-tab (IP & Licensing + Digital
//               Marketing + How It Works + Cover + SEO Marketing)
//   - founder:  full edit access on the 2026 Performance tab — drives
//               canEdit on every slider/input via LockedForecastContext
//   - hackney:  can view the /hackney deck. NODICE88 is the dedicated
//               Hackney-investor code; founder-tier (888999/JOHN1),
//               LEONIE and BRAZIL also hold it.
//   - role:     a string tag persisted to sessionStorage so individual
//               components can branch behaviour (e.g. a BRAZIL viewer
//               sees the ticket slider locked even though everything
//               else is read-only by default for non-founders too)
//
// Plonk is PRIVATE — only 888999 (founder) and JOHN1 see it.
// Hackney is gated to NODICE88, 888999, JOHN1, LEONIE and BRAZIL.
// Brazilian Portuguese remains an in-app EN | PT toggle (no code).
//
// JOHN1 is an "observer-founder" tier — same slider + lock access as
// the real founder (can drag every slider, lock every value) AND has
// Plonk + Hackney visibility. Role tag stays 'observer' so any future
// external-sheet-write or document-edit flow gates against it.
// ───────────────────────────────────────────────────────────────────────
// `ops` grants the internal team Operations hub at /ops (Stock Orders,
// Reports, Documentation). Founder-tier holds it; NDTEAM is the dedicated
// staff code — ops-only, no investor decks.
const ACCESS_CODES = {
  '888999':   { plonk: true,  founder: true,  hackney: true,  ops: true,  marketing: true,  role: 'founder'  },
  'JOHN1':    { plonk: true,  founder: true,  hackney: true,  ops: true,  marketing: true,  role: 'observer' },
  'LEONIE':   { plonk: false, founder: true,  hackney: true,  ops: false, marketing: false, role: 'leonie'   },
  'NODICE88': { plonk: false, founder: false, hackney: true,  ops: false, marketing: false, role: 'nodice88' },
  'BRAZIL':   { plonk: false, founder: false, hackney: true,  ops: false, marketing: false, role: 'brazil'   },
  'NDTEAM':   { plonk: false, founder: false, hackney: false, ops: true,  marketing: true,  role: 'team'     },
}

export default function PasswordGate({ onUnlock }) {
  const { t } = useTranslation('gate')
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const attempt = () => {
    // Codes are case-sensitive on the digit form (888999) but the named
    // codes (BRAZIL, JOHN1, LEONIE, NODICE88) accept any case for friendliness.
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
      background:'#000000', flexDirection:'column', gap:30, padding:24,
      fontFamily:"'DM Sans', sans-serif",
    }}>
      {/* Logo — shared gate for the team hub + both decks. Public brand:
           the No Dice wordmark on black, red accents. */}
      <div style={{ textAlign:'center' }}>
        <img src="/nodice-wordmark.png" alt="No Dice" style={{ width:'min(260px, 70vw)', height:'auto', display:'block', margin:'0 auto 14px' }} />
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', letterSpacing:'0.2em', textTransform:'uppercase' }}>
          {t('eyebrow')}
        </div>
      </div>

      <div style={{ width:200, height:2, background:'linear-gradient(90deg, transparent, #DA1B33, transparent)' }} />

      {/* Password input */}
      <div style={{ display:'flex', flexDirection:'column', gap:12, alignItems:'center' }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', letterSpacing:'0.1em' }}>
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
              background:'#0A0A0A', border:`1px solid ${error ? '#E53935' : 'rgba(255,255,255,0.18)'}`,
              color:'#FFFFFF', outline:'none', letterSpacing:'0.1em',
              transition:'border-color 0.2s',
            }}
            placeholder="••••••••••"
          />
          <button onClick={attempt} style={{
            padding:'10px 20px', borderRadius:8, fontSize:13,
            background:'#DA1B33', color:'#FFFFFF', border:'none',
            cursor:'pointer', fontWeight:700, letterSpacing:'0.06em',
          }}>{t('enter')}</button>
        </div>
        {error && (
          <div style={{ fontSize:11, color:'#E53935' }}>{t('incorrect')}</div>
        )}
      </div>

      <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', marginTop:16 }}>
        {t('footer')}
      </div>
    </div>
  )
}
