import { writeFileSync } from 'node:fs'
import { toRaceStage, vuelta2026 } from '../src/data/professionalRaces.ts'
import { adaptSegments } from '../src/engine/adaptiveRide.ts'
import { applyDurationSelection, durationSelectionForStage } from '../src/engine/durationEngine.ts'
import { createJeanEvent, isJeanEventContextValid } from '../src/engine/jeanEvents.ts'
import { createRoadModel } from '../src/engine/roadModel.ts'

const ftp = 208
const stage = toRaceStage(vuelta2026, vuelta2026.stages[3])
const adapted = adaptSegments(stage.segments, ftp, 'Balanced')
const duration = applyDurationSelection(adapted, durationSelectionForStage(stage,{ mode: 'RECOMMENDED' }))
const road = createRoadModel(stage.number, duration.segments, stage.distanceKm, undefined, stage.profilePoints, stage.officialCourseMarkers, stage.raceId, ftp)
const climbs = [{ start: 0, summit: 14 }, { start: 34, summit: 51 }, { start: 70, summit: 88 }]
const fractions = [{ name:'entry', value:0 },{ name:'25%', value:.25 },{ name:'50%', value:.5 },{ name:'75%', value:.75 },{ name:'pre-summit', value:1-1e-6 },{ name:'summit', value:1 },{ name:'post-summit', value:1+1e-6 }]
const checkpoints = climbs.flatMap((climb, climbIndex) => fractions.map(checkpoint => {
  const distance = checkpoint.name === 'post-summit' ? climb.summit + .001 : climb.start + (climb.summit-climb.start)*Math.min(1,checkpoint.value)
  const state = road.roadSnapshot(road.elapsedAtCourseDistance(distance))
  const candidate = checkpoint.name === 'pre-summit' || checkpoint.name === 'summit' || checkpoint.name === 'post-summit'
    ? createJeanEvent(`climb-${climbIndex+1}-summit`,'coaching','Push over the summit') : null
  const jeanEvent = candidate && isJeanEventContextValid(candidate,{courseDistance:state.courseDistance,activeClimbId:state.activeClimbId,summitDistance:state.summitDistance,climbProgress:state.climbProgress}) ? candidate.id : null
  return { climb:climbIndex+1, checkpoint:checkpoint.name, officialElapsed:state.elapsed, courseDistance:state.courseDistance, courseProgress:state.courseProgress, elevation:state.elevation, currentGradient:state.gradient, nextGradient:state.nextGradient, activeClimbId:state.activeClimbId, climbProgress:state.climbProgress, distanceToSummit:state.distanceToSummit, power:state.livePrescription.power, resistance:state.livePrescription.resistance, cadence:state.livePrescription.cadence, ftpPercentCeiling:state.livePrescription.ftpPercent.max, jeanEvent }
}))
const audit = { race:'La Vuelta 2026', stage:4, ftp, strategy:'Balanced', durationMode:'RECOMMENDED', officialIndoorSimulationDuration:road.duration, runtimeResolver:'createRoadModel(..., riderFtp).roadSnapshot(elapsed).livePrescription', checkpoints }
writeFileSync(new URL('../docs/alpha-4.0.18-stage4-live-audit.json',import.meta.url),`${JSON.stringify(audit,null,2)}\n`)
console.log(JSON.stringify(audit,null,2))
