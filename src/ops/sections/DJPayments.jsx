import React, { useState } from 'react'
import { djAdmin, kindFor, fmtDate, sessionForSlot, slotLabel, payFriday } from '../../dj/api.js'
import { Avatar } from './DJRoster.jsx'

// DJ Payments (admin) — per-DJ sessions played + logged expense receipts, to
// help reconcile against each DJ's invoice. Session FEES vary per DJ and are
// agreed off-system, so NO £ session value is shown here — only the count of
// paid sessions (pay each DJ their agreed rate × that count) and their receipts
// (real £ amounts) to reimburse. Read-mostly: the only write is deleting a
// mistaken receipt.

const RED = '#DA1B33', GREEN = '#34D399', YELLOW = '#FCD34D', LINE = 'rgba(255,255,255,0.1)'
const CAT_LABEL = { taxi: '🚕 Taxi', drinks: '🍺 Drinks', other: '🧾 Other' }
const money = (n) => '£' + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-GB', { maximumFractionDigits: 2 })

export default function DJPayments({ djs = [], slots = [], receipts = [], reload }) {
  const [expanded, setExpanded] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  // Sessions — confirmed paid sessions, credited to the lead DJ + b2b partner.
  const sessBy = {}
  for (const s of slots) {
    const kind = s.kind || kindFor(s.date, s.slot)
    if (s.status !== 'confirmed' || kind !== 'session') continue
    for (const who of [s.dj_id, s.dj_id2]) {
      if (!who) continue
      const b = (sessBy[who] ??= { past: [], upcoming: [] })
      ;(s.date < today ? b.past : b.upcoming).push(s)
    }
  }
  const rcBy = {}
  for (const r of receipts) (rcBy[r.dj_id] ??= []).push(r)

  const djMap = Object.fromEntries(djs.map(d => [d.id, d]))
  const ids = new Set([...Object.keys(sessBy).filter(id => sessBy[id].past.length), ...Object.keys(rcBy)])
  const rows = [...ids]
    .map(id => {
      const dj = djMap[id]
      const s = sessBy[id] || { past: [], upcoming: [] }
      const rc = (rcBy[id] || []).slice().sort((a, b) => (b.receipt_date || '').localeCompare(a.receipt_date || ''))
      const receiptsTotal = rc.reduce((t, r) => t + (Number(r.amount) || 0), 0)
      return { id, dj, past: s.past.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')), upcoming: s.upcoming, rc, receiptsTotal }
    })
    .filter(r => r.dj)
    .sort((a, b) => b.receiptsTotal - a.receiptsTotal || b.past.length - a.past.length || (a.dj.dj_name || '').localeCompare(b.dj.dj_name || ''))

  const grandReceipts = rows.reduce((s, r) => s + r.receiptsTotal, 0)
  const grandSessions = rows.reduce((s, r) => s + r.past.length, 0)
  // Invoices landed but not yet paid — the £ you still owe on fees.
  const grandOutstanding = rows.reduce((sum, r) => sum + r.past.reduce((a, s) => a + (s.invoice_received_at && !s.paid_at ? (Number(s.invoice_amount) || 0) : 0), 0), 0)

  const [amtDraft, setAmtDraft] = useState({})   // per-slot £ amount while typing
  const toggle = (id) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const del = async (id) => {
    if (!window.confirm('Delete this receipt? (This removes it from the DJ too.)')) return
    setBusy(true)
    try { await djAdmin('deleteReceipt', { id }); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const amtFor = (s) => { const k = s.date + '|' + (s.slot || 'main'); return amtDraft[k] !== undefined ? amtDraft[k] : (s.invoice_amount ?? '') }
  const setRecv = async (s, onVal) => {
    setBusy(true)
    try { await djAdmin('invoiceReceived', { date: s.date, slot: s.slot || 'main', on: onVal, amount: onVal ? amtFor(s) : undefined }); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const saveAmt = async (s) => {
    setBusy(true)
    try { await djAdmin('setInvoiceAmount', { date: s.date, slot: s.slot || 'main', amount: amtFor(s) }); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const setPaid = async (s, onVal) => {
    setBusy(true)
    try { await djAdmin('markPaid', { date: s.date, slot: s.slot || 'main', on: onVal }); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const pill = (on, c) => ({ padding: '6px 11px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: busy ? 'default' : 'pointer', background: on ? c : 'transparent', color: on ? '#04240f' : '#fff', border: `1px solid ${on ? c : LINE}` })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="serif" style={{ fontSize: 22, color: '#FFFFFF' }}>💷 DJ Payments</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, lineHeight: 1.5 }}>
          Per DJ: their nights, invoices &amp; receipts. Tick <strong style={{ color: '#fff' }}>Invoice landed</strong> (+ the £ off it) when it arrives, then <strong style={{ color: '#fff' }}>Paid</strong> on the Friday after they played. Fees come off each DJ's invoice.
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <Stat label="Invoices to pay (landed)" value={money(grandOutstanding)} color={GREEN} strong />
        <Stat label="Receipts to reimburse" value={money(grandReceipts)} color={YELLOW} />
        <Stat label="Paid sessions played" value={String(grandSessions)} color="rgba(255,255,255,0.85)" />
      </div>

      {rows.length === 0 ? (
        <div style={{ background: '#0A0A0A', border: `1px dashed ${LINE}`, borderRadius: 12, padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
          Nothing yet — sessions appear once a paid night is confirmed, and receipts once DJs log them.
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
                  {r.past.length} paid session{r.past.length === 1 ? '' : 's'} · {r.rc.length} receipt{r.rc.length === 1 ? '' : 's'}
                  {r.upcoming.length > 0 && <span style={{ color: 'rgba(255,255,255,0.4)' }}> · {r.upcoming.length} booked ahead</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: YELLOW }}>{money(r.receiptsTotal)}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>receipts</div>
              </div>
            </button>

            {open && (
              <div style={{ borderTop: `1px solid ${LINE}`, padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Sessions played (count/dates only — fee is per-DJ, off-system) */}
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Paid sessions played <span style={{ textTransform: 'none', letterSpacing: 0, color: 'rgba(255,255,255,0.4)' }}>— pay at this DJ's agreed rate</span></div>
                  {r.past.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>No played sessions yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {r.past.map((s, i) => {
                        const sess = sessionForSlot(s.date, s.slot); const sLab = slotLabel(s.date, s.slot)
                        const landed = !!s.invoice_received_at, paid = !!s.paid_at, sent = !!s.invoice_sent_at
                        return (
                          <div key={s.date + '-' + (s.slot || 'main') + i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderLeft: `3px solid ${paid ? GREEN : landed ? YELLOW : LINE}`, borderRadius: 9, padding: '10px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(s.date)} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontSize: 11 }}>· {sess?.day}{sLab ? ` · ${sLab}` : ''}{s.night_name ? ` · "${s.night_name}"` : ''}{s.dj_id2 && s.dj_id !== r.id ? ' · (b2b)' : ''}</span></div>
                              <span style={{ fontSize: 10.5, color: paid ? GREEN : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{paid ? 'paid ✓' : `pay by ${fmtDate(payFriday(s.date))}`}</span>
                            </div>
                            <div style={{ fontSize: 10.5, color: sent ? GREEN : 'rgba(255,255,255,0.4)', marginTop: 3 }}>{sent ? '✓ DJ marked invoice sent' : 'DJ hasn’t ticked invoice sent'}</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>£</span>
                              <input inputMode="decimal" value={amtFor(s)} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setAmtDraft(d => ({ ...d, [s.date + '|' + (s.slot || 'main')]: v })) }} onBlur={() => saveAmt(s)} placeholder="amount" style={{ width: 84, padding: '6px 8px', fontSize: 13, borderRadius: 7, background: '#000', border: `1px solid ${LINE}`, color: '#fff' }} />
                              <button onClick={() => setRecv(s, !landed)} disabled={busy} style={pill(landed, YELLOW)}>{landed ? '✓ Invoice landed' : 'Mark landed'}</button>
                              <button onClick={() => setPaid(s, !paid)} disabled={busy} style={pill(paid, GREEN)}>{paid ? '✓ Paid' : 'Mark paid'}</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {r.upcoming.length > 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>📅 {r.upcoming.length} confirmed session{r.upcoming.length === 1 ? '' : 's'} booked ahead.</div>}
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
    <div style={{ flex: 1, minWidth: 150, background: '#0A0A0A', border: `1px solid ${strong ? 'rgba(252,211,77,0.4)' : LINE}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
    </div>
  )
}
