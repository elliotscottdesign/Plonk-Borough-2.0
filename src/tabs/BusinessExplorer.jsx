import React, { useState, useRef, useEffect } from 'react'

const TABS = ['Overview','Performance','Investor Returns','Distribution','Scenarios','Market Context','Wages']

const FIG = {
  rev2025: 741644, ebitda2025: 91950, profit2025: 111177, investment: 150000,
  investorEq: 0.49, founderEq: 0.51, preMoney: 156122, postMoney: 306122,
  multiple: 1.70, prefRate: 0.08, aShare: 44000, forecastRev: 852891,
  forecastGrowth: 0.15, forecastMargin: 0.224,
}
const MON = [
  {m:'May',r:46513,e:9302},{m:'Jun',r:59875,e:11975},{m:'Jul',r:60901,e:12180},
  {m:'Aug',r:56214,e:11243},{m:'Sep',r:56246,e:11249},{m:'Oct',r:53213,e:10643},
  {m:'Nov',r:62892,e:12578},{m:'Dec',r:121758,e:24352},{m:'Jan',r:56225,e:11245},
  {m:'Feb',r:56314,e:11263},{m:'Mar',r:58218,e:11644},{m:'Apr',r:53213,e:10643},
]
const FORECAST_MON = MON.map(m => ({ ...m, r: Math.round(m.r*1.15), e: Math.round(m.e*1.15) }))
const INCOME_SPLIT = [
  {n:'Bar & Drinks',pct:48.9,col:'#1565C0'},{n:'Online Golf Tickets',pct:28.4,col:'#1976D2'},
  {n:'Bookings & Events',pct:14.3,col:'#1E88E5'},{n:'Private Hires',pct:6.1,col:'#039BE5'},
  {n:'Service Charge',pct:2.0,col:'#4FC3F7'},{n:'Pool Tickets',pct:0.3,col:'#81D4FA'},
]
const COSTS_SPLIT = [
  {n:'Staff Wages',pct:38.5,col:'#4A0000'},{n:'Fixed Costs/Rent',pct:26.2,col:'#7B0000'},
  {n:'Drinks & Gas',pct:13.0,col:'#B71C1C'},{n:'VAT (Net)',pct:12.5,col:'#C62828'},
  {n:'Cleaning',pct:3.5,col:'#E53935'},{n:'Arcades',pct:2.7,col:'#D84315'},
  {n:'Food',pct:1.4,col:'#EF6C00'},{n:'Lithos Digital',pct:0.8,col:'#F9A825'},{n:'Card Charges',pct:0.9,col:'#FDD835'},
]
const WAGES = [
  {role:'Bar Staff',hrs:4967,rate:13.85,col:'#E67E22',min:12.21,max:18.00},
  {role:'Supervisor',hrs:2859,rate:14.35,col:'#D4A843',min:12.21,max:18.00},
  {role:'Asst. Manager',hrs:505,rate:15.38,col:'#94A3B8',min:13.00,max:22.00},
  {role:'Manager',hrs:1712,rate:18.00,col:'#0D9488',min:14.00,max:26.00},
]
const SCENARIOS = {
  conservative:{l:'Conservative',growth:-0.10,col:'#E53935'},
  base:{l:'Base Case',growth:0.15,col:'#C9A84C'},
  optimistic:{l:'Optimistic',growth:0.25,col:'#2DD4BF'},
}
const fmt=n=>'\u00a3'+Math.round(Math.abs(n)).toLocaleString()
const fmtK=n=>'\u00a3'+Math.round(Math.abs(n)/1000)+'k'
const pct=n=>(n*100).toFixed(1)+'%'
function calcReturns(rev){
  const profit=rev*FIG.forecastMargin,pref=FIG.investment*FIG.prefRate
  const rem=Math.max(0,profit-pref-FIG.aShare),iDiv=rem*FIG.investorEq,fDiv=rem*FIG.founderEq
  const total=pref+iDiv
  return{profit,pref,rem,iDiv,fDiv,total,coc:total/FIG.investment,pb:FIG.investment/total}
}
function MiniBar({data,keyR,keyE,maxV}){
  return(
    <div>
      <div style={{display:'flex',alignItems:'flex-end',gap:2,height:70}}>
        {data.map((d,i)=>{
          const rh=Math.round((d[keyR]/maxV)*65),eh=keyE?Math.round((d[keyE]/maxV)*65):0
          return(
            <div key={i} style={{flex:1,display:'flex',alignItems:'flex-end',gap:1}}>
              <div style={{flex:2,height:rh,background:'rgba(201,168,76,0.25)',borderRadius:'2px 2px 0 0',minHeight:2}} title={d.m+' rev: '+fmt(d[keyR])} />
              {keyE&&<div style={{flex:1,height:eh,background:'#C9A84C',borderRadius:'2px 2px 0 0',minHeight:eh>0?2:0}} />}
            </div>
          )
        })}
      </div>
      <div style={{display:'flex',gap:2,marginTop:3}}>{data.map((d,i)=><div key={i} style={{flex:1,fontSize:22,color:'var(--cream-dim)',textAlign:'center'}}>{d.m}</div>)}</div>
    </div>
  )
}
function DonutSVG({data,total,size=110}){
  const cx=size/2,cy=size/2,r=size*0.44,inner=size*0.25
  let angle=-Math.PI/2
  const paths=data.map((d,i)=>{
    const slice=(d.pct/100)*Math.PI*2,x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle)
    angle+=slice
    const x2=cx+r*Math.cos(angle),y2=cy+r*Math.sin(angle),large=slice>Math.PI?1:0
    return <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={d.col} opacity={0.85} />
  })
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
      <circle cx={cx} cy={cy} r={inner} fill="var(--ink-2)" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#C9A84C" fontSize={8} fontFamily="Georgia,serif">{data.length} streams</text>
    </svg>
  )
}
function Card({children,highlight}){
  return <div style={{background:'var(--ink-2)',border:`1px solid ${highlight?'rgba(201,168,76,0.4)':'rgba(201,168,76,0.12)'}`,borderRadius:10,padding:16}}>{children}</div>
}
function STitle({children}){
  return <div style={{fontSize:17,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold-dim)',marginBottom:10}}>{children}</div>
}
function Row({label,value,gold}){
  return(
    <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
      <span style={{fontSize:22,color:'var(--cream-dim)'}}>{label}</span>
      <span style={{fontSize:22,color:gold?'var(--gold)':'var(--cream)'}}>{value}</span>
    </div>
  )
}

function TabOverview(){
  const maxR=Math.max(...FORECAST_MON.map(m=>m.r))
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {[['Investment Ask',fmt(FIG.investment),'for 49% equity'],['Investor Equity','49.00%','51% retained by founder'],['FY2025 Revenue',fmt(FIG.rev2025),'Verified financial model'],['Forecast Y1',fmt(FIG.forecastRev),'+15.0% on prior year']].map(([l,v,s])=>(
          <Card key={l}><STitle>{l}</STitle><div style={{fontSize:22,color:'var(--gold)',marginBottom:3}}>{v}</div><div style={{fontSize:22,color:'var(--cream-dim)'}}>{s}</div></Card>
        ))}
      </div>
      <Card><STitle>Monthly Revenue & EBITDA Forecast Â· May 2026 â Apr 2027</STitle><MiniBar data={FORECAST_MON} keyR="r" keyE="e" maxV={maxR} />
        <div style={{display:'flex',gap:16,marginTop:8,fontSize:17}}>
          <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:8,background:'rgba(201,168,76,0.25)',borderRadius:2,display:'inline-block'}} />Revenue</span>
          <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:8,background:'#C9A84C',borderRadius:2,display:'inline-block'}} />EBITDA</span>
        </div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <Card><STitle>Revenue Split</STitle>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <DonutSVG data={INCOME_SPLIT} total={FIG.rev2025} />
            <div style={{flex:1}}>{INCOME_SPLIT.map(s=>(<div key={s.n} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:8,height:8,borderRadius:2,background:s.col,flexShrink:0}} /><span style={{fontSize:22,color:'var(--cream)'}}>{s.n}</span></div><span style={{fontSize:22,color:'var(--gold)'}}>{s.pct}%</span></div>))}</div>
          </div>
        </Card>
        <Card><STitle>Investment Summary</STitle>
          <Row label="Structure" value="Equity Investment" />
          <Row label="Investor Equity" value="49.00%" gold />
          <Row label="Implied Valuation" value={fmt(FIG.postMoney)} />
          <Row label="Preferred Return" value="8% p.a." gold />
          <Row label="Entry Multiple" value="1.70Ã EBITDA" gold />
          <Row label="Year 1 Forecast EBITDA" value={fmt(FIG.forecastRev*FIG.forecastMargin)} />
          <div style={{marginTop:10,padding:10,background:'rgba(201,168,76,0.06)',borderRadius:7,border:'1px solid rgba(201,168,76,0.15)'}}>
            <div style={{fontSize:17,color:'var(--gold-dim)',marginBottom:4}}>BASE CASE RETURNS</div>
            <div style={{fontSize:26,color:'var(--gold)'}}>{pct(calcReturns(FIG.forecastRev).coc)}</div>
            <div style={{fontSize:22,color:'var(--cream-dim)'}}>Cash-on-cash return in Year 1</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
function TabPerformance(){
  const [view,setView]=useState('revenue')
  const maxR=Math.max(...MON.map(m=>m.r))
  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {[['2025 Revenue',fmt(FIG.rev2025),'Verified actuals'],['2025 EBITDA',fmt(FIG.ebitda2025),'12.4% margin'],['2025 Net Profit',fmt(FIG.profit2025),'15.0% margin'],['Wages % Revenue','32.7%','Â£242,370 Ã· Â£741,644']].map(([l,v,s])=>(
          <Card key={l}><STitle>{l}</STitle><div style={{fontSize:22,color:'var(--gold)',marginBottom:3}}>{v}</div><div style={{fontSize:22,color:'var(--cream-dim)'}}>{s}</div></Card>
        ))}
      </div>
      <div style={{display:'flex',gap:4,borderBottom:'1px solid rgba(201,168,76,0.1)'}}>
        {[['revenue','Revenue'],['costs','Cost Split'],['income','Income Split']].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{padding:'6px 14px',fontSize:22,cursor:'pointer',border:'none',background:'transparent',borderBottom:`2px solid ${view===k?'var(--gold)':'transparent'}`,color:view===k?'var(--gold)':'var(--cream-dim)',transition:'all 0.15s'}}>{l}</button>
        ))}
      </div>
      {view==='revenue'&&<div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Card><STitle>Monthly Revenue Â· JanâDec 2025</STitle><MiniBar data={MON} keyR="r" keyE={null} maxV={maxR} /></Card>
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>{MON.map(m=>(<Card key={m.m}><div style={{fontSize:17,color:'var(--cream-dim)',marginBottom:3}}>{m.m}</div><div style={{fontSize:22,color:'var(--gold)'}}>{fmtK(m.r)}</div><div style={{fontSize:17,color:'var(--teal)'}}>E: {fmtK(m.e)}</div></Card>))}</div>
      </div>}
      {view==='costs'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <Card><STitle>Cost Structure 2025</STitle>
          <div style={{display:'flex',alignItems:'center',gap:12}}><DonutSVG data={COSTS_SPLIT} total={630467} />
            <div style={{flex:1}}>{COSTS_SPLIT.map(s=>(<div key={s.n} style={{padding:'3px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}><div style={{display:'flex',justifyContent:'space-between'}}><div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:7,height:7,borderRadius:2,background:s.col}} /><span style={{fontSize:22,color:'var(--cream)'}}>{s.n}</span></div><span style={{fontSize:17,color:'var(--cream-dim)'}}>{s.pct}%</span></div></div>))}</div>
          </div>
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <Card><STitle>Total Cost Base</STitle><div style={{fontSize:26,color:'var(--cream)'}}>Â£630,467</div><div style={{fontSize:22,color:'var(--cream-dim)'}}>85.0% of revenue</div></Card>
          <Card><STitle>Largest Cost Lines</STitle><Row label="Staff Wages" value="Â£242,370 (38.5%)" /><Row label="Fixed Costs/Rent" value="Â£165,059 (26.2%)" /><Row label="Drinks & Gas" value="Â£81,732 (13.0%)" /><Row label="VAT (Net)" value="Â£78,851 (12.5%)" /></Card>
        </div>
      </div>}
      {view==='income'&&<Card><STitle>Income by Source 2025</STitle>
        <div style={{display:'flex',alignItems:'center',gap:16}}><DonutSVG data={INCOME_SPLIT} total={FIG.rev2025} size={130} />
          <div style={{flex:1}}>{INCOME_SPLIT.map(s=>(<div key={s.n} style={{padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><div style={{display:'flex',alignItems:'center',gap:7}}><div style={{width:9,height:9,borderRadius:2,background:s.col}} /><span style={{fontSize:22,color:'var(--cream)'}}>{s.n}</span></div><div style={{display:'flex',gap:10}}><span style={{fontSize:22,color:'var(--cream-dim)'}}>{s.pct}%</span><span style={{fontSize:22,color:'var(--gold)'}}>{fmt(FIG.rev2025*s.pct/100)}</span></div></div><div style={{height:4,background:'var(--ink-3)',borderRadius:2}}><div style={{height:'100%',width:`${s.pct}%`,background:s.col,borderRadius:2}} /></div></div>))}</div>
        </div>
      </Card>}
    </div>
  )
}
function TabInvestorReturns(){
  const [inv,setInv]=useState(150000)
  const eq=inv/FIG.postMoney,pref=inv*FIG.prefRate
  const div2=FIG.forecastRev*FIG.forecastMargin*eq,total=pref+div2
  const coc=total/inv,pb=inv/total,isA=eq>=0.05
  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <Card highlight>
        <STitle>Personal Return Calculator</STitle>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:19}}>
          <span style={{color:'var(--cream-dim)'}}>Your investment</span>
          <span style={{color:'var(--gold)',fontSize:22}}>{fmt(inv)}</span>
        </div>
        <input type="range" min={10000} max={200000} step={5000} value={inv} onChange={e=>setInv(+e.target.value)} style={{width:'100%',accentColor:'var(--gold)',margin:'4px 0'}} />
        <div style={{display:'flex',justifyContent:'space-between',fontSize:17,color:'var(--gold-dim)',marginBottom:14}}><span>Â£10k</span><span>Â£100k</span><span>Â£200k</span></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
          {[['Ownership',pct(eq),'var(--cream)'],['Preferred',fmt(pref),'var(--gold)'],['Dividend',fmt(div2),'var(--cream)'],['Total Year 1',fmt(total),'var(--gold)']].map(([l,v,c])=>(
            <div key={l} style={{textAlign:'center',padding:10,background:'var(--ink-3)',borderRadius:8}}>
              <div style={{fontSize:17,color:'var(--cream-dim)',marginBottom:4}}>{l}</div>
              <div style={{fontSize:19,color:c}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div style={{padding:10,background:'var(--ink-3)',borderRadius:8}}><div style={{fontSize:17,color:'var(--cream-dim)',marginBottom:3}}>Cash-on-Cash</div><div style={{fontSize:22,color:'var(--gold)'}}>{pct(coc)}</div></div>
          <div style={{padding:10,background:'var(--ink-3)',borderRadius:8}}><div style={{fontSize:17,color:'var(--cream-dim)',marginBottom:3}}>Payback Period</div><div style={{fontSize:22,color:'var(--gold)'}}>{pb.toFixed(2)} years</div></div>
        </div>
        <div style={{marginTop:10,padding:10,background:isA?'rgba(45,212,191,0.06)':'rgba(255,255,255,0.03)',border:`1px solid ${isA?'rgba(45,212,191,0.2)':'rgba(255,255,255,0.06)'}`,borderRadius:7,fontSize:22,color:'var(--cream-dim)'}}>
          {isA?<><span style={{color:'var(--teal)'}}>&#x2713; A Shares</span> â Full voting rights. {pct(eq)} equity.</>:<><span style={{color:'var(--cream-dim)'}}>&#x25CB; B Shares</span> â Economic rights only. Invest &ge;Â£15,306 for A Shares.</>}
        </div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <Card><STitle>Deal Structure</STitle>
          <Row label="Investment" value={fmt(FIG.investment)} gold />
          <Row label="Investor Equity" value="49.00%" gold />
          <Row label="Founder Retains" value="51.00%" />
          <Row label="Pre-Money" value={fmt(FIG.preMoney)} />
          <Row label="Post-Money" value={fmt(FIG.postMoney)} />
          <Row label="Entry Multiple" value="1.70Ã EBITDA" gold />
          <Row label="Share Class" value="A Shares (â¥5% / â¥Â£15,306)" />
        </Card>
        <Card><STitle>Year 1 Returns â Base Case</STitle>
          <Row label="Preferred Return (8%)" value={fmt(FIG.investment*FIG.prefRate)} gold />
          <Row label="Equity Dividend (49%)" value="Â£66,123" gold />
          <Row label="Total Year 1 Return" value="Â£78,123" gold />
          <Row label="Cash-on-Cash" value="52.1%" gold />
          <Row label="Payback Period" value="1.92 years" />
          <Row label="No exit required" value="Cash-flow driven" />
        </Card>
      </div>
    </div>
  )
}
function TabDistribution(){
  const [sc,setSc]=useState('base')
  const s=SCENARIOS[sc],rev=FIG.rev2025*(1+s.growth),r=calcReturns(rev)
  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',gap:5}}>
        {Object.entries(SCENARIOS).map(([k,sc2])=>(
          <button key={k} onClick={()=>setSc(k)} style={{padding:'6px 14px',fontSize:22,borderRadius:6,cursor:'pointer',background:sc===k?`${sc2.col}22`:'transparent',border:`1px solid ${sc===k?sc2.col:'rgba(201,168,76,0.25)'}`,color:sc===k?sc2.col:'var(--cream-dim)',transition:'all 0.15s'}}>{sc2.l}</button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <Card><STitle>Distribution Waterfall</STitle>
          {[['Operating Profit',r.profit,'#1565C0',''],['Less: Preferred Return',-FIG.investment*FIG.prefRate,'#B71C1C','8% Ã Â£150k â investor first'],['Less: A-Share Priority',-FIG.aShare,'#E67E22','Founder entity priority'],['Remaining Pool',r.rem,'#0D9488','Available for equity split'],['Investor Dividend (49%)',r.iDiv,'#C9A84C','49% Ã remaining pool'],['Founder Dividend (51%)',r.fDiv,'#4A5568','51% Ã remaining pool']].map(([l,v,c,n])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{width:3,height:30,background:c,borderRadius:2,flexShrink:0}} />
              <div style={{flex:1}}><div style={{fontSize:22,color:'var(--cream)'}}>{l}</div>{n&&<div style={{fontSize:19,color:'var(--cream-dim)'}}>{n}</div>}</div>
              <div style={{fontSize:22,color:v<0?'#E53935':c}}>{v<0?'â':''}{fmt(Math.abs(v))}</div>
            </div>
          ))}
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card highlight>
            <div style={{fontSize:19,color:'var(--gold-dim)',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.1em'}}>Total Investor Return Â· {s.l}</div>
            <div style={{fontSize:34,color:'var(--gold)',marginBottom:3}}>{fmt(r.total)}</div>
            <div style={{fontSize:22,color:'var(--cream-dim)'}}>Preferred {fmt(FIG.investment*FIG.prefRate)} + Dividend {fmt(r.iDiv)}</div>
          </Card>
          <Card>
            <Row label="Cash-on-Cash" value={pct(r.coc)} gold />
            <Row label="Payback Period" value={r.pb.toFixed(2)+' years'} />
            <Row label="Preferred (paid first)" value={fmt(FIG.investment*FIG.prefRate)} gold />
            <Row label="Equity Dividend" value={fmt(r.iDiv)} gold />
          </Card>
          <Card><STitle>Founder Position</STitle>
            <Row label="A-Share Priority" value={fmt(FIG.aShare)} />
            <Row label="Equity Dividend (51%)" value={fmt(r.fDiv)} />
            <Row label="Total Founder" value={fmt(FIG.aShare+r.fDiv)} />
          </Card>
          <div style={{fontSize:22,color:'var(--cream-dim)',lineHeight:1.6}}>Cash-flow driven â no exit required. Investor receives full return from Year 1 trading distributions only.</div>
        </div>
      </div>
    </div>
  )
}
function TabScenarios(){
  const [growth,setGrowth]=useState(15)
  const rev=FIG.rev2025*(1+growth/100),r=calcReturns(rev)
  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <Card highlight>
        <STitle>Revenue Growth Scenario Builder</STitle>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:19}}>
          <span style={{color:'var(--cream-dim)'}}>Growth vs 2025 base ({fmt(FIG.rev2025)})</span>
          <span style={{color:'var(--gold)',fontSize:22}}>{growth>0?'+':''}{growth}%</span>
        </div>
        <input type="range" min={-10} max={40} step={1} value={growth} onChange={e=>setGrowth(+e.target.value)} style={{width:'100%',accentColor:'var(--gold)',margin:'4px 0'}} />
        <div style={{display:'flex',justifyContent:'space-between',fontSize:17,color:'var(--gold-dim)',marginBottom:14}}><span>â10%</span><span>+15% base</span><span>+40%</span></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {[['Forecast Revenue',fmt(rev)],['Forecast Profit',fmt(r.profit)],['Investor Return',fmt(r.total)],['Cash-on-Cash',pct(r.coc)]].map(([l,v])=>(
            <div key={l} style={{textAlign:'center',padding:10,background:'var(--ink-3)',borderRadius:8}}>
              <div style={{fontSize:17,color:'var(--cream-dim)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'}}>{l}</div>
              <div style={{fontSize:19,color:'var(--gold)'}}>{v}</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {Object.entries(SCENARIOS).map(([k,s])=>{
          const sr=calcReturns(FIG.rev2025*(1+s.growth))
          return(
            <Card key={k}>
              <div style={{fontSize:17,textTransform:'uppercase',letterSpacing:'0.1em',color:s.col,marginBottom:8}}>{s.l}</div>
              <Row label="Revenue" value={fmt(FIG.rev2025*(1+s.growth))} />
              <Row label="Profit" value={fmt(sr.profit)} />
              <Row label="Investor Return" value={fmt(sr.total)} gold />
              <Row label="CoC" value={pct(sr.coc)} gold />
              <Row label="Payback" value={sr.pb.toFixed(1)+' yrs'} />
            </Card>
          )
        })}
      </div>
    </div>
  )
}
function TabMarketContext(){
  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <Card>
        <STitle>Market Benchmarks â EBITDA Multiples Â· CLFI, Houlihan Lokey, Moore Kingston Smith, UKHospitality 2024/25</STitle>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:16}}>
          {[['~5.3Ã','UK Mid-Market Average','Above this deal','var(--cream-dim)'],['~4.1Ã','Hospitality & Leisure Sector Avg','Broadly in line','var(--cream-dim)'],['~2â4Ã','Small Single-Site Venues','In range','var(--cream-dim)'],['~2â3Ã','Distressed Asset Range','Above â priced for risk','var(--cream-dim)'],['1.70Ã','No Dice Borough â This Deal','â Entry point','var(--gold)']].map(([v,l,n,c])=>(
            <div key={l} style={{padding:'12px 10px',borderRadius:8,textAlign:'center',background:c==='var(--gold)'?'rgba(201,168,76,0.1)':'var(--ink-3)',border:`1px solid ${c==='var(--gold)'?'rgba(201,168,76,0.4)':'rgba(255,255,255,0.06)'}`}}>
              <div style={{fontSize:22,color:c,marginBottom:5}}>{v}</div>
              <div style={{fontSize:19,color:'var(--cream-dim)',marginBottom:4,lineHeight:1.4}}>{l}</div>
              <div style={{fontSize:19,color:c==='var(--gold)'?'var(--gold)':'rgba(184,176,160,0.5)'}}>{n}</div>
            </div>
          ))}
        </div>
        <div style={{padding:'12px 14px',background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:8,fontSize:22,color:'var(--cream-dim)',lineHeight:1.6,marginBottom:14}}>
          <strong style={{color:'var(--gold)'}}>&#x2605; The Deal in One Line</strong><br/>
          A proven Borough Market experience venue, acquired at distressed pricing (1.70Ã EBITDA), delivering 8% guaranteed preferred return + equity participation, with payback driven by cash flow â not exit dependency.
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {[['â Not a multiple expansion bet','Returns driven by operating cash flow'],['â Cash-yielding from Day 1','Distributions begin at end of Year 1'],['â All 3 scenarios positive','Conservative through Optimistic']].map(([t,s])=>(
            <div key={t} style={{padding:10,background:'rgba(45,212,191,0.06)',border:'1px solid rgba(45,212,191,0.15)',borderRadius:7}}>
              <div style={{fontSize:22,color:'var(--teal)',marginBottom:3}}>{t}</div>
              <div style={{fontSize:17,color:'var(--cream-dim)'}}>{s}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <STitle>&#x26A0; Sector Reality â Honest Context</STitle>
        {[['Employer NICs rose 13.8% â 15% (April 2025)','Labour cost increases are built into the forecast model â not hidden'],['National Minimum Wage up 6.7% to Â£12.21/hr (April 2025)','Wage inflation modelled at 2025 actual base â no optimistic assumption'],['Business rates relief cut from 75% â 40% (2025/26)','Cost environment is baked in â not a pre-cost-shock baseline'],['UK hospitality recording ~2 site closures per day (2025)','Sector pressure creates acquisition opportunity at realistic pricing'],["Consumer behaviour shifting toward experience-led, low-alcohol spend","No Dice Borough's experience model directly aligns with this shift"],['PE firms cautious on single-country consumer exposure','Smaller investor opportunity â less institutional competition']].map(([issue,response])=>(
          <div key={issue} style={{padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{fontSize:22,color:'var(--cream)',marginBottom:2}}>âª {issue}</div>
            <div style={{fontSize:22,color:'var(--teal)',paddingLeft:12}}>â {response}</div>
          </div>
        ))}
      </Card>
      <Card>
        <STitle>&#x1F3C6; Why This Business is Different</STitle>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {[['&#x1F4C8;','Proven Revenue Base',fmt(FIG.rev2025)+' verified 2025 actuals. Not a projection.'],['&#x1F4CD;','Prime London Location','Borough Market SE1: top footfall destination. Highest avg revenue growth in East/Central London.'],['&#x1F3B1;','Experience-Led Format','Pool, board games, mini golf, DJ nights. Fastest-growing hospitality sub-sector.'],['&#x1F4B0;','Multiple Revenue Streams','Bar + activity pricing + events + corporate hire. Less dependent on drink-only margins.'],['&#x2122;&#xFE0F;','Brand IP Acquired','Plonk trading name, customer data and goodwill purchased. Not starting from zero.'],['&#x1F4E3;','Google Ads Engine','Â£0.32 CPC and verified ROAS from 2025 GA4 data. Scalable with proven unit economics.']].map(([icon,title,body])=>(
            <div key={title} style={{background:'var(--ink-3)',borderRadius:8,padding:14}}>
              <div style={{fontSize:19,marginBottom:6}} dangerouslySetInnerHTML={{__html:icon}} />
              <div style={{fontSize:22,color:'var(--cream)',fontWeight:500,marginBottom:4}}>{title}</div>
              <div style={{fontSize:17,color:'var(--cream-dim)',lineHeight:1.5}}>{body}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
function TabWages(){
  const [masterAdj,setMasterAdj]=useState(0)
  const adjustedRates=WAGES.map(w=>w.rate*(1+masterAdj/100))
  const totalWages=adjustedRates.reduce((sum,r,i)=>sum+r*WAGES[i].hrs,0)
  const delta=totalWages-242370
  const MON_W=[{m:'Jan',w:13566,r:56225},{m:'Feb',w:12038,r:56314},{m:'Mar',w:11696,r:58218},{m:'Apr',w:14649,r:53275},{m:'May',w:10558,r:46513},{m:'Jun',w:14862,r:59875},{m:'Jul',w:15934,r:60901},{m:'Aug',w:11862,r:56214},{m:'Sep',w:10877,r:56246},{m:'Oct',w:11607,r:53213},{m:'Nov',w:11604,r:62892},{m:'Dec',w:10117,r:121758}]
  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {[['Total Wage Bill 2025','Â£242,370','Monthly P&L'],['Total Hours','10,043 hrs','23 employees'],['Total Shifts','1,283 shifts','Avg 7.8 hrs/shift'],['Wages % Revenue','32.7%','Â£242,370 Ã· Â£741,644']].map(([l,v,s])=>(
          <Card key={l}><STitle>{l}</STitle><div style={{fontSize:22,color:'var(--gold)',marginBottom:3}}>{v}</div><div style={{fontSize:17,color:'var(--cream-dim)'}}>{s}</div></Card>
        ))}
      </div>
      <Card>
        <STitle>2025 Monthly Pattern Â· Wages % of Revenue</STitle>
        <div style={{display:'flex',alignItems:'flex-end',gap:3,height:80,marginBottom:6}}>
          {MON_W.map(m=>{const wp=m.w/m.r*100,h=Math.round(wp/35*75),col=wp>28?'#E53935':wp>22?'#E67E22':'#2DD4BF';return(<div key={m.m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}><div style={{width:'100%',height:h,background:col,borderRadius:'2px 2px 0 0',opacity:0.8,minHeight:4}} title={m.m+': '+wp.toFixed(1)+'%'} /></div>)})}
        </div>
        <div style={{display:'flex',gap:3,marginBottom:6}}>{MON_W.map(m=><div key={m.m} style={{flex:1,fontSize:22,color:'var(--cream-dim)',textAlign:'center'}}>{m.m}</div>)}</div>
        <div style={{display:'flex',gap:12,fontSize:17}}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:8,background:'#E53935',borderRadius:2,display:'inline-block',opacity:0.8}} />Above 28%</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:8,background:'#E67E22',borderRadius:2,display:'inline-block',opacity:0.8}} />22â28%</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:8,background:'#2DD4BF',borderRadius:2,display:'inline-block',opacity:0.8}} />Below 22%</span>
        </div>
      </Card>
      <Card highlight>
        <STitle>Adjust All Rates Simultaneously</STitle>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:22}}>
          <span style={{color:'var(--cream-dim)'}}>Shifts all four roles from their 2026 planning rate defaults</span>
          <span style={{color:'var(--gold)'}}>{masterAdj>0?'+':''}{masterAdj.toFixed(1)}%</span>
        </div>
        <input type="range" min={-20} max={20} step={0.5} value={masterAdj} onChange={e=>setMasterAdj(+e.target.value)} style={{width:'100%',accentColor:'var(--gold)',margin:'4px 0'}} />
        <div style={{display:'flex',justifyContent:'space-between',fontSize:17,color:'var(--gold-dim)',marginBottom:12}}><span>â20%</span><span>0%</span><span>+20%</span></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {[['Projected 2026 Wages',fmt(242370+delta)],['Delta vs 2025',`${delta>=0?'+':''}${fmt(delta)}`],['Wages % Forecast',((totalWages/FIG.forecastRev)*100).toFixed(1)+'%']].map(([l,v])=>(
            <div key={l} style={{textAlign:'center',padding:10,background:'var(--ink-3)',borderRadius:8}}>
              <div style={{fontSize:17,color:'var(--cream-dim)',marginBottom:3}}>{l}</div>
              <div style={{fontSize:22,color:'var(--gold)'}}>{v}</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {WAGES.map((w,i)=>{
          const effRate=w.rate*(1+masterAdj/100),annualCost=effRate*w.hrs
          return(
            <Card key={w.role}>
              <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr 1fr',gap:8,alignItems:'center'}}>
                <div><div style={{fontSize:19,color:'var(--cream)',marginBottom:3}}>{w.role}</div><div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:7,height:7,borderRadius:2,background:w.col}} /><span style={{fontSize:17,color:'var(--cream-dim)'}}>{w.hrs.toLocaleString()} hrs/yr</span></div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:19,color:'var(--cream-dim)'}}>Rate/hr</div><div style={{fontSize:19,color:'var(--gold)'}}>&#x00A3;{effRate.toFixed(2)}</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:19,color:'var(--cream-dim)'}}>Annual</div><div style={{fontSize:17,color:'var(--cream)'}}>{fmt(annualCost)}</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:19,color:'var(--cream-dim)'}}>Salary equiv</div><div style={{fontSize:22,color:'var(--cream-dim)'}}>&#x00A3;{Math.round(effRate*40*52).toLocaleString()}</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:19,color:'var(--cream-dim)'}}>vs NMW</div><div style={{fontSize:22,color:effRate>=w.min?'#2DD4BF':'#E53935'}}>{effRate>=w.min?'+':''}&#x00A3;{(effRate-w.min).toFixed(2)}</div></div>
              </div>
            </Card>
          )
        })}
      </div>
      <Card>
        <STitle>Three Improvement Strategies for 2026</STitle>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[['Reduce Jan/Feb shifts by 20%','Saves ~Â£2,700/yr','Jan: 30.6% â ~24% of revenue','Fewer doubles, shorter shifts in quiet months.'],['Shift Supervisor hours to Bar Staff rate','Saves ~Â£1,200/yr','AprâJul Supervisor cost Â£19,921','Review whether full Supervisor coverage needed on quiet weekdays.'],['Staff December to capacity','+Â£3,000 wages Â· more revenue captured','Dec 2025: 88 shifts Â· Â£121k rev','Adding 27 shifts captures significantly more peak revenue.']].map(([t,s,d,b])=>(
            <div key={t} style={{background:'var(--ink-3)',borderRadius:8,padding:14}}>
              <div style={{fontSize:22,color:'var(--cream)',fontWeight:500,marginBottom:4}}>{t}</div>
              <div style={{fontSize:22,color:'var(--gold)',marginBottom:6}}>{s}</div>
              <div style={{fontSize:17,color:'var(--cream-dim)',marginBottom:4}}>{d}</div>
              <div style={{fontSize:17,color:'var(--cream-dim)',lineHeight:1.5}}>{b}</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{fontSize:17,color:'var(--cream-dim)',lineHeight:1.5}}>NMW April 2025: Â£12.21/hr Â· All 2026 base rates above NMW Â· Rate hierarchy: Bar Staff Â£13.85 &lt; Supervisor Â£14.35 &lt; Asst Manager Â£15.38 &lt; Manager Â£18.00</div>
    </div>
  )
}
export default function BusinessExplorer(){
  const [tab,setTab]=useState('Overview')
  const components={'Overview':<TabOverview/>,'Performance':<TabPerformance/>,'Investor Returns':<TabInvestorReturns/>,'Distribution':<TabDistribution/>,'Scenarios':<TabScenarios/>,'Market Context':<TabMarketContext/>,'Wages':<TabWages/>}
  return(
    <div style={{minHeight:'100%',background:'var(--ink)',color:'var(--cream)'}}>
      <div style={{padding:'20px 32px 0',borderBottom:'1px solid rgba(201,168,76,0.12)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
          <div>
            <div style={{fontSize:22,color:'var(--gold)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:4}}>No Dice Borough Ltd</div>
            <div style={{fontSize:17,color:'var(--cream-dim)'}}>Business Explorer Â· Borough Market SE1</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:17,color:'var(--gold-dim)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:2}}>Investment Ask</div>
            <div style={{fontSize:22,color:'var(--gold)'}}>&#x00A3;150,000</div>
            <div style={{fontSize:22,color:'var(--cream-dim)'}}>for 49% equity</div>
          </div>
        </div>
        <div style={{display:'flex',gap:0,overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 16px',fontSize:22,cursor:'pointer',border:'none',background:'transparent',letterSpacing:'0.08em',textTransform:'uppercase',borderBottom:`2px solid ${tab===t?'var(--gold)':'transparent'}`,color:tab===t?'var(--gold)':'var(--cream-dim)',transition:'all 0.15s',whiteSpace:'nowrap'}}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{padding:'24px 32px 48px'}}>{components[tab]}</div>
      <div style={{padding:'8px 32px',borderTop:'1px solid rgba(201,168,76,0.08)',fontSize:17,color:'var(--gold-dim)',textAlign:'center'}}>Business Explorer Â· No Dice Borough LTD Â· All figures from verified financial model</div>
    </div>
  )
            }
