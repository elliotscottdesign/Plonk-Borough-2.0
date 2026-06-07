import React, { useState, useEffect } from 'react'

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
const GOLD = '#C9A84C', INK = '#0E1116', CREAM = '#EFE7D2'

function blockHtml(b) {
  switch (b.type) {
    case 'heading': return `<tr><td style="padding:8px 24px;font-family:Georgia,serif;font-size:26px;color:${INK};font-weight:bold;">${esc(b.text)}</td></tr>`
    case 'text':    return `<tr><td style="padding:8px 24px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#333;">${esc(b.text).replace(/\n/g, '<br>')}</td></tr>`
    case 'button':  return `<tr><td style="padding:14px 24px;"><a href="${esc(b.url)}" style="background:${GOLD};color:${INK};text-decoration:none;padding:12px 26px;border-radius:8px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;display:inline-block;">${esc(b.text)}</a></td></tr>`
    case 'image':   return b.url ? `<tr><td style="padding:8px 24px;"><img src="${esc(b.url)}" alt="${esc(b.alt)}" style="width:100%;max-width:552px;border-radius:8px;display:block;"></td></tr>` : ''
    case 'divider': return `<tr><td style="padding:8px 24px;"><hr style="border:none;border-top:1px solid #E5E0D0;"></td></tr>`
    case 'spacer':  return `<tr><td style="height:24px;"></td></tr>`
    default: return ''
  }
}
const esc = (s = '') => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
function fullHtml(blocks) {
  return `<!doctype html><html><body style="margin:0;background:#f4f1ea;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:${INK};padding:18px 24px;font-family:Georgia,serif;font-size:20px;color:${GOLD};">No Dice · Hackney</td></tr>
${blocks.map(blockHtml).join('\n')}
<tr><td style="padding:18px 24px;font-family:Arial,sans-serif;font-size:11px;color:#999;border-top:1px solid #eee;">No Dice, 407 Mentmore Terrace, London E8 3PH · <a href="{{unsubscribe}}" style="color:#999;">Unsubscribe</a></td></tr>
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

  const inp = { width: '100%', padding: '6px 8px', fontSize: 13, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.25)', color: 'var(--cream)', outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div className="serif" style={{ fontSize: 24, color: 'var(--cream)' }}>✉️ Newsletter</div>
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', marginTop: 4, maxWidth: 760, lineHeight: 1.6 }}>
          Build the email from blocks, preview it live, then export the HTML. Your own builder — no Mailchimp subscription to draft. Drafts save on this device.
        </div>
      </div>

      {/* Builder + preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 420px) 1fr', gap: 18, alignItems: 'start' }}>
        {/* Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(BLOCKS).map(([k, v]) => (
              <button key={k} onClick={() => add(k)} style={{ padding: '6px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 12, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--gold)' }}>+ {v.label}</button>
            ))}
          </div>
          {blocks.map((b, i) => (
            <div key={i} style={{ background: 'var(--ink-2)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 8, padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)' }}>{b.type}</span>
                <span style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => move(i, -1)} style={miniBtn}>↑</button>
                  <button onClick={() => move(i, 1)} style={miniBtn}>↓</button>
                  <button onClick={() => del(i)} style={{ ...miniBtn, color: '#F87171' }}>✕</button>
                </span>
              </div>
              {(b.type === 'heading' || b.type === 'text') && <textarea value={b.text} onChange={e => upd(i, { text: e.target.value })} rows={b.type === 'text' ? 3 : 1} style={inp} />}
              {b.type === 'button' && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><input value={b.text} onChange={e => upd(i, { text: e.target.value })} placeholder="Button text" style={inp} /><input value={b.url} onChange={e => upd(i, { url: e.target.value })} placeholder="https://…" style={inp} /></div>}
              {b.type === 'image' && <input value={b.url} onChange={e => upd(i, { url: e.target.value })} placeholder="Image URL" style={inp} />}
              {(b.type === 'divider' || b.type === 'spacer') && <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>{b.type === 'divider' ? 'Horizontal line' : 'Vertical space'}</div>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copy} style={{ padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: copied ? '#34D399' : 'var(--gold)', color: 'var(--ink)', border: 'none' }}>{copied ? '✓ Copied' : 'Copy HTML'}</button>
            <button onClick={download} style={{ padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: 'rgba(255,255,255,0.05)', color: 'var(--cream)', border: '1px solid rgba(201,168,76,0.4)' }}>Download .html</button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ background: '#f4f1ea', borderRadius: 12, padding: 16, position: 'sticky', top: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>Live preview</div>
          <iframe title="preview" srcDoc={fullHtml(blocks)} style={{ width: '100%', height: 560, border: 'none', borderRadius: 8, background: '#fff' }} />
        </div>
      </div>

      {/* Subscribers & sending — next phase */}
      <div style={{ background: 'rgba(103,232,249,0.06)', border: '1px solid rgba(103,232,249,0.3)', borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#67E8F9', marginBottom: 8 }}>Subscribers &amp; sending — next phase</div>
        <div style={{ fontSize: 13, color: '#A5F3FC', lineHeight: 1.65 }}>
          Building the email is free and done. To <strong>own the list and send</strong> (and bin Mailchimp) we add two pieces:
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            <li><strong>The list (your database):</strong> sign-ups POST to a store you own — a Google Sheet (free, fits this site's setup) or Supabase (more robust; you already run it for Plonk Golf). Captures email + consent + source.</li>
            <li><strong>The sender:</strong> a low-cost email API — <strong>Resend</strong> or Amazon SES — pennies per thousand vs Mailchimp's monthly fee. The HTML above is what it sends.</li>
          </ul>
          Tell me which list store and sender you want and I'll wire signup capture, a subscriber view here, and one-click send.
        </div>
      </div>
    </div>
  )
}
const miniBtn = { width: 22, height: 22, borderRadius: 5, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'var(--cream-dim)', cursor: 'pointer', fontSize: 11, lineHeight: 1 }
