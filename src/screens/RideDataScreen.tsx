import { useState } from 'react'
import { useCareer } from '../state/CareerContext'
import { createDevelopmentProfile } from '../engine/alpha4025.ts'
import type { RideMetricEntry } from '../types/career'
import { formatDistance, ftToM, miToKm, mToFt, kmToMi } from '../utils/units'

type Props = { onBack: () => void }

function RideDataScreen({ onBack }: Props) {
  const { career, addRide,updateRideEntry,updateRider,updateAlpha4025 } = useCareer()
  const system = career.settings.measurementSystem
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ durationMinutes: '45', distance: system === 'imperial' ? '12.4' : '20', averagePower: '', averageHeartRate: '', averageCadence: '', elevation: '', calories: '', notes: '' })
  const [formSystem, setFormSystem] = useState(system)
  const [editing,setEditing]=useState<string|null>(null)
  const [ftpAverage,setFtpAverage]=useState('')
  const latestFtpRide=career.rideHistory.find(ride=>ride.activityType==='FTP_ASSESSMENT')
  const latestFtpRecorded=latestFtpRide?career.alpha4025.ftpAssessments.some(item=>item.date===latestFtpRide.date.slice(0,10)):false
  const calculatedFtp=ftpAverage&&Number(ftpAverage)>0?Math.round(Number(ftpAverage)*0.95):null

  if (formSystem !== system) {
    setFormSystem(system)
    setForm((current) => ({
      ...current,
      distance: current.distance ? (system === 'imperial' ? kmToMi(Number(current.distance)).toFixed(1) : miToKm(Number(current.distance)).toFixed(1)) : '',
      elevation: current.elevation ? (system === 'imperial' ? Math.round(mToFt(Number(current.elevation))).toString() : Math.round(ftToM(Number(current.elevation))).toString()) : '',
    }))
  }

  function saveFtpAssessment(event:React.FormEvent){
    event.preventDefault()
    if(!latestFtpRide||calculatedFtp===null||Number(ftpAverage)<50||Number(ftpAverage)>1000)return
    const date=latestFtpRide.date.slice(0,10)
    updateRider({ftp:calculatedFtp,ftpKnown:true,ftpProvenance:'MEASURED'})
    updateAlpha4025(old=>{
      const intake=old.intake?{...old.intake,ftp:calculatedFtp}:old.intake
      return {...old,intake,developmentProfile:intake?createDevelopmentProfile(intake):old.developmentProfile,ftpAssessments:[{date,testAverageWatts:Number(ftpAverage),ftpWatts:calculatedFtp,source:'Manual',recovered:true},...old.ftpAssessments.filter(item=>item.date!==date)]}
    })
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
    {latestFtpRide&&!latestFtpRecorded&&<form className="ftp-result-card" onSubmit={saveFtpAssessment}><p className="eyebrow">RTR FTP TEST COMPLETE</p><h1>Establish your RtR FTP</h1><p>Enter the average power from the 20-minute test interval. RtR uses 95% of that average as your FTP.</p><label>20-minute average power (W)<input type="number" inputMode="numeric" min="50" max="1000" value={ftpAverage} onChange={event=>setFtpAverage(event.target.value.replace(/\D/g,''))} placeholder="e.g. 241"/></label><div className="ftp-result-preview"><span>20-min average<strong>{ftpAverage||'—'} W</strong></span><span>Calculated RtR FTP<strong>{calculatedFtp??'—'} W</strong></span></div><button className="primary-button" type="submit" disabled={calculatedFtp===null}>Save RtR FTP</button><small>This becomes the rider’s measured FTP and will scale future FTP-based training targets.</small></form>}
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
    <section className="history-list"><h2>Training and activity history</h2>{career.rideHistory.length===0?<p>No rides logged yet.</p>:career.rideHistory.map(ride=>{const value={...ride,...ride.correctedEntry};return <details key={ride.id}><summary><strong>{ride.stageName??ride.activityType??'Ride'} · {value.durationMinutes} min{ride.updatedAt?' · EDITED':''}</strong></summary><dl>{[['Planned duration',ride.plannedDurationSeconds&&`${ride.plannedDurationSeconds}s`],['Actual duration',`${value.durationMinutes} min`],['Total output',value.totalOutputKj&&`${value.totalOutputKj} kJ`],['Average power',value.averagePower&&`${value.averagePower} W`],['Peak power',value.peakPower&&`${value.peakPower} W`],['Average cadence',value.averageCadence&&`${value.averageCadence} rpm`],['Average resistance',value.averageResistance&&`${value.averageResistance}%`],['Average heart rate',value.averageHeartRate&&`${value.averageHeartRate} bpm`],['Maximum heart rate',value.maximumHeartRate&&`${value.maximumHeartRate} bpm`],['Distance',formatDistance(value.distanceKm,system)],['Calories',value.calories],['Strive Score',value.striveScore],['RPE',value.rpe],['Notes',value.notes],['Completed',new Date(ride.date).toLocaleString()],['Duration version',ride.selectedDurationVersion],['FTP',ride.ftp?`${ride.ftp} W (${ride.ftpProvenance??'Unknown provenance'})`:'Unavailable'],['Equipment',value.equipmentId??'Unavailable'],['Activity',ride.activityType??'Original activity']].map(([label,item])=><div key={String(label)}><dt>{label}</dt><dd>{item??'Unavailable'}</dd></div>)}</dl>{ride.originalUserEntry&&<details><summary>Compare original submitted entry</summary><pre>{JSON.stringify(ride.originalUserEntry,null,2)}</pre></details>}{editing===ride.id?<form onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget),number=(key:string)=>data.get(key)===''?undefined:Number(data.get(key)),patch={durationMinutes:number('durationMinutes')!,actualEngineDurationSeconds:number('durationMinutes')!*60,totalOutputKj:number('totalOutputKj'),averagePower:number('averagePower'),peakPower:number('peakPower'),averageCadence:number('averageCadence'),averageResistance:number('averageResistance'),averageHeartRate:number('averageHeartRate'),maximumHeartRate:number('maximumHeartRate'),distanceKm:number('distanceKm')!,calories:number('calories'),striveScore:number('striveScore'),rpe:number('rpe'),notes:String(data.get('notes')??''),equipmentId:String(data.get('equipmentId')??'')||undefined};if(!Number.isFinite(patch.durationMinutes)||patch.durationMinutes<1||patch.durationMinutes>1440||!Number.isFinite(patch.distanceKm)||patch.distanceKm<0||patch.distanceKm>1000||(patch.averagePower&&patch.peakPower&&patch.peakPower<patch.averagePower)||(patch.averageHeartRate&&patch.maximumHeartRate&&patch.maximumHeartRate<patch.averageHeartRate))return;updateRideEntry(ride.id,patch);setEditing(null)}}>{[['durationMinutes','Actual duration (min)',1,1440],['totalOutputKj','Total output (kJ)',0,10000],['averagePower','Average power (W)',0,2500],['peakPower','Maximum power (W)',0,3000],['averageCadence','Average cadence (rpm)',20,200],['averageResistance','Average resistance (%)',0,100],['averageHeartRate','Average heart rate (bpm)',30,250],['maximumHeartRate','Maximum heart rate (bpm)',30,250],['distanceKm','Distance (km)',0,1000],['calories','Calories',0,20000],['striveScore','Strive Score',0,1000],['rpe','RPE',1,10]].map(([key,label,min,max])=><label key={String(key)}>{label}<input name={String(key)} type="number" step="any" min={min} max={max} defaultValue={String(value[key as keyof typeof value]??'')}/></label>)}<label>Equipment used<input name="equipmentId" defaultValue={value.equipmentId}/></label><label>Notes<textarea name="notes" defaultValue={value.notes}/></label><p>Canonical stage, planned duration, race identity, completion ID, target snapshots and archived classifications are immutable.</p><button>Save corrections</button><button type="button" onClick={()=>setEditing(null)}>Cancel</button></form>:<button type="button" onClick={()=>setEditing(ride.id)}>Edit Entry</button>}</details>})}</section>
  </section>
}
export default RideDataScreen
