import React, { useEffect, useState } from 'react'

// ─── DateField — the house date input for the team webapp ────────────────────
// HOUSE RULE (founder, Aug 2026): dates on the webapp are TYPED, never native
// scroller-pickers (on phones <input type="date"> opens a wheel you have to spin
// back through months or decades). Type 23041998 and the slashes drop in
// (23/04/1998); dots, dashes and spaces also accepted. Speaks ISO (YYYY-MM-DD)
// to the outside — a drop-in swap for <input type="date">.
//
// Safety semantics: onChange fires with an ISO date only when the text is a
// COMPLETE valid date, and with '' only when the box is fully cleared. A
// half-edited value leaves the form's saved value untouched, so editing can
// never silently wipe a stored date. A red hint shows while the text is
// incomplete.
//
// Props: value (ISO or ''), onChange(isoOr''), style, yearMin/yearMax (defaults
// ±5 years — pass 1930/(now-14) for a DOB), placeholder, autoComplete.
export default function DateField({ value, onChange, style, yearMin, yearMax, placeholder = 'DD/MM/YYYY', autoComplete }) {
  const thisYear = new Date().getFullYear()
  const yMin = yearMin ?? thisYear - 5
  const yMax = yearMax ?? thisYear + 5
  const isoToUk = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}` : ''
  const ukToIso = (t) => {
    const m = String(t || '').trim().match(/^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{4})$/)
    if (!m) return null
    const d = +m[1], mo = +m[2], y = +m[3]
    const dt = new Date(Date.UTC(y, mo - 1, d))
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
    if (y < yMin || y > yMax) return null
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  const [text, setText] = useState(() => isoToUk(value))
  // Re-sync from outside only when the saved value differs from what the box says.
  useEffect(() => { setText(t => (ukToIso(t) === (value || null) || (!t && !value)) ? t : isoToUk(value)) }, [value])   // eslint-disable-line react-hooks/exhaustive-deps
  const handle = (raw) => {
    let v = raw
    // Typing digits? Insert the slashes for them (forward typing only, so
    // deleting behaves normally).
    if (raw.length > text.length && /^[\d/]*$/.test(raw)) {
      const digits = raw.replace(/\D/g, '').slice(0, 8)
      v = digits.length > 4 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
        : digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
    }
    setText(v)
    const iso = ukToIso(v)
    if (iso) onChange(iso)
    else if (!v.trim()) onChange('')
    // otherwise incomplete — leave the form's saved value untouched
  }
  const valid = !!ukToIso(text), empty = !String(text || '').trim()
  return (
    <>
      <input type="text" inputMode="numeric" placeholder={placeholder} autoComplete={autoComplete} value={text}
        onChange={e => handle(e.target.value)}
        style={{ ...style, ...(empty || valid ? {} : { border: '1px solid rgba(248,113,113,0.7)' }) }} />
      {!empty && !valid && <div style={{ fontSize: 10.5, color: '#F87171', marginTop: 3 }}>Type it like 23/04/{String(Math.min(yMax, thisYear))}</div>}
    </>
  )
}
