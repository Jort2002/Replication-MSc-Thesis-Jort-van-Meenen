import { SERVICES, ServiceId, WorkflowStep } from "./scenarios"

export interface SavedAutomation {
  id: string
  title: string
  services: ServiceId[]
  steps: WorkflowStep[]
  status: "running" | "waiting" | "paused" | "draft"
  createdAt: number
  runCount: number
}

const KEY = "ajora_automations"

function isWaitingTrigger(steps: WorkflowStep[]): boolean {
  const trigger = steps.find(s => s.type === "trigger")
  if (!trigger) return false
  const cat = SERVICES[trigger.service]?.category
  return cat === "social" || cat === "analytics" || cat === "content"
}

function deriveTitle(steps: WorkflowStep[]): string {
  const trigger = steps.find(s => s.type === "trigger")
  const actions = steps.filter(s => s.type !== "trigger")
  const triggerName = SERVICES[trigger?.service ?? "typeform"]?.name ?? "Trigger"
  const actionNames = actions.slice(0, 2).map(a => SERVICES[a.service]?.name ?? a.label)
  return actionNames.length > 0 ? `${triggerName} → ${actionNames.join(" + ")}` : triggerName
}

export function saveAutomation(steps: WorkflowStep[], asDraft = false): SavedAutomation {
  const all = loadAutomations()
  const status: SavedAutomation["status"] = asDraft
    ? "draft"
    : isWaitingTrigger(steps) ? "waiting" : "running"
  const entry: SavedAutomation = {
    id: `auto_${Date.now()}`,
    title: deriveTitle(steps),
    services: [...new Set(steps.map(s => s.service))] as ServiceId[],
    steps,
    status,
    createdAt: Date.now(),
    runCount: asDraft || isWaitingTrigger(steps) ? 0 : 1,
  }
  const updated = [entry, ...all]
  try {
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch { /* storage full or SSR */ }
  return entry
}

export function loadAutomations(): SavedAutomation[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function deleteAutomation(id: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(loadAutomations().filter(a => a.id !== id)))
}

export function updateAutomationStatus(id: string, status: SavedAutomation["status"]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(loadAutomations().map(a => a.id === id ? { ...a, status } : a)))
}

export function updateAutomationSteps(id: string, steps: WorkflowStep[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(
    loadAutomations().map(a => a.id === id
      ? { ...a, steps, title: deriveTitle(steps), services: [...new Set(steps.map(s => s.service))] as ServiceId[] }
      : a
    )
  ))
}

export function clearAutomations(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(KEY)
}
