import React from 'react'

// Generic, data-driven renderer for a marketing category. Renders each metric
// group as a panel of stat cards. When the Windsor feed has the metric it shows
// the value; otherwise it shows a dim placeholder ("—") so the dashboard reads
// as "ready, awaiting data".

function fmt(v, unit) {
  if (v == null) return null
  if (unit === '£') return '£' + Number(v).toLocaleString('en-GB')
  if (unit === '%') return Number(v).toFixed(1) + '%'
  if (unit === '×') return Number(v).toFixed(2) + '×'
  if (unit === 's') return Math.round(Number(v)) + 's'
  if (unit === 'list') return Array.isArray(v) ? v.slice(0, 5).join(' · ') : String(v)
  return Number(v).toLocaleString('en-GB')
}

export default function MarketingSection({ section, data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div className="serif" style={{ fontSize: 24, color: '#FFFFFF' }}>{section.icon} {section.label}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, maxWidth: 760, lineHeight: 1.6 }}>{section.intro}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>Source · {section.source}</div>
      </div>

      {section.groups.map(g => (
        <div key={g.title} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#DA1B33', fontWeight: 600, marginBottom: 14 }}>{g.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
            {g.metrics.map(mt => {
              const raw = data ? data[mt.key] : null
              const val = fmt(raw, mt.unit)
              const has = val != null
              const isList = mt.unit === 'list'
              return (
                <div key={mt.key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 14px', gridColumn: isList ? '1 / -1' : 'auto' }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>{mt.label}</div>
                  <div className="serif" style={{ fontSize: isList ? 14 : 24, color: has ? '#DA1B33' : 'var(--ink-3, #4B5563)', lineHeight: 1.2, marginTop: 2 }}>
                    {has ? val : '—'}
                  </div>
                  {!has && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>awaiting data</div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
