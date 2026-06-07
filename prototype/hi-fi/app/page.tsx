"use client"
import Link from "next/link"
import { useEffect } from "react"
import { trackEvent } from "@/lib/analytics"
import { TopNav } from "@/components/nav"
import { useLang } from "@/components/lang-provider"

export default function WelcomePage() {
  const { tr } = useLang()

  useEffect(() => { trackEvent("page_view", { screen: "welcome" }) }, [])

  return (
    <main className="min-h-screen flex flex-col">
      <TopNav />

      <div className="flex-1 flex items-center">
        <div className="max-w-5xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center w-full">

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-8 flex flex-col gap-4">
              {[
                { label: tr.lang.nl === "NL" ? "Contactformulier ingestuurd" : "Contact form submitted", letters: "Tf", color: "#262627" },
                { label: tr.lang.nl === "NL" ? "Rij toegevoegd aan Google Sheets" : "Row added to Google Sheets", letters: "GS", color: "#0F9D58" },
                { label: tr.lang.nl === "NL" ? "Slack-melding verstuurd naar #new-leads" : "Slack alert sent to #new-leads", letters: "Sl", color: "#4A154B" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-border">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.letters}
                  </div>
                  <span className="text-sm text-foreground font-medium">{item.label}</span>
                  <span className="ml-auto text-xs font-semibold text-green-600">&#10003; Klaar</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">{tr.welcome.illustrationCaption}</p>
          </div>

          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-bold text-foreground leading-tight">
                {tr.welcome.headline}<br />
                <span className="text-primary">{tr.welcome.headlineAccent}</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {tr.welcome.body}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/build"
                className="inline-flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-6 py-4 font-semibold text-base hover:bg-primary/90 transition-colors w-full md:w-auto shadow-sm"
                onClick={() => trackEvent("new_automation_clicked", { source: "welcome" })}
              >
                {tr.welcome.cta}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/automations" className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center md:text-left">
                {tr.welcome.viewAutomations} &rarr;
              </Link>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground pt-1">
              {[tr.welcome.automationTick1, tr.welcome.automationTick2].map((tick, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold">&#10003;</span>
                  {tick}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
