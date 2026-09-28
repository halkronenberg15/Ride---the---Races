import type { AthleteId, EventId, RideCompletedEvent, SharedRideRecord } from '../../athlete-contracts/src/index.ts'

export type SyncCursor = string

export type AthleteEventEnvelope = RideCompletedEvent

export interface AthleteEventStore {
  append(event: AthleteEventEnvelope): Promise<void>
  listForAthlete(athleteId: AthleteId, after?: SyncCursor): Promise<{events:AthleteEventEnvelope[];cursor:SyncCursor|null}>
}

export interface ProcessedEventStore {
  has(eventId: EventId): Promise<boolean>
  mark(eventId: EventId): Promise<void>
}

export interface MissionRideStore {
  hasRide(rideId:string): Promise<boolean>
  upsertRide(ride:SharedRideRecord): Promise<void>
}

export async function ingestRideCompletedEvent(
  event:RideCompletedEvent,
  processed:ProcessedEventStore,
  rides:MissionRideStore,
){
  if(await processed.has(event.eventId))return {status:'duplicate-event' as const}
  if(await rides.hasRide(event.ride.rideId)){
    await processed.mark(event.eventId)
    return {status:'duplicate-ride' as const}
  }
  await rides.upsertRide(event.ride)
  await processed.mark(event.eventId)
  return {status:'inserted' as const}
}
