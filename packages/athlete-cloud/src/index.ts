import type { AthleteId, AthleteProfile, RideCompletedEvent, SharedRideRecord } from '../../athlete-contracts/src/index.ts'

export type CloudSequence = number

export type CloudEventBatch = {
  events: Array<{sequence:CloudSequence;event:RideCompletedEvent}>
  nextSequence: CloudSequence
}

export interface SharedAthleteCloud {
  getProfile(athleteId:AthleteId):Promise<AthleteProfile|null>
  saveProfile(profile:AthleteProfile):Promise<void>

  upsertRide(ride:SharedRideRecord):Promise<void>
  getRide(athleteId:AthleteId,rideId:string):Promise<SharedRideRecord|null>
  listRides(athleteId:AthleteId):Promise<SharedRideRecord[]>

  appendRideCompleted(event:RideCompletedEvent):Promise<void>
  eventsAfter(athleteId:AthleteId,afterSequence:CloudSequence):Promise<CloudEventBatch>

  hasProcessedEvent(athleteId:AthleteId,consumer:string,eventId:string):Promise<boolean>
  markProcessedEvent(athleteId:AthleteId,consumer:string,eventId:string):Promise<void>

  getCursor(athleteId:AthleteId,deviceId:string,consumer:string):Promise<CloudSequence>
  saveCursor(athleteId:AthleteId,deviceId:string,consumer:string,sequence:CloudSequence):Promise<void>
}

export type AuthSession = {
  athleteId: AthleteId
  email?: string
  accessToken: string
}

export interface SharedAthleteAuth {
  currentSession():Promise<AuthSession|null>
  signInWithEmail(email:string,password:string):Promise<AuthSession>
  signUpWithEmail(email:string,password:string):Promise<AuthSession>
  signOut():Promise<void>
}
