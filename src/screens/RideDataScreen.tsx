import { useEffect, useState } from 'react'
import { useCareer } from '../state/CareerContext'
import type { RideMetricEntry } from '../types/career'
import { formatDistance, formatElevation, ftToM, miToKm, mToFt, kmToMi } from '../utils/units'

type Props = { onBack: () => void }

function RideDataScreen({ onBack }: Props) {
  const { career, addRide } = useCareer()
  const system = career.settings.measurementSystem
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ durationMinutes: '45', distance: system === 'imperial' ? '12.4' : '20', averagePower: '', averageHeartRate: '', averageCadence: '', elevation: '', calories: '', notes: '' })

  useEffect(() => {
    setForm((current) => ({
      ...current,
      distance: current.distance ? (system === 'imperial' ? kmToMi(Number(current.distance)).toFixed(1) : miToKm(Number(current.distance)).toFixed(1)) : '',
      elevation: current.elevation ? (system === 'imperial' ? Math.round(mToFt(Number(current.elevation))).toString() : Math.round(ftToM(Number(current.elevation))).toString()) : '',
    }))
  }, [system])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const ride: RideMetricEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      source: 'Manual',
      durationMinutes: Number(form.durationMinutes),
      distanceKm: system === 'imperial' ? miToKm(Number(form.distance)) : Number(form.distance),
      averagePower: form.averagePower ? Number(form.averagePower) : undefined,
      averageHeartRate: form.averageHeartRate ? Number(form.averageHeartRate) : undefined,
      averageCadence: form.averageCadence ? Number(form.averageCadence) : undefined,
      elevationM: form.elevation ? (system === 'imperial' ? ftToM(Number(form.elevation)) : Number(form.elevation)) : undefined,
      calories: form.calories ? Number(form.calories) : undefined,
      notes: form.notes || undefined,
    }
    addRide(ride)
    setSaved(true)
  }

  return <section className="data-screen">
    <button className="back-button" type="button" onClick={onBack}>← Team HQ</button>
    <header><p className="eyebrow">RIDE DATA ENGINE • MVP</p><h1>Log a completed ride</h1><p>Manual entry works now. Your global {system} preference controls every distance, elevation, height, and weight measurement.</p></header>
    <div className="source-strip">{['Manual ✓', 'FIT', 'TCX', 'GPX', 'Garmin', 'Peloton', 'WHOOP', 'Strava'].map((source) => <span key={source}>{source}</span>)}</div>
    <form className="metric-form" onSubmit={submit}>
      {[
        ['durationMinutes', 'Duration (minutes)', true], ['distance', `Distance (${system === 'imperial' ? 'mi' : 'km'})`, true], ['averagePower', 'Average power (W)', false], ['averageHeartRate', 'Average heart rate (bpm)', false], ['averageCadence', 'Average cadence (rpm)', false], ['elevation', `Elevation gain (${system === 'imperial' ? 'ft' : 'm'})`, false], ['calories', 'Calories', false],
      ].map(([key, label, required]) => <label key={key as string}>{label}<input type="number" min="0" step="any" required={Boolean(required)} value={form[key as keyof typeof form]} onChange={(e) => { setSaved(false); setForm({ ...form, [key as string]: e.target.value }) }} /></label>)}
      <label className="wide-field">Ride notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="How did the legs feel?" /></label>
      <button className="primary-button wide-field" type="submit">Save ride metrics</button>
      {saved && <p className="success-message wide-field">Ride saved to the career record.</p>}
    </form>
    <section className="history-list"><h2>Recent rides</h2>{career.rideHistory.length === 0 ? <p>No rides logged yet.</p> : career.rideHistory.slice(0, 5).map((ride) => <article key={ride.id}><strong>{formatDistance(ride.distanceKm, system)} • {ride.durationMinutes} min</strong><span>{ride.elevationM ? `${formatElevation(ride.elevationM, system)} climbing • ` : ''}{ride.averagePower ? `${ride.averagePower} W avg • ` : ''}{new Date(ride.date).toLocaleDateString()}</span></article>)}</section>
  </section>
}
export default RideDataScreen
