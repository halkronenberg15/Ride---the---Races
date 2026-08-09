import type { HealthEntry, RideMetricEntry } from '../types/career'
import type { RaceStrategy } from '../types/tactics'

export function engineRideRecord(input: { race: string; stageNumber: number; stageName: string; distanceKm: number; plannedSeconds: number; actualSeconds: number; tactic: RaceStrategy; ftp: number; recovery: HealthEntry }, id: string = crypto.randomUUID(), date: string = new Date().toISOString()): RideMetricEntry {
  return { id, date, source: 'Manual', durationMinutes: Math.round(input.actualSeconds / 60), distanceKm: input.distanceKm, race: input.race, stageNumber: input.stageNumber, stageName: input.stageName, plannedDurationSeconds: input.plannedSeconds, actualEngineDurationSeconds: Math.round(input.actualSeconds), tactic: input.tactic, ftp: input.ftp, recovery: input.recovery }
}
