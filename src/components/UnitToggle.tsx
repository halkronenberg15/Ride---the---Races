import { useCareer } from '../state/CareerContext'

export default function UnitToggle() {
  const { career, setMeasurementSystem } = useCareer()
  const system = career.settings.measurementSystem

  return (
    <div className="global-unit-toggle" aria-label="Measurement system">
      <button type="button" className={system === 'imperial' ? 'active' : ''} onClick={() => setMeasurementSystem('imperial')}>Imperial</button>
      <button type="button" className={system === 'metric' ? 'active' : ''} onClick={() => setMeasurementSystem('metric')}>Metric</button>
    </div>
  )
}
