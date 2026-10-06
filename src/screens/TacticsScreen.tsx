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
import { workoutById, workoutSections } from '../engine/adaptiveTraining40251.ts'

type TacticsScreenProps = {
  stageNumber: number
  stageData?: RaceStage
  library?: string
  onBack: () => void
  onStartRide: (strategy: RaceStrategy, duration:DurationSelection) => void
  backLabel?:string
}

function TacticsScreen({ stageNumber, stageData, onBack, onStartRide,backLabel }: TacticsScreenProps) {
  const { career } = useCareer()
  const [durationMode,setDurationMode]=useState<DurationMode>(career.settings.preferredRideDurationMode)
  const [intel,setIntel]=useState<'PLAN'|'COURSE'|'FINAL'|'CLIMBS'|'NOTES'>('PLAN')
  const stage = useMemo(() => stageData ?? getRaceStage(stageNumber), [stageNumber, stageData])
  const durationPlan=useMemo(()=>stageDurationPlan(stage),[stage])
  const durationOptions=useMemo(()=>courseDurationOptions(stage),[stage])
  const [customMinutes,setCustomMinutes]=useState(durationPlan.minutes.RECOMMENDED)
  const durationSelection=useMemo(()=>durationSelectionForStage(stage,durationMode==='CUSTOM'?{mode:'CUSTOM',customMinutes}:{mode:durationMode}),[stage,durationMode,customMinutes])
  const baseSegments = useMemo(() => stage.segments.map((segment) => adaptSegment(segment, career.rider.ftp??150, 'Balanced')), [stage, career.rider.ftp])
  const durationResult=useMemo(()=>stage.isTraining?null:applyDurationSelection(baseSegments,durationSelection),[stage.isTraining,baseSegments,durationSelection])
  const adaptedSegments = durationResult?.segments??baseSegments
  const preRacePlan=!stage.isTraining?createPreRacePlan(adaptedSegments,durationSelection.targetMinutes??durationSelection.customMinutes??durationPlan.minutes.RECOMMENDED):null
  const briefingSegments=preRacePlan?.officialSegments??adaptedSegments
  const minutes = Math.round(adaptedSegments.reduce((sum, segment) => sum + segment.sec, 0) / 60)
  const decisiveSegment = adaptedSegments.find((segment) => /climb|finish|attack|sprint/i.test(`${segment.type} ${segment.name}`)) ?? adaptedSegments[0]
  const equipment=(career.equipment.instances.find(item=>item.id===career.equipment.activeEquipmentId)??GENERIC_MANUAL_EQUIPMENT) as EquipmentInstance
  const decisiveTarget=resolvePreviewTarget(decisiveSegment,career.rider.ftp||150,equipment,career.rider.cadencePreferences)
  const curatedWorkout=workoutById(stage.id??''),curatedSections=curatedWorkout?workoutSections(curatedWorkout):[]
  const sessionGoals=Array.from(new Map([stage.objective,...stage.teamOrders].map(text=>[text.trim().toLowerCase().replace(/[^a-z0-9]+/g,' '),text])).values())

  return (
    <section className="tactics-screen race-briefing-screen">
      <button type="button" onClick={onBack}>← {backLabel??'Team Bus'}</button>

      <header className="compact-page-header web-race-briefing-hero">
        <div className="web-race-briefing-copy">
          <p className="eyebrow">TEAM LORIOT • {stage.isTraining ? 'TODAY’S SESSION' : `STAGE ${stage.number}`}</p>
          <h1>{stage.isTraining ? 'Training Ride Briefing' : stage.route}</h1>
          <p>{stage.isTraining?stage.route:`${stage.theme} · ${stage.distanceKm.toFixed(1)} km / ${kmToMi(stage.distanceKm).toFixed(1)} mi`}</p>
          <strong>SELECTED COURSE DURATION: {minutes} MIN</strong>
        </div>
        {!stage.isTraining&&<div className="web-race-briefing-stats">
          <span><small>DISTANCE</small><strong>{kmToMi(stage.distanceKm).toFixed(0)} mi</strong></span>
          <span><small>CLIMBING</small><strong>{stage.elevationM.toLocaleString()} m</strong></span>
          <span><small>RIDE TIME</small><strong>{minutes} min</strong></span>
        </div>}
      </header>

      <section className="briefing-board web-briefing-board">
        <div className="briefing-mission">
          <p className="eyebrow">TODAY'S MISSION</p>
          <h2>{stage.objective}</h2>
        </div>

        {!stage.isTraining&&<section className="web-route-intelligence">
          <div className="web-route-intel-tabs">
            <button type="button" className={intel==='PLAN'?'active':''} onClick={()=>setIntel('PLAN')}><span>⚡</span><strong>STAGE PLAN</strong><small>Overview · Key points</small></button>
            <button type="button" className={intel==='COURSE'?'active':''} onClick={()=>setIntel('COURSE')}><span>≈</span><strong>COURSE</strong><small>Profile · Rhythm</small></button>
            <button type="button" className={intel==='FINAL'?'active':''} onClick={()=>setIntel('FINAL')}><span>↵</span><strong>FINAL KM</strong><small>Finish · Positioning</small></button>
            <button type="button" className={intel==='CLIMBS'?'active':''} onClick={()=>setIntel('CLIMBS')}><span>△</span><strong>CLIMBS</strong><small>Targets · Strategy</small></button>
            <button type="button" className={intel==='NOTES'?'active':''} onClick={()=>setIntel('NOTES')}><span>▤</span><strong>RACE NOTES</strong><small>Fueling · Reminders</small></button>
          </div>
          <article className="web-route-intel-panel">
            {intel==='PLAN'&&<><p className="eyebrow">STAGE PLAN</p><h3>{stage.objective}</h3><ul>{sessionGoals.map(item=><li key={item}>{item}</li>)}</ul></>}
            {intel==='COURSE'&&<><p className="eyebrow">COURSE</p><h3>{stage.theme}</h3><p>{stage.profileVerified?'Official course profile loaded.':'Course profile is still being audited.'}</p><p>{stage.distanceKm.toFixed(1)} km · {stage.elevationM.toLocaleString()} m climbing</p></>}
            {intel==='FINAL'&&<><p className="eyebrow">FINAL KM</p><h3>{briefingSegments.at(-1)?.name??'Finish'}</h3><p>{briefingSegments.at(-1)?.description??briefingSegments.at(-1)?.objective??'Stay controlled into the finish.'}</p></>}
            {intel==='CLIMBS'&&<><p className="eyebrow">CLIMBS</p><h3>{decisiveSegment.name}</h3><p>{decisiveTarget.power} · {decisiveTarget.cadence} · {decisiveTarget.resistance}</p></>}
            {intel==='NOTES'&&<><p className="eyebrow">RACE NOTES</p><h3>Execution reminders</h3><ul><li>Fuel the workload before chasing weight loss.</li><li>Respect the prescribed target before adding resistance.</li><li>Use Jimmy cues as guidance, not permission to attack every rise.</li></ul></>}
          </article>
        </section>}

        {!stage.isTraining&&durationResult&&<WorkoutAllocation totalSeconds={durationResult.map.totalDurationSeconds} raceSeconds={durationResult.map.raceDurationSeconds} cooldownSeconds={durationResult.map.cooldownSeconds}/>}
        {preRacePlan&&<div className="pre-race-briefing" aria-label="Unnumbered pre-race staging"><strong>PRE-RACE WARM-UP · {Math.round(preRacePlan.warmupSeconds/60)}:{String(preRacePlan.warmupSeconds%60).padStart(2,'0')}</strong><span>KILOMETRE ZERO · 0:{String(preRacePlan.kilometreZeroSeconds).padStart(2,'0')}</span></div>}
        <StageSectionPreview training={stage.isTraining} stageNumber={stage.number} segments={briefingSegments.filter((_,index)=>segmentPurposes(briefingSegments)[index]!=='post-finish-cooldown')} measurementSystem={career.settings.measurementSystem} ftp={career.rider.ftp} equipment={equipment} cadencePreferences={career.rider.cadencePreferences} introEffortBaseline={career.rider.introEffortBaseline} />
        {curatedWorkout&&<article className="dashboard-card"><p className="eyebrow">COMPLETE WORKOUT DETAIL</p><h2>{curatedWorkout.title}</h2><p>{curatedWorkout.purpose}</p><p><strong>Structure:</strong> {curatedWorkout.repetitions} × {curatedWorkout.workIntervalMinutes} min work / {curatedWorkout.recoveryIntervalMinutes} min recovery · {curatedWorkout.durationMinutes} min total</p><p><strong>Targets:</strong> {career.rider.ftp&&curatedWorkout.ftpRange?`${Math.round(career.rider.ftp*curatedWorkout.ftpRange[0])}–${Math.round(career.rider.ftp*curatedWorkout.ftpRange[1])} W`:`${curatedWorkout.unknownFtpEffort}`} · {curatedWorkout.cadence[0]}–{curatedWorkout.cadence[1]} rpm · {curatedWorkout.resistanceGuidance}</p><p><strong>Fueling:</strong> {curatedWorkout.fueling} · <strong>Recovery cost:</strong> {curatedWorkout.recoveryCost}/5</p><details><summary>Timed sections</summary>{curatedSections.map(section=><p key={section.id}><strong>{section.title} · {Math.round(section.durationSeconds/60)} min</strong><br/>{section.zone} · {section.rpe} · {section.cadence[0]}–{section.cadence[1]} rpm · {section.resistance}</p>)}</details></article>}

        {!stage.isTraining&&<div className="duration-picker" aria-label="Choose your ride duration"><div><p className="eyebrow">CHOOSE YOUR RIDE</p><small>How long do you want to ride this {durationPlan.classification.replaceAll('-',' ')} course?</small></div><div className="duration-options">
          {durationOptions.map(option=><button key={option.minutes} type="button" className={durationMode===option.mode?'selected':''} aria-pressed={durationMode===option.mode} onClick={()=>setDurationMode(option.mode)}><strong>{option.minutes} MIN</strong>{option.recommended&&<small>RECOMMENDED</small>}</button>)}
          <button type="button" className={durationMode==='CUSTOM'?'selected':''} aria-pressed={durationMode==='CUSTOM'} onClick={()=>setDurationMode('CUSTOM')}><strong>CUSTOM</strong><small>{Math.round(durationSelection.customMinutes??customMinutes)} MIN</small></button>
        </div>{durationMode==='CUSTOM'&&<label>Ride duration: <strong>{Math.round(durationSelection.customMinutes??customMinutes)} min</strong><input type="range" min={durationPlan.customMinMinutes} max={durationPlan.customMaxMinutes} step="5" value={customMinutes} onChange={event=>setCustomMinutes(Number(event.target.value))}/><small>Supported course range: {durationPlan.customMinMinutes}–{durationPlan.customMaxMinutes} minutes. RtR preserves the decisive sectors.</small></label>}</div>}

        <div className="briefing-columns">
          <article className="team-plan-card">
            <p className="eyebrow">{stage.isTraining?'SESSION GOALS':'JEAN’S TEAM PLAN'}</p>
            <ul>
              {sessionGoals.map((order) => <li key={order}>{order}</li>)}
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
