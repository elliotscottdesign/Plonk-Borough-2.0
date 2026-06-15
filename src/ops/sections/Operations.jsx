import React, { useState } from 'react'
import StockOrder from './StockOrder.jsx'
import StockList from './StockList.jsx'
import Perishables from './Perishables.jsx'
import Costing from './Costing.jsx'
import Consumables from './Consumables.jsx'

// Operations section — day-to-day tools. Stock Orders, Stock List, Perishables
// & Costing are live; the rest are on the roadmap and listed so the team can
// see what's coming.
const OPS_TOOLS = [
  { key: 'stock', label: 'Stock Orders', icon: '🛒', live: true, blurb: 'Kegs, spirits & softs to order this week, scaled from real till data.' },
  { key: 'stocklist', label: 'Stock List', icon: '📋', live: true, blurb: 'Every product behind the bar, by product, with never-sold lines flagged.' },
  { key: 'perishables', label: 'Perishables', icon: '🍋', live: true, blurb: 'Brakes fruit/veg spend & forecast — limes, garnish, the lot.' },
  { key: 'costing', label: 'Costing', icon: '💷', live: true, blurb: 'Live cost-per-serve and gross margin for every menu line. Editable.' },
  { key: 'consumables', label: 'Consumables', icon: '🧴', live: true, blurb: 'BCS Supplies operating costs — 14-month spend tracker, latest unit price, on-hand input.' },
  { key: 'pool',  label: 'Pool Tournament Nights', icon: '🎱', live: false, blurb: 'Run the internal pool competition — brackets, live scores, leaderboard, winners.' },
  { key: 'crm',   label: 'Community / CRM', icon: '🤝', live: false, blurb: 'Build the regulars list from Insta, Google, in-bar and events data.' },
  { key: 'help',  label: 'Daily Team Help', icon: '💬', live: false, blurb: 'Ad-hoc day-to-day help for you and the team.' },
]

export default function Operations() {
  // Deep-linkable sub-tool — /operations?tool=costing lands straight on the
  // margin sheet, /operations?tool=stocklist on the stock list, etc.
  // Falls back to Stock Orders when the param is missing or invalid.
  const initialTool = (() => {
    if (typeof window === 'undefined') return 'stock'
    const q = new URLSearchParams(window.location.search).get('tool')
    return OPS_TOOLS.some(t => t.key === q && t.live) ? q : 'stock'
  })()
  const [tool, setTool] = useState(initialTool)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {OPS_TOOLS.map(t => {
          const on = tool === t.key
          return (
            <button key={t.key} onClick={() => t.live && setTool(t.key)}
              title={t.live ? '' : 'Coming soon'}
              style={{
                padding: '9px 16px', borderRadius: 8, cursor: t.live ? 'pointer' : 'not-allowed',
                fontSize: 13, opacity: t.live ? 1 : 0.5,
                background: on ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${on ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
                color: on ? 'var(--gold)' : 'var(--cream)', fontWeight: on ? 600 : 400,
              }}>
              {t.icon} {t.label}{!t.live && <span style={{ fontSize: 10, marginLeft: 6, color: 'var(--cream-dim)' }}>soon</span>}
            </button>
          )
        })}
      </div>

      {tool === 'stock' && (
        <>
          <div className="serif" style={{ fontSize: 22, color: 'var(--cream)' }}>Stock Orders</div>
          <StockOrder />
        </>
      )}
      {tool === 'stocklist' && <StockList />}
      {tool === 'perishables' && <Perishables />}
      {tool === 'costing' && <Costing />}
      {tool === 'consumables' && <Consumables />}
    </div>
  )
}
