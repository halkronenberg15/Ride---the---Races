import { useMemo, useState } from 'react'
import { getRaceStage, type RaceStage } from '../data/raceStages'
import { adaptSegment } from '../engine/adaptiveRide'
import { useCareer } from '../state/CareerContext'
import type { RaceStrategy } from '../types/tactics'
import { kmToMi } from '../utils/units'
import StageSectionPreview from '../components/StageSectionPreview'
import { applyDurationSelection, courseDurationOptions, durationSelectionForStage, stageDurationPlan, type DurationMode, type DurationSelection } from '../engine/durationEngine'
import { segmentPurposes } from '../engine/raceLifecycle'
import { GENERIC_MANUAL_EQUIPMENT, type EquipmentInstance } from '../engine/manualBike'
import { WorkoutAllocation } from '../components/WorkoutAllocation'
import { resolvePreviewTarget } from '../engine/previewTargets'
import { createPreRacePlan } from '../engine/preRaceLifecycle'

type TacticsScreenProps = {
  stageNumber: number
  stageData?: RaceStage
  library?: string
  onBack: () => void
  onStartRide: (strategy: RaceStrategy, duration:DurationSelection) => void
}

function TacticsScreen({ stageNumber, stageData, onBack, onStartRide }: TacticsScreenProps) {
  const { career } = useCareer()
  const [durationMode,setDurationMode]=useState<DurationMode>(career.settings.preferredRideDurationMode)
  const stage = useMemo(() => stageData ?? getRaceStage(stageNumber), [stageNumber, stageData])
  const durationPlan=useMemo(()=>stageDurationPlan(stage),[stage])
  const durationOptions=useMemo(()=>courseDurationOptions(stage),[stage])
  const [customMinutes,setCustomMinutes]=useState(durationPlan.minutes.RECOMMENDED)
  const durationSelection=useMemo(()=>durationSelectionForStage(stage,durationMode==='CUSTOM'?{mode:'CUSTOM',customMinutes}:{mode:durationMode}),[stage,durationMode,customMinutes])
  const baseSegments = useMemo(() => stage.segments.map((segment) => adaptSegment(segment, career.rider.ftp, 'Balanced')), [stage, career.rider.ftp])
  const durationResult=useMemo(()=>stage.isTraining?null:applyDurationSelection(baseSegments,durationSelection),[stage.isTraining,baseSegments,durationSelection])
  const adaptedSegments = durationResult?.segments??baseSegments
  const preRacePlan=!stage.isTraining?createPreRacePlan(adaptedSegments,durationSelection.targetMinutes??durationSelection.customMinutes??durationPlan.minutes.RECOMMENDED):null
  const briefingSegments=preRacePlan?.officialSegments??adaptedSegments
  const minutes = Math.round(adaptedSegments.reduce((sum, segment) => sum + segment.sec, 0) / 60)
  const decisiveSegment = adaptedSegments.find((segment) => /climb|finish|attack|sprint/i.test(`${segment.type} ${segment.name}`)) ?? adaptedSegments[0]
  const equipment=(career.equipment.instances.find(item=>item.id===career.equipment.activeEquipmentId)??GENERIC_MANUAL_EQUIPMENT) as EquipmentInstance
  const decisiveTarget=resolvePreviewTarget(decisiveSegment,career.rider.ftp||150,equipment,career.rider.cadencePreferences)

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

        {!stage.isTraining&&durationResult&&<WorkoutAllocation totalSeconds={durationResult.map.totalDurationSeconds} raceSeconds={durationResult.map.raceDurationSeconds} cooldownSeconds={durationResult.map.cooldownSeconds}/>}
        {preRacePlan&&<div className="pre-race-briefing" aria-label="Unnumbered pre-race staging"><strong>PRE-RACE WARM-UP · {Math.round(preRacePlan.warmupSeconds/60)}:{String(preRacePlan.warmupSeconds%60).padStart(2,'0')}</strong><span>KILOMETRE ZERO · 0:{String(preRacePlan.kilometreZeroSeconds).padStart(2,'0')}</span></div>}
        <StageSectionPreview stageNumber={stage.number} segments={briefingSegments.filter((_,index)=>segmentPurposes(briefingSegments)[index]!=='post-finish-cooldown')} measurementSystem={career.settings.measurementSystem} ftp={career.rider.ftp||150} equipment={equipment} cadencePreferences={career.rider.cadencePreferences} />

        {!stage.isTraining&&<div className="duration-picker" aria-label="Choose your ride duration"><div><p className="eyebrow">CHOOSE YOUR RIDE</p><small>How long do you want to ride this {durationPlan.classification.replaceAll('-',' ')} course?</small></div><div className="duration-options">
          {durationOptions.map(option=><button key={option.minutes} type="button" className={durationMode===option.mode?'selected':''} aria-pressed={durationMode===option.mode} onClick={()=>setDurationMode(option.mode)}><strong>{option.minutes} MIN</strong>{option.recommended&&<small>RECOMMENDED</small>}</button>)}
          <button type="button" className={durationMode==='CUSTOM'?'selected':''} aria-pressed={durationMode==='CUSTOM'} onClick={()=>setDurationMode('CUSTOM')}><strong>CUSTOM</strong><small>{Math.round(durationSelection.customMinutes??customMinutes)} MIN</small></button>
        </div>{durationMode==='CUSTOM'&&<label>Ride duration: <strong>{Math.round(durationSelection.customMinutes??customMinutes)} min</strong><input type="range" min={durationPlan.customMinMinutes} max={durationPlan.customMaxMinutes} step="5" value={customMinutes} onChange={event=>setCustomMinutes(Number(event.target.value))}/><small>Supported course range: {durationPlan.customMinMinutes}–{durationPlan.customMaxMinutes} minutes. RtR preserves the decisive sectors.</small></label>}</div>}

        <div className="briefing-columns">
          <article className="team-plan-card">
            <p className="eyebrow">{stage.isTraining?'SESSION GOALS':'JEAN’S TEAM PLAN'}</p>
            <ul>
              <li>{stage.objective}</li>
              {stage.teamOrders.map((order) => <li key={order}>{order}</li>)}
            </ul>
          </article>

          {!stage.isTraining&&<article className="workout-impact-card">
            <p className="eyebrow">KEY WORKOUT TARGET</p>
            <h3>{decisiveSegment.name}</h3>
            <div className="impact-grid">
              <span><small>POWER</small><strong>{decisiveTarget.power}</strong></span>
              <span><small>CADENCE</small><strong>{decisiveTarget.cadence}</strong></span>
              <span><small>RESISTANCE</small><strong>{decisiveTarget.resistance}</strong></span>
              <span><small>TIME</small><strong>{minutes} min</strong></span>
            </div>
          </article>}
        </div>

        <button type="button" className="primary-cta briefing-start" onClick={() => onStartRide('Balanced',stage.isTraining?{mode:'STANDARD',targetMinutes:minutes}:durationSelection)}>🚩 {stage.isTraining ? 'START RIDE' : `ROLL OUT • STAGE ${stage.number} • ${minutes} MIN`}</button>
      </section>
    </section>
  )
}

export default TacticsScreen
