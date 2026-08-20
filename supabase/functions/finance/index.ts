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

const escapeHtml = (s: unknown) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * What a competitor check must carry to be worth claiming. Returns the missing
 * piece, or null if it is complete. Used on the way in AND when something is
 * re-tagged to 'competitor' later — otherwise a tap in the list would create a
 * competitor claim with no numbers behind it at all.
 */
function competitorGap(r: { comp_item?: any; comp_price?: any; comp_verdict?: any }): string | null {
  if (!String(r.comp_item || '').trim())  return 'A competitor check needs their item'
  if (!(Number(r.comp_price) > 0))        return 'A competitor check needs their price'
  if (!String(r.comp_verdict || '').trim()) return 'A competitor check needs your note — what did you conclude?'
  return null
}

/* ────────────────────────────────────────────────────────────────────────── */
/* XERO CONNECTION                                                            */
/*                                                                            */
/* A standard OAuth2 web app rather than a paid Custom Connection. It is      */
/* authorised once through a browser and then keeps itself alive: the access  */
/* token lasts 30 minutes, the refresh token rotates on every use and only    */
/* dies after 60 days unused, which the daily sweep prevents.                 */
/* ────────────────────────────────────────────────────────────────────────── */

const XERO_ID     = Deno.env.get('XERO_CLIENT_ID') ?? ''
const XERO_SECRET = Deno.env.get('XERO_CLIENT_SECRET') ?? ''
const XERO_REDIRECT = `${SUPABASE_URL.replace('.supabase.co', '.supabase.co')}/functions/v1/finance`
// EXACTLY the three scopes this app is provisioned for, and no more. Asking
// for anything else — accounting.transactions, accounting.reports.read —
// gets invalid_scope and a 500 from the authorise endpoint, which reads like
// a broken link rather than a permissions problem. Verified one by one
// against Xero on 19 Aug 2026.
//
// accounting.banktransactions is also the RIGHT scope here: narrower than
// accounting.transactions, and bank transactions are all this touches.
const XERO_SCOPES = [
  'openid', 'profile', 'email',
  'accounting.banktransactions',  // find the bank payment a receipt belongs to
  'accounting.attachments',       // attach the file to it
  'accounting.settings.read',     // read the chart of accounts
  'offline_access',               // the refresh token — without this it dies in 30 minutes
].join(' ')

const basicAuth = () => btoa(`${XERO_ID}:${XERO_SECRET}`)

async function xeroRow() {
  const { data } = await db.from('xero_auth').select('*').eq('id', 1).maybeSingle()
  return data
}

/** A valid access token, refreshed if the current one is stale or nearly so. */
async function xeroAccessToken(): Promise<string | null> {
  const row = await xeroRow()
  if (!row?.refresh_token) return null

  // 60s of headroom so a token can't expire mid-request.
  if (row.access_token && row.expires_at && new Date(row.expires_at).getTime() - 60_000 > Date.now()) {
    return row.access_token
  }

  const res = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${basicAuth()}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: row.refresh_token }),
  })
  if (!res.ok) return null
  const t = await res.json()

  // Xero rotates the refresh token on every use — store the new one or the
  // next refresh fails and the connection is dead.
  await db.from('xero_auth').update({
    access_token: t.access_token,
    refresh_token: t.refresh_token ?? row.refresh_token,
    expires_at: new Date(Date.now() + (t.expires_in ?? 1800) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', 1)

  return t.access_token
}

/** Staff-side auth: the same token the rota portal issues. */
async function staffFromToken(token: unknown) {
  const t = String(token || '').trim()
  if (t.length < 8) return null
  const { data } = await db.from('staff')
    .select('id, name, active').eq('token', t).eq('active', true).maybeSingle()
  return data ?? null
}

// Supabase's gateway forces text/plain with nosniff on function responses, so
// HTML arrives as visible source. Don't fight it: send the browser somewhere
// that can actually render, and keep plain words for anything that goes wrong.
const HUB = 'https://team.nodice.bar/ops?tab=receipts'

const goToHub = (status: string) =>
  new Response(null, { status: 302, headers: { Location: `${HUB}&xero=${status}` } })

const say = (text: string) =>
  new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  /* ── Xero sends the browser back here after you approve the connection ── */
  if (req.method === 'GET') {
    const u = new URL(req.url)
    const code = u.searchParams.get('code')
    const state = u.searchParams.get('state')
    if (!code) return say('No Dice finance service. Nothing to see here.')

    const row = await xeroRow()
    if (!row?.pending_state || row.pending_state !== state) {
      return say('That link has already been used, or it has expired. Ask Claude for a fresh one.')
    }

    const res = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${basicAuth()}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: XERO_REDIRECT }),
    })
    if (!res.ok) return say('Could not connect. Xero said: ' + (await res.text()))
    const t = await res.json()

    // Which organisation did they actually pick?
    const conn = await fetch('https://api.xero.com/connections', {
      headers: { Authorization: `Bearer ${t.access_token}`, 'Content-Type': 'application/json' },
    })
    const tenants = conn.ok ? await conn.json() : []
    const tenant = tenants[0]

    await db.from('xero_auth').update({
      tenant_id: tenant?.tenantId ?? null,
      tenant_name: tenant?.tenantName ?? null,
      refresh_token: t.refresh_token,
      access_token: t.access_token,
      expires_at: new Date(Date.now() + (t.expires_in ?? 1800) * 1000).toISOString(),
      pending_state: null,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', 1)

    // Straight back into the hub, connected. No dead-end page to close.
    return goToHub('connected')
  }

  let p: Record<string, any> = {}
  try { p = await req.json() } catch { return json({ error: 'Bad request' }, 400) }

  /* ── Staff-token actions: a person acting on their OWN tips ──────────── */
  if (p.action === 'tipsMine' || p.action === 'tipConfirm') {
    const me = await staffFromToken(p.token)
    if (!me) return json({ error: 'Unauthorized' }, 401)

    if (p.action === 'tipsMine') {
      const { data, error } = await db.from('tip_payouts')
        .select('*').eq('staff_id', me.id).order('month', { ascending: false })
      if (error) throw error
      return json({ ok: true, payouts: data ?? [] })
    }

    // Confirming receipt. Scoped to their own id, so a token can only ever
    // acknowledge its owner's money. You cannot confirm what has not been
    // paid — that would turn the record into a fiction.
    const month = String(p.month || '')
    if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: 'Which month?' }, 400)
    const { data: row } = await db.from('tip_payouts')
      .select('id, paid_at').eq('staff_id', me.id).eq('month', month).maybeSingle()
    if (!row) return json({ error: 'Nothing recorded for that month' }, 404)
    if (!row.paid_at) return json({ error: "That hasn't been paid out yet" }, 400)

    const { data, error } = await db.from('tip_payouts')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('id', row.id).select().single()
    if (error) throw error
    return json({ ok: true, payout: data })
  }

  // Everything else is founder/manager territory, reached through the already
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
        // The verdict is mandatory for the same reason the price is: an
        // inspector's question is "what did you actually conclude?", and an
        // answer written months later is worth nothing.
        if (category === 'competitor') {
          const bad = competitorGap({
            comp_item: p.compItem, comp_price: p.compPrice, comp_verdict: p.compVerdict,
          })
          if (bad) return json({ error: bad }, 400)
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
        if (p.compPrice !== undefined) patch.comp_price = Number(p.compPrice) > 0 ? Number(p.compPrice) : null
        if (p.ourPrice  !== undefined) patch.our_price  = Number(p.ourPrice)  > 0 ? Number(p.ourPrice)  : null

        // Re-tagging something to 'competitor' has to clear the same bar as
        // creating one. Check the row as it will be AFTER the patch, so the
        // numbers can arrive in the same request as the new category.
        if (patch.category === 'competitor') {
          const { data: cur } = await db.from('receipts')
            .select('comp_item, comp_price, comp_verdict').eq('id', p.id).single()
          const bad = competitorGap({ ...(cur ?? {}), ...patch })
          if (bad) return json({ error: bad }, 400)
        }

        // Leaving 'competitor' clears the fields, so a stale price can't sit on
        // a receipt that is no longer a competitor check.
        if (patch.category && patch.category !== 'competitor') {
          patch.comp_item = null; patch.comp_price = null
          patch.our_price = null; patch.comp_verdict = null
        }
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

      /* ---------------------------------------------------------------- */
      /* TIPS — the payout record the Tips Act requires                    */
      /* ---------------------------------------------------------------- */

      case 'tipsLedger': {
        const { data, error } = await db.from('tip_payouts')
          .select('*').order('month', { ascending: false }).order('staff_name')
        if (error) throw error
        return json({ ok: true, payouts: data ?? [] })
      }

      // The amounts live in the front end (src/finance/tipsData.js, rebuilt
      // from each Lightspeed export), so they arrive with the request. The
      // server records what was paid and when — it does not recompute what is
      // owed.
      case 'tipMarkPaid': {
        const month = String(p.month || '')
        if (!p.staffId) return json({ error: 'Which person?' }, 400)
        if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: 'Which month?' }, 400)
        const amount = Number(p.amount)
        if (!(amount >= 0)) return json({ error: 'How much?' }, 400)

        const row = {
          staff_id: p.staffId,
          staff_name: String(p.staffName || '').trim() || null,
          month, amount,
          paid_at: new Date().toISOString(),
          paid_method: ['payroll', 'bank', 'cash'].includes(p.method) ? p.method : 'bank',
          paid_by: String(p.paidBy || 'Elliot Scott').trim(),
          paid_note: String(p.note || '').trim() || null,
        }
        const { data, error } = await db.from('tip_payouts')
          .upsert(row, { onConflict: 'staff_id,month' }).select().single()
        if (error) throw error
        return json({ ok: true, payout: data })
      }

      // Undo a mistake. Clears the staff confirmation too — an acknowledgement
      // of a payment that no longer exists is worse than no record at all.
      case 'tipUnmarkPaid': {
        if (!p.id) return json({ error: 'Which one?' }, 400)
        const { error } = await db.from('tip_payouts')
          .update({ paid_at: null, paid_method: null, paid_by: null, confirmed_at: null })
          .eq('id', p.id)
        if (error) throw error
        return json({ ok: true })
      }

      /* ---------------------------------------------------------------- */
      /* XERO — connect, and check it is still alive                       */
      /* ---------------------------------------------------------------- */

      case 'xeroAuthUrl': {
        if (!XERO_ID || !XERO_SECRET) return json({ error: 'Xero credentials are not set' }, 400)
        const state = crypto.randomUUID()
        await db.from('xero_auth').update({ pending_state: state, updated_at: new Date().toISOString() }).eq('id', 1)
        // Built by hand, NOT with URLSearchParams: that encodes the spaces
        // between scopes as "+", and Xero's authorise endpoint reads the whole
        // lot as one nonsense scope and returns invalid_scope with a 500.
        // encodeURIComponent gives %20, which it accepts.
        const url = 'https://login.xero.com/identity/connect/authorize'
          + '?response_type=code'
          + '&client_id=' + encodeURIComponent(XERO_ID)
          + '&redirect_uri=' + encodeURIComponent(XERO_REDIRECT)
          + '&scope=' + encodeURIComponent(XERO_SCOPES)
          + '&state=' + encodeURIComponent(state)
        return json({ ok: true, url })
      }

      case 'xeroStatus': {
        const row = await xeroRow()
        if (!row?.refresh_token) {
          return json({ ok: true, connected: false, hasCredentials: !!(XERO_ID && XERO_SECRET) })
        }
        // Prove it rather than trust the stored row: fetch the org.
        const tok = await xeroAccessToken()
        if (!tok) return json({ ok: true, connected: false, stale: true, tenant: row.tenant_name })
        const r = await fetch('https://api.xero.com/api.xro/2.0/Organisation', {
          headers: { Authorization: `Bearer ${tok}`, 'Xero-tenant-id': row.tenant_id ?? '', Accept: 'application/json' },
        })
        if (!r.ok) return json({ ok: true, connected: false, stale: true, tenant: row.tenant_name })
        const org = await r.json()
        const o = org?.Organisations?.[0] ?? {}
        return json({
          ok: true, connected: true,
          tenant: row.tenant_name, legalName: o.LegalName ?? o.Name,
          baseCurrency: o.BaseCurrency, connectedAt: row.connected_at,
        })
      }

      default:
        return json({ error: 'Unknown action' }, 400)
    }
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500)
  }
})
