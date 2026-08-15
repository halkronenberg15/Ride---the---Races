import { useMemo } from 'react'
import { getRaceStage } from '../data/raceStages'
import { createCoachBriefing } from '../services/coachEngine'
import { useCareer } from '../state/CareerContext'

type Props = { onContinue: () => void; onOpenHealth: () => void; onOpenProfile: () => void; onOpenSettings: () => void }

export default function TeamHQScreen({ onContinue, onOpenHealth, onOpenProfile, onOpenSettings }: Props) {
  const { career, restartOnboarding } = useCareer()
  const coach = useMemo(() => createCoachBriefing(career, getRaceStage(career.season.currentStage)), [career])
  return <section className={`hq-screen hq-${coach.phase}`}>
    <header className="hq-topbar"><div><p className="eyebrow">TEAM LORIOT • RIDER #{career.rider.number}</p><h1>{coach.greeting}, {career.rider.name.split(' ')[0]}</h1><p className="subtitle">{career.rider.archetype} • {career.rider.team}</p></div>
      <div className="rider-badge"><span>{career.rider.archetype}</span><strong>FTP {career.rider.ftp} W</strong><button type="button" onClick={onOpenProfile}>Edit rider</button><button type="button" className="text-button" onClick={onOpenSettings}>Settings</button><button type="button" className="text-button" onClick={restartOnboarding}>Replay intake</button></div>
    </header>
    <section className="hq-dashboard-grid home-dashboard"><article className="dashboard-card readiness-dashboard"><div className="dashboard-card-header"><span>Recovery</span><small>{career.health.date}</small></div><div className="readiness-ring" style={{ '--readiness': `${coach.readiness * 3.6}deg` } as React.CSSProperties}><div><strong>{coach.readiness}%</strong><span>{coach.readinessLabel}</span></div></div><div className="mini-metrics"><span><strong>{career.health.sleepHours}h</strong> Sleep</span><span><strong>{career.health.recoveryScore}%</strong> Recovery</span><span><strong>{career.health.fatigue}%</strong> Fatigue</span></div><button type="button" className="secondary-action" onClick={onOpenHealth}>Update Health</button></article></section>
    <button type="button" className="primary-cta enter-team-bus" onClick={onContinue}>ENTER TEAM BUS →</button>
  </section>
}
