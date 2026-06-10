import React, { useEffect, useMemo, useState } from 'react'
import {
  CATEGORIES, CATEGORY_LABEL, DEADLINE,
  helpDays, dayWeekday, dayNum, dayLabel,
  timeOptions, toMin, fmtTime, DEFAULT_SHIFT, shiftLabel, slotsForShifts,
  HELP_START_MIN, HELP_END_MIN, countAt, rangeBlocked, MAX_CONCURRENT,
} from './data.js'
import { submitHelper, helpLink, helpAvailability } from './api.js'

// ─── No Dice — "Help us open" volunteer portal (/helpout) ──────────────────
// Public, no login. A friend picks what they're up for, then for each date they
// can help they set the exact hours (a popup). That shift gets filled with
// ~30-min jobs. Elliot reviews + confirms in /operations; the helper is emailed
// their final jobs once confirmed. The jobs board is admin-only (not here).

const RED = '#DA1B33'
const INK = '#000000'
const CARD = '#0A0A0A'
const LINE = 'rgba(255,255,255,0.12)'
const DIM = 'rgba(255,255,255,0.6)'

const deadlineLabel = new Date(DEADLINE + 'T00:00:00')
  .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

const toggle = (arr, v) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])

function Chip({ active, onClick, children, style }) {
  return (
    <button type="button" onClick={onClick} style={{
      cursor: 'pointer', borderRadius: 999, padding: '9px 15px', fontSize: 13.5, lineHeight: 1.2,
      background: active ? RED : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? RED : LINE}`,
      color: active ? '#fff' : 'rgba(255,255,255,0.82)',
      fontWeight: active ? 700 : 500, transition: 'all 0.15s', ...style,
    }}>{children}</button>
  )
}

function Field({ label, children, hint }) {
  return (
    <div style={{ display: 'block', marginBottom: 18 }}>
      <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: RED, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 12, color: DIM, marginTop: 6 }}>{hint}</div>}
    </div>
  )
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: '#111', border: `1px solid ${LINE}`,
  borderRadius: 10, padding: '13px 14px', color: '#fff', fontSize: 16, fontFamily: 'inherit',
}
const selectStyle = { ...inputStyle, appearance: 'auto', WebkitAppearance: 'menulist' }

// Availability strip — 9am→midnight, coloured by how many are already booked.
function AvailabilityStrip({ others }) {
  const cells = []
  for (let t = HELP_START_MIN; t < HELP_END_MIN; t += 30) cells.push(t)
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 1.5, height: 16, borderRadius: 4, overflow: 'hidden' }}>
        {cells.map(t => {
          const c = countAt(others, t)
          const bg = c >= MAX_CONCURRENT ? RED : c === 1 ? '#FCD34D' : 'rgba(255,255,255,0.1)'
          return <div key={t} title={`${fmtTime(t)} · ${c} booked`} style={{ flex: 1, background: bg }} />
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: DIM, marginTop: 3 }}>
        <span>9am</span><span>3pm</span><span>9pm</span><span>12am</span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 10.5, color: DIM, marginTop: 6 }}>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginRight: 4 }} />free</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#FCD34D', borderRadius: 2, marginRight: 4 }} />1 booked</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, background: RED, borderRadius: 2, marginRight: 4 }} />full (2)</span>
      </div>
    </div>
  )
}

// ─── Time popup — set start & finish for one date ─────────────────────────────
function ShiftModal({ date, value, claims, onSave, onRemove, onClose }) {
  const [start, setStart] = useState(value?.start || DEFAULT_SHIFT.start)
  const [end, setEnd] = useState(value?.end || DEFAULT_SHIFT.end)
  const startOpts = timeOptions(HELP_START_MIN, HELP_END_MIN - 30)
  const endOpts = timeOptions(toMin(start) + 30, HELP_END_MIN)
  const others = (claims || []).filter(c => c.date === date)

  function changeStart(v) {
    setStart(v)
    if (toMin(end) <= toMin(v)) setEnd(timeOptions(toMin(v) + 30, HELP_END_MIN)[0].value)
  }
  const slots = Math.max(0, Math.round((toMin(end) - toMin(start)) / 30))
  const blocked = rangeBlocked(others, start, end)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#0E0E10', border: `1px solid ${LINE}`, borderRadius: 16, padding: '22px 20px' }}>
        <div className="serif" style={{ fontSize: 21, color: '#fff', marginBottom: 4 }}>When can you help?</div>
        <div style={{ fontSize: 13, color: DIM, marginBottom: 16 }}>{dayLabel(date)} · pick your start &amp; finish (we’re here 9am–midnight)</div>

        {others.length > 0 && <AvailabilityStrip others={others} />}

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: RED, fontWeight: 700, marginBottom: 6 }}>Start</div>
            <select value={start} onChange={e => changeStart(e.target.value)} style={selectStyle}>
              {startOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: RED, fontWeight: 700, marginBottom: 6 }}>Finish</div>
            <select value={end} onChange={e => setEnd(e.target.value)} style={selectStyle}>
              {endOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>

        {blocked ? (
          <div style={{ fontSize: 12.5, color: '#fff', background: 'rgba(218,27,51,0.16)', border: `1px solid ${RED}`, borderRadius: 8, padding: '9px 11px', textAlign: 'center', marginBottom: 14 }}>
            Part of that time already has {MAX_CONCURRENT} people — please pick another slot.
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: DIM, textAlign: 'center', marginBottom: 16 }}>
            That’s <strong style={{ color: '#fff' }}>{((slots * 30) / 60).toFixed(slots % 2 ? 1 : 0)}h</strong> — about <strong style={{ color: '#fff' }}>{slots} job{slots !== 1 ? 's' : ''}</strong>.
          </div>
        )}

        <button onClick={() => !blocked && onSave({ start, end })} disabled={blocked} style={{ ...inputStyle, cursor: blocked ? 'not-allowed' : 'pointer', background: blocked ? 'rgba(255,255,255,0.08)' : RED, border: `1px solid ${blocked ? LINE : RED}`, color: blocked ? 'rgba(255,255,255,0.4)' : '#fff', fontWeight: 700, marginBottom: 8 }}>
          Save this shift
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {value && <button onClick={onRemove} style={{ flex: 1, ...inputStyle, width: 'auto', cursor: 'pointer', background: 'transparent', color: DIM, fontSize: 13 }}>Remove day</button>}
          <button onClick={onClose} style={{ flex: 1, ...inputStyle, width: 'auto', cursor: 'pointer', background: 'transparent', color: DIM, fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────
function Done({ result, shifts, onReset }) {
  const tasks = result?.assigned || []
  const byCat = useMemo(() => {
    const m = {}
    for (const t of tasks) (m[t.cat] ||= []).push(t)
    return Object.entries(m)
  }, [tasks])

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ fontSize: 46, marginBottom: 6 }}>🍻</div>
        <h2 className="serif" style={{ fontSize: 30, margin: '0 0 10px', color: '#fff' }}>You legend — thank you.</h2>
        <p style={{ fontSize: 15, color: DIM, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
          We’ve got your shifts. Elliot will confirm your jobs and <strong style={{ color: '#fff' }}>email them over</strong> shortly.
        </p>
      </div>

      {shifts.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: RED, fontWeight: 700, marginBottom: 8 }}>Your shifts</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {shifts.map(s => (
              <div key={s.date} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fff' }}>
                {dayLabel(s.date)} · <span style={{ color: DIM }}>{shiftLabel(s)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: RED, fontWeight: 700, marginBottom: 8 }}>Pencilled in for you ({tasks.length}) — to be confirmed</div>
          {byCat.map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: DIM, marginBottom: 6 }}>{CATEGORY_LABEL[cat] || cat}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(t => (
                  <div key={t.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 14.5, color: '#fff', fontWeight: 600, lineHeight: 1.35 }}>{t.title}</div>
                    {t.detail && <div style={{ fontSize: 12.5, color: DIM, lineHeight: 1.5, marginTop: 4 }}>{t.detail}</div>}
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>{t.area} · ~30 min</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <p style={{ fontSize: 13.5, color: DIM, lineHeight: 1.6, textAlign: 'center', margin: '20px auto 22px', maxWidth: 440 }}>
        407 Mentmore Terrace, E8 3PH. A job not your thing? Text Elliot and we’ll swap it. Aiming to open by <strong style={{ color: '#fff' }}>{deadlineLabel}</strong>.
      </p>
      <div style={{ textAlign: 'center' }}>
        <button onClick={onReset} style={{ ...inputStyle, width: 'auto', cursor: 'pointer', background: RED, border: `1px solid ${RED}`, fontWeight: 700, padding: '13px 26px' }}>
          Sign up someone else
        </button>
      </div>
    </div>
  )
}

// ─── Sign-up form ────────────────────────────────────────────────────────────
function SignUp() {
  const days = useMemo(() => helpDays(), [])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [cats, setCats] = useState([])
  const [shifts, setShifts] = useState({})        // { 'YYYY-MM-DD': {start,end} }
  const [modalDate, setModalDate] = useState(null)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('idle')    // idle | sending | done | error
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [submittedShifts, setSubmittedShifts] = useState([])
  const [claims, setClaims] = useState([])         // others' booked shifts (for the popup)

  useEffect(() => { helpAvailability().then(r => setClaims(r.claims || [])).catch(() => {}) }, [])

  const shiftArr = Object.entries(shifts).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date))
  const hasContact = phone.trim() || email.trim()
  const valid = name.trim() && hasContact && cats.length && shiftArr.length
  const slots = slotsForShifts(shiftArr)

  async function onSubmit(e) {
    e.preventDefault()
    if (!valid || status === 'sending') return
    setStatus('sending'); setError('')
    try {
      const r = await submitHelper({ name, phone, email, categories: cats, shifts: shiftArr, note })
      setResult(r); setSubmittedShifts(shiftArr); setStatus('done')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.')
      setStatus('error')
    }
  }

  function reset() {
    setName(''); setPhone(''); setEmail(''); setCats([]); setShifts({}); setNote('')
    setStatus('idle'); setError(''); setResult(null); setSubmittedShifts([])
  }

  if (status === 'done') return <Done result={result} shifts={submittedShifts} onReset={reset} />

  return (
    <form onSubmit={onSubmit}>
      <p style={{ fontSize: 15, color: DIM, lineHeight: 1.6, margin: '0 0 24px' }}>
        We’re getting No Dice open and there’s a mountain to do — too much for one person. Tell us what you’re up for and the
        hours you can help, and we’ll line up <strong style={{ color: '#fff' }}>specific jobs</strong> (about 30 min each) for your shift. Every hand counts. 🙏
      </p>

      <Field label="Your name"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="First name (or full)" /></Field>
      <Field label="Mobile" hint="So we can text you a time."><input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="07…" inputMode="tel" /></Field>
      <Field label="Email" hint="We’ll email your confirmed jobs here. Phone or email — at least one.">
        <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" inputMode="email" />
      </Field>

      <Field label="What are you up for?" hint="Tick anything you’d be happy to help with — no skills needed for most of it.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map(c => (
            <Chip key={c.key} active={cats.includes(c.key)} onClick={() => setCats(a => toggle(a, c.key))}>
              {c.icon} {c.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="When can you help?" hint="Tap a day, then set the exact hours you can do. Add as many days as you like.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {days.map(d => {
            const s = shifts[d]
            return (
              <button type="button" key={d} onClick={() => setModalDate(d)} style={{
                cursor: 'pointer', borderRadius: 12, padding: s ? '8px 6px' : '8px 0', minWidth: 64,
                background: s ? RED : 'rgba(255,255,255,0.04)', border: `1px solid ${s ? RED : LINE}`,
                color: s ? '#fff' : 'rgba(255,255,255,0.82)', transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              }}>
                <span style={{ fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{dayWeekday(d)}</span>
                <span style={{ fontSize: 19, fontWeight: 700 }}>{dayNum(d)}</span>
                {s && <span style={{ fontSize: 10.5, opacity: 0.95, marginTop: 1, whiteSpace: 'nowrap' }}>{shiftLabel(s)}</span>}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Anything else? (optional)">
        <textarea style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }} value={note} onChange={e => setNote(e.target.value)} placeholder="Tools you can bring, a mate coming too, times to avoid…" />
      </Field>

      {status === 'error' && (
        <div style={{ background: 'rgba(218,27,51,0.12)', border: `1px solid ${RED}`, borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 13.5, marginBottom: 16 }}>{error}</div>
      )}

      <button type="submit" disabled={!valid || status === 'sending'} style={{
        width: '100%', cursor: valid && status !== 'sending' ? 'pointer' : 'not-allowed',
        background: valid ? RED : 'rgba(255,255,255,0.08)', border: `1px solid ${valid ? RED : LINE}`,
        color: valid ? '#fff' : 'rgba(255,255,255,0.4)', borderRadius: 12, padding: '16px',
        fontSize: 16, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
      }}>
        {status === 'sending' ? 'Sending…' : "I'm in — sign me up"}
      </button>
      <div style={{ fontSize: 12, color: DIM, marginTop: 10, textAlign: 'center' }}>
        {valid ? `We’ll line up about ${slots} job${slots !== 1 ? 's' : ''} across your shift${shiftArr.length > 1 ? 's' : ''} and confirm by email.`
               : 'Add your name, a phone or email, at least one thing you’re up for, and a day with your hours.'}
      </div>

      {modalDate && (
        <ShiftModal
          date={modalDate}
          value={shifts[modalDate]}
          claims={claims}
          onSave={(v) => { setShifts(s => ({ ...s, [modalDate]: v })); setModalDate(null) }}
          onRemove={() => { setShifts(s => { const n = { ...s }; delete n[modalDate]; return n }); setModalDate(null) }}
          onClose={() => setModalDate(null)}
        />
      )}
    </form>
  )
}

// ─── Page shell ──────────────────────────────────────────────────────────────
export default function HelpOutPortal() {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const prevBg = document.body.style.background, prevColor = document.body.style.color
    document.body.style.background = INK
    document.body.style.color = '#fff'
    document.title = 'No Dice — Help us open'
    return () => { document.body.style.background = prevBg; document.body.style.color = prevColor }
  }, [])

  function share() {
    const url = helpLink()
    if (navigator.share) { navigator.share({ title: 'Help No Dice open', text: 'Lend a hand getting No Dice open?', url }).catch(() => {}) }
    else { navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) }).catch(() => {}) }
  }

  return (
    <div style={{ minHeight: '100vh', background: INK, color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 64px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 'min(220px, 60vw)', height: 'auto', display: 'block', marginBottom: 16 }} />
          <button onClick={share} title="Share this link" style={{
            cursor: 'pointer', background: 'transparent', border: `1px solid ${LINE}`,
            borderRadius: 8, padding: '6px 12px', fontSize: 12, color: DIM, whiteSpace: 'nowrap',
          }}>{copied ? 'Copied ✓' : 'Share ↗'}</button>
        </div>
        <div style={{ fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>Help Out</div>
        <div style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 'clamp(1.6rem, 6vw, 2.4rem)', letterSpacing: '0.04em', textTransform: 'uppercase', color: RED, lineHeight: 1, marginBottom: 8 }}>
          Help us open
        </div>
        <div style={{ fontSize: 13, color: DIM, marginBottom: 28 }}>
          London Fields · open by <strong style={{ color: '#fff' }}>{deadlineLabel}</strong>
        </div>

        <SignUp />

        <div style={{ marginTop: 44, paddingTop: 20, borderTop: `1px solid ${LINE}`, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.34)', lineHeight: 1.9 }}>
          No Dice · 407 Mentmore Terrace, London Fields, E8 3PH
        </div>
      </div>
    </div>
  )
}
