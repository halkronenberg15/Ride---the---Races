import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialCareer } from '../state/careerPersistence.ts'
import { careerRevision } from './careerRevision.ts'
import { reconcileCareerVersions } from './careerReconciliation.ts'

const cloud=(career:ReturnType<typeof createInitialCareer>,revision:string|null,savedAt:string)=>({athleteId:'a',updatedAt:savedAt,clientRevision:revision,clientSavedAt:savedAt,career})

test('reconciliation recognizes matching revisions',()=>{
 const career=createInitialCareer()
 const revision=careerRevision(career)
 const result=reconcileCareerVersions(career,{savedAt:'2026-10-19T19:00:00Z',revision},cloud(career,revision,'2026-10-19T19:00:03Z'))
 assert.equal(result.state,'MATCHED')
})

test('reconciliation identifies a newer cloud copy',()=>{
 const local=createInitialCareer()
 const remote=createInitialCareer();remote.rider.name='Cloud change'
 const result=reconcileCareerVersions(local,{savedAt:'2026-10-19T19:00:00Z',revision:careerRevision(local)},cloud(remote,careerRevision(remote),'2026-10-19T19:05:00Z'))
 assert.equal(result.state,'CLOUD_NEWER')
})

test('reconciliation identifies a newer local copy',()=>{
 const local=createInitialCareer();local.rider.name='Local change'
 const remote=createInitialCareer()
 const result=reconcileCareerVersions(local,{savedAt:'2026-10-19T19:10:00Z',revision:careerRevision(local)},cloud(remote,careerRevision(remote),'2026-10-19T19:00:00Z'))
 assert.equal(result.state,'LOCAL_NEWER')
})
