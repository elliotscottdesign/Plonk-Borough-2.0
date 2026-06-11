import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

// ─── Access codes ──────────────────────────────────────────────────────
// Live codes. Each grants a role with these orthogonal flags:
//   - plonk:     Plonk top-tab on the Borough deck (PRIVATE — founder only)
//   - founder:   full edit access (drives canEdit on every slider/input)
//   - hackney:   view the /hackney (London Fields) investor deck
//   - borough:   view the /borough investor deck
//   - ops:       the internal Operations hub at /ops
//   - marketing: the internal Marketing hub at /marketing
//   - role:      a string tag persisted to sessionStorage for any component
//                that branches on it
//
//   888999   — founder: opens EVERYTHING.
//   NDTEAM   — team staff: Operations + Marketing only (no investor decks).
//   NODICE88 — Hackney investors: the Hackney deck ONLY (generic view).
//   NODICE99 — Borough investors: the Borough deck ONLY.
//   LEONIE   — Leonie Sands (Round 1 prospective): Hackney deck + her
//              own bespoke "Your Agreement" tab (role:'leonie' gates the
//              tab in src/hackney/HackneyApp.jsx). Restored June 2026
//              after a code cleanup accidentally revoked it before her
//              draft review.
//   LLEE01   — Lee Trott (Round 1 prospective, 1 share / £1k): Hackney
//              deck + his own "Your Agreement" tab (role:'lee'). Same
//              standard Round 1 terms as Leonie's draft, personalised
//              with Lee's name + 1 share figure.
//
// Retiring a code does NOT delete any saved notes/locks/drags — those persist
// in localStorage and on the lock-sync server keyed by the code STRING (see
// lib/access-code.js · namespacedKey). Removing a code only disables LOGIN;
// the data stays intact and recoverable.
// ───────────────────────────────────────────────────────────────────────
const ACCESS_CODES = {
  '888999':   { plonk: true,  founder: true,  hackney: true,  borough: true,  ops: true,  marketing: true,  role: 'founder'          },
  'NDTEAM':   { plonk: false, founder: false, hackney: false, borough: false, ops: true,  marketing: true,  role: 'team'             },
  'NODICE88': { plonk: false, founder: false, hackney: true,  borough: false, ops: false, marketing: false, role: 'hackney-investor' },
  'NODICE99': { plonk: false, founder: false, hackney: false, borough: true,  ops: false, marketing: false, role: 'borough-investor' },
  'LEONIE':   { plonk: false, founder: false, hackney: true,  borough: false, ops: false, marketing: false, role: 'leonie'           },
  'LLEE01':   { plonk: false, founder: false, hackney: true,  borough: false, ops: false, marketing: false, role: 'lee'              },
}

export default function PasswordGate({ onUnlock }) {
  const { t } = useTranslation('gate')
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  // Label the gate by the area being unlocked (read from the URL) so the
  // wordmark says exactly which gateway you're entering.
  const gatewayLabel = (() => {
    const p = (typeof window !== 'undefined' && window.location.pathname) || ''
    if (/^\/ops(\/|$)/.test(p)) return 'Operations'
    if (/^\/marketing(\/|$)/.test(p)) return 'Marketing'
    if (/^\/hackney(\/|$)/.test(p)) return 'Investors · Hackney'
    if (/^\/borough(\/|$)/.test(p)) return 'Investors · Borough'
    if (/^\/worldcup(\/|$)/.test(p)) return 'World Cup'
    if (/^\/help-out(\/|$)/.test(p)) return 'Help Out'
    return t('eyebrow')
  })()

  const attempt = () => {
    // Codes are case-sensitive on the digit form (888999) but the named
    // codes (NDTEAM, NODICE88, NODICE99, LEONIE, LLEE01) accept any case
    // for friendliness.
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
          {gatewayLabel}
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
