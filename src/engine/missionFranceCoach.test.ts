import test from 'node:test'
import assert from 'node:assert/strict'
import { coachingReceipt, validateCoachProposal, type CoachEvidence, type CoachProposal } from '../../packages/mission-coach/src/index.ts'

const target={assignmentId:'w2-d3',date:'2026-09-30',workoutId:'tempo-climb-45',title:'Controlled Climbing Tempo',durationMinutes:45,demand:3 as const,intensityFamily:'TEMPO' as const}
const baseEvidence:CoachEvidence[]=[
 {id:'ride',occurredAt:'2026-09-29T18:00:00-04:00',kind:'RIDE_COMPLETION',valence:'POSITIVE',summary:'Completed 60-minute endurance ride with controlled output.',source:'RtR/Peloton',confidence:'HIGH',tags:['completed','on-target']},
 {id:'legs',occurredAt:'2026-09-29T19:00:00-04:00',kind:'RIDER_FEEDBACK',valence:'POSITIVE',summary:'Rider reports legs feel very good after ride and strength.',source:'Rider',confidence:'MEDIUM',tags:['good-legs']},
 {id:'core',occurredAt:'2026-09-29T19:01:00-04:00',kind:'STRENGTH',valence:'NEUTRAL',summary:'Pallof press and dead bug skipped because garage access ended, not fatigue.',source:'Rider',confidence:'HIGH',tags:['logistics']}
]
const proposal=(overrides:Partial<CoachProposal>={}):CoachProposal=>({proposalId:'p1',generatedAt:'2026-09-29T22:00:00-04:00',target,action:{kind:'EXTEND',durationMinutes:75},scope:'NEXT_SESSION',rationale:'Extend climbing duration while holding intensity controlled.',evidenceIds:['ride','legs','core'],...overrides})

test('one strong day can approve a bounded next-session adaptation without rewriting the block',()=>{
 const decision=validateCoachProposal(proposal(),baseEvidence)
 assert.equal(decision.status,'APPROVED')
 assert.equal(decision.appliedScope,'NEXT_SESSION')
 assert.deepEqual(decision.action,{kind:'EXTEND',durationMinutes:75})
 assert.ok(decision.reasons.some(reason=>/Logistical omissions/.test(reason)))
 const receipt=coachingReceipt(proposal(),decision)
 assert.match(receipt.original,/45 min/)
 assert.match(receipt.change,/75 min/)
})

test('one good day cannot silently rewrite a training block',()=>{
 const decision=validateCoachProposal(proposal({scope:'TRAINING_BLOCK'}),baseEvidence)
 assert.equal(decision.status,'NEEDS_RIDER_CONFIRMATION')
 assert.equal(decision.appliedScope,'NEXT_SESSION')
})

test('red-flag evidence blocks workload progression but permits recovery changes',()=>{
 const evidence=[...baseEvidence,{id:'pain',occurredAt:'2026-09-29T21:00:00-04:00',kind:'RECOVERY' as const,valence:'RED_FLAG' as const,summary:'New significant pain.',source:'Rider',confidence:'HIGH' as const,tags:['pain']}]
 const blocked=validateCoachProposal(proposal({evidenceIds:['ride','legs','pain']}),evidence)
 assert.equal(blocked.status,'REJECTED')
 const rest=validateCoachProposal(proposal({action:{kind:'REST'},evidenceIds:['pain']}),evidence)
 assert.equal(rest.status,'APPROVED')
})

test('a local progression cannot increase duration by more than fifty percent',()=>{
 const decision=validateCoachProposal(proposal({action:{kind:'EXTEND',durationMinutes:90}}),baseEvidence)
 assert.equal(decision.status,'REJECTED')
})

test('repeated evidence can support a block-level progression',()=>{
 const repeated:CoachEvidence[]=[
  {id:'a',occurredAt:'2026-09-20T10:00:00Z',kind:'RIDE_COMPLETION',valence:'POSITIVE',summary:'Successful climb one.',source:'RtR',confidence:'HIGH',tags:['completed']},
  {id:'b',occurredAt:'2026-09-24T10:00:00Z',kind:'RIDE_COMPLETION',valence:'POSITIVE',summary:'Successful climb two.',source:'RtR',confidence:'HIGH',tags:['completed']},
  {id:'c',occurredAt:'2026-09-29T10:00:00Z',kind:'RIDE_COMPLETION',valence:'POSITIVE',summary:'Successful climb three.',source:'RtR',confidence:'HIGH',tags:['completed']}
 ]
 const decision=validateCoachProposal(proposal({scope:'TRAINING_BLOCK',evidenceIds:['a','b','c']}),repeated)
 assert.equal(decision.status,'APPROVED')
 assert.equal(decision.appliedScope,'TRAINING_BLOCK')
})
