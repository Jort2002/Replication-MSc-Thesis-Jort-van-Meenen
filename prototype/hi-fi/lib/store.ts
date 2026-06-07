import { cookies } from "next/headers"
import { WorkflowStep } from "./scenarios"

export interface DraftAutomation {
  id: string
  scenarioId: string
  title: string
  prompt: string
  clarificationAnswers: Record<string, string>
  steps: WorkflowStep[]
  status: "draft" | "active" | "paused" | "error"
  createdAt: number
  lastRunAt?: number
  runCount: number
  lastRunSuccess?: boolean
  lastError?: string
}

export interface SessionStore {
  automations: DraftAutomation[]
  currentDraftId?: string
}

const SESSION_COOKIE = "ajora_session"

function emptyStore(): SessionStore {
  return { automations: [] }
}

export async function getStore(): Promise<SessionStore> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return emptyStore()
  try {
    return JSON.parse(decodeURIComponent(raw)) as SessionStore
  } catch {
    return emptyStore()
  }
}

export function storeToHeader(store: SessionStore): string {
  return encodeURIComponent(JSON.stringify(store))
}

export function newDraftId(): string {
  return `auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}
