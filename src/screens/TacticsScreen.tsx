import { useMemo, useState } from 'react'
import { getRaceStage } from '../data/raceStages'
import { adaptSegment, strategyProfiles } from '../engine/adaptiveRide'
import { useCareer } from '../state/CareerContext'
import type { RaceStrategy } from '../types/tactics'
import { kmToMi } from '../utils/units'
import { createStageTimeline } from '../engine/stageEngine'

type TacticsScreenProps = {
  stageNumber: number
  onBack: () => void
  onStartRide: (strategy: RaceStrategy) => void
}

function TacticsScreen({ stageNumber, onBack, onStartRide }: TacticsScreenProps) {
  const { career } = useCareer()
  const [strategy, setStrategy] = useState<RaceStrategy>('Balanced')
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const stage = useMemo(() => getRaceStage(stageNumber), [stageNumber])
  const adaptedSegments = useMemo(() => stage.segments.map((segment) => adaptSegment(segment, career.rider.ftp, strategy)), [stage, career.rider.ftp, strategy])
  const minutes = Math.round(adaptedSegments.reduce((sum, segment) => sum + segment.sec, 0) / 60)
  const decisiveSegment = adaptedSegments.find((segment) => /climb|finish|attack|sprint/i.test(`${segment.type} ${segment.name}`)) ?? adaptedSegments[0]
  const profile = strategyProfiles[strategy]
  const timeline = useMemo(() => createStageTimeline(adaptedSegments, stage.distanceKm), [adaptedSegments, stage.distanceKm])
  const preview = previewIndex === null ? null : timeline.snapshot(timeline.segmentStarts[previewIndex] + adaptedSegments[previewIndex].sec / 2)

  return (
    <section className="tactics-screen race-briefing-screen">
      <button type="button" onClick={onBack}>← Team Bus</button>

      <header className="compact-page-header">
        <p className="eyebrow">TEAM LORIOT • STAGE {stage.number}</p>
        <h1>Race Briefing</h1>
        <p>{stage.route} • {stage.distanceKm.toFixed(1)} km / {kmToMi(stage.distanceKm).toFixed(1)} mi • {minutes} min</p>
      </header>

      <section className="briefing-board">
        <div className="briefing-mission">
          <p className="eyebrow">TODAY'S MISSION</p>
          <h2>{stage.objective}</h2>
        </div>

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

        <div className="briefing-actions">
          <button type="button" className="recon-button" onClick={() => setPreviewIndex(0)}>🗺️ Preview Stage · Course Recon</button>
          <button type="button" className="primary-cta briefing-start" onClick={() => onStartRide(strategy)}>🚩 Roll Out • Stage {stage.number}</button>
        </div>
      </section>
      {preview && previewIndex !== null && (
        <div className="course-recon" role="dialog" aria-modal="true" aria-label="Read-only course recon">
          <article>
            <div className="section-title-row"><div><p className="eyebrow">COURSE RECON · READ ONLY</p><h2>Section {previewIndex + 1} of {adaptedSegments.length}</h2></div><button type="button" onClick={() => setPreviewIndex(null)}>Close</button></div>
            <p className="recon-position">Approximately {Math.round(preview.riderPosition * 100)}% into Stage {stage.number}</p>
            <h1>{preview.segment.icon} {preview.segment.name}</h1>
            <p>{preview.segment.type} · {preview.segment.terrainLabel} · {Math.round(preview.segment.sec / 60)} min</p>
            <div className="impact-grid recon-targets"><span><small>POWER</small><strong>{preview.segment.power}</strong></span><span><small>CADENCE</small><strong>{preview.segment.cadence}</strong></span><span><small>RESISTANCE</small><strong>{preview.resistanceRecommendation}</strong></span><span><small>POSITION</small><strong>{preview.segment.routeKm.toFixed(1)} km</strong></span></div>
            <section className="recon-note"><p className="eyebrow">TACTICAL PURPOSE</p><strong>{preview.segment.objective}</strong><p>{preview.segment.description}</p><small>Jean: “{preview.segment.fixed?.[0]?.text ?? preview.segment.random?.[0] ?? 'Ride this section with discipline.'}”</small></section>
            {preview.isClimb && <section className="recon-climb"><p className="eyebrow">CLIMB RECON · {preview.segment.type}</p><strong>{(preview.gradientSections.reduce((sum, item) => sum + item.gradient, 0) / preview.gradientSections.length).toFixed(1)}% average</strong><div className="recon-gradients">{preview.gradientSections.map((item, index) => <span key={index} style={{ background: item.gradient < 3 ? '#34a853' : item.gradient < 6 ? '#2684d8' : item.gradient < 9 ? '#d93636' : '#111' }}>{item.gradient}%<small>{preview.segment.resistance}</small></span>)}</div><p>Summit objective: {preview.segment.secondaryObjective}</p></section>}
            <p><strong>Coming next:</strong> {preview.nextSegment?.name ?? 'Stage finish and cooldown complete'}</p>
            <div className="recon-nav"><button type="button" disabled={previewIndex === 0} onClick={() => setPreviewIndex(previewIndex - 1)}>← Previous</button><button type="button" disabled={previewIndex === adaptedSegments.length - 1} onClick={() => setPreviewIndex(previewIndex + 1)}>Next →</button></div>
          </article>
        </div>
      )}
    </section>
  )
}

export default TacticsScreen
