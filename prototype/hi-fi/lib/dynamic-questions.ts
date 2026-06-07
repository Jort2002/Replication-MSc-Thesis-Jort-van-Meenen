import { Scenario } from "./scenarios"

export interface DynamicQuestion {
  id: string
  question: string
  options: string[]
  fieldKey: string
  inputType: "choice" | "freetext" | "time"
  placeholder?: string
  defaultValue?: string
}

export function getUnansweredFields(
  scenario: Scenario,
  prefilledAnswers: Record<string, string>,
  lang: string
): DynamicQuestion[] {
  const nl = lang === "nl"
  return scenario.clarifyingFields
    .filter(f => !prefilledAnswers[f.fieldKey])
    .map((f, i) => ({
      id: `q${i + 1}`,
      question: nl ? f.questionNl : f.questionEn,
      options: f.options ?? [],
      fieldKey: f.fieldKey,
      inputType: f.inputType,
      placeholder: nl ? (f.placeholderNl ?? "") : (f.placeholderEn ?? ""),
      defaultValue: f.defaultValue,
    }))
}
