/**
 * No Dice Borough — Lock Sync (Cloudflare Worker + KV)
 * ─────────────────────────────────────────────────────
 *
 * Stores the founder's "locked 2026 Performance forecast" in a Cloudflare
 * KV namespace. The deck GETs from this Worker on every page boot and POSTs
 * whenever the founder locks/unlocks.
 *
 * Faster than the Apps Script option (~30ms vs ~300ms response time) and
 * fully decoupled from the Google Sheet, but requires a free Cloudflare
 * account.
 *
 * SETUP (one-time, ~5 minutes):
 *
 * 1) Sign in / sign up at https://dash.cloudflare.com (free tier is fine).
 *
 * 2) Workers & Pages → Create application → Worker → "Hello World" template.
 *    Name it e.g. "ndb-lock-sync".
 *
 * 3) Replace the Worker code with this file's contents. Save and Deploy.
 *
 * 4) Create a KV namespace:
 *    Workers & Pages → KV → Create namespace → name "NDB_LOCK_KV".
 *
 * 5) Bind the KV to the Worker:
 *    Open the Worker → Settings → Variables → KV Namespace Bindings →
 *    Add binding. Variable name: LOCK_KV. KV namespace: NDB_LOCK_KV. Save.
 *
 * 6) (Optional) Set a shared secret:
 *    Worker → Settings → Variables → Environment Variables → Add variable.
 *    Name: LOCK_SECRET. Type: Secret. Value: <your secret string>. Save.
 *    Then copy the SAME value into src/data.js → LOCK_SYNC_SECRET.
 *
 * 7) Copy the Worker URL (looks like https://ndb-lock-sync.<you>.workers.dev)
 *    and paste it into src/data.js → LOCK_SYNC_URL. Commit + push.
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const json = (payload, status = 200) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })

    try {
      if (request.method === 'GET') {
        const raw = await env.LOCK_KV.get('snapshot')
        const snapshot = raw ? JSON.parse(raw) : null
        const updatedAt = await env.LOCK_KV.get('snapshot:updatedAt')
        return json({ snapshot, updatedAt })
      }

      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}))

        // Optional auth — if LOCK_SECRET env var is set, require it
        if (env.LOCK_SECRET && body.secret !== env.LOCK_SECRET) {
          return json({ error: 'unauthorised' }, 401)
        }

        const snapshot = body.snapshot
        if (snapshot === null || snapshot === undefined) {
          await env.LOCK_KV.delete('snapshot')
          await env.LOCK_KV.delete('snapshot:updatedAt')
        } else {
          await env.LOCK_KV.put('snapshot', JSON.stringify(snapshot))
          await env.LOCK_KV.put('snapshot:updatedAt', new Date().toISOString())
        }
        return json({ ok: true })
      }

      return json({ error: 'method not allowed' }, 405)
    } catch (err) {
      return json({ error: String(err && err.message || err) }, 500)
    }
  },
}
