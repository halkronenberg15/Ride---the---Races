import type { AthleteId, EventId, SharedRideRecord } from '../../athlete-contracts/src/index.ts'
import type { AthleteEventEnvelope, AthleteEventStore, MissionRideStore, ProcessedEventStore, SyncCursor } from './index.ts'

export class MemoryAthleteEventStore implements AthleteEventStore {
  private events:AthleteEventEnvelope[]=[]
  async append(event:AthleteEventEnvelope){
    if(this.events.some(item=>item.eventId===event.eventId))return
    this.events.push(event)
  }
  async listForAthlete(athleteId:AthleteId,after?:SyncCursor){
    const start=after?Number(after):0
    const filtered=this.events.filter(item=>item.athleteId===athleteId)
    const events=filtered.slice(start)
    return {events,cursor:String(filtered.length)}
  }
}

export class MemoryProcessedEventStore implements ProcessedEventStore {
  private ids=new Set<EventId>()
  async has(eventId:EventId){return this.ids.has(eventId)}
  async mark(eventId:EventId){this.ids.add(eventId)}
}

export class MemoryMissionRideStore implements MissionRideStore {
  readonly rides=new Map<string,SharedRideRecord>()
  async hasRide(rideId:string){return this.rides.has(rideId)}
  async upsertRide(ride:SharedRideRecord){this.rides.set(ride.rideId,ride)}
}
