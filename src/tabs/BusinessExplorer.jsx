import React, { useState } from 'react'
import FinancialPerformance from '../slides/FinancialPerformance.jsx'
import ResetBtn from '../components/ResetBtn.jsx'

const TABS = ['Overview','Financial Performance','Performance','Investor Returns','Distribution','Scenarios','Market Context','Wages']

const fmt = n => '£' + Math.round(n).toLocaleString()
const fmtK = n => '£' + Math.round(n/1000) + 'k'

function TabOverview() {
  const months = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr']
  const rev =    [52000,44000,53000,89000,71000,68000,97000,173326,36000,52000,60000,58000]
  const ebitda = [-7000,-4000,5000,23000,17000,15000,30000,98000,-3000,6000,3000,8000]
  const maxRev = Math.max(...rev)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, fontSize:13 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'INVESTMENT ASK', value:'£150,000', sub:'for 49% equity', color:'var(--gold)' },
          { label:'FY2025 ACTUAL REVENUE', value:'£742k', sub:'Verified financial model', color:'#4FC3F7' },
          { label:'FORECAST REVENUE Y1', value:'£853k', sub:'+15.0% on prior year', color:'#2DD4BF' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>Monthly Revenue & EBITDA Forecast · May 2026 – Apr 2027</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:140, marginBottom:8 }}>
          {months.map((m,i) => (
            <div key={m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <div style={{ width:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end', height:120 }}>
                <div style={{ width:'100%', background:'#4FC3F7', borderRadius:'2px 2px 0 0', height:Math.max(2,(rev[i]/maxRev)*100)+'px', opacity:0.7 }} />
                <div style={{ width:'100%', background:ebitda[i]>0?'#2DD4BF':'#EF4444', borderRadius:'2px 2px 0 0', height:Math.max(2,(Math.abs(ebitda[i])/maxRev)*100)+'px', marginTop:2 }} />
              </div>
              <div style={{ fontSize:9, color:'#6B7280' }}>{m}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:10, height:10, background:'#4FC3F7', borderRadius:2 }} /><span style={{ fontSize:11, color:'#9CA3AF' }}>Revenue</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:10, height:10, background:'#2DD4BF', borderRadius:2 }} /><span style={{ fontSize:11, color:'#9CA3AF' }}>EBITDA</span></div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'Revenue Split', items:[{label:'Bar & Drinks',pct:49,c:'#1E40AF'},{label:'Activities',pct:28,c:'#2563EB'},{label:'Events & Hire',pct:23,c:'#60A5FA'}] },
          { label:'Y1 Forecast EBITDA', value:'£191k', sub:'22.4% EBITDA margin', color:'#2DD4BF' },
          { label:'Base Case Returns', value:'52.1% CoC', sub:'Cash-on-cash return Year 1', color:'#C9A84C' },
        ].map((s,i) => (
          <div key={i} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
            <div style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>{s.label}</div>
            {s.items ? s.items.map(item => (
              <div key={item.label} style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                  <span style={{ color:'var(--cream)' }}>{item.label}</span>
                  <span style={{ color:item.c, fontWeight:600 }}>{item.pct}%</span>
                </div>
                <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
                  <div style={{ height:'100%', width:item.pct+'%', background:item.c, borderRadius:2 }} />
                </div>
              </div>
            )) : <>
              <div style={{ fontSize:26, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
            </>}
          </div>
        ))}
      </div>
    </div>
  )
}

function TabPerformance() {
  const [growth, setGrowth] = useState(15)
  const baseRev = 741644
  const adjRev = Math.round(baseRev * (1 + growth/100))
  const adjEbitda = Math.round(adjRev * 0.224)
  const months = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr']
  const revSplit = [0.061,0.052,0.062,0.104,0.083,0.080,0.114,0.203,0.042,0.061,0.070,0.068]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Revenue Growth Lever</div>
          <ResetBtn onClick={()=>setGrowth(15)} title="Reset to +15%" />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:8 }}>
          <span style={{ fontSize:12, color:'#9CA3AF' }}>-20%</span>
          <input type="range" min={-20} max={50} value={growth} onChange={e=>setGrowth(Number(e.target.value))} style={{ flex:1, accentColor:'var(--gold)' }} />
          <span style={{ fontSize:12, color:'#9CA3AF' }}>+50%</span>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--gold)', minWidth:48 }}>{growth>0?'+':''}{growth}%</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:16, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Adjusted Revenue</div>
            <div style={{ fontSize:24, fontWeight:800, color:'var(--gold)' }}>{fmtK(adjRev)}</div>
          </div>
          <div style={{ background:'rgba(45,212,191,0.08)', border:'1px solid rgba(45,212,191,0.2)', borderRadius:8, padding:16, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Adjusted EBITDA</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#2DD4BF' }}>{fmtK(adjEbitda)} <span style={{ fontSize:14 }}>{(adjEbitda/adjRev*100).toFixed(1)}% margin</span></div>
          </div>
        </div>
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Monthly Revenue — Adjusted Forecast</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:120 }}>
          {months.map((m,i) => {
            const h = Math.round(revSplit[i]*100)
            return <div key={m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ width:'100%', background:'#4FC3F7', borderRadius:'2px 2px 0 0', height:h+'px' }} />
              <div style={{ fontSize:9, color:'#6B7280', marginTop:4 }}>{m}</div>
            </div>
          })}
        </div>
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Operating Cost Breakdown</div>
        {[['Staff Wages',242370,'#991B1B'],['Rent & Rates',98000,'#B91C1C'],['COGS',81732,'#DC2626'],['Hosting (Lithos)',3492,'#F87171'],['Other OpEx',80000,'#9CA3AF']].map(([l,v,c]) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color:'var(--cream)' }}>{l}</span>
            <span style={{ color:c, fontWeight:600 }}>{fmtK(v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabInvestorReturns() {
  const preferred = 12000
  const totalProfit = 191000
  const remaining = totalProfit - preferred
  const investorDiv = Math.round(remaining * 0.49)
  const founderDiv = Math.round(remaining * 0.51)
  const totalInvestor = preferred + investorDiv
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'Preferred Return', value:fmt(preferred), sub:'Before profit share', color:'#C9A84C' },
          { label:'Investor Dividend', value:fmt(investorDiv), sub:'49% of remaining pool', color:'#4FC3F7' },
          { label:'Total Investor Return', value:fmt(totalInvestor), sub:'Year 1 base case', color:'#2DD4BF' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Profit Waterfall — Base Case Scenario</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { label:'Total Operating Profit', value:fmt(totalProfit), color:'#4FC3F7', width:100 },
            { label:'Preferred Return (Investor)', value:fmt(preferred), color:'#C9A84C', width:Math.round(preferred/totalProfit*100) },
            { label:'Remaining Pool', value:fmt(remaining), color:'#6B7280', width:Math.round(remaining/totalProfit*100) },
            { label:'Investor Share (49%)', value:fmt(investorDiv), color:'#2DD4BF', width:Math.round(investorDiv/totalProfit*100) },
            { label:'Founder Share (51%)', value:fmt(founderDiv), color:'#8B5CF6', width:Math.round(founderDiv/totalProfit*100) },
          ].map(item => (
            <div key={item.label}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                <span style={{ color:'var(--cream)' }}>{item.label}</span>
                <span style={{ color:item.color, fontWeight:600 }}>{item.value}</span>
              </div>
              <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3 }}>
                <div style={{ height:'100%', width:item.width+'%', background:item.color, borderRadius:3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Return Distribution</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ textAlign:'center', padding:16, background:'rgba(45,212,191,0.08)', border:'1px solid rgba(45,212,191,0.2)', borderRadius:8 }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>Investor</div>
            <div style={{ fontSize:28, fontWeight:800, color:'#2DD4BF' }}>{fmt(totalInvestor)}</div>
          </div>
          <div style={{ textAlign:'center', padding:16, background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:8 }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>Founder</div>
            <div style={{ fontSize:28, fontWeight:800, color:'#8B5CF6' }}>{fmt(founderDiv)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabDistribution() {
  const [budget, setBudget] = useState(500)
  const [cpc, setCpc] = useState(0.46)
  const [cvr, setCvr] = useState(3.6)
  const [avgSpend, setAvgSpend] = useState(70.2)
  const annualBudget = budget * 52
  const clicks = Math.round(annualBudget / cpc)
  const customers = Math.round(clicks * cvr / 100)
  const revenue = Math.round(customers * avgSpend)
  const roas = revenue > 0 ? (revenue / annualBudget).toFixed(1) : 0
  const netProfit = Math.round(revenue * 0.6 - annualBudget)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Marketing Model Inputs</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[
            { label:'Weekly Ad Budget', value:budget, set:setBudget, min:100, max:1500, prefix:'£', suffix:'', default:500 },
            { label:'Cost Per Click', value:cpc, set:setCpc, min:0.1, max:2, step:0.01, prefix:'£', suffix:'', default:0.46 },
            { label:'Conversion Rate', value:cvr, set:setCvr, min:0.5, max:10, step:0.1, prefix:'', suffix:'%', default:3.6 },
            { label:'Avg Spend / Customer', value:avgSpend, set:setAvgSpend, min:20, max:150, prefix:'£', suffix:'', default:70.2 },
          ].map(s => (
            <div key={s.label}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                <span style={{ color:'var(--cream)' }}>{s.label}</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'var(--gold)', fontWeight:600 }}>{s.prefix}{s.value}{s.suffix}</span>
                  <ResetBtn onClick={()=>s.set(s.default)} title={`Reset to ${s.prefix}${s.default}${s.suffix}`} />
                </span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step||1} value={s.value} onChange={e=>s.set(Number(e.target.value))} style={{ width:'100%', accentColor:'var(--gold)' }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          { label:'Annual Budget', value:'£'+Math.round(annualBudget/1000)+'k', color:'#C9A84C' },
          { label:'Paying Customers', value:customers.toLocaleString(), color:'#4FC3F7' },
          { label:'ROAS', value:roas+'×', color:'#2DD4BF' },
          { label:'Net Marketing Profit', value:'£'+Math.round(netProfit/1000)+'k', color:netProfit>0?'#2DD4BF':'#EF4444' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:16, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabScenarios() {
  const [revGrowth, setRevGrowth] = useState(15)
  const [opex, setOpex] = useState(100)
  const [events, setEvents] = useState(12)
  const baseRev = 741644
  const customRev = Math.round(baseRev * (1 + revGrowth/100) + events * 3500)
  const customEbitda = Math.round(customRev * 0.224 * (200-opex)/100)
  const customReturn = Math.round(12000 + (customEbitda - 12000) * 0.49)
  const customCoc = ((customReturn / 150000) * 100).toFixed(1)
  const scenarios = [
    { label:'CONSERVATIVE', rev:816000, profit:87000, ret:21857, coc:14.6 },
    { label:'BASE CASE', rev:853000, profit:191000, ret:78123, coc:52.1 },
    { label:'OPTIMISTIC', rev:927000, profit:220000, ret:85000, coc:56.7 },
    { label:'CUSTOM', rev:customRev, profit:customEbitda, ret:Math.max(0,customReturn), coc:parseFloat(customCoc) },
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Build Custom Scenario</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
          {[
            { label:'Revenue Growth', value:revGrowth, set:setRevGrowth, min:-20, max:50, suffix:'%', default:15 },
            { label:'OpEx vs Budget', value:opex, set:setOpex, min:70, max:130, suffix:'%', default:100 },
            { label:'Private Events / Year', value:events, set:setEvents, min:0, max:52, suffix:'', default:12 },
          ].map(s => (
            <div key={s.label}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                <span style={{ color:'var(--cream)' }}>{s.label}</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'var(--gold)', fontWeight:600 }}>{s.value>0&&s.suffix==='%'?'+':''}{s.value}{s.suffix}</span>
                  <ResetBtn onClick={()=>s.set(s.default)} title={`Reset to ${s.default}${s.suffix}`} />
                </span>
              </div>
              <input type="range" min={s.min} max={s.max} value={s.value} onChange={e=>s.set(Number(e.target.value))} style={{ width:'100%', accentColor:'var(--gold)' }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {scenarios.map((s,i) => (
          <div key={s.label} style={{ background:i===3?'rgba(201,168,76,0.08)':'var(--ink-2)', border:i===3?'1px solid rgba(201,168,76,0.3)':'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:16 }}>
            <div style={{ fontSize:10, color:i===3?'var(--gold)':'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12, fontWeight:600 }}>{s.label}</div>
            {[['Revenue',fmtK(s.rev)],['Op Profit',fmtK(s.profit)],['Investor Return',fmt(s.ret)],['Cash-on-Cash',s.coc+'%']].map(([l,v],j) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:12 }}>
                <span style={{ color:'#9CA3AF' }}>{l}</span>
                <span style={{ color:j===3?'#2DD4BF':'var(--cream)', fontWeight:j===3?700:400 }}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function TabMarketContext() {
  const tailwinds = [
    { icon:'📱', title:'Social Media Discovery', text:'Experiential venues generate organic UGC at 5× the rate of traditional hospitality. Plonk’s visual format drives free acquisition.' },
    { icon:'🏢', title:'Corporate Demand', text:'Post-pandemic, team-building and offsites are structural demand. City of London proximity means Plonk Borough targets this without incremental spend.' },
    { icon:'💰', title:'Recession Resilience', text:'Domestic leisure spend is sticky. Experience venues priced below £30/head replace overseas alternatives during economic downturns.' },
    { icon:'🎂', title:'Occasions & Celebrations', text:'Birthday, hen and stag parties are high-value bookings with structured spend. Activity venues capture the full occasion — entry, drinks and food.' },
    { icon:'🔄', title:'Repeat Visit Model', text:'Multi-activity format with regular event programme drives repeat visitation. Bar-led experience venues see 2–3× the repeat rate of single-activity venues.' },
    { icon:'📈', title:'Pricing Power', text:'+£1 across pool and golf at current volumes generates ~£15K incremental annual profit. Zero capex, zero churn risk at this price point.' },
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { value:'+31.1%', label:'Experience Leisure Growth', sub:'2025 YoY — fastest growing hospitality sub-sector', color:'#2DD4BF' },
          { value:'15–20M', label:'Borough Market Visitors', sub:'Annual visitors to the area', color:'#4FC3F7' },
          { value:'130K+', label:'London Bridge Commuters', sub:'Daily station passengers — primary catchment', color:'#C9A84C' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, marginBottom:6 }}>{s.value}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--cream)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>SE1 Demographics</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[['Aged 25–44','48%','#4FC3F7'],['Median HH Income','£57K','#C9A84C'],['Uni-educated','62%','#2DD4BF'],['Office workers','71%','#8B5CF6']].map(([l,v,c]) => (
            <div key={l} style={{ textAlign:'center', padding:14, background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
              <div style={{ fontSize:20, fontWeight:700, color:c, marginBottom:4 }}>{v}</div>
              <div style={{ fontSize:11, color:'#9CA3AF' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Tailwinds & Positioning</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {tailwinds.map(t => (
            <div key={t.title} style={{ display:'flex', gap:12, padding:14, background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
              <div style={{ fontSize:20, flexShrink:0 }}>{t.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--cream)', marginBottom:4 }}>{t.title}</div>
                <div style={{ fontSize:12, color:'#9CA3AF', lineHeight:1.5 }}>{t.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabWages() {
  const [barRate, setBarRate] = useState(13.85)
  const [supRate, setSupRate] = useState(14.35)
  const [amRate, setAmRate] = useState(15.38)
  const [mgrRate, setMgrRate] = useState(18.00)
  const roles = [
    { label:'Bar Staff', hours:4967, rate:barRate, setRate:setBarRate, plan:13.85, min:12.21, max:18 },
    { label:'Supervisor', hours:2156, rate:supRate, setRate:setSupRate, plan:14.35, min:13.85, max:20 },
    { label:'Asst Manager', hours:1847, rate:amRate, setRate:setAmRate, plan:15.38, min:14.35, max:22 },
    { label:'Manager', hours:1073, rate:mgrRate, setRate:setMgrRate, plan:18.00, min:15.38, max:25 },
  ]
  const totalWages = Math.round(roles.reduce((s,r)=>s+r.hours*r.rate,0))
  const planWages = 242370
  const delta = totalWages - planWages
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, fontSize:13 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'Total Wage Bill 2025', value:fmt(242370), sub:'Verified rota data', color:'#C9A84C' },
          { label:'Total Hours Worked', value:'10,043 hrs', sub:'23 employees · fully tagged roles', color:'#4FC3F7' },
          { label:'Wages as % Revenue', value:'20.8%', sub:'£242,370 ÷ £741,644 · target ≤22%', color:'#2DD4BF' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20 }}>
        <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Sliding Wage Rate Calculator — 2026 Planning</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:16 }}>
          {roles.map(r => (
            <div key={r.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontWeight:600, color:'var(--cream)' }}>{r.label}</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:'var(--gold)', fontWeight:700 }}>£{r.rate.toFixed(2)}/hr</span>
                  <ResetBtn onClick={()=>r.setRate(r.plan)} title={`Reset to £${r.plan.toFixed(2)}/hr`} />
                </span>
              </div>
              <input type="range" min={r.min} max={r.max} step={0.01} value={r.rate} onChange={e=>r.setRate(Number(e.target.value))} style={{ width:'100%', accentColor:'var(--gold)', marginBottom:6 }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#6B7280' }}>
                <span>{r.hours.toLocaleString()} hrs</span>
                <span>Annual: {fmt(Math.round(r.hours*r.rate))}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>Projected Wage Bill</div>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--gold)' }}>{fmt(totalWages)}</div>
          </div>
          <div style={{ background:delta>0?'rgba(239,68,68,0.08)':'rgba(45,212,191,0.08)', border:`1px solid ${delta>0?'rgba(239,68,68,0.2)':'rgba(45,212,191,0.2)'}`, borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>Delta vs 2025</div>
            <div style={{ fontSize:20, fontWeight:800, color:delta>0?'#EF4444':'#2DD4BF' }}>{delta>0?'+':''}{fmt(delta)}</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:14, textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#9CA3AF', textTransform:'uppercase', marginBottom:6 }}>Wages % Forecast</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#4FC3F7' }}>{(totalWages/852891*100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BusinessExplorer() {
  const [tab, setTab] = useState('Overview')
  const tabComponents = {
    'Overview': <TabOverview />,
    'Financial Performance': <FinancialPerformance />,
    'Performance': <TabPerformance />,
    'Investor Returns': <TabInvestorReturns />,
    'Distribution': <TabDistribution />,
    'Scenarios': <TabScenarios />,
    'Market Context': <TabMarketContext />,
    'Wages': <TabWages />,
  }
  return (
    <div style={{ minHeight:'100%', background:'var(--ink)', color:'var(--cream)' }}>
      <div style={{ padding:'20px 32px 0', borderBottom:'1px solid rgba(201,168,76,0.12)' }}>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>No Dice Borough Ltd</div>
          <div style={{ fontSize:14, color:'var(--cream-dim)' }}>Business Explorer · Borough Market SE1</div>
        </div>
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 16px', fontSize:11, cursor:'pointer', border:'none', background:'transparent', letterSpacing:'0.06em', textTransform:'uppercase', borderBottom:`2px solid ${tab===t?'var(--gold)':'transparent'}`, color:tab===t?'var(--gold)':'var(--cream-dim)', transition:'all 0.15s', whiteSpace:'nowrap' }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:'24px 32px 48px', fontSize:13 }}>{tabComponents[tab]}</div>
    </div>
  )
}