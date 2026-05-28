// World Cup 2026 planning data — founder-only, surfaced at /worldcup.
// The 5 Dec 2025 final draw is now reflected for the teams this venue cares
// about — England (Group L: Croatia, Ghana, Panama), Brazil (Group C: Morocco,
// Haiti, Scotland), Spain (Group H), Australia (Group D) — plus England's
// projected knockout route and the possible England v Brazil quarter-final
// (Sat 11 Jul, Miami). Minor group-stage slots and exact UK kick-off times for
// non-headline games still say "confirm vs FIFA schedule". The knockout
// opponents are bracket projections (who feeds which slot), since the actual
// teams depend on results.

export const TOURNAMENT = {
  name: 'FIFA World Cup 2026',
  host: 'USA · Canada · Mexico',
  start: '2026-06-11',
  end: '2026-07-19',
  teams: 48,
  tables: 10,
  estCovers: 60,
}

// Communities we cater to in London. The London Fields venue (E8) draws
// the local Hackney/East-London crowd plus England's wider football
// community; London's Brazilian community is concentrated further south
// (Borough/Bermondsey) but will travel for the big games. Aussie + Spanish
// expat presence pulls from across the city.
export const COMMUNITIES = [
  {
    id: 'eng',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    name: 'England / British',
    sellOut: true,
    hook: 'Three Lions sell-out culture',
    drinks: 'Camden Hells / Neck Oil buckets · half-time shot round (Jäger or London gin)',
    food: 'Sharing platters · sausage roll bar snack',
    package: '"Three Lions" £180 · "Captain\'s Table" £300 (pre-paid, deposit only)',
  },
  {
    id: 'bra',
    flag: '🇧🇷',
    name: 'Brazilian',
    sellOut: false,
    hook: 'Yellow + green dress code, samba pre-match playlist',
    drinks: 'Caipirinha jugs (£36/jug of 6) · Brahma if sourced, else Estrella',
    food: 'Pão de queijo · coxinha sharing board',
    package: '"Seleção Table" £120 — table + caipirinha jug + sharing platter',
  },
  {
    id: 'esp',
    flag: '🇪🇸',
    name: 'Spanish',
    sellOut: false,
    hook: 'Tapas board on the table, flamenco-house playlist',
    drinks: 'Sangria jugs · Estrella Damm buckets · Tinto de Verano',
    food: 'Patatas bravas · jamón · padrón peppers',
    package: '"La Roja Table" £110 — table + sangria jug + tapas board',
  },
  {
    id: 'aus',
    flag: '🇦🇺',
    name: 'Australian',
    sellOut: false,
    hook: 'Likely late-night UK kick-offs for AUS games — Espresso Martinis push hard',
    drinks: 'VB / Coopers buckets · Espresso Martinis for late games',
    food: 'Bacon roll if early AM · loaded fries late-night',
    package: '"Matildas/Roos Table" £100 OR walk-in £15 bacon-roll-and-pint',
  },
]

// Licensing checklist — every item the founder needs to confirm before
// the tournament starts (today's date is 2026-05-22 → ~3 weeks).
export const LICENSING = [
  {
    id: 'tv-licence',
    title: 'Commercial TV Licence',
    status: 'must-have',
    cost: '£181 / year',
    detail: 'Required even though BBC and ITV are free-to-air. Showing broadcast TV in licensed premises requires the business-rate licence. Apply at tvlicensing.co.uk — takes a few working days.',
    action: 'Confirm active licence today. If lapsed, apply this week.',
  },
  {
    id: 'screening',
    title: 'Premises Licence — film exhibition / recorded music',
    status: 'check',
    cost: '—',
    detail: 'Your operating schedule must permit "exhibition of a film" (covers televised matches) and "performance of recorded music" (covers pre / post-match playlists). Most pub licences include both — check yours.',
    action: 'Pull the licence from your records and re-read the operating schedule. If missing, file a minor variation with Hackney Council (£89, 28-day consultation).',
  },
  {
    id: 'ten',
    title: 'Temporary Event Notices (TENs)',
    status: 'file-now',
    cost: '£21 each · max 15/yr',
    detail: 'A TEN extends licensable activities beyond your premises licence — late hours, higher capacity, anything not normally permitted. 10 working-days minimum notice. Submit via Hackney Council\'s licensing portal.',
    action: 'See per-date schedule below for which dates need a TEN. File the batch by end of May 2026 to cover late kick-offs (post-23:00 finishes).',
  },
  {
    id: 'prs-ppl',
    title: 'PRS for Music + PPL',
    status: 'standard',
    cost: 'Already paid',
    detail: 'Match audio is covered under your TV licence. Pre / post-match playlists need PRS + PPL. You will already have this from normal trade.',
    action: 'No action — just confirm the annual standing order is up to date.',
  },
  {
    id: 'hackney-outside-trade',
    title: 'Hackney Council pavement / outside-trade licence',
    status: 'check',
    cost: '—',
    detail: 'If trade spills onto the pavement on Mentmore Terrace (outside seating, A-boards, queue management) you need a pavement licence from Hackney Council in addition to the premises licence. Tournament crowds will spill — get this in writing now. Outdoor screens are explicitly licensable too, so flag those on the application.',
    action: 'Apply for / confirm the Hackney pavement licence covering all match dates by end of May 2026.',
  },
  {
    id: 'capacity',
    title: 'Capacity & fire safety',
    status: 'must-have',
    cost: '—',
    detail: 'England + knockout nights will press capacity. Document max persons. Have a clip-counter at the door for sell-out matches. Brief door staff on cut-off and queue management.',
    action: 'Print laminated capacity card. Brief door staff. Walk the room with fire wardens before the tournament starts.',
  },
  {
    id: 'security',
    title: 'SIA-licensed door staff',
    status: 'must-have',
    cost: '£18–25 / hour per person',
    detail: 'England nights + Brazil knockouts will need SIA doors. Book your regular agency now — every London venue will be chasing the same staff.',
    action: 'Block-book SIA staff for every flagged "high"-intensity day below by end of May 2026.',
  },
  {
    id: 'insurance',
    title: 'Public liability insurance',
    status: 'check',
    cost: '—',
    detail: 'Confirm your PL policy covers crowded events, late hours, and screening of broadcast sport. Some policies exclude "spectator events" — read the wording.',
    action: 'Email broker for written confirmation by 1 June 2026.',
  },
]

// Master package menu (referenced from per-day rows below).
export const PACKAGES = [
  { id: 'three-lions',    name: 'Three Lions Table',   price: '£180', covers: 6, includes: 'Table reserved for match window · 2 sharing platters · bucket of 6 beers (Camden Hells / Neck Oil)', forMatch: 'England group stage' },
  { id: 'captains-table', name: "Captain's Table",     price: '£300', covers: 6, includes: 'Premium spot near main screen · 2 platters · bottle of English sparkling on arrival · 6 cocktails · half-time shot round', forMatch: 'England knockouts' },
  { id: 'selecao',        name: 'Seleção Table',       price: '£120', covers: 6, includes: 'Table reserved · caipirinha jug (serves 6) · sharing platter · samba playlist', forMatch: 'Brazil matches' },
  { id: 'la-roja',        name: 'La Roja Table',       price: '£110', covers: 6, includes: 'Table reserved · sangria jug (serves 6) · tapas board', forMatch: 'Spain matches' },
  { id: 'matildas',       name: 'Matildas/Roos Table', price: '£100', covers: 6, includes: 'Table reserved · VB bucket · loaded fries OR bacon-roll-and-pint walk-in £15/head if AM kick-off', forMatch: 'Australia matches' },
  { id: 'standard',       name: 'Standard Table',      price: '£25 / head min spend', covers: 6, includes: 'Table reserved · £150 minimum spend across the match window', forMatch: 'Any other fixture' },
  { id: 'walk-in',        name: 'Walk-in / Door',      price: '£10 door (England only)', covers: '—', includes: 'Standing room only · drinks at bar · released 30 min before kick-off if any space remains', forMatch: 'England sell-out nights' },
]

// Time slot legend — the typical UK kick-off windows given the host
// timezones. Used in per-day schedule rows.
export const SLOTS = {
  early:  '17:00 / 18:00 BST',  // Mexico noon or East-coast noon
  prime:  '20:00 / 21:00 BST',  // East-coast afternoon
  late:   '23:00 / 00:00 BST',  // East-coast evening
  graveyard: '02:00 / 03:00 BST', // West-coast evening
}

// Intensity levels — drives row colour and staffing in the UI.
//   'sellout'  = England matches + likely Final
//   'high'     = Brazil/Spain knockouts, opening match, big derbies
//   'medium'   = community group-stage matches
//   'low'      = quiet days (small nations group stage)
//   'rest'     = no matches scheduled
const intensity = (level) => level

// ─── Calendar ────────────────────────────────────────────────────────
// Every day from 11 June to 19 July 2026. England fixtures + group draw
// are marked as "TBC — confirm against final draw". The structural facts
// (which days are R16 vs QF, etc.) are locked.
//
// Each row: { date, weekday, phase, matches[], intensity, ten, staff,
//             packages[], drinks, community, regulars, actions[] }
export const SCHEDULE = [
  {
    date: '2026-06-11', weekday: 'Thursday', phase: 'Group stage — Opening Day',
    matches: [
      { slot: 'prime', fixture: 'Mexico v South Africa — Opening match', importance: 'medium', notes: 'Tournament opener at the Estadio Azteca, Mexico City. ~20:00 BST kick-off (13:00 local).' },
    ],
    intensity: intensity('medium'),
    ten: { required: false, reason: '20:00 BST kick-off finishes within normal hours. No TEN needed unless you extend for opening-night trade.', cost: '—' },
    staff: { bar: 3, floor: 2, door: 1, notes: 'Soft launch — most of London still figuring out the tournament. Use this day to drill staff on packages.' },
    packages: ['standard', 'walk-in'],
    drinks: 'Margarita jugs (Mexico host theme) · Modelo / Pacifico buckets',
    community: 'Mexico-host vibe — bunting + flag visuals up. No specific community focus.',
    regulars: 'Standard Thursday programming pre-7pm; switch to match focus from 19:00.',
    actions: ['All staff briefing 17:00', 'Confirm all screens + sound working', 'Print tournament menus', 'Test booking system end-to-end'],
  },
  {
    date: '2026-06-12', weekday: 'Friday', phase: 'Group stage — Day 2',
    matches: [
      { slot: 'early', fixture: 'Group A/B match (TBC)', importance: 'low' },
      { slot: 'prime', fixture: 'Group match (TBC)', importance: 'medium' },
      { slot: 'late', fixture: 'Group match (TBC)', importance: 'medium' },
    ],
    intensity: intensity('medium'),
    ten: { required: true, reason: 'Late match 23:00 BST runs past midnight. TEN extends Friday trading.', cost: '£21' },
    staff: { bar: 3, floor: 2, door: 1, notes: 'Standard Friday-night staffing plus 1 extra to cover sustained drinking from 17:00.' },
    packages: ['standard'],
    drinks: 'Friday-night cocktail jugs · beer buckets',
    community: '—',
    regulars: 'Friday DJ slot moved to 22:30 (post-late-match) OR cancelled — decide by 1 June.',
    actions: ['Confirm with Friday DJ residency', 'Push pre-bookings via email + Instagram'],
  },
  {
    date: '2026-06-13', weekday: 'Saturday', phase: 'Group stage — Day 3 · BRAZIL open',
    matches: [
      { slot: 'late', fixture: 'BRAZIL v Morocco (Group C)', importance: 'high', notes: "Brazil's opener at MetLife Stadium, New Jersey. ~23:00 BST kick-off (18:00 ET). First big community night." },
      { slot: 'early', fixture: 'Group-stage fixtures (afternoon kick-offs)', importance: 'medium' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Saturday late Brazil match finishes past midnight + extended hours.', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'First proper Saturday of tournament + Brazil opener — busy. SIA on door from 18:00.' },
    packages: ['selecao', 'standard'],
    drinks: 'Caipirinha jugs prepped at scale · Brahma if sourced, else Estrella · samba playlist · beer buckets',
    community: '🇧🇷 Brazil — opening night for the wider London Brazilian community (Borough/Bermondsey core travels in)',
    regulars: 'Saturday brunch service ends 16:00 to flip room for matches',
    actions: ['Pre-batch caipirinha mix from 14:00', 'Brazilian-community outreach (Instagram, Olá Londres)', 'Sandwich-board on Mentmore Terrace with day fixtures'],
  },
  {
    date: '2026-06-14', weekday: 'Sunday', phase: 'Group stage — Day 4',
    matches: [
      { slot: 'prime', fixture: 'Group-stage fixtures (TBC opponents)', importance: 'medium', notes: "England DON'T play today — their opener is Wed 17 Jun v Croatia. Normal Sunday match-day trade." },
      { slot: 'late', fixture: 'Group-stage fixture', importance: 'medium' },
    ],
    intensity: intensity('medium'),
    ten: { required: false, reason: 'Confirm late-match slot against the FIFA schedule.', cost: '—' },
    staff: { bar: 3, floor: 2, door: 1, notes: 'Standard Sunday match-day staffing.' },
    packages: ['standard'],
    drinks: 'Sunday roast + match menu · cocktail jugs',
    community: '—',
    regulars: 'Roast service runs alongside matches',
    actions: ['Push England pre-bookings for Wed 17 Jun (v Croatia)'],
  },
  {
    date: '2026-06-15', weekday: 'Monday', phase: 'Group stage — Day 5',
    matches: [
      { slot: 'early', fixture: 'Group match (TBC)', importance: 'low' },
      { slot: 'prime', fixture: 'Group match (TBC)', importance: 'medium' },
      { slot: 'late', fixture: 'Group match (TBC)', importance: 'low' },
    ],
    intensity: intensity('low'),
    ten: { required: false, reason: 'Monday late match likely finishes before licence cut-off. Confirm against schedule.', cost: '—' },
    staff: { bar: 2, floor: 2, door: 0, notes: 'Quiet Monday. Skeleton staff. SIA not needed unless a big-nation fixture lands here.' },
    packages: ['standard'],
    drinks: 'Standard menu',
    community: '—',
    regulars: 'Monday quiz cancelled for tournament window',
    actions: ['Email regulars about quiz hiatus'],
  },
  {
    date: '2026-06-16', weekday: 'Tuesday', phase: 'Group stage — Day 6',
    matches: [
      { slot: 'early', fixture: 'Group match (TBC)', importance: 'low' },
      { slot: 'prime', fixture: 'Group match (TBC)', importance: 'medium' },
      { slot: 'late', fixture: 'Group match (TBC)', importance: 'medium' },
    ],
    intensity: intensity('medium'),
    ten: { required: false, reason: 'Check exact slot — late match may push past 23:00.', cost: '—' },
    staff: { bar: 2, floor: 2, door: 0, notes: 'Light Tuesday' },
    packages: ['standard'],
    drinks: 'Standard menu',
    community: '—',
    regulars: 'No regulars Tuesday',
    actions: [],
  },
  {
    date: '2026-06-17', weekday: 'Wednesday', phase: 'Group stage — Day 7 · ENGLAND #1',
    matches: [
      { slot: 'prime', fixture: 'ENGLAND v Croatia (Group L)', importance: 'sellout', notes: "England's tournament opener at AT&T Stadium, Arlington (Dallas). 21:00 BST kick-off. A 2018 semi-final rematch — first sell-out night." },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Sell-out England match — extended hours + outside trade.', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'ALL HANDS. SIA on door from 17:00. Glass-collector dedicated to floor.' },
    packages: ['three-lions', 'walk-in'],
    drinks: 'Camden Hells + Neck Oil buckets · half-time Jäger shot round (in package) · spirits + mixer doubles',
    community: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England v Croatia — sell-out target',
    regulars: 'No regulars Wednesday — full match focus',
    actions: ['Open ticketed pre-bookings 4 weeks out (mid-May)', 'Brief floor on package half-time shot round', 'Confirm street A-board permission', 'Print England-specific menu cards'],
  },
  {
    date: '2026-06-18', weekday: 'Thursday', phase: 'Group stage — Day 8 · SPAIN window',
    matches: [
      { slot: 'prime', fixture: 'Spain (Group H) group fixture — v Cabo Verde / Saudi Arabia / Uruguay', importance: 'high', notes: 'Spain are in Group H with Cabo Verde, Saudi Arabia and Uruguay. Confirm which of their three games lands today against the FIFA schedule.' },
      { slot: 'late', fixture: 'Group-stage fixture', importance: 'medium' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Late match runs past licence cut-off', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 1, notes: 'If Spain plays, expect a Spanish-language room. Brief floor on tapas board.' },
    packages: ['la-roja', 'standard'],
    drinks: 'Sangria jugs · Estrella Damm · Tinto de Verano',
    community: '🇪🇸 Spain — push tapas package via Spanish-language Instagram targeting',
    regulars: 'No regulars Thursday',
    actions: ['Confirm Spain fixture date/slot vs FIFA schedule', 'Confirm tapas supply with chef', 'Spanish-language flyer printed for surrounding area'],
  },
  {
    date: '2026-06-19', weekday: 'Friday', phase: 'Group stage — Day 9 · BRAZIL #2',
    matches: [
      { slot: 'graveyard', fixture: 'BRAZIL v Haiti (Group C)', importance: 'high', notes: "Brazil's second group game at Lincoln Financial Field, Philadelphia. Late UK slot — kicks off ~01:30–02:00 BST (into Sat 20 Jun). Espresso Martinis + samba for the night owls." },
      { slot: 'prime', fixture: 'Group-stage fixture (evening)', importance: 'medium' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Friday graveyard kick-off runs well past licence cut-off — TEN essential.', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Friday + late Brazil crowd. SIA on door. Late-night queue management.' },
    packages: ['selecao', 'standard'],
    drinks: 'Caipirinha jugs · Brahma if sourced · Espresso Martinis for the late kick-off',
    community: '🇧🇷 Brazil — late-night Brazilian community draw (England play Tue 23 Jun, not tonight)',
    regulars: 'Friday DJ moved to pre-match 20:00–01:00 slot',
    actions: ['File TEN for graveyard finish', 'Brazil-community push for the late game', 'SIA door from 22:00'],
  },
  {
    date: '2026-06-20', weekday: 'Saturday', phase: 'Group stage — Day 10',
    matches: [
      { slot: 'early', fixture: 'Group match (TBC)', importance: 'high' },
      { slot: 'prime', fixture: 'Group match (TBC)', importance: 'high' },
      { slot: 'late', fixture: 'Group match (TBC)', importance: 'medium' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Saturday late match', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Big Saturday — London Fields heaving in summer. Walk-in conversion key.' },
    packages: ['standard', 'selecao', 'la-roja'],
    drinks: 'Cocktail jugs across the board',
    community: 'Mixed — depends on fixtures',
    regulars: 'Saturday brunch ends 15:00',
    actions: ['London Fields footfall conversion plan — sandwich-board + greeter on Mentmore Terrace from 14:00'],
  },
  {
    date: '2026-06-21', weekday: 'Sunday', phase: 'Group stage — Day 11',
    matches: [
      { slot: 'early', fixture: 'Group match (TBC)', importance: 'medium' },
      { slot: 'prime', fixture: 'Group match (TBC)', importance: 'medium' },
    ],
    intensity: intensity('medium'),
    ten: { required: false, reason: 'Sunday afternoon/early evening matches — within standard hours', cost: '—' },
    staff: { bar: 3, floor: 2, door: 0, notes: 'Standard Sunday staffing' },
    packages: ['standard'],
    drinks: 'Sunday roast + match menu',
    community: '—',
    regulars: 'Roast service runs alongside matches',
    actions: [],
  },
  {
    date: '2026-06-22', weekday: 'Monday', phase: 'Group stage — Day 12 · AUSTRALIA window',
    matches: [
      { slot: 'late', fixture: 'Australia (Group D) group fixture — v USA / Paraguay / Türkiye', importance: 'medium', notes: 'Australia are in Group D with the USA, Paraguay and Türkiye — likely a late UK slot from a West-coast US venue. Confirm which of their three games lands today against the FIFA schedule.' },
      { slot: 'prime', fixture: 'Group-stage fixture', importance: 'medium' },
    ],
    intensity: intensity('medium'),
    ten: { required: true, reason: 'Late match if Australia plays a West-coast venue', cost: '£21' },
    staff: { bar: 3, floor: 2, door: 1, notes: 'Aussie expat draw — late but loyal' },
    packages: ['matildas', 'standard'],
    drinks: 'VB / Coopers · Espresso Martinis for the late kick-off',
    community: '🇦🇺 Australia (Group D — v USA / Paraguay / Türkiye)',
    regulars: 'No regulars Monday',
    actions: ['Confirm Australia fixture date/slot vs FIFA schedule', 'Outreach to Aussie expat groups (London Aussies FB group)'],
  },
  {
    date: '2026-06-23', weekday: 'Tuesday', phase: 'Group stage — Day 13 · ENGLAND #2',
    matches: [
      { slot: 'prime', fixture: 'ENGLAND v Ghana (Group L)', importance: 'sellout', notes: "England's second group game at Gillette Stadium, Boston. 21:00 BST kick-off. Tuesday night but a sell-out — qualification within reach." },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Sell-out England match + extended hours', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'Full England staffing even on a Tuesday. SIA door from 17:00.' },
    packages: ['three-lions', 'walk-in'],
    drinks: 'Camden Hells + Neck Oil buckets · half-time Jäger shot round (in package)',
    community: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England v Ghana — sell-out target',
    regulars: 'No regulars Tuesday — full match focus',
    actions: ['Pre-bookings open 4 weeks out', 'SIA door from 17:00', 'Outside A-board with Three Lions package QR'],
  },
  {
    date: '2026-06-24', weekday: 'Wednesday', phase: 'Group stage — Day 14 · BRAZIL v SCOTLAND',
    matches: [
      { slot: 'late', fixture: 'BRAZIL v Scotland (Group C)', importance: 'sellout', notes: "Brazil's final group game v Scotland at Hard Rock Stadium, Miami. ~23:00 BST kick-off. DOUBLE community draw — Brazilian crowd AND the Tartan Army (home nation). Could be a sell-out." },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Brazil v Scotland — high turnout + late finish past licence cut-off', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'Brazil + Scotland = packed, mixed room. SIA from 18:00. Brief floor on both crowds.' },
    packages: ['selecao', 'standard'],
    drinks: 'Caipirinha jugs · samba playlist · Tennent\'s / Irn-Bru shouts for the Scots',
    community: '🇧🇷 Brazil v 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland — two communities in one room',
    regulars: 'No regulars Wednesday',
    actions: ['Reinforce Brazil-community outreach', 'Reach out to London Scottish / Tartan Army groups', 'Plan for a mixed, lively room'],
  },
  {
    date: '2026-06-25', weekday: 'Thursday', phase: 'Group stage — Day 15',
    matches: [
      { slot: 'prime', fixture: 'Group-stage fixtures (TBC opponents)', importance: 'medium', notes: "England DON'T play today — their final group game is Sat 27 Jun v Panama. Normal mid-week match trade." },
      { slot: 'late', fixture: 'Group-stage fixture', importance: 'medium' },
    ],
    intensity: intensity('medium'),
    ten: { required: false, reason: 'Confirm late-match slot against the FIFA schedule.', cost: '—' },
    staff: { bar: 3, floor: 2, door: 1, notes: 'Standard mid-week match-day staffing.' },
    packages: ['standard'],
    drinks: 'Standard match menu',
    community: '—',
    regulars: 'No regulars Thursday',
    actions: ['Push England pre-bookings for Sat 27 Jun (v Panama)'],
  },
  {
    date: '2026-06-26', weekday: 'Friday', phase: 'Group stage — Day 16 · SPAIN window',
    matches: [
      { slot: 'prime', fixture: 'Spain (Group H) group fixture — v Cabo Verde / Saudi Arabia / Uruguay', importance: 'high', notes: 'Spain (Group H) — opponents are Cabo Verde, Saudi Arabia and Uruguay. Confirm which game lands on this Friday vs the FIFA schedule.' },
      { slot: 'late', fixture: 'Group-stage fixture', importance: 'medium' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Friday late + possible Spain crowd', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Friday + Spain' },
    packages: ['la-roja', 'standard'],
    drinks: 'Sangria · Estrella · tapas board',
    community: '🇪🇸 Spain (Group H — v Cabo Verde / Saudi Arabia / Uruguay)',
    regulars: 'Friday DJ adjusted',
    actions: ['Confirm Spain fixture date/slot vs FIFA schedule', 'Push La Roja package via Spanish Instagram targeting'],
  },
  {
    date: '2026-06-27', weekday: 'Saturday', phase: 'Group stage — Final Day · ENGLAND #3',
    matches: [
      { slot: 'late', fixture: 'ENGLAND v Panama (Group L)', importance: 'sellout', notes: "England's final group game at MetLife Stadium, New Jersey. ~22:00 BST kick-off. Saturday-night sell-out — qualification on the line." },
      { slot: 'prime', fixture: 'Parallel final-round Group L fixture (Croatia v Ghana)', importance: 'medium', notes: 'Final group games kick off simultaneously — Croatia v Ghana decides the group alongside England v Panama. Smaller screens for the other match.' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Saturday sell-out England match + late finish + extended trade', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'Last group day + England sell-out. ALL HANDS. SIA from 17:00.' },
    packages: ['three-lions', 'walk-in'],
    drinks: 'England package · half-time shot round · full match menu',
    community: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England v Panama — sell-out target',
    regulars: 'Brunch ends 15:00 to flip the room',
    actions: ['Sell out 100% via pre-book by the Wednesday before', 'Screen plan: England on the main screen, Croatia v Ghana on the rest', 'SIA door from 17:00'],
  },
  // ─── Round of 32 (new in 2026 — first knockout round) ────────────────
  {
    date: '2026-06-28', weekday: 'Sunday', phase: 'Round of 32 — Day 1',
    matches: [
      { slot: 'prime', fixture: 'R32 match #1 (TBC)', importance: 'high' },
      { slot: 'late', fixture: 'R32 match #2 (TBC)', importance: 'high' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Sunday late knockout', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Knockout = no draws, room flips faster' },
    packages: ['standard'],
    drinks: 'Knockout cocktails (high-margin signature)',
    community: 'Depends on fixtures',
    regulars: 'Sunday roast truncated',
    actions: ['Confirm R32 bracket pairs published the morning after group stage ends'],
  },
  {
    date: '2026-06-29', weekday: 'Monday', phase: 'Round of 32 — Day 2',
    matches: [
      { slot: 'prime', fixture: 'R32 match (TBC)', importance: 'high' },
      { slot: 'late', fixture: 'R32 match (TBC)', importance: 'high' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Late knockout', cost: '£21' },
    staff: { bar: 3, floor: 3, door: 1, notes: 'Monday but knockout draws still pull a crowd' },
    packages: ['standard'],
    drinks: 'Knockout menu',
    community: '—',
    regulars: 'Quiz still cancelled',
    actions: [],
  },
  {
    date: '2026-06-30', weekday: 'Tuesday', phase: 'Round of 32 — Day 3',
    matches: [
      { slot: 'prime', fixture: 'R32 match (TBC)', importance: 'high' },
      { slot: 'late', fixture: 'R32 match (TBC)', importance: 'high' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Late knockout', cost: '£21' },
    staff: { bar: 3, floor: 3, door: 1, notes: 'Knockout pull' },
    packages: ['standard'],
    drinks: 'Knockout menu',
    community: '—',
    regulars: 'No regulars',
    actions: [],
  },
  {
    date: '2026-07-01', weekday: 'Wednesday', phase: 'Round of 32 — Day 4 · ENGLAND R32',
    matches: [
      { slot: 'early', fixture: 'ENGLAND R32 — Winner Group L v 3rd place (Group E/H/I/J/K)', importance: 'sellout', notes: 'If England top Group L, their R32 is at Mercedes-Benz Stadium, Atlanta — 17:00 BST kick-off (Wed 1 Jul). Opponent is a third-placed qualifier; confirmed once the group tables finalise.' },
      { slot: 'late', fixture: 'R32 match', importance: 'high' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Sell-out England knockout — capacity + outside trade (early kick-off, hours within licence).', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'Full England staffing IF England play. Early 17:00 kick-off — afternoon build-up from 15:00.' },
    packages: ['captains-table', 'walk-in'],
    drinks: 'Captain\'s Table package + walk-in beer + half-time shots',
    community: 'England (TBC opponent — 3rd place E/H/I/J/K)',
    regulars: 'No regulars',
    actions: ['Re-open ticketed pre-book the day group stage ends (Sat 27 Jun)', 'Confirm opponent once 3rd-place tables lock', 'SIA door from 15:00'],
  },
  {
    date: '2026-07-02', weekday: 'Thursday', phase: 'Round of 32 — Day 5 · BRAZIL R32 projected',
    matches: [
      { slot: 'prime', fixture: 'BRAZIL R32 (projected) — Winner Group C v Runner-up Group F', importance: 'high', notes: 'Match 76 at NRG Stadium, Houston. If Brazil win Group C this is their R32 — same side of the bracket as England, both feeding the possible Sat 11 Jul quarter-final. Confirm exact date/time vs FIFA schedule.' },
      { slot: 'late', fixture: 'R32 match', importance: 'high' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Late knockout match', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Brazil knockout draws big' },
    packages: ['selecao', 'standard'],
    drinks: 'Caipirinha + samba',
    community: 'Brazil (Group C — knockout)',
    regulars: 'No regulars',
    actions: ['Brazilian community outreach refreshed', 'Confirm Brazil R32 date/time vs FIFA schedule'],
  },
  {
    date: '2026-07-03', weekday: 'Friday', phase: 'Round of 32 — Day 6 · SPAIN R32 projected',
    matches: [
      { slot: 'prime', fixture: 'SPAIN R32 (projected) — Group H winner', importance: 'high', notes: 'If Spain win Group H their R32 lands on the opposite half of the bracket from England (the two can only meet in the semi-finals). Confirm exact date/opponent vs FIFA schedule.' },
      { slot: 'late', fixture: 'R32 match', importance: 'high' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Friday + late knockout', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Friday + Spain knockout = busy' },
    packages: ['la-roja', 'standard'],
    drinks: 'Sangria + tapas',
    community: 'Spain (Group H — knockout)',
    regulars: 'Friday DJ moved or cancelled',
    actions: ['Confirm Spain R32 date/opponent vs FIFA schedule'],
  },
  // ─── Round of 16 ─────────────────────────────────────────────────────
  {
    date: '2026-07-04', weekday: 'Saturday', phase: 'Round of 16 — Day 1',
    matches: [
      { slot: 'prime', fixture: 'R16 match (TBC)', importance: 'high' },
      { slot: 'late', fixture: 'R16 match (TBC)', importance: 'high' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Saturday R16 + late match', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'Saturday peak + knockout stakes' },
    packages: ['standard', 'selecao', 'la-roja'],
    drinks: 'Full match menu',
    community: 'Mixed',
    regulars: 'Brunch ends 14:00',
    actions: ['Big push on pre-bookings — knockout = transferable deposits sell well'],
  },
  {
    date: '2026-07-05', weekday: 'Sunday', phase: 'Round of 16 — Day 2 · ENGLAND R16',
    matches: [
      { slot: 'graveyard', fixture: 'ENGLAND R16 — v Winner of Match 79 (Group A winner v 3rd C/E/F/H/I)', importance: 'sellout', notes: "If England win their R32, the R16 is at the Estadio Azteca, Mexico City — 01:00 BST kick-off, i.e. overnight Saturday 4 → Sunday 5 July. A graveyard slot, but an England knockout: file the TEN and plan a late one." },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: '01:00 BST kick-off runs deep into the night — TEN essential for the extended hours.', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'England R16 at 01:00 BST = late, emotional, alcohol-fuelled. Full staffing, dedicated glass-collector, cleaner stationed.' },
    packages: ['captains-table', 'walk-in'],
    drinks: "Captain's Table · Espresso Martinis for the small hours · half-time shot round",
    community: 'England (TBC opponent — overnight Sat→Sun kick-off)',
    regulars: 'Roast cancelled or pre-match only (closes 15:00)',
    actions: ['Tickets out 7 days before', 'Confirm 01:00 BST kick-off + file TEN', 'SIA door from 22:00 (Sat night)', 'Pre-arrange late-night taxis'],
  },
  {
    date: '2026-07-06', weekday: 'Monday', phase: 'Round of 16 — Day 3',
    matches: [
      { slot: 'prime', fixture: 'R16 match (TBC)', importance: 'high' },
      { slot: 'late', fixture: 'R16 match (TBC)', importance: 'high' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Late knockout', cost: '£21' },
    staff: { bar: 3, floor: 3, door: 1, notes: 'Monday knockout' },
    packages: ['standard'],
    drinks: 'Knockout menu',
    community: '—',
    regulars: 'No regulars',
    actions: [],
  },
  {
    date: '2026-07-07', weekday: 'Tuesday', phase: 'Round of 16 — Day 4',
    matches: [
      { slot: 'prime', fixture: 'R16 match (TBC)', importance: 'high' },
      { slot: 'late', fixture: 'R16 match (TBC)', importance: 'high' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Late knockout', cost: '£21' },
    staff: { bar: 3, floor: 3, door: 1, notes: 'Tuesday knockout' },
    packages: ['standard'],
    drinks: 'Knockout menu',
    community: '—',
    regulars: 'No regulars',
    actions: [],
  },
  // ─── Quarter-finals ──────────────────────────────────────────────────
  {
    date: '2026-07-08', weekday: 'Wednesday', phase: 'Rest day',
    matches: [],
    intensity: intensity('rest'),
    ten: { required: false, reason: 'No matches', cost: '—' },
    staff: { bar: 2, floor: 1, door: 0, notes: 'Skeleton — recovery day for staff' },
    packages: [],
    drinks: 'Standard',
    community: '—',
    regulars: 'Wednesday open mic returns if booked',
    actions: ['Restock thoroughly', 'Pay deposit refunds for eliminated team bookings'],
  },
  {
    date: '2026-07-09', weekday: 'Thursday', phase: 'Quarter-finals — Day 1 (other side of the bracket)',
    matches: [
      { slot: 'prime', fixture: 'Quarter-final — top half of the bracket (Spain/France region)', importance: 'high', notes: "England's QF is Sat 11 Jul, not tonight — England are seeded into the opposite half from Spain, Argentina and France, so those ties land on 9–10 Jul." },
      { slot: 'late', fixture: 'Quarter-final', importance: 'high' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Late knockout match', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Knockout crowd even without England. Neutrals + the relevant community for whichever big nation plays.' },
    packages: ['standard', 'la-roja'],
    drinks: 'Knockout cocktails (high-margin signature) · sangria if Spain play',
    community: 'Depends on fixtures (Spain a possibility — top-half QF)',
    regulars: 'No regulars Thursday',
    actions: ['Confirm QF pairings once R16 completes', 'Brief floor on emotional knockout crowd management'],
  },
  {
    date: '2026-07-10', weekday: 'Friday', phase: 'Quarter-finals — Day 2 (other side of the bracket)',
    matches: [
      { slot: 'prime', fixture: 'Quarter-final — top half of the bracket', importance: 'high', notes: "Friday-night knockout. England v Brazil (if it happens) is tomorrow, Sat 11 Jul — tonight is the other half (Spain/Argentina/France region)." },
      { slot: 'late', fixture: 'Quarter-final', importance: 'high' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Friday + late knockout', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Friday knockout double-header. Strong neutral + community draw.' },
    packages: ['standard', 'la-roja'],
    drinks: 'Premium cocktail jugs · sangria if Spain play',
    community: 'Depends on fixtures (Spain QF could land here)',
    regulars: 'Friday DJ cancelled',
    actions: ['Set explicit room flip between matches — 30-min ticketed entry windows', 'Build anticipation for the England v Brazil QF on Sat 11'],
  },
  {
    date: '2026-07-11', weekday: 'Saturday', phase: 'Quarter-final · ENGLAND v BRAZIL possible',
    clash: 'eng-bra',
    matches: [
      { slot: 'prime', fixture: 'ENGLAND v BRAZIL (possible) — Quarter-final', importance: 'sellout', notes: "Match 99 at Hard Rock Stadium, Miami — Saturday 11 July, 22:00 BST. If England win Group L and Brazil win Group C, this is the quarter-final they meet in (FIFA's seeding protects England from Spain/Argentina until the semis and France until the final, but NOT from 5th-ranked Brazil). The blockbuster of the tournament — England's biggest community and Brazil's both in one room." },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Saturday-night sell-out quarter-final, late finish + outside trade. TEN essential.', cost: '£21' },
    staff: { bar: 6, floor: 4, door: 3, notes: 'England v Brazil = the night of the tournament if it lands. EVERYONE works. SIA from 16:00. Dedicated glass-collector + cleaner. Plan the room for two huge, opposing crowds.' },
    packages: ['captains-table', 'walk-in'],
    drinks: "Captain's Table · England buckets + half-time shots · caipirinha jugs for the Brazilians · Final-stakes cocktail push",
    community: 'England v Brazil — two of the biggest football communities in London, in one room',
    regulars: 'Everything cancelled — full event mode',
    actions: ['As soon as the QF bracket confirms an England v Brazil tie, open ticketed pre-book immediately', 'Press pack — this is a press-worthy night', 'Brief floor on managing two rival crowds', 'SIA door from 16:00', 'Pre-arrange taxis + coordinate closing with neighbours'],
  },
  {
    date: '2026-07-12', weekday: 'Sunday', phase: 'Rest day',
    matches: [],
    intensity: intensity('rest'),
    ten: { required: false, reason: 'No matches', cost: '—' },
    staff: { bar: 3, floor: 2, door: 0, notes: 'Normal Sunday' },
    packages: [],
    drinks: 'Standard',
    community: '—',
    regulars: 'Roast service runs normally',
    actions: [],
  },
  {
    date: '2026-07-13', weekday: 'Monday', phase: 'Rest day',
    matches: [],
    intensity: intensity('rest'),
    ten: { required: false, reason: 'No matches', cost: '—' },
    staff: { bar: 2, floor: 1, door: 0, notes: 'Skeleton' },
    packages: [],
    drinks: 'Standard',
    community: '—',
    regulars: 'Quiz cancelled (still in tournament window)',
    actions: ['Confirm SF screen plan + capacity'],
  },
  // ─── Semi-finals ─────────────────────────────────────────────────────
  {
    date: '2026-07-14', weekday: 'Tuesday', phase: 'Semi-final 1 (top half of the bracket)',
    matches: [
      { slot: 'late', fixture: 'Semi-final 1 — top-half winners (Spain/France/Argentina region)', importance: 'sellout', notes: "First semi-final at AT&T Stadium, Arlington. This is the opposite half from England — England's potential SF is tomorrow, Wed 15 Jul, in Atlanta. Late BST kick-off." },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Late semi-final — extended hours beyond licence', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Even a non-England SF packs out — neutrals + the relevant community expats.' },
    packages: ['standard', 'la-roja'],
    drinks: 'Premium cocktail jugs · sangria if Spain reach it',
    community: 'Depends on finalists (Spain/France/Argentina region)',
    regulars: 'Everything cancelled',
    actions: ['Confirm which community to cater to once SF1 pairing is set', 'Build anticipation for a possible England SF tomorrow'],
  },
  {
    date: '2026-07-15', weekday: 'Wednesday', phase: 'Semi-final 2 · ENGLAND SF possible',
    matches: [
      { slot: 'late', fixture: 'ENGLAND SF (possible) — winner of the Miami QF', importance: 'sellout', notes: "Second semi-final at Mercedes-Benz Stadium, Atlanta — Wed 15 Jul. If England win their Miami quarter-final (the possible Brazil tie), this is their semi. The night of the tournament — late BST kick-off." },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Late England SF — extended hours beyond licence', cost: '£21' },
    staff: { bar: 6, floor: 4, door: 3, notes: 'England SF = the night of the tournament. EVERYONE works. Glass-collector + cleaner dedicated. SIA from 17:00.' },
    packages: ['captains-table', 'walk-in'],
    drinks: "Captain's Table + final-whistle shot round",
    community: 'England (TBC opponent)',
    regulars: 'Everything cancelled',
    actions: ['Tickets fully sold 2 weeks out — wait-list opens', 'Brief on overflow plan if room oversold', 'Pre-arrange taxi rank with TfL', 'Coordinate with neighbours re: noise + closing'],
  },
  {
    date: '2026-07-16', weekday: 'Thursday', phase: 'Rest day',
    matches: [],
    intensity: intensity('rest'),
    ten: { required: false, reason: 'No matches', cost: '—' },
    staff: { bar: 2, floor: 1, door: 0, notes: 'Skeleton' },
    packages: [],
    drinks: 'Standard',
    community: '—',
    regulars: 'No regulars',
    actions: ['Recovery + restock for Final weekend'],
  },
  {
    date: '2026-07-17', weekday: 'Friday', phase: 'Rest day',
    matches: [],
    intensity: intensity('rest'),
    ten: { required: false, reason: 'No matches', cost: '—' },
    staff: { bar: 3, floor: 2, door: 1, notes: 'Normal Friday' },
    packages: [],
    drinks: 'Standard',
    community: '—',
    regulars: 'Friday DJ returns',
    actions: ['Final weekend marketing push'],
  },
  // ─── Third-place + Final ─────────────────────────────────────────────
  {
    date: '2026-07-18', weekday: 'Saturday', phase: 'Third-place playoff',
    matches: [
      { slot: 'prime', fixture: 'Third-place match (TBC)', importance: 'medium', notes: 'Niche but expat-heavy for whichever countries lost in SFs.' },
    ],
    intensity: intensity('medium'),
    ten: { required: false, reason: 'Saturday afternoon kick-off likely within licence', cost: '—' },
    staff: { bar: 4, floor: 3, door: 1, notes: 'Normal Saturday + match' },
    packages: ['standard'],
    drinks: 'Standard + match menu',
    community: 'Depends on teams',
    regulars: 'Brunch normal',
    actions: ['Push Final pre-bookings hard — 24hrs to sell'],
  },
  {
    date: '2026-07-19', weekday: 'Sunday', phase: 'FINAL',
    matches: [
      { slot: 'prime', fixture: 'World Cup FINAL', importance: 'sellout', notes: 'At MetLife Stadium, New Jersey — Sunday 19 July, 20:00 BST kick-off (15:00 ET). An evening UK slot — the whole day builds to it.' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Final + extended hours + outside trade', cost: '£21' },
    staff: { bar: 6, floor: 4, door: 3, notes: 'EVERYONE works. Glass-collector dedicated. SIA team from 15:00. Cleaner stationed in toilets.' },
    packages: ['captains-table', 'walk-in'],
    drinks: 'Captain\'s Table at every table · Final-whistle bottle of champagne included in package · half-time shot round',
    community: 'Depends on finalists — plan A: England · plan B: Brazil/Spain · plan C: neutrals + South American',
    regulars: 'Roast cancelled or runs 12:00–15:00 only',
    actions: ['Ticketed Final package live 14 days out (5 July)', 'Coordinate closing time with Hackney Council + neighbours', 'TfL taxi-rank confirmation', 'Press pack — invite local press to cover the room', 'Post-match clean crew booked for 02:00'],
  },
]

// ─── Lookup helpers ──────────────────────────────────────────────────
export function packageById(id) {
  return PACKAGES.find(p => p.id === id) || null
}

export function intensityColor(level) {
  if (level === 'sellout') return '#C9A84C'      // gold — England + Final
  if (level === 'high')    return '#2DD4BF'      // teal — community / knockout
  if (level === 'medium')  return '#7B8FA1'      // grey-blue — standard match day
  if (level === 'low')     return '#5A5A5A'      // muted — quiet day
  if (level === 'rest')    return '#2A2A2A'      // near-invisible — no matches
  return '#5A5A5A'
}

export function intensityLabel(level) {
  if (level === 'sellout') return 'SELL-OUT'
  if (level === 'high')    return 'HIGH'
  if (level === 'medium')  return 'MEDIUM'
  if (level === 'low')     return 'LOW'
  if (level === 'rest')    return 'REST DAY'
  return level
}
