import test from 'node:test'
import assert from 'node:assert/strict'
import type { RideCompletedEvent } from '../../athlete-contracts/src/index.ts'
import { MemoryAthleteEventStore, MemoryMissionRideStore, MemoryProcessedEventStore } from './memory.ts'
import { syncMissionRides } from './missionSync.ts'

const event:RideCompletedEvent={
  schemaVersion:1,
  eventId:'event-1',
  eventType:'ride.completed',
  occurredAt:'2026-09-28T12:00:00Z',
  producer:'ride-the-races',
  athleteId:'hal',
  ride:{
    schemaVersion:1,
    rideId:'ride-1',
    athleteId:'hal',
    source:'RTR',
    startedAt:'2026-09-28T11:00:00Z',
    completedAt:'2026-09-28T12:00:00Z',
    durationSeconds:3600,
    distanceMeters:30000,
    averagePowerWatts:180
  }
}

test('Mission France ingests one RtR ride once',async()=>{
  const events=new MemoryAthleteEventStore(),processed=new MemoryProcessedEventStore(),rides=new MemoryMissionRideStore()
  await events.append(event)
  const first=await syncMissionRides('hal',events,processed,rides)
  assert.equal(first.results[0]?.status,'inserted')
  assert.equal(rides.rides.size,1)
  const second=await syncMissionRides('hal',events,processed,rides,'0')
  assert.equal(second.results[0]?.status,'duplicate-event')
  assert.equal(rides.rides.size,1)
})
