import { useState } from 'react'
import { raceStages } from '../data/raceStages'
import { teamLoriot } from '../game/team'
import { useCareer } from '../state/CareerContext'
import { formatDistance, formatElevation, kmToMi, mToFt } from '../utils/units'

type TeamBusScreenProps = {
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

function TeamBusScreen({
  selectedStageNumber,
  onSelectStage,
  onBack,
  onContinue,
  onOpenRestDay,
}: TeamBusScreenProps) {
  const { career } = useCareer()
  const [expandedStage, setExpandedStage] = useState(selectedStageNumber)
  const [showRoster, setShowRoster] = useState(false)
  const selectedStage = raceStages.find((stage) => stage.number === selectedStageNumber) ?? raceStages[0]

  function selectStage(stageNumber: number) {
    onSelectStage(stageNumber)
    setExpandedStage((current) => current === stageNumber ? 0 : stageNumber)
  }

  return (
    <section className="team-bus-screen alpha38-team-bus">
      <button type="button" onClick={onBack}>← Back Home</button>

      <header className="compact-page-header">
        <p className="eyebrow">{teamLoriot.name.toUpperCase()}</p>
        <h1>Team Bus</h1>
        <p>Tour Roadbook • 21 stages • Two rest days</p>
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

      <section className="dashboard-card roadbook-calendar">
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
      </section>

      <section className="dashboard-card compact-start-list">
        <div className="section-title-row">
          <div><p className="eyebrow">STAGE {selectedStage.number}</p><h2>Start List</h2></div>
          <small>All eight riders active</small>
        </div>
        <p>{teamLoriot.riders.map((rider) => rider.name.split(' ')[0]).join(' • ')}</p>
        <div className="selected-stage-summary">
          <strong>{selectedStage.route}</strong>
          <span>{formatDistance(selectedStage.distanceKm, career.settings.measurementSystem)} • {formatElevation(selectedStage.elevationM, career.settings.measurementSystem)} D+</span>
        </div>
      </section>

      <button type="button" className="primary-cta team-bus-continue" onClick={onContinue}>Open Stage {selectedStage.number} Race Briefing</button>
    </section>
  )
}

export default TeamBusScreen
