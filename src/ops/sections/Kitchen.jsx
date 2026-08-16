import React, { useEffect, useState } from 'react'
import { KITCHEN_TEMPLATES, templateItems, targetLabel } from '../../kitchen/templates.js'
import { ALLERGENS, allergenLabel, STATUS_META, STATUS_ORDER, statusOf, DEFAULT_MATRIX, MATRIX_DRIVERS, PENDING } from '../../kitchen/allergens.js'
import { kitchenRuns, kitchenReview, kitchenGetMatrix, kitchenSaveMatrix, kitchenCheckMissed, kitchenWasteLog } from '../../kitchen/api.js'
import useIsMobile from '../../lib/useIsMobile.js'
import KitchenStock from '../../kitchen/KitchenStock.jsx'
import KitchenTickets from '../../kitchen/KitchenTickets.jsx'
import MenuManager from '../../kitchen/MenuManager.jsx'

const GOLD = '#C9A84C', GREEN = '#34D399', AMBER = '#F59E0B', RED = '#DA1B33', BLUE = '#60A5FA'
const CARD = 'rgba(255,255,255,0.03)', LINE = 'rgba(201,168,76,0.22)'
const CADENCE_TITLE = { opening: 'Opening', service: 'During service', closing: 'Closing', weekly: 'Weekly deep clean', prep: 'Batch prep' }
const labelOf = (key) => { for (const c of Object.keys(KITCHEN_TEMPLATES)) { const it = templateItems(c).find(i => i.key === key); if (it) return it.label } return key }

function mergeMatrix(saved) {
  const byDish = {}
  for (const r of DEFAULT_MATRIX) byDish[r.dish] = { dish: r.dish, allergens: { ...r.allergens }, notes: r.notes || '' }
  for (const r of saved || []) byDish[r.dish] = { dish: r.dish, allergens: r.allergens || {}, notes: r.notes || '' }
  return Object.values(byDish)
}

// ─── /ops Kitchen — manager review of the food-safety hub ─────────────────────
export default function Kitchen() {
  const [sub, setSub] = useState('runs')   // 'runs' | 'matrix'
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="serif" style={{ fontSize: 24, color: '#fff' }}>🌭 Kitchen — food safety</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '4px 0 16px', lineHeight: 1.5 }}>
        Review the crew's daily & weekly SFBB checklists, countersign them, and keep the allergen matrix current. Failed or missed checks email you automatically.
      </div>
      {/* Sticky — the stock + allergen sheets are long; the way back must stay put. */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 20, background: 'var(--ink)', paddingTop: 6, paddingBottom: 6 }}>
        {[['orders', '🎫 Orders'], ['menu', '🍔 Menu'], ['runs', '✅ Submitted'], ['templates', '📋 The checklists'], ['waste', '🗑️ Wastage'], ['stock', '🥕 Stock'], ['matrix', '🥜 Allergen matrix']].map(([k, l]) => (
          <button key={k} onClick={() => setSub(k)} style={tab(sub === k)}>{l}</button>
        ))}
      </div>
      {sub === 'orders' ? <KitchenTickets /> : sub === 'menu' ? <MenuManager /> : sub === 'runs' ? <Runs /> : sub === 'templates' ? <Templates /> : sub === 'waste' ? <WasteLog /> : sub === 'stock' ? <KitchenStock /> : <Matrix />}
    </div>
  )
}

function Runs() {
  const [runs, setRuns] = useState(null)
  const [open, setOpen] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [sweep, setSweep] = useState('')
  const load = async () => { try { const r = await kitchenRuns(30); setRuns(r.runs || []) } catch (e) { alert(e.message) } }
  useEffect(() => { load() }, [])

  const doReview = async (run) => { setBusy(true); try { await kitchenReview(run.id, note); setOpen(null); setNote(''); await load() } catch (e) { alert(e.message) } finally { setBusy(false) } }
  const runSweep = async () => { setBusy(true); try { const r = await kitchenCheckMissed(); setSweep(!r.trading ? 'No kitchen shift today — nothing to check.' : r.missing?.length ? `Not yet done today: ${r.missing.join(', ')}. (Just a status peek — the automatic email alert only fires after close.)` : 'All of today’s required checks are in. ✓') } catch (e) { alert(e.message) } finally { setBusy(false) } }

  if (!runs) return <Muted>Loading…</Muted>
  const failures = runs.filter(r => r.has_failure)
  const unreviewed = runs.filter(r => r.status === 'completed' && !r.reviewed_at)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Stat n={failures.length} label="with a failure" color={failures.length ? RED : 'rgba(255,255,255,0.5)'} />
        <Stat n={unreviewed.length} label="to countersign" color={unreviewed.length ? AMBER : 'rgba(255,255,255,0.5)'} />
        <Stat n={runs.length} label="runs (30 days)" color={BLUE} />
        <button onClick={runSweep} disabled={busy} style={{ ...tab(false), alignSelf: 'center' }}>↻ Check today for missed checks</button>
      </div>
      {sweep && <div style={{ fontSize: 12.5, color: BLUE }}>{sweep}</div>}

      {runs.length === 0 && <Muted>No checklists submitted yet. They appear here as the kitchen crew complete them on shift.</Muted>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {runs.map(run => {
          const isOpen = open === run.id
          return (
            <div key={run.id} style={{ background: CARD, border: `1px solid ${run.has_failure ? RED : LINE}`, borderRadius: 12, overflow: 'hidden' }}>
              <button onClick={() => { setOpen(isOpen ? null : run.id); setNote(run.review_note || '') }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{run.run_date}</span>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>{CADENCE_TITLE[run.cadence] || run.cadence}</span>
                  {run.staff_name && <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>· {run.staff_name}</span>}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {run.has_failure && <span style={{ fontSize: 11, fontWeight: 800, color: RED }}>⚠ FAILURE</span>}
                  {run.status !== 'completed' && <span style={{ fontSize: 11, color: AMBER }}>in progress</span>}
                  {run.reviewed_at ? <span style={{ fontSize: 11, color: GREEN }}>✓ countersigned</span> : run.status === 'completed' ? <span style={{ fontSize: 11, color: AMBER }}>needs review</span> : null}
                </span>
              </button>
              {isOpen && (
                <div style={{ borderTop: `1px solid ${LINE}`, padding: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(run.entries || []).map((e, i) => {
                      const answered = e.checked || e.value_numeric != null || e.value_text
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: e.is_fail ? RED : 'rgba(255,255,255,0.8)' }}>
                          <span style={{ width: 16, flexShrink: 0 }}>{e.is_fail ? '⚠' : e.checked ? '✓' : answered ? '·' : '○'}</span>
                          <span style={{ flex: 1 }}>
                            {labelOf(e.key)}
                            {e.value_numeric != null && <b style={{ color: e.is_fail ? RED : '#fff' }}> — {e.value_numeric} °C</b>}
                            {e.value_text && <span style={{ color: 'rgba(255,255,255,0.6)' }}> — {e.value_text}</span>}
                            {e.is_fail && e.corrective_action && <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>↳ Action: {e.corrective_action}</div>}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {run.status === 'completed' ? (
                    <div style={{ marginTop: 12, borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, marginBottom: 6 }}>Manager countersign</div>
                      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note — actions checked, follow-up needed…" rows={2}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${LINE}`, background: '#000', color: '#fff', fontSize: 12.5, resize: 'vertical' }} />
                      <button onClick={() => doReview(run)} disabled={busy} style={{ ...tab(true), marginTop: 8 }}>{run.reviewed_at ? 'Update countersign' : '✓ Countersign this run'}</button>
                      {run.reviewed_at && <span style={{ fontSize: 11, color: GREEN, marginLeft: 10 }}>Signed {new Date(run.reviewed_at).toLocaleString('en-GB')}</span>}
                    </div>
                  ) : (
                    <div style={{ marginTop: 12, borderTop: `1px solid ${LINE}`, paddingTop: 12, fontSize: 12, color: AMBER }}>Still in progress — countersign once the crew submits it.</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Matrix() {
  const [rows, setRows] = useState(null)
  const [busy, setBusy] = useState(false)
  const isMobile = useIsMobile()
  const load = async () => { try { const r = await kitchenGetMatrix(); setRows(mergeMatrix(r.matrix)) } catch (e) { alert(e.message) } }
  useEffect(() => { load() }, [])

  const cycle = async (dish, key) => {
    const row = rows.find(r => r.dish === dish); if (!row) return
    const cur = statusOf(row.allergens[key])
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(cur) + 1) % STATUS_ORDER.length]
    const allergens = { ...row.allergens }
    if (next === 'no') delete allergens[key]; else allergens[key] = next
    setRows(rs => rs.map(r => r.dish === dish ? { ...r, allergens } : r))   // optimistic
    setBusy(true)
    try { await kitchenSaveMatrix(dish, allergens, row.notes || null) } catch (e) { alert(e.message); await load() } finally { setBusy(false) }
  }

  if (!rows) return <Muted>Loading…</Muted>

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>Tap to cycle: blank → <b style={{ color: AMBER }}>○ may contain</b> → <b style={{ color: BLUE }}>⧗ checking</b> → <b style={{ color: RED }}>● contains</b>.</div>
        <button onClick={() => printMatrix(rows)} style={tab(false)}>🖨 Print “On a Roll” allergen sheet (A4)</button>
      </div>

      {isMobile ? <MatrixCards rows={rows} cycle={cycle} busy={busy} /> : (
      <div style={{ overflowX: 'auto', border: `1px solid ${LINE}`, borderRadius: 12 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 760 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left', position: 'sticky', left: 0, background: '#15130c' }}>Dish</th>
              {ALLERGENS.map(a => <th key={a.key} style={th}>{a.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.dish}>
                <td style={{ ...td, textAlign: 'left', fontWeight: 700, color: '#fff', position: 'sticky', left: 0, background: '#0e0d09', whiteSpace: 'nowrap' }}>{row.dish}</td>
                {ALLERGENS.map(a => {
                  const st = statusOf(row.allergens[a.key]); const m = STATUS_META[st]
                  return <td key={a.key} onClick={() => !busy && cycle(row.dish, a.key)} title={`${row.dish} · ${allergenLabel(a.key)}: ${m.label} — tap to change`} style={{ ...td, cursor: 'pointer', color: m.color, fontWeight: 800, fontSize: 16 }}>{m.symbol || '·'}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: 16 }}>
        <Panel title="⧗ Still to confirm (before it's legally final)" color={BLUE}>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{PENDING.map((p, i) => <li key={i} style={{ marginBottom: 4 }}>{p}</li>)}</ol>
        </Panel>
        <Panel title="Why the grid looks like this" color={GOLD}>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{MATRIX_DRIVERS.map((d, i) => <li key={i} style={{ marginBottom: 4 }}>{d}</li>)}</ul>
        </Panel>
      </div>
    </div>
  )
}

// Phone-friendly matrix editor — one card per dish, each allergen a tappable pill that
// cycles status (blank → may-contain → checking → contains). Vertical only, so nothing
// runs off the side of the screen the way the full grid does.
function MatrixCards({ rows, cycle, busy }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map(row => {
        const flagged = ALLERGENS.filter(a => statusOf(row.allergens[a.key]) !== 'no').length
        return (
          <div key={row.dish} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px 13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 9 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{row.dish}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{flagged} flagged</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ALLERGENS.map(a => {
                const st = statusOf(row.allergens[a.key])
                return <AllergenChip key={a.key} label={a.label} status={st} busy={busy} onTap={() => !busy && cycle(row.dish, a.key)} />
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// A single tappable allergen pill. "No" recedes (muted outline) but stays tappable so a
// manager can add it; flagged statuses show their colour + symbol.
function AllergenChip({ label, status, onTap, busy }) {
  const m = STATUS_META[status]
  const active = status !== 'no'
  const tint = { trace: 'rgba(245,158,11,0.15)', pending: 'rgba(96,165,250,0.15)', contains: 'rgba(218,27,51,0.16)' }[status]
  return (
    <button onClick={onTap} disabled={busy} title={`${label}: ${m.label} — tap to change`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, lineHeight: 1,
        padding: '7px 11px', borderRadius: 999, fontSize: 12.5,
        border: `1px solid ${active ? m.color : 'rgba(255,255,255,0.14)'}`,
        background: active ? tint : 'transparent',
        color: active ? m.color : 'rgba(255,255,255,0.42)',
        fontWeight: active ? 700 : 500,
        cursor: busy ? 'default' : 'pointer',
      }}>
      {m.symbol && <span style={{ fontSize: 13 }}>{m.symbol}</span>}
      {label}
    </button>
  )
}

// Printable, public-facing A4 allergen sheet — No Dice branded, for the "On a Roll"
// food menu. Opens a clean print window.
function printMatrix(rows) {
  const origin = window.location.origin
  const cell = (st) => { const m = STATUS_META[statusOf(st)]; return `<td style="text-align:center;color:${m.color};font-weight:800;font-size:16px;border:1px solid #e6e2dd;padding:8px 4px">${m.symbol || ''}</td>` }
  const head = ['Dish', ...ALLERGENS.map(a => a.label)].map((h, i) => `<th style="border:1px solid #e6e2dd;padding:9px 5px;font-size:10px;background:#f7f3ee;text-transform:uppercase;letter-spacing:.5px;color:#3a3a3a;${i === 0 ? 'text-align:left;padding-left:12px' : ''}">${h}</th>`).join('')
  const body = rows.map((r, ri) => `<tr style="background:${ri % 2 ? '#fbfaf8' : '#fff'}"><td style="border:1px solid #e6e2dd;padding:9px 12px;font-weight:700;font-size:12.5px;white-space:nowrap">${r.dish}</td>${ALLERGENS.map(a => cell(r.allergens[a.key])).join('')}</tr>`).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>On a Roll — Allergen Guide</title></head>
  <body style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;background:#fff;margin:0;padding:36px 42px;-webkit-print-color-adjust:exact;print-color-adjust:exact">
    <div style="text-align:center;margin-bottom:24px">
      <img src="${origin}/nodice-wordmark.png" alt="No Dice" style="height:38px" onerror="this.style.display='none'"/>
      <div style="font-size:10.5px;letter-spacing:3px;text-transform:uppercase;color:#8a8a8a;margin-top:9px">London Fields</div>
      <div style="height:2px;width:52px;background:#DA1B33;margin:16px auto 14px"></div>
      <div style="font-size:36px;font-weight:700;letter-spacing:.5px">On a Roll</div>
      <div style="font-size:15px;color:#555;font-style:italic;margin-top:1px">Allergen Guide</div>
    </div>
    <table style="border-collapse:collapse;width:100%"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    <div style="display:flex;gap:24px;flex-wrap:wrap;font-size:12px;margin-top:18px;color:#333">
      <span><b style="color:#DA1B33;font-size:15px">●</b> Contains</span>
      <span><b style="color:#F59E0B;font-size:15px">○</b> May contain / made in the same kitchen</span>
      <span><b style="color:#2563eb;font-size:15px">⧗</b> Checking with our supplier</span>
    </div>
    <div style="margin-top:16px;padding:13px 15px;background:#f7f3ee;border-left:3px solid #DA1B33;font-size:12px;line-height:1.6;color:#333">
      <b>Please tell us about any allergy before you order</b> — we'll happily talk you through it. Everything is fried in a shared fryer, so our chips are not gluten-free and can carry cross-contact.
    </div>
    <div style="text-align:center;font-size:10px;color:#a0a0a0;margin-top:22px;letter-spacing:.3px">No Dice · 407 Mentmore Terrace, London Fields, E8 3PH</div>
  </body></html>`
  const w = window.open('', '_blank'); if (!w) { alert('Allow pop-ups to print the sheet.'); return }
  w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400)
}

// Manager view of stock thrown out — product + reason, newest first, grouped by day.
function WasteLog() {
  const [rows, setRows] = useState(null)
  useEffect(() => { (async () => { try { const r = await kitchenWasteLog(45); setRows(r.waste || []) } catch (e) { alert(e.message) } })() }, [])
  if (!rows) return <Muted>Loading…</Muted>
  if (!rows.length) return <Muted>No wastage logged yet. It appears here as the kitchen crew record thrown-out stock.</Muted>
  const byDate = {}
  for (const r of rows) (byDate[r.log_date] ||= []).push(r)
  const fmt = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>Everything the kitchen has binned (last 45 days) — for ordering, cost control & the EHO record.</div>
      {Object.keys(byDate).map(date => (
        <div key={date}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, marginBottom: 6 }}>{fmt(date)} <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>· {byDate[date].length} item{byDate[date].length === 1 ? '' : 's'}</span></div>
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
            {byDate[date].map((w, i) => (
              <div key={w.id} style={{ padding: '10px 14px', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{w.product}{w.quantity ? <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}> · {w.quantity}</span> : null}</div>
                  {w.reason && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{w.reason}</div>}
                </div>
                {w.staff_name && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{w.staff_name}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// The blank checklists themselves — every task staff are asked to do, read-only.
function Templates() {
  const [open, setOpen] = useState('opening')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>Exactly what the kitchen crew work through on each sheet. <strong style={{ color: RED }}>Critical</strong> items and temperature targets are marked — a temp outside target auto-fails and needs a written fix.</div>
      {Object.keys(KITCHEN_TEMPLATES).map(k => {
        const t = KITCHEN_TEMPLATES[k], isOpen = open === k
        const n = templateItems(k).length
        return (
          <div key={k} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
            <button onClick={() => setOpen(isOpen ? null : k)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ fontSize: 18 }}>{t.icon}</span><span style={{ fontSize: 14, fontWeight: 700 }}>{t.title}</span></span>
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>{n} items · {isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div style={{ borderTop: `1px solid ${LINE}`, padding: 14 }}>
                {t.groups.map(g => (
                  <div key={g.title} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{g.title}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {g.items.map(item => (
                        <div key={item.key} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'rgba(255,255,255,0.85)' }}>
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>{item.type === 'temp' ? '🌡️' : item.type === 'text' ? '✎' : '☐'}</span>
                          <span style={{ flex: 1 }}>{item.label}
                            {item.type === 'temp' && <span style={{ color: 'rgba(255,255,255,0.5)' }}> — target {targetLabel(item.target)}</span>}
                            {item.critical && <span style={{ fontSize: 9.5, color: RED, fontWeight: 800, marginLeft: 6, letterSpacing: '0.04em' }}>CRITICAL</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const Muted = ({ children }) => <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, padding: '18px 0' }}>{children}</div>
const Stat = ({ n, label, color }) => (
  <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '8px 14px', minWidth: 96 }}>
    <div style={{ fontSize: 22, fontWeight: 800, color }}>{n}</div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{label}</div>
  </div>
)
const Panel = ({ title, color, children }) => (
  <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
    <div style={{ fontSize: 12.5, fontWeight: 700, color, marginBottom: 8 }}>{title}</div>
    {children}
  </div>
)
const th = { padding: '8px 6px', textAlign: 'center', color: 'rgba(255,255,255,0.65)', fontWeight: 700, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap', fontSize: 11 }
const td = { padding: '7px 6px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }
const tab = (on) => ({ padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: on ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? GOLD : LINE}`, color: on ? GOLD : 'rgba(255,255,255,0.85)' })
