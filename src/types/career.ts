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
  }
  season: {
    year: number
    currentRace: string
    currentStage: number
    completedStages: number[]
  }
  health: HealthEntry
  rideHistory: RideMetricEntry[]
  settings: {
    jeanVoiceEnabled: boolean
    jeanVoiceVolume: number
    measurementSystem: MeasurementSystem
    theme: ThemePreference
    reducedMotion: boolean
    dailyReminders: boolean
  }
}
