import { useMemo, useState } from 'react'
import { getRaceStage, type RaceStage } from '../data/raceStages'
import { adaptSegment, strategyProfiles } from '../engine/adaptiveRide'
import { useCareer } from '../state/CareerContext'
import type { RaceStrategy } from '../types/tactics'
import { kmToMi } from '../utils/units'
import StageSectionPreview from '../components/StageSectionPreview'

type TacticsScreenProps = {
  stageNumber: number
  stageData?: RaceStage
  library?: string
  onBack: () => void
  onStartRide: (strategy: RaceStrategy) => void
}

function TacticsScreen({ stageNumber, stageData, onBack, onStartRide }: TacticsScreenProps) {
  const { career } = useCareer()
  const [strategy, setStrategy] = useState<RaceStrategy>('Balanced')
  const stage = useMemo(() => stageData ?? getRaceStage(stageNumber), [stageNumber, stageData])
  const adaptedSegments = useMemo(() => stage.segments.map((segment) => adaptSegment(segment, career.rider.ftp, strategy)), [stage, career.rider.ftp, strategy])
  const minutes = Math.round(adaptedSegments.reduce((sum, segment) => sum + segment.sec, 0) / 60)
  const decisiveSegment = adaptedSegments.find((segment) => /climb|finish|attack|sprint/i.test(`${segment.type} ${segment.name}`)) ?? adaptedSegments[0]
  const profile = strategyProfiles[strategy]

  return (
    <section className="tactics-screen race-briefing-screen">
      <button type="button" onClick={onBack}>← Team Bus</button>

      <header className="compact-page-header">
        <p className="eyebrow">TEAM LORIOT • {stage.isTraining ? 'TODAY’S SESSION' : `STAGE ${stage.number}`}</p>
        <h1>{stage.isTraining ? 'Training Ride Briefing' : 'Race Briefing'}</h1>
        <p>{stage.route} • {stage.distanceKm.toFixed(1)} km / {kmToMi(stage.distanceKm).toFixed(1)} mi • {minutes} min</p>
      </header>

      <section className="briefing-board">
        <div className="briefing-mission">
          <p className="eyebrow">TODAY'S MISSION</p>
          <h2>{stage.objective}</h2>
        </div>

        <StageSectionPreview stageNumber={stage.number} segments={adaptedSegments} measurementSystem={career.settings.measurementSystem} />

        <div className="strategy-selector" aria-label="Race strategy">
          {(['Conservative', 'Balanced', 'Aggressive'] as RaceStrategy[]).map((option) => (
            <button key={option} type="button" onClick={() => setStrategy(option)} aria-pressed={strategy === option} className={strategy === option ? 'selected' : ''}>
              <span>{option === 'Conservative' ? '🟢' : option === 'Balanced' ? '🟡' : '🔴'}</span>
              <strong>{option}</strong>
              <small>{strategyProfiles[option].label}</small>
            </button>
          ))}
        </div>

        <div className="briefing-columns">
          <article className="team-plan-card">
            <p className="eyebrow">TEAM OBJECTIVES & ORDERS</p>
            <ul>
              <li>{stage.objective}</li>
              {stage.teamOrders.map((order) => <li key={order}>{order}</li>)}
            </ul>
          </article>

          <article className="workout-impact-card">
            <p className="eyebrow">LIVE WORKOUT IMPACT</p>
            <h3>{decisiveSegment.name}</h3>
            <div className="impact-grid">
              <span><small>POWER</small><strong>{decisiveSegment.power}</strong></span>
              <span><small>CADENCE</small><strong>{decisiveSegment.cadence}</strong></span>
              <span><small>RESISTANCE</small><strong>{decisiveSegment.resistance}</strong></span>
              <span><small>TIME</small><strong>{minutes} min</strong></span>
            </div>
            <p>{profile.description}</p>
            <small>{profile.tradeoff}</small>
          </article>
        </div>

        <button type="button" className="primary-cta briefing-start" onClick={() => onStartRide(strategy)}>🚩 {stage.isTraining ? 'Start Ride' : `Roll Out • Stage ${stage.number}`}</button>
      </section>
    </section>
  )
}

export default TacticsScreen
