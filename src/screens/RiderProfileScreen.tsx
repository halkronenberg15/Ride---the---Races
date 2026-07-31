import { useEffect, useRef, useState } from 'react'
import { useCareer } from '../state/CareerContext'
import type { RiderArchetype } from '../types/career'
import { cmToIn, inToCm, kgToLb, lbToKg } from '../utils/units'

const archetypes: RiderArchetype[] = [
  'GC Contender', 'Sprinter', 'Climber', 'Puncheur', 'Time Trial Specialist', 'All-Rounder', 'Domestique',
]

type Props = { onBack: () => void }

function RiderProfileScreen({ onBack }: Props) {
  const { career, updateRider } = useCareer()
  const system = career.settings.measurementSystem
  const [name, setName] = useState(career.rider.name)
  const [number, setNumber] = useState(career.rider.number)
  const [ftp, setFtp] = useState(career.rider.ftp)
  const [height, setHeight] = useState(career.rider.heightCm ? (system === 'imperial' ? cmToIn(career.rider.heightCm) : career.rider.heightCm) : 0)
  const [weight, setWeight] = useState(career.rider.weightKg ? (system === 'imperial' ? kgToLb(career.rider.weightKg) : career.rider.weightKg) : 0)
  const [archetype, setArchetype] = useState<RiderArchetype>(career.rider.archetype)
  const [saved, setSaved] = useState(false)
  const previousSystem = useRef(system)

  useEffect(() => {
    if (previousSystem.current === system) return
    setHeight((value) => value > 0 ? (system === 'imperial' ? cmToIn(value) : inToCm(value)) : value)
    setWeight((value) => value > 0 ? (system === 'imperial' ? kgToLb(value) : lbToKg(value)) : value)
    previousSystem.current = system
  }, [system])

  function save() {
    updateRider({
      name: name.trim() || 'Rider',
      number: Math.max(1, Math.min(999, number)),
      ftp: Math.max(60, Math.min(600, ftp)),
      heightCm: height > 0 ? (system === 'imperial' ? inToCm(height) : height) : undefined,
      weightKg: weight > 0 ? (system === 'imperial' ? lbToKg(weight) : weight) : undefined,
      archetype,
    })
    setSaved(true)
  }

  return (
    <section style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <button type="button" onClick={onBack}>← Team HQ</button>
      <header style={{ margin: '30px 0' }}>
        <p className="eyebrow">CAREER SETUP</p>
        <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', margin: 0 }}>Build Your Rider</h1>
        <p style={{ opacity: .75, maxWidth: 700 }}>Use the global unit switch in the upper-right corner at any time. Ride the Races stores one clean internal record and displays it in your preferred system.</p>
      </header>

      <div className="dashboard-card" style={{ display: 'grid', gap: 18 }}>
        <label>Rider name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Race number<input type="number" min="1" max="999" value={number} onChange={(e) => setNumber(Number(e.target.value))} /></label>
        <label>Current FTP (watts)<input type="number" min="60" max="600" value={ftp} onChange={(e) => setFtp(Number(e.target.value))} /></label>
        <label>Height ({system === 'imperial' ? 'in' : 'cm'})<input type="number" min="0" step="0.1" value={height || ''} onChange={(e) => setHeight(Number(e.target.value))} /></label>
        <label>Weight ({system === 'imperial' ? 'lb' : 'kg'})<input type="number" min="0" step="0.1" value={weight || ''} onChange={(e) => setWeight(Number(e.target.value))} /></label>
        <label>Rider archetype
          <select value={archetype} onChange={(e) => setArchetype(e.target.value as RiderArchetype)}>
            {archetypes.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <small style={{ opacity: .7 }}>Power remains in watts, heart rate in bpm, and cadence in rpm in both systems.</small>
        <button type="button" onClick={save}>Save Rider Profile</button>
        {saved && <strong role="status">✓ Profile saved. Your stage targets have been recalculated.</strong>}
      </div>
    </section>
  )
}

export default RiderProfileScreen
