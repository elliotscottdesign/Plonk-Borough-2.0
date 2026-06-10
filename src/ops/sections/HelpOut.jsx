import React, { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, CATEGORY_LABEL, PRIORITY, dayLabel, shiftLabel } from '../../help/data.js'
import { helpAdmin, helpRelease, helpAssign, helpConfirm, helpLink } from '../../help/api.js'

// ─── /operations → Help Out ────────────────────────────────────────────────
// Verify portal for the public /helpout sign-ups. See every helper, their
// shifts and proposed jobs; add/remove jobs; then Confirm to email them their
// final list. Plus the master jobs board (collapsible by section). Reads the
// help-out edge function (gated by SEND_SECRET, like the rest of /operations).

const GOLD = 'var(--gold)'
const card = { background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10 }

function Tile({ label, value, sub, accent }) {
  return (
    <div style={{ ...card, padding: '16px 18px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)' }}>{label}</div>
      <div className="serif" style={{ fontSize: 27, color: accent || GOLD, lineHeight: 1.15, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
const Dot = ({ tone }) => <span style={{ width: 9, height: 9, borderRadius: '50%', background: tone, flexShrink: 0, display: 'inline-block' }} />
const btn = (extra = {}) => ({ fontSize: 11, padding: '6px 12px', borderRadius: 7, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--cream)', ...extra })

export default function HelpOut() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState({})
  const [busy, setBusy] = useState('')
  const [addingFor, setAddingFor] = useState('')

  async function load() {
    setLoading(true); setErr('')
    try { setData(await helpAdmin()) }
    catch (e) { setErr(e.message || 'Could not load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function act(key, fn) {
    setBusy(key)
    try { await fn(); await load() }
    catch (e) { setErr(e.message) }
    finally { setBusy(''); setAddingFor('') }
  }

  const tasks = data?.tasks || []
  const helpers = data?.helpers || []
  const stats = data?.stats || {}
  const usedCats = CATEGORIES.filter(c => tasks.some(t => t.cat === c.key))
  const unassigned = useMemo(() => tasks.filter(t => !t.assignedTo), [tasks])
  const allOpen = usedCats.length && usedCats.every(c => open[c.key])
  const toggleAll = () => setOpen(allOpen ? {} : Object.fromEntries(usedCats.map(c => [c.key, true])))

  // Unassigned tasks for the per-helper picker, that person's categories first.
  const pickerOptions = (h) => {
    const inCats = unassigned.filter(t => (h.categories || []).includes(t.cat))
    const rest = unassigned.filter(t => !(h.categories || []).includes(t.cat))
    return [...inCats, ...rest]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--cream)' }}>Help Out</div>
          <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)', background: '#34D399', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>Verify portal</span>
          <button onClick={load} style={{ marginLeft: 'auto', ...btn() }}>↻ Refresh</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginTop: 6, maxWidth: 760, lineHeight: 1.6 }}>
          Sign-ups from <a href="/helpout" style={{ color: GOLD }}>team.nodice.bar/helpout</a> propose jobs to fill each person’s shift. Review, tweak the jobs, then <strong style={{ color: 'var(--cream)' }}>Confirm</strong> to email them their final list.
          <button onClick={() => navigator.clipboard?.writeText(helpLink())} style={{ marginLeft: 8, ...btn({ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', color: GOLD }) }}>Copy link</button>
        </div>
      </div>

      {loading && <div style={{ ...card, padding: 22, color: 'var(--cream-dim)', fontSize: 13 }}>Loading…</div>}
      {err && !loading && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 10, padding: 18, fontSize: 13, color: 'var(--cream)', lineHeight: 1.6 }}>
          <strong style={{ color: '#F87171' }}>Couldn’t load.</strong> {err}
        </div>
      )}

      {data && !loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
            <Tile label="Sign-ups" value={stats.helpers ?? helpers.length} sub={`${stats.confirmed ?? 0} confirmed`} accent="var(--cream)" />
            <Tile label="Jobs assigned" value={`${stats.assigned ?? 0} / ${stats.tasks ?? tasks.length}`} sub={`${(stats.tasks ?? tasks.length) - (stats.assigned ?? 0)} still open`} accent={GOLD} />
            <Tile label="Before-open jobs" value={`${stats.p1Assigned ?? 0} / ${stats.p1 ?? 0}`} sub="covered so far" accent={(stats.p1Assigned ?? 0) >= (stats.p1 ?? 0) ? '#34D399' : '#F87171'} />
            <Tile label="Awaiting confirm" value={(stats.helpers ?? helpers.length) - (stats.confirmed ?? 0)} sub="to review & email" accent="#FCD34D" />
          </div>

          {/* Helpers */}
          <div>
            <div className="serif" style={{ fontSize: 18, color: GOLD, marginBottom: 10 }}>Who’s signed up ({helpers.length})</div>
            {helpers.length === 0 && <div style={{ ...card, padding: 18, fontSize: 13, color: 'var(--cream-dim)' }}>No sign-ups yet. Share the link to get friends on board.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {helpers.map(h => {
                const confirmed = h.status === 'confirmed'
                return (
                  <div key={h.id} style={{ ...card, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="serif" style={{ fontSize: 18, color: 'var(--cream)' }}>{h.name}</div>
                        <span style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, padding: '2px 8px', borderRadius: 999, color: 'var(--ink)', background: confirmed ? '#34D399' : '#FCD34D' }}>{confirmed ? 'Confirmed' : 'Pending'}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--cream-dim)' }}>
                        {h.phone && <a href={`tel:${h.phone}`} style={{ color: GOLD, textDecoration: 'none' }}>{h.phone}</a>}
                        {h.phone && h.email && ' · '}
                        {h.email && <a href={`mailto:${h.email}`} style={{ color: GOLD, textDecoration: 'none' }}>{h.email}</a>}
                      </div>
                    </div>

                    {/* Shifts */}
                    {(h.shifts || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {h.shifts.map((s, i) => (
                          <span key={i} style={{ fontSize: 12, padding: '3px 9px', borderRadius: 7, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--cream)' }}>
                            {dayLabel(s.date)} · {shiftLabel(s)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: 12, color: 'var(--cream-dim)', marginTop: 8, lineHeight: 1.6 }}>
                      <strong style={{ color: 'var(--cream)' }}>Up for:</strong> {(h.categories || []).map(c => CATEGORY_LABEL[c] || c).join(', ') || '—'}
                      {h.note ? <><br /><strong style={{ color: 'var(--cream)' }}>Note:</strong> {h.note}</> : null}
                    </div>

                    {/* Assigned jobs with remove */}
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)', marginBottom: 6 }}>
                        Jobs ({(h.assignedTasks || []).length}{(h.assignedTasks || []).length ? ` · ~${(h.assignedTasks.length * 0.5).toFixed(1)}h` : ''})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {(h.assignedTasks || []).map(t => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: 12.5, color: 'var(--cream)' }}>{t.title} <span style={{ color: 'var(--cream-dim)' }}>· {t.area}</span></span>
                            <button onClick={() => act(`rel-${t.id}`, () => helpRelease(t.id))} disabled={busy === `rel-${t.id}`} style={{ ...btn({ padding: '2px 8px', fontSize: 11, color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }) }}>{busy === `rel-${t.id}` ? '…' : 'remove'}</button>
                          </div>
                        ))}
                        {!(h.assignedTasks || []).length && <div style={{ fontSize: 12, color: 'var(--cream-dim)' }}>No jobs yet — add some below.</div>}
                      </div>

                      {/* Add a job */}
                      {addingFor === h.id ? (
                        <select autoFocus defaultValue="" onChange={e => e.target.value && act(`add-${h.id}`, () => helpAssign(h.id, e.target.value))}
                          style={{ marginTop: 8, width: '100%', background: '#111', color: 'var(--cream)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
                          <option value="" disabled>Pick a job to add…</option>
                          {usedCats.map(c => {
                            const opts = pickerOptions(h).filter(t => t.cat === c.key)
                            if (!opts.length) return null
                            return <optgroup key={c.key} label={c.label}>{opts.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</optgroup>
                          })}
                        </select>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                          <button onClick={() => setAddingFor(h.id)} disabled={!unassigned.length} style={btn({ opacity: unassigned.length ? 1 : 0.5 })}>+ Add a job</button>
                          <button onClick={() => act(`conf-${h.id}`, () => helpConfirm(h.id))} disabled={busy === `conf-${h.id}`}
                            style={btn({ background: confirmed ? 'rgba(52,211,153,0.12)' : 'rgba(52,211,153,0.18)', border: '1px solid #34D399', color: '#34D399', fontWeight: 700 })}>
                            {busy === `conf-${h.id}` ? 'Sending…' : (confirmed ? '✓ Confirmed — resend email' : (h.email ? 'Confirm & email jobs' : 'Confirm (no email on file)'))}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Master jobs board — collapsible by section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div className="serif" style={{ fontSize: 18, color: GOLD }}>Jobs board ({tasks.length})</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--cream-dim)' }}>
                  {Object.entries(PRIORITY).map(([k, p]) => (
                    <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Dot tone={p.tone} /> {p.label}</span>
                  ))}
                </div>
                <button onClick={toggleAll} style={btn()}>{allOpen ? 'Collapse all' : 'Expand all'}</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {usedCats.map(c => {
                const items = tasks.filter(t => t.cat === c.key)
                const done = items.filter(t => t.assignedTo).length
                const isOpen = !!open[c.key]
                return (
                  <div key={c.key} style={{ ...card, overflow: 'hidden' }}>
                    <button onClick={() => setOpen(o => ({ ...o, [c.key]: !o[c.key] }))} style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      padding: '13px 16px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--cream)', textAlign: 'left',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16, color: 'var(--cream-dim)', width: 14 }}>{isOpen ? '▾' : '▸'}</span>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{c.icon} {c.label}</span>
                      </span>
                      <span style={{ fontSize: 12, color: done === items.length ? '#34D399' : 'var(--cream-dim)', fontVariantNumeric: 'tabular-nums' }}>{done}/{items.length} assigned</span>
                    </button>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '6px 0' }}>
                        {items.map(t => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 16px' }}>
                            <span style={{ marginTop: 5 }}><Dot tone={PRIORITY[t.priority]?.tone || '#888'} /></span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13.5, color: 'var(--cream)', fontWeight: 500, lineHeight: 1.35 }}>{t.title}</div>
                              {t.detail && <div style={{ fontSize: 11.5, color: 'var(--cream-dim)', lineHeight: 1.5, marginTop: 2 }}>{t.detail}</div>}
                              <div style={{ fontSize: 10, color: 'var(--gold-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>{t.area}</div>
                            </div>
                            <div style={{ flexShrink: 0, textAlign: 'right' }}>
                              {t.assignedTo ? (
                                <>
                                  <div style={{ fontSize: 12, color: t.assignedTo.status === 'confirmed' ? '#34D399' : '#FCD34D', fontWeight: 600 }}>{t.assignedTo.name}</div>
                                  <button onClick={() => act(`rel-${t.id}`, () => helpRelease(t.id))} disabled={busy === `rel-${t.id}`} style={{ fontSize: 10, color: 'var(--cream-dim)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginTop: 2 }}>{busy === `rel-${t.id}` ? '…' : 'release'}</button>
                                </>
                              ) : (
                                <div style={{ fontSize: 11.5, color: 'var(--cream-dim)' }}>unassigned</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
