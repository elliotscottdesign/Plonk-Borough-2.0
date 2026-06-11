import React, { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, CATEGORY_LABEL, PRIORITY, dayLabel, shiftLabel, SKILL_LABEL, DIFFICULTY, canDo } from '../../help/data.js'
import { helpAdmin, helpRelease, helpAssign, helpConfirm, helpSetCap, helpApprove, helpReopen, helpTaskMeta, helperLink, helpLink } from '../../help/api.js'
import HelpCalendar from './HelpCalendar.jsx'

// ─── /operations → Help Out ────────────────────────────────────────────────
// Verify + delegate portal for the public /helpout sign-ups. Calendar of shifts,
// people (allocate jobs to each shift from a skill-filtered dropdown, sign off
// helper-completed jobs), and the jobs board (set difficulty / recurring).

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
const DiffBadge = ({ d }) => { const x = DIFFICULTY[d] || DIFFICULTY.intermediate; return <span title={x.label} style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, background: `${x.tone}22`, border: `1px solid ${x.tone}66`, color: x.tone, fontWeight: 700 }}>{x.short}</span> }

export default function HelpOut() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState({})
  const [busy, setBusy] = useState('')
  const [view, setView] = useState('people')   // calendar | people | jobs

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
    finally { setBusy('') }
  }

  const tasks = data?.tasks || []
  const helpers = data?.helpers || []
  const stats = data?.stats || {}
  const usedCats = CATEGORIES.filter(c => tasks.some(t => t.cat === c.key))
  const allOpen = usedCats.length && usedCats.every(c => open[c.key])
  const toggleAll = () => setOpen(allOpen ? {} : Object.fromEntries(usedCats.map(c => [c.key, true])))
  const VIEWS = [['calendar', '📅 Calendar'], ['people', '🙋 People'], ['jobs', '🧰 Jobs board']]

  // One allocated-job row in a helper's card (with state + sign-off + remove).
  const jobRow = (h, t) => {
    const st = t.state || 'todo'
    return (
      <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12.5, color: 'var(--cream)', textDecoration: st === 'completed' ? 'line-through' : 'none', opacity: st === 'completed' ? 0.65 : 1 }}>
          {st === 'done' && <span style={{ color: '#FCD34D' }}>● </span>}
          {st === 'completed' && <span style={{ color: '#34D399' }}>✓ </span>}
          {t.title} <DiffBadge d={t.difficulty} />{t.recurring && <span title="recurring" style={{ marginLeft: 4, color: 'var(--cream-dim)' }}>♻</span>}
          <span style={{ color: 'var(--cream-dim)' }}> · {t.area}</span>
        </span>
        <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {st === 'done' && <button onClick={() => act(`ap-${t.id}-${h.id}`, () => helpApprove(h.id, t.id))} disabled={busy === `ap-${t.id}-${h.id}`} style={btn({ padding: '2px 9px', fontSize: 11, color: '#34D399', borderColor: 'rgba(52,211,153,0.4)', fontWeight: 700 })}>{busy === `ap-${t.id}-${h.id}` ? '…' : 'Sign off ✓'}</button>}
          {st === 'completed'
            ? <button onClick={() => act(`ro-${t.id}-${h.id}`, () => helpReopen(h.id, t.id))} disabled={busy === `ro-${t.id}-${h.id}`} style={btn({ padding: '2px 8px', fontSize: 11 })}>{busy === `ro-${t.id}-${h.id}` ? '…' : 'reopen'}</button>
            : <button onClick={() => act(`rel-${t.id}-${h.id}`, () => helpRelease(t.id, h.id))} disabled={busy === `rel-${t.id}-${h.id}`} style={btn({ padding: '2px 8px', fontSize: 11, color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' })}>{busy === `rel-${t.id}-${h.id}` ? '…' : 'remove'}</button>}
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--cream)' }}>Help Out</div>
          <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)', background: '#34D399', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>Delegate &amp; verify</span>
          <button onClick={load} style={{ marginLeft: 'auto', ...btn() }}>↻ Refresh</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginTop: 6, maxWidth: 800, lineHeight: 1.6 }}>
          Allocate jobs to each person’s shift from the skill-filtered dropdown, then <strong style={{ color: 'var(--cream)' }}>Confirm</strong> to email them. Set each job’s difficulty &amp; whether it’s recurring on the Jobs board.
          <button onClick={() => navigator.clipboard?.writeText(helpLink())} style={{ marginLeft: 8, ...btn({ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', color: GOLD }) }}>Copy sign-up link</button>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12 }}>
            <Tile label="Sign-ups" value={stats.helpers ?? helpers.length} sub={`${stats.confirmed ?? 0} confirmed`} accent="var(--cream)" />
            <Tile label="Jobs allocated" value={`${stats.assigned ?? 0} / ${stats.tasks ?? tasks.length}`} sub={`${(stats.tasks ?? tasks.length) - (stats.assigned ?? 0)} on the board`} accent={GOLD} />
            <Tile label="To sign off" value={stats.awaiting ?? 0} sub="helpers marked done" accent={(stats.awaiting ?? 0) > 0 ? '#FCD34D' : 'var(--cream-dim)'} />
            <Tile label="Completed" value={stats.completed ?? 0} sub="signed off" accent="#34D399" />
            <Tile label="Awaiting confirm" value={(stats.helpers ?? helpers.length) - (stats.confirmed ?? 0)} sub="to review & email" accent="#FCD34D" />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {VIEWS.map(([k, l]) => (
              <button key={k} onClick={() => setView(k)} style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', background: view === k ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${view === k ? GOLD : 'rgba(255,255,255,0.12)'}`, color: view === k ? GOLD : 'var(--cream)', fontWeight: view === k ? 700 : 400 }}>{l}</button>
            ))}
          </div>

          {/* CALENDAR */}
          {view === 'calendar' && <HelpCalendar helpers={helpers} settings={data.settings} onSetCap={async (date, cap) => { try { await helpSetCap(date, cap); await load() } catch (e) { setErr(e.message) } }} />}

          {/* PEOPLE — delegate jobs per shift */}
          {view === 'people' && (
            <div>
              <div className="serif" style={{ fontSize: 18, color: GOLD, marginBottom: 10 }}>Who’s signed up ({helpers.length})</div>
              {helpers.length === 0 && <div style={{ ...card, padding: 18, fontSize: 13, color: 'var(--cream-dim)' }}>No sign-ups yet. Share the link to get friends on board.</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {helpers.map(h => {
                  const confirmed = h.status === 'confirmed'
                  const jobs = h.assignedTasks || []
                  const byShift = {}
                  for (const t of jobs) (byShift[t.shift || '_none'] ||= []).push(t)
                  const mine = new Set(jobs.map(t => t.id))
                  const eligible = tasks.filter(t => (h.categories || []).includes(t.cat) && canDo(h.skill, t.difficulty) && !mine.has(t.id) && (t.recurring || !t.assignedTo))
                  const allocSelect = (shiftDate, key) => (
                    <select key={key} defaultValue="" onChange={e => e.target.value && act(`al-${h.id}-${shiftDate}`, () => helpAssign(h.id, e.target.value, shiftDate === '_none' ? null : shiftDate))}
                      style={{ marginTop: 6, width: '100%', background: '#111', color: 'var(--cream)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 9px', fontSize: 12.5 }}>
                      <option value="" disabled>+ Allocate a job for this shift…</option>
                      {usedCats.map(c => {
                        const opts = eligible.filter(t => t.cat === c.key)
                        if (!opts.length) return null
                        return <optgroup key={c.key} label={c.label}>{opts.map(t => <option key={t.id} value={t.id}>{(DIFFICULTY[t.difficulty] || {}).short} · {t.title}{t.recurring ? ' ♻' : ''}</option>)}</optgroup>
                      })}
                    </select>
                  )
                  return (
                    <div key={h.id} style={{ ...card, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div className="serif" style={{ fontSize: 18, color: 'var(--cream)' }}>{h.name}</div>
                          <span style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, padding: '2px 8px', borderRadius: 999, color: 'var(--ink)', background: confirmed ? '#34D399' : '#FCD34D' }}>{confirmed ? 'Confirmed' : 'Pending'}</span>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, border: `1px solid ${(DIFFICULTY[h.skill] || {}).tone || GOLD}`, color: (DIFFICULTY[h.skill] || {}).tone || GOLD }}>{SKILL_LABEL[h.skill] || h.skill}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--cream-dim)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {h.phone && <a href={`tel:${h.phone}`} style={{ color: GOLD, textDecoration: 'none' }}>{h.phone}</a>}
                          {h.phone && h.email && <span>·</span>}
                          {h.email && <a href={`mailto:${h.email}`} style={{ color: GOLD, textDecoration: 'none' }}>{h.email}</a>}
                          {h.token && <button onClick={() => navigator.clipboard?.writeText(helperLink(h.token))} title="Copy this helper's private job-list link" style={btn({ padding: '2px 8px', fontSize: 10.5 })}>copy job link</button>}
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--cream-dim)', marginTop: 8, lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--cream)' }}>Up for:</strong> {(h.categories || []).map(c => CATEGORY_LABEL[c] || c).join(', ') || '—'}
                        {h.note ? <><br /><strong style={{ color: 'var(--cream)' }}>Note:</strong> {h.note}</> : null}
                      </div>

                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        {(h.shifts || []).map((s, si) => (
                          <div key={si} style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 11.5, color: GOLD, fontWeight: 700, marginBottom: 6 }}>{dayLabel(s.date)} · {shiftLabel(s)}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {(byShift[s.date] || []).map(t => jobRow(h, t))}
                              {!(byShift[s.date] || []).length && <div style={{ fontSize: 12, color: 'var(--cream-dim)' }}>No jobs allocated yet.</div>}
                            </div>
                            {eligible.length > 0 ? allocSelect(s.date, si) : <div style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 6 }}>No jobs left that match their skills.</div>}
                          </div>
                        ))}
                        {(byShift['_none'] || []).length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11.5, color: 'var(--cream-dim)', fontWeight: 700, marginBottom: 6 }}>Other jobs (no shift)</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{(byShift['_none'] || []).map(t => jobRow(h, t))}</div>
                          </div>
                        )}
                        <button onClick={() => act(`conf-${h.id}`, () => helpConfirm(h.id))} disabled={busy === `conf-${h.id}`} style={btn({ marginTop: 4, background: confirmed ? 'rgba(52,211,153,0.12)' : 'rgba(52,211,153,0.18)', border: '1px solid #34D399', color: '#34D399', fontWeight: 700 })}>
                          {busy === `conf-${h.id}` ? 'Sending…' : (confirmed ? '✓ Confirmed — resend email' : (h.email ? 'Confirm & email jobs' : 'Confirm (no email on file)'))}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* JOBS BOARD — set difficulty & recurring; see who's on what */}
          {view === 'jobs' && (
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
              <div style={{ fontSize: 11.5, color: 'var(--cream-dim)', marginBottom: 10 }}>Set each job’s level (<DiffBadge d="novice" /> <DiffBadge d="intermediate" /> <DiffBadge d="experienced" />) and tap ♻ to make it recurring (can be allocated again after it’s done).</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {usedCats.map(c => {
                  const cItems = tasks.filter(t => t.cat === c.key)
                  const done = cItems.filter(t => t.assignedTo && !t.recurring).length
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
                        <span style={{ fontSize: 12, color: 'var(--cream-dim)', fontVariantNumeric: 'tabular-nums' }}>{done}/{cItems.length} allocated</span>
                      </button>
                      {isOpen && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '6px 0' }}>
                          {cItems.map(t => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px' }}>
                              <span style={{ marginTop: 5 }}><Dot tone={PRIORITY[t.priority]?.tone || '#888'} /></span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13.5, color: 'var(--cream)', fontWeight: 500, lineHeight: 1.35 }}>{t.title}</div>
                                {t.detail && <div style={{ fontSize: 11.5, color: 'var(--cream-dim)', lineHeight: 1.5, marginTop: 2 }}>{t.detail}</div>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 10, color: 'var(--gold-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.area}</span>
                                  {/* difficulty setter */}
                                  <span style={{ display: 'inline-flex', gap: 3 }}>
                                    {['novice', 'intermediate', 'experienced'].map(d => {
                                      const on = t.difficulty === d, x = DIFFICULTY[d]
                                      return <button key={d} onClick={() => act(`d-${t.id}-${d}`, () => helpTaskMeta(t.id, { difficulty: d }))} disabled={busy === `d-${t.id}-${d}`} title={x.label} style={{ fontSize: 10, width: 20, height: 18, borderRadius: 4, cursor: 'pointer', padding: 0, fontWeight: 700, background: on ? `${x.tone}22` : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? x.tone : 'rgba(255,255,255,0.14)'}`, color: on ? x.tone : 'var(--cream-dim)' }}>{x.short}</button>
                                    })}
                                  </span>
                                  {/* recurring toggle */}
                                  <button onClick={() => act(`r-${t.id}`, () => helpTaskMeta(t.id, { recurring: !t.recurring }))} disabled={busy === `r-${t.id}`} title="Recurring — can be allocated again after it's done" style={btn({ padding: '2px 8px', fontSize: 10.5, background: t.recurring ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${t.recurring ? GOLD : 'rgba(255,255,255,0.14)'}`, color: t.recurring ? GOLD : 'var(--cream-dim)' })}>♻ {t.recurring ? 'recurring' : 'one-off'}</button>
                                </div>
                              </div>
                              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                {t.assignedTo ? (
                                  <>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: t.assignedTo.state === 'completed' ? '#34D399' : t.assignedTo.state === 'done' ? '#FCD34D' : 'var(--cream)' }}>
                                      {t.assignedTo.state === 'completed' ? '✓ ' : t.assignedTo.state === 'done' ? '● ' : ''}{t.assignedTo.name}
                                    </div>
                                    {!t.recurring && <button onClick={() => act(`rel-${t.id}`, () => helpRelease(t.id))} disabled={busy === `rel-${t.id}`} style={{ fontSize: 10, color: 'var(--cream-dim)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginTop: 2 }}>{busy === `rel-${t.id}` ? '…' : 'release'}</button>}
                                  </>
                                ) : (
                                  <div style={{ fontSize: 11.5, color: 'var(--cream-dim)' }}>on the board</div>
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
          )}
        </>
      )}
    </div>
  )
}
