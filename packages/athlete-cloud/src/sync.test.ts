import test from 'node:test'
import assert from 'node:assert/strict'
import type { AthleteProfile, RideCompletedEvent, SharedRideRecord } from '../../athlete-contracts/src/index.ts'
import type { CloudEventBatch, SharedAthleteCloud } from './index.ts'
import { consumeMissionFranceRideEvents, publishCompletedRide } from './sync.ts'

class MemoryCloud implements SharedAthleteCloud {
  profile:AthleteProfile|null=null
  rides=new Map<string,SharedRideRecord>()
  events:Array<{sequence:number;event:RideCompletedEvent}>=[]
  processed=new Set<string>()
  cursors=new Map<string,number>()

  async getProfile(){return this.profile}
  async saveProfile(profile:AthleteProfile){this.profile=profile}
  async upsertRide(ride:SharedRideRecord){this.rides.set(ride.rideId,ride)}
  async getRide(_athleteId:string,rideId:string){return this.rides.get(rideId)??null}
  async listRides(){return [...this.rides.values()]}
  async appendRideCompleted(event:RideCompletedEvent){
    if(this.events.some(item=>item.event.eventId===event.eventId))return
    this.events.push({sequence:this.events.length+1,event})
  }
  async eventsAfter(_athleteId:string,afterSequence:number):Promise<CloudEventBatch>{
    const events=this.events.filter(item=>item.sequence>afterSequence)
    return {events,nextSequence:this.events.at(-1)?.sequence??afterSequence}
  }
  async hasProcessedEvent(athleteId:string,consumer:string,eventId:string){return this.processed.has(athleteId+':'+consumer+':'+eventId)}
  async markProcessedEvent(athleteId:string,consumer:string,eventId:string){this.processed.add(athleteId+':'+consumer+':'+eventId)}
  async getCursor(athleteId:string,deviceId:string,consumer:string){return this.cursors.get(athleteId+':'+deviceId+':'+consumer)??0}
  async saveCursor(athleteId:string,deviceId:string,consumer:string,sequence:number){this.cursors.set(athleteId+':'+deviceId+':'+consumer,sequence)}
}

const ride:SharedRideRecord={
  schemaVersion:1,rideId:'ride-1',athleteId:'hal',source:'RTR',
  startedAt:'2026-09-28T12:00:00Z',completedAt:'2026-09-28T13:00:00Z',durationSeconds:3600
}
const event:RideCompletedEvent={
  schemaVersion:1,eventId:'event-1',eventType:'ride.completed',occurredAt:'2026-09-28T13:00:00Z',
  producer:'ride-the-races',athleteId:'hal',ride
}

test('RtR publish reaches Mission France once and advances cursor',async()=>{
  const cloud=new MemoryCloud()
  await publishCompletedRide(cloud,ride,event)
  const first=await consumeMissionFranceRideEvents(cloud,'hal','phone-1')
  assert.equal(first.applied,1)
  assert.equal(first.nextSequence,1)
  const second=await consumeMissionFranceRideEvents(cloud,'hal','phone-1')
  assert.equal(second.applied,0)
  assert.equal(cloud.rides.size,1)
})
