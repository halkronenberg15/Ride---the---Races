import type { RideCompletedEvent, SharedRideRecord } from '../../athlete-contracts/src/index.ts'
import type { SharedAthleteCloud } from './index.ts'

export async function publishCompletedRide(
  cloud:SharedAthleteCloud,
  ride:SharedRideRecord,
  event:RideCompletedEvent,
){
  await cloud.upsertRide(ride)
  await cloud.appendRideCompleted(event)
}

export async function consumeMissionFranceRideEvents(
  cloud:SharedAthleteCloud,
  athleteId:string,
  deviceId:string,
){
  const consumer='mission-france'
  const cursor=await cloud.getCursor(athleteId,deviceId,consumer)
  const batch=await cloud.eventsAfter(athleteId,cursor)
  let applied=0
  let skipped=0

  for(const item of batch.events){
    if(await cloud.hasProcessedEvent(athleteId,consumer,item.event.eventId)){
      skipped+=1
      continue
    }
    await cloud.upsertRide(item.event.ride)
    await cloud.markProcessedEvent(athleteId,consumer,item.event.eventId)
    applied+=1
  }

  await cloud.saveCursor(athleteId,deviceId,consumer,batch.nextSequence)
  return {applied,skipped,nextSequence:batch.nextSequence}
}
