import { useMemo, useState } from 'react'
import { getRaceStage, type RaceStage } from '../data/raceStages'
import { adaptSegment, strategyProfiles } from '../engine/adaptiveRide'
import { useCareer } from '../state/CareerContext'
import type { RaceStrategy } from '../types/tactics'
import { kmToMi } from '../utils/units'
import StageSectionPreview from '../components/StageSectionPreview'
import { applyDurationSelection, courseDurationOptions, durationSelectionForStage, stageDurationPlan, type DurationMode, type DurationSelection } from '../engine/durationEngine'

type TacticsScreenProps = {
  stageNumber: number
  stageData?: RaceStage
  library?: string
  onBack: () => void
  onStartRide: (strategy: RaceStrategy, duration:DurationSelection) => void
}

function TacticsScreen({ stageNumber, stageData, onBack, onStartRide }: TacticsScreenProps) {
  const { career } = useCareer()
  const [strategy, setStrategy] = useState<RaceStrategy>('Balanced')
  const [durationMode,setDurationMode]=useState<DurationMode>(career.settings.preferredRideDurationMode)
  const stage = useMemo(() => stageData ?? getRaceStage(stageNumber), [stageNumber, stageData])
  const durationPlan=useMemo(()=>stageDurationPlan(stage),[stage])
  const durationOptions=useMemo(()=>courseDurationOptions(stage),[stage])
  const [customMinutes,setCustomMinutes]=useState(durationPlan.minutes.RECOMMENDED)
  const durationSelection=useMemo(()=>durationSelectionForStage(stage,durationMode==='CUSTOM'?{mode:'CUSTOM',customMinutes}:{mode:durationMode}),[stage,durationMode,customMinutes])
  const baseSegments = useMemo(() => stage.segments.map((segment) => adaptSegment(segment, career.rider.ftp, strategy)), [stage, career.rider.ftp, strategy])
  const adaptedSegments = useMemo(() => stage.isTraining?baseSegments:applyDurationSelection(baseSegments,durationSelection).segments,[stage.isTraining,baseSegments,durationSelection])
  const minutes = Math.round(adaptedSegments.reduce((sum, segment) => sum + segment.sec, 0) / 60)
  const decisiveSegment = adaptedSegments.find((segment) => /climb|finish|attack|sprint/i.test(`${segment.type} ${segment.name}`)) ?? adaptedSegments[0]
  const profile = strategyProfiles[strategy]

  return (
    <section className="tactics-screen race-briefing-screen">
      <button type="button" onClick={onBack}>← Team Bus</button>

      <header className="compact-page-header">
        <p className="eyebrow">TEAM LORIOT • {stage.isTraining ? 'TODAY’S SESSION' : `STAGE ${stage.number}`}</p>
        <h1>{stage.isTraining ? 'Training Ride Briefing' : 'Race Briefing'}</h1>
        <p>{stage.route} • {stage.distanceKm.toFixed(1)} km / {kmToMi(stage.distanceKm).toFixed(1)} mi</p>
        <strong>SELECTED COURSE DURATION: {minutes} MIN</strong>
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

        {!stage.isTraining&&<div className="duration-picker" aria-label="Choose your ride duration"><div><p className="eyebrow">CHOOSE YOUR RIDE</p><small>How long do you want to ride this {durationPlan.classification.replaceAll('-',' ')} course?</small></div><div className="duration-options">
          {durationOptions.map(option=><button key={option.minutes} type="button" className={durationMode===option.mode?'selected':''} aria-pressed={durationMode===option.mode} onClick={()=>setDurationMode(option.mode)}><strong>{option.minutes} MIN</strong>{option.recommended&&<small>RECOMMENDED</small>}</button>)}
          <button type="button" className={durationMode==='CUSTOM'?'selected':''} aria-pressed={durationMode==='CUSTOM'} onClick={()=>setDurationMode('CUSTOM')}><strong>CUSTOM</strong><small>{Math.round(durationSelection.customMinutes??customMinutes)} MIN</small></button>
        </div>{durationMode==='CUSTOM'&&<label>Ride duration: <strong>{Math.round(durationSelection.customMinutes??customMinutes)} min</strong><input type="range" min={durationPlan.customMinMinutes} max={durationPlan.customMaxMinutes} step="5" value={customMinutes} onChange={event=>setCustomMinutes(Number(event.target.value))}/><small>Supported course range: {durationPlan.customMinMinutes}–{durationPlan.customMaxMinutes} minutes. RtR preserves the decisive sectors.</small></label>}</div>}

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

        <button type="button" className="primary-cta briefing-start" onClick={() => onStartRide(strategy,stage.isTraining?{mode:'STANDARD',targetMinutes:minutes}:durationSelection)}>🚩 {stage.isTraining ? 'Start Ride' : `Roll Out • Stage ${stage.number} • ${minutes} min`}</button>
      </section>
    </section>
  )
}

export default TacticsScreen
