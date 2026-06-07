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

// Tool name → closest available service ID (sorted long→short to prevent partial matches)
const TOOL_TO_SERVICE: [string, ServiceId][] = [
  ["google forms", "google_forms"],
  ["hubspot forms", "google_forms"],
  ["google sheets", "google_sheets"],
  ["google calendar", "google_calendar"],
  ["google analytics", "google_analytics"],
  ["google ads", "google_ads"],
  ["linkedin ads", "linkedin_ads"],
  ["linkedin", "linkedin_ads"],
  ["microsoft teams", "slack"],
  ["meta ads", "meta_ads"],
  ["facebook ads", "meta_ads"],
  ["instagram ads", "meta_ads"],
  ["active campaign", "mailchimp"],
  ["activecampaign", "mailchimp"],
  ["salesforce", "hubspot"],   // map to closest CRM
  ["pipedrive", "hubspot"],
  ["airtable", "google_sheets"],
  ["excel", "google_sheets"],
  ["typeform", "typeform"],
  ["tally", "tally"],
  ["jotform", "typeform"],
  ["hubspot", "hubspot"],
  ["notion", "notion"],
  ["mailchimp", "mailchimp"],
  ["klaviyo", "klaviyo"],
  ["outlook", "gmail"],
  ["gmail", "gmail"],
  ["slack", "slack"],
  ["eventbrite", "eventbrite"],
  ["zoom", "zoom"],
  ["luma", "luma"],
  ["instagram", "instagram"],
  ["twitter", "twitter"],
  ["rss", "rss"],
  ["meta", "meta_ads"],
]

function findToolMention(text: string): { serviceId: ServiceId; originalName: string } | null {
  const lower = text.toLowerCase()
  for (const [toolName, serviceId] of TOOL_TO_SERVICE) {
    if (lower.includes(toolName)) {
      // Find how the user actually wrote it (preserve capitalisation)
      const regex = new RegExp(toolName, "i")
      const match = text.match(regex)
      return { serviceId, originalName: match?.[0] ?? toolName }
    }
  }
  return null
}

function applyFallback(
  steps: WorkflowStep[],
  instruction: string,
  lang: string
): WorkflowStep[] | null {
  const lower = instruction.toLowerCase()
  const isNl = lang === "nl"

  // ── REMOVE STEP ───────────────────────────────────────────────────────────
  const removeSignals = ["eruit", "verwijder", "remove", "haal weg", "weghalen", "weg halen",
    "delete", "niet nodig", "niet meer", "hoeft niet", "geen behoefte", "skip",
    "laat weg", "laat die weg", "niet doen", "hoef je niet", "hoef je geen"]
  const isRemove = removeSignals.some(kw => lower.includes(kw))

  if (isRemove) {
    // "laatste stap" / "last step"
    const isLastStep = ["laatste", "last", "onderste", "laatste stap", "last step"].some(kw => lower.includes(kw))
    if (isLastStep && steps.length > 1) {
      return steps.slice(0, -1)
    }

    // Remove by specific tool mention
    const toolMatch = findToolMention(instruction)
    if (toolMatch) {
      const filtered = steps.filter(s => s.service !== toolMatch.serviceId)
      if (filtered.length < steps.length && filtered.length >= 1) return filtered
    }

    // Remove by category keywords
    const REMOVE_BY_CAT: [string[], string][] = [
      [["slack", "melding", "notificatie", "notification", "melding sturen", "geen melding"], "chat"],
      [["email", "mail", "welkomstmail", "bevestiging"], "email"],
      [["crm", "hubspot", "salesforce", "contact toevoegen"], "crm"],
      [["sheets", "spreadsheet", "opslaan", "opslag"], "sheet"],
      [["calendar", "agenda", "uitnodiging", "invite"], "calendar"],
      [["ai", "sentiment", "analyse", "analysis"], "ai"],
    ]
    for (const [keywords, cat] of REMOVE_BY_CAT) {
      if (keywords.some(kw => lower.includes(kw))) {
        const filtered = steps.filter(s => {
          if (cat === "ai") return s.type !== "ai"
          return SERVICES[s.service]?.category !== cat
        })
        if (filtered.length < steps.length && filtered.length >= 1) return filtered
      }
    }

    // Generic remove: "eerste stap" / "first step"
    const isFirstStep = ["eerste stap", "first step", "trigger"].some(kw => lower.includes(kw))
    if (isFirstStep && steps.length > 1) return steps.slice(1)
  }

  // ── ADD STEP ──────────────────────────────────────────────────────────────
  const addSignals = ["voeg toe", "toevoegen", "add", "ook", "extra", "ook nog", "en ook", "plus"]
  const isAdd = addSignals.some(kw => lower.includes(kw))

  if (isAdd) {
    const toolMatch = findToolMention(instruction)
    if (toolMatch) {
      const { serviceId } = toolMatch
      // Don't add if already present
      if (!steps.some(s => s.service === serviceId)) {
        const cat = SERVICES[serviceId]?.category
        const name = SERVICES[serviceId]?.name ?? serviceId
        const VERB: Record<string, { nl: string; en: string }> = {
          crm:      { nl: "Toevoegen aan",      en: "Add to" },
          email:    { nl: "E-mail sturen via",  en: "Send email via" },
          sheet:    { nl: "Opslaan in",         en: "Save to" },
          chat:     { nl: "Melding via",        en: "Notify via" },
          calendar: { nl: "Agenda-uitnodiging", en: "Calendar invite" },
          content:  { nl: "Publiceren via",     en: "Publish via" },
        }
        const verb = VERB[cat ?? ""]?.[isNl ? "nl" : "en"] ?? (isNl ? "Actie via" : "Action via")
        const newStep: WorkflowStep = {
          id: `step_${steps.length + 1}`,
          type: "action",
          service: serviceId,
          label: `${verb} ${name}`,
          description: isNl
            ? `Gegevens worden verwerkt via ${name}`
            : `Data is processed via ${name}`,
        }
        return [...steps, newStep]
      }
    }
  }

  // ── TOOL SWAP ─────────────────────────────────────────────────────────────
  const toolMatch = findToolMention(instruction)
  if (!toolMatch) return null

  const { serviceId: newServiceId, originalName } = toolMatch
  const newCategory = SERVICES[newServiceId]?.category

  const target = steps.find(s => SERVICES[s.service]?.category === newCategory)
  if (!target) return null

  const oldName = SERVICES[target.service].name
  const VERB: Record<string, { nl: string; en: string }> = {
    crm:      { nl: "Toevoegen aan",      en: "Add to" },
    email:    { nl: "E-mail sturen via",  en: "Send email via" },
    form:     { nl: "Formulier via",      en: "Form via" },
    sheet:    { nl: "Opslaan in",         en: "Save to" },
    chat:     { nl: "Melding via",        en: "Notify via" },
    calendar: { nl: "Agenda-uitnodiging via", en: "Calendar invite via" },
    ads:      { nl: "Leads via",          en: "Leads from" },
    event:    { nl: "Aanmelding via",     en: "Registration via" },
    analytics:{ nl: "Data van",           en: "Data from" },
    content:  { nl: "Publiceren via",     en: "Publish via" },
    social:   { nl: "Bericht via",        en: "Post to" },
  }
  const verb = VERB[newCategory]?.[isNl ? "nl" : "en"] ?? (isNl ? "Actie via" : "Action via")
  const displayName = SERVICES[newServiceId].name

  return steps.map(step => {
    if (step.id !== target.id) return step
    return {
      ...step,
      service: newServiceId,
      label: `${verb} ${displayName}`,
      description: step.description
        .replace(new RegExp(oldName, "gi"), originalName)
        .replace(new RegExp(oldName.split(" ")[0], "gi"), originalName),
    }
  })
}

export async function POST(req: NextRequest) {
  const { steps, instruction, lang } = await req.json()
  const isNl = (lang ?? "nl") === "nl"

  // Try Azure OpenAI first
  const key = process.env.AZURE_OPENAI_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const model = process.env.AZURE_OPENAI_MODEL ?? "gpt-4o-mini"

  if (key && endpoint) {
    const serviceList = Object.entries(SERVICES)
      .map(([id, s]) => `${id} (${s.name})`)
      .join(", ")

    const systemInstruction = isNl
      ? `Je bent een assistent die marketingautomations aanpast voor niet-technische marketeers.
Beschikbare service-ID's: ${serviceList}
Pas de workflow aan op basis van het verzoek. Zorg dat labels kort zijn (4-6 woorden) en beschrijvingen één duidelijke zin zijn.
Reageer UITSLUITEND met geldige JSON: { "steps": [{ "id": "...", "label": "...", "description": "...", "service": "<id>", "type": "trigger"|"action"|"ai" }] }`
      : `You are an assistant that modifies marketing automation workflows for non-technical marketers.
Available service IDs: ${serviceList}
Update the workflow based on the request. Keep labels short (4-6 words) and descriptions to one clear sentence.
Respond ONLY with valid JSON: { "steps": [{ "id": "...", "label": "...", "description": "...", "service": "<id>", "type": "trigger"|"action"|"ai" }] }`

    const userMessage = isNl
      ? `Huidige workflow:\n${JSON.stringify(steps, null, 2)}\n\nVerzoek: "${instruction}"`
      : `Current workflow:\n${JSON.stringify(steps, null, 2)}\n\nRequest: "${instruction}"`

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
          if (sanitised.length >= 1) {
            return NextResponse.json({ steps: sanitised, source: "llm" })
          }
        }
      }
    } catch {
      clearTimeout(timer)
      // fall through to keyword fallback
    }
  }

  // Keyword-based fallback — always returns something
  const fallback = applyFallback(steps, instruction, lang ?? "nl")
  if (fallback) {
    return NextResponse.json({ steps: fallback, source: "fallback" })
  }

  // Nothing matched — return original steps unchanged with a helpful hint
  return NextResponse.json({
    steps,
    source: "unchanged",
    hint: isNl
      ? "Probeer het anders te omschrijven — bijv. 'verwijder de Slack stap', 'gebruik HubSpot in plaats van Gmail', of 'voeg Google Sheets toe'. Je kunt ook op een stap klikken om die direct te bewerken."
      : "Try rephrasing — e.g. 'remove the Slack step', 'use HubSpot instead of Gmail', or 'add Google Sheets'. You can also click a step to edit it directly.",
  })
}
