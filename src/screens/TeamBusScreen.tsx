import { useEffect, useState } from 'react'
import { teamLoriot } from '../game/team'
import type { Season } from '../data/seasonCalendar'
import { useCareer } from '../state/CareerContext'
import { speakAsJean, stopJeanVoice, type JeanVoiceStatus } from '../services/jeanVoice'

type Props = {
  onBack: () => void
  seasons: Season[]
  onOpenSeason: (year: number) => void
  onOpenTraining: () => void
  onOpenRoster: () => void
}

export default function TeamBusScreen({ onBack, seasons, onOpenSeason, onOpenTraining, onOpenRoster }: Props) {
  const {career,setJeanVoiceEnabled}=useCareer()
  const [voiceStatus,setVoiceStatus]=useState<JeanVoiceStatus>('idle')
  const motto='Ride with patience. Race with purpose. Finish together.'
  useEffect(()=>()=>stopJeanVoice(),[])
  const hearJean=()=>{if(voiceStatus==='speaking'){stopJeanVoice();setVoiceStatus('idle')}else speakAsJean(motto,setVoiceStatus,career.settings.jeanVoiceVolume)}
  return <section className="team-bus-screen alpha38-team-bus">
    <button type="button" onClick={onBack}>← Back Home</button>
    <header className="compact-page-header"><p className="eyebrow">{teamLoriot.name.toUpperCase()}</p><h1>Team Bus</h1><p>Plan the season, prepare the team, and choose where we race.</p></header>
    <article className="jean-command-card team-bus-jean"><div className="jean-identity"><div className="jean-avatar" aria-hidden="true">JM</div><div><p className="eyebrow">DIRECTEUR SPORTIF</p><h2>Jean Moreau</h2><span>Live from the Team Loriot car</span></div></div><div className="radio-message team-motto"><span className="radio-indicator"><i/> TEAM PHILOSOPHY</span><blockquote>“{motto}”</blockquote></div><div className="jean-voice-controls"><button type="button" className="voice-button" onClick={hearJean} disabled={!career.settings.jeanVoiceEnabled}>{voiceStatus==='speaking'?'■ Stop Jean':'▶ Hear Jean'}</button><label><input type="checkbox" checked={career.settings.jeanVoiceEnabled} onChange={event=>{stopJeanVoice();setVoiceStatus('idle');setJeanVoiceEnabled(event.target.checked)}}/> Jean voice</label></div></article>
    <nav className="team-bus-destinations" aria-label="Team Bus destinations">
      <p className="eyebrow destination-heading">SEASONS</p>
      {seasons.map((season) => <button type="button" key={season.year} onClick={() => onOpenSeason(season.year)}><strong>{season.year} →</strong><small>{season.races.length} professional races</small></button>)}
      <button type="button" onClick={onOpenTraining}><strong>TRAINING RIDES</strong><small>Recovery and leg openers</small></button>
      <button type="button" onClick={onOpenRoster}><strong>TEAM ROSTER</strong><small>{teamLoriot.riders.length} Team Loriot riders</small></button>
    </nav>
  </section>
}
