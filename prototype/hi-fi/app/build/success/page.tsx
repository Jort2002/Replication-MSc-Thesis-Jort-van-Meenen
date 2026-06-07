"use client"
import { useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import Link from "next/link"
import { SERVICES, WorkflowStep, getScenario } from "@/lib/scenarios"
import { trackEvent } from "@/lib/analytics"
import { useLang } from "@/components/lang-provider"
import { Nav } from "@/components/nav"

// Triggers that fire only when an external event happens — automation is "on" but can't confirm "it ran"
function isWaitingTrigger(steps: WorkflowStep[]): boolean {
  const trigger = steps.find(s => s.type === "trigger")
  if (!trigger) return false
  const cat = SERVICES[trigger.service]?.category
  return cat === "social" || cat === "analytics" || cat === "content"
}

function buildWaitingDescription(steps: WorkflowStep[], lang: string): string {
  const trigger = steps.find(s => s.type === "trigger")
  const cat = SERVICES[trigger?.service ?? "mention_app"]?.category
  const nl = lang === "nl"

  if (cat === "social") return nl
    ? "Ajora luistert nu actief naar vermeldingen van jouw merk op social media. Zodra er een nieuwe vermelding binnenkomt, start de workflow automatisch."
    : "Ajora is now actively listening for mentions of your brand on social media. The moment a new mention comes in, the workflow starts automatically."

  if (cat === "analytics") return nl
    ? "Ajora haalt periodiek je analyticsdata op. De eerste uitvoering vindt plaats bij de volgende geplande rapportageperiode."
    : "Ajora will periodically retrieve your analytics data. The first run will happen at the next scheduled reporting period."

  if (cat === "content") return nl
    ? "Ajora monitort je RSS-feed continu op nieuwe artikelen. Zodra er een nieuw artikel verschijnt, start de workflow automatisch."
    : "Ajora continuously monitors your RSS feed for new articles. The moment a new article is published, the workflow starts automatically."

  return nl
    ? "Ajora staat klaar en start de workflow zodra de trigger afgaat."
    : "Ajora is ready and will start the workflow as soon as the trigger fires."
}

function buildSuccessSummary(steps: WorkflowStep[], lang: string): string {
  const nl = lang === "nl"
  const trigger = steps.find(s => s.type === "trigger")
  const actions = steps.filter(s => s.type !== "trigger")

  const triggerName = SERVICES[trigger?.service ?? "typeform"]?.name ?? "het formulier"

  const actionDescriptions = actions.map(a => {
    const cat = SERVICES[a.service]?.category
    const name = SERVICES[a.service]?.name ?? a.label
    if (a.type === "ai")    return nl ? `AI-verwerking voltooid` : `AI processing completed`
    if (cat === "crm")      return nl ? `contact aangemaakt in ${name}` : `contact created in ${name}`
    if (cat === "email")    return nl ? `welkomstmail verstuurd via ${name}` : `welcome email sent via ${name}`
    if (cat === "chat")     return nl ? `team gemeld via ${name}` : `team notified via ${name}`
    if (cat === "sheet")    return nl ? `gegevens opgeslagen in ${name}` : `data saved to ${name}`
    if (cat === "calendar") return nl ? `agenda-uitnodiging verstuurd` : `calendar invite sent`
    return nl ? `voltooid via ${name}` : `completed via ${name}`
  })

  if (actionDescriptions.length === 0) {
    return nl
      ? `${triggerName} heeft de automation gestart.`
      : `${triggerName} triggered the automation.`
  }

  return nl
    ? `Ajora heeft ${actionDescriptions.join(", ")} — alles automatisch, zonder dat je er iets voor hoeft te doen.`
    : `Ajora has ${actionDescriptions.join(", ")} — all automatically, without you lifting a finger.`
}

function SuccessContent() {
  const params = useSearchParams()
  const { tr, lang } = useLang()

  const scenarioId = params.get("scenarioId") ?? "s1_contact_form"

  let customSteps: WorkflowStep[] = []
  try {
    const raw = params.get("steps")
    if (raw) customSteps = JSON.parse(raw)
  } catch { /* fall back */ }

  const scenario = getScenario(scenarioId)
  const steps = customSteps.length > 0 ? customSteps : (scenario?.steps ?? [])
  const waiting = isWaitingTrigger(steps)

  useEffect(() => {
    trackEvent("success_screen_viewed", { scenarioId, waiting })
  }, [scenarioId, waiting])

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="max-w-lg flex flex-col items-center gap-8">

          {waiting ? (
            // ── WAITING MODE: automation is on, hasn't run yet ──────────────
            <>
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-9 h-9 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold text-foreground">{tr.success.waitingTitle}</h1>
                <p className="text-lg text-muted-foreground">{tr.success.waitingSubtitle}</p>
              </div>

              <div className="w-full bg-white rounded-2xl border border-primary/20 px-6 py-5 flex flex-col gap-3 text-left">
                <p className="text-sm font-semibold text-primary">{tr.success.waitingLabel}</p>
                <p className="text-sm text-foreground leading-relaxed">{buildWaitingDescription(steps, lang)}</p>
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">{tr.success.waitingNote}</p>
                </div>
              </div>

              <div className="w-full bg-primary/5 rounded-2xl border border-primary/20 px-6 py-4 text-left">
                <p className="text-sm font-medium text-primary">{tr.success.waitingSavesTitle}</p>
                <p className="text-sm text-muted-foreground mt-1">{tr.success.waitingSavesBody}</p>
              </div>
            </>
          ) : (
            // ── CONFIRMED MODE: automation already ran ──────────────────────
            <>
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold text-foreground">{tr.success.title}</h1>
                <p className="text-lg text-muted-foreground">{tr.success.subtitle}</p>
              </div>

              <div className="w-full bg-white rounded-2xl border border-green-200 px-6 py-5 flex flex-col gap-3 text-left">
                <p className="text-sm font-semibold text-green-800">{tr.success.whatHappened}</p>
                <p className="text-sm text-foreground leading-relaxed">{buildSuccessSummary(steps, lang)}</p>
                <div className="border-t border-green-100 pt-3">
                  <p className="text-xs text-muted-foreground">{tr.success.fromNowOn}</p>
                </div>
              </div>

              <div className="w-full bg-primary/5 rounded-2xl border border-primary/20 px-6 py-4 text-left">
                <p className="text-sm font-medium text-primary">{tr.success.whatItSavesTitle}</p>
                <p className="text-sm text-muted-foreground mt-1">{tr.success.whatItSavesBody}</p>
              </div>
            </>
          )}

          <div className="flex gap-3 w-full">
            <Link
              href="/automations"
              className="flex-1 flex items-center justify-center gap-2 border border-border bg-white text-foreground rounded-xl px-5 py-3 font-medium hover:bg-muted/50 transition-colors text-sm"
            >
              {tr.success.ctaDashboard}
            </Link>
            <Link
              href="/build"
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-5 py-3 font-medium hover:bg-primary/90 transition-colors text-sm"
              onClick={() => trackEvent("new_automation_clicked", { source: "success_screen" })}
            >
              {tr.success.ctaBuild}
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
