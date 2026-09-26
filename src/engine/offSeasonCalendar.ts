import type { TrainingPlan } from './alpha4025.ts'

/** Derive displayed calendar months from persisted assignment dates, including year boundaries. */
export function planMonths(plan: TrainingPlan) {
  return Array.from(new Set(plan.weeks.flatMap(week => week.assignments.map(item => item.date.slice(0, 7))))).sort().map(value => ({ year: Number(value.slice(0, 4)), month: Number(value.slice(5, 7)) - 1, key: value }))
}
