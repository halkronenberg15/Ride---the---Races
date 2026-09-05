export type RiderArchetype =
  | 'GC Contender'
  | 'Sprinter'
  | 'Climber'
  | 'Puncheur'
  | 'Time Trial Specialist'
  | 'All-Rounder'
  | 'Domestique'

export type ExperienceLevel = 'Beginner' | 'Recreational' | 'Intermediate' | 'Advanced' | 'Competitive'
export type SeasonGoal = 'Improve fitness' | 'Increase FTP' | 'Ride longer' | 'Lose weight' | 'Complete a Gran Fondo' | 'Race stronger' | 'Win the Tour'
export type MeasurementSystem = 'metric' | 'imperial'
export type ThemePreference = 'dark' | 'light' | 'system'
export type DeviceSource = 'Garmin' | 'Peloton' | 'WHOOP' | 'Strava' | 'Wahoo' | 'Zwift' | 'Apple Health' | 'Manual only'
export type ConnectionMethod = 'manual-guidance'|'post-ride-import'
export type PreferredRideDurationMode = 'RECOMMENDED'|'QUICK'|'STANDARD'|'EXTENDED'|'EPIC'

export type RideMetricEntry = {
  id: string
  date: string
  source: 'Manual' | 'FIT' | 'TCX' | 'GPX' | 'Garmin' | 'Peloton' | 'WHOOP' | 'Strava' | 'Wahoo' | 'Zwift' | 'Apple Health'
  durationMinutes: number
  distanceKm: number
  averagePower?: number
  averageHeartRate?: number
  averageCadence?: number
  elevationM?: number
  calories?: number
  notes?: string
  race?: string
  stageNumber?: number
  stageName?: string
  plannedDurationSeconds?: number
  actualEngineDurationSeconds?: number
  tactic?: string
  ftp?: number
  recovery?: HealthEntry
}

export type HealthEntry = {
  date: string
  sleepHours: number
  recoveryScore: number
  restingHeartRate?: number
  hrv?: number
  fatigue: number
  mood: 'Low' | 'Steady' | 'Good' | 'Excellent'
}

export type CareerState = {
  schemaVersion: 3
  onboardingComplete: boolean
  rider: {
    name: string
    number: number
    nationality: string
    team: string
    archetype: RiderArchetype
    ftp: number
    ftpKnown: boolean
    experience: ExperienceLevel
    heightCm?: number
    weightKg?: number
    seasonGoal: SeasonGoal
    devices: DeviceSource[]
    connectionMethod?:ConnectionMethod
    cadencePreferences?: { comfortableFlatCadence?:number;seatedClimbingCadence?:number;safeMinimumCadence?:number;safeMaximumCadence?:number }
  }
  equipment: {
    activeEquipmentId:string|null
    connectionMethod:ConnectionMethod
    instances:Array<{id:string;name:string;manufacturer:string;modelFamily:string;resistanceControl:'manual'|'controllable';powerAvailable:boolean;cadenceAvailable:boolean;resistanceAvailable:boolean;calibrationProfileId?:string;calibrationConfidence:'UNAVAILABLE'|'BASELINE'|'PERSONALIZED'|'CALIBRATED'}>
  }
  season: {
    year: number
    currentRace: string
    currentStage: number
    completedStages: number[]
  }
  races: {
    tour: { currentStage: number; completedStages: number[] }
    vuelta: { currentStage: number; completedStages: number[] }
  }
  trainingHistory: { workoutId:string; durationMinutes:number; completedAt:string; completed:true }[]
  health: HealthEntry
  rideHistory: RideMetricEntry[]
  settings: {
    jeanVoiceEnabled: boolean
    jeanVoiceVolume: number
    measurementSystem: MeasurementSystem
    theme: ThemePreference
    reducedMotion: boolean
    dailyReminders: boolean
    preferredRideDurationMode: PreferredRideDurationMode
  }
}
