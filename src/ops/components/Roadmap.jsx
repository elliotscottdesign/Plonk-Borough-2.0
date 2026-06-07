import React from 'react'

// Shared "coming next" layout for the not-yet-built Ops sections. Keeps the
// structure visible and navigable, and lists exactly what's needed to switch
// each section on.
export default function Roadmap({ title, intro, sections = [], need = [], liveNote }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 820 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="serif" style={{ fontSize: 26, color: 'var(--cream)' }}>{title}</div>
        <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)', background: 'var(--gold)', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>Coming next</span>
      </div>
      <div style={{ fontSize: 14, color: 'var(--cream-dim)', lineHeight: 1.65 }}>{intro}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 14 }}>
        {sections.map((s, i) => (
          <div key={i} style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, marginBottom: 10 }}>{s.h}</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.items.map((it, j) => (
                <li key={j} style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.5 }}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {need.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)', fontWeight: 600, marginBottom: 10 }}>To switch this on, I need</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {need.map((n, i) => <li key={i} style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.5 }}>{n}</li>)}
          </ul>
        </div>
      )}

      {liveNote && (
        <div style={{ background: 'rgba(79,209,197,0.07)', border: '1px solid rgba(79,209,197,0.3)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#A7F3EB', lineHeight: 1.6 }}>
          {liveNote}
        </div>
      )}
    </div>
  )
}
