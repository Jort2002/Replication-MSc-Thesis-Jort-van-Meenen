"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Nav } from "@/components/nav"
import { ServiceIcon } from "@/components/service-icon"
import { getScenario, ServiceId, WorkflowStep } from "@/lib/scenarios"
import { trackEvent } from "@/lib/analytics"
import { useLang } from "@/components/lang-provider"

function StepCard({
  step,
  typeLabel,
}: {
  step: WorkflowStep
  typeLabel: string
}) {
  const typeColors: Record<string, string> = {
    trigger: "border-primary bg-primary/5",
    action: "border-border bg-white",
    ai: "border-amber-300 bg-amber-50",
  }

  return (
    <div className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 shadow-sm ${typeColors[step.type] ?? "border-border bg-white"}`}>
      <ServiceIcon serviceId={step.service} size="md" />
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{typeLabel}</span>
        <span className="text-sm font-semibold text-foreground leading-snug">{step.label}</span>
        <span className="text-xs text-muted-foreground leading-snug">{step.description}</span>
      </div>
    </div>
  )
}

function PreviewContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { tr, lang } = useLang()

  const scenarioId = params.get("scenarioId") ?? "s1_contact_form"
  const prompt = params.get("prompt") ?? ""
  const answers: Record<string, string> = JSON.parse(params.get("answers") ?? "{}")

  const scenario = getScenario(scenarioId)
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [isGenerating, setIsGenerating] = useState(true)
  const [nlEdit, setNlEdit] = useState("")
  const [isApplyingEdit, setIsApplyingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    trackEvent("page_view", { screen: "preview", scenarioId })

    const loadSteps = async (forceFallback = false) => {
      try {
        const r = await fetch("/api/generate-steps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, answers, scenarioId, lang, forceFallback }),
        })
        const data = await r.json()
        if (data.steps?.length > 0) {
          setSteps(data.steps)
        } else if (!forceFallback) {
          await loadSteps(true) // retry with forced fallback
        } else {
          setSteps(scenario?.steps ?? [])
        }
      } catch {
        if (!forceFallback) {
          await loadSteps(true) // retry with forced fallback
        } else {
          setSteps(scenario?.steps ?? [])
        }
      } finally {
        setIsGenerating(false)
      }
    }

    loadSteps()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!scenario) return null

  const getTypeLabel = (type: string) =>
    type === "trigger" ? tr.preview.triggerLabel
    : type === "ai" ? tr.preview.aiLabel
    : tr.preview.actionLabel

  const handleNlEdit = async () => {
    if (!nlEdit.trim()) return
    setIsApplyingEdit(true)
    setEditError(null)
    try {
      const res = await fetch("/api/edit-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps, instruction: nlEdit, lang }),
      })
      const data = await res.json()
      if (data.steps && data.steps.length > 0) {
        if (data.source === "unchanged") {
          setEditError(data.hint ?? tr.preview.editUnchanged)
        } else {
          setSteps(data.steps)
          setNlEdit("")
          trackEvent("plan_edit_clicked", { scenarioId, type: "nl" })
        }
      } else {
        setEditError(tr.preview.editError)
      }
    } catch {
      setEditError(tr.preview.editError)
    } finally {
      setIsApplyingEdit(false)
    }
  }

  const handleAccept = () => {
    trackEvent("plan_accepted", { scenarioId })
    const p = new URLSearchParams({
      scenarioId,
      prompt,
      answers: JSON.stringify(answers),
      steps: JSON.stringify(steps),
    })
    router.push(`/build/test?${p}`)
  }

  const usedServices = [...new Set(steps.map(s => s.service))] as ServiceId[]

  if (isGenerating) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Nav step={3} totalSteps={5} showBack backHref={`/build/clarify?scenarioId=${scenarioId}&prompt=${encodeURIComponent(prompt)}&prefilled={}`} />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">
            {lang === "nl" ? "Workflow opbouwen op basis van jouw wensen..." : "Building your workflow..."}
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav step={3} totalSteps={5} showBack backHref={`/build/clarify?scenarioId=${scenarioId}&prompt=${encodeURIComponent(prompt)}&prefilled={}`} />

      <main className="flex-1 flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-2xl flex flex-col gap-6">

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-foreground">{tr.preview.title}</h1>
            <p className="text-muted-foreground text-sm">{tr.preview.subtitle}</p>
          </div>

          {/* Workflow step list */}
          <div className="flex flex-col">
            {steps.map((step, i) => (
              <div key={step.id} className="flex flex-col items-stretch">
                <StepCard
                  step={step}
                  typeLabel={getTypeLabel(step.type)}
                />
                {i < steps.length - 1 && (
                  <div className="flex flex-col items-center py-0.5">
                    <div className="w-px h-4 bg-primary/30" />
                    <svg className="w-3 h-2 text-primary/40" fill="currentColor" viewBox="0 0 12 8">
                      <path d="M6 8L0 0h12L6 8z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Natural language edit */}
          <div className="rounded-2xl border border-border bg-white p-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">{tr.preview.nlEditTitle}</p>
            <textarea
              value={nlEdit}
              onChange={e => { setNlEdit(e.target.value); setEditError(null) }}
              className="rounded-xl border border-border px-4 py-3 text-sm resize-none min-h-[72px] focus:outline-none focus:border-primary bg-background"
              placeholder={tr.preview.nlEditPlaceholder}
            />
            {editError && <p className="text-xs text-red-600">{editError}</p>}
            <div className="flex justify-end">
              <button
                onClick={handleNlEdit}
                disabled={!nlEdit.trim() || isApplyingEdit}
                className="flex items-center gap-2 bg-muted text-foreground rounded-xl px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
              >
                {isApplyingEdit ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                    {tr.preview.applying}
                  </>
                ) : tr.preview.applyEdit}
              </button>
            </div>
          </div>

          {/* Tools used */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{tr.preview.toolsConnected}</span>
            {usedServices.map(s => (
              <ServiceIcon key={s} serviceId={s} size="sm" showLabel />
            ))}
          </div>

          <button
            onClick={handleAccept}
            className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-6 py-4 font-semibold hover:bg-primary/90 transition-colors w-full shadow-sm"
          >
            {tr.preview.cta}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

        </div>
      </main>
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense>
      <PreviewContent />
    </Suspense>
  )
}
