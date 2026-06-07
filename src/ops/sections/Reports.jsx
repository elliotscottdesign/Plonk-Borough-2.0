import React from 'react'
import Roadmap from '../components/Roadmap.jsx'

// Reports section — Claude's weekly/monthly/yearly business read-out. Roadmap
// until the data sources are connected; the till-sales feed already exists.
export default function Reports() {
  return (
    <Roadmap
      title="Reports"
      intro="A simple, clear read-out of how the business is doing each week, month and year — written for you and the team, and compared against 2025. Claude pulls the threads together so you don't have to."
      sections={[
        { h: 'What a weekly report will cover', items: [
          'Till sales — by category, day, and vs the same week in 2025',
          'Events performance — what each night actually took',
          'General trends — what\'s moving up or down and why',
          'Weather overlay — how it tracked against footfall',
          'Staff & rota reports — hours vs sales, cost of labour',
          'Google + Instagram data — reach, bookings, engagement',
        ]},
        { h: 'Outputs', items: [
          'One-page weekly overview (the headline read)',
          'Month and year roll-ups',
          'Every figure benchmarked against 2025',
        ]},
      ]}
      need={[
        'Read access to the Lightspeed till exports (already wired for till sales)',
        'Google Business / Analytics connection',
        'Instagram insights export or API access',
        'Where rota & staff hours live (sheet / system)',
        'Events calendar + per-event takings',
      ]}
      liveNote="The 2025 + 2026 till-sales data is already in the platform (Business Explorer), so the sales half of the weekly report can start as soon as you want — the rest switches on as each source is connected."
    />
  )
}
