import React from 'react'
import { DEAL, USE_OF_FUNDS } from '../../data/hackney.js'

// UseOfFunds — clones Borough's structure: 5 fund items (visual breakdown +
// item cards), 3-card cash banner (Day 1 / Working Capital / VAT Reclaim),
// followed by two detail breakdowns (stock & operational setup grouped, then
// hardware itemised). Hackney's detail breakdowns are TBD pending workbook
// itemisation — placeholder rows render so the layout is visible and the
// data shape is locked in.

const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB')

// Hackney's 5 fund items mapped onto the visual structure.
// Colours mirror Borough's UseOfFunds palette so the bar chart reads similarly.
const FUND_META = {
  'Stock Purchase — Liquidators':       { color: '#4FC3F7', icon: '📦' },
  'Landlord — Rent Deposit (3 mo)':     { color: '#8B5CF6', icon: '🏠' },
  'Garden Refurbishment':                { color: '#2DD4BF', icon: '🌿' },
  'Interior Completion & Signage':       { color: '#C9A84C', icon: '🛠️' },
  'Legals, Restart & Working Capital':   { color: '#6B7280', icon: '💼' },
}

// Stock & Operational Setup — 4 group structure mirrors Borough's. Items in
// each group are TBD until the £42k stock purchase + £10k interior lines are
// itemised in the Hackney workbook.
const setupGroups = [
  { key: 'stock',      title: 'Opening Stock',             subtitle: 'Drink + bar consumables for Day 1 trading',  icon: '🥃', accent: '#A78BFA', vatLabel: 'inc VAT',     items: ['alcohol','soft','ice'] },
  { key: 'contracts',  title: 'Setup & Activation',        subtitle: 'Deep clean, kit setup, supplier deposits',   icon: '🛠️', accent: '#2DD4BF', vatLabel: 'inc VAT',     items: ['cleaning','internet','app','supplier'] },
  { key: 'subs',       title: '3-Month Software Pre-pays', subtitle: 'Cloud subscriptions for first quarter',      icon: '💻', accent: '#4FC3F7', vatLabel: 'inc VAT',     items: ['xero','rota','google','spotify'] },
  { key: 'regulatory', title: 'Pre-trading Regulatory',    subtitle: 'Council fees due before opening',            icon: '🏛️', accent: '#F59E0B', vatLabel: 'VAT-exempt',  items: ['rates','licence'] },
]

const setupItems = {
  alcohol:  { label: 'Alcohol stock (opening fill)',          icon: '🍾', amount: null },
  soft:     { label: 'Soft drinks, mixers & non-alcohol',     icon: '🥤', amount: null },
  ice:      { label: 'Ice supplies (first delivery)',         icon: '🧊', amount: null },
  cleaning: { label: 'Cleaning contracts restart',            icon: '🧽', amount: null },
  internet: { label: 'Internet — Starlink / BT Business',     icon: '📡', amount: null },
  app:      { label: 'Booking platform setup',                 icon: '📱', amount: null },
  xero:     { label: 'Xero accounting (3 months)',             icon: '📊', amount: null },
  rota:     { label: 'Rota Cloud — staff scheduling (3 mo)',   icon: '🗓️', amount: null },
  google:   { label: 'Google Workspace (3 months)',            icon: '🗂️', amount: null },
  spotify:  { label: 'Spotify Business (3 months)',            icon: '🎵', amount: null },
  supplier: { label: 'Supplier contract deposits',             icon: '🤝', amount: null },
  rates:    { label: 'Business rates (first month)',           icon: '🏛️', amount: null },   // Hackney Council, post-relief
  licence:  { label: 'Alcohol licence change (DPS)',           icon: '📜', amount: null },   // Hackney Licensing
}

// Stock Purchase £42,000 itemised breakdown — TBD pending liquidator inventory.
const hardwareItems = [
  { key:'barCellar', label: 'Bar equipment & cellar',  icon: '🍻', amount: null, note: 'Beer lines, fridges, glasswash, taps, ice machine, POS hardware' },
  { key:'kitchen',   label: 'Kitchen equipment',       icon: '🔪', amount: null, note: 'Counters, fridges, prep, small wares' },
  { key:'wetStock',  label: 'Glassware & wet stock',   icon: '🧰', amount: null, note: 'Glassware, cleaning chemicals, repair tools, hand-trolleys' },
  { key:'games',     label: 'Games & furniture',       icon: '🎱', amount: null, note: 'Pool tables, arcades, board game stock, seating, lighting' },
]

const fmtOrTbd = (n) => (n == null ? <span style={{ color:'var(--gold-dim)', fontWeight:400 }}>TBD</span> : fmt(n))

export default function UseOfFunds() {
  const investment = fmt(DEAL.investment)
  const funds = USE_OF_FUNDS.map(f => ({
    ...f,
    color: FUND_META[f.item]?.color ?? '#6B7280',
    icon:  FUND_META[f.item]?.icon  ?? '💼',
  }))

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 4px' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:12, color:'#4FC3F7', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>Use of Investment Funds</div>
        <h2 className="serif" style={{ fontSize:'clamp(2rem, 4vw, 3rem)', color:'var(--cream)', marginBottom:8 }}>Where Your {investment} Goes</h2>
        <p style={{ fontSize:14, color:'#9CA3AF' }}>Every pound deployed on Day 1 of reopening — no funds held in reserve outside the business.</p>
      </div>

      {/* Allocation chart + per-item cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:24 }}>
          <div style={{ fontSize:12, color:'#4FC3F7', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:20 }}>Fund Allocation — Visual Breakdown</div>
          <div style={{ display:'flex', height:32, borderRadius:6, overflow:'hidden', marginBottom:24 }}>
            {funds.map(f => (
              <div key={f.item} style={{ width:f.pct+'%', background:f.color }} title={`${f.item}: ${fmt(f.amount)}${f.vat ? ' ' + f.vat : ''} · ${f.pct}%`} />
            ))}
          </div>
          {funds.map(f => (
            <div key={f.item} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ width:12, height:12, borderRadius:2, background:f.color, flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:600, color:'var(--cream)', flex:1 }}>{f.item}</span>
                {f.vat && <span style={{ fontSize:10, color:f.color, border:`1px solid ${f.color}`, borderRadius:3, padding:'1px 6px' }}>{f.vat}</span>}
                <span style={{ fontSize:13, color:f.color, fontWeight:600, minWidth:36, textAlign:'right' }}>{f.pct}%</span>
                <span style={{ fontSize:13, fontWeight:700, color:f.color, minWidth:64, textAlign:'right' }}>{fmt(f.amount)}</span>
              </div>
              <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, marginLeft:20 }}>
                <div style={{ height:'100%', width:f.pct+'%', background:f.color, borderRadius:2 }} />
              </div>
            </div>
          ))}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', marginTop:8, paddingTop:12, display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--cream)', letterSpacing:'0.06em' }}>TOTAL INVESTMENT</span>
            <span style={{ fontSize:16, fontWeight:700, color:'#C9A84C' }}>{investment} inc VAT</span>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {funds.map(f => (
            <div key={f.item} style={{ background:'#0D1117', border:'1px solid #21262D', borderLeft:`3px solid ${f.color}`, borderRadius:8, padding:'14px 18px', display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ fontSize:22, flexShrink:0 }}>{f.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:'var(--cream)' }}>{f.item}</span>
                  <span style={{ fontSize:12, color:f.color, fontWeight:600, marginLeft:'auto' }}>{f.pct}%</span>
                  <span style={{ fontSize:14, fontWeight:700, color:f.color }}>{fmt(f.amount)}</span>
                </div>
                <div style={{ fontSize:12, color:'#9CA3AF', lineHeight:1.5 }}>{f.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3-card cash banner */}
      <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:'16px 20px', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--cream)', letterSpacing:'0.06em' }}>{investment} INC VAT TOTAL · 100% DEPLOYED DAY 1</div>
          {/* TBD: confirm Hackney VAT reclaim figure once startup VAT items finalised */}
          <div style={{ fontSize:12, color:'#9CA3AF' }}>VAT on startup costs reclaimed in Q1 — credited against first HMRC VAT return.</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          <div style={{ background:'rgba(234,88,12,0.1)', border:'1px solid rgba(234,88,12,0.3)', borderRadius:8, padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#EA580C', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>Day 1 Deployed</div>
            {/* Day 1 = Stock + Deposit + Garden + Interior = £90,750 */}
            <div style={{ fontSize:24, fontWeight:800, color:'#EA580C', marginBottom:4 }}>£90,750</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>Startup costs paid immediately</div>
          </div>
          <div style={{ background:'rgba(201,168,76,0.08)', border:'2px solid rgba(201,168,76,0.4)', borderRadius:8, padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#C9A84C', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>Working Capital</div>
            <div style={{ fontSize:24, fontWeight:800, color:'#C9A84C', marginBottom:4 }}>£9,250</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>Staged per cash flow model</div>
          </div>
          <div style={{ background:'rgba(45,212,191,0.08)', border:'1px solid rgba(45,212,191,0.3)', borderRadius:8, padding:'14px 18px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#2DD4BF', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>VAT Reclaim</div>
            {/* Excel: Cash Flow Forecast!B8 — May 2026 reclaim */}
            <div style={{ fontSize:24, fontWeight:800, color:'#2DD4BF', marginBottom:4 }}>£13,458</div>
            <div style={{ fontSize:12, color:'#9CA3AF' }}>Recovered Q1 — August 2026</div>
          </div>
        </div>
      </div>

      {/* Stock & Operational Setup — grouped detail */}
      <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:'20px 24px', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, color:'#2DD4BF', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>Stock & Operational Setup — Itemised</div>
            <h3 className="serif" style={{ fontSize:22, color:'var(--cream)', margin:0 }}>Day-1 Operations Breakdown</h3>
          </div>
          <div style={{ fontSize:11, color:'#9CA3AF', maxWidth:340, textAlign:'right' }}>Opening stock, contracts, 3-month subscription pre-pays, and pre-trading regulatory costs so the venue trades from Day 1. <strong style={{ color:'var(--gold-dim)' }}>Item amounts TBD — pending workbook itemisation.</strong></div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {setupGroups.map(g => {
            const hex = g.accent
            const bgRgba   = `${hex}0D`
            const borderRgba = `${hex}33`
            const knownItems = g.items.map(k => setupItems[k].amount).filter(a => a != null)
            const sub = knownItems.length === 0 ? null : knownItems.reduce((s, a) => s + a, 0)
            return (
              <div key={g.key} style={{ background:bgRgba, border:`1px solid ${borderRgba}`, borderRadius:8, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <div style={{ fontSize:18, lineHeight:1 }}>{g.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--cream)', letterSpacing:'0.04em' }}>{g.title}</div>
                  </div>
                  <span style={{ fontSize:9, color:hex, border:`1px solid ${hex}55`, borderRadius:3, padding:'1px 6px', letterSpacing:'0.06em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{g.vatLabel}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:hex, marginLeft:4, whiteSpace:'nowrap' }}>{fmtOrTbd(sub)}</span>
                </div>
                <div style={{ fontSize:10, color:'#9CA3AF', marginBottom:10, marginLeft:28 }}>{g.subtitle}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {g.items.map(itemKey => {
                    const item = setupItems[itemKey]
                    return (
                      <div key={itemKey} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0' }}>
                        <div style={{ fontSize:14, lineHeight:1, width:18, textAlign:'center', flexShrink:0 }}>{item.icon}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, color:'var(--cream)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</div>
                        </div>
                        <span style={{ fontSize:12, fontWeight:600, color:hex, flexShrink:0 }}>{fmtOrTbd(item.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stock Purchase — itemised £42,000 */}
      <div style={{ background:'#0D1117', border:'1px solid #21262D', borderRadius:10, padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, color:'#4FC3F7', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:4 }}>Stock Purchase from Liquidators — Itemised</div>
            <h3 className="serif" style={{ fontSize:22, color:'var(--cream)', margin:0 }}>£42,000 inc VAT</h3>
          </div>
          <div style={{ fontSize:11, color:'#9CA3AF', maxWidth:340, textAlign:'right' }}>Bar, kitchen, glassware and games purchased from liquidation at distressed pricing. <strong style={{ color:'var(--gold-dim)' }}>Per-line amounts TBD pending liquidator inventory.</strong></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10 }}>
          {hardwareItems.map(item => (
            <div key={item.key} style={{ background:'rgba(79,195,247,0.04)', border:'1px solid rgba(79,195,247,0.18)', borderRadius:6, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontSize:24, flexShrink:0, lineHeight:1 }}>{item.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--cream)', marginBottom:2 }}>{item.label}</div>
                <div style={{ fontSize:11, color:'#9CA3AF', lineHeight:1.4 }}>{item.note}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#4FC3F7' }}>{fmtOrTbd(item.amount)}</div>
                <div style={{ fontSize:9, color:'#6B7280', letterSpacing:'0.06em', textTransform:'uppercase' }}>per liquidator inventory</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
