// No Dice — "Help us open" portal config (categories, time-blocks, dates).
// Shared by the sign-up form AND the jobs board so the two never drift.

// The deadline to have the bar open by. Every day from today up to and
// including this date is offered as a help day. Bump this if it moves.
export const DEADLINE = '2026-06-19'

// ─── Skill categories ────────────────────────────────────────────────────
// What a friend can tick "I'm up for…". The same `key`s tag every job on the
// board, so picking "carpentry" shows a friend exactly which jobs they'd do.
export const CATEGORIES = [
  { key: 'bartending', icon: '🍸', label: 'Bartending',            blurb: 'Pulling pints & making drinks once we open' },
  { key: 'serving',    icon: '🧑‍🍳', label: 'Serving / front of house', blurb: 'Greeting, running drinks, looking after guests' },
  { key: 'cleaning',   icon: '🧽', label: 'Cleaning',              blurb: 'Deep cleans, glasswash, trailer, mopping' },
  { key: 'tidying',    icon: '🧹', label: 'Venue tidying',         blurb: 'Clearing, sorting & resetting spaces' },
  { key: 'carpentry',  icon: '🪚', label: 'Carpentry & joinery',   blurb: 'Frames, trim, benches, timber work' },
  { key: 'handyman',   icon: '🔧', label: 'Handyman / general',    blurb: 'Hanging, fixing, bolting, odd jobs' },
  { key: 'painting',   icon: '🎨', label: 'Painting & finishing',  blurb: 'Walls, varnish, oiling, rust treatment' },
  { key: 'electrics',  icon: '💡', label: 'Electrics & wiring',    blurb: 'Fans, lighting, sockets (with our electrician)' },
  { key: 'plumbing',   icon: '🚿', label: 'Plumbing',              blurb: 'Taps, leaks, irrigation, cellar cooling' },
  { key: 'tech',       icon: '🎛️', label: 'Tech, AV & sound',      blurb: 'DJ cables, TVs/projector, sound system' },
  { key: 'gardening',  icon: '🌿', label: 'Gardening & outdoors',  blurb: 'Plants, pruning, park games, garden refresh' },
  { key: 'admin',      icon: '📋', label: 'Admin & online help',   blurb: 'Calls, orders, research, eBay listings' },
  { key: 'marketing',  icon: '📣', label: 'Marketing',             blurb: 'Street, park & social — spreading the word' },
  { key: 'errands',    icon: '🚐', label: 'Errands & collections', blurb: 'Driving, pickups & runs to Borough' },
  { key: 'design',     icon: '✒️', label: 'Design & signage',      blurb: 'Signs, menu boards, posters, CNC artwork' },
]

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.key, c.label]))
export const CATEGORY_ICON  = Object.fromEntries(CATEGORIES.map(c => [c.key, c.icon]))

// ─── Time blocks ──────────────────────────────────────────────────────────
// We're at the venue ~9am–midnight every day, so people can come before work,
// on a break, or after work. Friends pick whichever windows suit them.
export const TIME_BLOCKS = [
  { key: 'morning',   label: 'Morning',   hint: '9am – 12pm' },
  { key: 'afternoon', label: 'Afternoon', hint: '12 – 5pm' },
  { key: 'evening',   label: 'Evening',   hint: '5 – 8pm' },
  { key: 'late',      label: 'Late',      hint: '8pm – midnight' },
  { key: 'anytime',   label: 'Flexible',  hint: 'whenever helps most' },
]
export const TIME_BLOCK_LABEL = Object.fromEntries(TIME_BLOCKS.map(b => [b.key, b.label]))

// ─── Date helpers ──────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Every day from today (local) up to and including DEADLINE. If it's already
// past the deadline we still show the final day so the page never goes empty.
export function helpDays() {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const end = new Date(DEADLINE + 'T00:00:00')
  let start = today > end ? end : today
  const out = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) out.push(iso(new Date(d)))
  return out
}

export const dayLabel = (isoStr) =>
  new Date(isoStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
export const dayWeekday = (isoStr) =>
  new Date(isoStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })
export const dayNum = (isoStr) =>
  new Date(isoStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric' })
