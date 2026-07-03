import React, { useState, useEffect } from 'react'
import { moduleByKey } from './training.js'
import { rotaGetTrainingDoc, rotaSaveTrainingDoc, rotaResetTrainingDoc } from './api.js'
import { resizeImage } from '../dj/api.js'

// ─── Training document editor (founder) ──────────────────────────────────────
// Edit a module's intro / sections / key points in text boxes + attach reference
// images. Saves an override (DB) over the built-in seed — live to staff instantly.

const RED = '#DA1B33', GOLD = '#DA1B33', CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'

export default function TrainingEditor({ moduleKey, onClose }) {
  const seed = moduleByKey(moduleKey)
  const [intro, setIntro] = useState('')
  const [sections, setSections] = useState([])
  const [keyText, setKeyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [edited, setEdited] = useState(false)

  useEffect(() => {
    let alive = true
    rotaGetTrainingDoc(moduleKey).then(r => {
      if (!alive) return
      const c = r.content || seed || {}
      setEdited(!!r.content)
      setIntro(c.intro || '')
      setSections((c.sections || []).map(s => ({ heading: s.heading || '', body: s.body || '', image: s.image || '' })))
      setKeyText((c.keyPoints || []).join('\n'))
    }).catch(() => {}).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey])

  const upSec = (i, k, v) => setSections(s => s.map((x, j) => j === i ? { ...x, [k]: v } : x))
  const addSec = () => setSections(s => [...s, { heading: '', body: '', image: '' }])
  const rmSec = (i) => setSections(s => s.filter((_, j) => j !== i))
  const onImg = async (i, e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    setBusy(true)
    try { const url = await resizeImage(f); upSec(i, 'image', url) } catch (er) { alert(er.message || 'Image upload failed') } finally { setBusy(false) }
  }
  const save = async () => {
    setBusy(true)
    try {
      const content = {
        intro: intro.trim(),
        sections: sections.filter(s => s.heading.trim() || s.body.trim() || s.image)
          .map(s => ({ heading: s.heading.trim(), body: s.body, ...(s.image ? { image: s.image } : {}) })),
        keyPoints: keyText.split('\n').map(x => x.trim()).filter(Boolean),
      }
      await rotaSaveTrainingDoc(moduleKey, content)
      onClose?.()
    } catch (e) { alert(e.message) } finally { setBusy(false) }
  }
  const reset = async () => {
    if (!window.confirm('Reset this document back to the original No Dice version? Your edits will be removed.')) return
    setBusy(true)
    try { await rotaResetTrainingDoc(moduleKey); onClose?.() } catch (e) { alert(e.message) } finally { setBusy(false) }
  }

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.5)', padding: '20px 0', textAlign: 'center' }}>Loading…</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
        Editing <strong style={{ color: '#fff' }}>{seed?.icon} {seed?.title}</strong>. Changes go live to staff the moment you save.{edited && ' You’ve edited this before.'}
      </div>

      <L label="Intro"><textarea value={intro} onChange={e => setIntro(e.target.value)} rows={2} style={ta} /></L>

      <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Sections</div>
      {sections.map((s, i) => (
        <div key={i} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={s.heading} onChange={e => upSec(i, 'heading', e.target.value)} placeholder="Section heading" style={{ ...inp, flex: 1 }} />
            <button onClick={() => rmSec(i)} style={btn('ghost')}>Remove</button>
          </div>
          <textarea value={s.body} onChange={e => upSec(i, 'body', e.target.value)} rows={4} placeholder="Body — start a line with • for a bullet" style={ta} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {s.image && <img src={s.image} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: `1px solid ${LINE}` }} />}
            <label style={{ fontSize: 12, color: RED, cursor: 'pointer', borderBottom: `1px solid ${RED}` }}>{s.image ? 'Change image' : '+ Add reference image'}<input type="file" accept="image/*" onChange={e => onImg(i, e)} style={{ display: 'none' }} /></label>
            {s.image && <button onClick={() => upSec(i, 'image', '')} style={{ background: 'none', border: 'none', color: '#F87171', fontSize: 11, cursor: 'pointer', padding: 0 }}>Remove image</button>}
            {busy && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>working…</span>}
          </div>
        </div>
      ))}
      <button onClick={addSec} style={{ ...btn('ghost'), alignSelf: 'flex-start' }}>+ Add section</button>

      <L label="Must-remember key points (one per line)"><textarea value={keyText} onChange={e => setKeyText(e.target.value)} rows={4} style={ta} /></L>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={reset} disabled={busy} style={btn('red')}>↺ Reset to original</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onClose?.()} style={btn('ghost')}>Cancel</button>
          <button onClick={save} disabled={busy} style={btn('gold')}>{busy ? 'Saving…' : 'Save — go live'}</button>
        </div>
      </div>
    </div>
  )
}

const L = ({ label, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    {children}
  </label>
)
const inp = { padding: '9px 11px', fontSize: 13.5, borderRadius: 8, background: '#000', border: `1px solid ${LINE}`, color: '#fff', outline: 'none', boxSizing: 'border-box', width: '100%' }
const ta = { ...inp, resize: 'vertical', lineHeight: 1.5 }
const btn = (kind) => {
  const base = { padding: '8px 13px', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, border: '1px solid transparent', whiteSpace: 'nowrap' }
  if (kind === 'gold') return { ...base, background: GOLD, color: '#fff' }
  if (kind === 'red') return { ...base, background: 'transparent', color: '#F87171', border: '1px solid rgba(248,113,113,0.4)' }
  return { ...base, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }
}
