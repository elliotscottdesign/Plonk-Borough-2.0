// World Cup 2026 planning data — founder-only, surfaced at /worldcup.
// Times are best-guess UK kick-off slots based on the typical USA/Canada/Mexico
// venue mix. Confirm exact fixtures + kick-off times against fifa.com /
// BBC Sport before printing anything customer-facing.

export const TOURNAMENT = {
  name: 'FIFA World Cup 2026',
  host: 'USA · Canada · Mexico',
  start: '2026-06-11',
  end: '2026-07-19',
  teams: 48,
  tables: 10,
  estCovers: 60,
}

// Communities we cater to in London. Borough Market sits in a part of
// SE1 with strong Brazilian + Spanish footfall, plus the usual English /
// Aussie expat presence.
export const COMMUNITIES = [
  {
    id: 'eng',
    flag: '🏴',
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
    action: 'Pull the licence from your records and re-read the operating schedule. If missing, file a minor variation with Southwark Council (£89, 28-day consultation).',
  },
  {
    id: 'ten',
    title: 'Temporary Event Notices (TENs)',
    status: 'file-now',
    cost: '£21 each · max 15/yr',
    detail: 'A TEN extends licensable activities beyond your premises licence — late hours, higher capacity, anything not normally permitted. 10 working-days minimum notice. Submit via Southwark Council\'s licensing portal.',
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
    id: 'borough-trust',
    title: 'Borough Market Trustees permission',
    status: 'check',
    cost: '—',
    detail: 'If trade spills onto Trustees-owned land (outside seating, A-boards) you need their approval in addition to Southwark Council. Tournament crowds will spill — get this in writing now.',
    action: 'Email the Trustees this week with proposed outside trade plan + match dates.',
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
      { slot: 'late', fixture: 'Mexico vs TBC — Opening match', importance: 'medium', notes: 'Hosted at Estadio Azteca, Mexico City. Likely 01:00 BST UK time given Mexico noon-ish slot OR late-evening if scheduled for primetime US.' },
    ],
    intensity: intensity('medium'),
    ten: { required: true, reason: 'Opening match could finish 03:00 BST. File a TEN to extend licensable activity to 03:30.', cost: '£21' },
    staff: { bar: 3, floor: 2, door: 1, notes: 'Soft launch — most of London still figuring out the tournament. Use this day to drill staff on packages.' },
    packages: ['standard', 'walk-in'],
    drinks: 'Margarita jugs (Mexico host theme) · Modelo / Pacifico buckets',
    community: 'Mexico-host vibe — bunting + flag visuals up. No specific community focus.',
    regulars: 'Standard Thursday programming pre-9pm; switch to match focus from 22:00.',
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
    date: '2026-06-13', weekday: 'Saturday', phase: 'Group stage — Day 3',
    matches: [
      { slot: 'early', fixture: 'Group match (TBC) — likely a big nation', importance: 'high' },
      { slot: 'prime', fixture: 'Group match (TBC)', importance: 'high' },
      { slot: 'late', fixture: 'Group match (TBC)', importance: 'medium' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Saturday late match + extended hours.', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'First proper Saturday of tournament — busy. SIA on door from 18:00.' },
    packages: ['standard', 'selecao', 'la-roja'],
    drinks: 'Caipirinha + sangria jugs prepped at scale · beer buckets · half-time cocktail push',
    community: 'Possible Brazil OR Spain group opener — check fixture list',
    regulars: 'Saturday brunch service ends 16:00 to flip room for matches',
    actions: ['Pre-batch jugs from 14:00', 'Sandwich-board outside Borough Market with day fixtures'],
  },
  {
    date: '2026-06-14', weekday: 'Sunday', phase: 'Group stage — Day 4 · ENGLAND likely',
    matches: [
      { slot: 'prime', fixture: 'ENGLAND vs TBC (Group stage 1) — TBC, but England traditionally play early in group', importance: 'sellout', notes: 'Confirm exact fixture + slot. Could fall on a different group-stage day — adjust this row when draw is locked.' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Sell-out England match — extended hours + outside trade.', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'ALL HANDS. SIA on door from 16:00. Glass-collector dedicated to floor.' },
    packages: ['three-lions', 'walk-in'],
    drinks: 'Camden Hells + Neck Oil buckets · half-time Jäger shot round (in package) · spirits + mixer doubles',
    community: '🏴 England — sell-out target',
    regulars: 'Cancel all Sunday regulars. Roast service truncated to 14:30.',
    actions: ['Open ticketed pre-bookings 4 weeks out (mid-May)', 'Brief floor on package half-time shot round', 'Confirm street A-board permission', 'Print England-specific menu cards'],
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
    date: '2026-06-17', weekday: 'Wednesday', phase: 'Group stage — Day 7',
    matches: [
      { slot: 'early', fixture: 'Group match (TBC)', importance: 'medium' },
      { slot: 'prime', fixture: 'Group match (TBC)', importance: 'high', notes: 'Possible Brazil group opener — verify' },
      { slot: 'late', fixture: 'Group match (TBC)', importance: 'medium' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Late match + extended trade if Brazil plays', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Brazilian community will fill the room if Brazil plays this slot. SIA from 18:00.' },
    packages: ['selecao', 'standard'],
    drinks: 'Caipirinha jugs · Brahma if sourced · samba playlist from 18:00',
    community: '🇧🇷 Brazil — target Brazilian Borough/Bermondsey community',
    regulars: 'No regulars Wednesday',
    actions: ['Outreach to local Brazilian community (Instagram, Olá Londres, Brazilian church groups)', 'Pre-batch caipirinha mix'],
  },
  {
    date: '2026-06-18', weekday: 'Thursday', phase: 'Group stage — Day 8',
    matches: [
      { slot: 'prime', fixture: 'Group match (TBC) — possible Spain opener', importance: 'high' },
      { slot: 'late', fixture: 'Group match (TBC)', importance: 'medium' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Late match runs past licence cut-off', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 1, notes: 'If Spain plays, expect a Spanish-language room. Brief floor on tapas board.' },
    packages: ['la-roja', 'standard'],
    drinks: 'Sangria jugs · Estrella Damm · Tinto de Verano',
    community: '🇪🇸 Spain — push tapas package via Spanish-language Instagram targeting',
    regulars: 'No regulars Thursday',
    actions: ['Confirm tapas supply with chef', 'Spanish-language flyer printed for surrounding area'],
  },
  {
    date: '2026-06-19', weekday: 'Friday', phase: 'Group stage — Day 9 · possible ENGLAND #2',
    matches: [
      { slot: 'prime', fixture: 'ENGLAND vs TBC (likely Group game 2)', importance: 'sellout', notes: 'Confirm fixture. Friday-night England game = massive.' },
      { slot: 'late', fixture: 'Group match (TBC)', importance: 'medium' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Sell-out + Friday + late', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'Full England staffing. Friday-night sell-out + walk-in queue management.' },
    packages: ['three-lions', 'walk-in'],
    drinks: 'England package drinks · half-time shot round',
    community: '🏴 England — sell-out',
    regulars: 'Friday DJ cancelled or moved to 23:30',
    actions: ['Pre-bookings 4 weeks out', 'SIA door from 17:00', 'Outside A-board with Three Lions package QR'],
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
    staff: { bar: 4, floor: 3, door: 2, notes: 'Big Saturday — Borough Market full. Walk-in conversion key.' },
    packages: ['standard', 'selecao', 'la-roja'],
    drinks: 'Cocktail jugs across the board',
    community: 'Mixed — depends on fixtures',
    regulars: 'Saturday brunch ends 15:00',
    actions: ['Borough Market footfall conversion plan — sandwich-board + greeter from 14:00'],
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
    date: '2026-06-22', weekday: 'Monday', phase: 'Group stage — Day 12',
    matches: [
      { slot: 'prime', fixture: 'Group match (TBC)', importance: 'medium' },
      { slot: 'late', fixture: 'Group match (TBC) — possible Australia', importance: 'medium', notes: 'Australia often gets a late-UK slot from West-coast US venues.' },
    ],
    intensity: intensity('medium'),
    ten: { required: true, reason: 'Late match if Australia plays West-coast venue', cost: '£21' },
    staff: { bar: 3, floor: 2, door: 1, notes: 'Aussie expat draw — late but loyal' },
    packages: ['matildas', 'standard'],
    drinks: 'VB / Coopers · Espresso Martinis for the late kick-off',
    community: '🇦🇺 Australia',
    regulars: 'No regulars Monday',
    actions: ['Outreach to Aussie expat groups (London Aussies FB group)'],
  },
  {
    date: '2026-06-23', weekday: 'Tuesday', phase: 'Group stage — Day 13',
    matches: [
      { slot: 'early', fixture: 'Group match (TBC)', importance: 'medium' },
      { slot: 'prime', fixture: 'Group match (TBC)', importance: 'medium' },
      { slot: 'late', fixture: 'Group match (TBC)', importance: 'low' },
    ],
    intensity: intensity('medium'),
    ten: { required: false, reason: 'Confirm late-match slot', cost: '—' },
    staff: { bar: 3, floor: 2, door: 0, notes: 'Standard mid-week' },
    packages: ['standard'],
    drinks: 'Standard',
    community: '—',
    regulars: 'No regulars Tuesday',
    actions: [],
  },
  {
    date: '2026-06-24', weekday: 'Wednesday', phase: 'Group stage — Day 14',
    matches: [
      { slot: 'prime', fixture: 'Group match (TBC) — possible Brazil #2', importance: 'high' },
      { slot: 'late', fixture: 'Group match (TBC)', importance: 'medium' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Brazil second group game likely high turnout', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 1, notes: 'Brazilian crowd' },
    packages: ['selecao', 'standard'],
    drinks: 'Caipirinha jugs · samba playlist',
    community: '🇧🇷 Brazil',
    regulars: 'No regulars Wednesday',
    actions: ['Reinforce Brazil-community outreach'],
  },
  {
    date: '2026-06-25', weekday: 'Thursday', phase: 'Group stage — Day 15 · possible ENGLAND #3',
    matches: [
      { slot: 'prime', fixture: 'ENGLAND vs TBC (Group game 3) — qualification on the line', importance: 'sellout', notes: 'Final group match. Confirm slot.' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Sell-out England match', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'Full England staffing. Qualification stakes = peak emotional crowd.' },
    packages: ['three-lions', 'walk-in'],
    drinks: 'England package · half-time shot round',
    community: '🏴 England',
    regulars: 'Cancel Thursday regulars',
    actions: ['Sell out 100% via pre-book by Monday before', 'SIA door from 17:00'],
  },
  {
    date: '2026-06-26', weekday: 'Friday', phase: 'Group stage — Day 16',
    matches: [
      { slot: 'prime', fixture: 'Group match (TBC) — possible Spain #2', importance: 'high' },
      { slot: 'late', fixture: 'Group match (TBC)', importance: 'medium' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Friday late + possible Spain crowd', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Friday + Spain' },
    packages: ['la-roja', 'standard'],
    drinks: 'Sangria · Estrella · tapas board',
    community: '🇪🇸 Spain',
    regulars: 'Friday DJ adjusted',
    actions: ['Push La Roja package via Spanish Instagram targeting'],
  },
  {
    date: '2026-06-27', weekday: 'Saturday', phase: 'Group stage — Final Day',
    matches: [
      { slot: 'prime', fixture: 'Final group fixtures (multiple, simultaneous)', importance: 'high', notes: 'Last day of group stage often has parallel kick-offs — pick the most relevant match for the main screen, smaller screens for the others.' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Late matches + Saturday extended trade', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Last group day — punter knowledge peaks. Big Saturday.' },
    packages: ['standard', 'selecao', 'la-roja'],
    drinks: 'Full match menu',
    community: 'Mixed',
    regulars: 'Brunch ends 15:00',
    actions: ['Screen plan: confirm which match goes on the main screen 48hrs out'],
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
    date: '2026-07-01', weekday: 'Wednesday', phase: 'Round of 32 — Day 4',
    matches: [
      { slot: 'prime', fixture: 'R32 match (TBC) — possible ENGLAND R32', importance: 'sellout', notes: 'If England top their group, likely R32 lands around here. Confirm bracket.' },
      { slot: 'late', fixture: 'R32 match (TBC)', importance: 'high' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Sell-out + late match', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'Full England staffing IF England play' },
    packages: ['captains-table', 'walk-in'],
    drinks: 'Captain\'s Table package + walk-in beer + half-time shots',
    community: '🏴 England (TBC)',
    regulars: 'No regulars',
    actions: ['Re-open ticketed pre-book the day group stage ends', 'SIA door from 17:00'],
  },
  {
    date: '2026-07-02', weekday: 'Thursday', phase: 'Round of 32 — Day 5',
    matches: [
      { slot: 'prime', fixture: 'R32 match (TBC) — possible Brazil R32', importance: 'high' },
      { slot: 'late', fixture: 'R32 match (TBC)', importance: 'high' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Late match', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Brazil knockout draws big' },
    packages: ['selecao', 'standard'],
    drinks: 'Caipirinha + samba',
    community: '🇧🇷 Brazil (TBC)',
    regulars: 'No regulars',
    actions: ['Brazilian community outreach refreshed'],
  },
  {
    date: '2026-07-03', weekday: 'Friday', phase: 'Round of 32 — Day 6',
    matches: [
      { slot: 'prime', fixture: 'R32 match (TBC) — possible Spain R32', importance: 'high' },
      { slot: 'late', fixture: 'R32 match (TBC)', importance: 'high' },
    ],
    intensity: intensity('high'),
    ten: { required: true, reason: 'Friday + late', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Friday + Spain knockout = busy' },
    packages: ['la-roja', 'standard'],
    drinks: 'Sangria + tapas',
    community: '🇪🇸 Spain (TBC)',
    regulars: 'Friday DJ moved or cancelled',
    actions: [],
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
    date: '2026-07-05', weekday: 'Sunday', phase: 'Round of 16 — Day 2',
    matches: [
      { slot: 'prime', fixture: 'R16 match (TBC) — possible ENGLAND R16', importance: 'sellout' },
      { slot: 'late', fixture: 'R16 match (TBC)', importance: 'high' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Sell-out + late', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'Sunday England R16 = peak emotional draw' },
    packages: ['captains-table', 'walk-in'],
    drinks: 'Captain\'s Table',
    community: '🏴 England (TBC)',
    regulars: 'Roast cancelled or pre-match only (closes 15:00)',
    actions: ['Tickets out 7 days before', 'SIA door from 16:00'],
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
    date: '2026-07-09', weekday: 'Thursday', phase: 'Quarter-finals — Day 1',
    matches: [
      { slot: 'prime', fixture: 'QF #1 (TBC)', importance: 'high' },
      { slot: 'late', fixture: 'QF #2 (TBC) — possible ENGLAND QF', importance: 'sellout' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'England QF (TBC) + late', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'England QF = absolute peak. Plus the earlier QF still pulls a knockout crowd.' },
    packages: ['captains-table', 'walk-in'],
    drinks: 'Captain\'s Table + half-time shots',
    community: '🏴 England (TBC)',
    regulars: 'No regulars Thursday',
    actions: ['Tickets to sell out by Sunday before', 'Brief floor on emotional crowd management — final whistle either elation or grief'],
  },
  {
    date: '2026-07-10', weekday: 'Friday', phase: 'Quarter-finals — Day 2',
    matches: [
      { slot: 'prime', fixture: 'QF #3 (TBC)', importance: 'sellout' },
      { slot: 'late', fixture: 'QF #4 (TBC)', importance: 'sellout' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Friday + 2x QF', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'Friday QF double-header — back-to-back sell-out potential' },
    packages: ['standard', 'selecao', 'la-roja'],
    drinks: 'Premium cocktail jugs',
    community: 'Brazil or Spain QF likely lands here',
    regulars: 'Friday DJ cancelled',
    actions: ['Set explicit room flip between matches — 30-min ticketed entry windows'],
  },
  {
    date: '2026-07-11', weekday: 'Saturday', phase: 'Rest day',
    matches: [],
    intensity: intensity('rest'),
    ten: { required: false, reason: 'No matches', cost: '—' },
    staff: { bar: 3, floor: 2, door: 1, notes: 'Normal Saturday trading without matches' },
    packages: [],
    drinks: 'Standard',
    community: '—',
    regulars: 'Normal Saturday',
    actions: ['Heavy clean + reset for SF week'],
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
    date: '2026-07-14', weekday: 'Tuesday', phase: 'Semi-final 1',
    matches: [
      { slot: 'late', fixture: 'SF #1 (TBC) — possible ENGLAND SF', importance: 'sellout', notes: '02:00 BST is realistic if East-coast 9pm slot. Could be earlier — confirm.' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Late SF — extended hours beyond licence', cost: '£21' },
    staff: { bar: 5, floor: 3, door: 2, notes: 'England SF = the night of the tournament. Glass-collector + cleaner dedicated. SIA from 17:00.' },
    packages: ['captains-table', 'walk-in'],
    drinks: 'Captain\'s Table + Final whistle shot round',
    community: '🏴 England (TBC)',
    regulars: 'Everything cancelled',
    actions: ['Tickets fully sold 2 weeks out — wait-list opens', 'Brief on overflow plan if room oversold', 'Pre-arrange taxi rank with TfL', 'Coordinate with neighbours re: noise + closing'],
  },
  {
    date: '2026-07-15', weekday: 'Wednesday', phase: 'Semi-final 2',
    matches: [
      { slot: 'late', fixture: 'SF #2 (TBC)', importance: 'sellout' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Late SF', cost: '£21' },
    staff: { bar: 4, floor: 3, door: 2, notes: 'Even non-England SF will pack out — neutrals + losing country expats' },
    packages: ['standard', 'selecao', 'la-roja'],
    drinks: 'Cocktail jugs',
    community: 'Brazil or Spain SF likely',
    regulars: 'Everything cancelled',
    actions: ['Confirm tickets for whichever community matches the fixture'],
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
      { slot: 'late', fixture: 'World Cup Final (TBC)', importance: 'sellout', notes: 'Hosted at MetLife Stadium, NJ. East-coast prime time = ~21:00 BST or 00:00 BST depending on FIFA scheduling.' },
    ],
    intensity: intensity('sellout'),
    ten: { required: true, reason: 'Final + extended hours + outside trade', cost: '£21' },
    staff: { bar: 6, floor: 4, door: 3, notes: 'EVERYONE works. Glass-collector dedicated. SIA team from 15:00. Cleaner stationed in toilets.' },
    packages: ['captains-table', 'walk-in'],
    drinks: 'Captain\'s Table at every table · Final-whistle bottle of champagne included in package · half-time shot round',
    community: 'Depends on finalists — plan A: England · plan B: Brazil/Spain · plan C: neutrals + South American',
    regulars: 'Roast cancelled or runs 12:00–15:00 only',
    actions: ['Ticketed Final package live 14 days out (5 July)', 'Coordinate closing time with Trustees + neighbours', 'TfL taxi-rank confirmation', 'Press pack — invite local press to cover the room', 'Post-match clean crew booked for 02:00'],
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
