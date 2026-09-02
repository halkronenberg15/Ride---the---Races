import type { RideSegment } from '../data/raceStages.ts'
import type { RaceStrategy } from '../types/tactics.ts'
import { adaptSegments } from './adaptiveRide.ts'
import { applyDurationSelection, type DurationSelection } from './durationEngine.ts'
import { createRoadModel } from './roadModel.ts'
import type { OfficialCourseMarker } from '../data/courseMarkers.ts'

export type SimulatorInput = { stageNumber: number; distanceKm: number; segments: RideSegment[]; ftp: number; strategy: RaceStrategy; duration: DurationSelection; profilePoints?: Array<string|{distanceKm:number;elevationM:number}>; markers?: OfficialCourseMarker[]; intervalSeconds?: number }
export type SimulatorFrame = { officialElapsed: number; officialRemaining: number; courseDistance: number; courseProgress: number; elevation: number; currentGradient: number; canonicalGradient:number; effectiveGradient:number; bikeProfile:string; calibrationConfidence:string; manualResistanceTarget:number; activeClimbId: string|null; climbProgress: number; distanceToSummit: number; power: string; powerRange:{min:number;max:number}; resistance: string; cadence: string; cadenceRange:{min:number;max:number}; courseComplete: boolean; officialWorkoutComplete: boolean; stageComplete: boolean }

/** Runs the pure canonical engines end-to-end without a physical device. */
export function simulateRide(input: SimulatorInput): SimulatorFrame[] {
  const strategySegments = adaptSegments(input.segments, input.ftp, input.strategy)
  const compressed = applyDurationSelection(strategySegments, input.duration).segments
  const road = createRoadModel(input.stageNumber, compressed, input.distanceKm, undefined, input.profilePoints, input.markers, undefined, input.ftp)
  const interval = Math.max(1, input.intervalSeconds ?? 30)
  const times = new Set(Array.from({ length: Math.ceil(road.duration / interval) + 1 }, (_, i) => Math.min(road.duration, i * interval)))
  road.segmentStarts.forEach(time => { times.add(time); if (time > 0) times.add(Math.max(0, time - .001)); if (time < road.duration) times.add(Math.min(road.duration, time + .001)) })
  times.add(road.duration)
  return [...times].sort((a,b)=>a-b).map(officialElapsed => {
    const state = road.roadSnapshot(officialElapsed)
    const live = state.livePrescription
    return { officialElapsed, officialRemaining: state.stageRemaining, courseDistance: state.courseDistance, courseProgress: state.courseProgress, elevation: state.elevation, currentGradient: state.gradient, canonicalGradient:live.manualRoadFeel.canonicalGradient,effectiveGradient:live.manualRoadFeel.effectiveGradient,bikeProfile:live.manualRoadFeel.bikeProfile,calibrationConfidence:live.manualRoadFeel.calibrationConfidence,manualResistanceTarget:live.manualResistanceTarget, activeClimbId: state.activeClimbId, climbProgress: state.climbProgress, distanceToSummit: state.distanceToSummit, power: live.power,powerRange:live.powerRange, resistance: live.resistance, cadence: live.cadence,cadenceRange:live.cadenceRange, courseComplete: state.courseComplete, officialWorkoutComplete: state.officialWorkoutComplete, stageComplete: state.stageComplete }
  })
}
