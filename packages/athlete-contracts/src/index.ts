export type AthleteId = string
export type RideId = string
export type EventId = string

export type RideSource =
  | 'RTR'
  | 'GARMIN'
  | 'PELOTON'
  | 'STRAVA'
  | 'WAHOO'
  | 'ZWIFT'
  | 'APPLE_HEALTH'
  | 'MANUAL'

export type SharedRideRecord = {
  schemaVersion: 1
  rideId: RideId
  athleteId: AthleteId
  source: RideSource
  startedAt: string
  completedAt: string
  durationSeconds: number
  distanceMeters?: number
  elevationMeters?: number
  averagePowerWatts?: number
  normalizedPowerWatts?: number
  averageHeartRateBpm?: number
  averageCadenceRpm?: number
  energyKj?: number
  calories?: number
  ftpWatts?: number
  workoutId?: string
  assignmentId?: string
  raceId?: string
  stageNumber?: number
  notes?: string
}

export type RideCompletedEvent = {
  schemaVersion: 1
  eventId: EventId
  eventType: 'ride.completed'
  occurredAt: string
  producer: 'ride-the-races'
  athleteId: AthleteId
  ride: SharedRideRecord
}

export type RideCorrectedEvent = {
  schemaVersion: 1
  eventId: EventId
  eventType: 'ride.corrected'
  occurredAt: string
  producer: 'ride-the-races'
  athleteId: AthleteId
  rideId: RideId
  patch: Partial<Omit<SharedRideRecord,'schemaVersion'|'rideId'|'athleteId'|'source'>>
}

export type AthleteProfile = {
  schemaVersion: 1
  athleteId: AthleteId
  displayName: string
  ftpWatts?: number
  weightKg?: number
  preferredUnits: 'imperial' | 'metric'
  updatedAt: string
}
