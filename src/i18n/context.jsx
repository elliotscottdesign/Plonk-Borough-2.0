import React, { createContext, useContext, useState, useCallback } from 'react'
import { translate } from './dictionary.js'

const Ctx = createContext({ lang: 'en', setLang: () => {}, t: (s) => s })

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => sessionStorage.getItem('ndb_lang') || 'en')

  const setLang = useCallback((l) => {
    if (l) {
      sessionStorage.setItem('ndb_lang', l)
    } else {
      sessionStorage.removeItem('ndb_lang')
    }
    setLangState(l || 'en')
  }, [])

  const t = useCallback((s) => translate(s, lang), [lang])

  return (
    <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
  )
}

export const useLanguage = () => useContext(Ctx)
