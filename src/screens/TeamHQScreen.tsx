import { useEffect, useMemo, useState } from 'react'
import { getRaceStage } from '../data/raceStages'
import { createCoachBriefing } from '../services/coachEngine'
import { speakAsJean, stopJeanVoice, type JeanVoiceStatus } from '../services/jeanVoice'
import { useCareer } from '../state/CareerContext'

type Props = { onContinue: () => void; onOpenHealth: () => void; onOpenProfile: () => void; onOpenSettings: () => void }
const teamMotto = 'Ride with patience. Race with purpose. Finish together.'

export default function TeamHQScreen({ onContinue, onOpenHealth, onOpenProfile, onOpenSettings }: Props) {
  const { career, restartOnboarding, setJeanVoiceEnabled } = useCareer()
  const [voiceStatus, setVoiceStatus] = useState<JeanVoiceStatus>('idle')
  const coach = useMemo(() => createCoachBriefing(career, getRaceStage(career.season.currentStage)), [career])
  useEffect(() => () => stopJeanVoice(), [])
  function handleJeanVoice() {
    if (voiceStatus === 'speaking') { stopJeanVoice(); setVoiceStatus('idle'); return }
    speakAsJean(teamMotto, setVoiceStatus, career.settings.jeanVoiceVolume)
  }
  return <section className={`hq-screen hq-${coach.phase}`}>
    <header className="hq-topbar"><div><p className="eyebrow">TEAM LORIOT • RIDER #{career.rider.number}</p><h1>{coach.greeting}, {career.rider.name.split(' ')[0]}</h1><p className="subtitle">{career.rider.archetype} • {career.rider.team}</p></div>
      <div className="rider-badge"><span>{career.rider.archetype}</span><strong>FTP {career.rider.ftp} W</strong><button type="button" onClick={onOpenProfile}>Edit rider</button><button type="button" className="text-button" onClick={onOpenSettings}>Settings</button><button type="button" className="text-button" onClick={restartOnboarding}>Replay intake</button></div>
    </header>
    <div className="hq-command-grid home-command-grid"><article className="jean-command-card"><div className="jean-identity"><div className="jean-avatar" aria-hidden="true">JM</div><div><p className="eyebrow">DIRECTEUR SPORTIF</p><h2>Jean Moreau</h2><span>Live from the Team Loriot car</span></div></div><div className="radio-message team-motto"><span className="radio-indicator"><i /> TEAM PHILOSOPHY</span><blockquote>“{teamMotto}”</blockquote></div><div className="jean-voice-controls"><button type="button" className="voice-button" onClick={handleJeanVoice} disabled={!career.settings.jeanVoiceEnabled}>{voiceStatus === 'speaking' ? '■ Stop Jean' : '▶ Hear Jean'}</button><label><input type="checkbox" checked={career.settings.jeanVoiceEnabled} onChange={(event) => { stopJeanVoice(); setVoiceStatus('idle'); setJeanVoiceEnabled(event.target.checked) }} /> Jean voice</label>{voiceStatus === 'unsupported' && <small>Voice playback is not supported in this browser.</small>}</div></article></div>
    <section className="hq-dashboard-grid home-dashboard"><article className="dashboard-card readiness-dashboard"><div className="dashboard-card-header"><span>Recovery</span><small>{career.health.date}</small></div><div className="readiness-ring" style={{ '--readiness': `${coach.readiness * 3.6}deg` } as React.CSSProperties}><div><strong>{coach.readiness}%</strong><span>{coach.readinessLabel}</span></div></div><div className="mini-metrics"><span><strong>{career.health.sleepHours}h</strong> Sleep</span><span><strong>{career.health.recoveryScore}%</strong> Recovery</span><span><strong>{career.health.fatigue}%</strong> Fatigue</span></div><button type="button" className="secondary-action" onClick={onOpenHealth}>Update Health</button></article></section>
    <button type="button" className="primary-cta enter-team-bus" onClick={onContinue}>ENTER TEAM BUS →</button>
  </section>
}
