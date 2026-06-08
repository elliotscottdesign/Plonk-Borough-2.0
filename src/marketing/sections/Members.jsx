import React from 'react'

// ─── Members & Loyalty — scaffold ────────────────────────────────────────
// Customer database + loyalty/rewards, owned in-house. Built out alongside the
// newsletter list (same store). Roadmap until the data store is chosen.

export default function Members() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 820 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="serif" style={{ fontSize: 24, color: '#FFFFFF' }}>🪪 Members &amp; Loyalty</div>
        <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FFFFFF', background: '#DA1B33', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>Coming next</span>
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65 }}>
        Your own members & loyalty program — customer data you control, feeding the newsletter and rewarding regulars, without
        a third-party CRM fee. Shares the same in-house database as the newsletter list.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 14 }}>
        {[
          { h: 'Member profiles', items: ['Email, name, sign-up source & date', 'Consent / marketing opt-in (GDPR)', 'Tags (regular, golf, events, VIP)', 'Linked to bookings / spend where available'] },
          { h: 'Loyalty mechanics', items: ['Points per visit / spend', 'Rewards & tiers (e.g. free round, comp drink)', 'Birthday / win-back triggers', 'QR or code check-in at the bar'] },
          { h: 'Where the data comes from', items: ['In-bar sign-up (tablet / QR)', 'Online bookings & events', 'Instagram / Google (via the marketing feeds)', 'Newsletter sign-ups'] },
        ].map((s, i) => (
          <div key={i} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#DA1B33', fontWeight: 600, marginBottom: 10 }}>{s.h}</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.items.map((it, j) => <li key={j} style={{ fontSize: 13, color: '#FFFFFF', lineHeight: 1.5 }}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 10 }}>To switch this on, I need</div>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li style={{ fontSize: 13, color: '#FFFFFF', lineHeight: 1.5 }}>The data store — same call as the newsletter list (Google Sheet vs Supabase). Supabase is the better home for members + loyalty logic.</li>
          <li style={{ fontSize: 13, color: '#FFFFFF', lineHeight: 1.5 }}>How members earn (per visit, per £ spent, or both) and the rewards you want to offer.</li>
          <li style={{ fontSize: 13, color: '#FFFFFF', lineHeight: 1.5 }}>How they check in / are identified at the bar (QR code, phone number, member code).</li>
        </ul>
      </div>

      <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#A7F3EB', lineHeight: 1.6 }}>
        Since you already run <strong>Supabase</strong> for the Plonk Golf booking system, that's the natural home for the
        members database + loyalty — one customer record across newsletter, bookings and rewards. Say the word and I'll spec it.
      </div>
    </div>
  )
}
