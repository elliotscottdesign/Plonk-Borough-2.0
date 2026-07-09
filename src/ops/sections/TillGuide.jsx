import React from 'react'

// Till (Lightspeed K-Series) — how to add new products to the tills.
// A colour-coded, scannable SOP (from the No Dice standard operating procedure)
// with working links to the Lightspeed help centre + a video walkthrough.

const TONES = {
  info: { bg: 'rgba(45,212,191,0.08)',  border: 'rgba(45,212,191,0.45)', label: '#2DD4BF' },
  tip:  { bg: 'rgba(201,168,76,0.10)',  border: 'rgba(201,168,76,0.55)', label: 'var(--gold)' },
  warn: { bg: 'rgba(218,27,51,0.10)',   border: 'rgba(218,27,51,0.5)',   label: '#F87171' },
}

function Callout({ tone = 'info', title, children }) {
  const c = TONES[tone]
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderLeft: `4px solid ${c.border}`, borderRadius: 10, padding: '14px 16px' }}>
      {title && <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: c.label, marginBottom: 7, textTransform: 'uppercase' }}>{title}</div>}
      <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--cream)' }}>{children}</div>
    </div>
  )
}

// A UI path pill, e.g. Menu ▸ Item list — makes the clicks scannable.
const Path = ({ children }) => (
  <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 5, padding: '1px 7px', fontSize: 12.5, fontWeight: 600, color: 'var(--cream)', whiteSpace: 'nowrap' }}>{children}</span>
)

const A = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2DD4BF', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid rgba(45,212,191,0.4)' }}>{children}</a>
)

function Steps({ items }) {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--gold)', color: 'var(--ink)', fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
          <span style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--cream)' }}>{it}</span>
        </li>
      ))}
    </ol>
  )
}

const H = ({ children }) => <div className="serif" style={{ fontSize: 22, color: 'var(--cream)', marginTop: 10 }}>{children}</div>

// A numbered method card with a coloured header band.
function Method({ n, accent, title, tag, children }) {
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', background: `${accent}14`, borderBottom: `1px solid ${accent}44` }}>
        <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: accent, color: '#0A0A0F', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cream)' }}>{title}</div>
          {tag && <div style={{ fontSize: 11.5, color: 'var(--cream-dim)' }}>{tag}</div>}
        </div>
      </div>
      <div style={{ padding: '15px 16px' }}>{children}</div>
    </div>
  )
}

const GLOSSARY = [
  ['Item List', 'Your master library of every product. Creating an item here does NOT put it on a till.'],
  ['Menu', 'What shows on a till screen. An item must be on a menu before it can be sold.'],
  ['Linked / Not linked', '“Linked” = the item is on one or more menus. “Not linked” = it exists but isn’t on any till yet.'],
  ['Accounting group', 'Mandatory category that sets the tax rate and where the item prints (bar / kitchen). E.g. Drinks, Food.'],
  ['Main screen / Sub-screen', 'The layout of buttons on the POS — which screen and section the item button sits in.'],
]

export default function TillGuide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 760 }}>
      <img src="/nodice-wordmark.png" alt="No Dice" style={{ width: 'min(190px, 54vw)', height: 'auto', display: 'block' }} />

      <div>
        <div className="serif" style={{ fontSize: 27, color: 'var(--cream)', lineHeight: 1.1 }}>🧾 Adding new products to the till</div>
        <div style={{ fontSize: 13.5, color: 'var(--cream-dim)', marginTop: 5 }}>Lightspeed Restaurant (K-Series) · how to add an item so it appears and rings up correctly on the tills.</div>
      </div>

      <Callout tone="info" title="Read this first — the two-step idea">
        In Lightspeed, <strong>creating a product</strong> and <strong>putting it on a till</strong> are two separate things — getting this avoids the most common mistake.
        <ul style={{ margin: '9px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
          <li>The <strong>Item List</strong> is your master library — everything you sell.</li>
          <li>A <strong>Menu</strong> is what actually shows on a till screen. An item only rings up once it’s on a menu.</li>
        </ul>
        <div style={{ marginTop: 9 }}>An item that exists but isn’t on a menu shows <strong style={{ color: '#F87171' }}>“Not linked”</strong> and <strong>can’t be sold</strong>. So every new product needs <strong>both</strong>: create the item, <em>then</em> add it to the right menu.</div>
      </Callout>

      <H>Before you start</H>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--cream)' }}>🔑 <strong>Log in</strong> to the Back Office at <A href="https://manager.lsk.lightspeed.app">manager.lsk.lightspeed.app</A> with your Lightspeed details. Some actions (like bulk adds) need an admin login.</div>
        <Callout tone="tip" title="Do this first — accounting groups">
          Every item must belong to an <strong>accounting group</strong> (Drinks, Food, Alcohol…). This sets its <strong>tax rate</strong> and <strong>where it prints</strong> (bar or kitchen). Make sure the right group exists <em>before</em> creating items — set them up under <Path>Menu ▸ Accounting groups</Path>. <A href="https://k-series-support.lightspeedhq.com/hc/en-us/articles/25623969715995-Creating-and-editing-item-groups">Groups help →</A>
        </Callout>
      </div>

      <H>Three ways to add a product</H>

      <Method n="1" accent="#2DD4BF" title="Quick create" tag="Single item — the everyday method">
        <div style={{ fontSize: 13.5, color: 'var(--cream-dim)', marginBottom: 12 }}>Fastest way to add one product. Captures the essentials: name, group, price, and (optionally) the menu.</div>
        <Steps items={[
          <>Go to <Path>Menu ▸ Item list</Path>.</>,
          <>Click <strong>Quick create item</strong>.</>,
          <>Enter the <strong>Item name</strong> (e.g. “Olivers Cider – Pear”).</>,
          <>Choose the <strong>Accounting group</strong> (e.g. Drinks) — sets tax + print location.</>,
          <>Enter the <strong>Price</strong>. (Leave blank only if staff should type a price each time.)</>,
          <>To put it straight on a till, pick a <strong>Menu</strong>, then the <strong>Main screen</strong> and <strong>Sub-screen</strong> where the button should sit.</>,
          <>Click <strong>Create</strong>.</>,
        ]} />
        <div style={{ marginTop: 12 }}>
          <Callout tone="tip" title="One-step shortcut">
            If you pick a menu in step 6, the item is created <strong>and</strong> linked in one go — no separate linking step. Skip it and the item shows <strong style={{ color: '#F87171' }}>“Not linked”</strong> until you add it (see Method 3).
          </Callout>
        </div>
      </Method>

      <Method n="2" accent="#C9A84C" title="Detailed create" tag="When you need more control">
        <div style={{ fontSize: 13.5, color: 'var(--cream-dim)', marginBottom: 12 }}>Use when the item needs extra setup — button colour, allergens, an image, modifiers, courses, or stock tracking.</div>
        <Steps items={[
          <>Go to <Path>Menu ▸ Item list</Path> → <strong>Create ▸ Single item</strong>.</>,
          <>Fill in the tabs across the top as needed (below).</>,
          <>On the <strong>Details</strong> tab use <strong>Add item to menu</strong> → pick the menu + sub-screen → <strong>Add to menu</strong>.</>,
          <>Click <strong>Save</strong>.</>,
        ]} />
        <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
          {[
            ['Details', 'Name, price, accounting group, and the menus it appears on.'],
            ['Reporting', 'Optional statistic categories for custom reports.'],
            ['POS Settings', 'Button name & colour, discountable, course, etc.'],
            ['Appearance', 'Description, image, and allergen info shown on the POS / Order Anywhere.'],
            ['Production instructions', 'The name printed on kitchen / bar dockets.'],
            ['Inventory', 'Cost price, barcode & stock tracking (only if Stock is enabled).'],
          ].map(([t, d]) => (
            <div key={t} style={{ display: 'flex', gap: 10, fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ flexShrink: 0, minWidth: 128, fontWeight: 700, color: 'var(--gold)' }}>{t}</span>
              <span style={{ color: 'var(--cream)' }}>{d}</span>
            </div>
          ))}
        </div>
      </Method>

      <Method n="3" accent="#F87171" title="Link a “Not linked” item" tag="When the product exists but isn’t on any till">
        <Steps items={[
          <>Go to <Path>Menu ▸ Item list</Path> and find the item.</>,
          <>Click the item name (or the <strong>•••</strong> on its row) to open it.</>,
          <>On the <strong>Details</strong> tab, click <strong>Add item to menu</strong>.</>,
          <>Select the correct <strong>menu</strong> and <strong>sub-screen</strong>.</>,
          <>Click <strong>Add to menu</strong>, then <strong>Save</strong>.</>,
        ]} />
        <div style={{ fontSize: 13, color: 'var(--cream-dim)', margin: '10px 0 0' }}>The status changes from “Not linked” to the number of menus it now appears on.</div>
        <div style={{ marginTop: 12 }}>
          <Callout tone="tip" title="Faster for many items">
            To link several at once: on the Item List, tick the checkboxes, then <Path>Actions ▸ Add to menu</Path> and choose the menu.
          </Callout>
        </div>
      </Method>

      <H>Always test on the till ✅</H>
      <Callout tone="warn" title="Before you rely on it in service">
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Open the Lightspeed app on the till / iPad.</li>
          <li>Go to the menu and screen where you placed the item.</li>
          <li>Check the button appears with the <strong>correct name and price</strong>.</li>
          <li>Ring a <strong>test order</strong> and confirm it prints to the right place (bar or kitchen).</li>
        </ol>
        <div style={{ marginTop: 9, fontSize: 13, color: 'var(--cream-dim)' }}>If the change doesn’t show straight away, the till may need a quick sync/refresh — items publish to devices shortly after saving.</div>
      </Callout>

      <H>Quick checklist for every new product</H>
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          'Accounting group exists and is correct (tax + print location).',
          'Item created in Menu ▸ Item list with correct name and price.',
          'Item added to the right menu & sub-screen (no longer “Not linked”).',
          'Allergen / description added if customers ask about it.',
          'Tested on the till: appears, correct price, prints to the right place.',
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14, lineHeight: 1.5, color: 'var(--cream)' }}>
            <span style={{ color: '#2DD4BF', fontWeight: 800 }}>☐</span><span>{t}</span>
          </div>
        ))}
      </div>

      <H>Quick glossary</H>
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        {GLOSSARY.map(([term, mean], i) => (
          <div key={term} style={{ display: 'flex', gap: 12, padding: '11px 15px', borderTop: i ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
            <span style={{ flexShrink: 0, minWidth: 132, fontWeight: 700, fontSize: 13.5, color: 'var(--gold)' }}>{term}</span>
            <span style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--cream)' }}>{mean}</span>
          </div>
        ))}
      </div>

      <H>Helpful links 🔗</H>
      <div style={{ background: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
        <div>▶️ <A href="https://www.youtube.com/watch?v=8TkScVEph-E">Video: Quick Add Items (K-Series)</A> — a 2-minute walkthrough of Method 1.</div>
        <div>📄 <A href="https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804604870-Creating-and-editing-items">Creating & editing items</A> — the full official guide (both quick and detailed create).</div>
        <div>📄 <A href="https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804513170-Creating-items-and-menus">Creating items and menus</A> — items + menus together.</div>
        <div>📄 <A href="https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804656649-Creating-menus">Creating menus</A> — building & editing the till screens.</div>
        <div>📄 <A href="https://k-series-support.lightspeedhq.com/hc/en-us/articles/25623969715995-Creating-and-editing-item-groups">Item groups</A> — grouping products (e.g. a range of ciders).</div>
        <div>📄 <A href="https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804647349-About-menus-and-items">About menus & items</A> — how the pieces fit together.</div>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--cream-dim)', fontStyle: 'italic' }}>Source: Lightspeed Restaurant (K-Series) Help Centre — “Creating and editing items” &amp; “About menus and items”.</div>
    </div>
  )
}
