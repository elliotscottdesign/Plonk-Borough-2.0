// "Help us open" sign-up submit. Posts ONE row per friend straight into the
// bar_helpers table via Supabase's REST endpoint with the public anon key
// (insert-only via RLS — same safe pattern as the newsletter sign-up).
import { SUPABASE_URL, SUPABASE_ANON_KEY, BACKEND_READY } from '../marketing/data/backend.js'

export { BACKEND_READY }

// The shareable link to give friends. Works on whatever domain this is served
// from (team.nodice.bar/help-out), so no hard-coded host to keep in sync.
export const helpLink = () =>
  (typeof window !== 'undefined' ? window.location.origin : 'https://team.nodice.bar') + '/help-out'

export async function submitHelper({ name, phone, email, categories, days, time_blocks, note }) {
  if (!BACKEND_READY) throw new Error('Backend not configured')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bar_helpers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      name: String(name || '').trim(),
      phone: String(phone || '').trim() || null,
      email: String(email || '').trim().toLowerCase() || null,
      categories: categories || [],
      days: days || [],
      time_blocks: time_blocks || [],
      note: String(note || '').trim() || null,
    }),
  })
  if (!res.ok) {
    // 404 / 401 here almost always means the one-time SQL hasn't been run yet.
    const detail = await res.text().catch(() => '')
    throw new Error(
      res.status === 404 || res.status === 401
        ? "Sign-ups aren't switched on yet — give Elliot a nudge."
        : `Couldn't save (${res.status}). ${detail}`.trim()
    )
  }
  return true
}
