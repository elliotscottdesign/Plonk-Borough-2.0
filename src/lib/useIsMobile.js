import { useState, useEffect } from 'react'

// True when the viewport is phone-sized (<= bp px). Used across the team hub
// and the investor decks to collapse the multi-tab headers into a ☰ menu so
// the links don't crash into each other on a phone.
export default function useIsMobile(bp = 760) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth <= bp)
  useEffect(() => {
    const on = () => setM(window.innerWidth <= bp)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [bp])
  return m
}
