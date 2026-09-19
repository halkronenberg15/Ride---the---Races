import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { trainingRides } from '../data/raceLibrary.ts'
import { getRaceStage, type RideSegment } from '../data/raceStages.ts'
import { buildJeanTimeline, jeanCourseEventsCrossed } from './stageEngine.ts'
import { coachingContext, cueAllowed, explicitlyAuthoredTerrain, jeanTimelineEventAllowed, restoredJeanMessageAllowed } from './release4024.ts'
import { createRoadModel } from './roadModel.ts'
import { evaluateJeanCue, JEAN_PRESENTATION_MS, scheduleJeanDismissal } from './alpha4024.ts'

const forbidden=/\b(climb(?:ing)?|summit|descent|sprint|attack|breakaway|chase|peloton|kom|king of the mountains|find the group|group position|race situation)\b/i
const calibration=trainingRides.find(ride=>ride.id==='intro-calibration')!

test('full Intro Calibration trace cannot deliver race or terrain language',()=>{
 const context=coachingContext('training',calibration.id)
 assert.equal(context,'CALIBRATION')
 const timeline=buildJeanTimeline(calibration.stage.segments,calibration.stage.distanceKm)
 for(const event of timeline)assert.equal(jeanTimelineEventAllowed(context,event,calibration.stage.segments),!['kilometre-zero-warning','kilometre-zero','sprint-approach','sprint','climb-approach','climb-entry','summit-minute','summit','descent'].includes(event.type))
 const authored=calibration.stage.segments.flatMap(segment=>[segment.name,segment.description,...(segment.fixed??[]).map(cue=>cue.text),...(segment.random??[])])
 for(const message of authored){assert.doesNotMatch(message,forbidden);assert.equal(cueAllowed(context,message),true)}
 for(const message of ['Climb is behind us. Recover on the descent.','Sprint done. Find the group and settle.','Attack now','KOM ahead','Stage 10 complete','The race is live'])assert.equal(cueAllowed(context,message),false)
})

test('decorative cadence and resistance profiles never create Jean terrain calls',()=>{
 for(const id of ['intro-control-30','intro-control-45','intro-foundations-30','intro-foundations-45']){
  const ride=trainingRides.find(item=>item.id===id)!
  const model=createRoadModel(ride.stage.number,ride.stage.segments,ride.stage.distanceKm,undefined,ride.stage.profilePoints)
  assert.ok(model.profilePoints.length>2)
  const terrain=buildJeanTimeline(ride.stage.segments,ride.stage.distanceKm).filter(event=>/climb|summit|descent/.test(event.type))
  assert.deepEqual(terrain,[],id)
 }
})

test('restoration rejects stale or different-activity race messages',()=>{
 const context=coachingContext('training','intro-control-30'),activityKey='training:intro-control-30:INTRO'
 assert.equal(restoredJeanMessageAllowed(context,{text:'Climb is behind us. Recover on the descent.',coachingContext:'PROFESSIONAL_RACE',activityKey:'tour-2026:10:RACE_STAGE'},activityKey),false)
 assert.equal(restoredJeanMessageAllowed(context,{text:'Keep the pedals smooth.',coachingContext:context,activityKey},activityKey),true)
 assert.equal(restoredJeanMessageAllowed(context,{text:'Keep the pedals smooth.',coachingContext:context,activityKey:'training:other:INTRO'},activityKey),false)
})

test('crossed ineligible events are classified for consumption and cannot replay',()=>{
 const segment={...calibration.stage.segments[0],name:'Decorative climb',type:'Cadence skills',description:'Smooth pedaling.',objective:'Cadence control',secondaryObjective:'',terrainLabel:'Training profile'}
 const events=buildJeanTimeline([segment],1)
 const crossed=jeanCourseEventsCrossed(events,0,1,0,segment.sec)
 const context=coachingContext('training','intro-control-30')
 const ineligible=crossed.filter(event=>!jeanTimelineEventAllowed(context,event,[segment]))
 for(const event of ineligible){const id=`training-stage30-${event.key}`,consumed=new Set([id]);assert.equal(evaluateJeanCue({id,message:'Terrain call',validFrom:event.at,expiresAt:event.at+10,priority:'course',canonicalProgress:event.courseDistance??0,source:'timeline',eventType:event.type},event.at,consumed),'DROP')}
 const source=readFileSync(new URL('../screens/RideScreen.tsx',import.meta.url),'utf8')
 assert.match(source,/ineligible\.map\(event=>`\$\{library\}-stage\$\{stage\.number\}-\$\{event\.key\}`\)/)
})

test('explicitly authored climbing training is allowed but tactics remain forbidden',()=>{
 const base=calibration.stage.segments[0]
 const climbing:RideSegment={...base,name:'Climbing Fundamentals',type:'Climbing skills',description:'Practice a steady seated climb.',objective:'Learn climbing cadence',terrainLabel:'Authored climb'}
 const context=coachingContext('training','climbing-skills-30'),events=buildJeanTimeline([climbing],1).filter(event=>/climb|summit/.test(event.type))
 assert.ok(explicitlyAuthoredTerrain(climbing));assert.ok(events.length>0)
 for(const event of events)assert.equal(jeanTimelineEventAllowed(context,event,[climbing]),true)
 assert.equal(cueAllowed(context,'Climb steadily to the summit.',true),true)
 assert.equal(cueAllowed(context,'Attack from the peloton.',true),false)
})

test('professional races retain climb and summit calls',()=>{
 const stage=getRaceStage(10),context=coachingContext('tour-2026')
 const events=buildJeanTimeline(stage.segments,stage.distanceKm).filter(event=>/climb|summit/.test(event.type))
 assert.ok(events.length>0)
 for(const event of events)assert.equal(jeanTimelineEventAllowed(context,event,stage.segments),true)
 assert.equal(cueAllowed(context,'Summit. Ride through the crest.'),true)
})

test('seven-second lifecycle remains lifecycle-first and unchanged',()=>{
 assert.equal(JEAN_PRESENTATION_MS,7000)
 const calls:number[]=[];let dismissed=''
 const cancel=scheduleJeanDismissal('Smooth pedals.',1000,1001,(callback,delay)=>{calls.push(delay);return callback},()=>{},message=>{dismissed=message})
 assert.equal(calls[0],6999);assert.equal(dismissed,'');cancel()
})
