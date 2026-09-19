import { useEffect, useState } from 'react'
import { teamLoriot } from '../game/team'
import type { Season } from '../data/seasonCalendar'
import { useCareer } from '../state/CareerContext'
import { speakAsJean, stopJeanVoice, type JeanVoiceStatus } from '../services/jeanVoice'
import { originalTargetsAvailable } from '../engine/release4024.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { canUseOwnerOffSeasonPreview } from '../engine/alpha4025.ts'

type Props = {
  onBack: () => void
  seasons: Season[]
  onOpenSeason: (year: number) => void
  onOpenTraining: () => void
  onOpenOffSeason:()=>void
  onOpenFemmes:()=>void
  onOpenRoster: () => void
  onReplayStage:(stage:number,useOriginalTargets:boolean)=>void
  onOpenStageResults:(rideId:string)=>void
}

export default function TeamBusScreen({ onBack, seasons, onOpenSeason, onOpenTraining, onOpenOffSeason,onOpenFemmes,onOpenRoster,onReplayStage,onOpenStageResults }: Props) {
  const {career,setJeanVoiceEnabled}=useCareer()
  const {account}=useAuth(),ownerPreview=!career.alpha4025.offSeasonUnlocked&&canUseOwnerOffSeasonPreview({role:account?.role,riderName:career.rider.name,riderNumber:career.rider.number,ftp:career.rider.ftp}),offSeasonAccess=career.alpha4025.offSeasonUnlocked||ownerPreview
  const [voiceStatus,setVoiceStatus]=useState<JeanVoiceStatus>('idle')
  const motto='Ride with patience. Race with purpose. Finish together.'
  useEffect(()=>()=>stopJeanVoice(),[])
  const hearJean=()=>{if(voiceStatus==='speaking'){stopJeanVoice();setVoiceStatus('idle')}else speakAsJean(motto,setVoiceStatus,career.settings.jeanVoiceVolume)}
  return <section className="team-bus-screen alpha38-team-bus">
    <button type="button" onClick={onBack}>← Back Home</button>
    <header className="compact-page-header"><p className="eyebrow">{teamLoriot.name.toUpperCase()}</p><h1>Team Bus</h1><p>Plan the season, prepare the team, and choose where we race.</p></header>
    <article className="jean-command-card team-bus-jean"><div className="jean-identity"><div className="jean-avatar" aria-hidden="true">JM</div><div><p className="eyebrow">DIRECTEUR SPORTIF</p><h2>Jean Moreau</h2><span>Live from the Team Loriot car</span></div></div><div className="radio-message team-motto"><span className="radio-indicator"><i/> TEAM PHILOSOPHY</span><blockquote>“{motto}”</blockquote></div><div className="jean-voice-controls"><button type="button" className="voice-button" onClick={hearJean} disabled={!career.settings.jeanVoiceEnabled}>{voiceStatus==='speaking'?'■ Stop Jean':'▶ Hear Jean'}</button><label><input type="checkbox" checked={career.settings.jeanVoiceEnabled} onChange={event=>{stopJeanVoice();setVoiceStatus('idle');setJeanVoiceEnabled(event.target.checked)}}/> Jean voice</label></div></article>
    <nav className="team-bus-destinations" aria-label="Team Bus destinations">
      <p className="eyebrow destination-heading">CURRENT SEASON</p>
      {career.alpha4025.seriesPreference!=='RtR Femmes'&&seasons.map((season) => <button type="button" key={season.year} onClick={() => onOpenSeason(season.year)}><strong>{season.year} →</strong><small>{season.races.length} professional races</small></button>)}
      {career.alpha4025.seriesPreference==='RtR Femmes'&&<button type="button" onClick={onOpenFemmes}><strong>RTR FEMMES CALENDAR</strong><small>Platform shell · no unverified production races</small></button>}
      <button type="button" className="offseason-folder" disabled={!offSeasonAccess} onClick={onOpenOffSeason}><strong>OFF-SEASON TRAINING {offSeasonAccess?'→':'🔒'}</strong><small>{ownerPreview?'Owner Preview Unlocked · Start September 21, 2026 · 12 weeks':'Jean’s Season Review · Goals · Camps · 12-week plan'}</small>{ownerPreview&&<b>Open Off-Season Plan</b>}</button>
      <button type="button" onClick={onOpenTraining}><strong>TRAINING LIBRARY</strong><small>Recovery Rides · Intro to Cycling · Classic Rides</small></button>
      {career.pastSeasons.length>0&&<section className="dashboard-card"><h2>Past Seasons</h2>{career.pastSeasons.map(archive=><details key={`${archive.year}-${archive.race}`}><summary>{archive.year} → {archive.race}</summary>{archive.stages.map(stage=><div key={stage.stageNumber}><strong>Stage {stage.stageNumber}</strong> · {stage.completed?'Completed':'Not completed'} · {stage.result??'Result unavailable'}{stage.completed&&<>{stage.rideId&&<button type="button" onClick={()=>onOpenStageResults(stage.rideId!)}>Stage Results</button>}<button type="button" onClick={()=>onReplayStage(stage.stageNumber,false)}>Ride Again</button>{stage.rideId&&originalTargetsAvailable(career.rideHistory.find(ride=>ride.id===stage.rideId)??{})?<button type="button" onClick={()=>onReplayStage(stage.stageNumber,true)}>Use Original Targets</button>:stage.completed&&<small>Original Targets unavailable for this historical activity</small>}</>}</div>)}</details>)}</section>}
      <button type="button" onClick={onOpenRoster}><strong>TEAM ROSTER</strong><small>{teamLoriot.riders.length} Team Loriot riders</small></button>
    </nav>
  </section>
}
