import React, { useEffect, useState } from 'react'
import { CATEGORIES, CATEGORY_LABEL, PRIORITY, TIME_BLOCK_LABEL, dayLabel } from '../../help/data.js'
import { helpAdmin, helpRelease, helpLink } from '../../help/api.js'

// ─── /ops → Help Out ──────────────────────────────────────────────────────
// Admin-only view of the public /help-out volunteer portal: who's signed up,
// what they've been auto-assigned, and the master jobs board (collapsible by
// section) with assignment status. Reads the help-out edge function (gated by
// SEND_SECRET, same as the rest of /ops).

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

export default function HelpOut() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState({})       // category key → expanded
  const [busy, setBusy] = useState('')

  async function load() {
    setLoading(true); setErr('')
    try { setData(await helpAdmin()) }
    catch (e) { setErr(e.message || 'Could not load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function release(taskId) {
    setBusy(taskId)
    try { await helpRelease(taskId); await load() }
    catch (e) { setErr(e.message) }
    finally { setBusy('') }
  }

  const tasks = data?.tasks || []
  const helpers = data?.helpers || []
  const stats = data?.stats || {}
  const usedCats = CATEGORIES.filter(c => tasks.some(t => t.cat === c.key))
  const allOpen = usedCats.length && usedCats.every(c => open[c.key])
  const toggleAll = () => setOpen(allOpen ? {} : Object.fromEntries(usedCats.map(c => [c.key, true])))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="serif" style={{ fontSize: 26, color: 'var(--cream)' }}>Help Out</div>
          <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)', background: '#34D399', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>Volunteer portal</span>
          <button onClick={load} style={{ marginLeft: 'auto', fontSize: 11, padding: '6px 12px', borderRadius: 7, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--cream)' }}>↻ Refresh</button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginTop: 6, maxWidth: 760, lineHeight: 1.6 }}>
          Sign-ups from <a href="/help-out" style={{ color: GOLD }}>team.nodice.bar/help-out</a> auto-assign jobs (≈30 min each, sized to when each person is free) and email them the list. Share that link with friends; manage who's got what here.
          <button onClick={() => navigator.clipboard?.writeText(helpLink())} style={{ marginLeft: 8, fontSize: 11, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', color: GOLD }}>Copy link</button>
        </div>
      </div>

      {loading && <div style={{ ...card, padding: 22, color: 'var(--cream-dim)', fontSize: 13 }}>Loading…</div>}

      {err && !loading && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 10, padding: 18, fontSize: 13, color: 'var(--cream)', lineHeight: 1.6 }}>
          <strong style={{ color: '#F87171' }}>Couldn’t load sign-ups.</strong> {err}
          <div style={{ fontSize: 12, color: 'var(--cream-dim)', marginTop: 8 }}>If this is the first run, make sure the <code>help-out</code> function is deployed and the <code>bar_helpers</code> table SQL has been run.</div>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
            <Tile label="Sign-ups" value={stats.helpers ?? helpers.length} sub="friends on board" accent="var(--cream)" />
            <Tile label="Jobs assigned" value={`${stats.assigned ?? 0} / ${stats.tasks ?? tasks.length}`} sub={`${(stats.tasks ?? tasks.length) - (stats.assigned ?? 0)} still open`} accent={GOLD} />
            <Tile label="Before-open jobs" value={`${stats.p1Assigned ?? 0} / ${stats.p1 ?? 0}`} sub="covered so far" accent={(stats.p1Assigned ?? 0) >= (stats.p1 ?? 0) ? '#34D399' : '#F87171'} />
            <Tile label="Still unassigned" value={(stats.tasks ?? tasks.length) - (stats.assigned ?? 0)} sub="up for grabs" accent="#FCD34D" />
          </div>

          {/* Sign-ups */}
          <div>
            <div className="serif" style={{ fontSize: 18, color: GOLD, marginBottom: 10 }}>Who’s signed up ({helpers.length})</div>
            {helpers.length === 0 && <div style={{ ...card, padding: 18, fontSize: 13, color: 'var(--cream-dim)' }}>No sign-ups yet. Share the link to get friends on board.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {helpers.map(h => (
                <div key={h.id} style={{ ...card, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div className="serif" style={{ fontSize: 18, color: 'var(--cream)' }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--cream-dim)' }}>
                      {h.phone && <a href={`tel:${h.phone}`} style={{ color: GOLD, textDecoration: 'none' }}>{h.phone}</a>}
                      {h.phone && h.email && ' · '}
                      {h.email && <a href={`mailto:${h.email}`} style={{ color: GOLD, textDecoration: 'none' }}>{h.email}</a>}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--cream-dim)', marginTop: 6, lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--cream)' }}>Up for:</strong> {(h.categories || []).map(c => CATEGORY_LABEL[c] || c).join(', ') || '—'}<br />
                    <strong style={{ color: 'var(--cream)' }}>Free:</strong> {(h.days || []).map(dayLabel).join(' · ') || '—'}
                    {(h.time_blocks || []).length ? ` — ${h.time_blocks.map(b => TIME_BLOCK_LABEL[b] || b).join(', ')}` : ''}
                    {h.note ? <><br /><strong style={{ color: 'var(--cream)' }}>Note:</strong> {h.note}</> : null}
                  </div>
                  {(h.assignedTasks || []).length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-dim)', marginBottom: 6 }}>Assigned {h.assignedTasks.length} job{h.assignedTasks.length > 1 ? 's' : ''} (~{h.assignedTasks.length * 30} min)</div>
                      <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {h.assignedTasks.map(t => (
                          <li key={t.id} style={{ fontSize: 12.5, color: 'var(--cream)' }}>{t.title} <span style={{ color: 'var(--cream-dim)' }}>· {t.area}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
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
                <button onClick={toggleAll} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 7, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--cream)' }}>{allOpen ? 'Collapse all' : 'Expand all'}</button>
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
                                  <div style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>{t.assignedTo.name}</div>
                                  <button onClick={() => release(t.id)} disabled={busy === t.id} style={{ fontSize: 10, color: 'var(--cream-dim)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginTop: 2 }}>{busy === t.id ? '…' : 'release'}</button>
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
