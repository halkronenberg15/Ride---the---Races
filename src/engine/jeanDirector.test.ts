import test from 'node:test'
import assert from 'node:assert/strict'
import { dialogueLibrary, eligibleJeanLine, JeanMemory } from './jeanDirector.ts'
test('neutral start dialogue is impossible after kilometre zero or while paused', () => {
  assert.ok(dialogueLibrary.neutral.every((line) => !eligibleJeanLine(line, { mode: 'neutral', afterKmZero: true, running: true })))
  assert.ok(dialogueLibrary.neutral.every((line) => !eligibleJeanLine(line, { mode: 'neutral', afterKmZero: false, running: false })))
})
test('rolling memory suppresses exact and adjacent topic repetition', () => {
  const memory = new JeanMemory(18)
  const context = { mode: 'flat' as const, afterKmZero: true, running: true }
  const first = memory.select(context, 0)!
  const second = memory.select(context, 0)!
  assert.notEqual(first.text, second.text)
  assert.notEqual(first.topic, second.topic)
})
test('sprint phase eligibility selects phase coaching', () => {
  const memory = new JeanMemory()
  assert.equal(memory.select({ mode: 'sprint', afterKmZero: true, running: true, sprintPhase: 'SPRINT' }, 10)?.phase, 'SPRINT')
})
