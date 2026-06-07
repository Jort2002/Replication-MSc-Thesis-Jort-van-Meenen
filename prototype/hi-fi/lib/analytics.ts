// Client-side analytics event logger for the DC2 user study.
// Events are stored in sessionStorage so the researcher can export them
// after each session via the browser console: copy(JSON.parse(sessionStorage.getItem('ajora_events')))

export type EventName =
  | "page_view"
  | "scenario_selected"
  | "prompt_submitted"
  | "clarification_answered"
  | "plan_accepted"
  | "plan_edit_clicked"
  | "dry_run_started"
  | "dry_run_completed"
  | "activation_clicked"
  | "save_draft_clicked"
  | "automation_activated"
  | "success_screen_viewed"
  | "error_screen_viewed"
  | "error_fix_clicked"
  | "get_help_clicked"
  | "dashboard_viewed"
  | "new_automation_clicked"
  | "automation_status_changed"
  | "automation_deleted"
  | "automation_edited"

export interface AnalyticsEvent {
  event: EventName
  timestamp: number
  sessionMs: number
  properties?: Record<string, string | number | boolean>
}

const SESSION_START_KEY = "ajora_session_start"
const EVENTS_KEY = "ajora_events"

function getSessionStart(): number {
  if (typeof window === "undefined") return Date.now()
  const stored = sessionStorage.getItem(SESSION_START_KEY)
  if (stored) return parseInt(stored, 10)
  const now = Date.now()
  sessionStorage.setItem(SESSION_START_KEY, String(now))
  return now
}

export function trackEvent(event: EventName, properties?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return
  const sessionStart = getSessionStart()
  const entry: AnalyticsEvent = {
    event,
    timestamp: Date.now(),
    sessionMs: Date.now() - sessionStart,
    properties,
  }
  const existing = sessionStorage.getItem(EVENTS_KEY)
  const events: AnalyticsEvent[] = existing ? JSON.parse(existing) : []
  events.push(entry)
  sessionStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

export function getEvents(): AnalyticsEvent[] {
  if (typeof window === "undefined") return []
  const raw = sessionStorage.getItem(EVENTS_KEY)
  return raw ? JSON.parse(raw) : []
}

export function exportSession(participantId?: string) {
  const events = getEvents()
  const payload = {
    exportedAt: new Date().toISOString(),
    participantId: participantId ?? `p_${Date.now()}`,
    sessionDurationMs: events.length > 0 ? events[events.length - 1].timestamp - events[0].timestamp : 0,
    eventCount: events.length,
    events,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `ajora-session-${payload.participantId}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
