import { useState } from 'react'
import type { RideSegment } from '../data/raceStages'
import { buildGradientSections } from '../engine/gradientRoad'
import { isClimb } from '../engine/stageEngine'
import { buildSprintPhases } from '../engine/sprintPhases'
import { formatDistance } from '../utils/units'
import type { MeasurementSystem } from '../types/career'
import { composeSentences } from '../utils/text'
import type { CadencePreferences, EquipmentInstance } from '../engine/manualBike'
import { resolvePreviewTarget } from '../engine/previewTargets'
import { PreviewTargetValues } from './PreviewTargetValues'

type Props = { stageNumber: number; segments: RideSegment[]; measurementSystem: MeasurementSystem;ftp:number;equipment:EquipmentInstance;cadencePreferences?:CadencePreferences }
const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export default function StageSectionPreview({ stageNumber, segments, measurementSystem,ftp,equipment,cadencePreferences }: Props) {
  const [selected, setSelected] = useState(0)
  const segment = segments[selected]
  const gradients = isClimb(segment) ? buildGradientSections(`${stageNumber}-${selected}-${segment.name}-${segment.type}`, segment.sec, segment.zone) : []
  const sprintPhases = buildSprintPhases(segment)
  const target=resolvePreviewTarget(segment,ftp,equipment,cadencePreferences,gradients[0]?.gradient??0)
  return <section className="dashboard-card preview-card stage-section-preview" aria-label="Full stage section preview">
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
        <PreviewTargetValues target={target}/>
      </div>
      <p><strong>Jean / team objective:</strong> {composeSentences(segment.objective, segment.secondaryObjective)}</p>
      {gradients.length > 0 && <p><strong>Climb / terrain:</strong> {gradients.map((item) => `${item.gradient}%`).join(' · ')}</p>}
      {sprintPhases.length > 0 && <div><strong>Sprint phases:</strong>{sprintPhases.map((phase) => {const phaseTarget=resolvePreviewTarget({...segment,...phase,sec:Math.max(1,phase.end-phase.start)},ftp,equipment,cadencePreferences);return <p key={phase.name}>{phase.name} · {phaseTarget.power} · {phaseTarget.cadence} · {phaseTarget.resistance}</p>})}</div>}
    </div>
  </section>
}
