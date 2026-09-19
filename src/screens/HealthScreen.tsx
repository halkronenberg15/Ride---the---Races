import { useState } from 'react'
import { useCareer } from '../state/CareerContext'
import type { HealthEntry } from '../types/career'

type Props = { onBack: () => void }

function HealthScreen({ onBack }: Props) {
  const { career, updateHealth } = useCareer()
  const [entry, setEntry] = useState(career.health)
  const [saved, setSaved] = useState(false)
  function submit(event: React.FormEvent) { event.preventDefault(); const today=new Date(),localDate=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-'),next: HealthEntry = { ...entry, date:localDate }; updateHealth(next); setSaved(true) }
  return <section className="data-screen health-screen">
    <button className="back-button" type="button" onClick={onBack}>← Team HQ</button>
    <header><p className="eyebrow">READINESS • DAILY CHECK-IN</p><h1>How is the rider today?</h1><p>Manual inputs feed the same authoritative Readiness projection used by Team HQ, training adaptation and Jean. No direct WHOOP integration is claimed.</p></header>
    <form className="metric-form" onSubmit={submit}>
      <label>Sleep (hours)<input type="number" min="0" max="16" step="0.1" value={entry.sleepHours} onChange={(e) => setEntry({ ...entry, sleepHours: Number(e.target.value) })} /></label>
      <label>Recovery score<input type="number" min="0" max="100" value={entry.recoveryScore} onChange={(e) => setEntry({ ...entry, recoveryScore: Number(e.target.value) })} /></label>
      <label>Resting heart rate<input type="number" min="0" value={entry.restingHeartRate ?? ''} onChange={(e) => setEntry({ ...entry, restingHeartRate: Number(e.target.value) })} /></label>
      <label>HRV<input type="number" min="0" value={entry.hrv ?? ''} onChange={(e) => setEntry({ ...entry, hrv: Number(e.target.value) })} /></label>
      <label>Fatigue<input type="range" min="0" max="100" value={entry.fatigue} onChange={(e) => setEntry({ ...entry, fatigue: Number(e.target.value) })} /><span>{entry.fatigue}%</span></label>
      <label>Mood<select value={entry.mood} onChange={(e) => setEntry({ ...entry, mood: e.target.value as HealthEntry['mood'] })}><option>Low</option><option>Steady</option><option>Good</option><option>Excellent</option></select></label>
      <button className="primary-button wide-field" type="submit">Save daily check-in</button>
      {saved && <p className="success-message wide-field">Health profile updated. Jean has the latest numbers.</p>}
    </form>
  </section>
}
export default HealthScreen
