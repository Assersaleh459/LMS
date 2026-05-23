import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translate, type Lang } from '../../lib/i18n'

type LangState = {
  lang:       Lang
  dir:        'rtl' | 'ltr'
  ta:         'text-right' | 'text-left'   // text-align class
  fa:         'font-arabic' | ''            // font-arabic or empty
  t:          (key: string) => string
  toggleLang: () => void
}

const LangContext = createContext<LangState | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const stored = localStorage.getItem('lang')
    return stored === 'en' ? 'en' : 'ar'
  })

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('lang', lang)
  }, [lang])

  function toggleLang() {
    setLang(l => l === 'ar' ? 'en' : 'ar')
  }

  const value: LangState = {
    lang,
    dir:  lang === 'ar' ? 'rtl' : 'ltr',
    ta:   lang === 'ar' ? 'text-right' : 'text-left',
    fa:   lang === 'ar' ? 'font-arabic' : '',
    t:    (key) => translate(key, lang),
    toggleLang,
  }

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangState {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}
