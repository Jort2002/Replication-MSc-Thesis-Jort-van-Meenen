import { NextRequest, NextResponse } from "next/server"
import { SERVICES, ServiceId, WorkflowStep } from "@/lib/scenarios"

const VALID_SERVICES = new Set(Object.keys(SERVICES))
const VALID_TYPES = new Set(["trigger", "action", "ai"])

function sanitiseSteps(raw: unknown[]): WorkflowStep[] {
  return raw
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
    .map((s, i) => ({
      id: typeof s.id === "string" ? s.id : `step_${i + 1}`,
      label: typeof s.label === "string" ? s.label : "Stap",
      description: typeof s.description === "string" ? s.description : "",
      service: VALID_SERVICES.has(s.service as string) ? (s.service as ServiceId) : "google_sheets",
      type: VALID_TYPES.has(s.type as string) ? (s.type as WorkflowStep["type"]) : "action",
    }))
}

// Keyword → serviceId mapping for fallback
const TOOL_TO_SERVICE: Record<string, ServiceId> = {
  typeform: "typeform", "google forms": "google_forms", "hubspot forms": "google_forms",
  tally: "tally", jotform: "typeform",
  hubspot: "hubspot", salesforce: "hubspot", pipedrive: "hubspot",
  notion: "notion", "google sheets": "google_sheets", airtable: "google_sheets",
  gmail: "gmail", mailchimp: "mailchimp", klaviyo: "klaviyo",
  outlook: "gmail", activecampaign: "mailchimp",
  slack: "slack", "microsoft teams": "slack",
  eventbrite: "eventbrite", zoom: "zoom", luma: "luma",
  "meta ads": "meta_ads", "facebook ads": "meta_ads", "google ads": "google_ads",
  "linkedin ads": "linkedin_ads",
}

function toolNameToService(name: string): ServiceId {
  const lower = name.toLowerCase()
  return TOOL_TO_SERVICE[lower] ?? "google_sheets"
}

function generateFallbackSteps(
  prompt: string,
  answers: Record<string, string>,
  lang: string
): WorkflowStep[] {
  const lower = prompt.toLowerCase()
  const nl = lang === "nl"
  const steps: WorkflowStep[] = []

  // ── Detect workflow type ──────────────────────────────────────────────────
  const isSocialMonitoring =
    lower.includes("social media") || lower.includes("vermeld") || lower.includes("mention") ||
    lower.includes("brand") || lower.includes("merk") || lower.includes("twitter") ||
    lower.includes("instagram") || lower.includes("monitoring")

  const isEventBased =
    lower.includes("event") || lower.includes("webinar") || lower.includes("aanmelding") ||
    lower.includes("registratie") || lower.includes("deelnemer")

  const isAdBased =
    lower.includes("advertentie") || lower.includes(" ad ") || lower.includes("ads ") ||
    lower.includes("campagne") || lower.includes("lead form")

  // ── SOCIAL MEDIA MONITORING FLOW ─────────────────────────────────────────
  if (isSocialMonitoring) {
    const monitorTool = answers.monitorTool ?? answers.monitor_tool ?? "Mention"
    const monitorService: ServiceId = monitorTool.toLowerCase().includes("brandwatch") ? "mention_app"
      : monitorTool.toLowerCase().includes("hootsuite") ? "mention_app"
      : "mention_app"

    steps.push({
      id: "step_1",
      type: "trigger",
      service: monitorService,
      label: nl ? "Vermelding gedetecteerd" : "Mention detected",
      description: nl
        ? `${monitorTool} detecteert elke nieuwe vermelding van jouw merk op social media`
        : `${monitorTool} detects every new mention of your brand on social media`,
    })

    const wantsSentiment =
      lower.includes("sentiment") || lower.includes("positief") || lower.includes("negatief") ||
      lower.includes("neutraal") || lower.includes("positive") || lower.includes("negative") || lower.includes("tag")

    if (wantsSentiment) {
      steps.push({
        id: "step_2",
        type: "ai",
        service: "mention_app",
        label: nl ? "Sentiment analyseren" : "Analyze sentiment",
        description: nl
          ? "AI analyseert het bericht en voegt een sentimenttag toe: positief, negatief of neutraal"
          : "AI analyzes the post and adds a sentiment tag: positive, negative, or neutral",
      })
    }

    const sentimentStorage = answers.sentimentStorage ?? answers.sentiment_storage
    const wantsStorage = sentimentStorage &&
      !sentimentStorage.toLowerCase().includes("nergens") &&
      !sentimentStorage.toLowerCase().includes("nowhere")
    if (wantsStorage) {
      const storageService = toolNameToService(sentimentStorage)
      steps.push({
        id: `step_${steps.length + 1}`,
        type: "action",
        service: storageService,
        label: nl ? `Opslaan in ${sentimentStorage}` : `Save to ${sentimentStorage}`,
        description: nl
          ? `De vermelding en sentimenttag worden opgeslagen in ${sentimentStorage}`
          : `The mention and sentiment tag are saved to ${sentimentStorage}`,
      })
    }

    const wantsSlack = lower.includes("slack") || lower.includes("melding") || lower.includes("notificatie") || lower.includes("notification")
    if (wantsSlack) {
      steps.push({
        id: `step_${steps.length + 1}`,
        type: "action",
        service: "slack",
        label: nl ? "Slack-melding versturen" : "Send Slack notification",
        description: nl
          ? "Stuur een melding in het daarvoor bestemde Slack-kanaal met de vermelding en het sentiment"
          : "Send a notification to the designated Slack channel with the mention and its sentiment",
      })
    }

    return steps
  }

  // ── EVENT REGISTRATION FLOW ───────────────────────────────────────────────
  if (isEventBased) {
    const eventPlatform = answers.eventPlatform ?? answers.event_platform ?? "Eventbrite"
    const eventService = toolNameToService(eventPlatform)
    steps.push({
      id: "step_1",
      type: "trigger",
      service: eventService,
      label: nl ? "Aanmelding ontvangen" : "Registration received",
      description: nl
        ? `Nieuwe aanmelding binnenkomst via ${eventPlatform}`
        : `New registration arrives via ${eventPlatform}`,
    })
  } else if (isAdBased) {
    // ── AD LEAD FLOW ────────────────────────────────────────────────────────
    const adPlatform = answers.adPlatform ?? answers.ad_platform ?? "Meta Ads"
    const adService = toolNameToService(adPlatform)
    steps.push({
      id: "step_1",
      type: "trigger",
      service: adService,
      label: nl ? "Nieuw lead ontvangen" : "New lead received",
      description: nl
        ? `Lead binnenkomst via ${adPlatform}`
        : `Lead arrives via ${adPlatform}`,
    })
  } else {
    // ── DEFAULT: FORM TRIGGER ────────────────────────────────────────────────
    const formTool = answers.formTool ?? answers.form_tool ?? "Typeform"
    const formService = toolNameToService(formTool)
    steps.push({
      id: "step_1",
      type: "trigger",
      service: formService,
      label: nl ? "Formulier ingevuld" : "Form submitted",
      description: nl
        ? `Er wordt een nieuw formulier ingevuld via ${formTool}`
        : `A new submission arrives via ${formTool}`,
    })
  }

  // ── SHARED ACTION STEPS (for form/event/ad flows) ─────────────────────────

  // CRM step
  const crmTool = answers.crmTool ?? answers.crm_tool
  const wantsCrm = lower.includes("crm") || lower.includes("lead") || lower.includes("contact") || crmTool
  if (wantsCrm) {
    const service = toolNameToService(crmTool ?? "HubSpot")
    steps.push({
      id: `step_${steps.length + 1}`,
      type: "action",
      service,
      label: nl ? `Toevoegen aan ${crmTool ?? "CRM"}` : `Add to ${crmTool ?? "CRM"}`,
      description: nl
        ? `Naam, e-mailadres en bericht worden opgeslagen in ${crmTool ?? "het CRM"}`
        : `Name, email address and message are saved to ${crmTool ?? "your CRM"}`,
    })
  }

  // Storage step (if answered and no CRM)
  const storageTool = answers.storageTool ?? answers.storage_tool
  if (storageTool && !wantsCrm) {
    const service = toolNameToService(storageTool)
    steps.push({
      id: `step_${steps.length + 1}`,
      type: "action",
      service,
      label: nl ? `Opslaan in ${storageTool}` : `Save to ${storageTool}`,
      description: nl
        ? `Gegevens worden opgeslagen in ${storageTool}`
        : `Data is saved to ${storageTool}`,
    })
  }

  // Email step
  const emailTool = answers.emailTool ?? answers.email_tool
  const wantsEmail =
    lower.includes("email") || lower.includes("e-mail") || lower.includes("mail") ||
    lower.includes("welkomst") || lower.includes("bevestig") || lower.includes("welcome") || emailTool
  if (wantsEmail) {
    const service = toolNameToService(emailTool ?? "Gmail")
    steps.push({
      id: `step_${steps.length + 1}`,
      type: "action",
      service,
      label: nl ? `Welkomstmail sturen via ${emailTool ?? "Gmail"}` : `Send welcome email via ${emailTool ?? "Gmail"}`,
      description: nl
        ? `Stuur een welkomstmail naar de gebruiker met daarin hun vraag en de melding dat je binnen 24 uur contact opneemt`
        : `Send a welcome email to the user with their message and a note that you will respond within 24 hours`,
    })
  }

  // Notification step
  const notifyChannel = answers.notifyChannel ?? answers.notify_channel
  const wantsNotify =
    notifyChannel && notifyChannel.toLowerCase() !== "geen melding" && notifyChannel.toLowerCase() !== "no notification"
  if (wantsNotify) {
    const service =
      notifyChannel?.toLowerCase().includes("slack") ? "slack" as ServiceId
      : notifyChannel?.toLowerCase().includes("email") ? "gmail" as ServiceId
      : "slack" as ServiceId
    steps.push({
      id: `step_${steps.length + 1}`,
      type: "action",
      service,
      label: nl ? "Teammelding sturen" : "Notify the team",
      description: nl
        ? `Stuur een melding via ${notifyChannel} zodat het team op de hoogte is`
        : `Send a notification via ${notifyChannel} to keep the team informed`,
    })
  }

  // Fallback: if only trigger, add a sensible default
  if (steps.length === 1) {
    steps.push({
      id: "step_2",
      type: "action",
      service: "gmail",
      label: nl ? "E-mail sturen" : "Send email",
      description: nl
        ? "Stuur een geautomatiseerde e-mail op basis van de inzending"
        : "Send an automated email based on the submission",
    })
  }

  return steps
}

export async function POST(req: NextRequest) {
  const { prompt, answers, lang, forceFallback } = await req.json()
  const isNl = (lang ?? "nl") === "nl"

  const key = process.env.AZURE_OPENAI_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const model = process.env.AZURE_OPENAI_MODEL ?? "gpt-4o-mini"

  if (!forceFallback && key && endpoint) {
    const serviceList = Object.entries(SERVICES)
      .map(([id, s]) => `${id} (${s.name})`)
      .join(", ")

    const answersText = Object.entries(answers ?? {})
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n")

    const systemInstruction = isNl
      ? `Je bent een expert die marketingautomations bouwt voor niet-technische marketeers.

Beschikbare service-ID's: ${serviceList}

Maak een workflow met 2-5 stappen die PRECIES aansluit op wat de gebruiker heeft gevraagd.

REGELS:
- Eerste stap is altijd het startpunt (trigger), type "trigger"
- Overige stappen zijn type "action" of "ai"
- Gebruik ALLEEN services die de gebruiker heeft genoemd of geïmpliceerd
- Voeg GEEN Slack toe als de gebruiker dat niet heeft gevraagd
- Voeg GEEN Google Sheets toe als de gebruiker een CRM heeft gekozen
- Verwijs in de beschrijving naar specifieke details uit de vraag (bijv. "binnen 24 uur", "de vraag van de gebruiker meesturen")
- Labels zijn kort (4-6 woorden), beschrijvingen zijn één duidelijke zin voor een marketeer
- Reageer UITSLUITEND met geldige JSON: { "steps": [{ "id": "step_1", "label": "...", "description": "...", "service": "<service_id>", "type": "trigger"|"action"|"ai" }] }`
      : `You are an expert building marketing automation workflows for non-technical marketers.

Available service IDs: ${serviceList}

Build a workflow with 2-5 steps that EXACTLY matches what the user asked for.

RULES:
- First step is always the starting point (trigger), type "trigger"
- Other steps are type "action" or "ai"
- ONLY include services the user mentioned or clearly implied
- Do NOT add Slack if the user did not ask for it
- Do NOT add Google Sheets if the user chose a CRM
- Reference specific details from the request in descriptions (e.g. "within 24 hours", "include the user's message")
- Labels are short (4-6 words), descriptions are one clear sentence for a marketer
- Respond ONLY with valid JSON: { "steps": [{ "id": "step_1", "label": "...", "description": "...", "service": "<service_id>", "type": "trigger"|"action"|"ai" }] }`

    const userMessage = isNl
      ? `De gebruiker wil de volgende automation opzetten: "${prompt}"\n\nDe gebruiker heeft deze vragen beantwoord:\n${answersText || "(geen aanvullende informatie)"}`
      : `The user wants to set up this automation: "${prompt}"\n\nThe user answered these clarifying questions:\n${answersText || "(no additional information)"}`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": key,
        },
        body: JSON.stringify({
          model,
          input: [
            { role: "developer", content: systemInstruction },
            { role: "user", content: userMessage },
          ],
          text: { format: { type: "json_object" } },
        }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (res.ok) {
        const data = await res.json()
        const text = data.output?.[0]?.content?.[0]?.text
        if (text) {
          const parsed = JSON.parse(text)
          const sanitised = sanitiseSteps(parsed.steps ?? [])
          if (sanitised.length >= 2) {
            return NextResponse.json({ steps: sanitised, source: "llm" })
          }
        }
      }
    } catch {
      clearTimeout(timer)
      // fall through to fallback
    }
  }

  const fallbackSteps = generateFallbackSteps(prompt, answers ?? {}, lang ?? "nl")
  return NextResponse.json({ steps: fallbackSteps, source: "fallback" })
}
