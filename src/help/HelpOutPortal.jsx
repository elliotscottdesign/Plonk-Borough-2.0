import React, { useEffect, useMemo, useState } from 'react'
import {
  CATEGORIES, CATEGORY_LABEL, DEADLINE, HELP_RANGE_END, SKILL_LEVELS,
  helpStartISO, dayLabel, iso,
  timeOptions, toMin, fmtTime, DEFAULT_SHIFT, shiftLabel,
  HELP_START_MIN, HELP_END_MIN, countAt, rangeBlocked, MAX_CONCURRENT, capFor,
} from './data.js'
import { submitHelper, helpLink, helpAvailability, helperLink, helperLoad, helperMarkDone, helperUndone, helperHandBack } from './api.js'

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
function AvailabilityStrip({ others, cap }) {
  const cells = []
  for (let t = HELP_START_MIN; t < HELP_END_MIN; t += 30) cells.push(t)
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 1.5, height: 16, borderRadius: 4, overflow: 'hidden' }}>
        {cells.map(t => {
          const c = countAt(others, t)
          const bg = c >= cap ? RED : c >= 1 ? '#FCD34D' : 'rgba(255,255,255,0.1)'
          return <div key={t} title={`${fmtTime(t)} · ${c} booked`} style={{ flex: 1, background: bg }} />
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: DIM, marginTop: 3 }}>
        <span>9am</span><span>3pm</span><span>9pm</span><span>12am</span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 10.5, color: DIM, marginTop: 6 }}>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginRight: 4 }} />free</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#FCD34D', borderRadius: 2, marginRight: 4 }} />some booked</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, background: RED, borderRadius: 2, marginRight: 4 }} />full ({cap})</span>
      </div>
    </div>
  )
}

// ─── Time popup — set start & finish for one date ─────────────────────────────
function ShiftModal({ date, value, claims, cap, onSave, onRemove, onClose }) {
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
  const blocked = rangeBlocked(others, start, end, cap)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#0E0E10', border: `1px solid ${LINE}`, borderRadius: 16, padding: '22px 20px' }}>
        <div className="serif" style={{ fontSize: 21, color: '#fff', marginBottom: 4 }}>When can you help?</div>
        <div style={{ fontSize: 13, color: DIM, marginBottom: 16 }}>{dayLabel(date)} · pick your start &amp; finish (we’re here 9am–midnight)</div>

        {others.length > 0 && <AvailabilityStrip others={others} cap={cap} />}

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
            Part of that time already has {cap} {cap === 1 ? 'person' : 'people'} — please pick another slot.
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

// ─── Month calendar — pick any day from now to end of July ────────────────────
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function MonthPicker({ shifts, onPick, startISO, endISO }) {
  const start = new Date(startISO + 'T00:00:00')
  const end = new Date(endISO + 'T00:00:00')
  const [vm, setVm] = useState(() => new Date(start.getFullYear(), start.getMonth(), 1))
  const y = vm.getFullYear(), m = vm.getMonth()
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)
  const monthStart = new Date(y, m, 1)
  const canPrev = monthStart > new Date(start.getFullYear(), start.getMonth(), 1)
  const canNext = monthStart < new Date(end.getFullYear(), end.getMonth(), 1)
  const navBtn = (on) => ({ background: 'transparent', border: 'none', color: on ? RED : 'rgba(255,255,255,0.18)', fontSize: 18, cursor: on ? 'pointer' : 'default', padding: '2px 12px' })

  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button type="button" onClick={() => canPrev && setVm(new Date(y, m - 1, 1))} disabled={!canPrev} style={navBtn(canPrev)}>◀</button>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{MONTH_NAMES[m]} {y}</div>
        <button type="button" onClick={() => canNext && setVm(new Date(y, m + 1, 1))} disabled={!canNext} style={navBtn(canNext)}>▶</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 5 }}>
        {DOW_SHORT.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: DIM, fontWeight: 600 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const date = new Date(y, m, day)
          const ds = iso(date)
          const inRange = date >= start && date <= end
          const sh = shifts[ds]
          return (
            <button type="button" key={i} disabled={!inRange} onClick={() => inRange && onPick(ds)} style={{
              aspectRatio: '1 / 1', borderRadius: 8, cursor: inRange ? 'pointer' : 'default', padding: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              background: sh ? RED : (inRange ? 'rgba(255,255,255,0.04)' : 'transparent'),
              border: `1px solid ${sh ? RED : (inRange ? LINE : 'transparent')}`,
              color: sh ? '#fff' : (inRange ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.18)'),
            }}>
              <span style={{ fontSize: 13, fontWeight: sh ? 700 : 500 }}>{day}</span>
              {sh && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
            </button>
          )
        })}
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

      {result?.token && (
        <a href={helperLink(result.token)} style={{ display: 'block', textAlign: 'center', marginBottom: 18, background: 'rgba(218,27,51,0.12)', border: `1px solid ${RED}`, borderRadius: 10, padding: '12px 14px', textDecoration: 'none', color: '#fff', fontSize: 13.5 }}>
          📌 <strong>Save your job-list link</strong> — open it any time to tick jobs off as you finish them.
        </a>
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
  const startISO = useMemo(() => helpStartISO(), [])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [cats, setCats] = useState([])
  const [skill, setSkill] = useState('')
  const [shifts, setShifts] = useState({})        // { 'YYYY-MM-DD': {start,end} }
  const [modalDate, setModalDate] = useState(null)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('idle')    // idle | sending | done | error
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [submittedShifts, setSubmittedShifts] = useState([])
  const [claims, setClaims] = useState([])         // others' booked shifts (for the popup)
  const [capCfg, setCapCfg] = useState({ defaultCap: MAX_CONCURRENT, dayCaps: {} })

  useEffect(() => {
    helpAvailability().then(r => {
      setClaims(r.claims || [])
      setCapCfg({ defaultCap: r.defaultCap ?? MAX_CONCURRENT, dayCaps: r.dayCaps || {} })
    }).catch(() => {})
  }, [])

  const shiftArr = Object.entries(shifts).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date))
  const hasContact = phone.trim() || email.trim()
  const valid = name.trim() && hasContact && cats.length && skill && shiftArr.length

  async function onSubmit(e) {
    e.preventDefault()
    if (!valid || status === 'sending') return
    setStatus('sending'); setError('')
    try {
      const r = await submitHelper({ name, phone, email, categories: cats, skill, shifts: shiftArr, note })
      setResult(r); setSubmittedShifts(shiftArr); setStatus('done')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.')
      setStatus('error')
    }
  }

  function reset() {
    setName(''); setPhone(''); setEmail(''); setCats([]); setSkill(''); setShifts({}); setNote('')
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

      <Field label="How handy are you?" hint="So we only give you jobs that suit. Be honest — there's plenty for every level!">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SKILL_LEVELS.map(s => (
            <button type="button" key={s.key} onClick={() => setSkill(s.key)} title={s.blurb} style={{
              cursor: 'pointer', borderRadius: 12, padding: '10px 14px', flex: '1 1 150px', textAlign: 'left',
              background: skill === s.key ? RED : 'rgba(255,255,255,0.04)', border: `1px solid ${skill === s.key ? RED : LINE}`,
              color: skill === s.key ? '#fff' : 'rgba(255,255,255,0.82)', transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 2 }}>{s.blurb}</div>
            </button>
          ))}
        </div>
      </Field>

      <Field label="When can you help?" hint="Tap any day from now to the end of July, then set your hours. Help before, during or after we open.">
        <MonthPicker shifts={shifts} onPick={(ds) => setModalDate(ds)} startISO={startISO} endISO={HELP_RANGE_END} />
        {shiftArr.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {shiftArr.map(s => (
              <button type="button" key={s.date} onClick={() => setModalDate(s.date)} style={{ cursor: 'pointer', borderRadius: 999, padding: '7px 13px', fontSize: 13, background: 'rgba(218,27,51,0.14)', border: `1px solid ${RED}`, color: '#fff' }}>
                {dayLabel(s.date)} · {shiftLabel(s)} ✎
              </button>
            ))}
          </div>
        )}
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
        {valid ? 'Elliot will line up jobs that suit your skills and email them to you.'
               : 'Add your name, a contact, what you’re up for, your level, and a day with your hours.'}
      </div>

      {modalDate && (
        <ShiftModal
          date={modalDate}
          value={shifts[modalDate]}
          claims={claims}
          cap={capFor(modalDate, capCfg.defaultCap, capCfg.dayCaps)}
          onSave={(v) => { setShifts(s => ({ ...s, [modalDate]: v })); setModalDate(null) }}
          onRemove={() => { setShifts(s => { const n = { ...s }; delete n[modalDate]; return n }); setModalDate(null) }}
          onClose={() => setModalDate(null)}
        />
      )}
    </form>
  )
}

// ─── Helper's private job list (/helpout?t=token) ─────────────────────────────
const STATE_UI = {
  todo:      { label: 'To do',          tone: 'rgba(255,255,255,0.5)' },
  done:      { label: 'Done — checking', tone: '#FCD34D' },
  completed: { label: 'Signed off ✓',    tone: '#34D399' },
}
function HelperTasks({ token }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  async function load() {
    setLoading(true); setErr('')
    try { setData(await helperLoad(token)) }
    catch (e) { setErr(e.message || 'Could not load your list') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [token])

  async function act(key, fn) {
    setBusy(key)
    try { await fn(); await load() }
    catch (e) { setErr(e.message) }
    finally { setBusy('') }
  }

  if (loading) return <div style={{ color: DIM, fontSize: 14, padding: '8px 0' }}>Loading your jobs…</div>
  if (err && !data) return <div style={{ background: 'rgba(218,27,51,0.12)', border: `1px solid ${RED}`, borderRadius: 10, padding: '14px 16px', color: '#fff', fontSize: 14 }}>{err}</div>

  const tasks = data?.tasks || []
  const order = { todo: 0, done: 1, completed: 2 }
  const sorted = [...tasks].sort((a, b) => (order[a.state] - order[b.state]))
  const doneCount = tasks.filter(t => t.state !== 'todo').length
  const pending = data.status !== 'confirmed'

  return (
    <div>
      <p style={{ fontSize: 15, color: DIM, lineHeight: 1.6, margin: '0 0 6px' }}>
        Hi <strong style={{ color: '#fff' }}>{data.name}</strong> — {pending
          ? <>thanks for signing up! Elliot is lining up the right jobs for you and will confirm them shortly.</>
          : <>here’s your job list. Tap <strong style={{ color: '#fff' }}>Mark done</strong> as you finish each one; Elliot signs them off.</>}
      </p>
      {(data.shifts || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0 6px' }}>
          {data.shifts.map(s => (
            <span key={s.date} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 999, padding: '6px 12px', fontSize: 12.5, color: '#fff' }}>{dayLabel(s.date)} · <span style={{ color: DIM }}>{shiftLabel(s)}</span></span>
          ))}
        </div>
      )}
      {!pending && <div style={{ fontSize: 12.5, color: DIM, margin: '8px 0 18px' }}>{doneCount} of {tasks.length} done</div>}

      {err && <div style={{ background: 'rgba(218,27,51,0.12)', border: `1px solid ${RED}`, borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13, marginBottom: 12 }}>{err}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map(t => {
          const ui = STATE_UI[t.state] || STATE_UI.todo
          const isCompleted = t.state === 'completed'
          const isDone = t.state === 'done'
          return (
            <div key={t.id} style={{ background: CARD, border: `1px solid ${isCompleted ? 'rgba(52,211,153,0.4)' : isDone ? 'rgba(252,211,36,0.4)' : LINE}`, borderRadius: 12, padding: '14px 16px', opacity: isCompleted ? 0.7 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: '#fff', fontWeight: 600, lineHeight: 1.35, textDecoration: isCompleted ? 'line-through' : 'none' }}>{t.title}</div>
                  {t.detail && <div style={{ fontSize: 12.5, color: DIM, lineHeight: 1.5, marginTop: 4 }}>{t.detail}</div>}
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>{t.area} · ~30 min</div>
                </div>
                <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: ui.tone, whiteSpace: 'nowrap' }}>{ui.label}</span>
              </div>
              {!isCompleted && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {isDone ? (
                    <button onClick={() => act(`u-${t.id}`, () => helperUndone(token, t.id))} disabled={busy === `u-${t.id}`} style={{ cursor: 'pointer', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`, color: '#fff' }}>{busy === `u-${t.id}` ? '…' : '↩ Not done yet'}</button>
                  ) : (
                    <button onClick={() => act(`d-${t.id}`, () => helperMarkDone(token, t.id))} disabled={busy === `d-${t.id}`} style={{ cursor: 'pointer', borderRadius: 8, padding: '9px 18px', fontSize: 13.5, fontWeight: 700, background: RED, border: `1px solid ${RED}`, color: '#fff' }}>{busy === `d-${t.id}` ? '…' : '✓ Mark done'}</button>
                  )}
                  <button onClick={() => { if (window.confirm('Hand this job back so someone else can pick it up?')) act(`h-${t.id}`, () => helperHandBack(token, t.id)) }} disabled={busy === `h-${t.id}`} style={{ cursor: 'pointer', borderRadius: 8, padding: '9px 14px', fontSize: 12.5, background: 'transparent', border: 'none', color: DIM, textDecoration: 'underline' }}>{busy === `h-${t.id}` ? '…' : 'Can’t do this one'}</button>
                </div>
              )}
            </div>
          )
        })}
        {!tasks.length && <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 18, fontSize: 14, color: DIM, lineHeight: 1.6 }}>{pending ? '⏳ Elliot is sorting your jobs — they’ll appear here as soon as your shift is confirmed. We’ll let you know.' : 'No jobs on your list yet — Elliot will add some shortly.'}</div>}
      </div>

      <p style={{ fontSize: 12.5, color: DIM, lineHeight: 1.6, marginTop: 22, textAlign: 'center' }}>
        Bookmark this page — it’s your personal list. Thank you for getting us open. 🙏
      </p>
    </div>
  )
}

// ─── Page shell ──────────────────────────────────────────────────────────────
export default function HelpOutPortal() {
  const token = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('t') : null
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
          {!token && (
            <button onClick={share} title="Share this link" style={{
              cursor: 'pointer', background: 'transparent', border: `1px solid ${LINE}`,
              borderRadius: 8, padding: '6px 12px', fontSize: 12, color: DIM, whiteSpace: 'nowrap',
            }}>{copied ? 'Copied ✓' : 'Share ↗'}</button>
          )}
        </div>
        <div style={{ fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>Help Out</div>
        <div style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 'clamp(1.6rem, 6vw, 2.4rem)', letterSpacing: '0.04em', textTransform: 'uppercase', color: RED, lineHeight: 1, marginBottom: 8 }}>
          Help us open
        </div>
        <div style={{ fontSize: 13, color: DIM, marginBottom: 28 }}>
          {token ? 'Your job list' : <>London Fields · open by <strong style={{ color: '#fff' }}>{deadlineLabel}</strong></>}
        </div>

        {token ? <HelperTasks token={token} /> : <SignUp />}

        <div style={{ marginTop: 44, paddingTop: 20, borderTop: `1px solid ${LINE}`, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.34)', lineHeight: 1.9 }}>
          No Dice · 407 Mentmore Terrace, London Fields, E8 3PH
        </div>
      </div>
    </div>
  )
}
