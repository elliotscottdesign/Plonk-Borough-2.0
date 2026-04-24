import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Namespaces
import enCommon from './locales/en/common.json'
import enCover from './locales/en/cover.json'
import enSummary from './locales/en/summary.json'
import enFunds from './locales/en/funds.json'
import enMarket from './locales/en/market.json'
import enWaterfall from './locales/en/waterfall.json'
import enGrowth from './locales/en/growth.json'
import enCase from './locales/en/case.json'
import enVenue from './locales/en/venue.json'
import enExplorer from './locales/en/explorer.json'
import enGate from './locales/en/gate.json'

import ptCommon from './locales/pt-BR/common.json'
import ptCover from './locales/pt-BR/cover.json'
import ptSummary from './locales/pt-BR/summary.json'
import ptFunds from './locales/pt-BR/funds.json'
import ptMarket from './locales/pt-BR/market.json'
import ptWaterfall from './locales/pt-BR/waterfall.json'
import ptGrowth from './locales/pt-BR/growth.json'
import ptCase from './locales/pt-BR/case.json'
import ptVenue from './locales/pt-BR/venue.json'
import ptExplorer from './locales/pt-BR/explorer.json'
import ptGate from './locales/pt-BR/gate.json'

const NAMESPACES = [
  'common', 'cover', 'summary', 'funds', 'market',
  'waterfall', 'growth', 'case', 'venue', 'explorer', 'gate',
]

const initialLang = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ndb_lang')) || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        cover: enCover,
        summary: enSummary,
        funds: enFunds,
        market: enMarket,
        waterfall: enWaterfall,
        growth: enGrowth,
        case: enCase,
        venue: enVenue,
        explorer: enExplorer,
        gate: enGate,
      },
      'pt-BR': {
        common: ptCommon,
        cover: ptCover,
        summary: ptSummary,
        funds: ptFunds,
        market: ptMarket,
        waterfall: ptWaterfall,
        growth: ptGrowth,
        case: ptCase,
        venue: ptVenue,
        explorer: ptExplorer,
        gate: ptGate,
      },
    },
    lng: initialLang,
    fallbackLng: 'en',
    ns: NAMESPACES,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  })

// Keep sessionStorage in sync with i18n language changes.
i18n.on('languageChanged', (lng) => {
  try {
    if (lng && lng !== 'en') sessionStorage.setItem('ndb_lang', lng)
    else sessionStorage.removeItem('ndb_lang')
  } catch {
    /* no-op */
  }
})

export default i18n
