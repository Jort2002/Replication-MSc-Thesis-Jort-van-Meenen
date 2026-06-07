"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, Suspense } from "react"
import { Nav } from "@/components/nav"
import { trackEvent } from "@/lib/analytics"
import { useLang } from "@/components/lang-provider"

function ErrorContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { tr } = useLang()

  const scenarioId = params.get("scenarioId") ?? "s1_contact_form"
  const failedStep = params.get("step") ?? "Stap 2"
  const errorMessage = params.get("message") ?? "De verbinding met deze service is mislukt."

  useEffect(() => {
    trackEvent("error_screen_viewed", { scenarioId, step: failedStep })
  }, [scenarioId, failedStep])

  return (
    <div className="min-h-screen flex flex-col">
      <Nav showBack backHref="/automations" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg flex flex-col gap-6">

          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-2xl">⚠</span>
            <div>
              <p className="font-semibold text-amber-800">{tr.error.bannerTitle}</p>
              <p className="text-sm text-amber-700">{tr.error.bannerBody}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-red-50">
              <p className="text-sm font-semibold text-red-700">{failedStep} {tr.error.failed}</p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              <p className="text-sm text-foreground">{errorMessage}</p>

              <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">{tr.error.suggestedFix}</p>
                <p className="text-sm text-amber-800">{tr.error.fixBody}</p>
              </div>

              <p className="text-xs text-muted-foreground border-t border-border pt-3">
                {tr.error.errorRef}: AJR-{Math.random().toString(36).slice(2, 8).toUpperCase()} — {tr.error.shareWithSupport}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { trackEvent("error_fix_clicked", { scenarioId }); router.push("/build") }}
              className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-6 py-3.5 font-medium hover:bg-primary/90 transition-colors w-full"
            >
              {tr.error.ctaFix}
            </button>
            <button
              onClick={() => { trackEvent("get_help_clicked", { scenarioId }); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              {tr.error.ctaHelp}
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  )
}
