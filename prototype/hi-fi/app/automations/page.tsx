"use client"
import Link from "next/link"
import { useEffect, useRef, useState, KeyboardEvent } from "react"
import { ServiceIcon } from "@/components/service-icon"
import { trackEvent, exportSession } from "@/lib/analytics"
import { useLang } from "@/components/lang-provider"
import { Nav } from "@/components/nav"
import {
  loadAutomations, SavedAutomation, deleteAutomation as storeDelete,
  updateAutomationStatus, updateAutomationSteps,
} from "@/lib/automations-store"
import { WorkflowStep } from "@/lib/scenarios"

function timeAgo(ts: number, lang: string): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  const nl = lang === "nl"
  if (diff < 60)    return nl ? "Zojuist" : "Just now"
  if (diff < 3600)  { const m = Math.floor(diff / 60);  return nl ? `${m} min geleden` : `${m}m ago` }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return nl ? `${h} uur geleden` : `${h}h ago` }
  const d = Math.floor(diff / 86400)
  return nl ? `${d} dagen geleden` : `${d} days ago`
}

// ── Step row in detail panel ──────────────────────────────────────────────────

function StepRow({ step, lang }: { step: WorkflowStep; lang: string }) {
  const nl = lang === "nl"
  const typeLabel =
    step.type === "trigger" ? (nl ? "WANNEER" : "WHEN")
    : step.type === "ai" ? "AI"
    : nl ? "DAN" : "THEN"
  const typeStyle =
    step.type === "trigger" ? "text-primary bg-primary/5 border-primary/30"
    : step.type === "ai"    ? "text-amber-700 bg-amber-50 border-amber-200"
    :                         "text-muted-foreground bg-muted/30 border-border/60"
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex-shrink-0 mt-0.5">
        <ServiceIcon serviceId={step.service} size="sm" />
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className={`self-start text-[9px] font-bold uppercase tracking-wider border rounded px-1.5 py-0.5 ${typeStyle}`}>
          {typeLabel}
        </span>
        <span className="text-xs font-semibold text-foreground mt-0.5 leading-snug">{step.label}</span>
        <span className="text-[11px] text-muted-foreground leading-snug">{step.description}</span>
      </div>
    </div>
  )
}

// ── AI chat types ─────────────────────────────────────────────────────────────

interface ChatMsg { role: "user" | "assistant"; content: string }

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  automation: initAuto,
  lang,
  onClose,
  onMutate,
}: {
  automation: SavedAutomation
  lang: string
  onClose: () => void
  onMutate: (updated: SavedAutomation | null) => void
}) {
  const nl = lang === "nl"
  const [auto, setAuto] = useState(initAuto)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [nlEdit, setNlEdit] = useState("")
  const [isApplying, setIsApplying] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState(false)
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Reset panel state when a different automation is opened
  useEffect(() => {
    setAuto(initAuto)
    setConfirmDelete(false)
    setNlEdit("")
    setEditError(null)
    setEditSuccess(false)
    setChat([])
    setChatInput("")
  }, [initAuto.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat])

  const statusConfig: Record<SavedAutomation["status"], { label: string; badge: string }> = {
    running: { label: nl ? "Actief" : "Running",           badge: "bg-green-100 text-green-700" },
    waiting: { label: nl ? "Wacht op trigger" : "Waiting", badge: "bg-blue-50 text-blue-600" },
    paused:  { label: nl ? "Gepauzeerd" : "Paused",        badge: "bg-amber-50 text-amber-700" },
    draft:   { label: nl ? "Concept" : "Draft",            badge: "bg-gray-100 text-gray-500" },
  }
  const cfg = statusConfig[auto.status]

  const mutate = (updated: SavedAutomation) => {
    setAuto(updated)
    onMutate(updated)
  }

  const togglePause = () => {
    const next: SavedAutomation["status"] = auto.status === "paused" ? "waiting" : "paused"
    const updated = { ...auto, status: next }
    updateAutomationStatus(auto.id, next)
    mutate(updated)
    trackEvent("automation_status_changed", { id: auto.id, status: next })
  }

  const handleDelete = () => {
    storeDelete(auto.id)
    onMutate(null)
    onClose()
    trackEvent("automation_deleted", { id: auto.id })
  }

  const handleNlEdit = async () => {
    if (!nlEdit.trim()) return
    setIsApplying(true)
    setEditError(null)
    setEditSuccess(false)
    try {
      const res = await fetch("/api/edit-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: auto.steps, instruction: nlEdit, lang }),
      })
      const data = await res.json()
      if (data.steps && data.steps.length > 0 && data.source !== "unchanged") {
        updateAutomationSteps(auto.id, data.steps)
        const updated: SavedAutomation = {
          ...auto,
          steps: data.steps,
          services: [...new Set((data.steps as WorkflowStep[]).map(s => s.service))],
        }
        mutate(updated)
        setNlEdit("")
        setEditSuccess(true)
        setTimeout(() => setEditSuccess(false), 3000)
        trackEvent("automation_edited", { id: auto.id })
      } else {
        setEditError(nl
          ? "Ajora begreep dit verzoek niet. Probeer het anders te formuleren."
          : "Ajora couldn't understand this. Try rephrasing.")
      }
    } catch {
      setEditError(nl ? "Er ging iets mis. Probeer het opnieuw." : "Something went wrong. Try again.")
    } finally {
      setIsApplying(false)
    }
  }

  const sendChat = async () => {
    const msg = chatInput.trim()
    if (!msg || isSending) return
    setChatInput("")
    setChat(prev => [...prev, { role: "user", content: msg }])
    setIsSending(true)
    try {
      const res = await fetch("/api/automation-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automation: auto, message: msg, lang }),
      })
      const data = await res.json()
      setChat(prev => [...prev, { role: "assistant", content: data.reply ?? "…" }])
    } catch {
      setChat(prev => [...prev, {
        role: "assistant",
        content: nl ? "Sorry, er ging iets mis." : "Sorry, something went wrong.",
      }])
    } finally {
      setIsSending(false)
    }
  }

  const onChatKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat() }
  }

  const suggestions = nl
    ? ["Hoe vaak heeft dit gedraaid?", "Wat doet elke stap?", "Is alles goed gegaan?"]
    : ["How many times has this run?", "What does each step do?", "Has everything worked?"]

  const canPause = auto.status === "running" || auto.status === "waiting" || auto.status === "paused"

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-border flex-shrink-0 bg-white">
        <div className="flex flex-col gap-2 min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {auto.services.slice(0, 4).map(s => (
              <ServiceIcon key={s} serviceId={s} size="sm" />
            ))}
          </div>
          <h2 className="text-sm font-semibold text-foreground leading-snug">{auto.title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {auto.runCount > 0
                ? `${auto.runCount} run${auto.runCount === 1 ? "" : "s"}`
                : nl ? "Nog niet gedraaid" : "Not yet run"}
            </span>
            <span className="text-[11px] text-muted-foreground">· {timeAgo(auto.createdAt, lang)}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label={nl ? "Sluiten" : "Close"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-border">

        {/* Steps */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            {nl ? "Stappen" : "Steps"}
          </p>
          <div className="divide-y divide-border/50">
            {auto.steps.map(step => (
              <StepRow key={step.id} step={step} lang={lang} />
            ))}
          </div>
        </div>

        {/* Manage: pause + delete */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {nl ? "Beheren" : "Manage"}
          </p>
          <div className="flex flex-wrap gap-2">
            {canPause && (
              <button
                onClick={togglePause}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
              >
                {auto.status === "paused" ? (
                  <>
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M3 2l7 4-7 4V2z" />
                    </svg>
                    {nl ? "Hervatten" : "Resume"}
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                      <rect x="2" y="2" width="3" height="8" rx="0.5" />
                      <rect x="7" y="2" width="3" height="8" rx="0.5" />
                    </svg>
                    {nl ? "Pauzeren" : "Pause"}
                  </>
                )}
              </button>
            )}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                  <path d="M2 3h8M4.5 3V2h3v1M3.5 3l.5 7h4l.5-7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                {nl ? "Verwijderen" : "Delete"}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <span className="text-xs text-red-700">{nl ? "Weet je het zeker?" : "Are you sure?"}</span>
                <button
                  onClick={handleDelete}
                  className="text-xs font-semibold text-red-700 hover:text-red-900 transition-colors"
                >
                  {nl ? "Ja, verwijder" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {nl ? "Annuleren" : "Cancel"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* NL edit */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {nl ? "Aanpassen" : "Edit"}
          </p>
          <textarea
            value={nlEdit}
            onChange={e => { setNlEdit(e.target.value); setEditError(null) }}
            className="rounded-xl border border-border px-3 py-2.5 text-xs resize-none min-h-[60px] focus:outline-none focus:border-primary bg-background leading-relaxed"
            placeholder={nl
              ? "Bijv. \"Voeg een CC toe aan de e-mail\" of \"Gebruik Pipedrive in plaats van HubSpot\""
              : "E.g. \"Add a CC to the email\" or \"Use Pipedrive instead of HubSpot\""}
          />
          {editError && <p className="text-xs text-red-600">{editError}</p>}
          {editSuccess && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {nl ? "Automation bijgewerkt." : "Automation updated."}
            </p>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleNlEdit}
              disabled={!nlEdit.trim() || isApplying}
              className="flex items-center gap-1.5 bg-muted text-foreground rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40"
            >
              {isApplying ? (
                <>
                  <span className="w-3 h-3 border border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  {nl ? "Verwerken..." : "Processing..."}
                </>
              ) : nl ? "Aanpassen" : "Apply change"}
            </button>
          </div>
        </div>

        {/* AI chat */}
        <div className="px-5 py-4 flex flex-col gap-3 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {nl ? "Vraag Ajora" : "Ask Ajora"}
          </p>

          {chat.length === 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                {nl
                  ? "Stel een vraag over deze automation — status, stappen, of wat het precies doet."
                  : "Ask a question about this automation — its status, steps, or what it does."}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map(q => (
                  <button
                    key={q}
                    onClick={() => setChatInput(q)}
                    className="text-[11px] border border-border rounded-full px-2.5 py-1 hover:bg-muted hover:text-foreground transition-colors text-muted-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.length > 0 && (
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-1">
                    {[0, 150, 300].map(d => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          <div className="flex gap-2 mt-auto pt-1">
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={onChatKey}
              rows={1}
              className="flex-1 rounded-xl border border-border px-3 py-2 text-xs resize-none focus:outline-none focus:border-primary bg-background leading-relaxed"
              placeholder={nl ? "Stel een vraag..." : "Ask a question..."}
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim() || isSending}
              className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40"
              aria-label={nl ? "Sturen" : "Send"}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                <path d="M13.5 2.5L2 6.5l5 1.5 1.5 5 5-10.5z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const { tr, lang } = useLang()
  const [automations, setAutomations] = useState<SavedAutomation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    setAutomations(loadAutomations())
    trackEvent("dashboard_viewed")
  }, [])

  const selectedAuto = automations.find(a => a.id === selectedId) ?? null

  const handleMutate = (updated: SavedAutomation | null) => {
    if (updated === null) {
      setAutomations(prev => prev.filter(a => a.id !== selectedId))
      setSelectedId(null)
    } else {
      setAutomations(prev => prev.map(a => a.id === updated.id ? updated : a))
    }
  }

  const nl = lang === "nl"

  const statusConfig: Record<SavedAutomation["status"], { label: string; dot: string; badge: string }> = {
    running: { label: tr.dashboard.status.running, dot: "bg-green-400",  badge: "bg-green-100 text-green-700" },
    waiting: { label: nl ? "Wacht op trigger" : "Waiting",  dot: "bg-blue-400",  badge: "bg-blue-50 text-blue-600" },
    paused:  { label: tr.dashboard.status.paused,  dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700" },
    draft:   { label: tr.dashboard.status.draft,   dot: "bg-gray-300",  badge: "bg-gray-100 text-gray-500" },
  }

  const statusGroups: { key: SavedAutomation["status"]; label: string }[] = [
    { key: "running", label: tr.dashboard.groups.running },
    { key: "waiting", label: nl ? "Actief — wacht op trigger" : "Active — waiting for trigger" },
    { key: "paused",  label: tr.dashboard.groups.paused },
    { key: "draft",   label: tr.dashboard.groups.draft },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav wide />

      <main className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-8 py-8 gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{tr.dashboard.title}</h1>
          <button
            onClick={() => exportSession()}
            title={nl ? "Sessiedata exporteren" : "Export session data"}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:border-foreground/30 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 7l3 3 3-3M3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {nl ? "Exporteer sessie" : "Export session"}
          </button>
        </div>

        {automations.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-2xl">⟳</div>
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">
                {nl ? "Nog geen automations" : "No automations yet"}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {nl
                  ? "Bouw je eerste automation en hij verschijnt hier zodra je hem activeert."
                  : "Build your first automation and it will appear here once you activate it."}
              </p>
            </div>
            <Link
              href="/build"
              className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {tr.dashboard.buildFirst}
            </Link>
          </div>
        ) : (
          <>
            {statusGroups.map(group => {
              const items = automations.filter(a => a.status === group.key)
              if (items.length === 0) return null
              const cfg = statusConfig[group.key]
              return (
                <div key={group.key} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{group.label}</h2>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  {items.map(auto => (
                    <button
                      key={auto.id}
                      onClick={() => setSelectedId(auto.id === selectedId ? null : auto.id)}
                      className={`w-full bg-white rounded-xl border px-5 py-4 flex items-center gap-4 step-appear text-left transition-all ${
                        selectedId === auto.id
                          ? "border-primary ring-1 ring-primary/20 shadow-sm"
                          : "border-border hover:border-primary/40 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {auto.services.slice(0, 3).map(s => (
                          <ServiceIcon key={s} serviceId={s} size="sm" />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{auto.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {timeAgo(auto.createdAt, lang)} · {auto.runCount > 0 ? tr.dashboard.runs(auto.runCount) : tr.dashboard.neverRun}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 16 16">
                          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )
            })}
          </>
        )}
      </main>

      {/* Detail drawer */}
      {selectedAuto && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-30 backdrop-blur-[1px]"
            onClick={() => setSelectedId(null)}
          />
          <aside className="fixed right-0 top-0 h-full w-[440px] bg-white border-l border-border shadow-2xl z-40 overflow-hidden flex flex-col">
            <DetailPanel
              automation={selectedAuto}
              lang={lang}
              onClose={() => setSelectedId(null)}
              onMutate={handleMutate}
            />
          </aside>
        </>
      )}
    </div>
  )
}
