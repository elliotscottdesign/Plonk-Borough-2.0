import React, { useState } from 'react'
import { djAdmin, kindFor, fmtDate, sessionForSlot, slotLabel } from '../../dj/api.js'
import { Avatar } from './DJRoster.jsx'

// DJ Payments (admin) — per-DJ fees + logged expense receipts, so the founder
// can reconcile against each DJ's invoice. Fees = £SESSION_FEE per CONFIRMED
// paid session (past = owed, upcoming = booked ahead); credited to the lead DJ
// AND any back-to-back partner. Receipts come from the dj_receipts table
// (attached by DJs in the portal's Payments tab). Read-mostly: the only write
// is deleting a mistaken receipt.

const RED = '#DA1B33', GREEN = '#34D399', YELLOW = '#FCD34D', LINE = 'rgba(255,255,255,0.1)'
const SESSION_FEE = 100
const CAT_LABEL = { taxi: '🚕 Taxi', drinks: '🍺 Drinks', other: '🧾 Other' }
const money = (n) => '£' + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-GB', { maximumFractionDigits: 2 })

export default function DJPayments({ djs = [], slots = [], receipts = [], reload }) {
  const [expanded, setExpanded] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  // Fees — confirmed paid sessions, credited to the lead DJ + b2b partner.
  const feesBy = {}
  for (const s of slots) {
    const kind = s.kind || kindFor(s.date, s.slot)
    if (s.status !== 'confirmed' || kind !== 'session') continue
    for (const who of [s.dj_id, s.dj_id2]) {
      if (!who) continue
      const b = (feesBy[who] ??= { past: [], upcoming: [] })
      ;(s.date < today ? b.past : b.upcoming).push(s)
    }
  }
  const rcBy = {}
  for (const r of receipts) (rcBy[r.dj_id] ??= []).push(r)

  const djMap = Object.fromEntries(djs.map(d => [d.id, d]))
  const ids = new Set([...Object.keys(feesBy).filter(id => feesBy[id].past.length), ...Object.keys(rcBy)])
  const rows = [...ids]
    .map(id => {
      const dj = djMap[id]
      const f = feesBy[id] || { past: [], upcoming: [] }
      const rc = (rcBy[id] || []).slice().sort((a, b) => (b.receipt_date || '').localeCompare(a.receipt_date || ''))
      const feesTotal = f.past.length * SESSION_FEE
      const receiptsTotal = rc.reduce((s, r) => s + (Number(r.amount) || 0), 0)
      return { id, dj, past: f.past.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')), upcoming: f.upcoming, feesTotal, rc, receiptsTotal, total: feesTotal + receiptsTotal }
    })
    .filter(r => r.dj)
    .sort((a, b) => b.total - a.total || (a.dj.dj_name || '').localeCompare(b.dj.dj_name || ''))

  const grandFees = rows.reduce((s, r) => s + r.feesTotal, 0)
  const grandReceipts = rows.reduce((s, r) => s + r.receiptsTotal, 0)

  const toggle = (id) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const del = async (id) => {
    if (!window.confirm('Delete this receipt? (This removes it from the DJ too.)')) return
    setBusy(true)
    try { await djAdmin('deleteReceipt', { id }); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="serif" style={{ fontSize: 22, color: '#FFFFFF' }}>💷 DJ Payments</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
          £{SESSION_FEE} per confirmed paid session + logged receipts. Reconcile each DJ against their invoice.
        </div>
      </div>

      {/* Totals owed now (past fees + all receipts) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <Stat label="Fees owed (played)" value={money(grandFees)} color={GREEN} />
        <Stat label="Receipts to reimburse" value={money(grandReceipts)} color={YELLOW} />
        <Stat label="Total to pay out" value={money(grandFees + grandReceipts)} color="#fff" strong />
      </div>

      {rows.length === 0 ? (
        <div style={{ background: '#0A0A0A', border: `1px dashed ${LINE}`, borderRadius: 12, padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
          Nothing to pay yet — fees appear once a paid session is confirmed, and receipts once DJs log them.
        </div>
      ) : rows.map(r => {
        const open = expanded.has(r.id)
        return (
          <div key={r.id} style={{ background: '#0A0A0A', border: `1px solid ${LINE}`, borderRadius: 12, overflow: 'hidden' }}>
            <button onClick={() => toggle(r.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', textAlign: 'left' }}>
              <span style={{ color: RED, fontSize: 11, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', width: 10, flexShrink: 0 }}>▶</span>
              <Avatar d={r.dj} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{r.dj.dj_name || 'Unnamed'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                  {r.past.length} session{r.past.length === 1 ? '' : 's'} · {r.rc.length} receipt{r.rc.length === 1 ? '' : 's'}
                  {r.upcoming.length > 0 && <span style={{ color: 'rgba(255,255,255,0.4)' }}> · {r.upcoming.length} booked ahead</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: GREEN }}>{money(r.total)}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{money(r.feesTotal)} + {money(r.receiptsTotal)}</div>
              </div>
            </button>

            {open && (
              <div style={{ borderTop: `1px solid ${LINE}`, padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Fees */}
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Fees — confirmed paid sessions</div>
                  {r.past.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>No played sessions yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {r.past.map((s, i) => {
                        const sess = sessionForSlot(s.date, s.slot); const sLab = slotLabel(s.date, s.slot)
                        return (
                          <div key={s.date + '-' + (s.slot || 'main') + i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                            <span style={{ flex: 1, minWidth: 0 }}>{fmtDate(s.date)} <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>· {sess?.day}{sLab ? ` · ${sLab}` : ''}{s.night_name ? ` · "${s.night_name}"` : ''}{s.dj_id2 && s.dj_id !== r.id ? ' · (b2b)' : ''}</span></span>
                            <span style={{ fontWeight: 700, color: GREEN }}>{money(SESSION_FEE)}</span>
                          </div>
                        )
                      })}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${LINE}`, paddingTop: 6, marginTop: 2, fontSize: 13 }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Fees subtotal</span><span style={{ fontWeight: 700, color: GREEN }}>{money(r.feesTotal)}</span>
                      </div>
                    </div>
                  )}
                  {r.upcoming.length > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>📅 {r.upcoming.length} confirmed session{r.upcoming.length === 1 ? '' : 's'} booked ahead ({money(r.upcoming.length * SESSION_FEE)}) — not yet owed.</div>}
                </div>

                {/* Receipts */}
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Receipts — expenses to reimburse</div>
                  {r.rc.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>No receipts logged.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {r.rc.map(rc => (
                        <div key={rc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 9, padding: '8px 10px' }}>
                          {rc.image_url && <a href={rc.image_url} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}><img src={rc.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 7, objectFit: 'cover', background: '#1a1a1a', border: `1px solid ${LINE}` }} /></a>}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{CAT_LABEL[rc.category] || rc.category} <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400, fontSize: 11 }}>· {fmtDate((rc.receipt_date || '').slice(0, 10))}</span></div>
                            {rc.note && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rc.note}</div>}
                          </div>
                          <div style={{ fontWeight: 700, color: YELLOW }}>{money(rc.amount)}</div>
                          <button onClick={() => del(rc.id)} disabled={busy} aria-label="Delete receipt" title="Delete receipt" style={{ width: 30, height: 30, flexShrink: 0, background: 'transparent', border: '1px solid rgba(248,113,113,0.5)', color: '#F87171', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>✕</button>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${LINE}`, paddingTop: 6, marginTop: 2, fontSize: 13 }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Receipts subtotal</span><span style={{ fontWeight: 700, color: YELLOW }}>{money(r.receiptsTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 9, padding: '10px 12px' }}>
                  <span style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>Total to pay {r.dj.dj_name}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: GREEN }}>{money(r.total)}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value, color, strong }) {
  return (
    <div style={{ flex: 1, minWidth: 150, background: '#0A0A0A', border: `1px solid ${strong ? 'rgba(52,211,153,0.4)' : LINE}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
    </div>
  )
}
