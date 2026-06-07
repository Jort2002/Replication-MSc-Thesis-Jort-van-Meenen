"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef, Suspense } from "react"
import { Nav } from "@/components/nav"
import { getScenario, WorkflowStep, SERVICES } from "@/lib/scenarios"
import { ServiceIcon } from "@/components/service-icon"
import { trackEvent } from "@/lib/analytics"
import { useLang } from "@/components/lang-provider"

interface RunEvent {
  type: "event" | "error" | "done"
  step?: string
  message?: string
  detail?: string | null
  summary?: string
  index?: number
  total?: number
}

function isAutoTrigger(steps: WorkflowStep[]): boolean {
  const trigger = steps.find(s => s.type === "trigger")
  if (!trigger) return false
  const cat = SERVICES[trigger.service]?.category
  return cat === "analytics" || cat === "content"
}

function getSampleFields(steps: WorkflowStep[], lang: string, scenarioId?: string): Record<string, string> {
  const trigger = steps.find(s => s.type === "trigger")
  if (!trigger) return lang === "nl"
    ? { naam: "Sarah de Vries", "e-mailadres": "sarah@example.com", bericht: "Ik ben geïnteresseerd in jullie diensten." }
    : { name: "Sarah de Vries", email: "sarah@example.com", message: "I'm interested in your services." }

  const cat = SERVICES[trigger.service]?.category ?? "form"
  const service = trigger.service
  const nl = lang === "nl"

  if (service === "google_analytics") return nl
    ? { periode: "13-19 mei 2026", sessies: "3.842", conversies: "38", bounceRatio: "42%", topPagina: "/diensten" }
    : { period: "May 13-19 2026", sessions: "3,842", conversions: "38", bounceRate: "42%", topPage: "/services" }

  if (service === "rss") return nl
    ? { titel: "5 tips voor betere e-mailcampagnes", bron: "Marketingblog.nl", datum: "25 mei 2026", samenvatting: "E-mail blijft een van de meest effectieve B2B-kanalen." }
    : { title: "5 tips for better email campaigns", source: "Marketingblog.nl", date: "May 25 2026", summary: "Email remains one of the most effective B2B channels." }

  if (service === "mention_app") return nl
    ? { platform: "LinkedIn", vermelding: "Zojuist een demo gehad — indrukwekkend hoe intuïtief het werkt!", account: "Sophie Bakker" }
    : { platform: "LinkedIn", mention: "Just had a demo — impressive how intuitive it is!", account: "Sophie Bakker" }

  if (scenarioId === "s4_demo_request") return nl
    ? { naam: "Thomas Visser", "e-mailadres": "thomas@acme.nl", bedrijf: "Acme BV", "aanvraag-type": "Demo" }
    : { name: "Thomas Visser", email: "thomas@acme.nl", company: "Acme BV", "request-type": "Demo" }

  if (scenarioId === "s8_meeting_prep" || service === "google_calendar") return nl
    ? { klant: "Thomas Visser", bedrijf: "Acme BV", "e-mailadres": "thomas@acme.nl", afspraak: "Kwartaal-review", datum: "3 juni 14:00", duur: "45 min" }
    : { client: "Thomas Visser", company: "Acme BV", email: "thomas@acme.nl", meeting: "Quarterly review", date: "June 3 14:00", duration: "45 min" }

  switch (cat) {
    case "event":
      return nl
        ? { naam: "Sophie Bakker", "e-mailadres": "sophie@voorbeeld.nl", evenement: "Marketing Meetup Amsterdam", datum: "12 juni 19:00" }
        : { name: "Sophie Bakker", email: "sophie@example.com", event: "Marketing Meetup Amsterdam", date: "June 12 19:00" }

    case "ads":
      return nl
        ? { naam: "Thomas Visser", "e-mailadres": "thomas@acme.nl", telefoon: "+31 6 12345678", campagne: "B2B Zomer 2026" }
        : { name: "Thomas Visser", email: "thomas@acme.nl", phone: "+31 6 12345678", campaign: "B2B Summer 2026" }

    default:
      return nl
        ? { naam: "Jan de Vries", "e-mailadres": "jan@voorbeeld.nl", bericht: "Ik ben geïnteresseerd in jullie diensten." }
        : { name: "Jan de Vries", email: "jan@example.com", message: "I'm interested in your services." }
  }
}

function findActiveStepIndex(eventStep: string, steps: WorkflowStep[]): number {
  const lower = eventStep.toLowerCase()
  const byName = steps.findIndex(s => SERVICES[s.service]?.name?.toLowerCase() === lower)
  if (byName >= 0) return byName
  if (lower === "trigger" || lower === "schedule") return 0
  if (lower === "ai" || lower === "ai summary" || lower.includes("ai")) {
    const aiIdx = steps.findIndex(s => s.type === "ai")
    if (aiIdx >= 0) return aiIdx
  }
  return -1
}

// ── Mock output panels ────────────────────────────────────────────────────────

function MockCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      </div>
      <div className="px-4 py-3 text-sm text-foreground">{children}</div>
    </div>
  )
}

function SheetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1 border-b border-border/50 last:border-0 text-xs">
      <span className="text-muted-foreground w-24 flex-shrink-0 font-medium">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function MockOutputPanel({
  scenarioId,
  formValues,
  clarifyAnswers,
  lang,
}: {
  scenarioId: string
  formValues: Record<string, string>
  clarifyAnswers: Record<string, string>
  lang: string
}) {
  const nl = lang === "nl"
  const name = formValues.naam ?? formValues.name ?? (nl ? "Jan de Vries" : "Jan de Vries")
  const email = formValues["e-mailadres"] ?? formValues.email ?? "jan@voorbeeld.nl"
  const message = formValues.bericht ?? formValues.message ?? (nl ? "Ik ben geïnteresseerd in jullie diensten." : "I'm interested in your services.")
  const slackChannel = clarifyAnswers.slackChannel ?? "#leads"
  const today = new Date().toLocaleDateString(nl ? "nl-NL" : "en-GB", { day: "numeric", month: "long", year: "numeric" })

  if (scenarioId === "s1_contact_form") {
    return (
      <div className="flex flex-col gap-3">
        <MockCard title={nl ? "Google Sheets — nieuwe rij toegevoegd" : "Google Sheets — row added"}>
          <div className="flex flex-col">
            <SheetRow label={nl ? "Naam" : "Name"} value={name} />
            <SheetRow label={nl ? "E-mail" : "Email"} value={email} />
            <SheetRow label={nl ? "Bericht" : "Message"} value={message.length > 60 ? message.slice(0, 60) + "…" : message} />
            <SheetRow label={nl ? "Datum" : "Date"} value={today} />
          </div>
        </MockCard>
        <MockCard title={`Slack — ${slackChannel}`}>
          <p className="leading-relaxed">
            📬 {nl
              ? `Nieuw contactverzoek — ${name} (${email}): "${message.slice(0, 50)}${message.length > 50 ? "…" : ""}"`
              : `New contact enquiry — ${name} (${email}): "${message.slice(0, 50)}${message.length > 50 ? "…" : ""}"`}
          </p>
        </MockCard>
      </div>
    )
  }

  if (scenarioId === "s2_weekly_digest") {
    const channel = clarifyAnswers.slackChannel ?? (nl ? "#marketing-rapportage" : "#marketing-reports")
    const time = clarifyAnswers.digestTime ?? "08:00"
    return (
      <MockCard title={`Slack — ${channel}`}>
        <div className="flex flex-col gap-2 text-xs leading-relaxed">
          <p className="font-semibold text-sm">📊 {nl ? "Weekrapport marketing — week 21" : "Marketing weekly report — week 21"}</p>
          <div className="flex flex-col gap-0.5 pl-2 border-l-2 border-primary/30">
            <p className="font-medium text-muted-foreground">{nl ? "Website (Google Analytics):" : "Website (Google Analytics):"}</p>
            <p>{nl ? "3.842 sessies · bouncepercentage 42% · top-pagina: /diensten" : "3,842 sessions · bounce rate 42% · top page: /services"}</p>
          </div>
          <div className="flex flex-col gap-0.5 pl-2 border-l-2 border-google_ads">
            <p className="font-medium text-muted-foreground">{nl ? "Advertenties (Google Ads):" : "Advertising (Google Ads):"}</p>
            <p>{nl ? "12.400 vertoningen · 284 klikken · €187 uitgegeven" : "12,400 impressions · 284 clicks · €187 spent"}</p>
          </div>
          <div className="flex flex-col gap-0.5 pl-2 border-l-2 border-amber-300">
            <p className="font-medium text-muted-foreground">{nl ? "AI-samenvatting:" : "AI summary:"}</p>
            <p className="italic text-muted-foreground">{nl
              ? "Goed websiteverkeer deze week. Advertenties presteren iets onder gemiddelde CTR — overweeg advertentieteksten te herzien."
              : "Good website traffic this week. Ads are performing slightly below average CTR — consider revising ad copy."}</p>
          </div>
          <p className="text-muted-foreground text-[10px]">{nl ? `Verstuurd elke maandag om ${time}` : `Sent every Monday at ${time}`}</p>
        </div>
      </MockCard>
    )
  }

  if (scenarioId === "s3_social_mention") {
    const brandTerm = clarifyAnswers.brandTerm ?? (nl ? "jullie merk" : "your brand")
    const channel = clarifyAnswers.slackChannel ?? (nl ? "#brand-monitoring" : "#brand-monitoring")
    const platform = formValues.platform ?? "LinkedIn"
    const postText = formValues.vermelding ?? formValues.mention
      ?? (nl
        ? `Zojuist een demo gehad van @${brandTerm} — indrukwekkend hoe intuïtief het werkt voor niet-technische mensen!`
        : `Just had a demo with @${brandTerm} — impressive how intuitive it is for non-technical people!`)
    const author = formValues.account ?? "Sophie Bakker"
    return (
      <MockCard title={`Slack — ${channel}`}>
        <div className="flex flex-col gap-3 text-xs leading-relaxed">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <div>
              <p className="font-semibold text-sm">{nl ? `Nieuwe vermelding — ${platform}` : `New mention — ${platform}`}</p>
              <p className="text-muted-foreground">{nl ? "14 minuten geleden" : "14 minutes ago"}</p>
            </div>
            <span className="ml-auto flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-0.5 font-medium">
              <span>😊</span>
              <span>{nl ? "Positief" : "Positive"}</span>
            </span>
          </div>
          <div className="bg-muted/30 rounded-lg px-3 py-2.5 border border-border italic text-foreground/80">
            "{postText}"
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{nl ? `Geplaatst door: ${author} · Marketing Manager` : `Posted by: ${author} · Marketing Manager`}</span>
            <span className="text-primary underline cursor-pointer">{nl ? "Bekijk post →" : "View post →"}</span>
          </div>
        </div>
      </MockCard>
    )
  }

  if (scenarioId === "s4_demo_request") {
    const crmTool = clarifyAnswers.crmTool ?? "HubSpot"
    const sender = clarifyAnswers.senderInfo ?? (nl ? "het team" : "the team")
    const company = formValues.bedrijf ?? formValues.company ?? (nl ? "Acme BV" : "Acme Ltd")
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MockCard title={`${crmTool} CRM — ${nl ? "nieuw contact" : "new contact"}`}>
          <div className="flex flex-col gap-1 text-xs">
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-muted-foreground">{email}</p>
            <p className="text-muted-foreground">{company}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className="bg-blue-50 border border-blue-200 text-blue-700 rounded px-2 py-0.5 text-[10px] font-medium">
                {nl ? "demo aangevraagd" : "demo requested"}
              </span>
              <span className="bg-amber-50 border border-amber-200 text-amber-700 rounded px-2 py-0.5 text-[10px] font-medium">
                {nl ? "nieuw" : "new"}
              </span>
            </div>
          </div>
        </MockCard>
        <MockCard title={nl ? "Gmail — opvolging e-mail" : "Gmail — follow-up email"}>
          <div className="flex flex-col gap-1 text-xs leading-relaxed">
            <p>{nl ? `Beste ${name},` : `Dear ${name},`}</p>
            <p className="mt-1 text-foreground/80">
              {nl
                ? "Bedankt voor je interesse! We hebben je aanvraag ontvangen en nemen binnen één werkdag contact met je op om een demo in te plannen."
                : "Thank you for your interest! We have received your request and will contact you within one business day to schedule a demo."}
            </p>
            <p className="mt-1 text-muted-foreground">{nl ? `Met vriendelijke groet, ${sender}` : `Best regards, ${sender}`}</p>
          </div>
        </MockCard>
      </div>
    )
  }

  if (scenarioId === "s5_paid_lead") {
    const adPlatform = clarifyAnswers.adPlatform ?? (nl ? "LinkedIn Ads" : "LinkedIn Ads")
    const target = clarifyAnswers.notifyTarget ?? (nl ? "sales@bedrijf.nl" : "sales@company.com")
    const phone = formValues.telefoon ?? formValues.phone ?? "+31 6 12345678"
    const campaign = formValues.campagne ?? formValues.campaign ?? (nl ? "B2B Zomer 2026" : "B2B Summer 2026")
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MockCard title={nl ? `Gmail — lead doorgestuurd naar ${target}` : `Gmail — lead forwarded to ${target}`}>
          <div className="flex flex-col gap-0.5 text-xs">
            <p className="font-semibold">{nl ? `Nieuwe lead — ${name}` : `New lead — ${name}`}</p>
            <p className="text-muted-foreground">{email}</p>
            <p className="text-muted-foreground">{phone}</p>
            <p className="text-muted-foreground">{nl ? `Via: ${adPlatform} — ${campaign}` : `Via: ${adPlatform} — ${campaign}`}</p>
          </div>
        </MockCard>
        <MockCard title={nl ? "Slack — teammelding" : "Slack — team notification"}>
          <p className="text-xs leading-relaxed">
            🎯 {nl
              ? `Nieuwe lead: ${name} · ${email} · ${adPlatform}`
              : `New lead: ${name} · ${email} · ${adPlatform}`}
          </p>
        </MockCard>
      </div>
    )
  }

  return null
}

// ── Main component ────────────────────────────────────────────────────────────

function TestContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { tr, lang } = useLang()

  const scenarioId = params.get("scenarioId") ?? "s1_contact_form"
  const prompt = params.get("prompt") ?? ""
  const answersParam = params.get("answers") ?? "{}"

  let clarifyAnswers: Record<string, string> = {}
  try { clarifyAnswers = JSON.parse(answersParam) } catch { /* ignore */ }

  let customSteps: WorkflowStep[] = []
  try {
    const raw = params.get("steps")
    if (raw) customSteps = JSON.parse(raw)
  } catch { /* use scenario fallback */ }

  const scenario = getScenario(scenarioId)
  const steps = customSteps.length > 0 ? customSteps : (scenario?.steps ?? [])

  // Find the trigger service name for the contextual banner
  const triggerStep = steps.find(s => s.type === "trigger")
  const triggerName = SERVICES[triggerStep?.service ?? "typeform"]?.name ?? ""

  const [events, setEvents] = useState<RunEvent[]>([])
  const [isDone, setIsDone] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [summary, setSummary] = useState("")
  const [progress, setProgress] = useState(0)
  const [started, setStarted] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const [formValues, setFormValues] = useState<Record<string, string>>(getSampleFields(steps, lang, scenarioId))
  const [activeStepIndex, setActiveStepIndex] = useState(-1)
  const autoTrigger = isAutoTrigger(steps)
  const eventsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    trackEvent("page_view", { screen: "dry_run", scenarioId })
  }, [scenarioId])

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [events])

  const runTest = () => {
    setShowForm(false)
    setStarted(true)
    setActiveStepIndex(0)
    trackEvent("dry_run_started", { scenarioId })

    const sp = new URLSearchParams({
      scenarioId,
      lang,
      steps: JSON.stringify(steps),
      formValues: JSON.stringify(formValues),
    })
    const es = new EventSource(`/api/simulate?${sp}`)

    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as RunEvent
      if (data.type === "event") {
        setEvents(prev => [...prev, data])
        const idx = findActiveStepIndex(data.step ?? "", steps)
        if (idx >= 0) setActiveStepIndex(idx)
        setProgress(((data.index ?? 0) + 1) / (data.total ?? 1))
      } else if (data.type === "error") {
        setEvents(prev => [...prev, data])
        setHasError(true)
        setIsDone(true)
        es.close()
        trackEvent("error_screen_viewed", { scenarioId, step: data.step ?? "" })
      } else if (data.type === "done") {
        setSummary(data.summary ?? "")
        setProgress(1)
        setIsDone(true)
        setActiveStepIndex(-1)
        es.close()
        trackEvent("dry_run_completed", { scenarioId })
      }
    }
    es.onerror = () => es.close()
  }

  const handleProceed = () => {
    const sp = new URLSearchParams({
      scenarioId,
      prompt,
      answers: answersParam,
      steps: JSON.stringify(steps),
    })
    router.push(`/build/activate?${sp}`)
  }

  const handleFix = () => {
    router.push("/build")
  }

  const bannerBody = lang === "nl"
    ? `Veilige simulatie${triggerName ? ` van een ${triggerName}-trigger` : ""}. Er gaan geen echte gegevens naar ${steps.filter(s => s.type !== "trigger").map(s => SERVICES[s.service]?.name).join(" of ")}.`
    : `Safe simulation${triggerName ? ` of a ${triggerName} trigger` : ""}. No real data is sent to ${steps.filter(s => s.type !== "trigger").map(s => SERVICES[s.service]?.name).join(" or ")}.`

  return (
    <div className="min-h-screen flex flex-col">
      <Nav step={4} totalSteps={5} showBack backHref={`/build/preview?scenarioId=${scenarioId}&prompt=${encodeURIComponent(prompt)}&answers=${encodeURIComponent(answersParam)}`} />

      <main className="flex-1 flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-2xl flex flex-col gap-6">

          {/* Contextual banner */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-600 text-lg mt-0.5">⚠</span>
            <div>
              <p className="text-sm font-medium text-amber-800">{tr.test.bannerTitle}</p>
              <p className="text-xs text-amber-700 mt-0.5">{bannerBody}</p>
            </div>
          </div>

          {/* Live step tracker — shown during and after simulation */}
          {started && (
            <div className="flex gap-2 flex-wrap">
              {steps.map((step, i) => {
                const isDoneStep = isDone || i < activeStepIndex
                const isActive = i === activeStepIndex && !isDone
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : isDoneStep
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse flex-shrink-0" />
                    )}
                    {!isActive && isDoneStep && (
                      <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <ServiceIcon serviceId={step.service} size="sm" className="w-4 h-4 !rounded-md" />
                    <span>{step.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Sample data form */}
          {showForm && !autoTrigger && (
            <div className="flex flex-col gap-4 bg-white rounded-2xl border border-border p-6 step-appear">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{tr.test.sampleTitle}</h2>
                <p className="text-sm text-muted-foreground mt-1">{tr.test.sampleSubtitle}</p>
              </div>
              <div className="flex flex-col gap-3">
                {Object.entries(formValues).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {key.replace(/_/g, " ")}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={e => setFormValues(prev => ({ ...prev, [key]: e.target.value }))}
                      className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={runTest}
                className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
              >
                {tr.test.runTest}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5 3l6 5-6 5V3z" fill="currentColor" />
                </svg>
              </button>
            </div>
          )}

          {showForm && autoTrigger && (
            <div className="flex flex-col gap-4 bg-white rounded-2xl border border-border p-6 step-appear">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {lang === "nl" ? "Automatische trigger" : "Automatic trigger"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === "nl"
                    ? "Deze automation start zichzelf automatisch. Hieronder zie je een voorbeeld van de data die opgehaald wordt."
                    : "This automation triggers itself automatically. Below is an example of the data it will retrieve."}
                </p>
              </div>
              <div className="flex flex-col gap-2 bg-muted/40 rounded-xl px-4 py-3 border border-border">
                {Object.entries(formValues).map(([key, value]) => (
                  <div key={key} className="flex items-baseline gap-2 text-sm">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-28 flex-shrink-0">{key.replace(/_/g, " ")}</span>
                    <span className="text-foreground">{value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={runTest}
                className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
              >
                {lang === "nl" ? "Simuleer één uitvoering" : "Simulate one run"}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5 3l6 5-6 5V3z" fill="currentColor" />
                </svg>
              </button>
            </div>
          )}

          {/* Event log */}
          {started && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">
                  {isDone && !hasError ? tr.test.passed : isDone && hasError ? tr.test.failed : tr.test.running}
                </h2>
                {!isDone && (
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                )}
              </div>

              {!isDone && (
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                {events.map((ev, i) => (
                  <div
                    key={i}
                    className={`step-appear flex items-start gap-3 rounded-xl px-4 py-3 border ${
                      ev.type === "error" ? "bg-red-50 border-red-200" : "bg-white border-border"
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className={`text-sm mt-0.5 ${ev.type === "error" ? "text-red-500" : "text-green-500"}`}>
                      {ev.type === "error" ? "✗" : "✓"}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-muted-foreground">{ev.step}</span>
                      <span className="text-sm text-foreground">{ev.message}</span>
                      {ev.detail && <span className="text-xs text-muted-foreground">{ev.detail}</span>}
                    </div>
                  </div>
                ))}
                <div ref={eventsEndRef} />
              </div>

              {isDone && !hasError && summary && (
                <div className="step-appear rounded-xl bg-green-50 border border-green-200 px-4 py-4 flex flex-col gap-2">
                  <p className="text-sm font-semibold text-green-800">{tr.test.whatHappened}</p>
                  <p className="text-sm text-green-700">{summary}</p>
                  <p className="text-xs text-green-600 mt-1 border-t border-green-200 pt-2">{tr.test.noRealData}</p>
                </div>
              )}

              {/* Scenario-specific mock output */}
              {isDone && !hasError && (
                <div className="step-appear flex flex-col gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {lang === "nl" ? "Zo ziet het er in het echt uit:" : "This is what it looks like in real life:"}
                  </p>
                  <MockOutputPanel
                    scenarioId={scenarioId}
                    formValues={formValues}
                    clarifyAnswers={clarifyAnswers}
                    lang={lang}
                  />
                </div>
              )}

              {isDone && (
                <div className="flex flex-col gap-3 pt-2">
                  {!hasError ? (
                    <button
                      onClick={handleProceed}
                      className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-6 py-3.5 font-medium hover:bg-primary/90 transition-colors w-full"
                    >
                      {tr.test.ctaProceed}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={handleFix}
                      className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-6 py-3.5 font-medium hover:bg-primary/90 transition-colors w-full"
                    >
                      {tr.test.ctaFix}
                    </button>
                  )}
                  <button onClick={handleFix} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center">
                    {tr.test.ctaBack}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default function TestPage() {
  return (
    <Suspense>
      <TestContent />
    </Suspense>
  )
}
