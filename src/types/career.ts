import type { IntroEffortBaseline, OriginalTargetSnapshot, SeasonClosure } from '../engine/release4024.ts'
import type { Alpha4025State } from '../engine/alpha4025.ts'
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
export type IntroCyclingAnswers={cyclingExperience:'New'|'Returning'|'Experienced';indoorExperience:'None'|'Some'|'Regular';outdoorExperience:'None'|'Some'|'Regular';ftpKnown:boolean;weeklyDays:number;comfortableMinutes:number;primaryGoal:'Build confidence'|'Outdoor ride preparation'|'Fitness'|'Return to cycling';cadenceResistanceConfidence:'Low'|'Growing'|'Confident';shiftingBrakingConfidence:'Low'|'Growing'|'Confident';bikeAccess:'Indoor'|'Outdoor'|'Both';outdoorConfidence:'Low'|'Growing'|'Confident';limitations:string;preferredNextProgram:'Undecided'|'Outdoor Ride Readiness'|'RtR Femmes'|'Standard RtR'}
export type IntroCyclingPlan={startingDurationMinutes:number;powerCeilingPercent:number;recoveryEveryRides:number;instructionDensity:'high'|'standard';cadenceComplexity:'FOUNDATION'|'PROGRESSIVE';climbingIntroducedAfterRide:number;readinessAssessmentAfterRide:number;weeklyDays:number;comfortableMinutes:number;deliveryMode:'INDOOR'|'OUTDOOR_GUIDED'|'HYBRID';outdoorChecklistStartsAfterRide:number;rides:Array<{id:string;title:string;durationMinutes:number;focus:string;scheduledDay:number;recoveryAfter:boolean}>}
export type FtpProvenance='MEASURED'|'RIDER_ENTERED'|'ESTIMATED'|'INTRO_EFFORT_BASELINE'|'UNKNOWN'

export type RideMetricEntry = {
  id: string
  date: string
  source: 'Manual' | 'FIT' | 'TCX' | 'GPX' | 'Garmin' | 'Peloton' | 'WHOOP' | 'Strava' | 'Wahoo' | 'Zwift' | 'Apple Health'
  durationMinutes: number
  distanceKm: number
  averagePower?: number
  peakPower?:number
  totalOutputKj?:number
  averageHeartRate?: number
  averageCadence?: number
  averageResistance?:number
  maximumHeartRate?:number
  striveScore?:number
  rpe?:number
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
  ftpProvenance?:FtpProvenance
  equipmentId?:string
  activityType?:'RACE_STAGE'|'TRAINING'|'INTRO'|'CALIBRATION'|'FTP_ASSESSMENT'|'STAGE_REPLAY'
  originalRideId?:string
  selectedDurationVersion?:string
  updatedAt?:string
  originalUserEntry?:Partial<RideMetricEntry>
  correctedEntry?:Partial<EditableRideResult>
  targetSnapshots?:OriginalTargetSnapshot[]
  recovery?: HealthEntry
  terminatedEarly?: boolean
  terminationReason?: string
  completionPercentage?: number
  lifecycleAtTermination?: string
  sectorAtTermination?: string
  completedSectors?: string[]
  earnedMarkerIds?: string[]
  tacticalState?: string
  officialRaceDurationSeconds?:number
  cooldownDurationSeconds?:number
  cooldownSkipped?:boolean
}
export type EditableRideResult=Pick<RideMetricEntry,'durationMinutes'|'actualEngineDurationSeconds'|'totalOutputKj'|'averagePower'|'peakPower'|'averageCadence'|'averageResistance'|'averageHeartRate'|'maximumHeartRate'|'distanceKm'|'calories'|'striveScore'|'rpe'|'notes'|'equipmentId'>

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
  schemaVersion: 6
  onboardingComplete: boolean
  rider: {
    name: string
    number: number
    nationality: string
    team: string
    archetype: RiderArchetype
    ftp: number | null
    ftpKnown: boolean
    ftpProvenance:FtpProvenance
    introEffortBaseline?:IntroEffortBaseline
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
    instances:Array<{id:string;name:string;manufacturer:string;modelFamily:string;resistanceControl:'manual'|'controllable';powerAvailable:boolean;cadenceAvailable:boolean;resistanceAvailable:boolean;calibrationProfileId?:string;calibrationConfidence:'UNAVAILABLE'|'BASELINE'|'PERSONALIZED'|'CALIBRATED';calibrationSamples?:Array<{resistance:number;cadence:number;power:number;sourceType:'historical-average'|'manual-calibration'|'live-telemetry'|'imported-ride';confidence:'LOW'|'MEDIUM'|'HIGH';durationSeconds?:number;timestamp?:string;aggregate:boolean;equipmentId?:string;observedAt?:string}>}>
  }
  season: {
    active:boolean
    year: number
    currentRace: string
    currentStage: number
    completedStages: number[]
    closure:SeasonClosure
  }
  pastSeasons:Array<{year:number;race:string;closure:SeasonClosure;stages:Array<{stageNumber:number;rideId?:string;completed:boolean;result?:string}>}>
  favoriteStageRefs:Array<{library:string;stageNumber:number}>
  races: {
    tour: { currentStage: number; completedStages: number[] }
    vuelta: { currentStage: number; completedStages: number[] }
  }
  trainingHistory: { workoutId:string; durationMinutes:number; completedAt:string; completed:true }[]
  health: HealthEntry
  rideHistory: RideMetricEntry[]
  alpha4020: { calendar:{month:number;scrollY:number}; earnedMarkerIds:string[] }
  alpha4022: { worldsResults:Record<string,{completed:boolean;place?:number}>; ittSplits:Record<string,number>; raceEvents:Record<string,'accepted'|'declined'|'consumed'>; radioHistory:string[]; rainbowTitles:string[]; profileView:{mode:'OVERVIEW'|'DETAIL';activeRangeId:string|null;autoConsumedIds:string[]} }
  introCycling:{selected:boolean;answers:IntroCyclingAnswers|null;plan:IntroCyclingPlan|null;completedRideIds:string[];dismissed:boolean;outdoorChecklistIds:string[];requestedNextProgram:'Outdoor Ride Readiness'|'RtR Femmes'|'Standard RtR'|null}
  alpha4025:Alpha4025State
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
