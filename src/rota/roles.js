// No Dice staff abilities + role hierarchy. Shared by the portal + admin;
// the same numbers/keys are mirrored in supabase/functions/rota (keep in sync).

// Abilities a staff member is trained for — a shift needs exactly one of these.
export const ABILITIES = [
  { key: 'bar', label: 'Bar', icon: '🍸' },
  { key: 'kitchen', label: 'Kitchen', icon: '🌭' },
  { key: 'foh', label: 'Front of house', icon: '🛎️' },
  { key: 'golf', label: 'Golf', icon: '🏌️' },
]
export const ABILITY_KEYS = ABILITIES.map(a => a.key)
export const abilityLabel = (k) => (ABILITIES.find(a => a.key === k) || {}).label || k
export const abilityIcon = (k) => (ABILITIES.find(a => a.key === k) || {}).icon || '•'

// Role hierarchy — higher rank can cover a lower-rank shift, not the other way.
export const RANKS = ['Bar Staff', 'Supervisor', 'Asst. Manager', 'Manager']   // index+1 = rank
export const ROLE_RANK = { 'Bar Staff': 1, 'Supervisor': 2, 'Asst. Manager': 3, 'Manager': 4 }
export const staffRank = (role) => ROLE_RANK[role] || 1
export const rankLabel = (r) => RANKS[(r || 1) - 1] || 'Bar Staff'

// Can this staff member take this shift? (Founder assignment bypasses this.)
export function canWork(staff, shift) {
  const ab = shift?.ability || 'bar'
  const need = shift?.min_rank || 1
  return (staff?.abilities || []).includes(ab) && staffRank(staff?.role) >= need
}
export function whyCantWork(staff, shift) {
  const ab = shift?.ability || 'bar'
  const need = shift?.min_rank || 1
  if (!(staff?.abilities || []).includes(ab)) return `Needs ${abilityLabel(ab)} training`
  if (staffRank(staff?.role) < need) return `Needs ${rankLabel(need)} or above`
  return ''
}
