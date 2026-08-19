import React, { useEffect, useMemo, useRef, useState } from 'react'
import DateField from '../../lib/DateField.jsx'
import {
  receiptsList, receiptAdd, receiptUpdate, receiptVoid, receiptsStaff,
  uploadReceiptImage, CATEGORIES, categoryOf,
} from '../../finance/receiptsApi.js'

const GOLD = '#C9A84C', LINE = 'rgba(201,168,76,0.22)', CARD = 'rgba(255,255,255,0.03)'
const todayISO = () => new Date().toISOString().slice(0, 10)
const money = (n) => '£' + (Number(n) || 0).toFixed(2)
const ukDate = (iso) => iso ? new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : ''

const BLANK = {
  supplier: '', spendDate: todayISO(), amount: '', category: 'business', note: '',
  compItem: '', compPrice: '', ourPrice: '', compVerdict: '',
  staffName: '', staffId: null, imagePath: null, imagePreview: null,
}

const btn = { padding: '9px 14px', borderRadius: 8, border: `1px solid ${LINE}`, background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer' }
const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${LINE}`, background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: 15, boxSizing: 'border-box' }
const lbl = { display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 5 }

// ─── /ops Receipts — photograph it, type three things, done ───────────────────
//
// Typed, never read off the image. Hubdoc's OCR put two of twelve receipts in
// 2020 instead of 2026; one of those hid £48 of cost in the wrong year and the
// other threw the bank £69 out. Three taps of typing removes that whole class
// of error, and the category is chosen here — while you still remember why you
// spent it — rather than reconstructed months later by an accountant.
export default function Receipts() {
  const [rows, setRows] = useState(null)
  const [staff, setStaff] = useState([])
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('all')
  const fileRef = useRef(null)

  const load = async () => {
    try { setRows((await receiptsList(180)).receipts || []) }
    catch (e) { alert(e.message); setRows([]) }
  }
  useEffect(() => {
    load()
    receiptsStaff().then(r => setStaff(r.staff || [])).catch(() => {})
  }, [])

  const pickPhoto = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const preview = URL.createObjectURL(file)
      setForm(f => ({ ...f, imagePreview: preview }))
      const path = await uploadReceiptImage(file)
      setForm(f => ({ ...f, imagePath: path }))
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  const save = async () => {
    const f = form
    if (!f.supplier.trim()) return alert('Who did you pay?')
    if (!f.spendDate) return alert('What date was it?')
    if (!(Number(f.amount) > 0)) return alert('How much was it?')
    if (f.category === 'competitor' && (!f.compItem.trim() || !(Number(f.compPrice) > 0))) {
      return alert('A competitor check needs their item and their price — that is what makes it count.')
    }
    setBusy(true)
    try {
      await receiptAdd({
        supplier: f.supplier.trim(), spendDate: f.spendDate, amount: Number(f.amount),
        category: f.category, note: f.note.trim(), staffName: f.staffName, staffId: f.staffId,
        imagePath: f.imagePath,
        compItem: f.compItem.trim(), compPrice: Number(f.compPrice) || 0,
        ourPrice: Number(f.ourPrice) || 0, compVerdict: f.compVerdict.trim(),
      })
      setForm(null)
      await load()
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  const recategorise = async (r, category) => {
    setBusy(true)
    try { await receiptUpdate(r.id, { category }); await load() }
    catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  const remove = async (r) => {
    if (!window.confirm(`Remove the ${money(r.amount)} receipt from ${r.supplier}?`)) return
    setBusy(true)
    try { await receiptVoid(r.id); await load() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  const totals = useMemo(() => {
    const out = {}
    for (const r of rows || []) {
      const k = r.category || 'business'
      out[k] = out[k] || { n: 0, total: 0 }
      out[k].n++; out[k].total += Number(r.amount) || 0
    }
    return out
  }, [rows])

  if (!rows) return <div style={{ color: 'rgba(255,255,255,0.55)', padding: '20px 0' }}>Loading…</div>

  const shown = filter === 'all' ? rows : rows.filter(r => (r.category || 'business') === filter)

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 24, color: '#fff' }}>🧾 Receipts</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', lineHeight: 1.5, maxWidth: 640 }}>
            Photograph the receipt and type three things. Emailed receipts are picked up automatically —
            this is for paper. Filing a receipt never creates a bill or a payment; it only ever attaches
            evidence to money that has already left the bank.
          </div>
        </div>
        {!form && (
          <button onClick={() => setForm({ ...BLANK })}
            style={{ ...btn, background: GOLD, color: '#1a1509', border: 'none', fontWeight: 800 }}>
            + Add receipt
          </button>
        )}
      </div>

      {/* ── the form ─────────────────────────────────────────────────── */}
      {form && (
        <div style={{ marginTop: 18, padding: 16, borderRadius: 12, border: `1px solid ${LINE}`, background: CARD }}>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ width: 132 }}>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                onChange={e => pickPhoto(e.target.files?.[0])} />
              <button onClick={() => fileRef.current?.click()}
                style={{
                  ...btn, width: 132, height: 132, borderRadius: 12, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6, padding: 0, overflow: 'hidden',
                  borderStyle: form.imagePreview ? 'solid' : 'dashed',
                }}>
                {form.imagePreview
                  ? <img src={form.imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <><span style={{ fontSize: 26 }}>📷</span><span style={{ fontSize: 12, opacity: 0.7 }}>Photo</span></>}
              </button>
              {form.imagePreview && !form.imagePath && (
                <div style={{ fontSize: 11, color: GOLD, marginTop: 6, textAlign: 'center' }}>Uploading…</div>
              )}
            </div>

            <div style={{ flex: '1 1 320px', minWidth: 260, display: 'grid', gap: 12 }}>
              <label><span style={lbl}>Who did you pay?</span>
                <input value={form.supplier} autoFocus placeholder="E5 Bakehouse"
                  onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} style={inp} />
              </label>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ flex: '1 1 150px' }}><span style={lbl}>Date</span>
                  <DateField value={form.spendDate} onChange={v => setForm(f => ({ ...f, spendDate: v }))}
                    yearMin={2026} yearMax={new Date().getFullYear() + 1} style={inp} />
                </label>
                <label style={{ flex: '1 1 120px' }}><span style={lbl}>Amount £</span>
                  <input value={form.amount} inputMode="decimal" placeholder="9.65"
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/[^\d.]/g, '') }))} style={inp} />
                </label>
              </div>
            </div>
          </div>

          {/* ── what kind of spend ─────────────────────────────────── */}
          <div style={{ marginTop: 16 }}>
            <span style={lbl}>What was it for?</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => {
                const on = form.category === c.key
                return (
                  <button key={c.key} onClick={() => setForm(f => ({ ...f, category: c.key }))}
                    style={{
                      ...btn, fontWeight: on ? 800 : 500,
                      background: on ? GOLD : 'transparent',
                      color: on ? '#1a1509' : '#fff',
                      border: on ? 'none' : `1px solid ${LINE}`,
                    }}>
                    {c.label}
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 8, lineHeight: 1.5 }}>
              {categoryOf(form.category).hint}
              {categoryOf(form.category).code && <span style={{ opacity: 0.6 }}> · Xero {categoryOf(form.category).code}</span>}
            </div>
          </div>

          {/* ── competitor check ───────────────────────────────────── */}
          {form.category === 'competitor' && (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 10, border: `1px dashed ${LINE}`, display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                Fill this in now, not later. A note written at the time is what makes this a genuine
                business cost rather than lunch — and it builds a local price list you can actually use.
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ flex: '2 1 200px' }}><span style={lbl}>Their item</span>
                  <input value={form.compItem} placeholder="Mortadella focaccia"
                    onChange={e => setForm(f => ({ ...f, compItem: e.target.value }))} style={inp} />
                </label>
                <label style={{ flex: '1 1 110px' }}><span style={lbl}>Their price £</span>
                  <input value={form.compPrice} inputMode="decimal" placeholder="11.00"
                    onChange={e => setForm(f => ({ ...f, compPrice: e.target.value.replace(/[^\d.]/g, '') }))} style={inp} />
                </label>
                <label style={{ flex: '1 1 110px' }}><span style={lbl}>Ours £</span>
                  <input value={form.ourPrice} inputMode="decimal" placeholder="9.50"
                    onChange={e => setForm(f => ({ ...f, ourPrice: e.target.value.replace(/[^\d.]/g, '') }))} style={inp} />
                </label>
              </div>
              <label><span style={lbl}>What did you conclude?</span>
                <input value={form.compVerdict} placeholder="Bigger portion, better bread — review our pricing"
                  onChange={e => setForm(f => ({ ...f, compVerdict: e.target.value }))} style={inp} />
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
            <label style={{ flex: '2 1 260px' }}><span style={lbl}>Note (optional)</span>
              <input value={form.note} placeholder="Coffees for the Saturday team"
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={inp} />
            </label>
            <label style={{ flex: '1 1 160px' }}><span style={lbl}>Filed by</span>
              <select value={form.staffId || ''} style={inp}
                onChange={e => {
                  const s = staff.find(x => x.id === e.target.value)
                  setForm(f => ({ ...f, staffId: s?.id || null, staffName: s?.name || '' }))
                }}>
                <option value="">—</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} disabled={busy}
              style={{ ...btn, background: GOLD, color: '#1a1509', border: 'none', fontWeight: 800, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Saving…' : 'Save receipt'}
            </button>
            <button onClick={() => setForm(null)} disabled={busy} style={btn}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── totals by category ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0 14px' }}>
        <Chip label="All" n={rows.length} total={rows.reduce((s, r) => s + Number(r.amount || 0), 0)}
          on={filter === 'all'} onClick={() => setFilter('all')} />
        {CATEGORIES.map(c => (
          <Chip key={c.key} label={c.label} n={totals[c.key]?.n || 0} total={totals[c.key]?.total || 0}
            on={filter === c.key} onClick={() => setFilter(filter === c.key ? 'all' : c.key)} />
        ))}
      </div>

      {/* ── the list ─────────────────────────────────────────────────── */}
      {!shown.length && (
        <div style={{ padding: '28px 0', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          Nothing here yet. Emailed receipts file themselves — add the paper ones with the button above.
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {shown.map(r => {
          const cat = categoryOf(r.category)
          return (
            <div key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 12, borderRadius: 10, border: `1px solid ${LINE}`, background: CARD }}>
              {r.image_url
                ? <a href={r.image_url} target="_blank" rel="noreferrer" style={{ flex: '0 0 54px' }}>
                    <img src={r.image_url} alt="" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                  </a>
                : <div style={{ flex: '0 0 54px', height: 54, borderRadius: 8, border: `1px dashed ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, opacity: 0.5 }}>🧾</div>}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{r.supplier}</span>
                  <span style={{ color: GOLD, fontWeight: 700 }}>{money(r.amount)}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{ukDate(r.spend_date)}</span>
                  {r.staff_name && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>· {r.staff_name}</span>}
                </div>
                {r.comp_item && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                    {r.comp_item} — theirs {money(r.comp_price)}{r.our_price ? `, ours ${money(r.our_price)}` : ''}
                    {r.comp_verdict ? ` · ${r.comp_verdict}` : ''}
                  </div>
                )}
                {r.note && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{r.note}</div>}

                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(c => (
                    <button key={c.key} onClick={() => c.key !== r.category && recategorise(r, c.key)} disabled={busy}
                      style={{
                        padding: '3px 9px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                        border: c.key === r.category ? 'none' : `1px solid ${LINE}`,
                        background: c.key === r.category ? GOLD : 'transparent',
                        color: c.key === r.category ? '#1a1509' : 'rgba(255,255,255,0.6)',
                        fontWeight: c.key === r.category ? 800 : 500,
                      }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => remove(r)} disabled={busy} title="Remove"
                style={{ ...btn, padding: '4px 9px', fontSize: 12, opacity: 0.6 }}>×</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Chip({ label, n, total, on, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
      border: on ? 'none' : `1px solid ${LINE}`,
      background: on ? GOLD : CARD, color: on ? '#1a1509' : '#fff',
    }}>
      <div style={{ fontSize: 11, opacity: on ? 0.75 : 0.55 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 15 }}>
        {'£' + (Number(total) || 0).toFixed(2)}
        <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.6 }}> · {n}</span>
      </div>
    </button>
  )
}
