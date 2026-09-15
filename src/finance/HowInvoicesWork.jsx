import React, { useState } from 'react'

const GOLD = '#C9A84C', LINE = 'rgba(201,168,76,0.22)', CARD = 'rgba(255,255,255,0.03)'
const DIM = 'rgba(255,255,255,0.6)', DIMMER = 'rgba(255,255,255,0.45)'

// ─── How a supplier invoice gets from the inbox into Xero ─────────────────────
//
// Written down because it was rebuilt three times before it worked, and each
// rebuild started by re-deriving the same facts. The facts are here now.
//
// The mistake worth remembering: for months this tried to match a document to a
// bank payment by finding an equal amount. That only ever works for card spend
// paid at the till. Trade suppliers invoice you and get paid later, often
// several invoices in one payment, so the amounts never line up — and no amount
// of better reading fixes that. Trade invoices have to become BILLS and let Xero
// do the matching. (Sep 2026)

const STEPS = [
  {
    n: '0',
    title: 'The mailbox',
    body: 'Only ever elliot@nodice.bar. Nothing is read from the personal Gmail or from elliot@plonkgolf.co.uk — Plonk is a different company and its invoices must never land in No Dice’s books.',
    tone: 'rule',
  },
  {
    n: '1',
    title: 'Three searches, not one clever rule',
    body: 'A single pattern can never find everything, because half the invoices come from people, not companies.',
    list: [
      ['By sender', 'A fixed list of supplier addresses — accounts@thedrinksclub.com, breww.email (Five Points), ebilling_uk@boc.com, sales@co2gas.co.uk, sales@dciron.co.uk, confirmation@screwfix.com, EMEA_Invoicing@email.apple.com, post.xero.com.'],
      ['By person', 'Freelancers, DJs and chefs invoice from personal addresses — smartinvoicing.ai (Cha Cha Cha), michael@bigfaceart.co.uk, bookings@pawelketarsis.com, and various iCloud/Gmail accounts. Found using the supplier names already in Xero.'],
      ['By attachment', 'Everything else carrying a PDF or image since June 2026, so nothing slips through a gap in the two lists above.'],
    ],
  },
  {
    n: '2',
    title: 'Throw out what was never an invoice',
    body: 'This is where the old version went wrong — it forwarded all of these to Xero and created ninety-five junk drafts.',
    list: [
      ['Order confirmations', 'The Drinks Club puts it in the subject line: “TDC Order 0000180715 — (This is not an Invoice)”.'],
      ['Lightspeed till reports', 'Five PDFs every single morning at 05:36. Around 500 of them. They look exactly like invoices to a machine.'],
      ['Statements', 'Kept, but never turned into a bill — a statement lists invoices you have already been billed for. Recording it again doubles the cost.'],
      ['Delivery notes and remittances', 'Nothing is owed, so there is nothing to record.'],
    ],
  },
  {
    n: '3',
    title: 'Read each one that survives',
    body: 'Supplier, invoice number, date and total are read off the document itself — not guessed from a pattern in the email. The old reader produced £5,000.00 from a credit limit and £272.47 from a monthly statement, and both went into Xero as real figures.',
  },
  {
    n: '4',
    title: 'Two destinations, decided by how it was paid',
    list: [
      ['Trade account → a Bill in Xero', 'Drinks Club, Five Points, Friendly Waste, BCS, Ice Ice Baby, Xero itself. They invoice, you pay later, often several invoices in one payment. Approve the bill and pay from it — then Xero matches the bank payment on its own and the document comes with it. This is the part that makes it automatic.'],
      ['Card spend → attached to the payment', 'Iceland, Lidl, taxis, Screwfix, Amazon. You paid the exact amount at the till, so the document is attached straight onto the bank line. No bill, no double count.'],
    ],
  },
  {
    n: '5',
    title: 'Never approve a bill for spend already coded',
    body: 'If a payment is already in the bank, coded and reconciled, and you then approve a bill for the same money, the cost is counted twice and the bill sits unpaid for ever. A draft bill on its own changes nothing in the accounts — leaving drafts alone is always safe. Approving them in bulk is not.',
    tone: 'warn',
  },
]

export default function HowInvoicesWork() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginTop: 18, border: `1px solid ${LINE}`, borderRadius: 12, background: CARD, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '14px 16px', background: 'transparent', border: 'none', color: '#fff',
          cursor: 'pointer', textAlign: 'left', font: 'inherit',
        }}>
        <span>
          <span style={{ fontSize: 15 }}>📬 How invoices get from your inbox into Xero</span>
          <span style={{ display: 'block', fontSize: 12, color: DIM, marginTop: 3 }}>
            What gets searched, what gets thrown away, and why a bill is not the same as a receipt
          </span>
        </span>
        <span style={{ color: GOLD, fontSize: 13, whiteSpace: 'nowrap' }}>{open ? 'Hide' : 'Read'}</span>
      </button>

      {open && (
        <div style={{ padding: '4px 16px 18px', borderTop: `1px solid ${LINE}` }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
              <div style={{
                flex: '0 0 26px', height: 26, borderRadius: 13, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 12, marginTop: 2,
                background: s.tone === 'warn' ? 'rgba(220,120,90,0.16)' : s.tone === 'rule' ? GOLD : 'rgba(255,255,255,0.07)',
                color: s.tone === 'rule' ? '#1a1509' : '#fff',
                fontWeight: s.tone === 'rule' ? 800 : 500,
              }}>{s.n}</div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, color: s.tone === 'warn' ? '#E8A18A' : '#fff' }}>{s.title}</div>
                {s.body && (
                  <div style={{ fontSize: 13, color: DIM, lineHeight: 1.6, marginTop: 5 }}>{s.body}</div>
                )}
                {s.list && (
                  <div style={{ display: 'grid', gap: 10, marginTop: s.body ? 12 : 8 }}>
                    {s.list.map(([head, detail]) => (
                      <div key={head}>
                        <div style={{ fontSize: 13, color: GOLD }}>{head}</div>
                        <div style={{ fontSize: 13, color: DIMMER, lineHeight: 1.6, marginTop: 2 }}>{detail}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div style={{ fontSize: 12, color: DIMMER, lineHeight: 1.6, paddingTop: 14 }}>
            Filing a receipt or an invoice never creates a payment. It only ever attaches evidence to money
            that has already left the bank, or records a bill you still owe.
          </div>
        </div>
      )}
    </div>
  )
}
