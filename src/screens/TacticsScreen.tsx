import { useMemo, useState } from 'react'
import { getRaceStage } from '../data/raceStages'
import { adaptSegment, strategyProfiles } from '../engine/adaptiveRide'
import { useCareer } from '../state/CareerContext'
import type { RaceStrategy } from '../types/tactics'

type TacticsScreenProps = {
  stageNumber: number
  onBack: () => void
  onStartRide: (strategy: RaceStrategy) => void
}

function TacticsScreen({ stageNumber, onBack, onStartRide }: TacticsScreenProps) {
  const { career } = useCareer()
  const [strategy, setStrategy] = useState<RaceStrategy>('Balanced')
  const stage = useMemo(() => getRaceStage(stageNumber), [stageNumber])
  const adaptedSegments = useMemo(() => stage.segments.map((segment) => adaptSegment(segment, career.rider.ftp, strategy)), [stage, career.rider.ftp, strategy])
  const minutes = Math.round(adaptedSegments.reduce((sum, segment) => sum + segment.sec, 0) / 60)
  const decisiveSegment = adaptedSegments.find((segment) => /climb|finish|attack|sprint/i.test(`${segment.type} ${segment.name}`)) ?? adaptedSegments[0]
  const profile = strategyProfiles[strategy]

  return (
    <section className="tactics-screen" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      <button type="button" onClick={onBack}>← Back to Team Bus</button>

      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <p className="eyebrow">TEAM LORIOT • STAGE {stage.number}</p>
        <h1 style={{ margin: 0, fontSize: 'clamp(2.6rem, 7vw, 5rem)' }}>{stage.route}</h1>
        <p style={{ opacity: 0.8 }}>{minutes} minutes • {stage.theme} • Difficulty {stage.difficulty}</p>
      </header>

      <div className="dashboard-card">
        <h2>Today&apos;s Objective</h2>
        <p>{stage.objective}</p>
      </div>

      <div className="dashboard-card">
        <h2>Select Strategy</h2>
        <div style={{ display: 'grid', gap: '12px', marginTop: '18px' }}>
          {(['Conservative', 'Balanced', 'Aggressive'] as RaceStrategy[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStrategy(option)}
              aria-pressed={strategy === option}
              style={{ outline: strategy === option ? '2px solid rgba(255,170,90,.9)' : undefined }}
            >
              {option === 'Conservative' ? '🟢' : option === 'Balanced' ? '🟡' : '🔴'} {option}<br />
              <small>{strategyProfiles[option].label}</small>
            </button>
          ))}
        </div>
        <p style={{ marginTop: '24px', fontSize: '1.1rem' }}><strong>Current Strategy:</strong> {strategy}</p>
        <p>{profile.description}</p>
        <p style={{ opacity: .72 }}>{profile.tradeoff}</p>
      </div>


      <div className="dashboard-card">
        <p className="eyebrow">LIVE WORKOUT IMPACT</p>
        <h2>{decisiveSegment.name}</h2>
        <div className="status-grid" style={{ marginTop: 16 }}>
          <article className="status-card"><small>POWER</small><strong>{decisiveSegment.power}</strong><span>Scaled from FTP {career.rider.ftp} W</span></article>
          <article className="status-card"><small>RESISTANCE</small><strong>{decisiveSegment.resistance}</strong><span>Changed by strategy</span></article>
          <article className="status-card"><small>STAGE TIME</small><strong>{minutes} min</strong><span>Recovery blocks adapt</span></article>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>Team Orders</h2>
        <ul style={{ lineHeight: 1.9 }}>
          {stage.teamOrders.map((order) => <li key={order}>{order}</li>)}
        </ul>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px' }}>
        <button type="button" onClick={() => onStartRide(strategy)}>🚴 Start Stage {stage.number}</button>
      </div>
    </section>
  )
}

export default TacticsScreen
