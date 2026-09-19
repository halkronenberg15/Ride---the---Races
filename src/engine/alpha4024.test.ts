import test from 'node:test'
import assert from 'node:assert/strict'
import { getRaceStage } from '../data/raceStages.ts'
import { adaptSegments } from './adaptiveRide.ts'
import { applyDurationSelection, courseDurationOptions, durationSelectionForStage } from './durationEngine.ts'
import { createPreRacePlan, preRaceSnapshot } from './preRaceLifecycle.ts'
import { createRoadModel } from './roadModel.ts'
import { canonicalCoursePosition } from './alpha4023.ts'
import { CLIMB_ENTRY_PROGRESS, CLIMB_MINIMUM_VISIBLE_SECONDS, climbPresentationMode, evaluateJeanCue, initialClimbPresentationState, jeanEventValidity, officialStageTime, qualifiesForClimbView, scheduleJeanDismissal, transitionClimbPresentation, validJeanEvents, type JeanCueContract } from './alpha4024.ts'
import { buildJeanTimeline } from './stageEngine.ts'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { AuthoritativeJeanBanner4023 } from '../components/WorldsRaceLayer.ts'

const stage=getRaceStage(10)
function stage10(minutes:number){
 const selection=durationSelectionForStage(stage,{mode:'CUSTOM',customMinutes:minutes})
 const timed=applyDurationSelection(adaptSegments(stage.segments,206,'Balanced'),selection).segments
 const plan=createPreRacePlan(timed,minutes)
 return {plan,model:createRoadModel(10,plan.officialSegments,stage.distanceKm,undefined,stage.profilePoints,stage.officialCourseMarkers,stage.raceId)}
}

test('Stage 10 uses one exact timeline at every supported duration and boundary',()=>{
 for(const option of courseDurationOptions(stage)){
  const {plan,model}=stage10(option.minutes)
  assert.equal(preRaceSnapshot(plan,plan.warmupSeconds+plan.kilometreZeroSeconds).officialElapsed,0)
  let prior=0
  model.segmentStarts.forEach((start,index)=>{
   const at=model.roadSnapshot(start),projected=canonicalCoursePosition(model,start)
   assert.equal(at.segmentIndex,index);assert.equal(at.courseDistance,at.sectionStartCourseDistance)
   assert.equal(projected.fullProfileCoordinate,at.courseProgress);assert.ok(at.courseDistance>=prior);prior=at.courseDistance
   if(start>0)assert.equal(model.roadSnapshot(start-.001).segmentIndex,index-1)
  })
  const before=canonicalCoursePosition(model,model.raceFinishTime-.001),finish=canonicalCoursePosition(model,model.raceFinishTime)
  assert.ok(before.completion<100);assert.ok(before.remainingDistance>0);assert.equal(finish.completion,100);assert.equal(finish.remainingDistance,0)
  assert.deepEqual(officialStageTime(model.raceFinishTime,model.raceFinishTime+300),{total:model.raceFinishTime,elapsed:model.raceFinishTime,remaining:0})
 }
})

test('Stage 10 profile rollers use one meaningful climb gate without micro-climbs',()=>{
 assert.equal(qualifiesForClimbView({lengthKm:.99,gainM:100}),false)
 assert.equal(qualifiesForClimbView({lengthKm:2,gainM:29}),false)
 assert.equal(qualifiesForClimbView({lengthKm:2,gainM:30}),false)
 assert.equal(qualifiesForClimbView({lengthKm:1.5,gainM:45}),true)
 const {model}=stage10(courseDurationOptions(stage).find(option=>option.recommended)!.minutes)
 for(const climb of model.climbs){assert.ok(climb.summitDistance-climb.startDistance>=1);const start=model.elapsedAtCourseDistance(climb.startDistance+.001),end=model.elapsedAtCourseDistance(climb.summitDistance);assert.equal(canonicalCoursePosition(model,start).currentClimbId,climb.id);assert.equal(canonicalCoursePosition(model,end).climbCompletion,100)}
})

test('Jean calls have stable identities and expire instead of replaying late',()=>{
 const segments=stage10(105).plan.officialSegments,events=buildJeanTimeline(segments,stage.distanceKm)
 const descent=events.find(event=>event.type==='descent')!
 const window=jeanEventValidity(descent,segments[descent.segmentIndex].sec)
 assert.equal(validJeanEvents([descent],window.opensAt,segments.map(item=>item.sec),new Set()).length,1)
 assert.equal(validJeanEvents([descent],window.expiresAt+.001,segments.map(item=>item.sec),new Set()).length,0)
 assert.equal(validJeanEvents([descent],window.opensAt,segments.map(item=>item.sec),new Set([descent.key])).length,0)
})

test('Climb presentation latches eligible identity, honors minimum and exits once',()=>{let state=initialClimbPresentationState();state=transitionClimbPresentation(state,{eligibleClimbId:'stage10-climb',climbProgress:CLIMB_ENTRY_PROGRESS-.001,officialElapsed:10});assert.equal(state.activeClimbId,null);state=transitionClimbPresentation(state,{eligibleClimbId:'stage10-climb',climbProgress:CLIMB_ENTRY_PROGRESS,officialElapsed:11});assert.equal(state.activeClimbId,'stage10-climb');assert.equal(state.minimumVisibleUntil,11+CLIMB_MINIMUM_VISIBLE_SECONDS);state=transitionClimbPresentation(state,{eligibleClimbId:'stage10-climb',climbProgress:.996,officialElapsed:12});assert.equal(state.activeClimbId,'stage10-climb');state=transitionClimbPresentation(state,{eligibleClimbId:null,climbProgress:null,officialElapsed:13,canonicalEnded:true});assert.equal(state.activeClimbId,null);assert.deepEqual(state.completedClimbIds,['stage10-climb']);assert.equal(transitionClimbPresentation(state,{eligibleClimbId:'stage10-climb',climbProgress:.5,officialElapsed:20}).activeClimbId,null)})

test('entry and exit oscillation cannot flicker and raw noneligible IDs are ignored',()=>{let state=initialClimbPresentationState();for(const progress of [.009,.011,.008,.02])state=transitionClimbPresentation(state,{eligibleClimbId:'eligible',climbProgress:progress,officialElapsed:progress*100});assert.equal(state.activeClimbId,'eligible');for(const progress of [.994,.996,.993,.997])state=transitionClimbPresentation(state,{eligibleClimbId:'eligible',climbProgress:progress,officialElapsed:4});assert.equal(state.activeClimbId,'eligible');const raw=transitionClimbPresentation(initialClimbPresentationState(),{eligibleClimbId:null,climbProgress:.5,officialElapsed:10});assert.equal(climbPresentationMode(raw,false),'FULL_STAGE')})

test('explicit Full Stage remains authoritative across reload and pause',()=>{const full={...initialClimbPresentationState(),manualSelection:'FULL_STAGE' as const},blocked=transitionClimbPresentation(full,{eligibleClimbId:'eligible',climbProgress:.5,officialElapsed:20});assert.equal(blocked.activeClimbId,null);assert.equal(climbPresentationMode(blocked,true),'FULL_STAGE');const active=transitionClimbPresentation(initialClimbPresentationState(),{eligibleClimbId:'eligible',climbProgress:.5,officialElapsed:20}),reload=structuredClone(active),paused=transitionClimbPresentation(reload,{eligibleClimbId:'eligible',climbProgress:.5,officialElapsed:20});assert.equal(paused.activeClimbId,'eligible');assert.equal(paused.minimumVisibleUntil,active.minimumVisibleUntil)})

test('every Stage 10 duration crosses actual eligible windows before, at and after',()=>{for(const option of courseDurationOptions(stage)){const {model}=stage10(option.minutes);for(const climb of model.climbs){const entry=model.elapsedAtCourseDistance(climb.startDistance+(climb.summitDistance-climb.startDistance)*CLIMB_ENTRY_PROGRESS),before=canonicalCoursePosition(model,entry-.001),at=canonicalCoursePosition(model,entry),after=canonicalCoursePosition(model,entry+.001);assert.ok((before.climbCoordinate??0)<CLIMB_ENTRY_PROGRESS);assert.ok((at.climbCoordinate??0)>=CLIMB_ENTRY_PROGRESS);assert.ok((after.climbCoordinate??0)>=(at.climbCoordinate??0));const finish=model.elapsedAtCourseDistance(climb.summitDistance);assert.equal(canonicalCoursePosition(model,finish+.001).currentClimbId,null)}}})

test('Jean presentation scheduler gives replacements seven seconds and cancels on cleanup',()=>{const jobs=new Map<number,{callback:()=>void;delay:number}>(),dismissed:string[]=[];const dismiss=(message:string)=>{dismissed.push(message)};let id=0;const schedule=(callback:()=>void,delay:number)=>{jobs.set(++id,{callback,delay});return id},cancel=(handle:unknown)=>jobs.delete(handle as number);const oldCleanup=scheduleJeanDismissal('old',0,0,schedule,cancel,dismiss);assert.equal(jobs.get(1)?.delay,7000);oldCleanup();const replacementCleanup=scheduleJeanDismissal('new',1000,1000,schedule,cancel,dismiss);assert.equal(jobs.has(1),false);assert.equal(jobs.get(2)?.delay,7000);assert.deepEqual(dismissed,[]);jobs.get(2)!.callback();assert.deepEqual(dismissed,['new']);replacementCleanup();scheduleJeanDismissal('expired',0,7001,schedule,cancel,dismiss);assert.deepEqual(dismissed,['new','expired'])})

test('complete Stage 10 Jean trace drops every course and authored instruction after validity',()=>{const {plan,model}=stage10(105),timeline=buildJeanTimeline(plan.officialSegments,stage.distanceKm),contracts:JeanCueContract[]=[];for(const event of timeline){const validity=jeanEventValidity(event,plan.officialSegments[event.segmentIndex].sec);contracts.push({id:event.key,message:event.type,validFrom:validity.opensAt,expiresAt:validity.expiresAt,priority:'course',canonicalProgress:(event.courseDistance??0)/stage.distanceKm,source:'timeline'})}plan.officialSegments.forEach((segment,index)=>(segment.fixed??[]).forEach(cue=>contracts.push({id:`fixed-${index}-${cue.at}`,message:cue.text,validFrom:model.segmentStarts[index]+cue.at,expiresAt:model.segmentStarts[index]+cue.at+2,priority:'course',canonicalProgress:model.roadSnapshot(model.segmentStarts[index]+cue.at).courseProgress,source:'fixed'})));assert(contracts.some(cue=>/climb-approach|summit|descent|recovery|drink|fuel|gear/i.test(`${cue.id} ${cue.message}`)));for(const cue of contracts)assert.equal(evaluateJeanCue(cue,cue.expiresAt+.001,new Set()),'DROP',cue.id)})

test('dismissed Jean sentence retains persistent race status',()=>{const html=renderToStaticMarkup(createElement(AuthoritativeJeanBanner4023,{active:true,phase:'RACING',racingMessage:'Move now.',dismissedMessage:'Move now.',onDismiss:()=>{},situation:{title:'BREAKAWAY AHEAD',gap:'0:20'}}));assert.match(html,/race-status-persistent/);assert.match(html,/BREAKAWAY AHEAD · 0:20/);assert.doesNotMatch(html,/JEAN|Move now/)})
