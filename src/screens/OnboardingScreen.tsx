import { useState } from 'react'
import { useCareer } from '../state/CareerContext'
import type { CareerState, DeviceSource, ExperienceLevel, RiderArchetype, SeasonGoal } from '../types/career'
import { cmToIn, inToCm, kgToLb, lbToKg } from '../utils/units'

const archetypes: RiderArchetype[] = ['GC Contender', 'Sprinter', 'Climber', 'Puncheur', 'Time Trial Specialist', 'All-Rounder', 'Domestique']
const experiences: ExperienceLevel[] = ['Beginner', 'Recreational', 'Intermediate', 'Advanced', 'Competitive']
const goals: SeasonGoal[] = ['Improve fitness', 'Increase FTP', 'Ride longer', 'Lose weight', 'Complete a Gran Fondo', 'Race stronger', 'Win the Tour']
const devices: DeviceSource[] = ['Garmin', 'Peloton', 'WHOOP', 'Strava', 'Wahoo', 'Zwift', 'Apple Health', 'Manual only']

const stepTitles = ['Meet the rider', 'Your engine', 'Season objective', 'Connected kit', 'Rider identity', 'Welcome to the team']

export default function OnboardingScreen() {
  const { career, completeOnboarding } = useCareer()
  const system = career.settings.measurementSystem
  const [step, setStep] = useState(0)
  const [rider, setRider] = useState<CareerState['rider']>(career.rider)

  function patch(values: Partial<CareerState['rider']>) {
    setRider((current) => ({ ...current, ...values }))
  }

  function toggleDevice(device: DeviceSource) {
    if (device === 'Manual only') {
      patch({ devices: ['Manual only'] })
      return
    }
    const withoutManual = rider.devices.filter((item) => item !== 'Manual only')
    patch({ devices: withoutManual.includes(device) ? withoutManual.filter((item) => item !== device) : [...withoutManual, device] })
  }

  const canContinue = rider.name.trim().length > 1 && rider.nationality.trim().length > 1 && rider.number > 0 && rider.ftp > 0

  return (
    <section className="onboarding-screen">
      <div className="onboarding-shell">
        <div className="onboarding-progress" aria-label={`Step ${step + 1} of ${stepTitles.length}`}>
          {stepTitles.map((title, index) => <span className={index <= step ? 'active' : ''} key={title} />)}
        </div>

        <header className="onboarding-header">
          <p className="eyebrow">ÉQUIPE LORIOT • CAREER INTAKE</p>
          <h1>{stepTitles[step]}</h1>
          <p>Jean Moreau is building your rider file. This is your career, scaled to your body, goals, and experience.</p>
        </header>

        <div className="onboarding-card">
          {step === 0 && <div className="wizard-grid">
            <label>Rider name<input value={rider.name} onChange={(event) => patch({ name: event.target.value })} /></label>
            <label>Nationality<input value={rider.nationality} onChange={(event) => patch({ nationality: event.target.value })} /></label>
            <label>Race number<input type="number" min="1" max="999" value={rider.number} onChange={(event) => patch({ number: Number(event.target.value) })} /></label>
            <label>Height ({system === 'imperial' ? 'in' : 'cm'})<input type="number" min={system === 'imperial' ? 39 : 100} max={system === 'imperial' ? 91 : 230} step="0.1" value={rider.heightCm ? (system === 'imperial' ? cmToIn(rider.heightCm).toFixed(1) : rider.heightCm) : ''} onChange={(event) => patch({ heightCm: event.target.value ? (system === 'imperial' ? inToCm(Number(event.target.value)) : Number(event.target.value)) : undefined })} /></label>
            <label>Weight ({system === 'imperial' ? 'lb' : 'kg'})<input type="number" min={system === 'imperial' ? 77 : 35} max={system === 'imperial' ? 551 : 250} step="0.1" value={rider.weightKg ? (system === 'imperial' ? kgToLb(rider.weightKg).toFixed(1) : rider.weightKg) : ''} onChange={(event) => patch({ weightKg: event.target.value ? (system === 'imperial' ? lbToKg(Number(event.target.value)) : Number(event.target.value)) : undefined })} /></label>
          </div>}

          {step === 1 && <>
            <h2>How do you ride today?</h2>
            <div className="choice-grid">{experiences.map((experience) => <button className={rider.experience === experience ? 'selected' : ''} onClick={() => patch({ experience })} key={experience}>{experience}</button>)}</div>
            <div className="ftp-panel">
              <label><input type="checkbox" checked={!rider.ftpKnown} onChange={(event) => patch({ ftpKnown: !event.target.checked, ftp: event.target.checked ? 150 : rider.ftp })} /> I do not know my FTP yet</label>
              <label>Current or estimated FTP<input type="number" min="50" max="600" value={rider.ftp} onChange={(event) => patch({ ftp: Number(event.target.value) })} /></label>
              <p>FTP sets the scale, not your worth. Every stage will adapt to your current fitness.</p>
            </div>
          </>}

          {step === 2 && <><h2>What would make this season meaningful?</h2><div className="choice-grid goals">{goals.map((goal) => <button className={rider.seasonGoal === goal ? 'selected' : ''} onClick={() => patch({ seasonGoal: goal })} key={goal}>{goal}</button>)}</div></>}

          {step === 3 && <><h2>How will your rides reach the team car?</h2><div className="choice-grid devices">{devices.map((device) => <button className={rider.devices.includes(device) ? 'selected' : ''} onClick={() => toggleDevice(device)} key={device}>{device}</button>)}</div><p className="wizard-note">Connections are recorded now. Live syncing arrives in later sprints. Manual entry remains available to every rider.</p></>}

          {step === 4 && <><h2>Choose your role in the peloton</h2><div className="archetype-grid">{archetypes.map((archetype) => <button className={rider.archetype === archetype ? 'selected' : ''} onClick={() => patch({ archetype })} key={archetype}><strong>{archetype}</strong><span>{archetype === 'GC Contender' ? 'Climb, recover, and protect time across the whole race.' : archetype === 'Sprinter' ? 'Survive the road, then detonate in the final meters.' : archetype === 'Climber' ? 'Make steep roads your hunting ground.' : archetype === 'Puncheur' ? 'Attack short climbs and chaotic finales.' : archetype === 'Time Trial Specialist' ? 'Turn pacing and aerodynamics into seconds gained.' : archetype === 'Domestique' ? 'Serve the team and earn leadership through execution.' : 'Adapt to terrain and seize the day’s opportunity.'}</span></button>)}</div></>}

          {step === 5 && <div className="welcome-panel">
            <p className="eyebrow">JEAN MOREAU • DIRECTEUR SPORTIF</p>
            <blockquote>“Welcome to Équipe Loriot, {rider.name.split(' ')[0]}. You are Rider #{rider.number}. We will train at your level, race with purpose, and ask for a little more when the road allows.”</blockquote>
            <div className="rider-summary"><span>{rider.archetype}</span><span>{rider.experience}</span><span>{rider.ftpKnown ? `${rider.ftp} W FTP` : 'FTP assessment pending'}</span><span>{rider.seasonGoal}</span></div>
          </div>}
        </div>

        <footer className="wizard-actions">
          <button type="button" className="back-button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</button>
          {step < stepTitles.length - 1 ? <button type="button" className="primary-button" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>Continue →</button> : <button type="button" className="primary-button" onClick={() => completeOnboarding(rider)}>Begin career →</button>}
        </footer>
      </div>
    </section>
  )
}
