export type Lang = "nl" | "en"

export const t = {
  nl: {
    appName: "Ajora",
    appTagline: "Automatiseer je marketing",

    nav: {
      back: "Terug",
      stepOf: (s: number, t: number) => `Stap ${s} van ${t}`,
    },

    welcome: {
      headline: "Automatiseer je marketing.",
      headlineAccent: "Geen code nodig.",
      body: "Beschrijf wat je wilt automatiseren in gewone taal. Ajora bouwt het stap voor stap en laat je precies zien wat er gebeurt voordat er iets wordt uitgevoerd.",
      cta: "Aan de slag",
      viewAutomations: "Bekijk mijn automations",
      automationTick1: "Werkt in het Nederlands en Engels",
      automationTick2: "Test voordat het live gaat",
      illustrationCaption: "Deze automation draait automatisch, elke keer opnieuw.",
    },

    build: {
      title: "Wat wil je automatiseren?",
      subtitle: "Beschrijf het in je eigen woorden. Je kunt in het Nederlands of Engels schrijven, technische kennis is niet nodig.",
      placeholder: 'Beschrijf hier in je eigen woorden welke workflow je wil automatiseren...',
      cta: "Doorgaan",
      analyzing: "Analyseren...",
      orPick: "Of kies een suggestie om mee te beginnen:",
      micTooltip: "Spreek je verzoek in",
      micListening: "Luisteren...",
      suggestions: [
        "Als iemand zich aanmeldt voor ons webinar via Eventbrite, voeg ze toe aan onze nieuwsbrief en stuur een bevestiging",
        "Als er een nieuwe blogpost verschijnt, laat AI social media-posts genereren en publiceer ze op onze kanalen",
        "Wanneer er een klantafspraak in mijn agenda komt, log hem in HubSpot en stuur een briefing naar Slack",
      ],
    },

    clarify: {
      intro: (n: number) =>
        n === 1
          ? "Begrepen! Voordat ik dit bouw, heb ik nog één korte vraag:"
          : `Begrepen! Voordat ik dit bouw, heb ik nog ${n} korte vragen:`,
      questionOf: (i: number, t: number) => `Vraag ${i} van ${t}`,
      continue: "Doorgaan",
      skip: "Sla over",
      answeredLabel: "Antwoord:",
    },

    preview: {
      title: "Dit ga ik voor je bouwen",
      subtitle: "Bekijk elke stap hieronder. Er wordt niets uitgevoerd totdat je akkoord geeft.",
      toolsConnected: "Gebruikte tools:",
      cta: "Ja, dit klopt zo. Voer een test uit.",
      editTitle: "Stap aanpassen",
      editSubtitle: "Beschrijf hieronder wat je anders wilt voor deze stap.",
      editPlaceholder: "Bijv. gebruik HubSpot in plaats van Google Sheets",
      updatePlan: "Plan bijwerken",
      cancelEdit: "Annuleren",
      changeStepHint: "Klik op een stap om die te bewerken",
      triggerLabel: "Wanneer",
      actionLabel: "Dan",
      aiLabel: "AI-stap",
      nlEditTitle: "Wil je iets anders aanpassen?",
      nlEditPlaceholder: "Bijv. \"Voeg een Slack-melding toe\" of \"Gebruik HubSpot als CRM in plaats van Google Sheets\"",
      applyEdit: "Aanpassen",
      applying: "Verwerken...",
      editError: "Ajora begreep dit verzoek niet goed. Probeer het anders te formuleren, of klik op een stap om die direct te bewerken.",
      editUnchanged: "Ajora kon geen overeenkomende tool vinden. Klik op de stap die je wilt aanpassen en bewerk de tekst direct.",
    },

    test: {
      bannerTitle: "Testmodus — er wordt nog niets uitgevoerd",
      bannerBody: "Dit is een veilige simulatie. Er worden geen echte gegevens naar een service gestuurd.",
      sampleTitle: "Probeer het met voorbeeldgegevens",
      sampleSubtitle: "We hebben alvast voorbeeldwaarden ingevuld. Je kunt ze aanpassen om te zien hoe de automation omgaat met echte invoer.",
      runTest: "Test uitvoeren met deze gegevens",
      running: "Test uitvoeren...",
      passed: "Test geslaagd",
      failed: "Test mislukt",
      whatHappened: "Dit zou er zijn gebeurd:",
      noRealData: "Dit was een test. Er zijn geen echte gegevens gewijzigd.",
      ctaProceed: "Ziet er goed uit, zet het aan",
      ctaFix: "Verbinding herstellen",
      ctaBack: "Er klopt iets niet, ga terug",
    },

    activate: {
      title: "Klaar om dit aan te zetten?",
      subtitle: "De automation heeft de test doorstaan. Bekijk wat er gaat gebeuren en activeer wanneer je er klaar voor bent.",
      automationLabel: "Automation",
      steps: "Stappen",
      autoRuns: "Draait automatisch. Je kunt het op elk moment uitschakelen via je dashboard.",
      gdpr: "Ajora heeft alleen toegang tot de services in deze automation. Er worden geen gegevens opgeslagen op Ajora-servers. Je gegevens blijven binnen de tools die jij hebt verbonden.",
      ctaOn: "Automation aanzetten",
      ctaDraft: "Opslaan als concept — ik activeer het later",
      saving: "Opslaan...",
      notification: "Je ontvangt een melding zodra deze automation voor de eerste keer draait, zodat je het resultaat kunt controleren.",
      notifyOptIn: "Stuur me een melding als deze automation voor het eerst draait",
    },

    success: {
      title: "Het werkt!",
      subtitle: "Je automation heeft voor de eerste keer gedraaid.",
      whatHappened: "Dit is er gebeurd:",
      fromNowOn: "Vanaf nu draait dit automatisch. Je ziet elke keer het resultaat in je activiteitenlog.",
      whatItSavesTitle: "Wat dit je oplevert",
      whatItSavesBody: "Elke keer dat deze trigger afgaat, regelt Ajora het automatisch. Geen handmatig kopiëren, geen gemiste meldingen, geen vertraging.",
      ctaDashboard: "Bekijk mijn automations",
      ctaBuild: "Nog een automation bouwen",
      waitingTitle: "Je automation staat aan!",
      waitingSubtitle: "Ajora houdt alles in de gaten en grijpt in zodra het zover is.",
      waitingLabel: "Wat Ajora nu doet:",
      waitingNote: "Je ontvangt een melding in je activiteitenlog zodra de automation voor het eerst heeft gedraaid.",
      waitingSavesTitle: "Wat dit je oplevert",
      waitingSavesBody: "Ajora neemt het monitoren van je over. Zodra er iets relevant gebeurt, handelt het alles automatisch af — jij hoeft niets te doen.",
    },

    error: {
      bannerTitle: "Er is iets misgegaan met je automation",
      bannerBody: "Hij is gestopt voordat alles klaar was. Dit is er gebeurd.",
      failed: "mislukt",
      suggestedFix: "Aanbevolen oplossing",
      fixBody: "Controleer of de verbonden service nog toegankelijk is en of Ajora de juiste rechten heeft. Kom daarna terug en probeer het opnieuw.",
      errorRef: "Foutreferentie",
      shareWithSupport: "deel dit met support als je hulp nodig hebt.",
      ctaFix: "Verbinding herstellen",
      ctaHelp: "Vraag iemand om hulp",
    },

    dashboard: {
      title: "Jouw automations",
      newAutomation: "Nieuwe automation",
      nav: {
        overview: "Overzicht",
        automations: "Automations",
        activity: "Activiteiten",
        settings: "Instellingen",
      },
      groups: {
        error: "Aandacht vereist",
        running: "Actief",
        paused: "Gepauzeerd",
        draft: "Concepten",
      },
      status: {
        running: "Actief",
        error: "Fout",
        paused: "Gepauzeerd",
        draft: "Concept",
      },
      fix: "Oplossen",
      activate: "Activeren",
      runs: (n: number) => (n === 1 ? "1 run" : `${n} runs`),
      neverRun: "Nog niet uitgevoerd",
      empty: "Je hebt nog geen automations.",
      buildFirst: "Bouw je eerste automation",
    },

    lang: { nl: "NL", en: "EN" },
  },

  en: {
    appName: "Ajora",
    appTagline: "Automate your marketing",

    nav: {
      back: "Back",
      stepOf: (s: number, t: number) => `Step ${s} of ${t}`,
    },

    welcome: {
      headline: "Automate your marketing.",
      headlineAccent: "No code needed.",
      body: "Describe what you want to automate in plain language. Ajora builds it step by step and shows you exactly what happens before anything runs.",
      cta: "Get started",
      viewAutomations: "View my automations",
      automationTick1: "Works in Dutch and English",
      automationTick2: "Test before it goes live",
      illustrationCaption: "This automation runs automatically, every time.",
    },

    build: {
      title: "What do you want to automate?",
      subtitle: "Describe it in your own words. You can write in Dutch or English — no technical knowledge needed.",
      placeholder: 'Describe in your own words what workflow you want to automate...',
      cta: "Continue",
      analyzing: "Analysing...",
      orPick: "Or pick a suggestion to get started:",
      micTooltip: "Speak your request",
      micListening: "Listening...",
      suggestions: [
        "When someone registers for our webinar via Eventbrite, add them to our newsletter and send a confirmation",
        "When a new blog post is published, have AI generate social media posts and publish them on our channels",
        "When a client meeting appears in my calendar, log it in HubSpot and send a briefing to Slack",
      ],
    },

    clarify: {
      intro: (n: number) =>
        n === 1
          ? "Got it! Before I build this, I have one quick question:"
          : `Got it! Before I build this, I have ${n} quick questions:`,
      questionOf: (i: number, t: number) => `Question ${i} of ${t}`,
      continue: "Continue",
      skip: "Skip",
      answeredLabel: "Answer:",
    },

    preview: {
      title: "Here is what I will build for you",
      subtitle: "Review each step below. Nothing runs until you confirm.",
      toolsConnected: "Tools connected:",
      cta: "Yes, this looks right. Run a test.",
      editTitle: "Edit this step",
      editSubtitle: "Describe what you want to change for this step.",
      editPlaceholder: "E.g. use HubSpot instead of Google Sheets",
      updatePlan: "Update plan",
      cancelEdit: "Cancel",
      changeStepHint: "Click any step to edit it",
      triggerLabel: "When",
      actionLabel: "Then",
      aiLabel: "AI step",
      nlEditTitle: "Want to change something else?",
      nlEditPlaceholder: "E.g. \"Add a Slack notification\" or \"Use HubSpot as CRM instead of Google Sheets\"",
      applyEdit: "Apply change",
      applying: "Processing...",
      editError: "Ajora could not understand this request. Try rephrasing it, or click a step to edit it directly.",
      editUnchanged: "Ajora could not find a matching tool. Click the step you want to change and edit the text directly.",
    },

    test: {
      bannerTitle: "Test mode — nothing will actually happen yet",
      bannerBody: "This is a safe simulation. No real data is sent to any service.",
      sampleTitle: "Try it with sample data",
      sampleSubtitle: "We have pre-filled some example values. You can edit them to see how your automation handles real input.",
      runTest: "Run test with this data",
      running: "Running test...",
      passed: "Test passed",
      failed: "Test failed",
      whatHappened: "Here is what would have happened:",
      noRealData: "This was a test. No real data was changed.",
      ctaProceed: "Looks good, turn it on",
      ctaFix: "Fix the connection",
      ctaBack: "Something is wrong, go back",
    },

    activate: {
      title: "Ready to turn this on?",
      subtitle: "Your automation passed the test. Review what it will do, then activate when you are ready.",
      automationLabel: "Automation",
      steps: "Steps",
      autoRuns: "Runs automatically. You can turn it off at any time from your dashboard.",
      gdpr: "Ajora only accesses the specific services in this automation. No data is stored on Ajora servers. Your data stays within the tools you have already connected.",
      ctaOn: "Turn on automation",
      ctaDraft: "Save as draft — I will activate it later",
      saving: "Saving...",
      notification: "You will receive a notification the first time this automation runs so you can verify the result.",
      notifyOptIn: "Notify me when this automation runs for the first time",
    },

    success: {
      title: "It worked!",
      subtitle: "Your automation ran for the first time.",
      whatHappened: "Here is what happened:",
      fromNowOn: "From now on, this runs automatically. You will see every run in your activity log.",
      whatItSavesTitle: "What this saves you",
      whatItSavesBody: "Every time this trigger fires, Ajora handles it automatically. No manual copying, no missed notifications, no delays.",
      ctaDashboard: "View my automations",
      ctaBuild: "Build another one",
      waitingTitle: "Your automation is live!",
      waitingSubtitle: "Ajora is watching and will act the moment it triggers.",
      waitingLabel: "What Ajora is doing now:",
      waitingNote: "You will see a notification in your activity log the first time the automation runs.",
      waitingSavesTitle: "What this saves you",
      waitingSavesBody: "Ajora monitors everything for you. The moment something relevant happens, it handles it automatically — you don't have to do a thing.",
    },

    error: {
      bannerTitle: "Something went wrong with your automation",
      bannerBody: "It stopped before completing. Here is what happened.",
      failed: "failed",
      suggestedFix: "Suggested fix",
      fixBody: "Check that the connected service is still accessible and that Ajora has the right permissions. Then come back and try again.",
      errorRef: "Error reference",
      shareWithSupport: "share this with support if you need help.",
      ctaFix: "Fix the connection",
      ctaHelp: "Ask someone for help",
    },

    dashboard: {
      title: "Your automations",
      newAutomation: "New automation",
      nav: {
        overview: "Overview",
        automations: "Automations",
        activity: "Activity",
        settings: "Settings",
      },
      groups: {
        error: "Needs attention",
        running: "Running",
        paused: "Paused",
        draft: "Drafts",
      },
      status: {
        running: "Running",
        error: "Error",
        paused: "Paused",
        draft: "Draft",
      },
      fix: "Fix it",
      activate: "Activate",
      runs: (n: number) => (n === 1 ? "1 run" : `${n} runs`),
      neverRun: "Not yet run",
      empty: "You do not have any automations yet.",
      buildFirst: "Build your first automation",
    },

    lang: { nl: "NL", en: "EN" },
  },
} as const

export type Translations = (typeof t)[Lang]
