import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { lookupAccess } from './lib/access.js'

// Access codes + the flags each grants now live in src/lib/access.js (single
// source of truth), shared with the /today management log-in. Retiring a code
// there disables LOGIN only — saved notes/locks/drags persist in localStorage /
// on the lock-sync server keyed by the code STRING (see lib/access-code.js).

export default function PasswordGate({ onUnlock }) {
  const { t } = useTranslation('gate')
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  // Label + footer for the gate, by the area being unlocked (read from the URL),
  // so the sub-header below the wordmark matches exactly which gateway you're
  // entering — not the generic "investor presentation".
  const gateway = (() => {
    const p = (typeof window !== 'undefined' && window.location.pathname) || ''
    const TEAM = 'For the No Dice team'
    if (/^\/(ops|operations)(\/|$)/.test(p)) return { label: 'Operations',           footer: TEAM }
    if (/^\/marketing(\/|$)/.test(p))        return { label: 'Marketing',            footer: TEAM }
    if (/^\/hackney(\/|$)/.test(p))          return { label: 'Investors · Hackney',  footer: t('footer') }
    if (/^\/borough(\/|$)/.test(p))          return { label: 'Investors · Borough',  footer: t('footer') }
    if (/^\/worldcup(\/|$)/.test(p))         return { label: 'World Cup',            footer: TEAM }
    if (/^\/help-?out(\/|$)/.test(p))        return { label: 'Help Out',             footer: 'Helping us open' }
    return { label: t('eyebrow'), footer: t('footer') }
  })()

  const attempt = () => {
    // Codes are case-sensitive on the digit form (888999) but the named
    // codes (NDTEAM, NODICE88, NODICE99, LEONIE, LEE01, MIKE) accept any
    // case for friendliness. Lookup + normalisation live in lib/access.js.
    const { candidate, access } = lookupAccess(input)
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
          {gateway.label}
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
        {gateway.footer}
      </div>
    </div>
  )
}
