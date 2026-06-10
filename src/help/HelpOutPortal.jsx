import React, { useEffect, useMemo, useState } from 'react'
import {
  CATEGORIES, CATEGORY_LABEL, TIME_BLOCKS, DEADLINE,
  helpDays, dayWeekday, dayNum, capacityFor,
} from './data.js'
import { submitHelper, helpLink } from './api.js'

// ─── No Dice — "Help us open" volunteer portal (/help-out) ─────────────────
// A public, shareable page (no login). A friend fills in their details, ticks
// what they're up for and which days/times suit. On submit the help-out edge
// function auto-assigns jobs (≈30 min each, sized to their availability),
// emails them the list, and we show it here too. The master jobs board is
// admin-only — it lives in /ops → Help Out, not on this public page.

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
    <label style={{ display: 'block', marginBottom: 18 }}>
      <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: RED, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 12, color: DIM, marginTop: 6 }}>{hint}</div>}
    </label>
  )
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', background: '#111', border: `1px solid ${LINE}`,
  borderRadius: 10, padding: '13px 14px', color: '#fff', fontSize: 16, fontFamily: 'inherit',
}

// ─── Success screen — shows the jobs we assigned them ─────────────────────────
function Assigned({ result, emailGiven, onReset }) {
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
        {tasks.length > 0 ? (
          <p style={{ fontSize: 15, color: DIM, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
            Here are {tasks.length} job{tasks.length > 1 ? 's' : ''} to get you started — about 30 min each.
            {result?.emailed ? ' We’ve emailed them to you too.' : (emailGiven ? '' : ' Screenshot this — add an email next time and we’ll send it over.')}
          </p>
        ) : (
          <p style={{ fontSize: 15, color: DIM, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
            You’re on the list! We don’t have specific jobs for that just yet — Elliot will slot you in on the day.
          </p>
        )}
      </div>

      {byCat.map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: RED, fontWeight: 700, marginBottom: 8 }}>{CATEGORY_LABEL[cat] || cat}</div>
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

      <p style={{ fontSize: 13.5, color: DIM, lineHeight: 1.6, textAlign: 'center', margin: '20px auto 22px', maxWidth: 440 }}>
        Come down any time we’re there (~9am–midnight) at 407 Mentmore Terrace, E8 3PH. A job not your thing? Text Elliot and we’ll swap it. Aiming to open by <strong style={{ color: '#fff' }}>{deadlineLabel}</strong>.
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
  const [pickedDays, setPickedDays] = useState([])
  const [blocks, setBlocks] = useState([])
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const hasContact = phone.trim() || email.trim()
  const valid = name.trim() && hasContact && cats.length && pickedDays.length
  const cap = capacityFor(blocks)

  async function onSubmit(e) {
    e.preventDefault()
    if (!valid || status === 'sending') return
    setStatus('sending'); setError('')
    try {
      const r = await submitHelper({ name, phone, email, categories: cats, days: pickedDays, time_blocks: blocks, note })
      setResult(r); setStatus('done')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.')
      setStatus('error')
    }
  }

  function reset() {
    setName(''); setPhone(''); setEmail(''); setCats([]); setPickedDays([]); setBlocks([]); setNote('')
    setStatus('idle'); setError(''); setResult(null)
  }

  if (status === 'done') return <Assigned result={result} emailGiven={!!email.trim()} onReset={reset} />

  return (
    <form onSubmit={onSubmit}>
      <p style={{ fontSize: 15, color: DIM, lineHeight: 1.6, margin: '0 0 24px' }}>
        We’re getting No Dice open and there’s a mountain to do — too much for one person. Pop your details in,
        tick what you’re up for and when you’re free, and we’ll <strong style={{ color: '#fff' }}>email you a few specific jobs</strong> (about 30 min each). Every hand counts. 🙏
      </p>

      <Field label="Your name"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="First name (or full)" /></Field>
      <Field label="Mobile" hint="So we can text you a time."><input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="07…" inputMode="tel" /></Field>
      <Field label="Email" hint="We’ll email your job list here. Phone or email — at least one.">
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

      <Field label="Which days can you come?" hint="Tap every day that could work — we’re there every day until we open.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {days.map(d => {
            const on = pickedDays.includes(d)
            return (
              <button type="button" key={d} onClick={() => setPickedDays(a => toggle(a, d))} style={{
                cursor: 'pointer', borderRadius: 12, padding: '8px 0', width: 64,
                background: on ? RED : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? RED : LINE}`,
                color: on ? '#fff' : 'rgba(255,255,255,0.82)', transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              }}>
                <span style={{ fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{dayWeekday(d)}</span>
                <span style={{ fontSize: 19, fontWeight: 700 }}>{dayNum(d)}</span>
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="What times suit?" hint="We’re around ~9am to midnight — come before work, on a break, or after. (Sets how many jobs we send.)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TIME_BLOCKS.map(b => (
            <Chip key={b.key} active={blocks.includes(b.key)} onClick={() => setBlocks(a => toggle(a, b.key))}>
              {b.label} <span style={{ opacity: 0.7, fontWeight: 400 }}>· {b.hint}</span>
            </Chip>
          ))}
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
        {status === 'sending' ? 'Sending…' : "I'm in — send me my jobs"}
      </button>
      <div style={{ fontSize: 12, color: DIM, marginTop: 10, textAlign: 'center' }}>
        {valid ? `We’ll send you up to ~${cap} job${cap > 1 ? 's' : ''} from what you picked.`
               : 'Add your name, a phone or email, at least one thing you’re up for, and a day.'}
      </div>
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
