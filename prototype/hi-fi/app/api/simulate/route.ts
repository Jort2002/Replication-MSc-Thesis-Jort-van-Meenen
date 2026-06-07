import { NextRequest } from "next/server"
import { SERVICES, ServiceId, WorkflowStep, getScenario } from "@/lib/scenarios"

interface SimEvent { step: string; message: string; detail?: string; delayMs: number }

function generateEvents(steps: WorkflowStep[], fv: Record<string, string>, lang: string): SimEvent[] {
  const nl = lang === "nl"
  const name = fv.naam ?? fv.name ?? fv.Name ?? "Jan Janssen"
  const email = fv["e-mailadres"] ?? fv.email ?? fv.Email ?? "jan@example.com"
  const mention = fv.vermelding ?? fv.mention ?? "@ajora — geweldige tool!"
  const platform = fv.platform ?? "Instagram"
  const events: SimEvent[] = []

  for (const step of steps) {
    const svcName = SERVICES[step.service]?.name ?? step.service
    const cat = SERVICES[step.service]?.category ?? "action"

    if (step.type === "trigger") {
      switch (cat) {
        case "social":
          events.push({ step: svcName, message: nl ? `Nieuwe vermelding gedetecteerd op ${platform}` : `New mention detected on ${platform}`, detail: mention, delayMs: 600 })
          break
        case "event":
          events.push({ step: svcName, message: nl ? `Nieuwe aanmelding van ${name}` : `New registration from ${name}`, detail: fv.evenement ?? fv.event ?? "", delayMs: 600 })
          break
        case "ads":
          events.push({ step: svcName, message: nl ? `Nieuw lead ontvangen: ${name}` : `New lead received: ${name}`, detail: fv.campagne ?? fv.campaign ?? email, delayMs: 600 })
          break
        case "analytics":
          events.push({ step: svcName, message: nl ? `Wekelijks rapport beschikbaar` : `Weekly report available`, detail: nl ? `Periode: ${fv.periode ?? fv.period ?? ""}` : `Period: ${fv.period ?? fv.periode ?? ""}`, delayMs: 800 })
          break
        case "content":
          events.push({ step: svcName, message: nl ? `Nieuw artikel gepubliceerd` : `New article published`, detail: fv.titel ?? fv.title ?? "", delayMs: 700 })
          break
        case "calendar":
          events.push({ step: svcName, message: nl ? `Nieuwe afspraak: ${fv.afspraak ?? fv.meeting ?? ""}` : `New meeting: ${fv.meeting ?? fv.afspraak ?? ""}`, detail: fv.datum ?? fv.date ?? "", delayMs: 600 })
          break
        case "crm":
          events.push({ step: svcName, message: nl ? `Nieuw contact aangemaakt: ${name}` : `New contact created: ${name}`, detail: fv.bedrijf ?? fv.company ?? email, delayMs: 600 })
          break
        case "email":
          events.push({ step: svcName, message: nl ? `E-mail ontvangen van ${fv.van ?? fv.from ?? email}` : `Email received from ${fv.from ?? fv.van ?? email}`, detail: fv.onderwerp ?? fv.subject ?? "", delayMs: 700 })
          break
        case "chat":
          events.push({ step: svcName, message: nl ? `Bericht ontvangen in ${fv.kanaal ?? fv.channel ?? "Slack"}` : `Message received in ${fv.channel ?? fv.kanaal ?? "Slack"}`, detail: fv.bericht ?? fv.message ?? "", delayMs: 600 })
          break
        default: // form
          events.push({ step: svcName, message: nl ? `Nieuwe inzending ontvangen van ${name}` : `New submission from ${name}`, detail: email, delayMs: 600 })
      }
      continue
    }

    if (step.type === "ai") {
      const isSentiment = step.label.toLowerCase().includes("sentiment") || step.description.toLowerCase().includes("sentiment")
      if (isSentiment) {
        events.push(
          { step: "AI", message: nl ? "Bericht analyseren..." : "Analyzing post...", delayMs: 1100 },
          { step: "AI", message: nl ? "Sentimenttag toegevoegd: Positief" : "Sentiment tag added: Positive", detail: nl ? "Betrouwbaarheid: 94%" : "Confidence: 94%", delayMs: 600 },
        )
      } else {
        events.push(
          { step: "AI", message: nl ? "Gegevens worden verwerkt..." : "Processing data...", delayMs: 1100 },
          { step: "AI", message: nl ? "Resultaat klaar" : "Result ready", detail: nl ? "Klaar om te verzenden" : "Ready to deliver", delayMs: 500 },
        )
      }
      continue
    }

    // action — generate events based on service category
    switch (cat) {
      case "social":
        events.push({
          step: svcName,
          message: nl ? `Vermelding opgeslagen in ${svcName}` : `Mention saved in ${svcName}`,
          detail: mention,
          delayMs: 600,
        })
        break
      case "crm":
        events.push(
          { step: svcName, message: nl ? `Verbonden met ${svcName}` : `Connected to ${svcName}`, delayMs: 700 },
          { step: svcName, message: nl ? `Contact aangemaakt voor ${name}` : `Contact created for ${name}`, detail: email, delayMs: 600 },
        )
        break
      case "email":
        events.push({
          step: svcName,
          message: nl ? `Welkomstmail verstuurd naar ${email}` : `Welcome email sent to ${email}`,
          detail: nl ? "Onderwerp: Bedankt voor je bericht — we nemen binnen 24 uur contact op" : "Subject: Thank you — we'll respond within 24 hours",
          delayMs: 900,
        })
        break
      case "chat":
        events.push(
          { step: svcName, message: nl ? `Verbonden met ${svcName}` : `Connected to ${svcName}`, delayMs: 500 },
          { step: svcName, message: nl ? `Melding geplaatst in kanaal` : `Notification posted to channel`, detail: nl ? `Vermelding: ${mention.slice(0, 60)}` : `Mention: ${mention.slice(0, 60)}`, delayMs: 600 },
        )
        break
      case "sheet":
        events.push(
          { step: svcName, message: nl ? `Verbonden met ${svcName}` : `Connected to ${svcName}`, delayMs: 600 },
          { step: svcName, message: nl ? `Rij toegevoegd` : `Row added`, detail: `${name}, ${email}`, delayMs: 700 },
        )
        break
      case "calendar":
        events.push({
          step: svcName,
          message: nl ? `Agenda-uitnodiging verstuurd naar ${email}` : `Calendar invite sent to ${email}`,
          delayMs: 700,
        })
        break
      case "event":
        events.push({
          step: svcName,
          message: nl ? `Aanmelding geregistreerd: ${name}` : `Registration recorded: ${name}`,
          detail: email,
          delayMs: 600,
        })
        break
      default:
        events.push({
          step: svcName,
          message: step.description,
          delayMs: 700,
        })
    }
  }

  return events
}

function generateSummary(steps: WorkflowStep[], fv: Record<string, string>, lang: string): string {
  const nl = lang === "nl"
  const name = fv.naam ?? fv.name ?? "gebruiker"
  const mention = fv.vermelding ?? fv.mention ?? ""
  const title = fv.titel ?? fv.title ?? ""

  return steps.map(step => {
    const svcName = SERVICES[step.service]?.name ?? step.service
    const cat = SERVICES[step.service]?.category
    if (step.type === "trigger") {
      if (cat === "social")    return nl ? `vermelding gedetecteerd${mention ? `: "${mention.slice(0, 40)}…"` : ""}` : `mention detected${mention ? `: "${mention.slice(0, 40)}…"` : ""}`
      if (cat === "event")     return nl ? `aanmelding van ${name} ontvangen` : `registration from ${name} received`
      if (cat === "ads")       return nl ? `lead van ${name} binnengekomen` : `lead from ${name} received`
      if (cat === "analytics") return nl ? `wekelijks rapport opgehaald` : `weekly report retrieved`
      if (cat === "content")   return nl ? `nieuw artikel gepubliceerd${title ? `: "${title}"` : ""}` : `new article published${title ? `: "${title}"` : ""}`
      if (cat === "calendar")  return nl ? `nieuwe afspraak aangemaakt` : `new meeting created`
      if (cat === "crm")       return nl ? `nieuw contact in ${svcName}: ${name}` : `new contact in ${svcName}: ${name}`
      if (cat === "email")     return nl ? `e-mail ontvangen` : `email received`
      if (cat === "chat")      return nl ? `bericht ontvangen in ${fv.kanaal ?? fv.channel ?? "Slack"}` : `message received in ${fv.channel ?? fv.kanaal ?? "Slack"}`
      return nl ? `${name} heeft een formulier ingevuld` : `${name} submitted a form`
    }
    if (step.type === "ai") return nl ? `sentimentanalyse uitgevoerd` : `sentiment analysis completed`
    if (cat === "crm")      return nl ? `contact aangemaakt in ${svcName}` : `contact created in ${svcName}`
    if (cat === "email")    return nl ? `e-mail verstuurd via ${svcName}` : `email sent via ${svcName}`
    if (cat === "chat")     return nl ? `melding verstuurd via ${svcName}` : `notification sent via ${svcName}`
    if (cat === "sheet")    return nl ? `opgeslagen in ${svcName}` : `saved to ${svcName}`
    if (cat === "calendar") return nl ? `agenda-uitnodiging verstuurd` : `calendar invite sent`
    if (cat === "content")  return nl ? `opgeslagen in ${svcName}` : `saved to ${svcName}`
    return svcName
  }).join(" → ")
}

function getSampleInput(steps: WorkflowStep[], lang: string): Record<string, string> {
  const trigger = steps.find(s => s.type === "trigger")
  const cat = trigger ? (SERVICES[trigger.service]?.category ?? "form") : "form"
  const nl = lang === "nl"

  if (cat === "social") return nl
    ? { platform: "Instagram", vermelding: "@ajora — geweldige tool voor ons team! 🚀", account: "@ajora" }
    : { platform: "Instagram", mention: "@ajora — amazing tool for our team! 🚀", account: "@ajora" }

  if (cat === "event") return nl
    ? { naam: "Thomas Bakker", "e-mailadres": "thomas@example.com", evenement: "AI voor Marketeers" }
    : { name: "Thomas Bakker", email: "thomas@example.com", event: "AI for Marketers" }

  if (cat === "ads") return nl
    ? { naam: "Inge Smit", "e-mailadres": "inge@example.com", telefoon: "+31 6 12345678" }
    : { name: "Inge Smit", email: "inge@example.com", phone: "+31 6 12345678" }

  if (cat === "analytics" || cat === "content") return nl
    ? { periode: "13-19 mei 2026", sessies: "4.820", conversies: "38" }
    : { period: "May 13-19 2026", sessions: "4,820", conversions: "38" }

  return nl
    ? { naam: "Sarah de Vries", "e-mailadres": "sarah@example.com", bericht: "Ik ben geïnteresseerd in jullie diensten." }
    : { name: "Sarah de Vries", email: "sarah@example.com", message: "I'm interested in your services." }
}

export { getSampleInput }

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const scenarioId = sp.get("scenarioId") ?? "s1_contact_form"
  const lang = sp.get("lang") ?? "nl"
  const injectError = sp.get("inject") === "error"

  let steps: WorkflowStep[] = []
  let formValues: Record<string, string> = {}

  try {
    const stepsParam = sp.get("steps")
    if (stepsParam) steps = JSON.parse(stepsParam)
  } catch { /* ignore */ }

  try {
    const fvParam = sp.get("formValues")
    if (fvParam) formValues = JSON.parse(fvParam)
  } catch { /* ignore */ }

  // Fall back to hardcoded scenario if no steps provided
  const useDynamic = steps.length > 0
  const scenario = getScenario(scenarioId)

  const events = useDynamic
    ? generateEvents(steps, formValues, lang)
    : (scenario?.simulatedRun.events ?? [])

  const summary = useDynamic
    ? generateSummary(steps, formValues, lang)
    : (scenario?.simulatedRun.successSummary ?? "")

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const nl = lang === "nl"
      for (let i = 0; i < events.length; i++) {
        const ev = events[i]
        await new Promise(r => setTimeout(r, ev.delayMs))

        if (injectError && i === Math.floor(events.length / 2)) {
          send({
            type: "error",
            step: ev.step,
            message: nl
              ? "Verbinding mislukt — controleer of de service nog toegankelijk is"
              : "Connection failed — check that the service is still accessible",
            detail: null,
          })
          controller.close()
          return
        }

        send({ type: "event", step: ev.step, message: ev.message, detail: ev.detail ?? null, index: i, total: events.length })
      }

      await new Promise(r => setTimeout(r, 400))
      send({ type: "done", summary })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
