// No Dice Hackney — finance edge function (finance lane owns this file).
//
// Backs the /ops Receipts screen. Deploy with --no-verify-jwt: the frontend
// sends no Authorization header, same as every other portal function here.
//
// Design notes worth keeping:
//  * Photos go to a PRIVATE storage bucket. The browser never sees the service
//    key — it asks here for a one-shot signed upload URL and PUTs straight to
//    storage, so a large image never travels through this function.
//  * The date is always typed by a human. Nothing here reads a date off an
//    image. Hubdoc's OCR put two of twelve receipts in 2020 instead of 2026,
//    and one of those hid £48 of cost in the wrong financial year.
//  * A receipt is only ever evidence. Nothing here creates a bill or a payment
//    in Xero. Inventing transactions was the whole failure of what this
//    replaces.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SEND_SECRET  = Deno.env.get('SEND_SECRET') ?? ''
const BUCKET       = 'receipts'

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const CATEGORIES = ['business', 'staff_welfare', 'personal', 'competitor']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  let p: Record<string, any> = {}
  try { p = await req.json() } catch { return json({ error: 'Bad request' }, 400) }

  // Everything here is founder/manager territory, reached through the already
  // gated /ops shell.
  if (!SEND_SECRET || p.secret !== SEND_SECRET) return json({ error: 'Unauthorized' }, 401)

  try {
    switch (p.action) {

      /* ---------------------------------------------------------------- */
      case 'receiptsList': {
        const days = Math.min(Number(p.days) || 90, 400)
        const from = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10)
        const { data, error } = await db.from('receipts')
          .select('*').gte('spend_date', from).neq('status', 'void')
          .order('spend_date', { ascending: false }).order('created_at', { ascending: false })
        if (error) throw error

        // Signed view links so the founder can actually look at the photos.
        // Short-lived on purpose — the bucket stays private.
        const rows = await Promise.all((data ?? []).map(async (r: any) => {
          if (!r.image_path) return r
          const { data: s } = await db.storage.from(BUCKET).createSignedUrl(r.image_path, 3600)
          return { ...r, image_url: s?.signedUrl ?? null }
        }))
        return json({ ok: true, receipts: rows })
      }

      /* ---------------------------------------------------------------- */
      // One-shot signed URL. The browser PUTs the photo straight to storage.
      case 'receiptUploadUrl': {
        const safe = String(p.filename || 'receipt.jpg').replace(/[^A-Za-z0-9._-]/g, '_').slice(-60)
        const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}_${safe}`
        const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path)
        if (error) throw error
        return json({ ok: true, path, signedUrl: data.signedUrl, token: data.token })
      }

      /* ---------------------------------------------------------------- */
      case 'receiptAdd': {
        const supplier  = String(p.supplier || '').trim()
        const spendDate = String(p.spendDate || '').trim()
        const amount    = Number(p.amount)
        const category  = CATEGORIES.includes(p.category) ? p.category : 'business'

        if (!supplier) return json({ error: 'Who did you pay?' }, 400)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(spendDate)) return json({ error: 'Need a date' }, 400)
        if (!(amount > 0)) return json({ error: 'Need an amount' }, 400)

        // A competitor check without the numbers is just a story, and it is the
        // note written at the time that makes the claim stand up. Refuse a
        // half-filled one rather than let it look documented when it isn't.
        if (category === 'competitor' && (!String(p.compItem || '').trim() || !(Number(p.compPrice) > 0))) {
          return json({ error: 'A competitor check needs their item and their price' }, 400)
        }

        const row = {
          supplier, spend_date: spendDate, amount, category,
          note: String(p.note || '').trim() || null,
          staff_id: p.staffId || null,
          staff_name: String(p.staffName || '').trim() || null,
          image_path: p.imagePath || null,
          comp_item:    category === 'competitor' ? (String(p.compItem || '').trim() || null) : null,
          comp_price:   category === 'competitor' && Number(p.compPrice) > 0 ? Number(p.compPrice) : null,
          our_price:    category === 'competitor' && Number(p.ourPrice)  > 0 ? Number(p.ourPrice)  : null,
          comp_verdict: category === 'competitor' ? (String(p.compVerdict || '').trim() || null) : null,
        }

        const { data, error } = await db.from('receipts').insert(row).select().single()
        if (error) throw error
        return json({ ok: true, receipt: data })
      }

      /* ---------------------------------------------------------------- */
      case 'receiptUpdate': {
        if (!p.id) return json({ error: 'Which one?' }, 400)
        const patch: Record<string, any> = {}
        for (const k of ['supplier', 'note', 'comp_item', 'comp_verdict']) {
          if (p[k] !== undefined) patch[k] = String(p[k] || '').trim() || null
        }
        if (p.category !== undefined && CATEGORIES.includes(p.category)) patch.category = p.category
        if (p.amount !== undefined && Number(p.amount) > 0) patch.amount = Number(p.amount)
        if (p.spendDate !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(p.spendDate)) patch.spend_date = p.spendDate
        if (p.status !== undefined) {
          patch.status = p.status
          if (p.status === 'attached') patch.attached_at = new Date().toISOString()
          if (p.status === 'filed')    patch.filed_at    = new Date().toISOString()
        }
        if (!Object.keys(patch).length) return json({ error: 'Nothing to change' }, 400)

        const { data, error } = await db.from('receipts').update(patch).eq('id', p.id).select().single()
        if (error) throw error
        return json({ ok: true, receipt: data })
      }

      /* ---------------------------------------------------------------- */
      // Soft delete. Nothing is ever really removed — a receipt that vanishes
      // is worse than one filed wrongly.
      case 'receiptVoid': {
        if (!p.id) return json({ error: 'Which one?' }, 400)
        const { error } = await db.from('receipts').update({ status: 'void' }).eq('id', p.id)
        if (error) throw error
        return json({ ok: true })
      }

      /* ---------------------------------------------------------------- */
      // Names for the "filed by" picker, so every receipt has an owner.
      case 'receiptStaff': {
        const { data, error } = await db.from('staff')
          .select('id, name, active').eq('active', true).order('name')
        if (error) return json({ ok: true, staff: [] })   // never block filing over this
        return json({ ok: true, staff: data ?? [] })
      }

      /* ---------------------------------------------------------------- */
      // What the money is doing, split the way the founder asked.
      case 'receiptSummary': {
        const days = Math.min(Number(p.days) || 90, 400)
        const from = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10)
        const { data, error } = await db.from('receipts')
          .select('category, amount').gte('spend_date', from).neq('status', 'void')
        if (error) throw error
        const out: Record<string, { n: number; total: number }> = {}
        for (const r of data ?? []) {
          const k = r.category || 'business'
          out[k] = out[k] || { n: 0, total: 0 }
          out[k].n++
          out[k].total += Number(r.amount) || 0
        }
        return json({ ok: true, summary: out })
      }

      default:
        return json({ error: 'Unknown action' }, 400)
    }
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500)
  }
})
