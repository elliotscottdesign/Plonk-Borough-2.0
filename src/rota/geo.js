// One-shot geolocation for clock-in + venue setup.
// Resolves to { lat, lng, accuracy } or null on ANY failure (permission denied,
// timeout, no sensor, insecure context). Callers treat null as "couldn't confirm",
// never as an error — a staff clock-in is never blocked by a missing/blocked fix.
export function getFix({ timeout = 12000 } = {}) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 0 },
    )
  })
}

// A friendly badge for a presence label (founder review + staff record).
// 'off' / null / undefined → no badge (feature was off for that punch).
export function presenceBadge(label) {
  switch (label) {
    case 'wifi':       return { icon: '📶', text: 'On venue Wi-Fi', short: 'venue Wi-Fi', color: '#34D399' }
    case 'gps':        return { icon: '📍', text: 'At venue (GPS)',  short: 'at venue',    color: '#34D399' }
    case 'off-site':   return { icon: '🚩', text: 'Away from venue', short: 'off-site',    color: '#F87171' }
    case 'unverified': return { icon: '❓', text: 'Location not confirmed', short: 'unconfirmed', color: '#F59E0B' }
    default:           return null
  }
}
