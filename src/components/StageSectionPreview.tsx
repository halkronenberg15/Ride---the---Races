import { useState } from 'react'
import type { RideSegment } from '../data/raceStages'
import { buildGradientSections } from '../engine/gradientRoad'
import { isClimb } from '../engine/stageEngine'
import { buildSprintPhases } from '../engine/sprintPhases'
import { formatDistance } from '../utils/units'
import type { MeasurementSystem } from '../types/career'

type Props = { stageNumber: number; segments: RideSegment[]; measurementSystem: MeasurementSystem }
const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export default function StageSectionPreview({ stageNumber, segments, measurementSystem }: Props) {
  const [selected, setSelected] = useState(0)
  const segment = segments[selected]
  const gradients = isClimb(segment) ? buildGradientSections(`${stageNumber}-${selected}-${segment.name}-${segment.type}`, segment.sec, segment.zone) : []
  const sprintPhases = buildSprintPhases(segment)
  return <section className="dashboard-card preview-card stage-section-preview" aria-label="Full stage section preview">
    <div className="section-title-row"><div><p className="eyebrow">STAGE SECTION PREVIEW</p><h2>The whole road ahead</h2></div><small>Inspection only · does not change ride progress</small></div>
    <div className="section-preview-list">
      {segments.map((item, index) => <button key={`${item.name}-${index}`} type="button" className={`section-preview-button${selected === index ? ' previewing' : ''}`} onClick={() => setSelected(index)} aria-pressed={selected === index}>
        <small>{index + 1}/{segments.length} · {item.type}</small><strong>{item.icon} {item.name}</strong>
      </button>)}
    </div>
    <div className="preview-detail" aria-live="polite">
      <p className="eyebrow">SECTION {selected + 1} · {segment.type}</p><h3>{segment.name}</h3><p className="muted">{segment.description}</p>
      <div className="preview-grid">
        <span className="preview-stat"><small>DURATION</small><strong>{time(segment.sec)}</strong></span>
        <span className="preview-stat"><small>ROAD MARKER</small><strong>{formatDistance(segment.routeKm, measurementSystem)}</strong></span>
        <span className="preview-stat"><small>ZONE</small><strong>{segment.zone}</strong></span>
        <span className="preview-stat"><small>POWER</small><strong>{segment.power}</strong></span>
        <span className="preview-stat"><small>CADENCE</small><strong>{segment.cadence}</strong></span>
        <span className="preview-stat"><small>RESISTANCE</small><strong>{segment.resistance}</strong></span>
      </div>
      <p><strong>Jean / team objective:</strong> {segment.objective}. {segment.secondaryObjective}</p>
      {gradients.length > 0 && <p><strong>Climb / terrain:</strong> {gradients.map((item) => `${item.gradient}%`).join(' · ')}</p>}
      {sprintPhases.length > 0 && <p><strong>Sprint phases:</strong> {sprintPhases.map((phase) => `${phase.name} ${phase.zone} · ${phase.power} · ${phase.cadence} · ${phase.resistance}`).join(' | ')}</p>}
    </div>
  </section>
}
