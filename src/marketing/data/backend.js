// ─── Newsletter / Members backend (Supabase + Resend) ────────────────────
// Fill these once the Supabase project + edge function are deployed — see
// NEWSLETTER_SETUP.md in this folder. Empty = the UI shows the setup steps
// instead of going live. The anon key is insert-only via RLS (safe to ship);
// reading the list + sending happen in the edge function (service role),
// gated by SEND_SECRET so the password-gated marketing page can trigger it.
export const SUPABASE_URL = 'https://rntcujcpsozvuxvmlejv.supabase.co'
export const SUPABASE_ANON_KEY = ''       // ← still needed: Settings → API → anon public
export const NEWSLETTER_FN_URL = 'https://rntcujcpsozvuxvmlejv.supabase.co/functions/v1/send-newsletter'
export const SEND_SECRET = ''             // ← still needed: the SEND_SECRET you set on deploy
export const BACKEND_READY = !!(SUPABASE_URL && SUPABASE_ANON_KEY)
export const SEND_READY = !!(NEWSLETTER_FN_URL && SEND_SECRET)

// Public signup → inserts into Supabase (anon, insert-only). Used by SignupForm
// and any in-bar / website sign-up that posts here.
export async function insertSubscriber({ email, source = 'web', consent = true }) {
  if (!BACKEND_READY) throw new Error('Backend not configured')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ email: String(email).trim().toLowerCase(), source, consent }),
  })
  if (res.status === 409) return true                  // already subscribed — fine
  if (!res.ok) throw new Error(`Signup failed (${res.status})`)
  return true
}

// Trigger a send: the edge function pulls consented subscribers + sends via
// Resend. Returns { sent }.
export async function sendNewsletter({ subject, html }) {
  if (!SEND_READY) throw new Error('Send function not configured')
  const res = await fetch(NEWSLETTER_FN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, html, secret: SEND_SECRET }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`)
  return data
}
