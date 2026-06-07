import { NextRequest, NextResponse } from "next/server"
import { matchScenarioLocal } from "@/lib/matcher"
import { getScenario } from "@/lib/scenarios"

const SCENARIO_DESCRIPTIONS_NL = `
- s1_contact_form: Contactformulier → Google Sheets + Slack (leads opslaan in spreadsheet, teammelding)
- s2_weekly_digest: Wekelijks rapport → Slack (Google Analytics + Google Ads data, elke maandag automatisch)
- s3_social_mention: Social media vermelding → AI-sentimentanalyse → Slack (merknaam monitoren, positief/neutraal/negatief)
- s4_demo_request: Demo- of offerteaanvraag → Lead toevoegen aan CRM + automatische opvolging e-mail
- s5_paid_lead: Betaald advertentie-lead (LinkedIn/Meta) → doorsturen per e-mail + Slack-melding
- s6_event_signup: Eventbrite-registratie → Mailchimp-lijst + bevestigingsmail + Slack-teammelding
- s7_blog_to_social: Nieuwe blogpost (via RSS) → AI genereert social copy → posten op X (Twitter) en Instagram
- s8_meeting_prep: Nieuwe agenda-afspraak met externe gast → HubSpot logging + AI-briefing in Slack
`

const SCENARIO_DESCRIPTIONS_EN = `
- s1_contact_form: Contact form → Google Sheets + Slack (saves leads to spreadsheet, sends team notification)
- s2_weekly_digest: Weekly report → Slack (Google Analytics + Google Ads data, automated every Monday)
- s3_social_mention: Social media brand mention → AI sentiment analysis → Slack notification (positive/neutral/negative)
- s4_demo_request: Demo or quote request form → Add lead to CRM with tag + automated follow-up email
- s5_paid_lead: Paid ad lead (LinkedIn/Meta) → forward by email + Slack notification
- s6_event_signup: Eventbrite registration → Mailchimp list + confirmation email + Slack team notification
- s7_blog_to_social: New blog post (via RSS) → AI generates social copy → publish on X (Twitter) and Instagram
- s8_meeting_prep: New calendar meeting with external guest → log in HubSpot + AI briefing in Slack
`

const FIELD_KEYS_NL = `
Analyseer de prompt op CONCRETE, SPECIFIEKE waarden voor de volgende veldsleutels.
BELANGRIJK: vul een veld ALLEEN in als de gebruiker een echte specifieke waarde heeft genoemd. Generieke termen zoals "Slack", "ons team", "een e-mail", "het CRM", "ons merk" zijn NIET specifiek genoeg en moeten worden weggelaten zodat we erom kunnen vragen.

- s1_contact_form: formTool (alleen invullen als een specifieke tool zoals "Typeform", "Tally" of "Google Forms" wordt genoemd), slackChannel (alleen invullen als een specifiek kanaal met #-teken wordt genoemd, bv. "#leads")
- s2_weekly_digest: digestTime (alleen invullen als een specifiek tijdstip is genoemd, bv. "08:00"), slackChannel (specifiek #kanaal)
- s3_social_mention: brandTerm (alleen invullen als de gebruiker echt een specifieke merknaam of zoekterm heeft genoemd, niet alleen "ons merk"), slackChannel (specifiek #kanaal)
- s4_demo_request: crmTool (alleen invullen als HubSpot/Pipedrive/Salesforce expliciet wordt genoemd), senderInfo (alleen invullen als een specifieke naam + e-mailadres is gegeven, bv. "Jan de Vries — jan@bedrijf.nl")
- s5_paid_lead: adPlatform (alleen invullen als LinkedIn Ads/Meta Ads expliciet wordt genoemd), notifyTarget (alleen invullen als specifiek e-mailadres of #kanaal is genoemd)
- s6_event_signup: mailchimpList (alleen invullen als specifieke lijstnaam wordt genoemd), slackChannel (specifiek #kanaal)
- s7_blog_to_social: blogFeed (alleen invullen als specifieke URL wordt genoemd), postStyle (alleen "Professioneel"/"Vriendelijk"/"Speels"/"Zakelijk" als expliciet genoemd)
- s8_meeting_prep: hubspotPipeline (alleen invullen als specifieke pipelinenaam wordt genoemd), slackChannel (specifiek #kanaal)

Stel daarnaast KRITISCH op of er nog informatie ontbreekt om een goede workflow te bouwen. Genereer extra vragen voor missende info die NIET via bovenstaande veldsleutels gedekt wordt. Bijvoorbeeld: welke velden moeten worden opgeslagen, frequentie, taal van het bericht, prioriteit, etc.`

const FIELD_KEYS_EN = `
Extract CONCRETE, SPECIFIC field values from the prompt.
IMPORTANT: only fill a field if the user mentioned a real specific value. Generic terms like "Slack", "our team", "an email", "the CRM", "our brand" are NOT specific enough and should be omitted so we can ask about them.

- s1_contact_form: formTool (only if a specific tool like "Typeform", "Tally" or "Google Forms" is mentioned), slackChannel (only if a specific channel with #-prefix is given, e.g. "#leads")
- s2_weekly_digest: digestTime (only if a specific time like "08:00" is given), slackChannel (specific #channel)
- s3_social_mention: brandTerm (only if the user mentioned an actual specific brand name or search term, not just "our brand"), slackChannel (specific #channel)
- s4_demo_request: crmTool (only if HubSpot/Pipedrive/Salesforce is explicitly mentioned), senderInfo (only if a specific name + email is given, e.g. "Jan de Vries — jan@company.com")
- s5_paid_lead: adPlatform (only if LinkedIn Ads/Meta Ads is explicitly mentioned), notifyTarget (only if specific email or #channel is named)
- s6_event_signup: mailchimpList (only if a specific list name is mentioned), slackChannel (specific #channel)
- s7_blog_to_social: blogFeed (only if a specific URL is mentioned), postStyle (only "Professional"/"Friendly"/"Playful"/"Business" if explicitly mentioned)
- s8_meeting_prep: hubspotPipeline (only if a specific pipeline name is mentioned), slackChannel (specific #channel)

Also critically assess whether information is still missing to build a good workflow. Generate additional questions for missing info NOT covered by the field keys above. For example: which fields to save, frequency, message language, priority, etc.`

const VALID_SCENARIO_IDS = new Set([
  "s1_contact_form", "s2_weekly_digest", "s3_social_mention",
  "s4_demo_request", "s5_paid_lead",
  "s6_event_signup", "s7_blog_to_social", "s8_meeting_prep",
])

// Maps each static field key to phrases that, if present in a critical question,
// indicate the question is asking about something the static field already covers.
const FIELD_TOPIC_PHRASES: Record<string, string[]> = {
  slackChannel:    ["slack", "kanaal", "channel", "#"],
  digestTime:      ["tijdstip", "what time", "hoe laat", "uur "],
  formTool:        ["formuliertool", "form tool", "welk formulier", "which form"],
  crmTool:         ["welk crm", "which crm", "crm gebruik"],
  senderInfo:      ["afzender", "sender name", "wie stuurt", "who sends"],
  adPlatform:      ["welk platform", "ad platform", "linkedin ads", "meta ads"],
  notifyTarget:    ["doorsturen", "forward", "naar welk e-mail"],
  brandTerm:       ["merknaam", "brand name", "welke term", "monitoring term"],
  mailchimpList:   ["mailchimp", "welke lijst", "which list", "mailinglijst"],
  hubspotPipeline: ["pipeline", "welke pipeline", "which pipeline"],
  blogFeed:        ["blog url", "rss", "feed url"],
  postStyle:       ["toon", "tone", "welke toon", "post style"],
}

function isDuplicateOfStaticField(
  question: string,
  rawFieldKey: string,
  staticFieldKeys: string[],
): boolean {
  const key = rawFieldKey.toLowerCase().replace(/^extra_/, "")
  if (staticFieldKeys.some(k => k.toLowerCase() === key)) return true

  const qLower = question.toLowerCase()
  for (const staticKey of staticFieldKeys) {
    const phrases = FIELD_TOPIC_PHRASES[staticKey] ?? []
    if (phrases.some(p => qLower.includes(p))) return true
  }
  return false
}

export async function POST(req: NextRequest) {
  const { prompt, lang } = await req.json()
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt required" }, { status: 400 })
  }

  const isNl = (lang ?? "nl") === "nl"
  const key = process.env.AZURE_OPENAI_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const model = process.env.AZURE_OPENAI_MODEL ?? "gpt-4o-mini"

  if (key && endpoint) {
    const systemPrompt = isNl
      ? `Je bent een assistent die bepaalt welk van de 5 marketingautomation-scenario's het best past bij de beschrijving van de gebruiker. Je bent KRITISCH: als de gebruiker iets vaag formuleert of belangrijke informatie weglaat, stel je extra vragen.

Beschikbare scenario's:${SCENARIO_DESCRIPTIONS_NL}
${FIELD_KEYS_NL}

Reageer UITSLUITEND met geldige JSON in dit formaat:
{
  "scenarioId": "<een van de 5 ID's>",
  "confidence": <0.0 tot 1.0>,
  "prefilledAnswers": { "<fieldKey>": "<concrete waarde uit de prompt>" },
  "criticalQuestions": [
    { "fieldKey": "<korte unieke key>", "question": "<concrete vraag in het Nederlands>", "placeholder": "<voorbeeld antwoord>" }
  ]
}

Regels:
- "prefilledAnswers": alleen velden met concrete waarden uit de prompt (laat anders weg).
- "criticalQuestions": 0 tot 3 vragen over informatie die echt nodig is om de workflow goed te bouwen en die NIET in de standaard veldsleutels valt. Stel GEEN vragen die al door de standaard veldsleutels worden gedekt. Als de prompt volledig is, geef een lege array terug.`
      : `You are an assistant that determines which of 5 marketing automation scenarios best matches the user's description. You are CRITICAL: if the user is vague or omits important information, you ask additional questions.

Available scenarios:${SCENARIO_DESCRIPTIONS_EN}
${FIELD_KEYS_EN}

Respond ONLY with valid JSON in this format:
{
  "scenarioId": "<one of the 5 IDs>",
  "confidence": <0.0 to 1.0>,
  "prefilledAnswers": { "<fieldKey>": "<concrete value from the prompt>" },
  "criticalQuestions": [
    { "fieldKey": "<short unique key>", "question": "<concrete question in English>", "placeholder": "<example answer>" }
  ]
}

Rules:
- "prefilledAnswers": only fields with concrete values from the prompt (omit otherwise).
- "criticalQuestions": 0 to 3 questions about info that is really needed to build the workflow well and that is NOT covered by the standard field keys. Do NOT ask questions already covered by the standard field keys. If the prompt is complete, return an empty array.`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": key },
        body: JSON.stringify({
          model,
          input: [
            { role: "developer", content: systemPrompt },
            { role: "user", content: prompt },
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
          if (parsed.scenarioId && VALID_SCENARIO_IDS.has(parsed.scenarioId)) {
            // Sanitize critical questions: must have fieldKey + question, and must not
            // duplicate a static clarifying field for this scenario (key match or topic overlap).
            const scenario = getScenario(parsed.scenarioId)
            const staticFieldKeys = scenario?.clarifyingFields.map(f => f.fieldKey) ?? []
            const rawCQ = Array.isArray(parsed.criticalQuestions) ? parsed.criticalQuestions : []
            const criticalQuestions = rawCQ
              .filter((q: { fieldKey?: unknown; question?: unknown }) =>
                typeof q?.fieldKey === "string" && typeof q?.question === "string" && q.question.length > 0)
              .filter((q: { fieldKey: string; question: string }) =>
                !isDuplicateOfStaticField(q.question, q.fieldKey, staticFieldKeys))
              .slice(0, 3)
              .map((q: { fieldKey: string; question: string; placeholder?: string }) => ({
                fieldKey: `extra_${q.fieldKey}`,
                question: q.question,
                placeholder: typeof q.placeholder === "string" ? q.placeholder : "",
              }))
            return NextResponse.json({
              scenarioId: parsed.scenarioId,
              confidence: (parsed.confidence ?? 0) >= 0.6 ? "high" : "medium",
              matchReason: "Matched via AI classification.",
              prefilledAnswers: parsed.prefilledAnswers ?? {},
              criticalQuestions,
              outOfScope: false,
            })
          }
        }
      }
    } catch {
      clearTimeout(timer)
    }
  }

  // Keyword fallback
  const result = matchScenarioLocal(prompt)

  if (result.outOfScope || !result.scenarioId) {
    return NextResponse.json({
      outOfScope: true,
      message: result.outOfScopeMessage ?? "This type of automation is outside what Ajora currently supports.",
    })
  }

  return NextResponse.json({
    scenarioId: result.scenarioId,
    confidence: result.confidence,
    matchReason: result.matchReason,
    prefilledAnswers: result.prefilledAnswers,
    criticalQuestions: [],
    outOfScope: false,
  })
}
