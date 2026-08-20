import type { ProfessionalRace, ProfessionalStage } from './professionalRaces.ts'
import { createStageTimeline } from '../engine/stageEngine.ts'

export type StageReadinessAudit={race:string;stage:number;id:string;route:string;distanceKm:number;type:string;profileVerified:boolean;workoutReady:boolean;durationMinutes:number;sectionCount:number;coverageValid:boolean;briefingPresent:boolean;targetsPresent:boolean;specialHandling:string}

const PLACEHOLDER=/workout in preparation|profile coming soon|race course|execute the mission/i
export function validateProfessionalStage(race:ProfessionalRace,stage:ProfessionalStage):string[]{
 const id=`${race.name} Stage ${stage.number} (${race.id}-stage-${stage.number})`; const errors:string[]=[]; const fail=(message:string)=>errors.push(`${id}: ${message}`)
 if(!stage.verification.profile) fail('profileVerified !== true')
 if(!(stage.officialDistanceKm>0)) fail(`official distance expected > 0 km; actual ${stage.officialDistanceKm} km`)
 if(stage.profilePoints.length<2) fail(`verified profile expected at least 2 samples; actual ${stage.profilePoints.length}`)
 let previousProfile=-Infinity
 stage.profilePoints.forEach((point,index)=>{
  if(!Number.isFinite(point.distanceKm)||!Number.isFinite(point.elevationM)) fail(`profile sample ${index+1} expected finite distance/elevation; actual ${point.distanceKm}/${point.elevationM}`)
  if(point.distanceKm<previousProfile) fail(`profile sample ${index+1} expected ordered after ${previousProfile} km; actual ${point.distanceKm} km`)
  previousProfile=point.distanceKm
 })
 if(stage.profilePoints[0]?.distanceKm!==0) fail(`profile origin expected 0 km; actual ${stage.profilePoints[0]?.distanceKm} km`)
 if(stage.profilePoints.at(-1)?.distanceKm!==stage.officialDistanceKm) fail(`profile finish expected ${stage.officialDistanceKm} km; actual ${stage.profilePoints.at(-1)?.distanceKm} km`)
 if(!stage.start||!stage.finish||!stage.classification) fail('invalid stage identity')
 if(!stage.segments.length) fail('no authored workout sections')
 if(!Number.isFinite(stage.indoorDurationMinutes)||stage.indoorDurationMinutes!<=0) fail('invalid indoor duration')
 if(!stage.mission.trim()||PLACEHOLDER.test(stage.mission)) fail('briefing objective missing or placeholder')
 let previous=0
 stage.segments.forEach((section,index)=>{
  if(!Number.isFinite(section.routeKm)) fail(`section ${index+1} has invalid routeKm`)
  if(section.routeKm<previous) fail(`section ${index+1} reverses from ${previous} km to ${section.routeKm} km`)
  if(section.routeKm<0||section.routeKm>stage.officialDistanceKm) fail(`section ${index+1} is outside official distance`)
  if(!section.name.trim()||PLACEHOLDER.test(section.name)) fail(`section ${index+1} has placeholder name`)
  if(!section.sec||!section.zone||!section.power||!section.cadence||!section.resistance) fail(`section ${index+1} lacks duration or riding targets`)
  previous=section.routeKm
 })
 if(stage.segments[0]?.routeKm!==0) fail(`first section starts at ${stage.segments[0]?.routeKm} km instead of 0 km`)
 if(Math.abs((stage.segments.at(-1)?.routeKm??-1)-stage.officialDistanceKm)>1e-9) fail(`final courseDistance ${stage.segments.at(-1)?.routeKm} km != official distance ${stage.officialDistanceKm} km`)
 if(stage.segments.length){const timeline=createStageTimeline(stage.segments,stage.officialDistanceKm);let prior=0;for(let elapsed=0;elapsed<=timeline.duration;elapsed+=Math.max(1,timeline.duration/200)){const current=timeline.snapshot(elapsed).courseDistance;if(current+1e-9<prior)fail(`canonical distance reversed at ${elapsed}s`);prior=current}const finish=timeline.snapshot(timeline.duration);if(finish.courseDistance!==stage.officialDistanceKm||finish.riderPosition!==1)fail('timeline does not resolve exactly to 100% at finish')}
 if(!stage.segments.some(section=>/finish|sprint|summit|drive|attack/i.test(`${section.name} ${section.type}`))) fail('finish behavior missing')
 return errors
}

export function validateProfessionalRace(race:ProfessionalRace):string[]{return race.stages.flatMap(stage=>stage.workoutReady?validateProfessionalStage(race,stage):[])}
export function auditProfessionalRace(race:ProfessionalRace,special:(stage:ProfessionalStage)=>string=()=> 'none'):StageReadinessAudit[]{return race.stages.map(stage=>{const errors=validateProfessionalStage(race,stage);return {race:race.name,stage:stage.number,id:`${race.id}-stage-${stage.number}`,route:`${stage.start} → ${stage.finish}`,distanceKm:stage.officialDistanceKm,type:stage.classification,profileVerified:stage.verification.profile,workoutReady:stage.workoutReady,durationMinutes:stage.indoorDurationMinutes??0,sectionCount:stage.segments.length,coverageValid:!errors.some(error=>/section|courseDistance|distance|timeline|starts|reversed/i.test(error)),briefingPresent:Boolean(stage.mission.trim()&&!PLACEHOLDER.test(stage.mission)),targetsPresent:stage.segments.every(section=>Boolean(section.zone&&section.power&&section.cadence&&section.resistance)),specialHandling:special(stage)}})}
