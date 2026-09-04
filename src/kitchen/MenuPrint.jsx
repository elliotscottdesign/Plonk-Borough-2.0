import React, { useEffect, useState } from 'react'
import { getMenu } from './menuApi.js'
import { exportMenu } from './menuExport.js'
import { ON_A_ROLL_LOGO } from './logo.js'

// Public LIVE printable "On A Roll menu" — team.nodice.bar/onaroll/print.
// No code gate (all staff can open it). Always reflects the most recently SAVED
// online menu (reads the same menu_catalog the customer order page uses), so
// there's nothing to re-export: save the menu, this link is instantly current.
const CREAM = '#fdf2e0', BLUE = '#183fa0', RED = '#e0231b', INK = '#15305c', MUTED = '#8a7f63', LINE = '#e3d6b6'
const HEAVY = "Impact, 'Arial Narrow Bold', sans-serif"
const gbp = n => '£' + (n % 1 === 0 ? n : parseFloat(n).toFixed(2))
const btn = (bg, color) => ({ border: 'none', borderRadius: 11, padding: '13px 20px', fontFamily: HEAVY, fontSize: 17, letterSpacing: '0.5px', textTransform: 'uppercase', cursor: 'pointer', background: bg, color })

export default function MenuPrint() {
  const [sections, setSections] = useState(null)
  const [vat, setVat] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => {
    getMenu()
      .then(r => { setSections((r.sections || []).filter(s => (s.items || []).some(it => it.name))); setVat(!!r.vat_registered) })
      .catch(e => setErr(e.message))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: CREAM, color: INK, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ background: CREAM, padding: '16px 16px 14px', textAlign: 'center', borderBottom: `3px solid ${BLUE}` }}>
        <img src={ON_A_ROLL_LOGO} alt="On A Roll" style={{ height: 58, maxWidth: '72%' }} />
      </div>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '18px 16px 60px' }}>
        <h1 style={{ fontFamily: HEAVY, fontSize: 30, color: INK, margin: '2px 0 4px', letterSpacing: '0.5px' }}>On A Roll menu</h1>
        <p style={{ fontSize: 13.5, color: MUTED, margin: '0 0 16px', lineHeight: 1.5 }}>
          Always the latest saved menu. Tap <b>Print</b> (one A4 = two A5 menus, cut down the middle) or <b>Download PDF</b> whenever you need a fresh copy.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <button disabled={!sections} onClick={() => exportMenu(sections, 'print', vat)} style={{ ...btn(BLUE, '#fff'), opacity: sections ? 1 : 0.5 }}>🖨 Print menu</button>
          <button disabled={!sections} onClick={() => exportMenu(sections, 'pdf', vat)} style={{ ...btn(RED, '#fff'), opacity: sections ? 1 : 0.5 }}>⬇ Download PDF</button>
        </div>

        {err && <div style={{ background: '#fff', border: `1px solid ${RED}`, color: RED, borderRadius: 10, padding: '10px 12px', fontSize: 13.5 }}>Couldn't load the menu — {err}</div>}
        {!sections && !err && <div style={{ color: MUTED, padding: '30px 0', textAlign: 'center' }}>Loading the latest menu…</div>}

        {sections && (() => {
          const starred = sections.flatMap(s => (s.items || []).filter(it => it.name && it.star))
          const groups = [
            ...(starred.length ? [{ id: '__specials', name: 'Specials', special: true, items: starred }] : []),
            ...sections.map(s => ({ ...s, items: (s.items || []).filter(it => it.name && !it.star) })).filter(s => s.items.length),
          ]
          return groups.map(sec => (
          <div key={sec.id} style={{ marginBottom: 20, ...(sec.special ? { border: `2px dotted ${INK}`, borderRadius: 14, padding: '14px 16px 6px', background: '#fff8ec' } : {}) }}>
            {sec.special && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: RED, marginBottom: 4 }}>⭑ Specials</div>}
            <div style={{ fontFamily: HEAVY, fontSize: 22, color: BLUE, borderBottom: `2px ${sec.special ? 'dotted' : 'solid'} ${BLUE}`, paddingBottom: 4, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sec.name}</div>
            {sec.items.filter(it => it.name).map(it => {
              const adds = (it.addons || []).filter(a => a.name && a.name.trim())
              return (
                <div key={it.id} style={{ padding: '8px 0', borderBottom: `1px solid ${LINE}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 17 }}>{it.name}</span>
                    <span style={{ fontFamily: HEAVY, color: RED, fontSize: 18 }}>{it.sell ? gbp(parseFloat(it.sell)) : ''}</span>
                  </div>
                  {it.desc && <div style={{ fontSize: 15, color: '#5a5340', lineHeight: 1.42, marginTop: 3 }}>{it.desc}</div>}
                  {adds.length > 0 && <div style={{ fontSize: 13, color: '#7a6f52', fontStyle: 'italic', marginTop: 3 }}>{adds.map(a => `${a.name.trim()} +${gbp(parseFloat(a.price) || 0)}`).join(' · ')}</div>}
                </div>
              )
            })}
          </div>
          ))
        })()}
      </div>
    </div>
  )
}
