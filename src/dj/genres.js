// Genre → sub-genre taxonomy for the DJ portal.
// STARTER list derived from the vetted DJs' music styles. When the founder
// sends their genres CSV, replace just this GENRES object — nothing else changes.
export const GENRES = {
  'House':            ['Deep House', 'Disco House', 'Organic House', 'Jazzy House', 'Vocal House', 'UK Funky'],
  'Disco':            ['Italo Disco', 'Nu-Disco', 'Disco Edits', 'Rare Disco', 'Shimmer Disco'],
  'Funk & Soul':      ['Funk', 'Soul', 'Rare Groove', 'Jazz Funk', 'Boogie', 'High Life'],
  'Hip-Hop':          ['Old School Hip-Hop', 'Boom Bap', 'B-Boy Breaks', 'UK Bass'],
  'Garage':           ['UK Garage', '2-Step', 'Speed Garage', 'Bassline'],
  'Techno & Tech':    ['Techno', 'Tech House', 'Jazz Tech', 'Minimal'],
  'Breaks & Electro': ['Breaks', 'Electro', 'EBM', 'Indie Dance', 'Broken Beat'],
  'Global & World':   ['Afrobeat', 'Amapiano', 'Brazilian Grooves', 'Caribbean', 'Zouk', 'Arabic / Middle Eastern', 'Global Beats', 'Down Tempo'],
  'Jazz & Latin':     ['Jazz', 'High-Tech Jazz', 'Latin', 'Bossa'],
  'Reggae & Dub':     ['Reggae', 'Dub', 'Dubstep'],
  'Bass & Jungle':    ['Jungle', 'Drum & Bass', 'Wobblecore'],
}

export const GENRE_NAMES = Object.keys(GENRES)
export const ALL_SUBGENRES = Object.values(GENRES).flat()
export const genreOfSub = (sub) => GENRE_NAMES.find((g) => GENRES[g].includes(sub)) || null
