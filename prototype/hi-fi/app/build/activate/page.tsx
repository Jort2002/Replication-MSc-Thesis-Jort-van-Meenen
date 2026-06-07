"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { Nav } from "@/components/nav"
import { ServiceIcon } from "@/components/service-icon"
import { SERVICES, ServiceId, WorkflowStep, getScenario } from "@/lib/scenarios"
import { trackEvent } from "@/lib/analytics"
import { useLang } from "@/components/lang-provider"
import { saveAutomation } from "@/lib/automations-store"

function workflowTitle(steps: WorkflowStep[]): string {
  const trigger = steps.find(s => s.type === "trigger")
  const actions = steps.filter(s => s.type !== "trigger")
  const triggerName = SERVICES[trigger?.service ?? "typeform"]?.name ?? "Trigger"
  const actionNames = actions.slice(0, 2).map(a => SERVICES[a.service]?.name ?? a.label)
  return actionNames.length > 0 ? `${triggerName} → ${actionNames.join(" + ")}` : triggerName
}

function ActivateContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { tr, lang } = useLang()

  const scenarioId = params.get("scenarioId") ?? "s1_contact_form"
  const prompt = params.get("prompt") ?? ""

  let customSteps: WorkflowStep[] = []
  try {
    const raw = params.get("steps")
    if (raw) customSteps = JSON.parse(raw)
  } catch { /* fall back to scenario */ }

  const scenario = getScenario(scenarioId)
  const steps = customSteps.length > 0 ? customSteps : (scenario?.steps ?? [])
  const title = workflowTitle(steps)
  const usedServices = [...new Set(steps.map(s => s.service))] as ServiceId[]

  const [savingDraft, setSavingDraft] = useState(false)
  const [notifyOptIn, setNotifyOptIn] = useState(true)

  useEffect(() => {
    trackEvent("page_view", { screen: "activation", scenarioId })
  }, [scenarioId])

  const handleActivate = () => {
    trackEvent("automation_activated", { scenarioId })
    saveAutomation(steps)
    const sp = new URLSearchParams({
      scenarioId,
      steps: JSON.stringify(steps),
      prompt,
    })
    router.push(`/build/success?${sp}`)
  }

  const handleSaveDraft = () => {
    setSavingDraft(true)
    trackEvent("save_draft_clicked", { scenarioId })
    saveAutomation(steps, true)
    setTimeout(() => router.push("/automations"), 600)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav step={5} totalSteps={5} showBack backHref="javascript:history.back()" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg flex flex-col gap-8 items-center text-center">

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">{tr.activate.title}</h1>
            <p className="text-muted-foreground">{tr.activate.subtitle}</p>
          </div>

          <div className="w-full bg-white rounded-2xl border border-border p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1 text-left">
              <p className="text-sm text-muted-foreground">{tr.activate.automationLabel}</p>
              <p className="font-semibold text-foreground">{title}</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              {usedServices.map(s => (
                <ServiceIcon key={s} serviceId={s} size="md" showLabel />
              ))}
            </div>

            <div className="flex flex-col gap-2 text-left">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-start gap-2.5 text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                    {i + 1}
                  </span>
                  <span className="text-foreground leading-snug">{step.description}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 text-xs text-muted-foreground text-left">
              {tr.activate.autoRuns}
            </div>
          </div>

          {/* GDPR / privacy card — prominent */}
          <div className="w-full flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 text-left">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 20 20">
              <path d="M10 2l6 3v5c0 4-2.5 7.5-6 9C4.5 17.5 2 14 2 10V5l8-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-blue-800">{tr.activate.gdpr}</p>
          </div>

          {/* First-run notification opt-in */}
          <button
            type="button"
            onClick={() => setNotifyOptIn(v => !v)}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-left hover:border-primary/40 transition-colors"
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${notifyOptIn ? "bg-primary border-primary" : "border-border"}`}>
              {notifyOptIn && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-foreground">{tr.activate.notifyOptIn}</span>
          </button>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleActivate}
              className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-6 py-4 font-semibold text-base hover:bg-primary/90 transition-colors w-full"
            >
              {tr.activate.ctaOn}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="flex items-center justify-center gap-2 border border-border bg-white text-foreground rounded-xl px-6 py-3 font-medium hover:bg-muted/50 transition-colors w-full disabled:opacity-60"
            >
              {savingDraft ? tr.activate.saving : tr.activate.ctaDraft}
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense>
      <ActivateContent />
    </Suspense>
  )
}
