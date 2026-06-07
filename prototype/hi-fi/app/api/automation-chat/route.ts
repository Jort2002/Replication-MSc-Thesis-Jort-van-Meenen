import { NextRequest, NextResponse } from "next/server"
import { SavedAutomation } from "@/lib/automations-store"
import { WorkflowStep } from "@/lib/scenarios"

function buildContext(auto: SavedAutomation, lang: string): string {
  const nl = lang === "nl"
  const created = new Date(auto.createdAt).toLocaleDateString(nl ? "nl-NL" : "en-GB")
  const stepList = auto.steps
    .map((s: WorkflowStep, i: number) => `${i + 1}. [${s.type.toUpperCase()}] ${s.label}: ${s.description}`)
    .join("\n")

  return nl
    ? `Automation: "${auto.title}"
Status: ${auto.status}
Aantal runs: ${auto.runCount}
Aangemaakt op: ${created}

Stappen:
${stepList}`
    : `Automation: "${auto.title}"
Status: ${auto.status}
Run count: ${auto.runCount}
Created: ${created}

Steps:
${stepList}`
}

export async function POST(req: NextRequest) {
  const { automation, message, lang } = await req.json()
  if (!automation || !message) {
    return NextResponse.json({ error: "automation and message required" }, { status: 400 })
  }

  const nl = (lang ?? "nl") === "nl"
  const context = buildContext(automation as SavedAutomation, lang ?? "nl")

  const key = process.env.AZURE_OPENAI_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const model = process.env.AZURE_OPENAI_MODEL ?? "gpt-4o-mini"

  const systemPrompt = nl
    ? `Je bent Ajora, een slimme marketing automation assistent. De gebruiker heeft vragen over één van hun actieve automations. Beantwoord vragen kort, concreet en behulpzaam in het Nederlands. Gebruik de onderstaande data van de automation. Maximaal 3 zinnen.

${context}`
    : `You are Ajora, a smart marketing automation assistant. The user has questions about one of their active automations. Answer questions concisely and helpfully in English. Use the automation data below. Maximum 3 sentences.

${context}`

  if (key && endpoint) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": key },
        body: JSON.stringify({
          model,
          input: [
            { role: "developer", content: systemPrompt },
            { role: "user", content: message },
          ],
        }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (res.ok) {
        const data = await res.json()
        const text = data.output?.[0]?.content?.[0]?.text
        if (text) return NextResponse.json({ reply: text.trim() })
      }
    } catch {
      clearTimeout(timer)
    }
  }

  // Keyword fallback
  const auto = automation as SavedAutomation
  const lower = message.toLowerCase()
  let reply: string

  if (nl) {
    if (lower.includes("hoe vaak") || lower.includes("hoe veel") || lower.includes("run") || lower.includes("keer")) {
      reply = auto.runCount > 0
        ? `Deze automation heeft ${auto.runCount} keer gedraaid.`
        : "Deze automation heeft nog niet gedraaid — hij wacht op de eerste trigger."
    } else if (lower.includes("stap") || lower.includes("wat doet") || lower.includes("werking") || lower.includes("hoe werkt")) {
      reply = `Deze automation heeft ${auto.steps.length} stappen: ${auto.steps.map((s: WorkflowStep) => s.label).join(", ")}.`
    } else if (lower.includes("status") || lower.includes("actief") || lower.includes("aan") || lower.includes("wacht")) {
      const labels: Record<string, string> = {
        running: "actief en draait",
        waiting: "actief en wacht op de volgende trigger",
        paused: "gepauzeerd",
        draft: "opgeslagen als concept",
      }
      reply = `De automation is momenteel ${labels[auto.status] ?? auto.status}.`
    } else if (lower.includes("wanneer") || lower.includes("trigger") || lower.includes("start")) {
      const trigger = auto.steps.find((s: WorkflowStep) => s.type === "trigger")
      reply = trigger
        ? `De automation start wanneer: ${trigger.description}.`
        : "Er is geen trigger geconfigureerd voor deze automation."
    } else {
      reply = `"${auto.title}" is momenteel ${auto.status === "running" ? "actief" : auto.status} en heeft ${auto.runCount} keer gedraaid. Stel gerust meer vragen over hoe hij werkt.`
    }
  } else {
    if (lower.includes("how many") || lower.includes("how often") || lower.includes("run") || lower.includes("times")) {
      reply = auto.runCount > 0
        ? `This automation has run ${auto.runCount} time${auto.runCount === 1 ? "" : "s"}.`
        : "This automation hasn't run yet — it's waiting for the first trigger."
    } else if (lower.includes("step") || lower.includes("what does") || lower.includes("how does")) {
      reply = `This automation has ${auto.steps.length} steps: ${auto.steps.map((s: WorkflowStep) => s.label).join(", ")}.`
    } else if (lower.includes("status") || lower.includes("active") || lower.includes("waiting")) {
      const labels: Record<string, string> = {
        running: "active and running",
        waiting: "active and waiting for the next trigger",
        paused: "paused",
        draft: "saved as draft",
      }
      reply = `The automation is currently ${labels[auto.status] ?? auto.status}.`
    } else if (lower.includes("when") || lower.includes("trigger") || lower.includes("start")) {
      const trigger = auto.steps.find((s: WorkflowStep) => s.type === "trigger")
      reply = trigger
        ? `The automation starts when: ${trigger.description}.`
        : "No trigger is configured for this automation."
    } else {
      reply = `"${auto.title}" is currently ${auto.status} and has run ${auto.runCount} time${auto.runCount === 1 ? "" : "s"}. Feel free to ask more about how it works.`
    }
  }

  return NextResponse.json({ reply })
}
