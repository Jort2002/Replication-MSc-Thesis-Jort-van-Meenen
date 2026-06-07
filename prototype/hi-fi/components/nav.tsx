"use client"
import Link from "next/link"
import { useLang } from "./lang-provider"

interface NavProps {
  showBack?: boolean
  backHref?: string
  step?: number
  totalSteps?: number
  wide?: boolean
}

function NavLinks({ lang }: { lang: string }) {
  const nl = lang === "nl"
  return (
    <div className="flex items-center gap-0.5">
      <Link
        href="/build"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 16 16">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:block">{nl ? "Nieuwe automation" : "New automation"}</span>
      </Link>
      <Link
        href="/automations"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 16 16">
          <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
          <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        <span className="hidden sm:block">{nl ? "Mijn automations" : "My automations"}</span>
      </Link>
    </div>
  )
}

export function Nav({ showBack, backHref = "/build", step, totalSteps, wide }: NavProps) {
  const { lang, setLang, tr } = useLang()
  const maxW = wide ? "max-w-6xl" : "max-w-3xl"

  return (
    <header className="w-full border-b border-border bg-white/90 backdrop-blur-sm sticky top-0 z-40">
      <div className={`${maxW} mx-auto px-6 h-16 flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-4">
          {showBack && backHref && (
            <Link
              href={backHref}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {tr.nav.back}
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground text-lg">
            <span className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white text-sm font-bold shadow-sm">A</span>
            {tr.appName}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <NavLinks lang={lang} />
          {step && totalSteps && (
            <span className="text-sm text-muted-foreground hidden sm:block px-1 border-l border-border ml-1 pl-3">
              {tr.nav.stepOf(step, totalSteps)}
            </span>
          )}
          <div className="flex rounded-lg border border-border overflow-hidden text-sm ml-1">
            {(["nl", "en"] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  lang === l
                    ? "bg-primary text-white"
                    : "bg-white text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {step && totalSteps && (
        <div className="h-1 bg-border">
          <div
            className="h-1 bg-primary transition-all duration-500"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      )}
    </header>
  )
}

export function TopNav() {
  const { lang, setLang, tr } = useLang()
  return (
    <header className="w-full border-b border-border bg-white/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground text-lg">
          <span className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white text-sm font-bold shadow-sm">A</span>
          {tr.appName}
        </Link>
        <div className="flex items-center gap-2">
          <NavLinks lang={lang} />
          <div className="flex rounded-lg border border-border overflow-hidden text-sm ml-1">
            {(["nl", "en"] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  lang === l ? "bg-primary text-white" : "bg-white text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
