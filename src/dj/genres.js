// Genre → sub-genre taxonomy for the DJ portal.
// Collated from the music styles across the vetted-DJ roster (DJ DETAILS CSV) —
// typos/variants merged (Brazillian→Brazilian, Sould→Soul, Afro→Afrobeat, etc.),
// compound tags split, and grouped under No Dice genre headers.
export const GENRES = {
  'House':            ['House', 'Deep House', 'Disco House', 'Organic House', 'Jazzy House', 'Vocal House', 'UK Funky', 'Amapiano'],
  'Disco':            ['Disco', 'Italo Disco', 'Disco Edits', 'Rare Disco', 'Shimmer Disco'],
  'Funk & Soul':      ['Funk', 'Soul', 'Groove Funk', 'Jazz Funk', 'Rare Groove', 'Boogie', 'High Life'],
  'Hip-Hop & Breaks': ['Hip-Hop', 'Old School Hip-Hop', 'B-Boy Breaks', 'Breaks', 'Broken Beat'],
  'Garage':           ['Garage', 'UK Garage'],
  'Techno & Tech':    ['Techno', 'Tech House', 'Jazz Tech', 'High-Tech Jazz'],
  'Electro & Bass':   ['Electro', 'EBM', 'Indie Dance', 'UK Bass', 'Jungle', 'Wobblecore', 'Dubstep'],
  'Global & World':   ['Afrobeat', 'Brazilian Grooves', 'Caribbean', 'Zouk', 'Arabic', 'Middle Eastern', 'Global Beats', 'Down Tempo', 'Latin'],
  'Reggae & Dub':     ['Reggae', 'Dub'],
}

export const GENRE_NAMES = Object.keys(GENRES)
export const ALL_SUBGENRES = Object.values(GENRES).flat()
export const genreOfSub = (sub) => GENRE_NAMES.find((g) => GENRES[g].includes(sub)) || null
