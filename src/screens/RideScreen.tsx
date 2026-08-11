/* eslint-disable react-hooks/exhaustive-deps -- radio and wake-lock callbacks intentionally read the live cockpit closure without restarting timed effects. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { getRaceStage } from '../data/raceStages'
import type { RaceStrategy } from '../types/tactics'
import { adaptSegments } from '../engine/adaptiveRide'
import { useCareer } from '../state/CareerContext'
import { formatDistance, formatElevation } from '../utils/units'
import { buildJeanTimeline, isClimb, jeanEventsCrossed, type JeanTimelineEvent } from '../engine/stageEngine'
import { useActiveRide } from '../state/ActiveRideContext'
import { buildGradientSections, gradientDifficultyColor } from '../engine/gradientRoad'
import { createRoadModel } from '../engine/roadModel'
import { jeanCue, jeanMode } from '../engine/jeanDirector'
import { speakAsJean } from '../services/jeanVoice'
import { CLICK_IN_CUE, PRE_RIDE_COUNTDOWN } from '../engine/preRide'

type RideScreenProps = {
  stageNumber: number
  strategy: RaceStrategy
  onBack: () => void
  onFinish: () => void
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
  stageNumber,
  strategy,
  onBack,
  onFinish,
}: RideScreenProps) {
  const { career } = useCareer()
  const measurementSystem = career.settings.measurementSystem
  const stage = useMemo(() => getRaceStage(stageNumber), [stageNumber])
  const segments = useMemo(() => adaptSegments(stage.segments, career.rider.ftp, strategy), [stage, career.rider.ftp, strategy])
  const activeRide = useActiveRide()
  const timeline = useMemo(() => createRoadModel(stage.number, segments, stage.distanceKm), [segments, stage.distanceKm, stage.number])
  const profilePoints = timeline.profilePoints
  const elapsedSeconds = activeRide.ride?.stageNumber === stageNumber ? activeRide.elapsed : 0
  const isRunning = activeRide.ride?.stageNumber === stageNumber && activeRide.ride.runningSince !== null
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [radioText, setRadioText] = useState(
    'Radio connected. Press Start Ride when you are ready.',
  )
  const [showSegmentCard, setShowSegmentCard] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [wakeLockStatus, setWakeLockStatus] = useState<
    'inactive' | 'active' | 'unsupported' | 'blocked'
  >('inactive')

  const lastSpokenCue = useRef('')
  const lastRandomCueTime = useRef(-999)
  const nextRandomCueTime = useRef(50)
  const previousSegmentIndex = useRef(0)
  const previousCoachingElapsed = useRef(elapsedSeconds)
  const spokenTimelineEvents = useRef(new Set<string>())
  const segmentCardTimer = useRef<number | null>(null)
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(
    null,
  )
  const isRunningRef = useRef(false)
  const didLaunchMetrics = useRef(false)

  const stageDuration = timeline.duration

  const engine = useMemo(() => timeline.roadSnapshot(elapsedSeconds), [elapsedSeconds, timeline])
  const coachingTimeline = useMemo(() => buildJeanTimeline(segments), [segments])
  const segmentData = { index: engine.segmentIndex, segment: engine.segment, elapsedInSegment: engine.elapsedInSegment }

  const currentSegment = segmentData.segment
  const nextSegment = engine.nextSegment
  const openingStatus = currentSegment.type.toLowerCase().includes('neutral')
    ? 'NEUTRALIZED'
    : currentSegment.name === 'Kilometre Zero'
      ? 'RACE START'
      : currentSegment.type.toLowerCase().includes('official time trial start')
        ? 'START RAMP'
        : null

  const segmentRemaining = engine.segmentRemaining

  const progress = engine.stageProgress * 100

  const routeKm = engine.routeDistanceKm

  const stageRemaining = engine.stageRemaining

  const riderMarkerX = engine.roadPosition * 100
  const riderMarkerY = engine.profileY

  const currentSegmentProgress = engine.segmentProgress

  const currentSegmentIsClimb = isClimb(currentSegment)

  const gradientBlocks = engine.gradientSections
  const activeGradientIndex = engine.gradientIndex
  const activeGradient = engine.gradient
  const climbAverage = gradientBlocks.length
    ? gradientBlocks.reduce((sum, block) => sum + block.gradient, 0) / gradientBlocks.length
    : 0
  const nextGradient = engine.nextGradient
  const climbDistanceKm = Math.max(
    0.5,
    (nextSegment?.routeKm ?? stage.distanceKm) - currentSegment.routeKm,
  )
  const summitDistanceKm = climbDistanceKm * (1 - currentSegmentProgress)
  const mode = jeanMode(currentSegment, isFinished)
  const previewSegment = previewIndex === null ? null : segments[previewIndex]

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

  function speak(text: string) {
    setRadioText(text)
    // A road crossing supersedes queued advice about the road behind us.
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    speakAsJean(text, undefined, career.settings.jeanVoiceVolume)
  }

  function showCurrentSegmentCard() {
    if (segmentCardTimer.current !== null) {
      window.clearTimeout(segmentCardTimer.current)
    }

    setShowSegmentCard(true)

    segmentCardTimer.current = window.setTimeout(() => {
      setShowSegmentCard(false)
      segmentCardTimer.current = null
    }, 3000)
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
      const sentinel =
        await navigatorWithWakeLock.wakeLock.request(
          'screen',
        )

      wakeLockRef.current = sentinel
      setWakeLockStatus('active')

      sentinel.addEventListener('release', () => {
        wakeLockRef.current = null

        if (isRunningRef.current) {
          setWakeLockStatus('inactive')
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
  }, [isRunning])

  useEffect(() => {
    if (!isRunning || isFinished) {
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
      const randomCue = jeanCue(mode, undefined, [radioText], secondInSegment)

      speak(randomCue)
      lastRandomCueTime.current = secondInSegment
      nextRandomCueTime.current =
        secondInSegment +
        45 +
        Math.floor(Math.random() * 55)
    }
  }, [
    currentSegment,
    isFinished,
    isRunning,
    segmentData.elapsedInSegment,
    segmentData.index,
    mode,
    radioText,
  ])

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
    const crossed = jeanEventsCrossed(coachingTimeline, previous, elapsedSeconds)
      .filter((event) => event.type !== 'sector-entry' && !spokenTimelineEvents.current.has(event.key))
    const event = crossed.at(-1)
    if (!event) return
    crossed.forEach((item) => spokenTimelineEvents.current.add(item.key))
    speak(timelineMessage(event))
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

    showCurrentSegmentCard()

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
      setShowSegmentCard(false)
      void releaseWakeLock()

      speak(
        `Stage ${stage.number} complete, Hal. Excellent work. Team Loriot is proud of that ride.`,
      )
      if (!didLaunchMetrics.current) {
        didLaunchMetrics.current = true
        window.setTimeout(onFinish, 1200)
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
      }
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
      if (segmentCardTimer.current !== null) {
        window.clearTimeout(segmentCardTimer.current)
      }

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
      speak(`Radio reconnected. ${currentSegment.name}. ${currentSegment.description}`)
      void requestWakeLock()
      return
    }
    activeRide.begin(stageNumber, strategy)
    speak(CLICK_IN_CUE)
    setCountdown(PRE_RIDE_COUNTDOWN[0])
    let value: number = PRE_RIDE_COUNTDOWN[0]
    const timer = window.setInterval(() => {
      value -= 1
      if (value === 0) {
        window.clearInterval(timer)
        setCountdown(null)
        activeRide.resume()
        showCurrentSegmentCard()
        window.setTimeout(() => speak(`Stage ${stage.number}, ${stage.title}, ${stage.route}. We ride ${strategy.toLowerCase()} today. Team objective: ${stage.objective} Your mission is to execute the plan and finish strong.`), 1200)
      } else setCountdown(value)
    }, 1000)
  }

  function handlePause() {
    activeRide.pause()
    void releaseWakeLock()
    speak('Stage paused. Keep the legs moving gently.')
  }


  function handleRestart() {
    activeRide.end()
    setIsFinished(false)
    setShowSegmentCard(false)
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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    void releaseWakeLock()
    onBack()
  }

  const wakeLockLabel =
    wakeLockStatus === 'active'
      ? 'Screen awake'
      : wakeLockStatus === 'unsupported'
        ? 'Use Auto-Lock: Never'
        : wakeLockStatus === 'blocked'
          ? 'Wake lock unavailable'
          : 'Screen sleep allowed'

  return (
    <section className="ride-screen ride-cockpit">
      <style>{`
        .ride-cockpit {
          max-width: 1000px;
          margin: 0 auto;
          padding: 18px 18px 56px;
          position: relative;
        }

        .ride-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

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
          top: 8px;
          z-index: 30;
          background: rgba(13,13,13,.96);
          backdrop-filter: blur(16px);
          box-shadow: 0 12px 35px rgba(0,0,0,.4);
        }

        .master-stage-profile .live-profile-wrap { height: 86px; }

        .race-marker { position:absolute; top:2px; transform:translateX(-50%); z-index:3; color:#fff; font-size:.55rem; font-weight:900; letter-spacing:.03em; text-align:center; text-shadow:0 1px 3px #000; }
        .race-marker i { display:block; width:3px; height:60px; margin:2px auto 0; background:#fff; box-shadow:0 0 4px #000; }
        .race-marker.kilometre-zero { color:#ffae60; }
        .race-marker.kilometre-zero i { background:#f46a00; }
        .race-marker.sprint { color:#7dd3fc; }
        .race-marker.sprint i { background:#38bdf8; }
        .race-marker.kom { color:#fca5a5; }
        .race-marker.kom i { background:#ef4444; }
        .race-marker.finish i { background:repeating-linear-gradient(#fff 0 4px,#111 4px 8px); width:5px; }

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

        .climb-live-card {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.10);
        }

        .gradient-summary {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 10px;
          margin-bottom: 8px;
        }

        .gradient-blocks {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 112px;
          padding: 8px 2px 0;
          border-bottom: 3px solid rgba(255,255,255,0.5);
        }

        .gradient-block {
          position: relative;
          flex: 1 1 0;
          min-width: 0;
          border-radius: 5px 5px 1px 1px;
          opacity: .52;
          transition: opacity .25s linear, transform .25s linear, filter .25s linear;
          clip-path: polygon(0 28%, 100% 0, 100% 100%, 0 100%);
        }

        .gradient-block.completed { opacity: .72; filter: saturate(.15); }
        .gradient-block.active {
          opacity: 1;
          transform: translateY(-4px);
          filter: drop-shadow(0 0 9px rgba(255,255,255,.48));
          outline: 3px solid #fff;
          outline-offset: 1px;
        }

        .gradient-rider {
          position: absolute;
          left: 50%;
          top: -30px;
          transform: translateX(-50%);
          font-size: 1.35rem;
          filter: drop-shadow(0 3px 5px rgba(0,0,0,.75));
        }

        .climb-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 9px;
          font-size: .82rem;
          opacity: .82;
        }

        .gradient-value {
          position: absolute;
          left: 50%;
          bottom: 6px;
          transform: translateX(-50%);
          transform-origin: center;
          color: #fff;
          font-weight: 900;
          font-size: clamp(.62rem, 2.5vw, .82rem);
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(0,0,0,.8);
        }

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
          font-size: clamp(4.4rem, 16vw, 8rem);
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

        .radio-strip {
          margin-top: 12px;
          padding: 13px 15px;
          border-radius: 14px;
          border-left: 4px solid #f46a00;
          background: rgba(255,255,255,0.05);
        }

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
            padding: 10px 10px 28px;
          }

          .ride-stage-header {
            margin: 10px 0 8px !important;
          }

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

          .gradient-blocks { height: 88px; }

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
            font-size: clamp(4rem, 18vw, 5.8rem);
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

          .segment-overlay-card {
            padding: 26px 18px !important;
          }
        }
      `}</style>

      {countdown !== null && <div className="ride-countdown" aria-live="polite"><strong>{countdown}</strong><span>START DEVICES · COUNTDOWN SILENT</span></div>}

      {showSegmentCard && !isFinished && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            background: 'rgba(5, 8, 12, 0.84)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            className="segment-overlay-card"
            style={{
              width: 'min(520px, 100%)',
              padding: '34px 28px',
              textAlign: 'center',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.18)',
              background:
                'linear-gradient(145deg, rgba(28,32,38,0.98), rgba(10,12,16,0.98))',
              boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
            }}
          >
            <div style={{ fontSize: '3.4rem' }}>
              {currentSegment.icon}
            </div>

            <p className="eyebrow">
              SEGMENT {segmentData.index + 1} OF{' '}
              {segments.length}
            </p>

            <h2
              style={{
                margin: '7px 0',
                fontSize: 'clamp(2rem, 7vw, 3.6rem)',
              }}
            >
              {currentSegment.name}
            </h2>

            <p style={{ opacity: 0.72 }}>
              {currentSegment.type}
            </p>

            <strong>
              {currentSegment.zone} •{' '}
              {formatTime(currentSegment.sec)} •{' '}
              {currentSegment.power}
            </strong>
          </div>
        </div>
      )}

      <div className="ride-topbar">
        <button type="button" onClick={handleBack}>
          ← Leave cockpit
        </button>

      </div>

      <header
        className="ride-stage-header"
        style={{ margin: '16px 0 10px' }}
      >
        <p className="eyebrow">
          STAGE {stage.number} • TEAM LORIOT
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
          {formatElevation(stage.elevationM, measurementSystem)} D+ •{' '}
          {strategy}
        </p>
      </header>

      {!isFinished && (
        <>
          {currentSegmentIsClimb && (
            <div className="live-profile-card master-stage-profile" aria-label="Live stage profile">
              <div className="live-profile-head"><div><p className="eyebrow">LIVE STAGE TRACKER</p><strong>{Math.round(progress)}% COMPLETE</strong></div><strong>{formatDistance(Math.max(stage.distanceKm - routeKm, 0), measurementSystem)} left</strong></div>
              <div className="live-profile-wrap">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
                  <defs><clipPath id="climbStageClip"><rect x="0" y="0" width={riderMarkerX} height="100" /></clipPath></defs>
                  <polygon points={`0,100 ${profilePoints.join(' ')} 100,100`} fill="rgba(244,106,0,.34)" />
                  <polygon points={`0,100 ${profilePoints.join(' ')} 100,100`} fill="rgba(105,105,105,.9)" clipPath="url(#climbStageClip)" />
                  <polyline points={profilePoints.join(' ')} fill="none" stroke="#ffae60" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
                  {timeline.segmentStarts.slice(1).map((start) => <line key={start} x1={start / timeline.duration * 100} x2={start / timeline.duration * 100} y1="88" y2="100" stroke="rgba(255,255,255,.5)" vectorEffect="non-scaling-stroke" />)}
                  <line x1={riderMarkerX} x2={riderMarkerX} y1="2" y2="98" stroke="#fff" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                </svg>
                {timeline.markers.map((marker) => <span key={marker.key} className={`race-marker ${marker.type}`} style={{ left: `${marker.position * 100}%` }} title={marker.label}>{marker.label}<i /></span>)}
                <div style={{ position: 'absolute', left: `${riderMarkerX}%`, top: `${riderMarkerY}%`, transform: 'translate(-50%, -80%)', zIndex: 5, fontSize: '1.35rem', transition: 'left .25s linear, top .25s linear' }}>🚴</div>
              </div>
            </div>
          )}
          <div className="live-profile-card" aria-label={currentSegmentIsClimb ? "Live climb gradient profile" : "Live stage profile"}>
            {currentSegmentIsClimb ? (
              <>
                <div className="gradient-summary">
                  <div>
                    <p className="eyebrow">LIVE CLIMB PROFILE</p>
                    <strong>{currentSegment.name}</strong>
                    <small style={{ display: 'block', opacity: .72 }}>
                      {climbAverage.toFixed(1)}% average • {formatDistance(summitDistanceKm, measurementSystem)} to summit
                    </small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <small>CURRENT / NEXT</small>
                    <strong style={{ display: 'block', fontSize: '1.55rem', color: '#fff' }}>
                      {activeGradient.toFixed(1)}% / {nextGradient.toFixed(1)}%
                    </strong>
                  </div>
                </div>

                <div className="gradient-blocks" aria-label={`${currentSegment.name} gradient sections`}>
                  {gradientBlocks.map((block, index) => {
                    const isActive = index === activeGradientIndex
                    const isCompleted = index < activeGradientIndex
                    return (
                      <div
                        key={`${currentSegment.name}-${index}`}
                        className={`gradient-block${isCompleted ? ' completed' : ''}${isActive ? ' active' : ''}`}
                        style={{
                          height: `${34 + block.gradient * 5}%`,
                          background: gradientDifficultyColor(block.gradient),
                        }}
                        title={`Section ${index + 1}: ${block.gradient}%`}
                      >
                        {isActive && <span className="gradient-rider">🚴</span>}
                        <span className="gradient-value">{block.gradient}%</span>
                      </div>
                    )
                  })}
                </div>
                <div className="climb-footer">
                  <span>{Math.round(currentSegmentProgress * 100)}% of climb complete</span>
                  <strong>{formatDistance(summitDistanceKm, measurementSystem)} • {formatTime(segmentRemaining)} to summit</strong>
                </div>
              </>
            ) : (
              <>
                <div className="live-profile-head">
                  <div>
                    <p className="eyebrow">LIVE STAGE TRACKER</p>
                    <strong>{currentSegment.terrainLabel}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <small>{Math.round(progress)}% COMPLETE</small>
                    <strong style={{ display: 'block' }}>
                      {formatDistance(Math.max(stage.distanceKm - routeKm, 0), measurementSystem)} left
                    </strong>
                  </div>
                </div>

                <div className="live-profile-wrap">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
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
                    {timeline.segmentStarts.slice(1).map((start) => <line key={start} x1={start / timeline.duration * 100} x2={start / timeline.duration * 100} y1="88" y2="100" stroke="rgba(255,255,255,.5)" vectorEffect="non-scaling-stroke" />)}
                    <line x1={riderMarkerX} x2={riderMarkerX} y1="2" y2="98" stroke="rgba(255,255,255,0.68)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                  </svg>
                  {timeline.markers.map((marker) => <span key={marker.key} className={`race-marker ${marker.type}`} style={{ left: `${marker.position * 100}%` }} title={marker.label}>{marker.label}<i /></span>)}
                  <div style={{ position: 'absolute', left: `${riderMarkerX}%`, top: `${riderMarkerY}%`, transform: 'translate(-50%, -80%)', zIndex: 5, fontSize: '1.35rem', transition: 'left .25s linear, top .25s linear' }}>🚴</div>
                </div>
              </>
            )}
          </div>

          <div className="cockpit-card">
            <div className="cockpit-header">
              <div>
                <p className="eyebrow">CURRENT SECTOR</p>
                <h2 className="cockpit-title">
                  {currentSegment.icon}{' '}
                  {currentSegment.name}
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {openingStatus && (
                  <strong
                    style={{
                      padding: '8px 12px',
                      borderRadius: '999px',
                      border: '1px solid rgba(255,255,255,0.45)',
                      background: openingStatus === 'NEUTRALIZED' ? 'rgba(255,255,255,0.10)' : 'rgba(244,106,0,0.20)',
                      letterSpacing: '0.08em',
                      fontSize: '0.74rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {openingStatus}
                  </strong>
                )}
              <strong
                style={{
                  padding: '8px 12px',
                  borderRadius: '999px',
                  border:
                    '1px solid rgba(244,106,0,0.75)',
                  background: 'rgba(244,106,0,0.12)',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentSegment.zone}
              </strong>
              </div>
            </div>

            <div className="segment-clock">
              <strong>{formatTime(segmentRemaining)}</strong>
              <small>SEGMENT REMAINING</small>
            </div>

            <div className="target-grid">
              <div className="target-tile">
                <small>POWER</small>
                <strong>{currentSegment.power}</strong>
              </div>

              <div className="target-tile">
                <small>CADENCE</small>
                <strong>{currentSegment.cadence}</strong>
              </div>

              <div className="target-tile">
                <small>RESISTANCE</small>
                <strong>
                  {engine.resistance}
                </strong>
              </div>
            </div>

            <div className="radio-strip">
              <small>📻 JEAN MOREAU</small>
              <blockquote>“{radioText}”</blockquote>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="cockpit-meta">
              <span>
                {Math.round(progress)}% •{' '}
                {formatDistance(routeKm, measurementSystem)}
              </span>
              <span>{wakeLockLabel}</span>
            </div>
          </div>

          {!isRunning ? (
            <button
              type="button"
              className="ride-primary-control"
              onClick={handleStart}
            >
              {elapsedSeconds === 0
                ? '🚩 Roll Out'
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

          <button
            type="button"
            className="ride-details-toggle"
            onClick={() => setShowDetails((value) => !value)}
          >
            {showDetails
              ? '▲ Hide Ride Details'
              : '▼ View Ride Details'}
          </button>

          <div className="dashboard-card preview-card">
            <p className="eyebrow">SECTION PREVIEW · DOES NOT CHANGE RIDE PROGRESS</p>
            <div className="section-preview-list" aria-label="Preview every stage section">
              {segments.map((segment, index) => {
                const status = index === engine.segmentIndex ? 'CURRENT' : index === engine.segmentIndex + 1 ? 'UP NEXT' : 'PREVIEW'
                return <button key={`${segment.name}-${index}`} type="button" className={`section-preview-button${index === engine.segmentIndex ? ' current' : ''}${index === previewIndex ? ' previewing' : ''}`} onClick={() => setPreviewIndex(index)} aria-pressed={index === previewIndex}>
                  <small>{status} · {index + 1}/{segments.length}</small><strong style={{ display: 'block' }}>{segment.icon} {segment.name}</strong>
                </button>
              })}
            </div>
            {previewSegment && previewIndex !== null && (
              <div aria-live="polite">
                <p className="eyebrow">{previewIndex === engine.segmentIndex ? 'CURRENT' : previewIndex === engine.segmentIndex + 1 ? 'UP NEXT' : 'PREVIEW'}</p>
                <h2>{previewSegment.name}</h2>
                <p className="muted">{previewSegment.type} · {previewSegment.description}</p>
                <div className="preview-grid">
                  <div className="preview-stat"><small>DURATION</small><strong>{formatTime(previewSegment.sec)}</strong></div>
                  <div className="preview-stat"><small>DISTANCE MARKER</small><strong>{formatDistance(previewSegment.routeKm, measurementSystem)}</strong></div>
                  <div className="preview-stat"><small>ZONE</small><strong>{previewSegment.zone}</strong></div>
                  <div className="preview-stat"><small>POWER</small><strong>{previewSegment.power}</strong></div>
                  <div className="preview-stat"><small>CADENCE</small><strong>{previewSegment.cadence}</strong></div>
                  <div className="preview-stat"><small>RESISTANCE</small><strong>{previewSegment.resistance}</strong></div>
                </div>
                <p style={{ marginTop: 12 }}><strong>Jean / team objective:</strong> {previewSegment.objective}. {previewSegment.secondaryObjective}</p>
                {isClimb(previewSegment) && <p><strong>Climb:</strong> {buildGradientSections(`${stage.number}-${previewIndex}-${previewSegment.name}-${previewSegment.type}`, previewSegment.sec, previewSegment.zone).map((item) => `${item.gradient}%`).join(' · ')}</p>}
              </div>
            )}
          </div>

          {showDetails && (
            <div className="ride-details">

              <div className="detail-grid">
                <div
                  className="dashboard-card"
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
                  className="dashboard-card"
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

              <div
                className="dashboard-card"
                style={{ borderLeft: '4px solid #f46a00' }}
              >
                <p className="eyebrow">OBJECTIVES</p>
                <p>
                  <strong>✓ {currentSegment.objective}</strong>
                </p>
                <p style={{ opacity: 0.78 }}>
                  ✓ {currentSegment.secondaryObjective}
                </p>
                <p style={{ opacity: 0.68 }}>
                  {currentSegment.description}
                </p>
              </div>

              <div className="dashboard-card">
                <p className="eyebrow">UP NEXT</p>
                <h2>
                  {nextSegment
                    ? `${nextSegment.icon} ${nextSegment.name}`
                    : 'Team Bus'}
                </h2>
                <p>
                  {nextSegment
                    ? `${formatTime(nextSegment.sec)} • ${nextSegment.zone} • ${nextSegment.power}`
                    : 'Stage debrief'}
                </p>
              </div>



              <button
                type="button"
                onClick={handleRestart}
                style={{ width: '100%', marginTop: '10px' }}
              >
                Restart Stage
              </button>
            </div>
          )}
        </>
      )}

      {isFinished && <div className="dashboard-card ride-complete-launch"><p className="eyebrow">COOLDOWN COMPLETE</p><h2>Opening Ride Metrics…</h2><p>Your stage has been saved. Preparing the post-ride data screen.</p></div>}
    </section>
  )
}

export default RideScreen
