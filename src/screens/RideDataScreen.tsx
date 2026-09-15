import { useState } from 'react'
import { useCareer } from '../state/CareerContext'
import type { RideMetricEntry } from '../types/career'
import { formatDistance, ftToM, miToKm, mToFt, kmToMi } from '../utils/units'

type Props = { onBack: () => void }

function RideDataScreen({ onBack }: Props) {
  const { career, addRide,updateRideEntry } = useCareer()
  const system = career.settings.measurementSystem
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ durationMinutes: '45', distance: system === 'imperial' ? '12.4' : '20', averagePower: '', averageHeartRate: '', averageCadence: '', elevation: '', calories: '', notes: '' })
  const [formSystem, setFormSystem] = useState(system)
  const [editing,setEditing]=useState<string|null>(null)

  if (formSystem !== system) {
    setFormSystem(system)
    setForm((current) => ({
      ...current,
      distance: current.distance ? (system === 'imperial' ? kmToMi(Number(current.distance)).toFixed(1) : miToKm(Number(current.distance)).toFixed(1)) : '',
      elevation: current.elevation ? (system === 'imperial' ? Math.round(mToFt(Number(current.elevation))).toString() : Math.round(ftToM(Number(current.elevation))).toString()) : '',
    }))
  }

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
    <section className="history-list"><h2>Training and activity history</h2>{career.rideHistory.length === 0 ? <p>No rides logged yet.</p> : career.rideHistory.map((ride) => <details key={ride.id}><summary><strong>{ride.stageName??ride.activityType??'Ride'} · {ride.durationMinutes} min</strong></summary><dl>{[['Planned duration',ride.plannedDurationSeconds&&`${ride.plannedDurationSeconds}s`],['Actual duration',`${ride.durationMinutes} min`],['Total output',ride.totalOutputKj&&`${ride.totalOutputKj} kJ`],['Average power',ride.averagePower&&`${ride.averagePower} W`],['Peak power',ride.peakPower&&`${ride.peakPower} W`],['Average cadence',ride.averageCadence&&`${ride.averageCadence} rpm`],['Average resistance',ride.averageResistance&&`${ride.averageResistance}%`],['Average heart rate',ride.averageHeartRate&&`${ride.averageHeartRate} bpm`],['Maximum heart rate',ride.maximumHeartRate&&`${ride.maximumHeartRate} bpm`],['Distance',formatDistance(ride.distanceKm,system)],['Calories',ride.calories],['Strive Score',ride.striveScore],['RPE',ride.rpe],['Notes',ride.notes],['Completed',new Date(ride.date).toLocaleString()],['Duration version',ride.selectedDurationVersion],['FTP',ride.ftp?`${ride.ftp} W (${ride.ftpProvenance??'Unknown provenance'})`:'Unavailable'],['Equipment',ride.equipmentId??'Unavailable'],['Activity',ride.activityType??'Original activity']].map(([label,value])=><div key={String(label)}><dt>{label}</dt><dd>{value??'Unavailable'}</dd></div>)}</dl>{editing===ride.id?<form onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget),rpe=Number(data.get('rpe'));if(rpe<1||rpe>10)return;updateRideEntry(ride.id,{rpe,notes:String(data.get('notes')??'')});setEditing(null)}}><label>RPE (1–10)<input name="rpe" type="number" min="1" max="10" defaultValue={ride.rpe??5}/></label><label>Rider notes<textarea name="notes" defaultValue={ride.notes}/></label><button>Save corrected entry</button></form>:<button type="button" onClick={()=>setEditing(ride.id)}>Edit Entry</button>}</details>)}</section>
  </section>
}
export default RideDataScreen
