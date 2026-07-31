import { useState } from 'react'
import { useCareer } from '../state/CareerContext'
import type { HealthEntry } from '../types/career'

type Props = { onBack: () => void }

function HealthScreen({ onBack }: Props) {
  const { career, updateHealth } = useCareer()
  const [entry, setEntry] = useState(career.health)
  const [saved, setSaved] = useState(false)
  function submit(event: React.FormEvent) { event.preventDefault(); const next: HealthEntry = { ...entry, date: new Date().toISOString().slice(0, 10) }; updateHealth(next); setSaved(true) }
  return <section className="data-screen">
    <button className="back-button" type="button" onClick={onBack}>← Team HQ</button>
    <header><p className="eyebrow">HEALTH ENGINE • DAILY CHECK-IN</p><h1>How is the rider today?</h1><p>Readiness will eventually combine connected recovery data with the rider's own check-in.</p></header>
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
