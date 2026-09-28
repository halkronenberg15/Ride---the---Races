import test from 'node:test'
import assert from 'node:assert/strict'
import type { AthleteCloudRepository, CloudSession } from './index.ts'
import { flushPendingWrites } from './index.ts'
import { MemoryPendingCloudWriteStore } from './memoryQueue.ts'
import type { AthleteProfile, RideCompletedEvent, SharedRideRecord } from '../../athlete-contracts/src/index.ts'

const event:RideCompletedEvent={
 schemaVersion:1,eventId:'e1',eventType:'ride.completed',occurredAt:'2026-09-28T15:00:00Z',producer:'ride-the-races',athleteId:'a1',
 ride:{schemaVersion:1,rideId:'r1',athleteId:'a1',source:'RTR',startedAt:'2026-09-28T14:00:00Z',completedAt:'2026-09-28T15:00:00Z',durationSeconds:3600}
}

test('queued RtR ride uploads then leaves the queue',async()=>{
 const queue=new MemoryPendingCloudWriteStore()
 await queue.put({id:'e1',createdAt:event.occurredAt,attempts:0,kind:'ride.completed',payload:event})
 const uploaded:RideCompletedEvent[]=[]
 const repository:AthleteCloudRepository={
  async getSession():Promise<CloudSession|null>{return {userId:'u1',athleteId:'a1',accessToken:'token'}},
  async signOut(){},
  async getProfile():Promise<AthleteProfile|null>{return null},
  async saveProfile(){},
  async appendRideEvent(value){uploaded.push(value)},
  async listRideEvents(){return {events:[],cursor:null}},
  async getRide():Promise<SharedRideRecord|null>{return null},
  async listRides(){return []},
 }
 const results=await flushPendingWrites(repository,queue)
 assert.equal(results[0]?.status,'uploaded')
 assert.equal(uploaded.length,1)
 assert.equal((await queue.list()).length,0)
})
