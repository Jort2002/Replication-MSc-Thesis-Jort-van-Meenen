import { SCENARIOS, Scenario } from "./scenarios"

interface MatchResult {
  scenarioId: string | null
  confidence: "high" | "medium" | "low"
  matchReason: string
  outOfScope: boolean
  outOfScopeMessage: string | null
  prefilledAnswers: Record<string, string | null>
}

const KEYWORD_MAP: Record<string, string[]> = {
  s1_contact_form: [
    "contact", "form", "formulier", "enquiry", "enquête", "enquete", "submission",
    "typeform", "tally", "google forms", "inzending", "invullen", "aanvraag",
    "sheets", "spreadsheet", "slack", "notify", "notificatie", "new lead",
    "contactformulier", "opslaan", "save", "lead",
  ],
  s2_weekly_digest: [
    "weekly", "wekelijks", "digest", "overzicht", "report", "rapportage",
    "performance", "prestatie", "metrics", "analytics", "google analytics",
    "google ads", "kpi", "monday", "maandag", "scheduled",
    "gepland", "automatisch", "summary", "samenvatting", "weekly report",
    "weekly update", "wekelijkse", "dashboard", "cross-channel",
  ],
  s3_social_mention: [
    "brand mention", "merknaam", "vermelding", "merk vermeld", "mention",
    "social media monitoring", "brand monitoring", "social listening",
    "twitter", "instagram mention", "linkedin mention", "x.com",
    "sentiment", "positief negatief", "brand reputation", "merkreputatie",
    "monitoring", "brand tracking", "vermeld", "merk",
  ],
  s4_demo_request: [
    "demo", "demo aanvraag", "demo request", "offerte", "quote",
    "offerteaanvraag", "demo aanvragen", "demo inplannen",
    "crm", "hubspot", "pipedrive", "salesforce",
    "opvolging", "follow-up", "follow up", "b2b",
    "kennismaking", "gesprek inplannen", "contact opnemen",
  ],
  s5_paid_lead: [
    "facebook ads", "instagram ads", "meta ads", "linkedin ads", "paid",
    "advertentie", "advertisement", "lead gen", "lead form", "leadformulier",
    "paid social", "betaald", "ad lead", "welcome email", "welkomstmail",
    "snel", "direct", "immediately", "meteen",
    "ad campaign", "campagne", "facebook lead", "instagram lead",
  ],
  s6_event_signup: [
    "eventbrite", "event", "evenement", "registratie", "registration",
    "aanmelding", "aanmelden", "signup", "sign up", "webinar",
    "mailchimp", "mailinglijst", "mailing list", "nieuwsbrief",
    "bevestigingsmail", "confirmation email", "ticket",
    "meetup", "conferentie", "conference",
  ],
  s7_blog_to_social: [
    "blog", "blogpost", "blog post", "artikel", "article", "rss",
    "publicatie", "publish", "content", "nieuwe post",
    "social post", "social media post", "twitter", "x.com",
    "instagram post", "ai-post", "ai generated", "automatisch posten",
    "content marketing", "auto-publish",
  ],
  s8_meeting_prep: [
    "afspraak", "meeting", "agenda", "calendar", "google calendar",
    "ingepland", "scheduled", "klantgesprek", "client meeting",
    "voorbereiding", "preparation", "briefing", "prep",
    "hubspot", "pipeline", "deal", "sales", "account",
    "kwartaal-review", "review", "follow-up call",
  ],
}

function scorePrompt(prompt: string, keywords: string[]): number {
  const lower = prompt.toLowerCase()
  let score = 0
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) {
      score += kw.includes(" ") ? 3 : 1
    }
  }
  return score
}

function extractPrefilledAnswers(prompt: string, scenario: Scenario): Record<string, string | null> {
  const lower = prompt.toLowerCase()
  const answers: Record<string, string | null> = {}

  for (const field of scenario.clarifyingFields) {
    answers[field.fieldKey] = null

    if (field.inputType === "choice" && field.options) {
      for (const option of field.options) {
        if (lower.includes(option.toLowerCase())) {
          answers[field.fieldKey] = option
          break
        }
      }
    }

    // Field-specific keyword heuristics
    if (!answers[field.fieldKey]) {
      if (field.fieldKey === "formTool") {
        if (lower.includes("typeform")) answers[field.fieldKey] = "Typeform"
        else if (lower.includes("tally")) answers[field.fieldKey] = "Tally"
        else if (lower.includes("google form")) answers[field.fieldKey] = "Google Forms"
      }
      if (field.fieldKey === "adPlatform") {
        if (lower.includes("linkedin")) answers[field.fieldKey] = "LinkedIn Ads"
        else if (lower.includes("meta") || lower.includes("facebook") || lower.includes("instagram")) answers[field.fieldKey] = "Meta Ads"
      }
      if (field.fieldKey === "cmsPlatform") {
        if (lower.includes("wordpress")) answers[field.fieldKey] = "WordPress"
        else if (lower.includes("webflow")) answers[field.fieldKey] = "Webflow"
        else if (lower.includes("ghost")) answers[field.fieldKey] = "Ghost"
      }
      if (field.fieldKey === "slackChannel") {
        const match = lower.match(/#([\w-]+)/)
        if (match) answers[field.fieldKey] = `#${match[1]}`
      }
    }
  }

  return answers
}

const OUT_OF_SCOPE_KEYWORDS = [
  "accounting", "boekhouding", "hr", "payroll", "salaris", "inventory",
  "voorraadbeheer", "legal", "juridisch", "contract",
]

export function matchScenarioLocal(userPrompt: string): MatchResult {
  const lower = userPrompt.toLowerCase()

  if (OUT_OF_SCOPE_KEYWORDS.some(kw => lower.includes(kw))) {
    return {
      scenarioId: null, confidence: "low", matchReason: "",
      outOfScope: true,
      outOfScopeMessage: "Ajora is designed for marketing automation flows. This type of request falls outside what we currently support. Ajora works best with workflows involving forms, ads, email, social media, analytics, and event management.",
      prefilledAnswers: {},
    }
  }

  const scores = SCENARIOS.map(s => ({
    id: s.id,
    score: scorePrompt(userPrompt, KEYWORD_MAP[s.id] ?? []),
  })).sort((a, b) => b.score - a.score)

  const best = scores[0]

  if (best.score === 0) {
    return {
      scenarioId: "s1_contact_form",
      confidence: "low",
      matchReason: "No clear match found — defaulting to the contact form scenario as a starting point.",
      outOfScope: false, outOfScopeMessage: null,
      prefilledAnswers: {},
    }
  }

  const confidence = best.score >= 4 ? "high" : best.score >= 2 ? "medium" : "low"
  const scenario = SCENARIOS.find(s => s.id === best.id)!
  const prefilledAnswers = extractPrefilledAnswers(userPrompt, scenario)

  return {
    scenarioId: best.id, confidence,
    matchReason: `Matched scenario '${scenario.title}' based on your description.`,
    outOfScope: false, outOfScopeMessage: null,
    prefilledAnswers,
  }
}
