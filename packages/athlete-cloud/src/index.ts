import type { AthleteId, AthleteProfile, RideCompletedEvent, SharedRideRecord } from '../../athlete-contracts/src/index.ts'

export type CloudSyncCursor=string

export type CloudSession={
  userId:string
  athleteId:AthleteId
  accessToken:string
  expiresAt?:string
}

export type AthleteEventPage={
  events:RideCompletedEvent[]
  cursor:CloudSyncCursor|null
}

export interface AthleteCloudRepository {
  getSession():Promise<CloudSession|null>
  signOut():Promise<void>
  getProfile():Promise<AthleteProfile|null>
  saveProfile(profile:AthleteProfile):Promise<void>
  appendRideEvent(event:RideCompletedEvent):Promise<void>
  listRideEvents(after?:CloudSyncCursor):Promise<AthleteEventPage>
  getRide(rideId:string):Promise<SharedRideRecord|null>
  listRides():Promise<SharedRideRecord[]>
}

export type PendingCloudWrite={
  id:string
  createdAt:string
  attempts:number
  kind:'ride.completed'
  payload:RideCompletedEvent
}

export interface PendingCloudWriteStore {
  list():Promise<PendingCloudWrite[]>
  put(write:PendingCloudWrite):Promise<void>
  remove(id:string):Promise<void>
}

export async function flushPendingWrites(repository:AthleteCloudRepository,queue:PendingCloudWriteStore){
  const pending=await queue.list()
  const results:Array<{id:string;status:'uploaded'|'failed';error?:string}>=[]
  for(const write of pending){
    try{
      await repository.appendRideEvent(write.payload)
      await queue.remove(write.id)
      results.push({id:write.id,status:'uploaded'})
    }catch(error){
      results.push({id:write.id,status:'failed',error:error instanceof Error?error.message:'Cloud upload failed'})
    }
  }
  return results
}
