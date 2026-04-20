import React, { useState } from 'react'
import { ACTUALS_2025, DEAL, WAGE_RATES, MARKETING } from '../data.js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const fmt = (n) => '£' + Math.round(n).toLocaleString()
const TABS = ['Financial Overview', 'Revenue Builder', 'Cost Explorer', 'Marketing Analytics']

export default function BusinessExplorer() {
  const [tab, setTab] = useState(0)

  return (
    <div style={{ padding:'28px 40px 60px', maxWidth:1000, margin:'0 auto' }}>
      <h2 className="serif" style={{ fontSize:'clamp(1.6rem,3vw,2.4rem)', color:'var(--cream)', marginBottom:8 }}>
        Business Explorer
      </h2>
      <p style={{ color:'var(--cream-dim)', marginBottom:24, fontSize:13 }}>
        Interactive financial analysis tools · All data from verified 2025 actuals
      </p>

      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:28, borderBottom:'1px solid rgba(201,168,76,0.15)' }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding:'8px 16px', fontSize:11, cursor:'pointer', border:'none',
            background:'transparent',
            borderBottom: tab===i ? '2px solid var(--gold)' : '2px solid transparent',
            color: tab===i ? 'var(--gold)' : 'var(--cream-dim)', transition:'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && <FinancialOverview />}
      {tab === 1 && <RevenueBuilder />}
      {tab === 2 && <CostExplorer />}
      {tab === 3 && <MarketingAnalytics />}
    </div>
  )
}

function FinancialOverview() {
  const monthly = [
    { m:'Jan', r:56225, p:6318 }, { m:'Feb', r:56314, p:9270 },
    { m:'Mar', r:58218, p:3835 }, { m:'Apr', r:53275, p:4020 },
    { m:'May', r:46513, p:-704 },{ m:'Jun', r:59875, p:1340 },
    { m:'Jul', r:60901, p:4288 }, { m:'Aug', r:56214, p:5992 },
    { m:'Sep', r:56246, p:5675 }, { m:'Oct', r:53213, p:4781 },
    { m:'Nov', r:62892, p:11201 },{ m:'Dec', r:121758, p:55162 },
  ]
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {[
          { label:'2025 Revenue', value:'£741,644' },
          { label:'2025 EBITDA', value:'£91,950' },
          { label:'2025 Profit', value:'£111,177' },
          { label:'Forecast Revenue', value:'£852,891' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:18, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'var(--cream-dim)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
            <div className="serif" style={{ fontSize:22, color:'var(--gold)' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ height:240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="m" tick={{ fontSize:10, fill:'#B8B0A0' }} />
            <YAxis tick={{ fontSize:10, fill:'#B8B0A0' }} tickFormatter={v => '£'+Math.round(v/1000)+'k'} />
            <Tooltip formatter={v => fmt(v)} contentStyle={{ background:'#13131A', border:'1px solid #8A6E2F', borderRadius:8, color:'#F5F0E8', fontSize:11 }} />
            <Bar dataKey="r" fill="rgba(201,168,76,0.3)" name="Revenue" radius={[2,2,0,0]} />
            <Bar dataKey="p" fill="#C9A84C" name="Profit" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function RevenueBuilder() {
  const [growth, setGrowth] = useState(15)
  const baseRevenue = ACTUALS_2025.revenue
  const forecast = baseRevenue * (1 + growth/100)
  const profit = forecast * 0.224
  const preferred = 12000
  const remaining = Math.max(0, profit - preferred - 44000)
  const investorReturn = preferred + remaining * 0.49
  const coc = investorReturn / 150000

  return (
    <div>
      <div className="card-highlight" style={{ padding:24, marginBottom:24 }}>
        <div style={{ fontSize:11, color:'var(--gold)', marginBottom:16, letterSpacing:'0.1em', textTransform:'uppercase' }}>
          Revenue Growth Scenario Builder
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}>
          <span style={{ color:'var(--cream-dim)' }}>Revenue growth vs 2025 base</span>
          <span style={{ color:'var(--gold)', fontWeight:500 }}>{growth > 0 ? '+' : ''}{growth}%</span>
        </div>
        <input type="range" min={-10} max={40} step={1} value={growth}
          onChange={e => setGrowth(+e.target.value)}
          style={{ width:'100%', accentColor:'var(--gold)', marginBottom:4 }} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--gold-dim)' }}>
          <span>−10% (decline)</span><span>+15% (base)</span><span>+40% (aggressive)</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        {[
          { label:'Forecast Revenue', value:fmt(forecast) },
          { label:'Forecast Profit', value:fmt(profit) },
          { label:'Investor Return', value:fmt(investorReturn), gold:true },
          { label:'Cash-on-Cash', value:`${(coc*100).toFixed(1)}%`, gold:true },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:18, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'var(--cream-dim)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
            <div className="serif" style={{ fontSize:22, color:s.gold ? 'var(--gold)' : 'var(--cream)' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CostExplorer() {
  const [masterPct, setMasterPct] = useState(0)
  const roles = WAGE_RATES.map(r => ({ ...r, effectiveRate: r.rate * (1 + masterPct/100) }))
  const totalWages = roles.reduce((s,r) => s + r.effectiveRate * r.hours, 0)

  return (
    <div>
      <div className="card" style={{ padding:20, marginBottom:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', marginBottom:12, letterSpacing:'0.1em', textTransform:'uppercase' }}>
          Wage Rate Master Adjustment
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12 }}>
          <span style={{ color:'var(--cream-dim)' }}>All roles simultaneously</span>
          <span style={{ color: masterPct > 0 ? '#E53935' : masterPct < 0 ? '#2DD4BF' : 'var(--cream-dim)' }}>
            {masterPct > 0 ? '+' : ''}{masterPct}%
          </span>
        </div>
        <input type="range" min={-10} max={20} step={0.5} value={masterPct}
          onChange={e => setMasterPct(+e.target.value)}
          style={{ width:'100%', accentColor:'var(--gold)' }} />
      </div>
      {roles.map((r,i) => (
        <div key={i} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', marginBottom:8 }}>
          <div>
            <div style={{ fontSize:12, color:'var(--cream)', marginBottom:2 }}>{r.role}</div>
            <div style={{ fontSize:10, color:'var(--cream-dim)' }}>{r.hours.toLocaleString()} hrs/yr</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:13, color:'var(--gold)' }}>£{r.effectiveRate.toFixed(2)}/hr</div>
            <div style={{ fontSize:11, color:'var(--cream-dim)' }}>{fmt(r.effectiveRate * r.hours)}/yr</div>
          </div>
        </div>
      ))}
      <div style={{ display:'flex', justifyContent:'space-between', padding:'16px 0 0', fontSize:14 }}>
        <span style={{ color:'var(--cream-dim)' }}>Total annual wage bill</span>
        <span className="serif" style={{ color:'var(--gold)', fontSize:20 }}>{fmt(totalWages)}</span>
      </div>
    </div>
  )
}

function MarketingAnalytics() {
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:11, color:'var(--gold)', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.1em' }}>
            2025 Google Ads — GA4 Verified
          </div>
          {[
            ['Active period', '5 Nov – 11 Dec 2025 (37 days)'],
            ['Total spend', '£580'],
            ['Total clicks', '1,827'],
            ['Avg CPC', '£0.32'],
            ['Conversions', '105 (DMN checkout)'],
            ['Cost per conversion', '£5.53'],
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
              borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:11 }}>
              <span style={{ color:'var(--cream-dim)' }}>{l}</span>
              <span style={{ color:'var(--gold)' }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:11, color:'var(--gold)', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Organic Search
          </div>
          {[
            ['2024 sessions', '114,228'],
            ['2025 sessions', '77,801'],
            ['YoY change', '−32% (brand change)'],
            ['Channel share', '~58% of all traffic'],
            ['Cost', '£0 — fully organic'],
            ['vs Paid Search', '50× more sessions'],
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
              borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:11 }}>
              <span style={{ color:'var(--cream-dim)' }}>{l}</span>
              <span style={{ color:'var(--cream)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.1em' }}>
          2026 Digital Marketing Budget
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 2fr', gap:12,
          padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', fontSize:10, color:'var(--gold-dim)',
          textTransform:'uppercase', letterSpacing:'0.08em' }}>
          <span>Line</span><span style={{textAlign:'right'}}>Monthly</span>
          <span style={{textAlign:'right'}}>Annual</span><span>Notes</span>
        </div>
        {[
          ['Website Maintenance (Lithos)', '£291', '£3,492', '€340/mth · plonkgolf.co.uk → nodiceborough.co.uk redirect'],
          ['SEO + Outreach + Listings (Lithos)', '£872', '£10,464', '3 articles + 10 listings/mth · run all year from Day 1'],
          ['Google Ads (PPC spend)', '£600', '£7,200', '~1,875 clicks/mth · ~107 conversions at verified £0.32 CPC'],
        ].map(([l,m,a,n]) => (
          <div key={l} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 2fr', gap:12,
            padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', alignItems:'center' }}>
            <span style={{ fontSize:12, color:'var(--cream)' }}>{l}</span>
            <span style={{ fontSize:12, color:'var(--cream)', textAlign:'right' }}>{m}</span>
            <span style={{ fontSize:13, color:'var(--gold)', textAlign:'right', fontFamily:"'DM Serif Display',serif" }}>{a}</span>
            <span style={{ fontSize:10, color:'var(--cream-dim)' }}>{n}</span>
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0 0', alignItems:'baseline' }}>
          <span style={{ fontSize:13, color:'var(--cream)', fontWeight:500 }}>Total Digital Marketing</span>
          <span className="serif" style={{ fontSize:22, color:'var(--gold)' }}>£21,156/yr</span>
        </div>
      </div>
    </div>
  )
}
