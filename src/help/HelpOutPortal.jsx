import React, { useEffect, useMemo, useState } from 'react'
import {
  CATEGORIES, CATEGORY_ICON, TIME_BLOCKS, DEADLINE,
  helpDays, dayWeekday, dayNum, dayLabel,
} from './data.js'
import { TASKS, PRIORITY } from './tasks.js'
import { submitHelper, helpLink } from './api.js'

// ─── No Dice — "Help us open" volunteer portal (/help-out) ─────────────────
// A public, shareable page (no login). A friend fills in their details, ticks
// what they're up for and which days/times suit, and picks dates between now
// and the 19th. The "What needs doing" tab is the jobs board — Elliot's venue
// walk-around, grouped by the same categories so people can see the work.

const RED = '#DA1B33'
const INK = '#000000'
const CARD = '#0A0A0A'
const LINE = 'rgba(255,255,255,0.12)'
const DIM = 'rgba(255,255,255,0.6)'

const deadlineLabel = new Date(DEADLINE + 'T00:00:00')
  .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

const toggle = (arr, v) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])

// ─── Shared chip ────────────────────────────────────────────────────────────
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

  const hasContact = phone.trim() || email.trim()
  const valid = name.trim() && hasContact && cats.length && pickedDays.length

  async function onSubmit(e) {
    e.preventDefault()
    if (!valid || status === 'sending') return
    setStatus('sending'); setError('')
    try {
      await submitHelper({ name, phone, email, categories: cats, days: pickedDays, time_blocks: blocks, note })
      setStatus('done')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.')
      setStatus('error')
    }
  }

  function reset() {
    setName(''); setPhone(''); setEmail(''); setCats([]); setPickedDays([]); setBlocks([]); setNote('')
    setStatus('idle'); setError('')
  }

  if (status === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '24px 4px' }}>
        <div style={{ fontSize: 46, marginBottom: 8 }}>🍻</div>
        <h2 className="serif" style={{ fontSize: 30, margin: '0 0 12px', color: '#fff' }}>You legend — thank you.</h2>
        <p style={{ fontSize: 15, color: DIM, lineHeight: 1.6, maxWidth: 420, margin: '0 auto 8px' }}>
          We’ve got your details. Elliot will text or email you to lock in exactly when to come down and what to jump on.
        </p>
        <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6, maxWidth: 420, margin: '0 auto 26px' }}>
          407 Mentmore Terrace, London Fields, E8 3PH. Aiming to be open by <strong style={{ color: '#fff' }}>{deadlineLabel}</strong>.
        </p>
        <button onClick={reset} style={{ ...inputStyle, width: 'auto', cursor: 'pointer', background: RED, border: `1px solid ${RED}`, fontWeight: 700, padding: '13px 26px' }}>
          Sign up someone else
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit}>
      <p style={{ fontSize: 15, color: DIM, lineHeight: 1.6, margin: '0 0 24px' }}>
        We’re getting No Dice open and there’s a mountain to do — too much for one person. Pop your details in,
        tick what you’re up for and when you’re free, and we’ll sort you a slot. Every hand counts. 🙏
      </p>

      <Field label="Your name"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="First name (or full)" /></Field>
      <Field label="Mobile" hint="So we can text you a time."><input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="07…" inputMode="tel" /></Field>
      <Field label="Email" hint="Phone or email — at least one so we can reach you."><input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" inputMode="email" /></Field>

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

      <Field label="What times suit?" hint="We’re around ~9am to midnight — come before work, on a break, or after.">
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
        {status === 'sending' ? 'Sending…' : "I'm in — sign me up"}
      </button>
      {!valid && (
        <div style={{ fontSize: 12, color: DIM, marginTop: 10, textAlign: 'center' }}>
          Add your name, a phone or email, at least one thing you’re up for, and a day.
        </div>
      )}
    </form>
  )
}

// ─── Jobs board ──────────────────────────────────────────────────────────────
function JobsBoard() {
  const [filter, setFilter] = useState('all')
  const counts = useMemo(() => {
    const m = {}
    for (const t of TASKS) m[t.cat] = (m[t.cat] || 0) + 1
    return m
  }, [])
  const usedCats = CATEGORIES.filter(c => counts[c.key])
  const shown = filter === 'all' ? TASKS : TASKS.filter(t => t.cat === filter)
  const p1 = TASKS.filter(t => t.priority === 'p1').length

  // Order categories by the chosen filter, then render grouped.
  const groups = useMemo(() => {
    const order = filter === 'all' ? usedCats.map(c => c.key) : [filter]
    return order.map(key => ({
      cat: CATEGORIES.find(c => c.key === key),
      items: shown.filter(t => t.cat === key),
    })).filter(g => g.items.length)
  }, [filter, shown]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <p style={{ fontSize: 15, color: DIM, lineHeight: 1.6, margin: '0 0 8px' }}>
        Everything on the list to get No Dice open — <strong style={{ color: '#fff' }}>{TASKS.length} jobs</strong>,{' '}
        <strong style={{ color: RED }}>{p1} needed before we open</strong>. Filter by what you fancy.
      </p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '14px 0 18px', fontSize: 12, color: DIM }}>
        {Object.entries(PRIORITY).map(([k, p]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: p.tone }} /> {p.label}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>All · {TASKS.length}</Chip>
        {usedCats.map(c => (
          <Chip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)}>{c.icon} {c.label} · {counts[c.key]}</Chip>
        ))}
      </div>

      {groups.map(g => (
        <div key={g.cat.key} style={{ marginBottom: 26 }}>
          <div className="serif" style={{ fontSize: 20, color: '#fff', marginBottom: 4 }}>{g.cat.icon} {g.cat.label}</div>
          <div style={{ fontSize: 12.5, color: DIM, marginBottom: 12 }}>{g.cat.blurb}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {g.items.map((t, i) => (
              <div key={i} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span title={PRIORITY[t.priority].label} style={{ width: 9, height: 9, borderRadius: '50%', background: PRIORITY[t.priority].tone, marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, color: '#fff', fontWeight: 600, lineHeight: 1.35 }}>{t.title}</div>
                    {t.detail && <div style={{ fontSize: 12.5, color: DIM, lineHeight: 1.5, marginTop: 4 }}>{t.detail}</div>}
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>{t.area}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page shell ──────────────────────────────────────────────────────────────
export default function HelpOutPortal() {
  const [tab, setTab] = useState('signup') // signup | jobs
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
        {/* Hero */}
        <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 'min(220px, 60vw)', height: 'auto', display: 'block', marginBottom: 16 }} />
        <div style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", fontSize: 'clamp(1.6rem, 6vw, 2.4rem)', letterSpacing: '0.04em', textTransform: 'uppercase', color: RED, lineHeight: 1, marginBottom: 8 }}>
          Help us open
        </div>
        <div style={{ fontSize: 13, color: DIM, marginBottom: 22 }}>
          London Fields · open by <strong style={{ color: '#fff' }}>{deadlineLabel}</strong>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 26, borderBottom: `1px solid ${LINE}`, paddingBottom: 0 }}>
          {[['signup', "I want to help"], ['jobs', 'What needs doing']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              cursor: 'pointer', background: 'transparent', border: 'none', padding: '8px 4px 12px',
              fontSize: 14.5, fontWeight: tab === k ? 700 : 500, color: tab === k ? '#fff' : DIM,
              borderBottom: `2px solid ${tab === k ? RED : 'transparent'}`, marginBottom: -1,
            }}>{label}</button>
          ))}
          <button onClick={share} title="Share this link" style={{
            marginLeft: 'auto', cursor: 'pointer', background: 'transparent', border: `1px solid ${LINE}`,
            borderRadius: 8, padding: '6px 12px', fontSize: 12, color: DIM, alignSelf: 'center', marginBottom: 8,
          }}>{copied ? 'Copied ✓' : 'Share ↗'}</button>
        </div>

        {tab === 'signup' ? <SignUp /> : <JobsBoard />}

        {/* Footer */}
        <div style={{ marginTop: 44, paddingTop: 20, borderTop: `1px solid ${LINE}`, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.34)', lineHeight: 1.9 }}>
          No Dice · 407 Mentmore Terrace, London Fields, E8 3PH
        </div>
      </div>
    </div>
  )
}
