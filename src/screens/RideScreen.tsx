import { useEffect, useMemo, useRef, useState } from 'react'
import DirectorReport from '../components/DirectorReport'
import { getRaceStage } from '../data/raceStages'
import { halRider } from '../game/rider'
import type { RaceStrategy } from '../types/tactics'
import { adaptSegments } from '../engine/adaptiveRide'
import { useCareer } from '../state/CareerContext'
import { formatDistance, formatElevation } from '../utils/units'

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
  const { career, setMeasurementSystem } = useCareer()
  const measurementSystem = career.settings.measurementSystem
  const stage = useMemo(() => getRaceStage(stageNumber), [stageNumber])
  const segments = useMemo(() => adaptSegments(stage.segments, career.rider.ftp, strategy), [stage, career.rider.ftp, strategy])
  const profilePoints = stage.profilePoints
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [radioText, setRadioText] = useState(
    'Radio connected. Press Start Ride when you are ready.',
  )
  const [showSegmentCard, setShowSegmentCard] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [wakeLockStatus, setWakeLockStatus] = useState<
    'inactive' | 'active' | 'unsupported' | 'blocked'
  >('inactive')

  const lastSpokenCue = useRef('')
  const lastRandomCueTime = useRef(-999)
  const nextRandomCueTime = useRef(50)
  const previousSegmentIndex = useRef(0)
  const segmentCardTimer = useRef<number | null>(null)
  const accumulatedElapsedRef = useRef(0)
  const runStartedAtRef = useRef<number | null>(null)
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(
    null,
  )
  const isRunningRef = useRef(false)

  const stageDuration = useMemo(
    () =>
      segments.reduce(
        (total, segment) => total + segment.sec,
        0,
      ),
    [segments],
  )

  const climbingTime = useMemo(() => {
    return segments
      .filter((segment) =>
        segment.type.toLowerCase().includes('climb'),
      )
      .reduce(
        (total, segment) => total + segment.sec,
        0,
      )
  }, [])

  const highIntensityTime = useMemo(() => {
    return segments
      .filter(
        (segment) =>
          segment.zone.includes('Z4') ||
          segment.zone.includes('Z5') ||
          segment.zone.includes('Z6'),
      )
      .reduce(
        (total, segment) => total + segment.sec,
        0,
      )
  }, [])

  const segmentData = useMemo(() => {
    let accumulatedSeconds = 0

    for (
      let index = 0;
      index < segments.length;
      index += 1
    ) {
      const segment = segments[index]
      const segmentEnd =
        accumulatedSeconds + segment.sec

      if (elapsedSeconds < segmentEnd) {
        return {
          index,
          segment,
          elapsedInSegment:
            elapsedSeconds - accumulatedSeconds,
          segmentStart: accumulatedSeconds,
        }
      }

      accumulatedSeconds = segmentEnd
    }

    return {
      index: segments.length - 1,
      segment: segments[segments.length - 1],
      elapsedInSegment:
        segments[segments.length - 1].sec,
      segmentStart:
        stageDuration -
        segments[segments.length - 1].sec,
    }
  }, [elapsedSeconds, stageDuration])

  const currentSegment = segmentData.segment
  const nextSegment = segments[segmentData.index + 1]
  const openingStatus = currentSegment.type.toLowerCase().includes('neutral')
    ? 'NEUTRALIZED'
    : currentSegment.name === 'Kilometre Zero'
      ? 'RACE START'
      : currentSegment.type.toLowerCase().includes('official time trial start')
        ? 'START RAMP'
        : null

  const segmentRemaining = Math.max(
    currentSegment.sec - segmentData.elapsedInSegment,
    0,
  )

  const progress = Math.min(
    (elapsedSeconds / stageDuration) * 100,
    100,
  )

  const routeKm = Math.min(
    stage.distanceKm,
    (stage.distanceKm * progress) / 100,
  )

  const stageRemaining = Math.max(
    stageDuration - elapsedSeconds,
    0,
  )

  const riderMarkerX = Math.min(
    Math.max(progress, 1),
    99,
  )

  function speak(text: string) {
    setRadioText(text)

    if (!('speechSynthesis' in window)) {
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()

    utterance.voice =
      voices.find(
        (voice) =>
          /en-GB/i.test(voice.lang) &&
          /daniel|arthur|male/i.test(voice.name),
      ) ??
      voices.find((voice) => /en-GB/i.test(voice.lang)) ??
      voices.find((voice) => /en-US/i.test(voice.lang)) ??
      null

    utterance.rate = 0.95
    utterance.pitch = 0.92
    utterance.volume = 1

    window.speechSynthesis.speak(utterance)
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

    const updateClock = () => {
      if (runStartedAtRef.current === null) {
        return
      }

      const liveElapsed =
        accumulatedElapsedRef.current +
        (Date.now() - runStartedAtRef.current) / 1000

      setElapsedSeconds(
        Math.min(stageDuration, liveElapsed),
      )
    }

    updateClock()
    const timer = window.setInterval(updateClock, 250)

    return () => {
      window.clearInterval(timer)
    }
  }, [isRunning, isFinished, stageDuration])

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
      const randomCue =
        randomCues[
          Math.floor(Math.random() * randomCues.length)
        ]

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
  ])

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

    if (isRunning) {
      speak(
        `${currentSegment.name}. ${currentSegment.description}`,
      )
    }
  }, [
    currentSegment.description,
    currentSegment.name,
    isRunning,
    segmentData.index,
  ])

  useEffect(() => {
    if (
      elapsedSeconds < stageDuration ||
      isFinished
    ) {
      return
    }

    accumulatedElapsedRef.current = stageDuration
    runStartedAtRef.current = null
    setIsRunning(false)
    setIsFinished(true)
    setShowSegmentCard(false)
    void releaseWakeLock()

    speak(
      `Stage ${stage.number} complete, Hal. Excellent work. Team Loriot is proud of that ride.`,
    )
  }, [elapsedSeconds, isFinished, stageDuration])

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
    if (isFinished) {
      return
    }

    accumulatedElapsedRef.current = elapsedSeconds
    runStartedAtRef.current = Date.now()
    setIsRunning(true)
    void requestWakeLock()

    if (elapsedSeconds === 0) {
      showCurrentSegmentCard()
      speak(
        `Radio check. Rider fifteen, ${halRider.name}, Team Loriot. Stage ${stage.number}, ${stage.route}, begins now.`,
      )
    } else {
      speak(
        `Radio reconnected. ${currentSegment.name}. ${currentSegment.description}`,
      )
    }
  }

  function handlePause() {
    if (runStartedAtRef.current !== null) {
      const pausedAt = Math.min(
        stageDuration,
        accumulatedElapsedRef.current +
          (Date.now() - runStartedAtRef.current) / 1000,
      )

      accumulatedElapsedRef.current = pausedAt
      setElapsedSeconds(pausedAt)
    }

    runStartedAtRef.current = null
    setIsRunning(false)
    void releaseWakeLock()
    speak('Stage paused. Keep the legs moving gently.')
  }

  function jumpToSegment(newIndex: number) {
    const safeIndex = Math.max(
      0,
      Math.min(segments.length - 1, newIndex),
    )

    const newElapsed = segments
      .slice(0, safeIndex)
      .reduce(
        (total, segment) => total + segment.sec,
        0,
      )

    previousSegmentIndex.current = safeIndex - 1
    accumulatedElapsedRef.current = newElapsed
    runStartedAtRef.current = isRunning ? Date.now() : null
    setElapsedSeconds(newElapsed)
    setIsFinished(false)
    lastSpokenCue.current = ''
  }

  function handleRestart() {
    accumulatedElapsedRef.current = 0
    runStartedAtRef.current = null
    setElapsedSeconds(0)
    setIsRunning(false)
    setIsFinished(false)
    setShowSegmentCard(false)
    setShowDetails(false)
    setRadioText(
      'Radio connected. Press Start Ride when you are ready.',
    )

    previousSegmentIndex.current = 0
    lastSpokenCue.current = ''
    lastRandomCueTime.current = -999
    nextRandomCueTime.current = 50

    if (segmentCardTimer.current !== null) {
      window.clearTimeout(segmentCardTimer.current)
      segmentCardTimer.current = null
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

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

        .ride-unit-toggle {
          display: inline-flex;
          padding: 3px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
        }

        .ride-unit-toggle button {
          min-width: 48px;
          padding: 8px 11px;
          border-radius: 999px;
          border: 0;
          background: transparent;
        }

        .ride-unit-toggle button.active {
          background: #f46a00;
          color: #fff;
        }

        .cockpit-card {
          margin-top: 12px;
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

          .cockpit-card {
            margin-top: 8px;
            padding: 12px;
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
          ← Tactics
        </button>

        <div
          className="ride-unit-toggle"
          aria-label="Distance units"
        >
          <button
            type="button"
            className={measurementSystem === 'imperial' ? 'active' : ''}
            onClick={() => setMeasurementSystem('imperial')}
          >
            MI
          </button>
          <button
            type="button"
            className={measurementSystem === 'metric' ? 'active' : ''}
            onClick={() => setMeasurementSystem('metric')}
          >
            KM
          </button>
        </div>
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
          <div className="cockpit-card">
            <div className="cockpit-header">
              <div>
                <p className="eyebrow">CURRENT EFFORT</p>
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
                  {currentSegment.resistance}
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
                ? '▶ Start Ride'
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

          {showDetails && (
            <div className="ride-details">
              <div className="dashboard-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '14px',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <div>
                    <p className="eyebrow">STAGE PROFILE</p>
                    <strong>
                      {currentSegment.terrainLabel}
                    </strong>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <small>ROUTE</small>
                    <strong style={{ display: 'block' }}>
                      {formatDistance(routeKm, measurementSystem)}
                    </strong>
                  </div>
                </div>

                <div className="profile-wrap">
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                      width: '100%',
                      height: '115px',
                      display: 'block',
                      overflow: 'visible',
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="mountainFill"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="rgba(244,106,0,0.55)"
                        />
                        <stop
                          offset="100%"
                          stopColor="rgba(244,106,0,0.04)"
                        />
                      </linearGradient>
                    </defs>

                    <polygon
                      points={`0,100 ${profilePoints.join(
                        ' ',
                      )} 100,100`}
                      fill="url(#mountainFill)"
                    />

                    <polyline
                      points={profilePoints.join(' ')}
                      fill="none"
                      stroke="rgba(255,170,90,0.95)"
                      strokeWidth="2.2"
                      vectorEffect="non-scaling-stroke"
                    />

                    <line
                      x1={riderMarkerX}
                      x2={riderMarkerX}
                      y1="4"
                      y2="96"
                      stroke="rgba(255,255,255,0.55)"
                      strokeDasharray="4 4"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  <div
                    style={{
                      position: 'absolute',
                      left: `${riderMarkerX}%`,
                      top: '2px',
                      transform: 'translateX(-50%)',
                      fontSize: '1.5rem',
                      transition: 'left .25s linear',
                    }}
                  >
                    🚴
                  </div>
                </div>
              </div>

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

              <div className="segment-nav">
                <button
                  type="button"
                  onClick={() =>
                    jumpToSegment(segmentData.index - 1)
                  }
                  disabled={segmentData.index === 0}
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    jumpToSegment(segmentData.index + 1)
                  }
                  disabled={
                    segmentData.index ===
                    segments.length - 1
                  }
                >
                  Next →
                </button>
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

      {isFinished && (
        <DirectorReport
          stageNumber={stage.number}
          destination="Les Angles"
          rideTime={formatTime(stageDuration)}
          climbingTime={formatTime(climbingTime)}
          highIntensityTime={formatTime(
            highIntensityTime,
          )}
          segmentCount={segments.length}
          onContinue={onFinish}
        />
      )}
    </section>
  )
}

export default RideScreen