import React, { useState } from 'react'
import StockOrder from './StockOrder.jsx'
import StockList from './StockList.jsx'
import StockCheck from './StockCheck.jsx'
import Perishables from './Perishables.jsx'
import Costing from './Costing.jsx'
import Consumables from './Consumables.jsx'
import Suppliers from './Suppliers.jsx'
import CocktailSpecs from './CocktailSpecs.jsx'
import TillGuide from './TillGuide.jsx'
import useIsMobile from '../../lib/useIsMobile.js'

// Operations section — day-to-day tools. Stock Orders, Stock List, Perishables
// & Costing are live; the rest are on the roadmap and listed so the team can
// see what's coming.
const OPS_TOOLS = [
  { key: 'stock', label: 'Stock Orders', icon: '🛒', live: true, blurb: 'Kegs, spirits & softs to order this week, scaled from real till data.' },
  { key: 'stocklist', label: 'Stock List', icon: '📋', live: true, blurb: 'Every product behind the bar, by product, with never-sold lines flagged.' },
  { key: 'stockcheck', label: 'Stock Check', icon: '✅', live: true, blurb: 'Weekly count-and-order sheet — draught, cider, post-mix, fresh, wine, snacks. Printable.' },
  { key: 'perishables', label: 'Perishables', icon: '🍋', live: true, blurb: 'Brakes fruit/veg spend & forecast — limes, garnish, the lot.' },
  { key: 'costing', label: 'Costing', icon: '💷', live: true, blurb: 'Live cost-per-serve and gross margin for every menu line. Editable.' },
  { key: 'consumables', label: 'Consumables', icon: '🧴', live: true, blurb: 'BCS Supplies operating costs — 14-month spend tracker, latest unit price, on-hand input.' },
  { key: 'suppliers', label: 'Suppliers', icon: '📇', live: true, blurb: 'Directory of every supplier — addresses, contacts, 1-click trade portal launcher.' },
  { key: 'cocktailspecs', label: 'Cocktail Specs', icon: '🍸', live: true, blurb: 'Every house cocktail recipe — pours, glassware, build rules. Printable.' },
  { key: 'till', label: 'Till', icon: '🧾', live: true, blurb: 'How to add new products to the Lightspeed till so they ring up correctly.' },
  // (Pool tournaments graduated to the Events group's Tournament tab — card removed.)
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
  const isMobile = useIsMobile()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* On phones the tool tabs are a single swipeable row instead of a 9-row
          wrapped wall that buries the content. */}
      <div style={{ display: 'flex', gap: 8, flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? 4 : 0, WebkitOverflowScrolling: 'touch' }}>
        {OPS_TOOLS.map(t => {
          const on = tool === t.key
          return (
            <button key={t.key} onClick={() => t.live && setTool(t.key)}
              title={t.live ? '' : 'Coming soon'}
              style={{
                padding: isMobile ? '10px 15px' : '9px 16px', borderRadius: 8, cursor: t.live ? 'pointer' : 'not-allowed',
                fontSize: 13, opacity: t.live ? 1 : 0.5, flexShrink: 0, whiteSpace: 'nowrap',
                background: on ? 'rgba(201,168,76,0.16)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${on ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
                color: on ? 'var(--gold)' : 'var(--cream)', fontWeight: on ? 600 : 400,
              }}>
              {t.icon} {t.label}{!t.live && <span style={{ fontSize: 10, marginLeft: 6, color: 'var(--cream-dim)' }}>soon</span>}
            </button>
          )
        })}
      </div>

      {/* No Dice wordmark for the stock tools — Costing/Consumables/Suppliers/
          Cocktail Specs already self-brand via OpsBrandHeader, so only the bare
          ones need it here (keeps the backend branded like DJ Bookings). */}
      {['stock', 'stocklist', 'perishables'].includes(tool) && (
        <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 'min(190px, 54vw)', height: 'auto', display: 'block' }} />
      )}

      {tool === 'stock' && (
        <>
          <div className="serif" style={{ fontSize: 22, color: 'var(--cream)' }}>Stock Orders</div>
          <StockOrder />
        </>
      )}
      {tool === 'stocklist' && <StockList />}
      {tool === 'stockcheck' && <StockCheck />}
      {tool === 'perishables' && <Perishables />}
      {tool === 'costing' && <Costing />}
      {tool === 'consumables' && <Consumables />}
      {tool === 'suppliers' && <Suppliers />}
      {tool === 'cocktailspecs' && <CocktailSpecs />}
      {tool === 'till' && <TillGuide />}
    </div>
  )
}
