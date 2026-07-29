import React, { useEffect, useState } from 'react'
import { eventsList, eventAdd, eventUpdate, eventDelete, EVENT_CATEGORIES, CATEGORY_ORDER, catMeta, eventDateLabel } from '../keydates/events.js'

const GOLD = '#C9A84C', LINE = 'rgba(201,168,76,0.22)', CARD = 'rgba(255,255,255,0.03)'
const todayISO = () => new Date().toISOString().slice(0, 10)
const monthLabel = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const daysUntil = (d) => Math.round((new Date(d + 'T00:00:00Z') - new Date(todayISO() + 'T00:00:00Z')) / 86400000)

const BLANK = { start_date: '', end_date: '', title: '', category: 'local', location: '', angle: '' }

// ─── /ops Key Dates — the opportunities tracker (festivals, half-terms, etc.) ──
export default function KeyDates() {
  const [events, setEvents] = useState(null)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(null)     // null | BLANK (add) | {id,...} (edit)
  const [busy, setBusy] = useState(false)

  const load = async () => { try { setEvents((await eventsList()).events || []) } catch (e) { alert(e.message) } }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.start_date) { alert('Pick a start date.'); return }
    if (!form.title.trim()) { alert('Give it a name.'); return }
    setBusy(true)
    try {
      const payload = { start_date: form.start_date, end_date: form.end_date || null, title: form.title.trim(), category: form.category, location: form.location.trim(), angle: form.angle.trim() }
      if (form.id) await eventUpdate(form.id, payload); else await eventAdd(payload)
      setForm(null); await load()
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const remove = async (ev) => { if (!window.confirm(`Delete "${ev.title}"?`)) return; setBusy(true); try { await eventDelete(ev.id); await load() } catch (e) { alert(e.message) } finally { setBusy(false) } }

  if (!events) return <div style={{ color: 'rgba(255,255,255,0.55)', padding: '20px 0' }}>Loading…</div>

  const shown = filter === 'all' ? events : events.filter(e => e.category === filter)
  const upcoming = shown.filter(e => (e.end_date || e.start_date) >= todayISO())
  const byMonth = {}
  for (const e of upcoming) (byMonth[monthLabel(e.start_date)] ||= []).push(e)

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="serif" style={{ fontSize: 24, color: '#fff' }}>📆 Key Dates</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', lineHeight: 1.5, maxWidth: 640 }}>Festivals (Victoria Park & East London), school half-terms, fireworks, bank holidays and drink/food days — everything that swells footfall. These flag up on the Staff Rota & DJ calendars as you schedule. Add anything you know that we can't (craft fairs, local markets…).</div>
        </div>
        {!form && <button onClick={() => setForm({ ...BLANK, category: 'local' })} style={{ ...btn, background: GOLD, color: '#1a1509', border: 'none', fontWeight: 800 }}>+ Add event</button>}
      </div>

      {form && (
        <div style={{ background: CARD, border: `1px solid ${GOLD}`, borderRadius: 12, padding: 16, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{form.id ? 'Edit event' : 'New event'}</div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What's on? (e.g. Broadway Market craft fair)" style={inp} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label style={lbl}>Start<input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }} /></label>
            <label style={lbl}>End <span style={{ color: 'rgba(255,255,255,0.4)' }}>(optional)</span><input type="date" value={form.end_date || ''} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }} /></label>
            <label style={lbl}>Type<select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }}>{CATEGORY_ORDER.map(c => <option key={c} value={c}>{EVENT_CATEGORIES[c].icon} {EVENT_CATEGORIES[c].label}</option>)}</select></label>
          </div>
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Where? (e.g. Victoria Park) — optional" style={inp} />
          <input value={form.angle} onChange={e => setForm(f => ({ ...f, angle: e.target.value }))} placeholder="The angle — deal / party / footfall note" style={inp} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={busy} style={{ ...btn, background: GOLD, color: '#1a1509', border: 'none', fontWeight: 800 }}>{form.id ? 'Save changes' : 'Add event'}</button>
            <button onClick={() => setForm(null)} disabled={busy} style={btn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '18px 0 6px' }}>
        {['all', ...CATEGORY_ORDER].map(c => {
          const on = filter === c, m = c === 'all' ? { label: 'All', icon: '📋' } : catMeta(c)
          return <button key={c} onClick={() => setFilter(c)} style={{ padding: '6px 11px', borderRadius: 999, fontSize: 12, cursor: 'pointer', background: on ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? GOLD : LINE}`, color: on ? GOLD : 'rgba(255,255,255,0.8)' }}>{m.icon} {m.label}</button>
        })}
      </div>

      {upcoming.length === 0 && <div style={{ color: 'rgba(255,255,255,0.55)', padding: '18px 0' }}>Nothing upcoming in this category.</div>}
      {Object.keys(byMonth).map(month => (
        <div key={month} style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{month}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {byMonth[month].map(ev => {
              const m = catMeta(ev.category), du = daysUntil(ev.start_date)
              const soon = du >= 0 && du <= 14
              return (
                <div key={ev.id} style={{ background: CARD, border: `1px solid ${soon ? m.color : LINE}`, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 22, lineHeight: 1 }}>{m.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>{ev.title}</span>
                      <span style={{ fontSize: 11.5, color: m.color, fontWeight: 700 }}>{eventDateLabel(ev)}</span>
                      {soon && <span style={{ fontSize: 10.5, fontWeight: 800, color: '#000', background: m.color, borderRadius: 999, padding: '1px 7px' }}>{du === 0 ? 'TODAY' : du === 1 ? 'TOMORROW' : `${du} days`}</span>}
                      {ev.location && <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>📍 {ev.location}</span>}
                    </div>
                    {ev.angle && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', marginTop: 3, lineHeight: 1.5 }}>{ev.angle}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => setForm({ id: ev.id, start_date: ev.start_date, end_date: ev.end_date || '', title: ev.title, category: ev.category, location: ev.location || '', angle: ev.angle || '' })} title="Edit" style={iconBtn}>✎</button>
                    <button onClick={() => remove(ev)} title="Delete" style={iconBtn}>×</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

const inp = { boxSizing: 'border-box', padding: '9px 11px', borderRadius: 8, border: `1px solid ${LINE}`, background: '#000', color: '#fff', fontSize: 14, outline: 'none', width: '100%' }
const lbl = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: 'rgba(255,255,255,0.55)', flex: '1 1 30%', minWidth: 120 }
const btn = { padding: '9px 15px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: '#fff', border: `1px solid ${LINE}`, whiteSpace: 'nowrap' }
const iconBtn = { width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`, color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
