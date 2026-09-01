import assert from 'node:assert/strict'
import test from 'node:test'
import { tour2026, toRaceStage, vuelta2026 } from '../data/professionalRaces.ts'
import { applyDurationSelection, durationSelectionForStage, DURATION_MODES, stageDurationPlan } from './durationEngine.ts'
import { createStageTimeline } from './stageEngine.ts'
import { applyTerrainModifier } from './terrainModifier.ts'
import { resolvePrescriptionAtState } from './prescription.ts'
import { createJeanEvent, isJeanEventContextValid, JeanEventBus } from './jeanEvents.ts'
import { completeTacticalEvent, decideTacticalEvent, initialTacticalState, triggerTacticalEvent, type TacticalEvent } from './tacticalEngine.ts'
import { simulateRide } from './rideSimulator.ts'
import { adaptSegments } from './adaptiveRide.ts'
import { createRoadModel } from './roadModel.ts'
import { readFileSync } from 'node:fs'

const vuelta4 = toRaceStage(vuelta2026, vuelta2026.stages[3])

test('duration modes change time but preserve canonical stage geography and order', () => {
  const durations = new Set<number>()
  for (const mode of DURATION_MODES) {
    const choice = mode === 'CUSTOM' ? { mode, customMinutes: 73 } : mode === 'RECOMMENDED' ? { mode, recommendedMinutes: 90 } : { mode }
    const result = applyDurationSelection(vuelta4.segments, choice)
    durations.add(result.map.officialDurationSeconds)
    assert.deepEqual(result.segments.map(s=>s.routeKm), vuelta4.segments.map(s=>s.routeKm))
    assert.deepEqual(result.segments.map(s=>s.name), vuelta4.segments.map(s=>s.name))
    const finish = createStageTimeline(result.segments, vuelta4.distanceKm).snapshot(result.map.officialDurationSeconds)
    assert.equal(finish.courseDistance, vuelta4.distanceKm); assert.equal(finish.courseProgress, 1); assert.equal(finish.stageComplete, true)
  }
  assert.ok(durations.size >= 5)
})

test('six signature stages expose classified, bounded duration plans without changing the race',()=>{
  const stages=[toRaceStage(vuelta2026,vuelta2026.stages[0]),vuelta4,toRaceStage(vuelta2026,vuelta2026.stages[4]),toRaceStage(tour2026,tour2026.stages[8]),toRaceStage(tour2026,tour2026.stages[19]),toRaceStage(tour2026,tour2026.stages[20])]
  for(const stage of stages){
    const baseline=createRoadModel(stage.number,stage.segments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,208)
    const plan=stageDurationPlan(stage); assert.ok(plan.customMinMinutes<plan.customMaxMinutes)
    for(const mode of DURATION_MODES){
      const requested=durationSelectionForStage(stage,mode==='CUSTOM'?{mode,customMinutes:plan.customMaxMinutes+999}:{mode})
      if(mode==='CUSTOM')assert.equal(requested.customMinutes,plan.customMaxMinutes)
      const timed=applyDurationSelection(stage.segments,requested); const model=createRoadModel(stage.number,timed.segments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId,208)
      assert.equal(model.duration,(mode==='CUSTOM'?plan.customMaxMinutes:plan.minutes[mode])*60)
      assert.deepEqual(timed.segments.map(segment=>[segment.name,segment.routeKm]),stage.segments.map(segment=>[segment.name,segment.routeKm]))
      assert.deepEqual(model.profilePoints,baseline.profilePoints); assert.deepEqual(model.markers.map(marker=>[marker.type,marker.position]),baseline.markers.map(marker=>[marker.type,marker.position]))
      const finish=model.roadSnapshot(model.duration);assert.equal(finish.courseDistance,stage.distanceKm);assert.equal(finish.courseProgress,1);assert.equal(finish.courseComplete,true);assert.equal(finish.officialWorkoutComplete,true);assert.equal(finish.stageComplete,true)
      for(const fraction of [.2,.5,.8]){const state=model.roadSnapshot(model.duration*fraction);assert.equal(state.gradient,state.livePrescription.authoritativeGradient)}
    }
  }
})

test('all 42 stages reconcile every duration mode at the exact same geographic finish',()=>{
  for(const race of [tour2026,vuelta2026])for(const raw of race.stages){const stage=toRaceStage(race,raw);const plan=stageDurationPlan(stage)
    for(const mode of DURATION_MODES){const selection=durationSelectionForStage(stage,mode==='CUSTOM'?{mode,customMinutes:plan.customMinMinutes-500}:{mode});const segments=applyDurationSelection(stage.segments,selection).segments;const timeline=createStageTimeline(segments,stage.distanceKm);const finish=timeline.snapshot(timeline.duration)
      assert.equal(finish.courseDistance,stage.distanceKm,`${race.name} ${stage.number} ${mode}`);assert.equal(finish.riderPosition,1);assert.equal(finish.courseComplete,true);assert.equal(finish.officialWorkoutComplete,true);assert.equal(finish.stageComplete,true)
    }
  }
})

test('professional briefing, ActiveRide, simulator and RideScreen share duration selection contracts',()=>{
  const tactics=readFileSync(new URL('../screens/TacticsScreen.tsx',import.meta.url),'utf8');const ride=readFileSync(new URL('../screens/RideScreen.tsx',import.meta.url),'utf8');const active=readFileSync(new URL('../state/ActiveRideContext.tsx',import.meta.url),'utf8')
  assert.match(tactics,/durationSelectionForStage/);assert.match(tactics,/RIDE DURATION/);assert.match(ride,/applyDurationSelection\(adaptedSegments,resolvedDuration\)/);assert.match(active,/durationMode:DurationMode/)
})

test('terrain modifier creates bounded deterministic climbing resistance and cadence', () => {
  const timeline = createStageTimeline(vuelta4.segments, vuelta4.distanceKm)
  const base = resolvePrescriptionAtState(vuelta4.segments, timeline.segmentStarts, timeline.segmentStarts[2]).currentPrescription
  const flat = applyTerrainModifier(base, 1.5, 'flat', 208)
  const climb = applyTerrainModifier(base, 8, 'climb', 208)
  assert.ok(climb.resistanceRange.min > flat.resistanceRange.min)
  assert.ok(climb.cadenceRange.min < flat.cadenceRange.min); assert.ok(climb.cadenceRange.min >= 65)
  assert.ok(climb.resistanceRange.max <= 88); assert.ok(climb.powerRange.max <= 208 * base.ftpPercent.max / 100)
  assert.deepEqual(applyTerrainModifier(base, 8, 'climb', 208), climb)
  assert.ok(applyTerrainModifier(base, -8, 'descent', 208).powerRange.min >= 0)
})

test('RideScreen live resolver synchronizes Stage 4 gradient, climb, terrain prescription and Jean context', () => {
  const segments=adaptSegments(vuelta4.segments,208,'Balanced')
  const road=createRoadModel(4,segments,vuelta4.distanceKm,undefined,vuelta4.profilePoints,vuelta4.officialCourseMarkers,vuelta4.raceId,208)
  const climbs=[{start:0,summit:14},{start:34,summit:51},{start:70,summit:88}]
  for(const climb of climbs) for(const fraction of [0,.25,.5,.75,.999999,1]) {
    const distance=climb.start+(climb.summit-climb.start)*fraction
    const state=road.roadSnapshot(road.elapsedAtCourseDistance(distance))
    assert.equal(state.livePrescription.authoritativeGradient,state.gradient)
    assert.equal(state.activeClimbId===null,false); assert.ok(state.gradient>0)
    assert.ok(state.livePrescription.resistanceRange.max<=88); assert.ok(state.livePrescription.cadenceRange.min>=65)
    assert.ok(state.livePrescription.powerRange.max<=208*state.livePrescription.ftpPercent.max/100+1e-9)
    if(fraction===1){assert.equal(state.climbProgress,1);assert.equal(state.distanceToSummit,0);assert.equal(state.nextGradient,null)}
    else assert.ok(state.nextGradient===null||state.nextGradient>0)
  }
  for(const summit of climbs.map(climb=>climb.summit)) {
    const after=road.roadSnapshot(road.elapsedAtCourseDistance(summit+.001)); assert.equal(after.activeClimbId,null)
    const stale=createJeanEvent(`stale-${summit}`,'coaching','Push over the summit')
    assert.equal(isJeanEventContextValid(stale,{courseDistance:after.courseDistance,activeClimbId:after.activeClimbId,summitDistance:after.summitDistance,climbProgress:after.climbProgress}),false)
  }
  const rideScreen=readFileSync(new URL('../screens/RideScreen.tsx',import.meta.url),'utf8')
  assert.match(rideScreen,/activePrescription = engine\.livePrescription/)
  assert.match(rideScreen,/courseDistance: engine\.courseDistance[\s\S]*activeClimbId: engine\.activeClimbId[\s\S]*climbProgress: engine\.climbProgress/)
})

test('Jean stale geographic calls suppress before display and speech with parity retained', () => {
  const bus = new JeanEventBus(); const displayed:string[]=[]; const spoken:string[]=[]
  const stale = createJeanEvent('summit-stale','coaching','Push over the summit')
  const context = { courseDistance: 11, activeClimbId: null, summitDistance: 10, climbProgress: 1 }
  assert.equal(isJeanEventContextValid(stale,context),false)
  assert.equal(bus.dispatch(stale,e=>displayed.push(e.id),e=>{spoken.push(e.id);return true},context),undefined)
  const valid=createJeanEvent('climb-now','coaching','Climb begins now')
  bus.dispatch(valid,e=>displayed.push(e.id),e=>{spoken.push(e.id);return true},context)
  assert.deepEqual(displayed,spoken)
  assert.equal(bus.dispatch(valid,e=>displayed.push(e.id),()=>true,context)?.event.id,'climb-now')
  assert.deepEqual(displayed,['climb-now'])
})

const event: TacticalEvent = { id:'break-1', type:'breakaway', trigger:{courseKm:10}, jeanPrompt:'Breakaway is forming.', choices:[{id:'join',label:'JOIN BREAKAWAY',modifier:{ftpDeltaPercent:8,fatigueDelta:10}},{id:'stay',label:'STAY IN PELOTON',modifier:{ftpDeltaPercent:0,fatigueDelta:0}}], acceptedModifier:{ftpDeltaPercent:8,fatigueDelta:10}, declinedModifier:{ftpDeltaPercent:0,fatigueDelta:0}, durationSeconds:90, cooldownSeconds:300, onceOnly:true }

test('tactical choice and RaceGapState are deterministic overlays that cannot modify geography', () => {
  const timeline=createStageTimeline(vuelta4.segments,vuelta4.distanceKm); const before=timeline.snapshot(600)
  const active=triggerTacticalEvent(initialTacticalState(),event,10); const first=decideTacticalEvent(active,'join'); const second=decideTacticalEvent(active,'join')
  assert.deepEqual(first,second); assert.equal(first.gap?.gapTrend,'closing'); assert.equal(first.gap?.eventId,event.id)
  assert.equal(timeline.snapshot(600).courseDistance,before.courseDistance)
  const complete=completeTacticalEvent(first); assert.equal(complete.gap,null); assert.deepEqual(complete.completedEventIds,[event.id])
  assert.equal(triggerTacticalEvent(complete,event,20),complete)
})

test('deterministic simulator completes all 42 professional stages exactly', () => {
  for (const race of [tour2026,vuelta2026]) for (const raw of race.stages) {
    const stage=toRaceStage(race,raw)
    const frames=simulateRide({stageNumber:stage.number,distanceKm:stage.distanceKm,segments:stage.segments,ftp:208,strategy:'Balanced',duration:{mode:'QUICK'},profilePoints:stage.profilePoints,markers:stage.officialCourseMarkers,intervalSeconds:300})
    for(let i=1;i<frames.length;i++) assert.ok(frames[i].courseDistance>=frames[i-1].courseDistance,`${race.name} ${stage.number}`)
    assert.ok(frames.every(frame=>frame.courseProgress>=0&&frame.courseProgress<=1))
    const finish=frames.at(-1)!; assert.equal(finish.courseDistance,stage.distanceKm); assert.equal(finish.courseProgress,1); assert.equal(finish.stageComplete,true)
  }
})
