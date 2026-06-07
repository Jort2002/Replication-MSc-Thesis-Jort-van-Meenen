import { NextRequest, NextResponse } from "next/server"
import { getScenario } from "@/lib/scenarios"
import { getUnansweredFields } from "@/lib/dynamic-questions"

export async function POST(req: NextRequest) {
  const { scenarioId, prefilledAnswers, lang } = await req.json()

  const scenario = getScenario(scenarioId)
  if (!scenario) return NextResponse.json({ error: "not found" }, { status: 404 })

  const questions = getUnansweredFields(scenario, prefilledAnswers ?? {}, lang ?? "nl")
  return NextResponse.json({ questions })
}
