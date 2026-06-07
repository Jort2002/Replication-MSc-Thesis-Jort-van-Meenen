"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef, Suspense } from "react"
import { Nav } from "@/components/nav"
import { useLang } from "@/components/lang-provider"
import { trackEvent } from "@/lib/analytics"
import type { DynamicQuestion } from "@/lib/dynamic-questions"

function ClarifyContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { tr, lang } = useLang()

  const scenarioId = params.get("scenarioId") ?? "s1_contact_form"
  const prompt = params.get("prompt") ?? ""
  const prefilled: Record<string, string> = JSON.parse(params.get("prefilled") ?? "{}")
  const criticalQuestionsRaw: { fieldKey: string; question: string; placeholder?: string }[] =
    JSON.parse(params.get("critical") ?? "[]")

  const [questions, setQuestions] = useState<DynamicQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(prefilled)
  const [textValue, setTextValue] = useState("")
  const [timeValue, setTimeValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/clarify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId, prefilledAnswers: prefilled, lang }),
    })
      .then(r => r.json())
      .then(data => {
        const staticQs: DynamicQuestion[] = data.questions ?? []
        // Merge in LLM-generated critical questions (rendered as freetext, after static ones)
        const criticalQs: DynamicQuestion[] = criticalQuestionsRaw.map((q, i) => ({
          id: `c${i + 1}`,
          question: q.question,
          options: [],
          fieldKey: q.fieldKey,
          inputType: "freetext" as const,
          placeholder: q.placeholder ?? "",
        }))
        const qs = [...staticQs, ...criticalQs]
        if (qs.length === 0) {
          goToPreview(prefilled)
          return
        }
        setQuestions(qs)
        initInputForQuestion(qs[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus text/time inputs when question changes
  useEffect(() => {
    if (!loading) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [questionIndex, loading])

  function initInputForQuestion(q: DynamicQuestion) {
    if (q.inputType === "time") {
      setTimeValue(q.defaultValue ?? "08:00")
    } else {
      setTextValue("")
    }
  }

  const goToPreview = (finalAnswers: Record<string, string>) => {
    const p = new URLSearchParams({ scenarioId, prompt, answers: JSON.stringify(finalAnswers) })
    router.push(`/build/preview?${p}`)
  }

  const handleAnswer = (answer: string) => {
    const current = questions[questionIndex]
    if (!current) return
    const updated = { ...answers, [current.fieldKey]: answer }
    setAnswers(updated)
    trackEvent("clarification_answered", { scenarioId, questionId: current.id, answer: answer.slice(0, 40) })

    const next = questionIndex + 1
    if (next < questions.length) {
      setQuestionIndex(next)
      initInputForQuestion(questions[next])
    } else {
      goToPreview(updated)
    }
  }

  const handleTextSubmit = () => {
    const val = textValue.trim()
    if (!val) return
    handleAnswer(val)
  }

  const handleTimeSubmit = () => {
    handleAnswer(timeValue || "08:00")
  }

  const handleSkip = () => {
    const current = questions[questionIndex]
    if (!current) return
    const next = questionIndex + 1
    if (next < questions.length) {
      setQuestionIndex(next)
      initInputForQuestion(questions[next])
    } else {
      goToPreview(answers)
    }
  }

  const currentQuestion = questions[questionIndex]
  const total = questions.length
  const progress = questionIndex + 1

  // Build list of already-answered questions to show as confirmation tags
  const answeredSoFar = questions
    .slice(0, questionIndex)
    .filter(q => answers[q.fieldKey])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav step={2} totalSteps={5} showBack backHref="/build" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">
              {lang === "nl" ? "Vragen voorbereiden..." : "Preparing questions..."}
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav step={2} totalSteps={5} showBack backHref="/build" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl flex flex-col gap-8">

          {/* AI question bubble */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5 shadow-sm">
              AI
            </div>
            <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-5 py-5 flex flex-col gap-2 shadow-sm flex-1">
              <p className="text-sm text-muted-foreground">
                {tr.clarify.intro(total)}
              </p>
              <p className="text-xl font-semibold text-foreground leading-snug">{currentQuestion.question}</p>
            </div>
          </div>

          {/* Progress bar + answered tags */}
          {total > 1 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-border">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(progress / total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {tr.clarify.questionOf(progress, total)}
                </span>
              </div>
              {answeredSoFar.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {answeredSoFar.map(q => (
                    <span key={q.fieldKey} className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 rounded-lg px-2.5 py-1">
                      <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {answers[q.fieldKey]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Choice input */}
          {currentQuestion.inputType === "choice" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map(option => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="step-appear flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-border bg-white hover:border-primary hover:bg-primary/5 text-left transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors font-semibold text-sm text-muted-foreground group-hover:text-primary">
                    {option.charAt(0)}
                  </div>
                  <span className="text-base font-medium text-foreground">{option}</span>
                </button>
              ))}
            </div>
          )}

          {/* Freetext input */}
          {currentQuestion.inputType === "freetext" && (
            <div className="step-appear flex flex-col gap-3">
              <input
                ref={inputRef}
                type="text"
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleTextSubmit() }}
                placeholder={currentQuestion.placeholder ?? ""}
                className="w-full rounded-xl border-2 border-border bg-white px-4 py-3.5 text-base focus:outline-none focus:border-primary transition-colors"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleTextSubmit}
                  disabled={!textValue.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-5 py-3 font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {tr.clarify.continue}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={handleSkip}
                  className="px-4 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  {tr.clarify.skip}
                </button>
              </div>
            </div>
          )}

          {/* Time input */}
          {currentQuestion.inputType === "time" && (
            <div className="step-appear flex flex-col gap-3">
              <input
                ref={inputRef}
                type="time"
                value={timeValue}
                onChange={e => setTimeValue(e.target.value)}
                className="w-full rounded-xl border-2 border-border bg-white px-4 py-3.5 text-base focus:outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={handleTimeSubmit}
                className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-5 py-3 font-semibold hover:bg-primary/90 transition-colors"
              >
                {tr.clarify.continue}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default function ClarifyPage() {
  return (
    <Suspense>
      <ClarifyContent />
    </Suspense>
  )
}
