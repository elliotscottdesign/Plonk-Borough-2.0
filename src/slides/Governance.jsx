import React, { useState } from 'react'
import { GOVERNANCE, DEAL } from '../data.js'

export default function Governance() {
  const [founderVotes, setFounderVotes] = useState(51)
  const investorVotes = 100 - founderVotes

  const canPassOrdinary = founderVotes > 50
  const canBlockReserved = investorVotes >= 25
  const canPassReserved = founderVotes + investorVotes >= 75 // unanimous = always yes

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cream)', marginBottom: 8 }}>
        Governance
      </h2>
      <p style={{ color: 'var(--cream-dim)', marginBottom: 36, fontSize: 15 }}>
        Option 4 · Simple majority ordinary · 75% supermajority reserved matters
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 36 }}>

        {/* Ordinary decisions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: 50, background: '#2DD4BF' }} />
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2DD4BF' }}>
              Ordinary Decisions · {'>'}50% majority
            </div>
          </div>
          <div className="card" style={{ padding: 18, marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.7 }}>
              Day-to-day operational matters — staffing decisions, marketing campaigns within approved budget,
              menu and pricing, supplier relationships, opening hours, events programming.
            </p>
          </div>
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 12,
            background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)',
            color: '#2DD4BF',
          }}>
            Founder 51% passes alone · Investor 49% cannot pass alone · Investor can influence but not block
          </div>
        </div>

        {/* Reserved matters */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: 50, background: 'var(--gold)' }} />
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              Reserved Matters · 75% supermajority
            </div>
          </div>
          <div className="card" style={{ padding: 18, marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {GOVERNANCE.reservedMatters.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--cream-dim)' }}>
                  <span style={{ color: 'var(--gold)', flexShrink: 0 }}>·</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 12,
            background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
            color: 'var(--gold)',
          }}>
            Investor 49% can block any reserved matter · Founder cannot act alone on any reserved matter
          </div>
        </div>
      </div>

      {/* Interactive voting simulator */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 }}>
          Voting Power Simulator
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: 'var(--cream-dim)' }}>Founder votes</span>
              <span style={{ color: 'var(--teal)', fontWeight: 500 }}>{founderVotes}%</span>
            </div>
            <input type="range" min={0} max={100} value={founderVotes}
              onChange={e => setFounderVotes(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--teal)', marginBottom: 12 }} />

            {/* Vote bar */}
            <div style={{ height: 12, borderRadius: 6, background: 'var(--ink-3)', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', display: 'flex' }}>
                <div style={{ width: `${founderVotes}%`, background: 'var(--teal)', transition: 'width 0.2s' }} />
                <div style={{ flex: 1, background: 'var(--gold)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--teal)' }}>Founder {founderVotes}%</span>
              <span style={{ color: 'var(--gold)' }}>Investor {investorVotes}%</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Founder passes ordinary alone', result: founderVotes > 50, needs: '>50%' },
              { label: 'Investor blocks reserved matters', result: investorVotes >= 25, needs: '≥25%' },
              { label: 'Investor passes ordinary alone', result: investorVotes > 50, needs: '>50%' },
              { label: 'Founder passes reserved alone', result: founderVotes >= 75, needs: '≥75%' },
            ].map(v => (
              <div key={v.label} style={{ display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 8,
                background: v.result ? 'rgba(45,212,191,0.06)' : 'rgba(229,57,53,0.06)',
                border: `1px solid ${v.result ? 'rgba(45,212,191,0.2)' : 'rgba(229,57,53,0.2)'}`,
              }}>
                <span style={{ fontSize: 16 }}>{v.result ? '✓' : '✗'}</span>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--cream-dim)' }}>{v.label}</span>
                <span style={{ fontSize: 10, color: v.result ? '#2DD4BF' : '#E53935' }}>{v.needs}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 8,
        background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)',
        fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--gold)' }}>A Shares: </strong>
        Investors with ≥5% equity (minimum £{DEAL.aShareThreshold.toLocaleString()} investment)
        hold A Shares with full voting rights. Smaller investments hold B Shares with economic rights only.
        All reserved matters require 75% supermajority regardless of share class.
      </div>
    </div>
  )
}
