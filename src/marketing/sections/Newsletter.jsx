import React, { useState, useEffect } from 'react'
import { BACKEND_READY, SEND_READY, sendNewsletter } from '../data/backend.js'
import SignupForm from './SignupForm.jsx'

// ─── Newsletter — simple block email builder (Mailchimp-style) ───────────
// Pure client-side: build an email from blocks, live-preview, export the HTML.
// No infrastructure needed to BUILD. Storing sign-ups and SENDING are the next
// phase (needs a list store + an email-sending service — see the panel below).

const BLOCKS = {
  heading: { label: 'Heading', make: () => ({ type: 'heading', text: 'Your headline' }) },
  text:    { label: 'Text',    make: () => ({ type: 'text', text: 'Write your message here…' }) },
  button:  { label: 'Button',  make: () => ({ type: 'button', text: 'Book now', url: 'https://nodice.bar' }) },
  image:   { label: 'Image',   make: () => ({ type: 'image', url: '', alt: 'image' }) },
  divider: { label: 'Divider', make: () => ({ type: 'divider' }) },
  spacer:  { label: 'Spacer',  make: () => ({ type: 'spacer' }) },
}
const KEY = 'ndb_newsletter_draft_v1'
// Email palette — pulled from the public nodice.bar site (red on black, white
// text, the wordmark), NOT the gold/cream investor deck.
const RED = '#DA1B33', BLACK = '#000000', CARD = '#0A0A0A', BODY = 'rgba(255,255,255,0.84)'

function blockHtml(b) {
  switch (b.type) {
    case 'heading': return `<tr><td style="padding:12px 28px 4px;font-family:Georgia,'Times New Roman',serif;font-size:27px;line-height:1.2;color:#FFFFFF;font-weight:bold;">${esc(b.text)}</td></tr>`
    case 'text':    return `<tr><td style="padding:8px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${BODY};">${esc(b.text).replace(/\n/g, '<br>')}</td></tr>`
    case 'button':  return `<tr><td style="padding:16px 28px;"><a href="${esc(b.url)}" style="background:${RED};color:#FFFFFF;text-decoration:none;padding:14px 30px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;display:inline-block;">${esc(b.text)}</a></td></tr>`
    case 'image':   return b.url ? `<tr><td style="padding:8px 28px;"><img src="${esc(b.url)}" alt="${esc(b.alt)}" style="width:100%;max-width:544px;border-radius:8px;display:block;"></td></tr>` : ''
    case 'divider': return `<tr><td style="padding:10px 28px;"><hr style="border:none;border-top:1px solid rgba(255,255,255,0.12);"></td></tr>`
    case 'spacer':  return `<tr><td style="height:24px;"></td></tr>`
    default: return ''
  }
}
const esc = (s = '') => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
function fullHtml(blocks) {
  return `<!doctype html><html><body style="margin:0;background:${BLACK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BLACK};padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:94%;background:${CARD};border:1px solid rgba(218,27,51,0.40);border-radius:14px;overflow:hidden;">
<tr><td style="background:${BLACK};padding:28px 24px 20px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
<img src="https://nodice.bar/nodice-wordmark.png" alt="No Dice" width="160" style="display:inline-block;width:160px;max-width:62%;height:auto;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.30em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-top:10px;">London Fields · Hackney</div>
</td></tr>
${blocks.map(blockHtml).join('\n')}
<tr><td style="padding:22px 28px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:rgba(255,255,255,0.45);border-top:1px solid rgba(255,255,255,0.07);">No Dice Hackney Ltd · 407 Mentmore Terrace, London Fields, E8 3PH<br><a href="{{unsubscribe}}" style="color:rgba(255,255,255,0.6);text-decoration:underline;">Unsubscribe</a></td></tr>
</table></td></tr></table></body></html>`
}

export default function Newsletter() {
  const [blocks, setBlocks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || [BLOCKS.heading.make(), BLOCKS.text.make(), BLOCKS.button.make()] }
    catch { return [BLOCKS.heading.make(), BLOCKS.text.make()] }
  })
  const [copied, setCopied] = useState(false)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(blocks)) } catch { /* ignore */ } }, [blocks])

  const add = (t) => setBlocks(b => [...b, BLOCKS[t].make()])
  const upd = (i, patch) => setBlocks(b => b.map((x, j) => j === i ? { ...x, ...patch } : x))
  const del = (i) => setBlocks(b => b.filter((_, j) => j !== i))
  const move = (i, d) => setBlocks(b => { const n = [...b]; const j = i + d; if (j < 0 || j >= n.length) return b;[n[i], n[j]] = [n[j], n[i]]; return n })
  const copy = () => { navigator.clipboard?.writeText(fullHtml(blocks)).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  const download = () => {
    const blob = new Blob([fullHtml(blocks)], { type: 'text/html' }); const u = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = u; a.download = 'nodice-newsletter.html'; a.click(); URL.revokeObjectURL(u)
  }

  const inp = { width: '100%', padding: '6px 8px', fontSize: 13, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.18)', color: '#FFFFFF', outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div className="serif" style={{ fontSize: 24, color: '#FFFFFF' }}>✉️ Newsletter</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, maxWidth: 760, lineHeight: 1.6 }}>
          Build the email from blocks, preview it live, then export the HTML. Your own builder — no Mailchimp subscription to draft. Drafts save on this device.
        </div>
      </div>

      {/* Builder + preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 420px) 1fr', gap: 18, alignItems: 'start' }}>
        {/* Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(BLOCKS).map(([k, v]) => (
              <button key={k} onClick={() => add(k)} style={{ padding: '6px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 12, background: 'rgba(218,27,51,0.12)', border: '1px solid rgba(218,27,51,0.4)', color: '#DA1B33' }}>+ {v.label}</button>
            ))}
          </div>
          {blocks.map((b, i) => (
            <div key={i} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#DA1B33' }}>{b.type}</span>
                <span style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => move(i, -1)} style={miniBtn}>↑</button>
                  <button onClick={() => move(i, 1)} style={miniBtn}>↓</button>
                  <button onClick={() => del(i)} style={{ ...miniBtn, color: '#F87171' }}>✕</button>
                </span>
              </div>
              {(b.type === 'heading' || b.type === 'text') && <textarea value={b.text} onChange={e => upd(i, { text: e.target.value })} rows={b.type === 'text' ? 3 : 1} style={inp} />}
              {b.type === 'button' && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><input value={b.text} onChange={e => upd(i, { text: e.target.value })} placeholder="Button text" style={inp} /><input value={b.url} onChange={e => upd(i, { url: e.target.value })} placeholder="https://…" style={inp} /></div>}
              {b.type === 'image' && <input value={b.url} onChange={e => upd(i, { url: e.target.value })} placeholder="Image URL" style={inp} />}
              {(b.type === 'divider' || b.type === 'spacer') && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{b.type === 'divider' ? 'Horizontal line' : 'Vertical space'}</div>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copy} style={{ padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: copied ? '#34D399' : '#DA1B33', color: '#FFFFFF', border: 'none' }}>{copied ? '✓ Copied' : 'Copy HTML'}</button>
            <button onClick={download} style={{ padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)' }}>Download .html</button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, position: 'sticky', top: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>Live preview</div>
          <iframe title="preview" srcDoc={fullHtml(blocks)} style={{ width: '100%', height: 560, border: 'none', borderRadius: 8, background: '#000' }} />
        </div>
      </div>

      {/* Subscribers & sending */}
      <Sending html={fullHtml(blocks)} />
    </div>
  )
}

function Sending({ html }) {
  const [subject, setSubject] = useState('')
  const [status, setStatus] = useState(null) // null | 'sending' | result | error
  const send = async () => {
    if (!subject.trim()) { setStatus('Add a subject line'); return }
    if (!window.confirm('Send this newsletter to your whole list?')) return
    setStatus('sending')
    try { const r = await sendNewsletter({ subject, html }); setStatus(`✓ Sent to ${r.sent} of ${r.total ?? r.sent} subscribers`) }
    catch (e) { setStatus(String(e.message || e)) }
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 14 }}>
      {/* Sign-up */}
      <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#DA1B33', marginBottom: 4 }}>Sign-up form</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>This is the form to drop on the site / in-bar tablet — it writes to your Supabase list.</div>
        <SignupForm source="marketing" />
      </div>
      {/* Send */}
      <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#34D399', marginBottom: 4 }}>Send to your list</div>
        {SEND_READY ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Sends the email above (Resend) to all consented subscribers.</div>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line" style={{ padding: '9px 12px', fontSize: 14, borderRadius: 8, background: '#000000', border: '1px solid rgba(218,27,51,0.4)', color: '#FFFFFF', outline: 'none' }} />
            <button onClick={send} disabled={status === 'sending'} style={{ padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, background: '#34D399', color: '#FFFFFF', border: 'none' }}>
              {status === 'sending' ? 'Sending…' : 'Send to list'}
            </button>
            {status && status !== 'sending' && <div style={{ fontSize: 12, color: status.startsWith('✓') ? '#34D399' : '#F87171' }}>{status}</div>}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#A7F3EB', lineHeight: 1.6 }}>
            Not connected yet. Backend = <strong>Supabase + Resend</strong> (your picks). Follow{' '}
            <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>src/marketing/NEWSLETTER_SETUP.md</code> (≈20 min) —
            run the SQL, deploy the send function, paste 4 values into <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>data/backend.js</code>.
            Then this button sends. {BACKEND_READY ? 'List store connected ✓' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
const miniBtn = { width: 22, height: 22, borderRadius: 5, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 11, lineHeight: 1 }
