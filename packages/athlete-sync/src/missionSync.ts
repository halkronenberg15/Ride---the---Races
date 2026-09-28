import type { AthleteId } from '../../athlete-contracts/src/index.ts'
import { ingestRideCompletedEvent, type AthleteEventStore, type MissionRideStore, type ProcessedEventStore, type SyncCursor } from './index.ts'

export async function syncMissionRides(
  athleteId:AthleteId,
  eventStore:AthleteEventStore,
  processed:ProcessedEventStore,
  rides:MissionRideStore,
  after?:SyncCursor,
){
  const batch=await eventStore.listForAthlete(athleteId,after)
  const results=[]
  for(const event of batch.events){
    results.push({eventId:event.eventId,...await ingestRideCompletedEvent(event,processed,rides)})
  }
  return {cursor:batch.cursor,results}
}
