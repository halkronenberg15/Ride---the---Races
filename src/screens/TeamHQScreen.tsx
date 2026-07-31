import { useEffect, useMemo, useState } from 'react'
import { getRaceStage } from '../data/raceStages'
import { createCoachBriefing } from '../services/coachEngine'
import { speakAsJean, stopJeanVoice, type JeanVoiceStatus } from '../services/jeanVoice'
import { useCareer } from '../state/CareerContext'
import { formatDistance, formatElevation } from '../utils/units'

type TeamHQScreenProps = {
  onContinue: () => void
  onOpenRideData: () => void
  onOpenHealth: () => void
  onOpenProfile: () => void
  onOpenSettings: () => void
}

function TeamHQScreen({ onContinue, onOpenRideData, onOpenHealth, onOpenProfile, onOpenSettings }: TeamHQScreenProps) {
  const { career, restartOnboarding, setJeanVoiceEnabled } = useCareer()
  const [voiceStatus, setVoiceStatus] = useState<JeanVoiceStatus>('idle')
  const stage = getRaceStage(career.season.currentStage)
  const coach = useMemo(() => createCoachBriefing(career, stage), [career, stage])
  const firstName = career.rider.name.split(' ')[0]
  const progress = Math.round((career.season.completedStages.length / 21) * 100)

  useEffect(() => () => stopJeanVoice(), [])

  function handleJeanVoice() {
    if (voiceStatus === 'speaking') {
      stopJeanVoice()
      setVoiceStatus('idle')
      return
    }
    speakAsJean(coach.briefing, setVoiceStatus, career.settings.jeanVoiceVolume)
  }

  return (
    <section className={`hq-screen hq-${coach.phase}`}>
      <header className="hq-topbar">
        <div>
          <p className="eyebrow">TEAM LORIOT • RIDER #{career.rider.number}</p>
          <h1>{coach.greeting}, {firstName}</h1>
          <p className="subtitle">{career.season.currentRace} • Stage {stage.number} • {stage.route}</p>
        </div>
        <div className="rider-badge">
          <span>{career.rider.archetype}</span>
          <strong>FTP {career.rider.ftp} W</strong>
          <button type="button" onClick={onOpenProfile}>Edit rider</button>
          <button type="button" className="text-button" onClick={onOpenSettings}>Settings</button>
          <button type="button" className="text-button" onClick={restartOnboarding}>Replay intake</button>
        </div>
      </header>

      <div className="hq-command-grid">
        <article className="jean-command-card">
          <div className="jean-identity">
            <div className="jean-avatar" aria-hidden="true">JM</div>
            <div>
              <p className="eyebrow">DIRECTEUR SPORTIF</p>
              <h2>Jean Moreau</h2>
              <span>Live from the Team Loriot car</span>
            </div>
          </div>

          <div className="radio-message">
            <span className="radio-indicator"><i /> TEAM RADIO</span>
            <blockquote>“{coach.briefing}”</blockquote>
          </div>

          <div className="jean-voice-controls">
            <button type="button" className="voice-button" onClick={handleJeanVoice} disabled={!career.settings.jeanVoiceEnabled}>
              {voiceStatus === 'speaking' ? '■ Stop Jean' : '▶ Hear Jean'}
            </button>
            <label>
              <input
                type="checkbox"
                checked={career.settings.jeanVoiceEnabled}
                onChange={(event) => {
                  stopJeanVoice()
                  setVoiceStatus('idle')
                  setJeanVoiceEnabled(event.target.checked)
                }}
              />
              Jean voice
            </label>
            {voiceStatus === 'unsupported' && <small>Voice playback is not supported in this browser.</small>}
          </div>
        </article>

        <aside className="today-plan-card">
          <p className="eyebrow">TODAY'S STAGE</p>
          <span className="stage-chip">{stage.theme}</span>
          <h2>Stage {stage.number}</h2>
          <p>{stage.route}</p>
          <div className="stage-metrics">
            <div><span>Distance</span><strong>{formatDistance(stage.distanceKm, career.settings.measurementSystem)}</strong></div>
            <div><span>Elevation</span><strong>{formatElevation(stage.elevationM, career.settings.measurementSystem)}</strong></div>
            <div><span>Difficulty</span><strong>{stage.difficulty}</strong></div>
          </div>
          <button type="button" className="primary-cta" onClick={onContinue}>Enter Team Bus →</button>
        </aside>
      </div>

      <section className="hq-dashboard-grid">
        <article className="dashboard-card readiness-dashboard">
          <div className="dashboard-card-header"><span>Recovery</span><small>{career.health.date}</small></div>
          <div className="readiness-ring" style={{ '--readiness': `${coach.readiness * 3.6}deg` } as React.CSSProperties}>
            <div><strong>{coach.readiness}%</strong><span>{coach.readinessLabel}</span></div>
          </div>
          <div className="mini-metrics">
            <span><strong>{career.health.sleepHours}h</strong> Sleep</span>
            <span><strong>{career.health.recoveryScore}%</strong> Recovery</span>
            <span><strong>{career.health.fatigue}%</strong> Fatigue</span>
          </div>
          <button type="button" className="secondary-action" onClick={onOpenHealth}>Update health</button>
        </article>

        <article className="dashboard-card goal-dashboard">
          <div className="dashboard-card-header"><span>Today's Goal</span><small>Jean's order</small></div>
          <div className="goal-icon">◎</div>
          <h3>{coach.dailyGoal}</h3>
          <p>{stage.objective}</p>
          <div className="coach-intelligence"><span><small>Training load</small><strong>{coach.trainingLoad}</strong></span><span><small>Target effort</small><strong>{coach.targetEffort}</strong></span></div>
          <div className="coach-note"><strong>Recovery note</strong><span>{coach.recoveryAdvice}</span></div>
        </article>

        <article className="dashboard-card season-dashboard">
          <div className="dashboard-card-header"><span>Season</span><small>{career.season.year}</small></div>
          <strong className="season-stat">{career.season.completedStages.length}<small>/21 stages</small></strong>
          <div className="season-progress"><span style={{ width: `${Math.max(progress, 4)}%` }} /></div>
          <div className="season-details">
            <span><strong>{career.rideHistory.length}</strong> rides logged</span>
            <span><strong>Stage {career.season.currentStage}</strong> current</span>
          </div>
          <button type="button" className="secondary-action" onClick={onOpenRideData}>Open ride data</button>
        </article>
      </section>

      <section className="motivation-strip">
        <span>JEAN'S WORD FOR TODAY</span>
        <blockquote>“{coach.motivation}”</blockquote>
      </section>

      <section className="quick-actions" aria-label="Team HQ quick actions">
        <button type="button" onClick={onContinue}><span>🚴</span><strong>Team Bus</strong><small>Briefing and tactics</small></button>
        <button type="button" onClick={onOpenRideData}><span>📈</span><strong>Ride Data</strong><small>Log and review rides</small></button>
        <button type="button" onClick={onOpenHealth}><span>❤</span><strong>Health</strong><small>Recovery and readiness</small></button>
        <button type="button" onClick={onOpenProfile}><span>🛂</span><strong>Rider Profile</strong><small>Identity and goals</small></button>
        <button type="button" onClick={onOpenSettings}><span>⚙</span><strong>Settings</strong><small>Theme, audio and access</small></button>
      </section>
    </section>
  )
}

export default TeamHQScreen
