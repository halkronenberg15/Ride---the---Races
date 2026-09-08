import { uciWorlds2026, worldsStages } from '../data/uciWorlds2026'
import { useCareer } from '../state/CareerContext'
import { formatDistance, formatElevation } from '../utils/units'
import type { RaceStage } from '../data/raceStages'
import type { ChampionshipRace } from '../data/professionalRaces'
import { WorldsOverviewLabels } from '../components/WorldsRaceLayer'

export function WorldsEventCard({event,stage,result,onOpen,index,measurementSystem}:{event:ChampionshipRace;stage:RaceStage;result?:{completed:boolean;place?:number};onOpen:(event:number)=>void;index:number;measurementSystem:'metric'|'imperial'}){return <article className="dashboard-card worlds-event"><p className="eyebrow">{event.discipline==='individual-time-trial'?'ITT':'ROAD RACE'} • {event.date}</p><h2>{event.name}</h2><div className="stage-facts"><span><small>DISTANCE</small><strong>{formatDistance(stage.distanceKm,measurementSystem)}</strong></span><span><small>ELEVATION</small><strong>{formatElevation(stage.elevationM,measurementSystem)}</strong></span></div><div className="worlds-overview-profile"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="worlds-profile" aria-label={`${event.name} course profile`}><polyline points={stage.profilePoints.map((point,i)=>typeof point==='string'?point:`${i/(stage.profilePoints.length-1)*100},${95-point.elevationM/3}`).join(' ')}/></svg>{event.discipline==='road-race'&&<WorldsOverviewLabels/>}</div><p><strong>{result?.completed?result.place===1?'WORLD CHAMPION · RAINBOW BANDS':'COMPLETED':'READY'}</strong></p><button className="primary-cta" onClick={()=>onOpen(index+1)}>COURSE BRIEFING →</button></article>}

export default function WorldsHubScreen({onBack,onOpen}:{onBack:()=>void;onOpen:(event:number)=>void}){
 const {career}=useCareer(),results=career.alpha4022.worldsResults
 return <section className="worlds-hub"><button onClick={onBack}>← September calendar</button><header className="worlds-hero"><p className="eyebrow">TEAM USA • MONTRÉAL 2026</p><h1>UCI Road World Championships</h1><p>Two Elite Men races. Jean is in the car, and you are riding for Team USA.</p></header><div className="worlds-grid">{uciWorlds2026.races.map((event,index)=><WorldsEventCard key={event.id} event={event} stage={worldsStages[index]} result={results[event.id]} onOpen={onOpen} index={index} measurementSystem={career.settings.measurementSystem}/>)}</div></section>
}
