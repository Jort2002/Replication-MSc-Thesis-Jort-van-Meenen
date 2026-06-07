"use client"
import { createContext, useContext, useState, ReactNode } from "react"
import { t, Lang, Translations } from "@/lib/i18n"

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  tr: Translations
}

const Ctx = createContext<LangCtx>({
  lang: "nl",
  setLang: () => {},
  tr: t.nl,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("nl")
  return (
    <Ctx.Provider value={{ lang, setLang, tr: t[lang] }}>
      {children}
    </Ctx.Provider>
  )
}

export function useLang() {
  return useContext(Ctx)
}
