/* eslint-disable react-hooks/exhaustive-deps, react-hooks/immutability -- radio and wake-lock callbacks intentionally read the live cockpit closure without restarting timed effects. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { getRaceStage, type RaceStage } from '../data/raceStages'
import type { RaceStrategy } from '../types/tactics'
import { adaptSegments } from '../engine/adaptiveRide'
import { useCareer } from '../state/CareerContext'
import { formatDistance, formatElevation } from '../utils/units'
import { buildJeanTimeline, isClimb, jeanCourseEventsCrossed, type JeanTimelineEvent } from '../engine/stageEngine'
import { useActiveRide } from '../state/ActiveRideContext'
import { createRoadModel, markerLabelOffset } from '../engine/roadModel'
import { jeanCue, jeanMode } from '../engine/jeanDirector'
import { canUseJeanVoice, speakAsJean } from '../services/jeanVoice'
import { createJeanEvent, JeanEventBus } from '../engine/jeanEvents'
import { CLICK_IN_CUE, PRE_RIDE_COUNTDOWN } from '../engine/preRide'
import { raceIdentities } from '../data/raceLibrary'
import { isIndividualTimeTrial, officialSegments, ttStartSnapshot } from '../engine/startArchitecture'
import { applyDurationSelection, durationSelectionForStage, type DurationSelection } from '../engine/durationEngine'
import { bikeProfileForEquipment, GENERIC_MANUAL_EQUIPMENT, type EquipmentInstance } from '../engine/manualBike'
import { competitiveEventsEligible } from '../engine/raceLifecycle'
import { applyTacticalAction, resolveTacticalTransition, type TacticalAction } from '../engine/tacticalActions'
import { type TeamRadioMessage } from '../engine/teamRadio'
import { completeCooldown, type CooldownCompletion } from '../engine/rideCompletion'
import { shouldDisplayClimb, tacticalOpportunity, tacticalPrescription, trainingMarkerPositions } from '../engine/alpha4021'
import { canonicalCoursePosition, courseContextLabel } from '../engine/alpha4023'
import { activeRaceSituation, circuitProgressToLap, meaningfulTerrainChange, mergeTerrainBlocks, synchronizeProfileView } from '../engine/alpha4022'
import { createPreRacePlan, preRaceSnapshot, skipRemainingWarmup } from '../engine/preRaceLifecycle'
import { AuthoritativeJeanBanner4023, ChaseDecisionCard, LiveTrackerHeader4023, ProfileDetail4022, TacticalStatusStrip, WorldsGroupMarkers } from '../components/WorldsRaceLayer.ts'
import { ClimbProfile4023 } from '../components/ClimbProfile4023.ts'
import { ProfileControls4023 } from '../components/ProfileControls4023.ts'
import { CourseEndpointMarkers4023, CourseFinishLabel4023, CourseFinishMarker4023 } from '../components/CourseEndpointMarkers4023.ts'
import { tacticalOfferSnapshot } from '../engine/tacticalLifecycle4023.ts'
import { targetPreview4023 } from '../engine/targetPreview4023.ts'
import { RiderMarker4023 } from '../components/RiderMarker4023.ts'
import { completionLabel, lifecycleProfileContext, resolveDetailGuidance4023 } from '../engine/cockpitPresentation4023.ts'

type RideScreenProps = {
  stageNumber: number
  stageData?: RaceStage
  library?: string
  workoutId?: string
  strategy: RaceStrategy
  durationSelection: DurationSelection
  onBack: () => void
  onFinish: (cooldown:CooldownCompletion) => void
  onEndEarly: (reason:string,snapshot:{completionPercentage:number;distanceKm:number;lifecycle:string;sector:string;completedSectors:string[];earnedMarkerIds:string[];tacticalState:string}) => void
}

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(
    seconds,
  ).padStart(2, '0')}`
}


type WakeLockSentinelLike = {
  released: boolean
  release: () => Promise<void>
  addEventListener: (
    type: 'release',
    listener: () => void,
  ) => void
}

function RideScreen({
  stageNumber, stageData, library='tour-2026', workoutId,
  strategy, durationSelection,
  onBack,
  onFinish,
  onEndEarly,
}: RideScreenProps) {
  const { career } = useCareer()
  const measurementSystem = career.settings.measurementSystem
  const stage = useMemo(() => stageData ?? getRaceStage(stageNumber), [stageNumber, stageData])
  const isWorlds=stage.raceId==='worlds-2026'
  const adaptedSegments = useMemo(() => adaptSegments(stage.segments, career.rider.ftp, strategy), [stage, career.rider.ftp, strategy])
  const resolvedDuration=useMemo(()=>durationSelectionForStage(stage,durationSelection),[stage,durationSelection])
  const timedSegments=useMemo(()=>stage.isTraining?adaptedSegments:applyDurationSelection(adaptedSegments,resolvedDuration).segments,[stage.isTraining,adaptedSegments,resolvedDuration])
  const isTimeTrial = useMemo(() => isIndividualTimeTrial(timedSegments), [timedSegments])
  const selectedMinutes=resolvedDuration.targetMinutes??resolvedDuration.customMinutes??Math.round(timedSegments.reduce((sum,item)=>sum+item.sec,0)/60)
  const preRacePlan=useMemo(()=>!stage.isTraining&&!isTimeTrial?createPreRacePlan(timedSegments,selectedMinutes):null,[stage.isTraining,isTimeTrial,timedSegments,selectedMinutes])
  const segments = useMemo(() => isTimeTrial?officialSegments(timedSegments):preRacePlan?.officialSegments??timedSegments, [timedSegments,isTimeTrial,preRacePlan])
  const equipment=(career.equipment.instances.find(item=>item.id===career.equipment.activeEquipmentId)??GENERIC_MANUAL_EQUIPMENT) as EquipmentInstance
  const activeRide = useActiveRide()
  const timeline = useMemo(() => createRoadModel(stage.number, segments, stage.distanceKm, raceIdentities[library as keyof typeof raceIdentities], stage.profilePoints, stage.officialCourseMarkers, stage.raceId, career.rider.ftp||150,equipment,career.rider.cadencePreferences), [segments, stage, library, career.rider.ftp,equipment,career.rider.cadencePreferences])
  const gateModels=useMemo(()=>preRacePlan?{
    warmup:createRoadModel(-1,[preRacePlan.warmupSegment],1,undefined,undefined,undefined,'Pre-race warm-up',career.rider.ftp||150,equipment,career.rider.cadencePreferences),
    kilometreZero:createRoadModel(-2,[preRacePlan.kilometreZeroSegment??{...preRacePlan.warmupSegment,name:'KILOMETRE ZERO',type:'Race start',zone:'Z2',power:'60–72% FTP'}],1,undefined,undefined,undefined,'Kilometre Zero',career.rider.ftp||150,equipment,career.rider.cadencePreferences),
  }:null,[preRacePlan,career.rider.ftp,equipment,career.rider.cadencePreferences])
  const profilePoints = timeline.profilePoints
  const finishProfileY=Number(profilePoints.at(-1)?.split(',')[1]??100)
  const rideElapsed = activeRide.ride?.stageNumber === stageNumber ? activeRide.elapsed : 0
  const ttStart = useMemo(() => ttStartSnapshot(timedSegments, rideElapsed), [timedSegments, rideElapsed])
  const massStart=preRacePlan?preRaceSnapshot(preRacePlan,rideElapsed,activeRide.ride?.preRaceSkipOffsetSeconds??activeRide.ride?.worldsWarmupOffsetSeconds??0):null
  const elapsedSeconds = massStart ? massStart.officialElapsed : isTimeTrial ? ttStart.officialElapsed : rideElapsed
  const rideStarted=activeRide.ride?.stageNumber===stageNumber
  const isRunning = rideStarted && activeRide.ride?.runningSince !== null
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [radioText, setRadioText] = useState(
    'Radio connected. Press Start Ride when you are ready.',
  )
  const [showDetails, setShowDetails] = useState(false)
  const [dismissedJeanMessage,setDismissedJeanMessage]=useState<string|null>(null)
  const [endingEarly,setEndingEarly]=useState(false)
  const [wakeLockStatus, setWakeLockStatus] = useState<
    'inactive' | 'requesting' | 'active' | 'unsupported' | 'blocked' | 'released'
  >('inactive')

  const lastSpokenCue = useRef('')
  const lastRandomCueTime = useRef(-999)
  const nextRandomCueTime = useRef(50)
  const previousSegmentIndex = useRef(0)
  const previousCoachingElapsed = useRef(elapsedSeconds)
  const spokenTimelineEvents = useRef(new Set<string>())
  const jeanEventBus = useRef(new JeanEventBus())
  const previousSprintPhase = useRef<string | null>(null)
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(
    null,
  )
  const isRunningRef = useRef(false)
  const didLaunchMetrics = useRef(false)
  const didFinalizeRace = useRef(false)
  const decisionLocks=useRef(new Set<string>())

  const stageDuration = timeline.duration
  const engine = timeline.roadSnapshot(elapsedSeconds)
  const coursePosition=canonicalCoursePosition(timeline,elapsedSeconds)
  const coachingTimeline = useMemo(() => buildJeanTimeline(segments, stage.distanceKm), [segments, stage.distanceKm])
  const segmentData = { index: engine.segmentIndex, segment: engine.segment, elapsedInSegment: engine.elapsedInSegment }

  const currentSegment = segmentData.segment


  const segmentRemaining = engine.segmentRemaining
  const sprintPhase = engine.sprintPhase
  const tactical=resolveTacticalTransition(activeRide.ride?.tacticalState??'PELOTON',activeRide.ride?.tacticalTransition??null,elapsedSeconds)
  const activeEffort=activeRide.ride?.activeTacticalEffort
  const effortRemaining=activeEffort?Math.max(0,activeEffort.startedAt+activeEffort.durationSeconds-elapsedSeconds):0
  const gateActive=Boolean(massStart&&massStart.phase!=='RACING')
  const gatePrescription=massStart?.phase==='PRE_RACE_WARMUP'?gateModels?.warmup.roadSnapshot(Math.max(0,preRacePlan!.warmupSeconds-massStart.warmupRemaining)).livePrescription
    :massStart&&(massStart.phase==='KILOMETRE_ZERO'||massStart.phase==='GO')?gateModels?.kilometreZero.roadSnapshot(Math.max(0,preRacePlan!.kilometreZeroSeconds-massStart.kilometreZeroRemaining)).livePrescription:null
  const activePrescription = gatePrescription??engine.livePrescription
  const warmupMultiplier=massStart?.phase==='PRE_RACE_WARMUP'&&preRacePlan
    ?.78+.17*(1-massStart.warmupRemaining/preRacePlan.warmupSeconds):1
  const tacticalMultiplier=activeEffort&&effortRemaining>0?1+activeEffort.powerDeltaPercent/100:tactical.effortMultiplier
  const displayedPrescription = tacticalPrescription(activePrescription,warmupMultiplier*tacticalMultiplier,equipment,bikeProfileForEquipment(equipment),career.rider.cadencePreferences)
  const displayPower = displayedPrescription.power
  const displayCadence = displayedPrescription.cadence
  const displayResistance = displayedPrescription.manualTarget.recommendedResistance===null?displayedPrescription.resistance:displayedPrescription.resistance.replace(/ · START \d+% @ \d+ rpm| · Start \d+%/i,'')
  const displayZone = massStart?.phase==='PRE_RACE_WARMUP'?'Z1–Z2':activePrescription.zone
  const afterKmZero = engine.lifecycle==='OFFICIAL_RACING'

  const progress = coursePosition.completion

  const routeKm = stage.distanceKm-coursePosition.remainingDistance

  const stageRemaining = engine.stageRemaining

  const riderMarkerX = coursePosition.fullProfileCoordinate * 100
  const riderMarkerY = engine.profileY

  // Verified-course climb UI follows the road coordinate, including the exact
  // summit sample; training fallback retains its authored workout semantics.
  const currentSegmentIsClimb = !gateActive&&(timeline.profileSourceKind === 'authoritative'
    ? coursePosition.currentClimbId !== null&&shouldDisplayClimb({authoredClassified:/category|summit|mountain|climb/i.test(`${currentSegment.name} ${currentSegment.type}`),averageGradient:engine.climbAverageGradient,elevationGainM:Math.max(0,engine.climbAverageGradient*engine.distanceToSummit*10),distanceKm:engine.distanceToSummit})
    : isClimb(currentSegment))

  const gradientBlocks = coursePosition.gradientSections
  const activeGradient = gateActive?0:engine.gradient
  const geographicMode=activeRide.ride?.profileGeographicMode??'FULL_STAGE'
  const upcomingClimb=timeline.climbs.find(climb=>climb.startDistance>routeKm+.000001)
  const climbApproachAvailable=!gateActive&&coursePosition.profileMode==='CLIMB_APPROACH'&&Boolean(upcomingClimb)
  const climbAvailable=currentSegmentIsClimb&&coursePosition.currentClimbId!==null||climbApproachAvailable
  const showClimbView=climbAvailable&&geographicMode==='CLIMB'
  const climbRenderPosition=currentSegmentIsClimb||!upcomingClimb?coursePosition:canonicalCoursePosition(timeline,timeline.elapsedAtCourseDistance(upcomingClimb.startDistance+.00001))
  const climbStartResistance=climbRenderPosition.currentTargets.resistance.replace(/ · START \d+% @ \d+ rpm| · Start \d+%/i,'')
  const nextBoundaryElapsed=coursePosition.distanceToNextGradientBoundary===null?null:timeline.elapsedAtCourseDistance(routeKm+coursePosition.distanceToNextGradientBoundary+.00001)
  const nextBoundaryResistance=nextBoundaryElapsed===null?'—':timeline.roadSnapshot(nextBoundaryElapsed).livePrescription.resistance.replace(/ · START \d+% @ \d+ rpm| · Start \d+%/i,'')
  const mode = jeanMode(currentSegment, isFinished)
  const firstRaceTarget=targetPreview4023(segments[0].name,segments[0].sec,timeline.roadSnapshot(0).livePrescription)
  const kilometreZeroTarget=preRacePlan&&gateModels?targetPreview4023('KILOMETRE ZERO',preRacePlan.kilometreZeroSeconds,gateModels.kilometreZero.roadSnapshot(0).livePrescription):null
  const nextSectionIndex=engine.segmentIndex+1
  const nextSectionTarget=nextSectionIndex<segments.length?targetPreview4023(segments[nextSectionIndex].name,segments[nextSectionIndex].sec,timeline.roadSnapshot(timeline.segmentStarts[nextSectionIndex]).livePrescription):null
  const gateTitle=massStart?.phase==='PRE_RACE_WARMUP'?'PRE-RACE WARM-UP':massStart?.phase==='KILOMETRE_ZERO'?'KILOMETRE ZERO':massStart?.phase==='GO'?'GO':null
  const opportunity=gateActive?null:tacticalOpportunity(currentSegment,Boolean(stage.isTraining)||Boolean(isWorlds&&isTimeTrial),Boolean(sprintPhase),engine.elapsedInSegment)
  const opportunityPreview=opportunity?tacticalPrescription(activePrescription,1+opportunity.powerDeltaPercent/100,equipment,bikeProfileForEquipment(equipment),career.rider.cadencePreferences):null
  const upNext=massStart?.phase==='PRE_RACE_WARMUP'&&preRacePlan
    ?kilometreZeroTarget
    :massStart&&(massStart.phase==='KILOMETRE_ZERO'||massStart.phase==='GO')
      ?firstRaceTarget:nextSectionTarget
  const raceSituation=isWorlds&&!isTimeTrial&&!gateActive?activeRaceSituation(stage.raceId??'',engine.courseProgress):undefined
  const worldsLap=isWorlds&&!isTimeTrial&&!gateActive?circuitProgressToLap(engine.courseProgress):null
  const profileView=activeRide.ride?.profileView??{mode:'OVERVIEW' as const,activeRangeId:null,autoConsumedIds:[]}
  const eventDecision=raceSituation?activeRide.ride?.tacticalEventHistory.find(item=>item.id===raceSituation.id):undefined
  const opportunityDecision=opportunity?activeRide.ride?.tacticalEventHistory.find(item=>item.id===opportunity.id):undefined
  const opportunityOfferedAt=opportunity?activeRide.ride?.tacticalOfferedAt?.[opportunity.id]:undefined
  const opportunityOffer=tacticalOfferSnapshot(opportunityOfferedAt??elapsedSeconds,elapsedSeconds,opportunityDecision?.decision)
  const opportunityRemaining=opportunityOffer.remaining
  const responseRemaining=raceSituation?Math.max(0,raceSituation.responseWindowSeconds-(elapsedSeconds-timeline.elapsedAtCourseDistance(raceSituation.trigger*stage.distanceKm))):0
  const raceAction=raceSituation?.actions.includes('ATTACK')?'ATTACK' as const:raceSituation?.actions.includes('CHASE')?'CHASE' as const:null
  const chaseOffered=Boolean(raceAction&&!eventDecision&&!activeEffort&&tactical.state==='PELOTON'&&responseRemaining>0)
  const mergedGradientBlocks=mergeTerrainBlocks(gradientBlocks.map((block,index)=>({start:block.start,end:block.end,gradient:block.gradient,name:`Terrain ${index+1}`})))
  const meaningfulGradient=mergedGradientBlocks.some((block,index)=>index>0&&meaningfulTerrainChange(mergedGradientBlocks[index-1].gradient,block.gradient))
  const detailEligible=isWorlds&&!gateActive&&!chaseOffered&&(Boolean(activeEffort)||Boolean(sprintPhase)||meaningfulGradient||/final drive|repeated|final sprint/i.test(currentSegment.name))
  const detailEvent=raceSituation?.detailRangeId?raceSituation:detailEligible?{id:`terrain-${currentSegment.name}`,trigger:engine.sectionStartCourseDistance/stage.distanceKm,expiry:engine.sectionEndCourseDistance/stage.distanceKm,caption:'Terrain detail ahead.',groupState:'COURSE',simulatedGap:'AUTHORED',actions:[],responseWindowSeconds:20,effortDurationSeconds:60,preview:{powerMultiplier:1,cadence:90},accepted:{powerMultiplier:1,caption:''},decline:'BASE_PRESCRIPTION' as const,resolutionCaption:'',detailRangeId:`terrain-${engine.segmentIndex}`}:undefined
  const detailStart=profileView.mode==='DETAIL'&&detailEvent?Math.max(0,detailEvent.trigger*100-2):0
  const detailWidth=profileView.mode==='DETAIL'&&detailEvent?Math.max(4,Math.min(100-detailStart,(detailEvent.expiry-detailEvent.trigger)*100+4)):100
  const profileViewBox=`${detailStart} 0 ${detailWidth} 100`
  const displayX=(canonicalPercent:number)=>((canonicalPercent-detailStart)/detailWidth)*100
  const localGradientProgress=Math.max(0,Math.min(1,engine.elapsedInSegment/Math.max(1,currentSegment.sec)))
  const detailGradientIndex=Math.max(0,mergedGradientBlocks.findIndex(block=>localGradientProgress>=block.start&&localGradientProgress<block.end))
  const detailGuidance=resolveDetailGuidance4023(coursePosition.nextGradientSection?.gradient??null,coursePosition.distanceToNextGradientBoundary,coursePosition.gradientBoundaryCrossing)
  const racingCourseContext=courseContextLabel(currentSegment.name,activeGradient)
  const courseContext=lifecycleProfileContext(rideStarted,massStart?.phase,racingCourseContext)
  const chasePreview=raceAction&&raceSituation?tacticalPrescription(activePrescription,raceSituation.preview.powerMultiplier,equipment,bikeProfileForEquipment(equipment),career.rider.cadencePreferences):null
  const radioHistory=activeRide.ride?.radioHistory??[]
  const nextCompetitionMarker=timeline.markers.find(marker=>(marker.type==='sprint'||marker.type==='kom')&&marker.position>engine.courseProgress)
  const crossedSplits=timeline.markers.filter(marker=>marker.type==='time-check'&&marker.position<=engine.courseProgress)
  const nextSplit=timeline.markers.find(marker=>marker.type==='time-check'&&marker.position>engine.courseProgress)

  useEffect(()=>{if(!activeRide.ride||!massStart||!preRacePlan)return;if(activeRide.ride.preRacePhase!==massStart.phase||activeRide.ride.kilometreZeroDurationSeconds!==preRacePlan.kilometreZeroSeconds||activeRide.ride.officialStarted!==(massStart.phase==='RACING'))activeRide.updateRide({preRacePhase:massStart.phase,kilometreZeroDurationSeconds:preRacePlan.kilometreZeroSeconds,officialStarted:massStart.phase==='RACING'})},[massStart?.phase,preRacePlan?.kilometreZeroSeconds])
  useEffect(()=>{if(tactical.state!==activeRide.ride?.tacticalState||tactical.transition?.progress!==activeRide.ride?.tacticalTransition?.progress)activeRide.updateRide({tacticalState:tactical.state,tacticalTransition:tactical.transition})},[tactical.state,tactical.transition?.progress])
  useEffect(()=>{if(!activeRide.ride)return;if(chaseOffered&&raceSituation&&activeRide.ride.pendingTacticalEventId!==raceSituation.id)activeRide.updateRide({pendingTacticalEventId:raceSituation.id,tacticalOfferedAt:{...activeRide.ride.tacticalOfferedAt,[raceSituation.id]:activeRide.ride.tacticalOfferedAt[raceSituation.id]??elapsedSeconds}});else if(!chaseOffered&&activeRide.ride.pendingTacticalEventId&&activeRide.ride.pendingTacticalEventId!==activeEffort?.eventId)activeRide.updateRide({pendingTacticalEventId:null})},[chaseOffered,raceSituation?.id,activeEffort?.eventId])
  useEffect(()=>{if(!activeRide.ride||!activeEffort||effortRemaining>0)return;activeRide.updateRide({activeTacticalEffort:null,tacticalState:'RETURNING_TO_PELOTON',tacticalTransition:{startedAt:activeEffort.startedAt+activeEffort.durationSeconds,durationSeconds:45,from:activeEffort.action==='ATTACK'?'ATTACKING':'CHASING',progress:0}});speak('Ease progressively. We return to peloton intensity safely.','chase-return')},[activeEffort?.eventId,effortRemaining])
  useEffect(()=>{if(!activeRide.ride||!raceSituation||!raceAction||eventDecision||responseRemaining>0)return;activeRide.updateRide({pendingTacticalEventId:null,tacticalEventHistory:[...activeRide.ride.tacticalEventHistory,{id:raceSituation.id,decision:'declined',at:elapsedSeconds}]})},[raceSituation?.id,responseRemaining,eventDecision?.decision])
  useEffect(()=>{if(!activeRide.ride||!opportunity||opportunityDecision||opportunityOfferedAt!==undefined)return;activeRide.updateRide({pendingTacticalEventId:opportunity.id,tacticalOfferedAt:{...activeRide.ride.tacticalOfferedAt,[opportunity.id]:elapsedSeconds}})},[opportunity?.id,opportunityDecision?.decision,opportunityOfferedAt,elapsedSeconds])
  useEffect(()=>{if(!activeRide.ride||!opportunity||opportunityDecision||opportunityOfferedAt===undefined||opportunityOffer.state!=='EXPIRED')return;activeRide.updateRide({pendingTacticalEventId:null,tacticalEventHistory:[...activeRide.ride.tacticalEventHistory,{id:opportunity.id,decision:'expired',at:elapsedSeconds}]})},[opportunity?.id,opportunityDecision?.decision,opportunityOfferedAt,opportunityOffer.state])
  useEffect(()=>{if(!activeRide.ride||!isWorlds)return;const next=synchronizeProfileView(profileView,chaseOffered?undefined:detailEvent,currentSegment.type==='Cooldown');if(next.mode!==profileView.mode||next.activeRangeId!==profileView.activeRangeId||next.autoConsumedIds.length!==profileView.autoConsumedIds.length)activeRide.updateRide({profileView:next})},[detailEvent?.id,currentSegment.type,isWorlds])
  useEffect(()=>{
    if(!activeRide.ride)return
    const transitionId=gateActive?null:coursePosition.currentClimbId??(climbApproachAvailable&&upcomingClimb?`approach-${upcomingClimb.id}`:null)
    if(transitionId&&activeRide.ride.profileAutoTransitionId!==transitionId){activeRide.updateRide({profileGeographicMode:'CLIMB',profileAutoTransitionId:transitionId});return}
    if(!transitionId&&activeRide.ride.profileGeographicMode==='CLIMB')activeRide.updateRide({profileGeographicMode:'FULL_STAGE'})
  },[coursePosition.currentClimbId,climbApproachAvailable,upcomingClimb?.id,activeRide.ride?.profileAutoTransitionId,activeRide.ride?.profileGeographicMode])
  useEffect(()=>{if(engine.lifecycle!=='OFFICIAL_RACING'||!activeRide.ride)return;const crossed=timeline.markers.filter(marker=>(marker.type==='sprint'||marker.type==='kom'||(isWorlds&&isTimeTrial&&marker.type==='time-check'))&&marker.position<=engine.courseProgress&&!activeRide.ride!.earnedMarkerIds.includes(marker.key));if(crossed.length){activeRide.updateRide({earnedMarkerIds:[...activeRide.ride.earnedMarkerIds,...crossed.map(marker=>marker.key)]});const marker=crossed.at(-1)!;speak(marker.type==='time-check'?`${marker.label} recorded.`:`${marker.type==='kom'?`KOM ${marker.category??''}`:'Intermediate sprint'} crossed. ${marker.points??0} points earned.`,`marker-${marker.key}`)}},[engine.courseProgress,engine.lifecycle,isWorlds,isTimeTrial])
  useEffect(()=>{if(!engine.raceFinished||didFinalizeRace.current)return;didFinalizeRace.current=true;activeRide.updateRide({tacticalState:'PELOTON',tacticalTransition:null});speak(isWorlds?'Across the line. The race is finished. Begin your recovery cooldown.':'Across the line. Results and points are final. Begin your recovery cooldown.')},[engine.raceFinished,isWorlds])

  useEffect(() => {
    if (!isRunning || !isTimeTrial || ttStart.official) return
    const cue = ttStart.state === 'start-gate' && Math.ceil(ttStart.remaining) === 30
      ? 'Thirty seconds. Into the start gate.'
      : ttStart.state.startsWith('countdown-') ? ttStart.state.replace('countdown-', '')
      : null
    if (cue && lastSpokenCue.current !== `tt-${cue}`) {
      lastSpokenCue.current = `tt-${cue}`
      speak(cue)
    }
  }, [isRunning, isTimeTrial, ttStart.official, ttStart.remaining, ttStart.state])

  function timelineMessage(event: JeanTimelineEvent) {
    const eventSegment = segments[event.segmentIndex]
    if (event.type === 'climb-approach') return `${eventSegment.name} in one minute. Settle your breathing and prepare the gear.`
    if (event.type === 'kilometre-zero-warning') return 'Thirty seconds to Kilometre Zero. Move up and prepare for the flag.'
    if (event.type === 'kilometre-zero') return 'Kilometre Zero. Flag down—racing begins now.'
    if (event.type === 'sprint-approach') return 'Intermediate sprint in one minute. Protect the wheel and choose your move.'
    if (event.type === 'sprint') return 'Intermediate sprint now. Commit through the line.'
    if (event.type === 'climb-entry') return `${eventSegment.name} begins now. Ride the gradient, calm and controlled.`
    if (event.type === 'summit-minute') return 'Approximately one minute to the summit. Hold your rhythm over the crest.'
    if (event.type === 'summit') return 'Summit. Good work. Ride through the crest before you recover.'
    if (event.type === 'descent') return 'Descent now. Release the pressure, stay smooth, and drink.'
    if (event.type === 'recovery') return 'Recovery sector. Breathe, drink, and reset for the next instruction.'
    if (event.type === 'finish-approach') return 'One minute to the stage finish. Stay composed and finish the plan.'
    if (event.type === 'finish') return 'Across the line. Stage complete.'
    return `${eventSegment.name}. ${eventSegment.description}`
  }

  function speak(text: string, eventId = `ride-${stage.number}-${segmentData.index}-${text}`) {
    jeanEventBus.current.dispatch(createJeanEvent(eventId, 'coaching', text),
      event => {setRadioText(event.message);setDismissedJeanMessage(null);const message:TeamRadioMessage={id:event.id,text:event.message,priority:'coaching',createdAt:new Date().toISOString()};if(activeRide.ride&&!activeRide.ride.radioHistory.some(item=>item.id===message.id))activeRide.updateRide({radioHistory:[...activeRide.ride.radioHistory,message].slice(-50)})},
      event => {
        if (!canUseJeanVoice()) { console.info(`[Jean] speech unavailable: ${event.id}`); return false }
        speakAsJean(event.message, undefined, career.settings.jeanVoiceVolume)
        return true
      }, {
        courseDistance: engine.courseDistance,
        activeClimbId: engine.activeClimbId,
        summitDistance: engine.summitDistance,
        climbProgress: engine.climbProgress,
      })
  }



  async function requestWakeLock() {
    const navigatorWithWakeLock = navigator as Navigator & {
      wakeLock?: {
        request: (
          type: 'screen',
        ) => Promise<WakeLockSentinelLike>
      }
    }

    if (!navigatorWithWakeLock.wakeLock) {
      setWakeLockStatus('unsupported')
      return
    }

    if (
      document.visibilityState !== 'visible' ||
      wakeLockRef.current
    ) {
      return
    }

    try {
      setWakeLockStatus('requesting')
      const sentinel =
        await navigatorWithWakeLock.wakeLock.request(
          'screen',
        )

      wakeLockRef.current = sentinel
      setWakeLockStatus('active')

      sentinel.addEventListener('release', () => {
        wakeLockRef.current = null

        if (isRunningRef.current) {
          setWakeLockStatus('released')
        }
      })
    } catch {
      setWakeLockStatus('blocked')
    }
  }

  async function releaseWakeLock() {
    const sentinel = wakeLockRef.current
    wakeLockRef.current = null

    if (sentinel && !sentinel.released) {
      try {
        await sentinel.release()
      } catch {
        // Safari may release it automatically when the tab is hidden.
      }
    }

    setWakeLockStatus('inactive')
  }

  useEffect(() => {
    isRunningRef.current = isRunning
    if(isRunning&&document.visibilityState==='visible')queueMicrotask(()=>void requestWakeLock())
    else if(!isRunning)queueMicrotask(()=>void releaseWakeLock())
  }, [isRunning])

  useEffect(() => {
    if (!isRunning || isFinished || gateActive) {
      return
    }

    const secondInSegment = Math.floor(
      segmentData.elapsedInSegment,
    )

    const fixedCue = currentSegment.fixed?.find(
      (cue) => cue.at === secondInSegment,
    )

    if (fixedCue) {
      const cueKey = `${segmentData.index}-${fixedCue.at}`

      if (lastSpokenCue.current !== cueKey) {
        lastSpokenCue.current = cueKey
        lastRandomCueTime.current = secondInSegment
        speak(fixedCue.text)
      }

      return
    }

    const randomCues = currentSegment.random ?? []

    if (
      randomCues.length > 0 &&
      secondInSegment >= nextRandomCueTime.current &&
      secondInSegment - lastRandomCueTime.current > 35 &&
      currentSegment.sec - secondInSegment > 35
    ) {
      const randomCue = jeanCue(mode, undefined, [radioText], secondInSegment, { afterKmZero, running: isRunning, sprintPhase: sprintPhase?.name })

      speak(randomCue)
      lastRandomCueTime.current = secondInSegment
      nextRandomCueTime.current =
        secondInSegment +
        45 +
        ((secondInSegment * 37 + segmentData.index * 17) % 55)
    }
  }, [
    currentSegment,
    isFinished,
    isRunning,
    segmentData.elapsedInSegment,
    segmentData.index,
    mode,
    radioText,
    afterKmZero,
    sprintPhase?.name,
  ])

  useEffect(() => {
    const name = sprintPhase?.name ?? null
    if (!isRunning || !competitiveEventsEligible(engine.lifecycle) || !name || previousSprintPhase.current === name) return
    previousSprintPhase.current = name
    speak(jeanCue('sprint', undefined, [radioText], engine.segmentIndex + sprintPhase!.index, { afterKmZero, running: true, sprintPhase: name, critical: name === 'SPRINT' }))
  }, [sprintPhase?.name, isRunning])

  useEffect(() => {
    if (!isRunning) return
    const event = engine.events.find((item) => item === 'final-30' || item === 'final-10')
    if (!event) return
    const cueKey = `${engine.segmentIndex}-${event}`
    if (lastSpokenCue.current === cueKey) return
    lastSpokenCue.current = cueKey
    speak(jeanCue(mode, event))
  }, [engine.events, engine.segmentIndex, isRunning, mode])

  useEffect(() => {
    const previous = previousCoachingElapsed.current
    previousCoachingElapsed.current = elapsedSeconds
    if (!isRunning || elapsedSeconds <= previous) return
    const previousDistance = timeline.roadSnapshot(previous).courseDistance
    const crossed = jeanCourseEventsCrossed(coachingTimeline, previousDistance, engine.courseDistance, previous, elapsedSeconds)
      .filter((event) => event.type !== 'sector-entry' && !spokenTimelineEvents.current.has(event.key))
      .filter(event=>competitiveEventsEligible(engine.lifecycle)||['kilometre-zero','kilometre-zero-warning','finish'].includes(event.type))
    // Navigation/resume can cross historical cues. Only a fresh road event is eligible.
    const event = crossed.filter((item) => elapsedSeconds - item.at <= 5).at(-1)
    if (!event) return
    crossed.forEach((item) => spokenTimelineEvents.current.add(item.key))
    speak(timelineMessage(event), `${library}-stage${stage.number}-${event.key}`)
  }, [coachingTimeline, elapsedSeconds, isRunning])

  useEffect(() => {
    if (
      previousSegmentIndex.current === segmentData.index
    ) {
      return
    }

    previousSegmentIndex.current = segmentData.index
    lastSpokenCue.current = ''
    lastRandomCueTime.current = -999
    nextRandomCueTime.current =
      45 + Math.floor(Math.random() * 45)


    if (!isRunning) return
    if (coachingTimeline.some((event) => event.at === timeline.segmentStarts[segmentData.index] && event.type !== 'sector-entry')) return

    const announcementTimer = window.setTimeout(() => {
      speak(`${currentSegment.name}. ${currentSegment.description}`)
    }, 0)

    return () => window.clearTimeout(announcementTimer)
  }, [
    currentSegment.description,
    currentSegment.name,
    isRunning,
    segmentData.index,
    coachingTimeline,
    timeline.segmentStarts,
  ])

  useEffect(() => {
    if (
      elapsedSeconds < stageDuration ||
      isFinished
    ) {
      return
    }

    const completionTimer = window.setTimeout(() => {
      activeRide.pause()
      setIsFinished(true)
      void releaseWakeLock()

      speak(
        `Stage ${stage.number} complete, Hal. Excellent work. Team Loriot is proud of that ride.`,
      )
      if (!didLaunchMetrics.current) {
        didLaunchMetrics.current = true
        window.setTimeout(()=>onFinish(completeCooldown(timeline.raceFinishTime,timeline.duration,elapsedSeconds,false)), 1200)
      }
    }, 0)

    return () => window.clearTimeout(completionTimer)
  }, [elapsedSeconds, isFinished, onFinish, stage.number, stageDuration])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        isRunningRef.current
      ) {
        void requestWakeLock()
      } else if(document.visibilityState!=='visible')void releaseWakeLock()
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )
    }
  }, [])

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }

      void releaseWakeLock()
    }
  }, [])

  function handleStart() {
    if (isFinished || countdown !== null) return
    if (activeRide.ride) {
      activeRide.resume()
      speak(gateActive?'Radio reconnected. Continue the prescribed pre-race sequence.':`Radio reconnected. ${currentSegment.name}. ${currentSegment.description}`)
      void requestWakeLock()
      return
    }
    activeRide.begin(stageNumber, strategy, library, workoutId, resolvedDuration)
    speak(CLICK_IN_CUE)
    setCountdown(PRE_RIDE_COUNTDOWN[0])
    let value: number = PRE_RIDE_COUNTDOWN[0]
    const timer = window.setInterval(() => {
      value -= 1
      if (value === 0) {
        window.clearInterval(timer)
        setCountdown(null)
        activeRide.resume()
        void requestWakeLock()
            window.setTimeout(() => speak(preRacePlan?'Pre-race warm-up active. Open the legs progressively; Kilometre Zero follows.':`Stage ${stage.number}, ${stage.title}, ${stage.route}. We ride ${strategy.toLowerCase()} today. Team objective: ${stage.objective}`), 1200)
      } else setCountdown(value)
    }, 1000)
  }

  function handlePause() {
    activeRide.pause()
    void releaseWakeLock()
    speak('Stage paused. Keep the legs moving gently.')
  }

  function skipPreRaceWarmup(){
    if(!activeRide.ride||!preRacePlan||massStart?.phase!=='PRE_RACE_WARMUP'||!window.confirm('Skip the pre-race warm-up and move to Kilometre Zero?'))return
    const offset=skipRemainingWarmup(preRacePlan,rideElapsed,activeRide.ride.preRaceSkipOffsetSeconds??0)
    activeRide.updateRide({preRaceSkipOffsetSeconds:offset,worldsWarmupOffsetSeconds:isWorlds?offset:activeRide.ride.worldsWarmupOffsetSeconds})
    speak('Kilometre Zero. Hold position and prepare for GO.','pre-race-skip-to-km0')
  }


  function handleRestart() {
    activeRide.end()
    setIsFinished(false)
    setShowDetails(false)
    setRadioText('Radio connected. Press Start Ride when you are ready.')
    previousSegmentIndex.current = 0
    lastSpokenCue.current = ''
    spokenTimelineEvents.current.clear()
    previousCoachingElapsed.current = 0
    didLaunchMetrics.current = false
    void releaseWakeLock()
  }

  function handleBack() {
    if(activeRide.ride&&!isFinished&&!window.confirm('Leave the cockpit? Your active ride will remain saved.'))return
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    void releaseWakeLock()
    onBack()
  }

  function chooseTactic(action:TacticalAction){const next=applyTacticalAction(tactical.state,action,elapsedSeconds);activeRide.updateRide({tacticalState:next.state,tacticalTransition:next.transition});speak(action==='RETURN_TO_PELOTON'?'Ease progressively. We return to peloton intensity safely.':`${action.replaceAll('_',' ')}. Commit to the effort.`)}
  function decideOpportunity(accepted:boolean){
    if(!activeRide.ride||!opportunity||opportunityDecision||decisionLocks.current.has(opportunity.id))return
    decisionLocks.current.add(opportunity.id)
    const history=[...activeRide.ride.tacticalEventHistory,{id:opportunity.id,decision:accepted?'accepted':'declined',at:elapsedSeconds}]
    activeRide.updateRide({pendingTacticalEventId:null,tacticalEventHistory:history,...(accepted?{tacticalState:opportunity.action==='ATTACK'?'ATTACKING' as const:'CHASING' as const,tacticalTransition:null,activeTacticalEffort:{eventId:opportunity.id,startedAt:elapsedSeconds,durationSeconds:opportunity.durationSeconds,powerDeltaPercent:opportunity.powerDeltaPercent,action:opportunity.action==='ATTACK'?'ATTACK' as const:'CHASE' as const}}:{})})
    speak(accepted?'Attack. Commit for one minute.':'Hold position. Keep the road prescription.',`${opportunity.id}-${accepted?'accepted':'declined'}`)
  }
  function decideSituation(decision:'accepted'|'declined'){
    if(!raceSituation||!activeRide.ride||eventDecision||decisionLocks.current.has(raceSituation.id))return
    decisionLocks.current.add(raceSituation.id)
    const tacticalPatch=decision==='accepted'?{tacticalState:raceAction==='ATTACK'?'ATTACKING' as const:'CHASING' as const,tacticalTransition:null,activeTacticalEffort:{eventId:raceSituation.id,startedAt:elapsedSeconds,durationSeconds:raceSituation.effortDurationSeconds,powerDeltaPercent:Math.round((raceSituation.preview.powerMultiplier-1)*100),action:raceAction==='ATTACK'?'ATTACK' as const:'CHASE' as const}}:{}
    activeRide.updateRide({pendingTacticalEventId:null,tacticalEventHistory:[...activeRide.ride.tacticalEventHistory,{id:raceSituation.id,decision,at:elapsedSeconds}],...tacticalPatch})
    speak(decision==='accepted'?raceSituation.accepted.caption:'Hold position. Keep the base prescription.',`${raceSituation.id}-${decision}`)
  }
  function confirmEndEarly(reason:string){activeRide.pause();onEndEarly(reason,{completionPercentage:progress,distanceKm:routeKm,lifecycle:engine.lifecycle,sector:currentSegment.name,completedSectors:segments.slice(0,engine.segmentIndex).map(item=>item.name),earnedMarkerIds:activeRide.ride?.earnedMarkerIds??[],tacticalState:tactical.state})}
  function finishCooldown(skipped:boolean){activeRide.pause();onFinish(completeCooldown(timeline.raceFinishTime,timeline.duration,elapsedSeconds,skipped))}

  const wakeLockLabel = wakeLockStatus === 'active'
    ? 'Screen awake'
    : wakeLockStatus === 'unsupported' ? 'Wake lock unsupported · Keep Auto-Lock disabled'
    : wakeLockStatus === 'blocked' ? 'Wake lock unavailable · Keep Auto-Lock disabled'
    : wakeLockStatus === 'released' ? 'Wake lock released · Keep Auto-Lock disabled'
    : 'Screen sleep allowed · Keep Auto-Lock disabled'



  return (
    <section className={`ride-screen ride-cockpit${rideStarted&&(!massStart||massStart.phase==='GO'||massStart.phase==='RACING')?' official-cockpit':''}`}>
      <style>{`
        .ride-cockpit {
          max-width: 1000px;
          margin: 0 auto;
          padding: 18px 18px calc(56px + var(--safe-bottom));
          position: relative;
          scroll-padding-block: var(--protected-top) calc(96px + var(--safe-bottom));
        }

        .ride-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .leave-cockpit { min-width:44px; min-height:44px; }
        .cockpit-badges { display:flex; gap:8px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }

        .live-profile-card {
          margin-top: 10px;
          padding: 14px 16px 12px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.14);
          background: linear-gradient(160deg, rgba(255,255,255,0.055), rgba(0,0,0,0.22));
          overflow: hidden;
        }

        .master-stage-profile {
          position: sticky;
          top: var(--safe-top);
          z-index: 30;
          background: rgba(13,13,13,.96);
          backdrop-filter: blur(16px);
          box-shadow: 0 12px 35px rgba(0,0,0,.4);
          isolation: isolate;
          margin-bottom: 10px;
        }

        .master-stage-profile .live-profile-wrap { height: 86px; }
        .profile-status-regions{min-width:0}.profile-status-regions>.eyebrow{white-space:nowrap}.profile-progress-row{display:flex;gap:10px;white-space:nowrap}.climb-approach{display:flex;gap:8px;align-items:center;font-size:.75rem}.climb-approach strong{flex:1}.profile-rider{z-index:12}

        .race-marker { position:absolute; transform:translate(-50%,-100%); z-index:3; font-size:.5rem; font-weight:900; letter-spacing:.03em; text-align:center; text-shadow:0 1px 3px #000; white-space:nowrap; }
        .race-marker b { position:absolute; bottom:30px; left:0; display:block; font:inherit; }
        .race-marker i { display:block; width:3px; height:28px; margin:2px auto 0; background:currentColor; box-shadow:0 0 4px #000; }

        .live-profile-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 6px;
        }

        .live-profile-wrap {
          position: relative;
          height: 116px;
        }

        .profile-end-marker{position:absolute;bottom:0;z-index:10;font-size:.58rem;font-weight:900;pointer-events:none}.profile-end-marker.start{left:0}.profile-end-marker.start b{position:absolute;left:8px;bottom:22px;white-space:nowrap}.profile-end-marker.start.compact{font-size:0}.profile-end-marker.finish{right:3px;transform:translateX(-2px);text-align:right}.profile-end-marker i{display:block;height:20px;border-left:2px solid currentColor}.profile-end-marker.finish i{margin-left:auto}
        .climb-profile-4023{height:160px;display:grid;grid-template-rows:auto auto minmax(58px,1fr);gap:4px;color:#fff}.climb-profile-4023 header{display:flex;justify-content:space-between;gap:8px;font-size:.76rem}.climb-guidance{display:grid;grid-template-columns:1fr 1fr .8fr;gap:5px}.climb-guidance>span{min-width:0;padding:5px 7px;border-radius:8px;background:rgba(255,255,255,.07)}.climb-guidance small,.climb-guidance strong,.climb-guidance b{display:block}.climb-guidance strong{font-size:1.1rem}.climb-guidance b{font-size:.62rem;white-space:nowrap}.climb-svg-region{position:relative;min-height:82px}.climb-svg-region svg{width:100%;height:100%;display:block;overflow:visible}.climb-svg-region g.completed{opacity:.4;filter:saturate(.3)}.climb-svg-region g.current{opacity:1;filter:drop-shadow(0 0 4px rgba(255,255,255,.8))}.climb-svg-region g.upcoming{opacity:.72}.climb-rider{position:absolute;z-index:30;transform:translate(-50%,-72%);font-size:1.55rem;filter:drop-shadow(0 0 2px #fff) drop-shadow(0 2px 4px #000);pointer-events:none}.profile-control-footer{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;min-height:44px;margin-top:auto;padding:4px 52px 0 0;position:relative;z-index:40}.profile-control-footer button{display:inline-flex;align-items:center;justify-content:center;width:100%;min-height:44px;min-width:0;padding:6px 8px;border:1px solid #ff9a4d;background:#512000!important;color:#fff!important;font-size:.7rem;font-weight:900;line-height:1;white-space:nowrap;opacity:1}.profile-control-footer button:focus-visible{outline:3px solid #fff;outline-offset:2px}.profile-control-footer button[aria-pressed=true]{background:#f46a00!important;color:#111!important}.profile-control-footer button:only-child{grid-column:1/-1}.live-profile-card{height:330px;display:flex;flex-direction:column}.profile-detail-4022{position:relative!important;inset:auto!important;height:190px;margin:0!important;padding:8px!important;z-index:7;color:#fff!important;background:#081422!important;overflow:hidden}.profile-detail-4022 *{color:#fff!important}.profile-detail-4022 .detail-gradient-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));height:auto!important;margin:0!important;gap:5px}.profile-detail-4022 .detail-gradient-summary span{min-width:0;padding:6px!important;background:#132942}.profile-detail-4022 .detail-gradient-summary strong{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:anywhere}.profile-detail-4022 .detail-gradient-blocks{display:none!important}.profile-caption{max-height:54px;overflow:hidden}.profile-progress-row{padding-right:4px}.live-profile-wrap svg{pointer-events:none}.rider-glyph{display:inline-block;transform:scaleX(-1);transform-origin:center}.summit-metrics{padding-right:52px}.profile-status-regions{padding-right:52px}

        .ride-countdown { position: fixed; inset: 0; z-index: 3000; display: grid; place-content: center; gap: 18px; text-align: center; background: rgba(7,8,10,.94); }
        .ride-countdown strong { font-size: min(42vw, 15rem); line-height: .8; color: #f46a00; font-variant-numeric: tabular-nums; }
        .ride-countdown span { font-weight: 900; letter-spacing: .16em; }

        .cockpit-card {
          margin-top: 8px;
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(244,106,0,0.42);
          background: linear-gradient(145deg, rgba(244,106,0,0.12), rgba(255,255,255,0.03));
          box-shadow: 0 20px 50px rgba(0,0,0,0.22);
        }

        .cockpit-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
        }

        .cockpit-title {
          margin: 2px 0 0;
          font-size: clamp(1.6rem, 5vw, 2.7rem);
          line-height: 1.03;
        }

        .segment-clock {
          text-align: center;
          margin: 16px 0 14px;
        }

        .segment-clock strong {
          display: block;
          font-size: clamp(3.6rem, 13vw, 6.5rem);
          line-height: .88;
          letter-spacing: -.06em;
          font-variant-numeric: tabular-nums;
        }

        .target-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .target-tile {
          min-width: 0;
          padding: 16px 10px;
          border-radius: 16px;
          text-align: center;
          background: rgba(0,0,0,0.24);
          border: 1px solid rgba(255,255,255,0.11);
        }

        .target-tile small {
          display: block;
          opacity: .66;
          letter-spacing: .08em;
          font-weight: 800;
        }

        .target-tile strong {
          display: block;
          margin-top: 7px;
          font-size: clamp(1.35rem, 4vw, 2.1rem);
          line-height: 1.08;
          word-break: normal;
          overflow-wrap: anywhere;
        }

        .cockpit-sections { display:grid; grid-template-columns:.85fr 1.15fr; gap:8px; margin-top:9px; }
        .cockpit-section { padding:9px 11px; border-radius:12px; background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.1); min-width:0; }
        .cockpit-section.current { border-color:#f46a00; box-shadow:inset 3px 0 #f46a00; background:rgba(244,106,0,.1); }
        .cockpit-section small,.cockpit-section strong { display:block; color:#fff; }
        .cockpit-section small { opacity:.72; font-size:.65rem; letter-spacing:.08em; }.cockpit-section strong{margin-top:3px;font-size:.9rem;line-height:1.2}
        .action-meta { margin-top:3px; color:#d8d8dc; font-size:.72rem; line-height:1.25; }
        .action-targets { display:grid; grid-template-columns:1fr; gap:1px; margin-top:5px; color:#fff; font-size:.7rem; font-weight:750; }
        .overlay-targets { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:18px; }
        .overlay-targets div { padding:12px 5px; border-radius:12px; background:rgba(255,255,255,.07); }
        .overlay-targets small,.overlay-targets strong{display:block}.overlay-targets strong{margin-top:5px;font-size:clamp(.9rem,3vw,1.25rem)}

        .radio-strip {
          margin-top: 12px;
          padding: 13px 15px;
          border-radius: 14px;
          border-left: 4px solid #f46a00;
          background: rgba(255,255,255,0.05);
        }
        .profile-caption{min-height:48px;margin-top:8px;padding:9px 44px 9px 12px;position:relative;border-radius:10px;background:rgba(0,0,0,.84);color:#fff}.profile-caption button{position:absolute;right:3px;top:2px;min-width:44px;min-height:44px}.tactical-actions{display:flex;gap:8px;overflow-x:auto;margin-top:8px}.tactical-actions button{min-height:44px;white-space:nowrap}.next-line{margin-top:8px;font-size:.78rem;font-weight:800}.resistance-start{display:block;font-size:.68rem;color:#ffd0ad}

        .radio-strip blockquote {
          margin: 5px 0 0;
          border: 0;
          padding: 0;
          font-size: 1.05rem;
          line-height: 1.35;
        }

        .progress-track {
          height: 9px;
          margin-top: 14px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,0.1);
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #f46a00, #ffb066);
          transition: width .25s linear;
        }

        .cockpit-meta {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 9px;
          font-size: .86rem;
          opacity: .74;
        }

        .ride-primary-control {
          width: 100%;
          min-height: 64px;
          margin-top: 12px;
          font-size: 1.15rem;
          font-weight: 900;
        }

        .ride-details-toggle {
          width: 100%;
          margin-top: 10px;
        }

        .ride-details {
          margin-top: 10px;
        }

        .ride-detail-stat { padding: 12px !important; min-height: 0 !important; overflow-wrap:anywhere; }
        .ride-detail-stat > small,.ride-detail-stat > strong{display:block}.ride-detail-stat > strong{margin-top:5px}.ride-detail-stat button{min-height:44px;max-width:100%;white-space:normal}.ride-details{padding-bottom:calc(72px + var(--safe-bottom))}.ride-details > button:last-child{scroll-margin-bottom:calc(80px + var(--safe-bottom))}
        .ride-detail-objectives { padding: 14px !important; }
        .ride-detail-objectives p { margin-bottom: 7px; }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
        }

        .profile-wrap {
          position: relative;
          height: 138px;
        }

        .segment-nav {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 10px;
        }

        .section-preview-list { display: flex; gap: 7px; overflow-x: auto; padding: 4px 1px 10px; scroll-snap-type: x proximity; }
        .section-preview-button { flex: 0 0 auto; max-width: 180px; padding: 10px 12px; scroll-snap-align: start; text-align: left; color:#dedee3; background:#242428; border-color:#45454d; }
        .section-preview-button strong { color:#fff; }
        .section-preview-button.current { color:#ffd0ad; background:#2b1b11; border-color: #f46a00; box-shadow: inset 3px 0 #f46a00; }
        .section-preview-button.previewing { outline: 2px solid #fff; background:#34343a; }
        .preview-card { color: #f4f4f5; background: rgba(20,20,22,.96); }
        .preview-card h2, .preview-card strong { color: #fff; }
        .preview-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(125px,1fr)); gap: 8px; margin-top: 12px; }
        .preview-stat { padding: 10px; border-radius: 10px; background: rgba(255,255,255,.06); }
        .preview-stat small, .preview-card .muted { color: #b5b5bb; }

        @media (max-width: 700px) {
          .ride-cockpit {
            padding: calc(var(--protected-top) + 8px) 10px calc(28px + var(--safe-bottom));
            scroll-padding-top: var(--protected-top);
          }

          .ride-stage-header {
            margin: 10px 0 8px !important;
          }

          .ride-topbar { min-height:44px; position:relative; z-index:2; }
          .cockpit-header { display:grid; grid-template-columns:minmax(0,1fr); }
          .cockpit-badges { justify-content:flex-start; width:100%; margin-top:8px; }

          .ride-stage-header h1 {
            font-size: 1.85rem !important;
            line-height: 1.05;
          }

          .ride-stage-header p:last-child {
            margin: 4px 0 0;
            font-size: .86rem;
          }

          .live-profile-card {
            padding: 10px 11px 9px;
            border-radius: 16px;
          }

          .live-profile-wrap { height: 92px; }


          .gradient-value { font-size: .58rem; }

          .cockpit-card {
            margin-top: 7px;
            padding: 10px;
            border-radius: 18px;
          }

          .cockpit-header .eyebrow {
            margin-bottom: 3px;
          }

          .cockpit-title {
            font-size: 1.45rem;
          }

          .cockpit-header > strong {
            padding: 6px 9px !important;
            font-size: .83rem;
          }

          .segment-clock {
            margin: 10px 0;
          }

          .segment-clock strong {
            font-size: clamp(2.8rem, 13vw, 4rem);
          }

          .segment-clock small {
            font-size: .72rem;
          }

          .target-grid {
            gap: 6px;
          }

          .target-tile {
            padding: 12px 5px;
            border-radius: 13px;
          }

          .target-tile small {
            font-size: .65rem;
          }

          .target-tile strong {
            margin-top: 5px;
            font-size: clamp(1.15rem, 4.8vw, 1.55rem);
          }

          .radio-strip {
            margin-top: 8px;
            padding: 10px 11px;
          }

          .radio-strip blockquote {
            font-size: .94rem;
          }

          .progress-track {
            margin-top: 9px;
          }

          .cockpit-meta {
            margin-top: 6px;
            font-size: .74rem;
          }

          .ride-primary-control {
            min-height: 58px;
            margin-top: 8px;
          }

          .ride-details-toggle {
            margin-top: 7px;
          }

        }
        .target-grid,.next-line,.tactical-event-card,.ride-primary-control,.ride-details-toggle{scroll-margin-bottom:calc(150px + env(safe-area-inset-bottom))}.next-line{display:grid;grid-template-columns:auto 1fr;gap:2px 8px;align-items:baseline;padding-right:48px}.next-line span{grid-column:1/-1;white-space:normal}.tactical-event-card{padding:8px 48px 8px 10px;max-height:132px}.tactical-event-card>strong{font-size:.85rem}.tactical-event-card p{display:none}.cockpit-bottom-spacer{height:calc(96px + env(safe-area-inset-bottom));pointer-events:none}.ride-cockpit{padding-bottom:calc(96px + env(safe-area-inset-bottom));scroll-padding-bottom:calc(140px + env(safe-area-inset-bottom))}.target-grid>div:last-child{padding-right:44px}.profile-control-footer{flex-shrink:0}
        @media(max-width:700px){.ride-stage-header h1{font-size:1.45rem!important}.ride-stage-header{margin-block:5px!important}.segment-clock{margin:5px 0}.cockpit-card{padding:8px}.profile-caption{font-size:.72rem;line-height:1.2;padding-block:6px}.target-tile{padding-block:8px!important}.cockpit-title{font-size:1.2rem}.cockpit-header{grid-template-columns:minmax(0,1fr) auto}.cockpit-badges{width:auto;margin-top:0}.live-profile-card{height:310px}}
        .live-tracker-4023{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:5px;white-space:nowrap;overflow:hidden;font-size:clamp(.54rem,2.25vw,.72rem);letter-spacing:-.015em}.live-tracker-4023>strong{flex:none}.live-tracker-4023>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.live-tracker-4023>span{padding-left:5px;border-left:1px solid #777}.live-tracker-4023>b{padding:3px 5px;border-radius:999px;background:#512000;color:#fff}.compact-section-clock{display:flex;align-items:baseline;gap:6px;min-height:28px;margin:2px 0 3px}.compact-section-clock strong{font-size:1.2rem;font-variant-numeric:tabular-nums}.compact-section-clock small{font-size:.62rem;font-weight:850}.authoritative-jean{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:2px 7px;margin-top:6px;scroll-margin-bottom:calc(150px + env(safe-area-inset-bottom))}.authoritative-jean>strong,.authoritative-jean>span{grid-column:1}.authoritative-jean>button{grid-column:2;grid-row:1/3}.target-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:0!important;border-block:1px solid rgba(255,255,255,.16)}.target-tile{min-width:0!important;padding:7px 4px!important;border-radius:0!important;border:0!important;background:transparent!important}.target-tile+ .target-tile{border-left:1px solid rgba(255,255,255,.16)!important}.target-tile strong{display:block;font-size:clamp(.68rem,3vw,1rem)!important;letter-spacing:-.035em;white-space:nowrap}.cockpit-meta{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;font-size:.68rem}.bottom-leave{display:block;position:static!important;width:100%;min-height:44px;margin-top:8px}.worlds-group-marker b{min-width:0;padding:0!important;text-align:center;border:0!important;background:transparent!important}.live-profile-card{height:auto!important;min-height:0;overflow:visible!important;padding:8px 10px!important;border-radius:10px!important}.live-profile-wrap,.profile-detail-4022,.climb-profile-4023{height:126px!important;min-height:126px;max-height:126px}.climb-profile-4023{grid-template-rows:auto minmax(0,1fr)}.climb-svg-region{min-height:0}.profile-control-footer{width:100%;grid-template-columns:repeat(2,minmax(0,1fr));padding:0!important;margin:4px 0 0!important;overflow:visible}.profile-control-footer button{max-width:none!important;border-radius:4px!important}.profile-control-footer button:only-child{width:100%;grid-column:1/-1}.tactical-event-card{height:auto!important;max-height:none!important;overflow:visible}.tactical-event-card small{display:block;white-space:nowrap;font-size:clamp(.56rem,2.4vw,.72rem);letter-spacing:-.025em}.tactical-event-card>div{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.tactical-event-card button{min-width:0;min-height:44px;white-space:normal}.tactical-status-strip{margin:6px 0}.course-finish-svg{color:#fff}.ride-cockpit.official-cockpit{padding-top:8px!important}.cockpit-card{border-radius:10px!important;border-color:rgba(255,255,255,.16)!important;background:rgba(255,255,255,.025)!important;box-shadow:none!important}
        @media (orientation:landscape) and (max-height:600px){.ride-cockpit{max-width:1100px;display:grid;grid-template-columns:minmax(420px,1.1fr) minmax(360px,.9fr);gap:10px;padding-top:calc(var(--protected-top) + 8px)}.ride-topbar,.ride-stage-header{grid-column:1/-1}.live-profile-card{grid-column:1}.cockpit-card,.ride-primary-control,.ride-details-toggle,.ride-details{grid-column:2}.cockpit-card{grid-row:3/span 2;margin-top:10px}.segment-clock strong{font-size:3.6rem}}
      `}</style>

      {countdown !== null && <div className="ride-countdown" aria-live="polite"><strong>{countdown}</strong><span>START DEVICES · COUNTDOWN SILENT</span></div>}



      {(!rideStarted||massStart?.phase==='PRE_RACE_WARMUP'||massStart?.phase==='KILOMETRE_ZERO')&&<header
        className="ride-stage-header"
        style={{ margin: '16px 0 10px' }}
      >
        <p className="eyebrow">
          {isWorlds?(isTimeTrial?'ITT':'ROAD RACE'):(stage.isTraining?(workoutId==='recovery-30'?'RECOVERY SESSION':'TRAINING RIDE'):`STAGE ${stage.number}`)} • {isWorlds?'TEAM USA':'TEAM LORIOT'}
        </p>

        <h1
          style={{
            margin: '3px 0',
            fontSize: 'clamp(2rem, 6vw, 4rem)',
          }}
        >
          {stage.route}
        </h1>

        <p style={{ opacity: 0.7 }}>
          {formatDistance(stage.distanceKm, measurementSystem)} •{' '}
          {formatElevation(stage.elevationM, measurementSystem)} D+
        </p>
        {worldsLap&&<strong className="worlds-lap">MOUNT ROYAL · LAP {worldsLap} OF 12</strong>}
        {raceSituation&&<aside className="race-situation" aria-label="Race situation"><small>RACE SITUATION</small><strong>{raceSituation.groupState.includes('CHASE')?'CHASE GROUP AHEAD':raceSituation.groupState.includes('BREAKAWAY')?'BREAKAWAY AHEAD':'RACE SELECTION'} · {raceSituation.simulatedGap.replace('SIMULATED · ','')}</strong></aside>}
      </header>}

      {!isFinished && (
        <>
          <div className="live-profile-card" aria-label={currentSegmentIsClimb ? "Live climb gradient profile" : "Live stage profile"}>
            <LiveTrackerHeader4023 worlds={isWorlds} training={Boolean(stage.isTraining)} section={gateTitle??currentSegment.name} zone={displayZone}/>
            <div className="compact-section-clock"><strong>{formatTime(massStart?.phase==='PRE_RACE_WARMUP'?massStart.warmupRemaining:massStart?.phase==='KILOMETRE_ZERO'?massStart.kilometreZeroRemaining:massStart?.phase==='GO'?0:sprintPhase?.remaining??segmentRemaining)}</strong><small>{massStart?.phase==='PRE_RACE_WARMUP'?'WARM-UP REMAINING':massStart?.phase==='KILOMETRE_ZERO'?'TO GO':massStart?.phase==='GO'?'RACING START':sprintPhase?`${sprintPhase.name} REMAINING`:'SECTION REMAINING'}</small></div>
            {!gateActive&&coursePosition.profileMode==='CLIMB_APPROACH'&&<div className="climb-approach"><small>NEXT CLIMB</small><strong>{upcomingClimb?.name}</strong><span>{formatDistance(coursePosition.distanceToClimbEntrance??0,measurementSystem)} to entrance</span></div>}
            {profileView.mode==='DETAIL' ? (
              <ProfileDetail4022 state={profileView} event={raceSituation} gradientBlocks={mergedGradientBlocks} gradientIndex={detailGradientIndex} currentGradient={gateActive?0:activeGradient} nextGradient={gateActive?null:detailGuidance.gradient} nextName={gateActive?(firstRaceTarget?.name??'RACING SECTION 1'):detailGuidance.name} changeDistance={massStart?.phase==='KILOMETRE_ZERO'?formatTime(massStart.kilometreZeroRemaining):gateActive?formatTime(massStart?.warmupRemaining??0):detailGuidance.distanceKm===null?null:detailGuidance.crossing?'CHANGE NOW':formatDistance(Math.max(.001,detailGuidance.distanceKm),measurementSystem)} resistance={displayResistance} context={courseContext}/>
            ) : showClimbView ? (
              <ClimbProfile4023 model={timeline} position={climbRenderPosition} approach={climbApproachAvailable&&!currentSegmentIsClimb} currentResistance={climbApproachAvailable&&!currentSegmentIsClimb?climbStartResistance:displayResistance} nextResistance={nextBoundaryResistance==='—'?climbStartResistance:nextBoundaryResistance} formatDistance={km=>formatDistance(km,measurementSystem)} formatTime={formatTime}/>
            ) : (
              <>
                <div className="live-profile-wrap">
                  <svg data-profile-view={profileView.mode} viewBox={profileViewBox} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="liveMountainFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(244,106,0,0.62)" />
                        <stop offset="100%" stopColor="rgba(244,106,0,0.05)" />
                      </linearGradient>
                      <clipPath id="completedStageClip">
                        <rect x="0" y="0" width={riderMarkerX} height="100" />
                      </clipPath>
                    </defs>
                    <polygon points={`0,100 ${profilePoints.join(' ')} 100,100`} fill="rgba(244,106,0,0.42)" />
                    <polygon points={`0,100 ${profilePoints.join(' ')} 100,100`} fill="rgba(92,92,92,.88)" clipPath="url(#completedStageClip)" />
                    <polyline points={profilePoints.join(' ')} fill="none" stroke="rgba(255,174,96,0.98)" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
                    <CourseFinishMarker4023 y={finishProfileY}/>
                    {(stage.isTraining?trainingMarkerPositions(segments).slice(1,-1).map((position,index)=>({key:index,x:position*100})):timeline.segmentStarts.slice(1).map(start=>({key:start,x:timeline.roadSnapshot(start).courseProgress*100}))).map(marker => <line key={marker.key} x1={marker.x} x2={marker.x} y1="88" y2="100" stroke="rgba(255,255,255,.5)" vectorEffect="non-scaling-stroke" />)}
                    <line x1={riderMarkerX} x2={riderMarkerX} y1="2" y2="98" stroke="rgba(255,255,255,0.68)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <CourseFinishLabel4023 y={finishProfileY}/>
                  <CourseEndpointMarkers4023 progress={coursePosition.fullProfileCoordinate}/>
                  {!stage.isTraining && timeline.markers.filter(marker=>marker.type!=='kilometre-zero'&&marker.type!=='finish').map((marker) => <span key={marker.key} className={`race-marker ${marker.type}`} style={{ left: `${displayX(marker.position*100)}%`, top:`${marker.localY}%`, color:marker.color }} title={marker.label}><b style={{ transform:`translate(${markerLabelOffset(marker.position,timeline.markers.map(item=>item.position)).translateX}%, ${markerLabelOffset(marker.position,timeline.markers.map(item=>item.position)).translateY}px)` }}>{marker.label}</b><i /></span>)}
                {raceSituation&&<WorldsGroupMarkers event={raceSituation} courseProgress={engine.courseProgress} viewStart={detailStart} viewWidth={detailWidth} riderState={tactical.state}/>}
                  <RiderMarker4023 kind="profile" left={displayX(riderMarkerX)} top={riderMarkerY} coordinate={coursePosition.fullProfileCoordinate}/>
                </div>
              </>
            )}
            <ProfileControls4023 climbAvailable={climbAvailable} geographicMode={geographicMode} density={profileView.mode} onGeographicMode={profileGeographicMode=>activeRide.ride&&activeRide.updateRide({profileGeographicMode})} onDensity={mode=>activeRide.ride&&activeRide.updateRide({profileView:{...profileView,mode,activeRangeId:mode==='DETAIL'?(detailEvent?.detailRangeId??'manual-current'):null}})}/>
            {isWorlds&&isTimeTrial&&<div className="itt-split-status"><span><small>CURRENT SPLIT</small><strong>{crossedSplits.at(-1)?.label??'START HOUSE'}</strong></span><span><small>NEXT SPLIT</small><strong>{nextSplit?.label??'FINISH'}</strong></span><span><small>ELAPSED / REMAINING</small><strong>{formatTime(elapsedSeconds)} / {formatTime(stageRemaining)}</strong></span></div>}

          </div>
          <AuthoritativeJeanBanner4023 active={rideStarted} phase={massStart?.phase} racingMessage={raceSituation?.caption??radioText} dismissedMessage={dismissedJeanMessage} onDismiss={setDismissedJeanMessage} situation={raceSituation?{title:raceSituation.groupState.includes('BREAKAWAY')?'BREAKAWAY AHEAD':'RACE SITUATION',gap:raceSituation.simulatedGap.replace('SIMULATED · ','')}:undefined}/>
          <div className="cockpit-card">
            {chaseOffered&&raceSituation&&chasePreview&&<ChaseDecisionCard event={raceSituation} responseRemaining={responseRemaining} actionLabel={raceAction??'CHASE'} preview={{power:chasePreview.power,cadence:chasePreview.cadence,resistance:chasePreview.resistance.replace(/ · START \d+% @ \d+ rpm| · Start \d+%/i,''),start:`START ${chasePreview.manualTarget.recommendedResistance}% @ ${chasePreview.manualTarget.recommendedCadence} RPM`}} onAccept={()=>decideSituation('accepted')} onHold={()=>decideSituation('declined')}/>}
            {activeEffort&&effortRemaining>0&&<TacticalStatusStrip state="ACTIVE" action={activeEffort.action??(tactical.state==='ATTACKING'?'ATTACK':'CHASE')} remaining={effortRemaining}/>}
            {tactical.state==='RETURNING_TO_PELOTON'&&tactical.transition&&<TacticalStatusStrip state="RETURNING" remaining={45*(1-tactical.transition.progress)}/>}

            {massStart?.phase==='PRE_RACE_WARMUP'&&<button type="button" className="skip-warmup" onClick={skipPreRaceWarmup}>SKIP WARM-UP</button>}

            <div className="target-grid">
              <div className="target-tile">
                <small>POWER</small>
                <strong>{displayPower}</strong>
              </div>

              <div className="target-tile">
                <small>CADENCE</small>
                <strong>{displayCadence}</strong>
              </div>

              <div className="target-tile">
                <small>RESISTANCE</small>
                <strong>
                  {displayResistance}
                </strong>
              </div>
            </div>
            {upNext&&<div className="next-line"><small>UP NEXT:</small><strong>{upNext.name} · {formatTime(upNext.remaining??0)}</strong><span>{upNext.power} · {upNext.cadence} · {upNext.openingResistance===null?'Resistance unavailable':`${Math.max(0,(upNext.openingResistance??0)-1)}–${(upNext.openingResistance??0)+2}%`}</span></div>}
            {!stage.isTraining&&!isWorlds&&nextCompetitionMarker&&<div className="next-line" aria-label="Next points marker">{nextCompetitionMarker.type==='kom'?`KOM ${nextCompetitionMarker.category??''}`:'SPRINT'} · {nextCompetitionMarker.points??0} pts · {formatTime(Math.max(0,nextCompetitionMarker.at-elapsedSeconds))} · {formatDistance(Math.max(0,nextCompetitionMarker.routeKm-routeKm),measurementSystem)}</div>}
            {opportunity&&opportunityPreview&&!opportunityDecision&&opportunityRemaining>0&&tactical.state==='PELOTON'&&!sprintPhase&&<div className="tactical-event-card compact-offer" role="group" aria-label="Tactical opportunity"><strong>{opportunity.title.replace(' OPPORTUNITY','')} · DECIDE {formatTime(opportunityRemaining)}</strong><small>{formatTime(opportunity.durationSeconds)} effort · {opportunityPreview.power} · {opportunityPreview.cadence} · {opportunityPreview.resistance.replace(/ · START.*$/i,'')}</small><div><button type="button" onClick={()=>decideOpportunity(true)}>{opportunity.action.replaceAll('_',' ')}</button><button type="button" onClick={()=>decideOpportunity(false)}>{opportunity.decline}</button></div></div>}
            {!isWorlds&&tactical.state!=='PELOTON'&&tactical.state!=='RETURNING_TO_PELOTON'&&!activeEffort&&<div className="tactical-event-card"><strong>{tactical.state}</strong>{tactical.transition&&<b>{formatTime(45*(1-tactical.transition.progress))}</b>}{!sprintPhase&&<button type="button" onClick={()=>chooseTactic('RETURN_TO_PELOTON')}>RETURN TO PELOTON</button>}</div>}

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="cockpit-meta">
              <span>{completionLabel(progress,routeKm)} · {formatDistance(routeKm, measurementSystem)} traveled</span>
              <span>{formatDistance(coursePosition.remainingDistance,measurementSystem)} left</span>
            </div>
          </div>

          {!isRunning ? (
            <button
              type="button"
              className="ride-primary-control"
              onClick={handleStart}
            >
              {elapsedSeconds === 0
                ? stage.isTraining ? '🚩 Start Ride' : '🚩 Roll Out'
                : '▶ Resume Ride'}
            </button>
          ) : (
            <button
              type="button"
              className="ride-primary-control"
              onClick={handlePause}
            >
              ⏸ Pause Ride
            </button>
          )}

          {engine.lifecycle==='OPTIONAL_COOLDOWN'&&<div className="tactical-actions" aria-label="Cooldown controls"><button type="button" onClick={()=>finishCooldown(true)}>Skip cooldown</button><button type="button" onClick={()=>finishCooldown(false)}>End cooldown</button><span>{formatTime(stageRemaining)} recovery remaining</span></div>}

          <button
            type="button"
            className="ride-details-toggle"
            onClick={() => setShowDetails((value) => !value)}
          >
            {showDetails
              ? '▲ Hide Ride Details'
              : '▼ View Ride Details'}
          </button>

          {showDetails && (
            <div className="ride-details">

              <div className="detail-grid">
                <div className="dashboard-card ride-detail-stat"><small>SCREEN STATUS</small><strong>{wakeLockLabel}</strong></div>
                {isWorlds&&!isTimeTrial&&<div className="dashboard-card ride-detail-stat"><small>RACE GAPS</small><strong>Race-story estimates</strong><p>Current gaps support the race story and are not measured from other riders.</p></div>}
                {displayedPrescription.manualTarget.recommendedResistance!==null&&<div className="dashboard-card ride-detail-stat"><small>MANUAL PELOTON GUIDANCE</small><p>If actual Peloton power is below the target while cadence is correct, increase resistance by one point. If actual power is above the target while cadence is correct, decrease resistance by one point. This is manual guidance until real-time telemetry exists.</p></div>}
                <div className="dashboard-card ride-detail-stat"><small>RESOLVER</small><strong>{activePrescription.manualTarget.feasibility}</strong><p>{activePrescription.manualTarget.adjustmentReason}</p></div>
                <div className="dashboard-card ride-detail-stat"><small>TEAM RADIO HISTORY</small>{radioHistory.slice().reverse().map(message=><p key={message.id}>📻 {message.text}</p>)}<button type="button" disabled={!radioText} onClick={()=>setDismissedJeanMessage(null)}>Replay latest</button></div>
                <div
                  className="dashboard-card ride-detail-stat"
                  style={{ textAlign: 'center' }}
                >
                  <small>STAGE TIME</small>
                  <strong
                    style={{
                      display: 'block',
                      marginTop: '5px',
                      fontSize: '1.8rem',
                    }}
                  >
                    {formatTime(elapsedSeconds)}
                  </strong>
                </div>

                <div
                  className="dashboard-card ride-detail-stat"
                  style={{ textAlign: 'center' }}
                >
                  <small>STAGE REMAINING</small>
                  <strong
                    style={{
                      display: 'block',
                      marginTop: '5px',
                      fontSize: '1.8rem',
                    }}
                  >
                    {formatTime(stageRemaining)}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRestart}
                style={{ width: '100%', marginTop: '10px' }}
              >
                Restart Stage
              </button>
              {!endingEarly?<button type="button" onClick={()=>setEndingEarly(true)} style={{width:'100%',marginTop:10}}>End Ride Early</button>:<div className="dashboard-card"><strong>Why are you ending?</strong>{['Fatigue','Time constraint','Equipment issue','Pain or discomfort','Recovery/readiness','Other'].map(reason=><button type="button" key={reason} style={{minHeight:44,margin:4}} onClick={()=>window.confirm(`End ride early: ${reason}?`)&&confirmEndEarly(reason)}>{reason}</button>)}<button type="button" onClick={()=>setEndingEarly(false)}>Cancel</button></div>}
            </div>
          )}
          <button type="button" className="leave-cockpit bottom-leave" onClick={handleBack}>← Leave Cockpit</button>
        </>
      )}

      <div className="cockpit-bottom-spacer" aria-hidden="true" />
      {isFinished && <div className="dashboard-card ride-complete-launch"><p className="eyebrow">COOLDOWN COMPLETE</p><h2>Opening Ride Metrics…</h2><p>Your stage has been saved. Preparing the post-ride data screen.</p></div>}
    </section>
  )
}

export default RideScreen
