import React from 'react'
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'
import {
  HACKNEY_FORECAST,
  HACKNEY_FORECAST_MONTHLY,
  HACKNEY_CASHFLOW,
  HACKNEY_CASH,
  HACKNEY_MARKETING,
  HACKNEY_RENT,
} from '../../data/hackney.js'

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')
const fmtK = (n) => '£' + Math.round(n/1000) + 'k'

export default function ThePlan() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>The Plan</div>
        <h2 className="serif" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05, color: 'var(--cream)', marginBottom: 14 }}>
          Year one — May 2026 to April 2027.
        </h2>
        <p style={{ fontSize: 17, color: 'var(--cream-dim)', maxWidth: 740, lineHeight: 1.6 }}>
          {fmt(HACKNEY_FORECAST.revenue)} forecast revenue, {fmt(HACKNEY_FORECAST.profit)} profit after director salary, {(HACKNEY_FORECAST.margin*100).toFixed(2)}% margin. Cash dips in Jan–Feb but stays well above the safety floor.
        </p>
      </div>

      <div className="gold-rule" style={{ marginBottom: 28 }} />

      {/* FORECAST CHART */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>Monthly forecast — revenue &amp; profit</div>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>Bars: revenue · Line: profit (after dir. salary)</div>
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <ComposedChart data={HACKNEY_FORECAST_MONTHLY} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={11} tickLine={false} axisLine={{ stroke:'rgba(201,168,76,0.15)' }} />
              <YAxis stroke="var(--cream-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtK} />
              <Tooltip
                cursor={{ fill: 'rgba(201,168,76,0.06)' }}
                contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
                formatter={(v) => fmt(v)}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
              <Bar dataKey="revenue" fill="var(--gold)" radius={[3,3,0,0]} />
              <Line type="monotone" dataKey="profit" stroke="var(--teal)" strokeWidth={2} dot={{ r:3, fill:'var(--teal)' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CASH FLOW CHART */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>Cash flow — closing balance by month</div>
          <div style={{ fontSize: 11, color: 'var(--cream-dim)' }}>
            Peak {fmt(HACKNEY_CASH.peak)} · Low {fmt(HACKNEY_CASH.low)} · Year-end {fmt(HACKNEY_CASH.yearEnd)}
          </div>
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer>
            <ComposedChart data={HACKNEY_CASHFLOW} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(201,168,76,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--cream-dim)" fontSize={11} tickLine={false} axisLine={{ stroke:'rgba(201,168,76,0.15)' }} />
              <YAxis stroke="var(--cream-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtK} />
              <Tooltip
                cursor={{ fill: 'rgba(201,168,76,0.06)' }}
                contentStyle={{ background:'var(--ink-3)', border:'1px solid var(--gold-dim)', borderRadius:8 }}
                formatter={(v) => fmt(v)}
              />
              <ReferenceLine y={HACKNEY_CASH.safetyFloor} stroke="var(--red-cost)" strokeDasharray="4 3" label={{ value: `Safety floor ${fmt(HACKNEY_CASH.safetyFloor)}`, fill:'var(--red-cost)', fontSize:10, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="closing" stroke="var(--gold)" strokeWidth={2} dot={{ r:3, fill:'var(--gold)' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RENT, MARKETING, EVENTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Rent — flat monthly</div>
          <div className="serif" style={{ fontSize: '1.7rem', color: 'var(--cream)', lineHeight: 1, marginBottom: 4 }}>{fmt(HACKNEY_RENT.monthly)}<span style={{ fontSize: 14, color: 'var(--cream-dim)' }}>/mo ex VAT</span></div>
          <div style={{ fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6, marginTop: 8 }}>
            <strong style={{ color: 'var(--gold)' }}>{HACKNEY_RENT.rentFreeMonths}-month rent-free period</strong> May–Aug 2026 (landlord acquisition concession) · {HACKNEY_RENT.payingMonths} months payable · {fmt(HACKNEY_RENT.yearOneTotal)} total Y1.
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Marketing — no paid search</div>
          <div className="serif" style={{ fontSize: '1.7rem', color: 'var(--cream)', lineHeight: 1, marginBottom: 4 }}>{fmt(HACKNEY_MARKETING.total)}<span style={{ fontSize: 14, color: 'var(--cream-dim)' }}>/yr (~1% rev)</span></div>
          <div style={{ fontSize: 12, color: 'var(--cream-dim)', marginTop: 10, lineHeight: 1.6 }}>
            {HACKNEY_MARKETING.channels.map(c => (
              <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>{c.label}</span>
                <span style={{ color: 'var(--cream)', fontVariantNumeric: 'tabular-nums' }}>{fmt(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Events programme</div>
          <ul style={{ fontSize: 13, color: 'var(--cream-dim)', lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
            <li>DJ Fri/Sat — highest-revenue nights</li>
            <li>Listen-bar format — early evening</li>
            <li>Corporate &amp; private hire</li>
            <li>Tacos &amp; brand collabs (Broadway Market, neighbourhood)</li>
            <li>Pool league nights</li>
          </ul>
        </div>
      </div>

      {/* GROWTH DRIVERS BAND */}
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <img src="/hackney/tacos/t1.jpg" alt="Tacos event" style={{ width:'100%', height:200, objectFit:'cover', borderRadius:10 }} />
        <img src="/hackney/pool/p2.jpg"  alt="Pool night"  style={{ width:'100%', height:200, objectFit:'cover', borderRadius:10 }} />
      </div>
    </div>
  )
}
