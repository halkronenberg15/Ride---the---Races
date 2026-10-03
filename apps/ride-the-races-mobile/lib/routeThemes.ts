import type { RaceStage } from '../../../src/data/raceStages'
import { raceStages } from '../../../src/data/raceStages'
import { curatedOffSeasonTrainingRides, trainingRides, vueltaRideStages } from '../../../src/data/raceLibrary'
import { worldsStages } from '../../../src/data/uciWorlds2026'

export type RouteThemeId='alpine'|'rolling'|'coastal'|'flat-fast'|'time-trial'|'championship'
export type RouteTheme={id:RouteThemeId;name:string;subtitle:string;stages:RaceStage[]}

function sourceLabel(stage:RaceStage){
 if(stage.raceId==='tour-2026'||(!stage.raceId&&!stage.isTraining))return 'TOUR'
 if(stage.raceId==='vuelta-2026')return 'VUELTA'
 if(stage.raceId==='worlds-2026')return 'WORLDS'
 return 'TRAINING'
}
export { sourceLabel }

function text(stage:RaceStage){return [stage.theme,stage.difficulty,stage.route,stage.title,...stage.segments.map(s=>s.type+' '+s.name+' '+s.terrainLabel)].join(' ').toLowerCase()}
function isClimb(stage:RaceStage){const t=text(stage);return /mountain|climb|summit|alpe|tourmalet|ascent|col |hc |category [1234]/i.test(t)}
function isTT(stage:RaceStage){return /time trial|itt|ttt/i.test(text(stage))}
function isChampionship(stage:RaceStage){return stage.raceId==='worlds-2026'||/championship|world/i.test(text(stage))}
function isFlat(stage:RaceStage){return /flat|sprint|lead-out|leadout|speed/i.test(text(stage))}
function isRolling(stage:RaceStage){return /rolling|hilly|foothill|rollers|undulat|staircase/i.test(text(stage))}
function isCoastal(stage:RaceStage){return /coast|coastal|sea|shore|riverfront|lake|monaco|barcelona|mediterranean/i.test(text(stage))}

const tourRideStages=tour2026.stages.filter(stage=>stage.rideable).map(stage=>toRaceStage(tour2026,stage))
const pro=[...tourRideStages,...vueltaRideStages,...worldsStages]
const training=[...trainingRides.map(r=>r.stage),...curatedOffSeasonTrainingRides.map(r=>r.stage)]
const all=[...pro,...training]

function unique(items:RaceStage[]){
 const seen=new Set<string>()
 return items.filter(stage=>{const key=stage.id??stage.raceId+'-'+stage.number+'-'+stage.title;if(seen.has(key))return false;seen.add(key);return true})
}
function pick(test:(stage:RaceStage)=>boolean){return unique(all.filter(test))}

export const routeThemes:RouteTheme[]=[
 {id:'alpine',name:'Alpine & Mountain Roads',subtitle:'Sustained climbs, summit finishes and high-mountain stage adaptations',stages:pick(isClimb)},
 {id:'rolling',name:'Rolling Countryside',subtitle:'Hilly roads, repeated rises, false flats and rhythm changes',stages:pick(stage=>isRolling(stage)&&!isClimb(stage))},
 {id:'coastal',name:'Coastal & Open Roads',subtitle:'Sea-level roads, open terrain and long aerobic flow',stages:pick(stage=>isCoastal(stage)&&!isClimb(stage)&&!isTT(stage))},
 {id:'flat-fast',name:'Fast Roads & Sprint Days',subtitle:'Flat stages, speed work, lead-outs and fast endurance',stages:pick(stage=>isFlat(stage)&&!isTT(stage)&&!isClimb(stage))},
 {id:'time-trial',name:'Against the Clock',subtitle:'Individual and team time-trial style rides',stages:pick(isTT)},
 {id:'championship',name:'Championship Roads',subtitle:'World Championship courses and selective circuit racing',stages:pick(isChampionship)},
]

export function routeThemeFor(stage:RaceStage){
 if(isTT(stage))return routeThemes.find(t=>t.id==='time-trial')!
 if(isChampionship(stage))return routeThemes.find(t=>t.id==='championship')!
 if(isClimb(stage))return routeThemes.find(t=>t.id==='alpine')!
 if(isRolling(stage))return routeThemes.find(t=>t.id==='rolling')!
 if(isCoastal(stage))return routeThemes.find(t=>t.id==='coastal')!
 return routeThemes.find(t=>t.id==='flat-fast')!
}

export function isClimbStage(stage:RaceStage){return isClimb(stage)}
