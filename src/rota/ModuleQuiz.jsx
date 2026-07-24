import React, { useState } from 'react'
import { getQuiz, quizCount, PASS_MARK } from './quizzes.js'

const RED = '#DA1B33', GREEN = '#34D399', AMBER = '#F59E0B', CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'

// "Test yourself" — a self-marking MCQ quiz for a training module. On a pass it calls
// onPass() so the caller can mark the module complete. Read-only study aid, not the
// official exam — but it gets staff exam-ready.
export default function ModuleQuiz({ moduleKey, onPass }) {
  const questions = getQuiz(moduleKey)
  const [open, setOpen] = useState(false)
  const [answers, setAnswers] = useState({})   // qIndex -> optionIndex
  const [submitted, setSubmitted] = useState(false)
  if (!questions.length) return null

  const total = questions.length
  const correct = questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0)
  const pct = Math.round((correct / total) * 100)
  const passed = correct / total >= PASS_MARK
  const allAnswered = questions.every((_, i) => answers[i] != null)

  const submit = () => {
    if (!allAnswered) { alert('Answer every question first.'); return }
    setSubmitted(true)
    if (correct / total >= PASS_MARK) onPass?.()
  }
  const reset = () => { setAnswers({}); setSubmitted(false) }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ ...bigBtn, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.5)', color: '#93C5FD' }}>
        📝 Test yourself — {quizCount(moduleKey)} questions
      </button>
    )
  }

  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>📝 Test yourself</div>
        <button onClick={() => { setOpen(false); reset() }} style={ghost}>Close</button>
      </div>

      {submitted && (
        <div style={{ background: passed ? 'rgba(52,211,153,0.1)' : 'rgba(218,27,51,0.1)', border: `1px solid ${passed ? GREEN : RED}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: passed ? GREEN : RED }}>{passed ? '✓ Passed' : 'Not yet'} — {correct}/{total} ({pct}%)</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>{passed ? 'Nice — you’re exam-ready on this one. It’s been marked complete.' : `You need ${Math.ceil(PASS_MARK * total)}/${total} to pass. Review the red answers below and try again.`}</div>
        </div>
      )}

      {questions.map((q, i) => {
        const picked = answers[i]
        return (
          <div key={i} style={{ borderTop: i === 0 ? 'none' : `1px solid rgba(255,255,255,0.08)`, paddingTop: i === 0 ? 0 : 12 }}>
            <div style={{ fontSize: 13.5, color: '#fff', fontWeight: 600, marginBottom: 8 }}>{i + 1}. {q.q}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {q.options.map((opt, oi) => {
                const isPicked = picked === oi
                const isCorrect = q.answer === oi
                let bg = 'rgba(255,255,255,0.04)', bd = LINE, col = '#fff'
                if (submitted) {
                  if (isCorrect) { bg = 'rgba(52,211,153,0.14)'; bd = GREEN; col = '#fff' }
                  else if (isPicked) { bg = 'rgba(218,27,51,0.14)'; bd = RED; col = '#fff' }
                } else if (isPicked) { bg = 'rgba(96,165,250,0.14)'; bd = '#60A5FA' }
                return (
                  <button key={oi} disabled={submitted} onClick={() => setAnswers(a => ({ ...a, [i]: oi }))}
                    style={{ textAlign: 'left', padding: '9px 11px', borderRadius: 8, border: `1px solid ${bd}`, background: bg, color: col, fontSize: 12.5, cursor: submitted ? 'default' : 'pointer', display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 700, opacity: 0.6 }}>{'ABCD'[oi]}</span>
                    <span style={{ flex: 1 }}>{opt}</span>
                    {submitted && isCorrect && <span style={{ color: GREEN, fontWeight: 800 }}>✓</span>}
                    {submitted && isPicked && !isCorrect && <span style={{ color: RED, fontWeight: 800 }}>✗</span>}
                  </button>
                )
              })}
            </div>
            {submitted && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 6, lineHeight: 1.5 }}>{q.why}</div>}
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: 8 }}>
        {!submitted
          ? <button onClick={submit} disabled={!allAnswered} style={{ ...bigBtn, background: allAnswered ? RED : 'rgba(255,255,255,0.06)', color: '#fff', opacity: allAnswered ? 1 : 0.6 }}>Mark my answers</button>
          : <button onClick={reset} style={{ ...bigBtn, background: 'rgba(255,255,255,0.06)', color: '#fff', border: `1px solid ${LINE}` }}>↻ Try again</button>}
      </div>
    </div>
  )
}

const bigBtn = { padding: '12px', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, border: '1px solid transparent', width: '100%' }
const ghost = { padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: '#fff', border: `1px solid ${LINE}` }
