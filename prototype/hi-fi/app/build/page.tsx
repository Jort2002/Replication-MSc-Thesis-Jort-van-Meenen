"use client"
import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { Nav } from "@/components/nav"
import { Textarea } from "@/components/ui/textarea"
import { trackEvent } from "@/lib/analytics"
import { useLang } from "@/components/lang-provider"

export default function BuildPage() {
  const router = useRouter()
  const { tr, lang } = useLang()
  const [prompt, setPrompt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isListening, setIsListening] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const handleSubmit = () => {
    if (!prompt.trim()) return
    trackEvent("prompt_submitted", { prompt_length: prompt.length })
    startTransition(async () => {
      setError(null)
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, lang }),
      })
      const data = await res.json()

      if (data.outOfScope) {
        setError(data.message)
        return
      }

      const params = new URLSearchParams({
        scenarioId: data.scenarioId,
        prompt,
        prefilled: JSON.stringify(data.prefilledAnswers ?? {}),
        confidence: data.confidence ?? "medium",
        critical: JSON.stringify(data.criticalQuestions ?? []),
      })
      router.push(`/build/clarify?${params}`)
    })
  }

  const handleMic = () => {
    if (typeof window === "undefined") return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const rec = new SR()
    rec.lang = lang === "nl" ? "nl-NL" : "en-US"
    rec.continuous = false
    rec.interimResults = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      setPrompt(prev => (prev ? prev + " " + text : text))
    }
    rec.onend = () => setIsListening(false)
    rec.onerror = () => setIsListening(false)
    rec.start()
    recognitionRef.current = rec
    setIsListening(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav step={1} totalSteps={5} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl flex flex-col gap-8">

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">{tr.build.title}</h1>
            <p className="text-muted-foreground text-base">{tr.build.subtitle}</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative">
              <Textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={tr.build.placeholder}
                className="min-h-[160px] text-base resize-none rounded-xl border-border focus:border-primary pr-14 leading-relaxed"
                onKeyDown={e => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit()
                }}
              />
              <button
                type="button"
                onClick={handleMic}
                title={isListening ? tr.build.micListening : tr.build.micTooltip}
                className={`absolute bottom-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  isListening
                    ? "bg-red-500 text-white pulse-ring"
                    : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {isListening && (
              <p className="text-sm text-red-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                {tr.build.micListening}
              </p>
            )}
            {error && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isPending}
            className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-6 py-4 font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full shadow-sm"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {tr.build.analyzing}
              </>
            ) : (
              <>
                {tr.build.cta}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>

          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{tr.build.orPick}</p>
            <div className="flex flex-col gap-2">
              {tr.build.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPrompt(s)
                    trackEvent("scenario_selected", { source: "suggestion_chip", index: i })
                  }}
                  className="text-left px-4 py-3.5 rounded-xl border border-border bg-white hover:border-primary hover:bg-primary/5 text-sm text-foreground transition-colors leading-relaxed"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
