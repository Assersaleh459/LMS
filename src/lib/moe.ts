// Egyptian Ministry of Education (MoE) grading logic — hard-coded, non-generic

export const MOE_LETTER_GRADES = {
  excellent: { min: 90, label: 'ممتاز',      color: '#1e8449' },
  veryGood:  { min: 80, label: 'جيد جداً',   color: '#27ae60' },
  good:      { min: 65, label: 'جيد',        color: '#f39c12' },
  pass:      { min: 50, label: 'مقبول',      color: '#e67e22' },
  fail:      { min: 0,  label: 'ضعيف',       color: '#c0392b' },
} as const

export type MoEGrade = typeof MOE_LETTER_GRADES[keyof typeof MOE_LETTER_GRADES]

export function getMoELetterGrade(score: number, maxScore: number): MoEGrade {
  const pct = (score / maxScore) * 100
  if (pct >= 90) return MOE_LETTER_GRADES.excellent
  if (pct >= 80) return MOE_LETTER_GRADES.veryGood
  if (pct >= 65) return MOE_LETTER_GRADES.good
  if (pct >= 50) return MOE_LETTER_GRADES.pass
  return MOE_LETTER_GRADES.fail
}

// KG descriptive grades (no numbers — descriptive only per MoE regulation)
export const KG_GRADES = [
  { value: 'excellent', label: 'ممتاز',        emoji: '🌟' },
  { value: 'good',      label: 'جيد',          emoji: '😊' },
  { value: 'needs',     label: 'يحتاج تحسين',  emoji: '💪' },
] as const

// Thanawy weighting: 40% monthly average + 60% final exam (MoE mandated)
export function calcThanawyWeightedGrade(
  monthlyAvg: number,
  finalExam:  number,
  monthlyMax: number,
  finalMax:   number
): number {
  const monthlyWeighted = (monthlyAvg / monthlyMax) * 40
  const finalWeighted   = (finalExam  / finalMax)   * 60
  return Math.round((monthlyWeighted + finalWeighted) * 10) / 10
}

// Grade type max marks defaults (Primary stage)
export const PRIMARY_GRADE_MAX: Record<string, number> = {
  written:   60,
  oral:      20,   // شفهي
  practical: 10,
  activity:  10,
}

// Color class for grade percentage
export function gradeColorClass(score: number, maxScore: number): string {
  const pct = (score / maxScore) * 100
  if (pct >= 65) return 'text-green-700'
  if (pct >= 50) return 'text-yellow-600'
  return 'text-red-600'
}
