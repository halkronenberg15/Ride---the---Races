import { toRaceStage, vuelta2026 } from '../src/data/professionalRaces.ts'
import { applyDurationSelection, durationSelectionForStage } from '../src/engine/durationEngine.ts'
import { createRoadModel } from '../src/engine/roadModel.ts'
import { segmentPurposes } from '../src/engine/raceLifecycle.ts'
const stage=toRaceStage(vuelta2026,vuelta2026.stages[5])
const simulations=[70,80,95,105,120,140].map(minutes=>{const timed=applyDurationSelection(stage.segments,durationSelectionForStage(stage,{mode:'CUSTOM',customMinutes:minutes}));const purposes=segmentPurposes(timed.segments),km0=purposes.indexOf('kilometre-zero'),road=createRoadModel(6,timed.segments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,208);return {minutes,officialSeconds:road.duration,km0Seconds:timed.segments[km0].sec,start:[road.roadSnapshot(0).lifecycle,road.roadSnapshot(road.segmentStarts[km0]+.1).lifecycle,road.roadSnapshot(road.segmentStarts[km0+1]+.1).lifecycle],finish:road.roadSnapshot(road.duration).lifecycle,geography:[.25,.5,.75].map(position=>road.roadSnapshot(road.elapsedAtCourseDistance(stage.distanceKm*position)).gradient)}})
if(simulations.some(item=>item.officialSeconds!==item.minutes*60||item.km0Seconds!==45||item.finish!=='FINISHED'))throw new Error('Alpha 4.0.19 lifecycle audit failed')
console.log(JSON.stringify({release:'4.0.19',stage:'Vuelta Stage 6',simulations},null,2))
