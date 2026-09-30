import test from 'node:test'
import assert from 'node:assert/strict'
import { CONNECTOR_REGISTRY, dedupeObservations, providersFor, type NormalizedObservation } from '../../packages/device-connectors/src/index.ts'

test('connector registry covers live sensors, recovery wearables and major cycling platforms',()=>{
 const providers=new Set(CONNECTOR_REGISTRY.map(item=>item.provider))
 for(const provider of ['POWER_METER','WHOOP','PELOTON','GARMIN','WAHOO','STRAVA','APPLE_HEALTH'])assert.ok(providers.has(provider as never))
 assert.ok(providersFor('POWER').some(item=>item.provider==='POWER_METER'&&item.realtime))
 assert.ok(providersFor('RECOVERY').some(item=>item.provider==='WHOOP'))
})

test('duplicate activity evidence prefers the more authoritative original source',()=>{
 const base:Omit<NormalizedObservation,'provider'|'observationId'|'provenance'>={athleteId:'hal',capability:'POWER',occurredAt:'2026-09-29T18:00:00Z',receivedAt:'2026-09-29T19:00:00Z',value:167,unit:'W',sourceRecordId:'ride-1',confidence:'HIGH'}
 const result=dedupeObservations([
  {...base,observationId:'strava',provider:'STRAVA',provenance:'Imported activity'},
  {...base,observationId:'rtr',provider:'RTR',provenance:'Completed RtR ride'}
 ])
 assert.equal(result.length,1)
 assert.equal(result[0].provider,'RTR')
})

test('different timestamps remain separate evidence even when values match',()=>{
 const a:NormalizedObservation={observationId:'a',athleteId:'hal',provider:'WHOOP',capability:'HEART_RATE',occurredAt:'2026-09-29T18:00:00Z',receivedAt:'2026-09-29T19:00:00Z',value:135,unit:'bpm',confidence:'HIGH',provenance:'Workout average'}
 const b={...a,observationId:'b',occurredAt:'2026-09-30T18:00:00Z'}
 assert.equal(dedupeObservations([a,b]).length,2)
})
