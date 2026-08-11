import React, { useState } from 'react'
import LeonieAgreement from './LeonieAgreement.jsx'
import LeeAgreement from './LeeAgreement.jsx'
import MikeAgreement from './MikeAgreement.jsx'

// ─── Agreements — ONE page holding every Round-1 investor agreement ──────────
// Replaces the three separate "Your Agreement" top tabs (founder's call, Aug
// 2026): the header stays clean and the agreements live here as drop-down
// sections. Visibility unchanged from the old tabs: an investor role sees ONLY
// their own agreement (auto-expanded); the founder sees all three. The
// agreement pages themselves (incl. sign blocks) render exactly as before.

const AGREEMENTS = [
  { role: 'leonie', name: 'Leonie Sands',   Component: LeonieAgreement },
  { role: 'lee',    name: 'Lee Trott',      Component: LeeAgreement },
  { role: 'mike',   name: 'Michael Taylor', Component: MikeAgreement },
]

export default function Agreements({ role, isFounder }) {
  const visible = isFounder ? AGREEMENTS : AGREEMENTS.filter(a => a.role === role)
  // A lone agreement (an investor's own) opens itself; the founder's list starts closed.
  const [openRole, setOpenRole] = useState(() => (visible.length === 1 ? visible[0].role : null))

  if (visible.length === 0) {
    return <div style={{ padding: 40, color: 'var(--cream-dim)', fontSize: 14 }}>No agreement is linked to this sign-in.</div>
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 20px 60px' }}>
      <div className="serif" style={{ fontSize: 30, color: 'var(--gold)', marginBottom: 4 }}>Agreements</div>
      <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginBottom: 22, lineHeight: 1.6 }}>
        {visible.length === 1
          ? 'Your Round 1 investor agreement — review and sign below.'
          : 'Round 1 investor agreements — open each to review or check signature status.'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visible.map(a => {
          const open = openRole === a.role
          return (
            <div key={a.role} style={{ background: 'var(--ink-2)', border: `1px solid ${open ? 'var(--gold)' : 'rgba(201,168,76,0.25)'}`, borderRadius: 14, overflow: 'hidden' }}>
              <button onClick={() => setOpenRole(open ? null : a.role)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '16px 18px',
                background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 20 }}>📜</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="serif" style={{ display: 'block', fontSize: 18, color: 'var(--cream)' }}>{a.name}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--cream-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>Round 1 · Investor agreement</span>
                </span>
                <span style={{ color: 'var(--gold)', fontSize: 14, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </button>
              {open && (
                <div style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}>
                  <a.Component />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
