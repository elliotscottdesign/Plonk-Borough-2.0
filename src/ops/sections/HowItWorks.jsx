import React from 'react'

// ─── How It Works — the system map (founder ask, 11 Aug 2026) ───────────────
// The founder's "whole machine on one page": a spider diagram of every service
// No Dice runs on (Supabase at the centre), plain-English cards per system,
// and a "when something misbehaves" guide. Mirrors the Claude artifact of the
// same date; update BOTH when the architecture changes. Dark-only (ops shell).

const RED = '#DA1B33', TEAL = '#1EC8B8', GREEN = '#3AA02A'
const GOLD = 'var(--gold)'
const CARD = 'rgba(255,255,255,0.035)', LINE = 'rgba(245,239,227,0.14)'
const DIM = 'rgba(245,239,227,0.65)'

const CAST = [
  { accent: RED, role: 'Window · customers', name: 'nodice.bar',
    body: 'The shopfront. Pool & ping pong pages, tournament sign-ups, table bookings, events, deals. Every word of copy is editable in /admin — no developer needed.',
    cost: 'Free to host. Page changes ship via GitHub; word & picture edits go live instantly from /admin.' },
  { accent: RED, role: 'Window · you and the team', name: 'team.nodice.bar',
    body: 'This site: /ops (tournaments, kitchen, stock, finances, key dates), the rota portal staff clock in with, the DJ portal, reservations. Founder-only areas unlock with your code.',
    cost: 'Free to host, same publishing route as the shopfront.' },
  { accent: RED, role: 'The brain', name: 'Supabase',
    body: 'One database holding everything: bookings, payment status, tournaments and league points, staff & rota, kitchen checks, website copy — plus the "little programs" (edge functions) that run tournaments, take checkouts and send pings.',
    cost: 'Free tier today. The one piece everything truly depends on — which is why the backup plan cares about it most.' },
  { accent: null, role: 'The printing press', name: 'GitHub',
    body: 'Stores all the code (two repos — one per site) and re-publishes a site every time code changes. In the August outage the sites stayed up; only new publishing paused. The web-team backup lives here too.',
    cost: 'Free.' },
  { accent: TEAL, role: 'Specialist · money in', name: 'Stripe',
    body: 'Takes every online payment — tournament entries, bookings — by card, Apple Pay or Google Pay, then tells Supabase "paid" so the booking confirms itself. Walk-up pay links use it too.',
    cost: 'Small % per transaction. Payouts land in the bank from Stripe.' },
  { accent: TEAL, role: 'Specialist · email', name: 'Resend',
    body: 'Sends every automatic email as No Dice: booking confirmations, prize vouchers, walk-up pay links, staff-note copies to the founder, DJ blasts, kitchen alerts.',
    cost: 'Pennies; the free tier covers most months.' },
  { accent: GREEN, role: 'Specialist · messages', name: 'Twilio + WhatsApp (Meta)',
    body: 'The "No Dice" WhatsApp identity. Twilio is the post office paid pennies per message; Meta owns WhatsApp and checked our ID once. First job: "you\'re up next" tournament pings. Next: staff shift reminders.',
    cost: '~2–4p per message, no monthly fee.' },
  { accent: GOLD, role: 'Specialist · office', name: 'Google Workspace',
    body: 'elliot@nodice.bar email, Sheets, and the small scripts (like the Xero auto-emailer) that shuffle paperwork.',
    cost: 'Standard Workspace subscription.' },
  { accent: GOLD, role: 'The books', name: 'Lightspeed → Hubdoc → Xero',
    body: 'The money world, mostly separate from the web world: the till (Lightspeed) counts sales, Hubdoc hoovers up bills & receipts, Xero keeps the official books for No Dice Hackney Ltd. The Finances tab reads from this world.',
    cost: 'Xero subscription + till fees.' },
  { accent: null, role: 'The builders', name: 'Claude (the dev team)',
    body: 'Parallel Claude sessions — one lane each for tournaments, rota, kitchen, bar, DJs, marketing, finance — write the code, push it through GitHub, and tend the brain. You steer; they build.',
    cost: 'Claude subscription.' },
]

const TROUBLE = [
  { q: '“The website won’t update”',
    a: 'That’s GitHub (the printing press) — the live site keeps working; new changes queue until GitHub recovers. Word-and-picture edits from /admin skip the press and always go live instantly.' },
  { q: '“Bookings or tournaments look wrong”',
    a: 'That’s the brain — Supabase. Everything reads from it, so a data problem shows up everywhere at once.' },
  { q: '“An email / WhatsApp didn’t arrive”',
    a: 'Resend or Twilio — and both are built so a failed message never breaks the booking or tournament itself. Check spam first; it’s the culprit half the time.' },
  { q: '“Where did the customer’s money go?”',
    a: 'Stripe, always. It pays out to the bank on a rolling schedule, and Xero reconciles it in the books.' },
]

// The spider diagram — same drawing as the founder's artifact, JSX-ified.
function SystemMap() {
  const nodeText = { fontSize: 14, fontWeight: 700, fill: 'var(--cream)' }
  const subText = { fontSize: 11.5, fill: 'var(--cream)', opacity: 0.7 }
  const edgeText = { fontSize: 11.5, fill: 'var(--cream)', opacity: 0.75 }
  return (
    <svg viewBox="0 0 980 720" role="img" aria-label="Spider map: Supabase at the centre; the two websites as windows onto it; Stripe, Resend and WhatsApp as hired specialists; GitHub publishing the sites; Google Workspace and the finance stack alongside." style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', minWidth: 640 }}>
      <defs>
        <marker id="hiw-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--cream)" opacity="0.55" />
        </marker>
      </defs>

      <g stroke="var(--cream)" strokeWidth="1.3" opacity="0.55" fill="none">
        <line x1="292" y1="196" x2="424" y2="311" markerEnd="url(#hiw-arr)" />
        <line x1="688" y1="196" x2="556" y2="311" markerEnd="url(#hiw-arr)" />
        <line x1="176" y1="392" x2="400" y2="372" markerEnd="url(#hiw-arr)" strokeDasharray="5 4" />
        <line x1="804" y1="392" x2="580" y2="372" markerEnd="url(#hiw-arr)" strokeDasharray="5 4" />
        <line x1="252" y1="556" x2="428" y2="428" markerEnd="url(#hiw-arr)" strokeDasharray="5 4" />
        <line x1="728" y1="556" x2="552" y2="428" markerEnd="url(#hiw-arr)" strokeDasharray="5 4" />
        <path d="M 490 96 L 292 148" markerEnd="url(#hiw-arr)" />
        <path d="M 490 96 L 688 148" markerEnd="url(#hiw-arr)" />
        <line x1="118" y1="120" x2="216" y2="160" markerEnd="url(#hiw-arr)" />
        <line x1="862" y1="120" x2="764" y2="160" markerEnd="url(#hiw-arr)" />
        <line x1="490" y1="612" x2="490" y2="660" markerEnd="url(#hiw-arr)" strokeDasharray="2 4" />
      </g>

      <g textAnchor="middle" style={edgeText}>
        <text x="330" y="262">bookings · scores · copy</text>
        <text x="652" y="262">rota · tournaments · admin</text>
        <text x="284" y="368">takes card payments</text>
        <text x="700" y="368">sends the emails</text>
        <text x="316" y="504">WhatsApp pings</text>
        <text x="668" y="504">email · sheets · scripts</text>
        <text x="366" y="106">publishes on every change</text>
        <text x="614" y="106">publishes on every change</text>
        <text x="130" y="152">book &amp; pay</text>
        <text x="856" y="152">run the venue</text>
        <text x="536" y="643">till totals &amp; bills</text>
      </g>

      <g textAnchor="middle" style={{ fontSize: 13, fill: 'var(--cream)', fontWeight: 600 }}>
        <text x="92" y="112">🧑‍🤝‍🧑 Customers</text>
        <text x="886" y="112">🍻 You &amp; staff</text>
      </g>

      <g>
        <rect x="414" y="40" width="152" height="58" rx="12" fill={CARD} stroke="var(--cream)" opacity="0.9" />
        <text x="490" y="64" textAnchor="middle" style={nodeText}>GitHub</text>
        <text x="490" y="82" textAnchor="middle" style={subText}>the printing press</text>
      </g>

      <g>
        <rect x="196" y="146" width="192" height="62" rx="12" fill={CARD} stroke={RED} strokeWidth="1.6" />
        <text x="292" y="172" textAnchor="middle" style={nodeText}>nodice.bar</text>
        <text x="292" y="190" textAnchor="middle" style={subText}>the customer shopfront</text>
      </g>
      <g>
        <rect x="592" y="146" width="192" height="62" rx="12" fill={CARD} stroke={RED} strokeWidth="1.6" />
        <text x="688" y="172" textAnchor="middle" style={nodeText}>team.nodice.bar</text>
        <text x="688" y="190" textAnchor="middle" style={subText}>/ops · rota · DJ portal · admin</text>
      </g>

      <g>
        <circle cx="490" cy="372" r="66" fill={CARD} stroke={RED} strokeWidth="2.4" />
        <text x="490" y="366" textAnchor="middle" style={{ ...nodeText, fontSize: 17 }}>Supabase</text>
        <text x="490" y="386" textAnchor="middle" style={subText}>the brain — all data</text>
        <text x="490" y="402" textAnchor="middle" style={subText}>&amp; little programs</text>
      </g>

      <g>
        <rect x="88" y="364" width="176" height="58" rx="12" fill={CARD} stroke={TEAL} strokeWidth="1.4" />
        <text x="176" y="388" textAnchor="middle" style={nodeText}>Stripe</text>
        <text x="176" y="406" textAnchor="middle" style={subText}>card · Apple/Google Pay</text>
      </g>
      <g>
        <rect x="716" y="364" width="176" height="58" rx="12" fill={CARD} stroke={TEAL} strokeWidth="1.4" />
        <text x="804" y="388" textAnchor="middle" style={nodeText}>Resend</text>
        <text x="804" y="406" textAnchor="middle" style={subText}>confirmations · vouchers</text>
      </g>
      <g>
        <rect x="152" y="528" width="200" height="58" rx="12" fill={CARD} stroke={GREEN} strokeWidth="1.4" />
        <text x="252" y="552" textAnchor="middle" style={nodeText}>Twilio + WhatsApp</text>
        <text x="252" y="570" textAnchor="middle" style={subText}>"No Dice" messages</text>
      </g>
      <g>
        <rect x="628" y="528" width="200" height="58" rx="12" fill={CARD} stroke="var(--gold)" strokeWidth="1.4" />
        <text x="728" y="552" textAnchor="middle" style={nodeText}>Google Workspace</text>
        <text x="728" y="570" textAnchor="middle" style={subText}>elliot@nodice.bar · sheets</text>
      </g>

      <g>
        <rect x="330" y="660" width="320" height="46" rx="12" fill={CARD} stroke="var(--gold)" strokeWidth="1.4" />
        <text x="490" y="688" textAnchor="middle" style={{ ...nodeText, fontSize: 13 }}>Lightspeed till → Hubdoc → Xero</text>
      </g>
      <text x="490" y="636" textAnchor="middle" style={subText}>the money books (separate world)</text>
    </svg>
  )
}

export default function HowItWorks() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div className="serif" style={{ fontSize: 24, color: '#fff' }}>🕸 How No Dice runs</div>
        <div style={{ fontSize: 13.5, color: DIM, marginTop: 4, maxWidth: 640, lineHeight: 1.6 }}>
          The whole machine on one page. Short version: <strong style={{ color: '#fff' }}>Supabase is
          the brain</strong> — every booking, tournament, rota and word of website copy lives
          there — and everything else is either a window onto it or a specialist it hires
          for one job.
        </div>
      </div>

      <div style={{ background: 'var(--ink-2)', border: `1px solid ${LINE}`, borderRadius: 14, padding: 14, overflowX: 'auto' }}>
        <SystemMap />
        <div style={{ fontSize: 12, color: DIM, marginTop: 10, maxWidth: 700, lineHeight: 1.5 }}>
          Solid arrows = the everyday flow (people using the sites, GitHub publishing them,
          sites reading and writing the brain). Dashed arrows = specialists Supabase calls on
          for one job each. The finance chain keeps the books and mostly runs beside the rest.
        </div>
      </div>

      <div>
        <div className="serif" style={{ fontSize: 19, color: '#fff', margin: '10px 0 2px' }}>The cast, in plain English</div>
        <div style={{ fontSize: 12.5, color: DIM, marginBottom: 12 }}>Every system, what it does for the bar, and what it costs.</div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {CAST.map(c => (
            <div key={c.name} style={{ background: CARD, border: `1px solid ${LINE}`, borderTop: `3px solid ${c.accent || LINE}`, borderRadius: 12, padding: '14px 15px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.accent || DIM, marginBottom: 6 }}>{c.role}</div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{c.name}</div>
              <div style={{ fontSize: 13, color: 'var(--cream)', opacity: 0.85, lineHeight: 1.55, marginBottom: 8 }}>{c.body}</div>
              <div style={{ fontSize: 12, color: DIM }}>{c.cost}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="serif" style={{ fontSize: 19, color: '#fff', margin: '10px 0 2px' }}>When something misbehaves</div>
        <div style={{ fontSize: 12.5, color: DIM, marginBottom: 12 }}>Learned the practical way.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TROUBLE.map(t => (
            <div key={t.q} style={{ borderLeft: `3px solid var(--gold)`, paddingLeft: 14 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{t.q}</div>
              <div style={{ fontSize: 13, color: DIM, lineHeight: 1.55, maxWidth: 700 }}>{t.a}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: DIM, letterSpacing: '0.04em', marginTop: 6 }}>
        Drawn 11 August 2026 — this page goes stale as we build; ask any Claude session for a refresh.
      </div>
    </div>
  )
}
