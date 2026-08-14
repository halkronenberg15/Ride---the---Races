import { useState } from 'react'
import { raceStages } from '../data/raceStages'
import { teamLoriot } from '../game/team'
import { useCareer } from '../state/CareerContext'
import { formatDistance, formatElevation, kmToMi, mToFt } from '../utils/units'
import { trainingRides, vuelta2026 } from '../data/raceLibrary'
import { seasons } from '../data/seasonCalendar'

type RaceLibraryScreenProps = {
  library: string
  selectedStageNumber: number
  onSelectStage: (stageNumber: number) => void
  onBack: () => void
  onContinue: () => void
  onOpenRestDay: () => void
}

function dualDistance(km: number) {
  return `${km.toFixed(1)} km • ${kmToMi(km).toFixed(1)} mi`
}

function dualElevation(meters: number) {
  return `${Math.round(meters).toLocaleString()} m • ${Math.round(mToFt(meters)).toLocaleString()} ft`
}

function RaceLibraryScreen({
  library,
  selectedStageNumber,
  onSelectStage,
  onBack,
  onContinue,
  onOpenRestDay,
}: RaceLibraryScreenProps) {
  const { career } = useCareer()
  const [expandedStage, setExpandedStage] = useState(selectedStageNumber)
  const [showRoster, setShowRoster] = useState(false)
  const raceMetadata = seasons.flatMap((season) => season.races).find((race) => race.raceLibraryId === library)
  const selectedStage = raceStages.find((stage) => stage.number === selectedStageNumber) ?? raceStages[0]

  function selectStage(stageNumber: number) {
    onSelectStage(stageNumber)
    setExpandedStage((current) => current === stageNumber ? 0 : stageNumber)
  }

  return (
    <section className="team-bus-screen alpha38-team-bus">
      <button type="button" onClick={onBack}>← Back</button>

      <header className="compact-page-header">
        <p className="eyebrow">{teamLoriot.name.toUpperCase()}</p>
        <h1>{library === 'training' ? 'Training Rides' : raceMetadata?.name ?? 'Race Roadbook'}</h1>
        <p>Dedicated roadbook • One unified ride engine</p>
      </header>

      <div className="bus-toolbar">
        <button type="button" onClick={() => setShowRoster((value) => !value)}>
          👥 Team Roster <span>{teamLoriot.riders.length} riders</span>
        </button>
        <div className="bus-status">
          <span>Selected</span>
          <strong>Stage {selectedStage.number}</strong>
        </div>
      </div>

      {showRoster && (
        <section className="dashboard-card compact-roster">
          <div className="section-title-row">
            <div><p className="eyebrow">TEAM LORIOT</p><h2>Roster</h2></div>
            <button type="button" onClick={() => setShowRoster(false)}>Close</button>
          </div>
          <div className="roster-grid">
            {teamLoriot.riders.map((rider) => (
              <article key={rider.name}>
                <strong>{rider.name}</strong>
                <span>Climb {rider.climbing} • Endurance {rider.endurance} • IQ {rider.raceIQ}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {library !== 'tour-2026' && library !== 'vuelta-2026' && library !== 'training' && <section className="dashboard-card roadbook-calendar race-shell"><p className="eyebrow">{raceMetadata?.raceType ?? 'RACE'}</p><h2>Roadbook in preparation</h2><p>{raceMetadata?.stageCount ?? 1} stage{raceMetadata?.stageCount === 1 ? '' : 's'} scheduled. Team Loriot route details will arrive here without changing the season navigation.</p></section>}

      {library === 'tour-2026' && <section className="dashboard-card roadbook-calendar">
        <div className="section-title-row">
          <div><p className="eyebrow">TOUR CALENDAR</p><h2>Stage Roadbook</h2></div>
          <small>Tap a stage to expand</small>
        </div>

        <div className="calendar-stage-list">
          {raceStages.map((stage) => {
            const minutes = Math.round(stage.segments.reduce((sum, segment) => sum + segment.sec, 0) / 60)
            const selected = stage.number === selectedStageNumber
            const expanded = stage.number === expandedStage
            return (
              <div className={`calendar-stage${selected ? ' selected' : ''}`} key={stage.number}>
                <button type="button" className="calendar-stage-row" onClick={() => selectStage(stage.number)} aria-expanded={expanded}>
                  <span className="calendar-day">{String(stage.number).padStart(2, '0')}</span>
                  <span className="calendar-route">
                    <strong>{stage.route}</strong>
                    <small>{stage.theme} • {minutes} min</small>
                  </span>
                  <span className="calendar-state">{career.season.completedStages.includes(stage.number) ? '✓' : selected ? 'TODAY' : expanded ? '−' : '+'}</span>
                </button>

                {expanded && (
                  <div className="stage-expansion">
                    <div className="mini-stage-profile" aria-label={`Stage ${stage.number} profile`}>
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon points={`0,100 ${stage.profilePoints.join(' ')} 100,100`} />
                        <polyline points={stage.profilePoints.join(' ')} />
                      </svg>
                    </div>
                    <div className="stage-preview-metrics">
                      <span><small>DISTANCE</small><strong>{dualDistance(stage.distanceKm)}</strong></span>
                      <span><small>ELEVATION</small><strong>{dualElevation(stage.elevationM)}</strong></span>
                      <span><small>RIDE TIME</small><strong>{minutes} min</strong></span>
                    </div>
                    <p>{stage.objective}</p>
                    {selected && <button type="button" className="primary-cta" onClick={onContinue}>Open Race Briefing →</button>}
                  </div>
                )}

                {stage.number === 9 && <button type="button" className="rest-day-row" onClick={onOpenRestDay}>🛌 Rest Day 1 • Recovery and team review</button>}
                {stage.number === 15 && <button type="button" className="rest-day-row" onClick={onOpenRestDay}>🛌 Rest Day 2 • Recovery and final-week preparation</button>}
              </div>
            )
          })}
        </div>
      </section>}

      {library === 'vuelta-2026' && <section className="dashboard-card roadbook-calendar">
        <div className="section-title-row"><div><p className="eyebrow">LA VUELTA 2026</p><h2>Official Calendar Shell</h2></div><small>21 stages • Two rest days</small></div>
        <p className="muted">Calendar metadata is ready for incremental sections, climbs, sprint/KOM markers, and Jean objectives. Detailed rides will use the existing synchronized stage engine.</p>
        <div className="calendar-stage-list">{vuelta2026.stages.map((stage) => <div className="calendar-stage" key={stage.number}><div className="calendar-stage-row"><span className="calendar-day">{String(stage.number).padStart(2,'0')}</span><span className="calendar-route"><strong>{stage.start} → {stage.finish}</strong><small>{stage.type} • {stage.distanceKm} km</small></span><span className="calendar-state">PLANNED</span></div>{vuelta2026.restDays.find(day => day.afterStage === stage.number) && <div className="rest-day-row">🛌 {vuelta2026.restDays.find(day => day.afterStage === stage.number)?.label}</div>}</div>)}</div>
      </section>}

      {library === 'training' && <section className="dashboard-card roadbook-calendar">
        <div className="section-title-row"><div><p className="eyebrow">TEAM LORIOT TRAINING</p><h2>Recovery & Leg Openers</h2></div><small>Does not advance race progress</small></div>
        <div className="training-library-grid">{trainingRides.map((ride) => <article className="training-ride-card" key={ride.id}><p className="eyebrow">{ride.difficulty} • {ride.zones}</p><h3>{ride.name}</h3><strong>{ride.durationMinutes} MINUTES</strong><p>{ride.purpose}</p><blockquote>Jean: “{ride.jeanDescription}”</blockquote><button type="button" disabled title="Ride profiles arrive incrementally">Profile coming soon</button></article>)}</div>
      </section>}

      {library === 'tour-2026' && <section className="dashboard-card compact-start-list">
        <div className="section-title-row">
          <div><p className="eyebrow">STAGE {selectedStage.number}</p><h2>Start List</h2></div>
          <small>All eight riders active</small>
        </div>
        <p>{teamLoriot.riders.map((rider) => rider.name.split(' ')[0]).join(' • ')}</p>
        <div className="selected-stage-summary">
          <strong>{selectedStage.route}</strong>
          <span>{formatDistance(selectedStage.distanceKm, career.settings.measurementSystem)} • {formatElevation(selectedStage.elevationM, career.settings.measurementSystem)} D+</span>
        </div>
      </section>}

      {library === 'tour-2026' && <button type="button" className="primary-cta team-bus-continue" onClick={onContinue}>Open Stage {selectedStage.number} Race Briefing</button>}
    </section>
  )
}

export default RaceLibraryScreen
