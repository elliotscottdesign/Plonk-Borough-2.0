import React, { useState } from 'react'
import Cover from './slides/Cover.jsx'
import InvestmentSummary from './slides/InvestmentSummary.jsx'
import UseOfFunds from './slides/UseOfFunds.jsx'
import Financials from './slides/Financials.jsx'
import WaterfallReturns from './slides/WaterfallReturns.jsx'
import MarketingEngine from './slides/MarketingEngine.jsx'
import WageCalculator from './slides/WageCalculator.jsx'
import Governance from './slides/Governance.jsx'
import InvestmentCase from './slides/InvestmentCase.jsx'

const SLIDES = [
  { id: 'cover',      label: '01  Cover',              Component: Cover },
  { id: 'summary',    label: '02  Investment Summary',  Component: InvestmentSummary },
  { id: 'funds',      label: '03  Use of Funds',        Component: UseOfFunds },
  { id: 'financials', label: '04  Financials',          Component: Financials },
  { id: 'waterfall',  label: '05  Investor Returns',    Component: WaterfallReturns },
  { id: 'marketing',  label: '06  Marketing',           Component: MarketingEngine },
  { id: 'wages',      label: '07  Wage Calculator',     Component: WageCalculator },
  { id: 'governance', label: '08  Governance',          Component: Governance },
  { id: 'case',       label: '09  Investment Case',     Component: InvestmentCase },
]

export default function App() {
  const [current, setCurrent] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const { Component } = SLIDES[current]

  const go = (i) => { setCurrent(i); setMenuOpen(false) }
  const prev = () => current > 0 && setCurrent(c => c - 1)
  const next = () => current < SLIDES.length - 1 && setCurrent(c => c + 1)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--ink)' }}>

      {/* SIDEBAR — desktop */}
      <nav style={{
        width: 220, flexShrink: 0, background: 'var(--ink-2)',
        borderRight: '1px solid rgba(201,168,76,0.12)',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
          <div className="serif" style={{ fontSize: 18, color: 'var(--gold)', lineHeight: 1.2 }}>
            No Dice<br/>Borough
          </div>
          <div style={{ fontSize: 10, color: 'var(--cream-dim)', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Investor Presentation
          </div>
          <div style={{ fontSize: 9, color: 'var(--gold-dim)', marginTop: 4 }}>
            Confidential · Apr 2026
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => go(i)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 20px', fontSize: 11, letterSpacing: '0.03em',
                background: current === i ? 'rgba(201,168,76,0.08)' : 'transparent',
                borderLeft: current === i ? '2px solid var(--gold)' : '2px solid transparent',
                color: current === i ? 'var(--gold)' : 'var(--cream-dim)',
                cursor: 'pointer', border: 'none', borderLeft: current === i ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Progress */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(201,168,76,0.12)' }}>
          <div style={{ fontSize: 10, color: 'var(--cream-dim)', marginBottom: 6 }}>
            {current + 1} of {SLIDES.length}
          </div>
          <div style={{ height: 2, background: 'var(--ink-3)', borderRadius: 1 }}>
            <div style={{
              height: '100%', borderRadius: 1, background: 'var(--gold)',
              width: `${((current + 1) / SLIDES.length) * 100}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(201,168,76,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', height: 52,
        }}>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {SLIDES[current].label}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={prev} disabled={current === 0} style={navBtnStyle(current === 0)}>←</button>
            <button onClick={next} disabled={current === SLIDES.length-1} style={navBtnStyle(current === SLIDES.length-1)}>→</button>
          </div>
        </div>

        {/* Slide */}
        <div key={current} className="slide-enter" style={{ minHeight: 'calc(100vh - 52px)', padding: '40px 40px 80px' }}>
          <Component />
        </div>
      </main>
    </div>
  )
}

const navBtnStyle = (disabled) => ({
  width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(201,168,76,0.3)',
  background: 'transparent', color: disabled ? 'var(--ink-3)' : 'var(--gold)',
  cursor: disabled ? 'default' : 'pointer', fontSize: 14, display: 'flex',
  alignItems: 'center', justifyContent: 'center',
})
