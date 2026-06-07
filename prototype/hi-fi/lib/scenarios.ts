export type ServiceId =
  | "typeform" | "google_forms" | "tally" | "google_sheets"
  | "slack" | "gmail" | "mailchimp" | "klaviyo" | "notion"
  | "google_analytics" | "meta_ads" | "google_ads" | "linkedin_ads"
  | "eventbrite" | "zoom" | "luma" | "google_calendar"
  | "hubspot" | "rss" | "twitter" | "instagram" | "mention_app"

export interface Service {
  id: ServiceId
  name: string
  color: string
  category: "form" | "sheet" | "chat" | "email" | "crm" | "analytics" | "ads" | "event" | "calendar" | "social" | "content"
}

export const SERVICES: Record<ServiceId, Service> = {
  typeform:         { id: "typeform",         name: "Typeform",           color: "#262627", category: "form" },
  google_forms:     { id: "google_forms",     name: "Google Forms",       color: "#0F9D58", category: "form" },
  tally:            { id: "tally",            name: "Tally",              color: "#1A1A1A", category: "form" },
  google_sheets:    { id: "google_sheets",    name: "Google Sheets",      color: "#0F9D58", category: "sheet" },
  slack:            { id: "slack",            name: "Slack",              color: "#4A154B", category: "chat" },
  gmail:            { id: "gmail",            name: "Gmail",              color: "#EA4335", category: "email" },
  mailchimp:        { id: "mailchimp",        name: "Mailchimp",          color: "#FFE01B", category: "email" },
  klaviyo:          { id: "klaviyo",          name: "Klaviyo",            color: "#000000", category: "email" },
  notion:           { id: "notion",           name: "Notion",             color: "#000000", category: "content" },
  google_analytics: { id: "google_analytics", name: "Google Analytics",   color: "#E37400", category: "analytics" },
  meta_ads:         { id: "meta_ads",         name: "Meta Ads",           color: "#0668E1", category: "ads" },
  google_ads:       { id: "google_ads",       name: "Google Ads",         color: "#4285F4", category: "ads" },
  linkedin_ads:     { id: "linkedin_ads",     name: "LinkedIn Ads",       color: "#0A66C2", category: "ads" },
  eventbrite:       { id: "eventbrite",       name: "Eventbrite",         color: "#F05537", category: "event" },
  zoom:             { id: "zoom",             name: "Zoom",               color: "#2D8CFF", category: "event" },
  luma:             { id: "luma",             name: "Luma",               color: "#EC4899", category: "event" },
  google_calendar:  { id: "google_calendar",  name: "Google Calendar",    color: "#4285F4", category: "calendar" },
  hubspot:          { id: "hubspot",          name: "HubSpot",            color: "#FF7A59", category: "crm" },
  rss:              { id: "rss",              name: "RSS Feed",           color: "#F26522", category: "content" },
  twitter:          { id: "twitter",          name: "X (Twitter)",        color: "#000000", category: "social" },
  instagram:        { id: "instagram",        name: "Instagram",          color: "#E1306C", category: "social" },
  mention_app:      { id: "mention_app",      name: "Mention",            color: "#00A4EF", category: "social" },
}

export interface WorkflowStep {
  id: string
  type: "trigger" | "action" | "ai"
  label: string
  description: string
  service: ServiceId
}

export interface ClarifyingField {
  fieldKey: string
  questionNl: string
  questionEn: string
  inputType: "choice" | "freetext" | "time"
  options?: string[]
  placeholderNl?: string
  placeholderEn?: string
  defaultValue?: string
}

export interface Scenario {
  id: string
  title: string
  shortDescription: string
  roleHint: string
  trigger: ServiceId
  services: ServiceId[]
  steps: WorkflowStep[]
  clarifyingFields: ClarifyingField[]
  simulatedRun: SimulatedRun
}

export interface SimulatedRun {
  sampleInput: Record<string, string>
  events: SimulatedEvent[]
  successSummary: string
}

export interface SimulatedEvent {
  step: string
  message: string
  detail?: string
  delayMs: number
}

export const SCENARIOS: Scenario[] = [
  {
    id: "s1_contact_form",
    title: "Contactformulier → Google Sheets + Slack",
    shortDescription: "Sla elke nieuwe aanvraag op in een spreadsheet en stuur je team meteen een melding.",
    roleHint: "Ideaal voor teams die inbound leads of klantverzoeken beheren",
    trigger: "typeform",
    services: ["typeform", "google_sheets", "slack"],
    steps: [
      { id: "t1", type: "trigger", label: "Formulier ingevuld", description: "Er wordt een nieuw formulier ingevuld via je contactformulier", service: "typeform" },
      { id: "a1", type: "action", label: "Rij toevoegen aan Google Sheets", description: "Sla naam, e-mail en bericht op in 'Contactformulier leads'", service: "google_sheets" },
      { id: "a2", type: "action", label: "Slack-bericht sturen", description: "Stuur een melding naar het aangewezen Slack-kanaal met de contactgegevens", service: "slack" },
    ],
    clarifyingFields: [
      {
        fieldKey: "formTool",
        questionNl: "Welk formuliertool gebruik je op je website?",
        questionEn: "Which form tool do you use on your website?",
        inputType: "choice",
        options: ["Typeform", "Tally", "Google Forms", "Anders"],
      },
      {
        fieldKey: "slackChannel",
        questionNl: "Naar welk Slack-kanaal moet de melding?",
        questionEn: "Which Slack channel should receive the notification?",
        inputType: "freetext",
        placeholderNl: "Bijv. #leads of #sales",
        placeholderEn: "E.g. #leads or #sales",
      },
    ],
    simulatedRun: {
      sampleInput: { naam: "Jan de Vries", "e-mailadres": "jan@voorbeeld.nl", bericht: "Ik ben geïnteresseerd in jullie diensten." },
      events: [
        { step: "Typeform", message: "Nieuwe inzending ontvangen van Jan de Vries", detail: "jan@voorbeeld.nl", delayMs: 600 },
        { step: "Google Sheets", message: "Verbonden met 'Contactformulier leads'", delayMs: 900 },
        { step: "Google Sheets", message: "Rij toegevoegd — rij 14", detail: "Naam, e-mail, bericht opgeslagen", delayMs: 700 },
        { step: "Slack", message: "Verbonden met kanaal", delayMs: 500 },
        { step: "Slack", message: "Bericht geplaatst", detail: "📬 Nieuw contactverzoek — Jan de Vries (jan@voorbeeld.nl)", delayMs: 600 },
      ],
      successSummary: "Inzending van Jan de Vries → opgeslagen in rij 14 → Slack-melding verstuurd",
    },
  },
  {
    id: "s2_weekly_digest",
    title: "Wekelijks prestatie-overzicht",
    shortDescription: "Elke maandagochtend een geformatteerde samenvatting van de marketingcijfers van de afgelopen week in Slack.",
    roleHint: "Ideaal voor marketingmanagers die cross-channel prestaties bijhouden",
    trigger: "google_analytics",
    services: ["google_analytics", "google_ads", "slack"],
    steps: [
      { id: "t1", type: "trigger", label: "Elke maandag om 08:00", description: "Draait automatisch op een wekelijks schema", service: "google_analytics" },
      { id: "a1", type: "action", label: "Google Analytics data ophalen", description: "Haal sessies, conversies en toppagina's op van de afgelopen 7 dagen", service: "google_analytics" },
      { id: "a2", type: "action", label: "Google Ads prestaties ophalen", description: "Haal uitgaven, klikken en ROAS op van de afgelopen 7 dagen", service: "google_ads" },
      { id: "ai1", type: "ai", label: "AI genereert samenvatting", description: "AI combineert de data tot een begrijpelijke wekelijkse samenvatting met highlights en afwijkingen", service: "slack" },
      { id: "a3", type: "action", label: "Rapport naar Slack sturen", description: "Stuur de geformatteerde samenvatting naar het aangewezen Slack-kanaal", service: "slack" },
    ],
    clarifyingFields: [
      {
        fieldKey: "digestTime",
        questionNl: "Op welk tijdstip maandagochtend moet het rapport verstuurd worden?",
        questionEn: "What time on Monday morning should the report be sent?",
        inputType: "time",
        defaultValue: "08:00",
        placeholderNl: "Standaard: 08:00",
        placeholderEn: "Default: 08:00",
      },
      {
        fieldKey: "slackChannel",
        questionNl: "Naar welk Slack-kanaal moet het rapport?",
        questionEn: "Which Slack channel should receive the digest?",
        inputType: "freetext",
        placeholderNl: "Bijv. #marketing-rapportage",
        placeholderEn: "E.g. #marketing-reports",
      },
    ],
    simulatedRun: {
      sampleInput: { week: "13–19 mei 2026", sessies: "3.842", conversies: "38", uitgaven: "€187", vertoningen: "12.400" },
      events: [
        { step: "Google Analytics", message: "Wekelijkse trigger gestart — maandag 08:00", delayMs: 400 },
        { step: "Google Analytics", message: "Afgelopen 7 dagen opgehaald: 3.842 sessies, 38 conversies", delayMs: 1100 },
        { step: "Google Ads", message: "Afgelopen 7 dagen opgehaald: €187 uitgegeven, 12.400 vertoningen", delayMs: 900 },
        { step: "Slack", message: "AI genereert samenvatting...", delayMs: 1400 },
        { step: "Slack", message: "Samenvatting klaar — 1 afwijking gevonden (CTR -12%)", delayMs: 600 },
        { step: "Slack", message: "Rapport geplaatst in kanaal", delayMs: 500 },
      ],
      successSummary: "Week 13–19 mei digest → GA + Ads data opgehaald → AI-samenvatting gegenereerd (CTR-afwijking gemarkeerd) → geplaatst in Slack",
    },
  },
  {
    id: "s3_social_mention",
    title: "Social media vermelding → Slack met sentiment",
    shortDescription: "Elke keer dat je merknaam op social media verschijnt, analyseert AI het sentiment en stuurt een melding naar Slack.",
    roleHint: "Essentieel voor marketingteams die de merkreputatie bewaken",
    trigger: "mention_app",
    services: ["mention_app", "slack"],
    steps: [
      { id: "t1", type: "trigger", label: "Merknaam gevonden op social media", description: "Merknaam of zoekterm verschijnt in een post op Twitter/X, LinkedIn, Instagram of Facebook", service: "mention_app" },
      { id: "ai1", type: "ai", label: "AI analyseert sentiment", description: "AI classificeert de post als positief, neutraal of negatief met betrouwbaarheidsscore", service: "mention_app" },
      { id: "a1", type: "action", label: "Melding sturen naar Slack", description: "Stuur post, platform, sentiment en link naar het aangewezen Slack-kanaal", service: "slack" },
    ],
    clarifyingFields: [
      {
        fieldKey: "brandTerm",
        questionNl: "Welke naam of term moet gevolgd worden?",
        questionEn: "Which name or term should be monitored?",
        inputType: "freetext",
        placeholderNl: "Bijv. je merknaam of productnaam",
        placeholderEn: "E.g. your brand name or product name",
      },
      {
        fieldKey: "slackChannel",
        questionNl: "Naar welk Slack-kanaal moet de melding?",
        questionEn: "Which Slack channel should receive the notification?",
        inputType: "freetext",
        placeholderNl: "Bijv. #brand-monitoring of #marketing",
        placeholderEn: "E.g. #brand-monitoring or #marketing",
      },
    ],
    simulatedRun: {
      sampleInput: { platform: "LinkedIn", vermelding: "Zojuist een demo gehad van @MerkNaam — indrukwekkend hoe intuïtief het werkt!", account: "Sophie Bakker" },
      events: [
        { step: "Mention", message: "Nieuwe vermelding gedetecteerd op LinkedIn", detail: "Door: Sophie Bakker · Marketing Manager", delayMs: 600 },
        { step: "AI", message: "Post analyseren op sentiment...", delayMs: 1100 },
        { step: "AI", message: "Sentimenttag toegevoegd: Positief", detail: "Betrouwbaarheid: 94%", delayMs: 600 },
        { step: "Slack", message: "Melding geplaatst in kanaal", detail: "😊 Positief · LinkedIn · Sophie Bakker", delayMs: 600 },
      ],
      successSummary: "Vermelding op LinkedIn gedetecteerd → sentiment: Positief (94%) → Slack-melding verstuurd",
    },
  },
  {
    id: "s4_demo_request",
    title: "Demo-aanvraag → CRM + opvolging e-mail",
    shortDescription: "Als iemand een demo of offerte aanvraagt, wordt de lead direct in het CRM gezet en ontvangt de aanvrager een persoonlijke opvolgingsmail.",
    roleHint: "Ideaal voor B2B-teams die demo's of offerteaanvragen verwerken",
    trigger: "typeform",
    services: ["typeform", "hubspot", "gmail"],
    steps: [
      { id: "t1", type: "trigger", label: "Demo-aanvraag ontvangen", description: "Iemand vult het demo- of offerteaanvraagformulier in", service: "typeform" },
      { id: "a1", type: "action", label: "Lead toevoegen aan CRM", description: "Voeg de aanvrager toe aan het CRM met tag 'demo aangevraagd' en status 'nieuw'", service: "hubspot" },
      { id: "a2", type: "action", label: "Opvolging e-mail sturen", description: "Stuur automatisch een persoonlijke opvolgingsmail naar de aanvrager", service: "gmail" },
    ],
    clarifyingFields: [
      {
        fieldKey: "crmTool",
        questionNl: "Welk CRM gebruik je?",
        questionEn: "Which CRM do you use?",
        inputType: "choice",
        options: ["HubSpot", "Pipedrive", "Salesforce", "Anders"],
      },
      {
        fieldKey: "senderInfo",
        questionNl: "Wie stuurt de opvolging e-mail? (naam + e-mailadres afzender)",
        questionEn: "Who sends the follow-up email? (sender name + email address)",
        inputType: "freetext",
        placeholderNl: "Bijv. Jan de Vries — jan@bedrijf.nl",
        placeholderEn: "E.g. Jan de Vries — jan@company.com",
      },
    ],
    simulatedRun: {
      sampleInput: { naam: "Thomas Visser", "e-mailadres": "thomas@acme.nl", bedrijf: "Acme BV", "aanvraag-type": "Demo" },
      events: [
        { step: "Typeform", message: "Nieuwe demo-aanvraag van Thomas Visser", detail: "thomas@acme.nl · Acme BV", delayMs: 600 },
        { step: "HubSpot", message: "Verbonden met HubSpot CRM", delayMs: 700 },
        { step: "HubSpot", message: "Contact aangemaakt: Thomas Visser", detail: "Tag: demo aangevraagd · Status: nieuw", delayMs: 700 },
        { step: "Gmail", message: "Opvolging e-mail verstuurd naar thomas@acme.nl", detail: "Onderwerp: Bedankt voor je demo-aanvraag!", delayMs: 900 },
      ],
      successSummary: "Demo-aanvraag van Thomas Visser (Acme BV) → toegevoegd aan CRM met tag 'demo aangevraagd' → opvolgingsmail verstuurd",
    },
  },
  {
    id: "s5_paid_lead",
    title: "Advertentie-lead → e-mail + Slack",
    shortDescription: "Als iemand een leadformulier invult via LinkedIn of Meta Ads, stuur je de gegevens direct door per e-mail en Slack.",
    roleHint: "Voor teams die betaalde social-campagnes draaien",
    trigger: "meta_ads",
    services: ["meta_ads", "gmail", "slack"],
    steps: [
      { id: "t1", type: "trigger", label: "Nieuw lead ontvangen", description: "Een leadformulier wordt ingevuld via LinkedIn Ads of Meta Ads", service: "meta_ads" },
      { id: "a1", type: "action", label: "Lead doorsturen per e-mail", description: "Stuur de leadgegevens naar het aangewezen teamlid binnen enkele minuten", service: "gmail" },
      { id: "a2", type: "action", label: "Teammelding sturen naar Slack", description: "Stuur de leadgegevens naar het aangewezen Slack-kanaal", service: "slack" },
    ],
    clarifyingFields: [
      {
        fieldKey: "adPlatform",
        questionNl: "Via welk platform komen de leads binnen?",
        questionEn: "Which platform are your leads coming from?",
        inputType: "choice",
        options: ["LinkedIn Ads", "Meta Ads", "Beide"],
      },
      {
        fieldKey: "notifyTarget",
        questionNl: "Naar welk e-mailadres en/of Slack-kanaal doorsturen?",
        questionEn: "Which email address and/or Slack channel should receive the leads?",
        inputType: "freetext",
        placeholderNl: "Bijv. sales@bedrijf.nl of #sales",
        placeholderEn: "E.g. sales@company.com or #sales",
      },
    ],
    simulatedRun: {
      sampleInput: { naam: "Thomas Visser", "e-mailadres": "thomas@acme.nl", telefoon: "+31 6 12345678", campagne: "B2B Zomer 2026" },
      events: [
        { step: "Meta Ads", message: "Nieuw leadformulier ontvangen", detail: "Campagne: B2B Zomer 2026", delayMs: 500 },
        { step: "Gmail", message: "Lead doorgestuurd naar team", detail: "Onderwerp: Nieuwe lead — Thomas Visser", delayMs: 900 },
        { step: "Slack", message: "Lead-melding geplaatst", detail: "🎯 Nieuwe lead: Thomas Visser — thomas@acme.nl", delayMs: 500 },
      ],
      successSummary: "Lead van 'B2B Zomer 2026' campagne (Thomas Visser) → doorgestuurd per e-mail → team gealarmeerd via Slack",
    },
  },
  {
    id: "s6_event_signup",
    title: "Eventbrite-registratie → Mailchimp + bevestiging",
    shortDescription: "Wanneer iemand zich registreert voor een event, wordt diegene toegevoegd aan een mailinglijst en krijgt een persoonlijke bevestigingsmail.",
    roleHint: "Voor marketingteams die webinars of evenementen organiseren",
    trigger: "eventbrite",
    services: ["eventbrite", "mailchimp", "slack"],
    steps: [
      { id: "t1", type: "trigger", label: "Event-registratie ontvangen", description: "Iemand registreert zich voor een evenement via Eventbrite", service: "eventbrite" },
      { id: "a1", type: "action", label: "Toevoegen aan Mailchimp-lijst", description: "Voeg de aanmelder toe aan de aangewezen Mailchimp-lijst met de juiste tag", service: "mailchimp" },
      { id: "a2", type: "action", label: "Bevestigingsmail sturen", description: "Stuur automatisch een persoonlijke bevestiging met details van het event", service: "mailchimp" },
      { id: "a3", type: "action", label: "Slack-melding sturen", description: "Stuur een korte teammelding zodat iedereen weet wie zich heeft aangemeld", service: "slack" },
    ],
    clarifyingFields: [
      {
        fieldKey: "mailchimpList",
        questionNl: "Naar welke Mailchimp-lijst moeten de aanmelders?",
        questionEn: "Which Mailchimp list should the registrants be added to?",
        inputType: "freetext",
        placeholderNl: "Bijv. 'Webinar-aanmeldingen Q3'",
        placeholderEn: "E.g. 'Webinar registrations Q3'",
      },
      {
        fieldKey: "slackChannel",
        questionNl: "Naar welk Slack-kanaal moet de teammelding?",
        questionEn: "Which Slack channel should receive the team notification?",
        inputType: "freetext",
        placeholderNl: "Bijv. #events of #marketing",
        placeholderEn: "E.g. #events or #marketing",
      },
    ],
    simulatedRun: {
      sampleInput: { naam: "Sophie Bakker", "e-mailadres": "sophie@voorbeeld.nl", evenement: "Marketing Meetup Amsterdam", datum: "12 juni 19:00" },
      events: [
        { step: "Eventbrite", message: "Nieuwe registratie ontvangen — Sophie Bakker", detail: "Event: Marketing Meetup Amsterdam · 12 juni 19:00", delayMs: 600 },
        { step: "Mailchimp", message: "Verbonden met lijst 'Webinar-aanmeldingen Q3'", delayMs: 800 },
        { step: "Mailchimp", message: "Contact toegevoegd met tag 'event-aanmelder'", delayMs: 600 },
        { step: "Mailchimp", message: "Bevestigingsmail verstuurd naar sophie@voorbeeld.nl", detail: "Onderwerp: Bedankt voor je aanmelding!", delayMs: 900 },
        { step: "Slack", message: "Teammelding geplaatst in #events", detail: "🎟️ Nieuwe aanmelding: Sophie Bakker — Marketing Meetup", delayMs: 500 },
      ],
      successSummary: "Aanmelding Sophie Bakker voor Marketing Meetup → toegevoegd aan Mailchimp-lijst → bevestiging verstuurd → team gealarmeerd in Slack",
    },
  },
  {
    id: "s7_blog_to_social",
    title: "Nieuwe blogpost → AI social posts",
    shortDescription: "Als er een nieuw blogartikel op je website verschijnt, laat AI een social-mediabericht genereren en publiceer dat op je kanalen.",
    roleHint: "Voor content- en social media managers die regelmatig publiceren",
    trigger: "rss",
    services: ["rss", "twitter", "instagram"],
    steps: [
      { id: "t1", type: "trigger", label: "Nieuw blogartikel gepubliceerd", description: "Detecteert via RSS dat er een nieuw artikel op je blog is verschenen", service: "rss" },
      { id: "ai1", type: "ai", label: "AI genereert social copy", description: "AI maakt op basis van titel + samenvatting een korte aansprekende social-mediapost", service: "twitter" },
      { id: "a1", type: "action", label: "Posten op X (Twitter)", description: "Plaats het AI-bericht direct op je X-account met een link naar het artikel", service: "twitter" },
      { id: "a2", type: "action", label: "Posten op Instagram", description: "Plaats een aangepaste versie van het bericht op je Instagram-account", service: "instagram" },
    ],
    clarifyingFields: [
      {
        fieldKey: "blogFeed",
        questionNl: "Wat is de URL van je blog (of RSS-feed)?",
        questionEn: "What is the URL of your blog (or RSS feed)?",
        inputType: "freetext",
        placeholderNl: "Bijv. https://blog.bedrijf.nl/feed",
        placeholderEn: "E.g. https://blog.company.com/feed",
      },
      {
        fieldKey: "postStyle",
        questionNl: "Welke toon moet de AI gebruiken?",
        questionEn: "Which tone should the AI use?",
        inputType: "choice",
        options: ["Professioneel", "Vriendelijk", "Speels", "Zakelijk"],
      },
    ],
    simulatedRun: {
      sampleInput: { titel: "5 tips voor betere e-mailcampagnes", bron: "Marketingblog.nl", datum: "25 mei 2026", samenvatting: "E-mail blijft een van de meest effectieve B2B-kanalen." },
      events: [
        { step: "RSS", message: "Nieuw artikel gedetecteerd in feed", detail: "'5 tips voor betere e-mailcampagnes' · Marketingblog.nl", delayMs: 700 },
        { step: "AI", message: "Social post genereren in vriendelijke toon...", delayMs: 1300 },
        { step: "AI", message: "Post klaar — 187 tekens", detail: "📩 5 manieren waarop e-mailcampagnes écht converteren. Lees het hier ↓", delayMs: 600 },
        { step: "Twitter", message: "Bericht geplaatst op X", detail: "Met automatische link naar artikel", delayMs: 700 },
        { step: "Instagram", message: "Bericht geplaatst op Instagram", detail: "Aangepast voor Instagram-formaat", delayMs: 700 },
      ],
      successSummary: "Nieuw artikel '5 tips voor betere e-mailcampagnes' → AI-post gegenereerd → geplaatst op X en Instagram",
    },
  },
  {
    id: "s8_meeting_prep",
    title: "Afspraak gepland → HubSpot + Slack-briefing",
    shortDescription: "Als er een klantafspraak in je agenda komt, wordt die direct in HubSpot gelogd en krijgt je team een korte briefing in Slack.",
    roleHint: "Voor sales- en accountmanagers die klantgesprekken voorbereiden",
    trigger: "google_calendar",
    services: ["google_calendar", "hubspot", "slack"],
    steps: [
      { id: "t1", type: "trigger", label: "Nieuwe agenda-afspraak met externe gast", description: "Detecteert wanneer er een afspraak met een externe deelnemer wordt ingepland", service: "google_calendar" },
      { id: "a1", type: "action", label: "Afspraak loggen in HubSpot", description: "Koppel de afspraak aan het juiste contact en de juiste deal in HubSpot", service: "hubspot" },
      { id: "ai1", type: "ai", label: "AI maakt briefing", description: "AI vat recente activiteit van de klant samen en stelt drie gespreksonderwerpen voor", service: "slack" },
      { id: "a2", type: "action", label: "Briefing posten in Slack", description: "Stuur de briefing met klantcontext naar het sales-kanaal", service: "slack" },
    ],
    clarifyingFields: [
      {
        fieldKey: "hubspotPipeline",
        questionNl: "In welke HubSpot-pipeline moeten deze afspraken gelogd worden?",
        questionEn: "In which HubSpot pipeline should these meetings be logged?",
        inputType: "freetext",
        placeholderNl: "Bijv. 'Sales B2B' of 'Enterprise deals'",
        placeholderEn: "E.g. 'Sales B2B' or 'Enterprise deals'",
      },
      {
        fieldKey: "slackChannel",
        questionNl: "Naar welk Slack-kanaal moet de briefing?",
        questionEn: "Which Slack channel should receive the briefing?",
        inputType: "freetext",
        placeholderNl: "Bijv. #sales of #accountmanagement",
        placeholderEn: "E.g. #sales or #accountmanagement",
      },
    ],
    simulatedRun: {
      sampleInput: { klant: "Thomas Visser — Acme BV", afspraak: "Kwartaal-review", datum: "3 juni 14:00", duur: "45 min" },
      events: [
        { step: "Google Calendar", message: "Nieuwe afspraak gedetecteerd met externe gast", detail: "Thomas Visser (thomas@acme.nl) · 3 juni 14:00", delayMs: 600 },
        { step: "HubSpot", message: "Contact en deal gevonden", detail: "Acme BV · pipeline 'Sales B2B'", delayMs: 800 },
        { step: "HubSpot", message: "Afspraak gelogd als activiteit", detail: "Type: Meeting · Status: Scheduled", delayMs: 600 },
        { step: "AI", message: "Briefing genereren op basis van klantcontext...", delayMs: 1400 },
        { step: "AI", message: "Briefing klaar met 3 gespreksonderwerpen", detail: "Laatste contact: 14 dagen geleden · Open deal: €24.000", delayMs: 600 },
        { step: "Slack", message: "Briefing geplaatst in #sales", detail: "📋 Kwartaal-review Acme BV — 3 onderwerpen voorbereid", delayMs: 500 },
      ],
      successSummary: "Afspraak met Acme BV gedetecteerd → gelogd in HubSpot (Sales B2B) → AI-briefing gegenereerd → geplaatst in Slack",
    },
  },
]

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id)
}
