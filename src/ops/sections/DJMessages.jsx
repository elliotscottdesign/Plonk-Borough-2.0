import React, { useState, useEffect } from 'react'
import { djAdmin, inviteLink, fillTemplate, tplBody, TEMPLATE_KEYS, DEFAULT_TEMPLATES } from '../../dj/api.js'
import { Avatar, igHref } from './DJRoster.jsx'

// ─── Messages — the DJ comms hub (admin) ─────────────────────────────────────
// Three jobs: SEND (group/individual WhatsApp blasts, one tap each, name+link
// auto-filled), TEMPLATES (edit the copy that goes out — the invite + the
// monthly-release messages), and INBOX (notes DJs leave from their portal).
// WhatsApp has no API here: sends open wa.me on the founder's phone, and DJs'
// actual replies can't flow back — the inbox is in-app notes only.

const RED = '#DA1B33', GREEN = '#34D399'
const btn = (kind) => {
  const base = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: RED, color: '#fff' }
  if (kind === 'green') return { ...base, background: GREEN, color: '#06281C' }
  if (kind === 'red') return { ...base, background: 'transparent', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }
}
const inp = (w) => ({ width: w, minWidth: 0, padding: '8px 10px', fontSize: 13, borderRadius: 7, background: '#000', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', outline: 'none', boxSizing: 'border-box' })
const ta = { ...inp('100%'), fontSize: 13, lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit' }
const card = { background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 16 }
const lbl = { fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }

// WhatsApp international form (digits only): 07… → 447…, respects +/00.
const waNumber = (phone) => {
  let n = String(phone || '').replace(/[^\d+]/g, '')
  if (!n) return ''
  if (n.startsWith('+')) n = n.slice(1)
  else if (n.startsWith('00')) n = n.slice(2)
  else if (n.startsWith('0')) n = '44' + n.slice(1)
  return n
}
const waOpen = (phone, msg) => {
  const num = waNumber(phone)
  if (!num) return false
  window.open(`https://wa.me/${num}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`, '_blank', 'noopener,noreferrer')
  return true
}
const fmtWhen = (iso) => { try { return new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return '' } }

export default function Messages({ data, reload }) {
  const [tab, setTab] = useState('send')
  const djs = data.djs || []
  const templates = data.templates || []
  const notes = data.notes || []
  const unread = notes.filter(n => !n.read_at).length
  const nextMonthLabel = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="serif" style={{ fontSize: 22, color: '#fff' }}>💬 Messages</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, lineHeight: 1.5 }}>
          Sends open WhatsApp on <em>your</em> phone (one tap each, name &amp; link auto-filled). DJs' replies don't land here — their in-app notes do, under <strong style={{ color: '#fff' }}>Inbox</strong>.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['send', '📣 Send'], ['templates', '✏️ Templates'], ['inbox', `📥 Inbox${unread ? ` (${unread})` : ''}`]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '8px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer',
            background: tab === k ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${tab === k ? RED : 'rgba(255,255,255,0.1)'}`,
            color: tab === k ? RED : '#fff', fontWeight: tab === k ? 600 : 400,
          }}>{label}{k === 'inbox' && unread > 0 && <span style={{ marginLeft: 6, display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: RED, verticalAlign: 'middle' }} />}</button>
        ))}
      </div>

      {tab === 'send' && <SendTab djs={djs} templates={templates} reload={reload} nextMonthLabel={nextMonthLabel} />}
      {tab === 'templates' && <TemplatesTab templates={templates} djs={djs} reload={reload} nextMonthLabel={nextMonthLabel} />}
      {tab === 'inbox' && <InboxTab notes={notes} reload={reload} />}
    </div>
  )
}

// ── SEND ─────────────────────────────────────────────────────────────────────
function SendTab({ djs, templates, reload, nextMonthLabel }) {
  const [sendKey, setSendKey] = useState('invite')
  const [draft, setDraft] = useState(tplBody(templates, 'invite'))
  const [audience, setAudience] = useState('vetted')
  const [q, setQ] = useState('')
  const [monthVal, setMonthVal] = useState(nextMonthLabel)
  const [sent, setSent] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(null)

  // Load the chosen template's copy into the editable draft (blank for freeform).
  useEffect(() => { setDraft(sendKey === 'free' ? '' : tplBody(templates, sendKey)); setSent(new Set()) }, [sendKey, templates])

  const statusOf = (d) => d.status || 'vetted'
  const pool = djs.filter(d => audience === 'resident' ? d.resident : audience === 'pending' ? statusOf(d) === 'pending' : statusOf(d) === 'vetted')
  const recipients = pool.filter(d => `${d.dj_name} ${d.real_name || ''} ${d.instagram || ''}`.toLowerCase().includes(q.toLowerCase()))
  const fillFor = (d) => fillTemplate(draft, { name: d.dj_name || 'there', link: inviteLink(d.token), month: monthVal })
  const sample = recipients[0] || djs[0]
  const savedBody = sendKey === 'free' ? '' : tplBody(templates, sendKey)
  const dirty = sendKey !== 'free' && draft !== savedBody
  const usesMonth = /\{month\}/.test(draft)

  const send = (d) => { if (waOpen(d.phone, fillFor(d))) setSent(s => new Set(s).add(d.id)) }
  const copyLink = (d) => { try { navigator.clipboard.writeText(inviteLink(d.token)) } catch { /* ignore */ } setCopied(d.id); setTimeout(() => setCopied(null), 1500) }
  const saveDefault = async () => { setBusy(true); try { await djAdmin('saveTemplate', { key: sendKey, body: draft }); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }

  const withPhone = recipients.filter(d => d.phone).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={card}>
        <div style={{ ...lbl, marginBottom: 6 }}>Message</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[...TEMPLATE_KEYS.map(t => [t.key, t.label]), ['free', '✎ Freeform']].map(([k, label]) => (
            <button key={k} onClick={() => setSendKey(k)} style={{ padding: '5px 11px', fontSize: 12, borderRadius: 999, cursor: 'pointer', background: sendKey === k ? RED : 'transparent', color: sendKey === k ? '#fff' : 'rgba(255,255,255,0.8)', border: `1px solid ${sendKey === k ? RED : 'rgba(255,255,255,0.18)'}` }}>{label}</button>
          ))}
        </div>
        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={sendKey === 'invite' ? 10 : 6} style={ta} placeholder={sendKey === 'free' ? 'Write a one-off message — {name} and {link} get filled in per DJ.' : ''} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Auto-filled: <code style={cd}>{'{name}'}</code> <code style={cd}>{'{link}'}</code> <code style={cd}>{'{month}'}</code></span>
          {usesMonth && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={lbl}>month</span><input value={monthVal} onChange={e => setMonthVal(e.target.value)} style={inp(150)} /></span>}
          <div style={{ flex: 1 }} />
          {dirty && <button onClick={saveDefault} disabled={busy} style={btn('gold')}>{busy ? 'Saving…' : '💾 Save as default'}</button>}
        </div>
        {dirty && <div style={{ fontSize: 11, color: '#FCD34D', marginTop: 6 }}>You've edited this template — send as-is for a one-off, or “Save as default” to keep the change for next time.</div>}
      </div>

      {sample && (
        <div style={{ ...card, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ ...lbl, marginBottom: 6 }}>Preview · as {sample.dj_name}</div>
          <div style={{ fontSize: 13, color: '#eee', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{fillFor(sample)}</div>
        </div>
      )}

      <div style={card}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          {[['vetted', 'Vetted'], ['resident', '★ Residents'], ['pending', 'Pending']].map(([k, label]) => (
            <button key={k} onClick={() => setAudience(k)} style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, cursor: 'pointer', background: audience === k ? 'rgba(255,255,255,0.10)' : 'transparent', color: audience === k ? RED : 'rgba(255,255,255,0.85)', border: `1px solid ${audience === k ? RED : 'rgba(255,255,255,0.15)'}`, fontWeight: audience === k ? 600 : 400 }}>{label}</button>
          ))}
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={inp(150)} />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{withPhone}/{recipients.length} have a number · {sent.size} opened</span>
        </div>
        {recipients.length === 0 ? (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', padding: '12px 0' }}>No DJs in this group.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recipients.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Avatar d={d} size={30} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.dj_name}{d.resident && <span style={{ color: RED, marginLeft: 6 }}>★</span>}</div>
                {d.phone
                  ? <button onClick={() => send(d)} style={btn(sent.has(d.id) ? 'green' : 'gold')}>{sent.has(d.id) ? '✓ Opened' : '📲 Send'}</button>
                  : <button onClick={() => copyLink(d)} style={btn(copied === d.id ? 'green' : 'ghost')}>{copied === d.id ? '✓ Link' : '🔗 No number — copy link'}</button>}
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 10, lineHeight: 1.5 }}>Each <strong style={{ color: '#fff' }}>Send</strong> opens WhatsApp with that DJ's message ready — you just hit send. “Opened” marks the ones you've fired so you don't lose your place.</div>
      </div>
    </div>
  )
}
const cd = { background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }

// ── TEMPLATES ────────────────────────────────────────────────────────────────
function TemplatesTab({ templates, djs, reload, nextMonthLabel }) {
  const [edits, setEdits] = useState({})   // key → in-progress body
  const [busy, setBusy] = useState(null)
  const sample = djs.find(d => d.token) || {}
  const bodyOf = (key) => edits[key] !== undefined ? edits[key] : tplBody(templates, key)
  const dirty = (key) => edits[key] !== undefined && edits[key] !== tplBody(templates, key)
  const save = async (key) => { setBusy(key); try { await djAdmin('saveTemplate', { key, body: bodyOf(key) }); setEdits(e => { const n = { ...e }; delete n[key]; return n }); await reload() } catch (e) { alert(e.message) } finally { setBusy(null) } }
  const preview = (key) => fillTemplate(bodyOf(key), { name: sample.dj_name || 'Aaliah', link: sample.token ? inviteLink(sample.token) : 'https://team.nodice.bar/dj?t=…', month: nextMonthLabel })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>Edit the copy that goes out. Changes save to the database and are used everywhere that message sends (here <em>and</em> the Roster's invite / resident-release buttons).</div>
      {TEMPLATE_KEYS.map(t => (
        <div key={t.key} style={card}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{t.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{t.vars.map(v => <code key={v} style={{ ...cd, marginLeft: 4 }}>{`{${v}}`}</code>)}</div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{t.hint}</div>
          <textarea value={bodyOf(t.key)} onChange={e => setEdits(s => ({ ...s, [t.key]: e.target.value }))} rows={t.key === 'invite' ? 10 : 6} style={ta} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setEdits(s => ({ ...s, [t.key]: DEFAULT_TEMPLATES[t.key] }))} style={btn('ghost')}>↺ Restore original</button>
            <div style={{ flex: 1 }} />
            {dirty(t.key) && <span style={{ fontSize: 11, color: '#FCD34D' }}>Unsaved</span>}
            <button onClick={() => save(t.key)} disabled={!dirty(t.key) || busy === t.key} style={{ ...btn('gold'), opacity: (!dirty(t.key) || busy === t.key) ? 0.5 : 1 }}>{busy === t.key ? 'Saving…' : 'Save'}</button>
          </div>
          <details style={{ marginTop: 10 }}>
            <summary style={{ fontSize: 11, color: RED, cursor: 'pointer' }}>Preview</summary>
            <div style={{ fontSize: 12.5, color: '#ddd', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginTop: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>{preview(t.key)}</div>
          </details>
        </div>
      ))}
    </div>
  )
}

// ── INBOX ────────────────────────────────────────────────────────────────────
function InboxTab({ notes, reload }) {
  const [busy, setBusy] = useState(false)
  const unread = notes.filter(n => !n.read_at).length
  const act = async (action, payload) => { setBusy(true); try { await djAdmin(action, payload); await reload() } catch (e) { alert(e.message) } finally { setBusy(false) } }

  if (!notes.length) return (
    <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, padding: '28px 16px' }}>
      No messages yet. DJs can leave you a note from their portal (under <strong style={{ color: '#fff' }}>Message No Dice</strong>) — they'll show up here.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{notes.length} message{notes.length === 1 ? '' : 's'}{unread ? ` · ${unread} unread` : ''}</div>
        {unread > 0 && <button onClick={() => act('markAllNotesRead', {})} disabled={busy} style={btn('ghost')}>Mark all read</button>}
      </div>
      {notes.map(n => {
        const d = n.dj || {}
        const ig = igHref(d.instagram)
        return (
          <div key={n.id} style={{ ...card, borderLeft: `3px solid ${n.read_at ? 'rgba(255,255,255,0.12)' : RED}`, display: 'flex', gap: 12 }}>
            <Avatar d={d} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{d.dj_name || 'A DJ'}</span>
                {!n.read_at && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: RED, border: `1px solid ${RED}`, borderRadius: 999, padding: '1px 7px' }}>New</span>}
                {ig && <a href={ig} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: RED, textDecoration: 'none' }}>{(d.instagram || '').split(/[\s/]/)[0]}</a>}
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{fmtWhen(n.created_at)}</span>
              </div>
              <div style={{ fontSize: 13.5, color: '#eee', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginTop: 6 }}>{n.body}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                {!n.read_at && <button onClick={() => act('markNoteRead', { id: n.id })} disabled={busy} style={btn('green')}>✓ Mark read</button>}
                {d.phone && <button onClick={() => waOpen(d.phone, '')} style={btn('ghost')}>↩ Reply on WhatsApp</button>}
                <button onClick={() => { if (window.confirm('Delete this message?')) act('deleteNote', { id: n.id }) }} disabled={busy} style={btn('red')}>Delete</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
