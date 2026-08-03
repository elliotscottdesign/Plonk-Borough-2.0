import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../marketing/data/backend.js'

// ─── Reservations — customer bookings + tournament sign-ups (near-live) ────
// 2026-08-02 — bridges the two-site split. nodice.bar writes bookings to the
// shared Supabase; this section reads them into the ops platform so the team
// can plan the shift.
//
// Data sources (all read-only here — nodice.bar owns the write flows):
//   • bar_reservations  — 🍽 Tables + 🎱 Pool (from /book/table + /book/pool
//                         customer flow AND admin manual entry)
//   • tournament_entries — 🏆 Pool tournament sign-ups (paid) joined to
//                          tournaments for the event date/name
//   • bookings          — ⛳ Golf tee times (from /book/hackney catalogue flow)
//
// Live-ish via 15s polling: new bookings appear within 15 seconds of the
// Stripe confirmation. We tried Supabase Realtime (WebSocket) first but it
// clashed with Vite's react-refresh in dev — the realtime-js client's
// globalThis touch on construction spammed React's "invalid hook call"
// detector. Polling is simpler, no dependency, no dev-mode noise. If sub-
// second latency ever matters more than the dependency cost, the swap-in
// point is the pollUntilFresh() effect at the bottom.
//
// Phase 1 scope: Today + Week views, grouped by kind, sortable by time. Big
// bookings (>=8 covers) get a highlight. Later phases: rota integration,
// print sheet, stock forecast link.

const GOLD = '#C9A84C', GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33'
const BLUE = '#60A5FA', PURPLE = '#A855F7', TEAL = '#1ec8b8'
const CARD = 'rgba(255,255,255,0.03)', LINE = 'rgba(201,168,76,0.18)'
const BIG_PARTY_THRESHOLD = 8   // covers at or above this get the "big" flag
const POLL_MS = 15000           // 15s — comfortable balance of freshness + load

// ── Fetch helper (raw PostgREST — matches the rest of this ops repo which
//    talks to Supabase via fetch, no @supabase/supabase-js dep needed) ────
async function pgGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text().catch(() => '')}`)
  return res.json()
}

// ── Date helpers ────────────────────────────────────────────────────────────
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayIso = () => iso(new Date())
const plusDays = (base, n) => { const d = new Date(base + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d) }
const fmtDay = (isoDate) => new Date(isoDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtTime = (hhmmss) => hhmmss ? hhmmss.slice(0, 5) : '—'

// ── Kind styling ────────────────────────────────────────────────────────────
const KIND_META = {
  table:      { emoji: '🍽', label: 'Table',            color: GOLD },
  pool:       { emoji: '🎱', label: 'Pool table',       color: TEAL },
  golf:       { emoji: '⛳', label: 'Golf',              color: GREEN },
  tournament: { emoji: '🏆', label: 'Pool tournament',   color: PURPLE },
}

export default function Reservations() {
  const [range, setRange] = useState('today')       // 'today' | 'week'
  const [rows, setRows] = useState([])              // normalised reservations
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  // Date window for the query
  const { from, to } = useMemo(() => {
    const today = todayIso()
    return range === 'today' ? { from: today, to: today } : { from: today, to: plusDays(today, 6) }
  }, [range])

  const reload = useCallback(async () => {
    setErr('')
    try {
      // Fire the three source queries in parallel — one bad table shouldn't
      // block the good ones (Promise.allSettled), then normalise into one list.
      const [barRes, tournRes, golfRes] = await Promise.allSettled([
        pgGet(`bar_reservations?select=id,kind,reservation_date,start_time,duration_minutes,party_size,resource_count,name,email,phone,notes,status,heard_from&status=eq.confirmed&reservation_date=gte.${from}&reservation_date=lte.${to}&order=reservation_date,start_time`),
        // tournament_entries joined to tournaments for event date/name. Filter
        // the join column via PostgREST's foreign-table syntax.
        pgGet(`tournament_entries?select=id,tournament_id,team_name,captain_name,captain_email,captain_phone,notes,status,tournaments!inner(name,event_date,start_time,tournament_type)&status=eq.paid&tournaments.event_date=gte.${from}&tournaments.event_date=lte.${to}&order=paid_at`),
        // Golf catalogue bookings — likely empty until plonkgolf.co.uk relaunch
        // sends volume through here. Included so the pattern is in place.
        pgGet(`bookings?select=id,reference,customer_name,customer_email,customer_phone,party_size,total_pence,status,created_at,booking_slots(slot_date,slot_time)&status=eq.confirmed&order=created_at.desc&limit=100`),
      ])
      const bar = barRes.status === 'fulfilled' ? barRes.value : []
      const tourn = tournRes.status === 'fulfilled' ? tournRes.value : []
      const golf = golfRes.status === 'fulfilled' ? golfRes.value : []

      const out = []
      for (const r of bar) {
        out.push({
          id: r.id,
          kind: r.kind === 'pool' ? 'pool' : 'table',
          date: r.reservation_date,
          time: r.start_time,
          party: r.party_size || 0,
          name: r.name || 'Guest',
          notes: r.notes || '',
          email: r.email || '',
          phone: r.phone || '',
          extra: r.kind === 'pool' && r.resource_count > 1 ? `${r.resource_count} tables` : (r.duration_minutes ? `${r.duration_minutes} min` : ''),
        })
      }
      for (const t of tourn) {
        const evDate = t.tournaments?.event_date
        if (!evDate || evDate < from || evDate > to) continue
        out.push({
          id: t.id,
          kind: 'tournament',
          date: evDate,
          time: t.tournaments?.start_time || null,
          // Doubles teams count as 2 heads if the team_name is distinct from captain_name
          party: t.team_name && t.team_name !== t.captain_name ? 2 : 1,
          name: t.team_name || t.captain_name || 'Player',
          notes: t.notes || '',
          email: t.captain_email || '',
          phone: t.captain_phone || '',
          extra: t.tournaments?.name || '',
        })
      }
      for (const g of golf) {
        const slots = (g.booking_slots || []).slice().sort((a, b) => `${a.slot_date}T${a.slot_time}`.localeCompare(`${b.slot_date}T${b.slot_time}`))
        const first = slots[0]
        if (!first || first.slot_date < from || first.slot_date > to) continue
        out.push({
          id: g.id,
          kind: 'golf',
          date: first.slot_date,
          time: first.slot_time,
          party: g.party_size || 0,
          name: g.customer_name || 'Guest',
          notes: g.reference ? `Ref ${g.reference}` : '',
          email: g.customer_email || '',
          phone: g.customer_phone || '',
          extra: slots.length > 1 ? `${slots.length} slots` : '',
        })
      }
      out.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
      setRows(out)
      setLastRefresh(new Date())
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [from, to])

  // Initial + on range change
  useEffect(() => { setLoading(true); reload() }, [reload])

  // 15s polling. Stops when the tab is hidden to save battery / bandwidth;
  // resumes + fetches immediately on show. Fresher than a manual refresh,
  // simpler than a WebSocket. Upgrade path to Supabase Realtime documented
  // at the top of this file.
  const reloadRef = useRef(reload)
  useEffect(() => { reloadRef.current = reload }, [reload])
  useEffect(() => {
    let id = null
    const tick = () => { if (!document.hidden) reloadRef.current() }
    const start = () => { if (!id) id = setInterval(tick, POLL_MS) }
    const stop = () => { if (id) { clearInterval(id); id = null } }
    const onVis = () => { if (document.hidden) stop(); else { start(); tick() } }
    start()
    document.addEventListener('visibilitychange', onVis)
    return () => { stop(); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  // ── Summary counts ────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { total: rows.length, covers: 0, big: 0, byKind: {} }
    for (const r of rows) {
      c.covers += r.party
      if (r.party >= BIG_PARTY_THRESHOLD) c.big++
      c.byKind[r.kind] = (c.byKind[r.kind] || 0) + 1
    }
    return c
  }, [rows])

  const byDate = useMemo(() => {
    const m = {}
    for (const r of rows) (m[r.date] ||= []).push(r)
    return m
  }, [rows])

  // Print sheet — strip the ops chrome and render a clean paper handout
  // (title + date + row list). @media print rules hide everything outside
  // .rs-print-root and swap the dark theme for paper-friendly black-on-white.
  const printHeader = range === 'today' ? fmtDay(todayIso()) : `${fmtDay(from)} → ${fmtDay(to)}`
  const totalCovers = counts.covers

  return (
    <div className="rs-print-root" style={{ display: 'flex', flexDirection: 'column', gap: 18, color: 'var(--cream)' }}>
      <style>{`
        @media print {
          @page { margin: 14mm; size: A4; }
          html, body { background: #fff !important; color: #000 !important; }
          /* Hide everything on the page EXCEPT this section's rows */
          body > * { visibility: hidden !important; }
          .rs-print-root, .rs-print-root * { visibility: visible !important; }
          .rs-print-root { position: absolute; inset: 0; padding: 0 !important; }
          .rs-no-print { display: none !important; }
          .rs-print-only { display: block !important; }
          /* Force readable colours on the print sheet */
          .rs-print-root, .rs-print-root * {
            color: #000 !important; background: #fff !important;
            border-color: #999 !important; box-shadow: none !important;
          }
          .rs-print-root h1, .rs-print-root h2 { color: #000 !important; }
          .rs-row { break-inside: avoid; page-break-inside: avoid; }
        }
        .rs-print-only { display: none; }
      `}</style>

      {/* Print-only header — appears when the sheet is rendered on paper */}
      <div className="rs-print-only" style={{ marginBottom: 14 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, margin: 0 }}>Reservations — {printHeader}</h1>
        <div style={{ fontSize: 13, marginTop: 4 }}>{counts.total} booking{counts.total === 1 ? '' : 's'} · {totalCovers} cover{totalCovers === 1 ? '' : 's'}{counts.big ? ` · ${counts.big} big part${counts.big === 1 ? 'y' : 'ies'} (${BIG_PARTY_THRESHOLD}+)` : ''}</div>
        <div style={{ fontSize: 11, marginTop: 2 }}>Printed {new Date().toLocaleString('en-GB')}</div>
      </div>

      {/* Header — range picker + live indicator (screen only) */}
      <div className="rs-no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 22, color: 'var(--gold)' }}>📇 Reservations</div>
          <div style={{ fontSize: 12.5, color: 'var(--cream-dim)', marginTop: 3 }}>Every table, pool, golf and tournament booking — live from the site. Auto-refreshes every 15 seconds.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setRange('today')} style={rangeBtn(range === 'today')}>Today</button>
          <button onClick={() => setRange('week')} style={rangeBtn(range === 'week')}>Next 7 days</button>
          <button onClick={reload} style={{ ...rangeBtn(false), marginLeft: 6 }} title="Force reload">↻</button>
          <button onClick={() => window.print()} style={{ ...rangeBtn(false), marginLeft: 6 }} title="Print a paper handout for the door / kitchen">🖨 Print sheet</button>
        </div>
      </div>

      {/* Live indicator */}
      <div className="rs-no-print" style={{ fontSize: 11, color: lastRefresh ? GREEN : 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: lastRefresh ? GREEN : 'rgba(255,255,255,0.25)', boxShadow: lastRefresh ? `0 0 6px ${GREEN}` : 'none' }} />
        {lastRefresh ? `Live · last check ${lastRefresh.toLocaleTimeString('en-GB')}` : 'Connecting…'}
      </div>

      {/* Summary pills */}
      <div className="rs-no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <SummaryPill label="Bookings" value={counts.total} color={GOLD} />
        <SummaryPill label="Covers" value={counts.covers} color={GREEN} />
        {counts.big > 0 && <SummaryPill label={`Big parties (${BIG_PARTY_THRESHOLD}+)`} value={counts.big} color={AMBER} />}
        {Object.entries(counts.byKind).map(([k, n]) => (
          <SummaryPill key={k} label={KIND_META[k]?.label || k} value={n} color={KIND_META[k]?.color || 'rgba(255,255,255,0.4)'} emoji={KIND_META[k]?.emoji} />
        ))}
      </div>

      {err && <div style={{ fontSize: 13, color: RED, background: 'rgba(218,27,51,0.08)', border: '1px solid rgba(218,27,51,0.3)', borderRadius: 8, padding: '10px 12px' }}>{err}</div>}
      {loading && !rows.length && <div style={{ fontSize: 13, color: 'var(--cream-dim)' }}>Loading bookings…</div>}
      {!loading && !rows.length && !err && (
        <div style={{ fontSize: 14, color: 'var(--cream-dim)', background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          No bookings for {range === 'today' ? 'today' : 'the next 7 days'} yet.<br />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6, display: 'inline-block' }}>They'll appear here within 15 seconds of someone paying on nodice.bar.</span>
        </div>
      )}

      {/* Per-day sections */}
      {Object.keys(byDate).sort().map(date => (
        <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {range === 'week' && (
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.14em', paddingTop: 4, borderTop: `1px solid ${LINE}` }}>
              {fmtDay(date)}
              <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 500, color: 'var(--cream-dim)', textTransform: 'none', letterSpacing: 0 }}>
                {byDate[date].length} booking{byDate[date].length === 1 ? '' : 's'} · {byDate[date].reduce((s, r) => s + r.party, 0)} covers
              </span>
            </div>
          )}
          {byDate[date].map(r => <ReservationRow key={r.kind + ':' + r.id} r={r} className="rs-row" />)}
        </div>
      ))}
    </div>
  )
}

// ── Row ────────────────────────────────────────────────────────────────────
function ReservationRow({ r, className }) {
  const meta = KIND_META[r.kind] || { emoji: '·', label: r.kind, color: 'rgba(255,255,255,0.5)' }
  const big = r.party >= BIG_PARTY_THRESHOLD
  return (
    <div className={className} style={{
      display: 'grid', gridTemplateColumns: 'auto 60px minmax(140px, 1fr) auto',
      gap: 12, alignItems: 'center', padding: '10px 14px',
      background: CARD, border: `1px solid ${LINE}`, borderLeft: `4px solid ${meta.color}`, borderRadius: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 18 }}>{meta.emoji}</span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{meta.label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', fontVariantNumeric: 'tabular-nums' }}>{fmtTime(r.time)}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{r.name}</span>
          {big && <span style={{ fontSize: 10, fontWeight: 800, color: AMBER, background: 'rgba(245,158,11,0.12)', border: `1px solid ${AMBER}55`, borderRadius: 999, padding: '2px 8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Big · {r.party}</span>}
          {r.extra && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{r.extra}</span>}
        </div>
        {r.notes && <div style={{ fontSize: 11.5, color: AMBER, marginTop: 3, lineHeight: 1.4 }}>📝 {r.notes}</div>}
        {(r.phone || r.email) && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {r.phone && <span>📞 {r.phone}</span>}
            {r.email && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>✉ {r.email}</span>}
          </div>
        )}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: big ? AMBER : 'var(--cream)', minWidth: 32, textAlign: 'right' }}>{r.party || '—'}</div>
    </div>
  )
}

// ── Summary pill ────────────────────────────────────────────────────────────
function SummaryPill({ label, value, color, emoji }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 6, padding: '6px 12px', borderRadius: 999,
      background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}55`, whiteSpace: 'nowrap',
    }}>
      {emoji && <span style={{ fontSize: 12 }}>{emoji}</span>}
      <span style={{ fontSize: 16, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
  )
}

const rangeBtn = (active) => ({
  padding: '8px 14px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
  background: active ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
  border: `1.5px solid ${active ? 'var(--gold)' : 'rgba(255,255,255,0.15)'}`,
  color: active ? 'var(--gold)' : 'var(--cream)', fontWeight: active ? 700 : 500,
  whiteSpace: 'nowrap',
})
