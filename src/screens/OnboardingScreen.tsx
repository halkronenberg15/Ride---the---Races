import { useState } from 'react'
import { useCareer } from '../state/CareerContext'
import type { CareerState, DeviceSource, ExperienceLevel, MeasurementSystem, RiderArchetype, SeasonGoal } from '../types/career'
import { cmToIn, inToCm, kgToLb, lbToKg } from '../utils/units'

const archetypes: RiderArchetype[] = ['GC Contender', 'Sprinter', 'Climber', 'Puncheur', 'Time Trial Specialist', 'All-Rounder', 'Domestique']
const experiences: ExperienceLevel[] = ['Beginner', 'Recreational', 'Intermediate', 'Advanced', 'Competitive']
const goals: SeasonGoal[] = ['Improve fitness', 'Increase FTP', 'Ride longer', 'Lose weight', 'Complete a Gran Fondo', 'Race stronger', 'Win the Tour']
const devices: DeviceSource[] = ['Garmin', 'Peloton', 'WHOOP', 'Strava', 'Wahoo', 'Zwift', 'Apple Health', 'Manual only']
const stepTitles = ['Meet the rider', 'Your engine', 'Season objective', 'Connected kit', 'Rider identity', 'Welcome to the team']

export default function OnboardingScreen() {
  const { career, completeOnboarding, setMeasurementSystem } = useCareer()
  const [system, setSystem] = useState<MeasurementSystem>(career.settings.measurementSystem)
  const [step, setStep] = useState(0)
  const [rider, setRider] = useState<CareerState['rider']>(career.rider)
  const [numberText, setNumberText] = useState(String(career.rider.number || ''))
  const [heightText, setHeightText] = useState(career.rider.heightCm ? String(system === 'imperial' ? Math.round(cmToIn(career.rider.heightCm)) : Math.round(career.rider.heightCm)) : '')
  const [weightText, setWeightText] = useState(career.rider.weightKg ? String(system === 'imperial' ? Math.round(kgToLb(career.rider.weightKg)) : Math.round(career.rider.weightKg)) : '')
  const [ftpText, setFtpText] = useState(String(career.rider.ftp || ''))

  function patch(values: Partial<CareerState['rider']>) {
    setRider((current) => ({ ...current, ...values }))
  }

  function chooseSystem(next: MeasurementSystem) {
    if (next === system) return
    const height = Number(heightText)
    const weight = Number(weightText)
    setHeightText(heightText ? String(Math.round(next === 'imperial' ? cmToIn(height) : inToCm(height))) : '')
    setWeightText(weightText ? String(Math.round(next === 'imperial' ? kgToLb(weight) : lbToKg(weight))) : '')
    setSystem(next)
  }

  function commitNumbers() {
    const number = Number(numberText)
    const height = Number(heightText)
    const weight = Number(weightText)
    const ftp = Number(ftpText)
    patch({
      number: Number.isFinite(number) ? number : rider.number,
      heightCm: Number.isFinite(height) && height > 0 ? (system === 'imperial' ? inToCm(height) : height) : undefined,
      weightKg: Number.isFinite(weight) && weight > 0 ? (system === 'imperial' ? lbToKg(weight) : weight) : undefined,
      ftp: Number.isFinite(ftp) && ftp > 0 ? ftp : rider.ftp,
    })
  }

  function toggleDevice(device: DeviceSource) {
    if (device === 'Manual only') return patch({ devices: ['Manual only'] })
    const withoutManual = rider.devices.filter((item) => item !== 'Manual only')
    patch({ devices: withoutManual.includes(device) ? withoutManual.filter((item) => item !== device) : [...withoutManual, device] })
  }

  const canContinue = rider.name.trim().length > 1 && rider.nationality.trim().length > 1 && Number(numberText) > 0 && Number(ftpText) > 0

  return (
    <section className="onboarding-screen">
      <div className="onboarding-shell">
        <div className="onboarding-progress" aria-label={`Step ${step + 1} of ${stepTitles.length}`}>
          {stepTitles.map((title, index) => <span className={index <= step ? 'active' : ''} key={title} />)}
        </div>
        <header className="onboarding-header">
          <p className="eyebrow">ÉQUIPE LORIOT • CAREER INTAKE</p>
          <h1>{stepTitles[step]}</h1>
          <p>Jean Moreau is building your rider file. This career scales to your body, goals, and experience.</p>
        </header>
        <div className="onboarding-card">
          {step === 0 && <>
            <div className="unit-choice-panel">
              <span>Preferred measurements</span>
              <div className="unit-choice-buttons">
                <button type="button" className={system === 'imperial' ? 'selected' : ''} onClick={() => chooseSystem('imperial')}>Imperial</button>
                <button type="button" className={system === 'metric' ? 'selected' : ''} onClick={() => chooseSystem('metric')}>Metric</button>
              </div>
              <small>You can change this later in Settings.</small>
            </div>
            <div className="wizard-grid">
              <label>Rider name<input value={rider.name} onChange={(event) => patch({ name: event.target.value })} /></label>
              <label>Nationality<input value={rider.nationality} onChange={(event) => patch({ nationality: event.target.value })} /></label>
              <label>Race number<input inputMode="numeric" pattern="[0-9]*" value={numberText} onChange={(event) => setNumberText(event.target.value.replace(/\D/g, ''))} onBlur={commitNumbers} /></label>
              <label>Height ({system === 'imperial' ? 'in' : 'cm'})<input inputMode="decimal" value={heightText} onChange={(event) => setHeightText(event.target.value.replace(/[^0-9.]/g, ''))} onBlur={commitNumbers} /></label>
              <label>Weight ({system === 'imperial' ? 'lb' : 'kg'})<input inputMode="decimal" value={weightText} onChange={(event) => setWeightText(event.target.value.replace(/[^0-9.]/g, ''))} onBlur={commitNumbers} /></label>
            </div>
          </>}
          {step === 1 && <>
            <h2>How do you ride today?</h2>
            <div className="choice-grid">{experiences.map((experience) => <button className={rider.experience === experience ? 'selected' : ''} onClick={() => patch({ experience })} key={experience}>{experience}</button>)}</div>
            <div className="ftp-panel">
              <label><input type="checkbox" checked={!rider.ftpKnown} onChange={(event) => { patch({ ftpKnown: !event.target.checked }); if (event.target.checked) setFtpText('150') }} /> I do not know my FTP yet</label>
              <label>Current or estimated FTP<input inputMode="numeric" pattern="[0-9]*" value={ftpText} onChange={(event) => setFtpText(event.target.value.replace(/\D/g, ''))} onBlur={commitNumbers} /></label>
              <p>FTP sets the scale, not your worth. Every stage adapts to your current fitness.</p>
            </div>
          </>}
          {step === 2 && <><h2>What would make this season meaningful?</h2><div className="choice-grid goals">{goals.map((goal) => <button className={rider.seasonGoal === goal ? 'selected' : ''} onClick={() => patch({ seasonGoal: goal })} key={goal}>{goal}</button>)}</div></>}
          {step === 3 && <><h2>How will your rides reach the team car?</h2><div className="choice-grid devices">{devices.map((device) => <button className={rider.devices.includes(device) ? 'selected' : ''} onClick={() => toggleDevice(device)} key={device}>{device}</button>)}</div><p className="wizard-note">Connections are recorded now. Manual entry remains available to every rider.</p></>}
          {step === 4 && <><h2>Choose your role in the peloton</h2><div className="archetype-grid">{archetypes.map((archetype) => <button className={rider.archetype === archetype ? 'selected' : ''} onClick={() => patch({ archetype })} key={archetype}><strong>{archetype}</strong><span>{archetype === 'GC Contender' ? 'Climb, recover, and protect time across the whole race.' : archetype === 'Sprinter' ? 'Survive the road, then detonate in the final meters.' : archetype === 'Climber' ? 'Make steep roads your hunting ground.' : archetype === 'Puncheur' ? 'Attack short climbs and chaotic finales.' : archetype === 'Time Trial Specialist' ? 'Turn pacing and aerodynamics into seconds gained.' : archetype === 'Domestique' ? 'Serve the team and earn leadership through execution.' : 'Adapt to terrain and seize the day’s opportunity.'}</span></button>)}</div></>}
          {step === 5 && <div className="welcome-panel"><p className="eyebrow">JEAN MOREAU • DIRECTEUR SPORTIF</p><blockquote>“Welcome to Équipe Loriot, {rider.name.split(' ')[0]}. You are Rider #{numberText}. We will train at your level, race with purpose, and ask for a little more when the road allows.”</blockquote><div className="rider-summary"><span>{rider.archetype}</span><span>{rider.experience}</span><span>{rider.ftpKnown ? `${ftpText} W FTP` : 'FTP assessment pending'}</span><span>{rider.seasonGoal}</span></div></div>}
        </div>
        <footer className="wizard-actions">
          <button type="button" className="back-button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</button>
          {step < stepTitles.length - 1 ? <button type="button" className="primary-button" disabled={!canContinue} onClick={() => { commitNumbers(); setMeasurementSystem(system); setStep((current) => current + 1) }}>Continue →</button> : <button type="button" className="primary-button" onClick={() => { commitNumbers(); setMeasurementSystem(system); completeOnboarding({ ...rider, number: Number(numberText), ftp: Number(ftpText), heightCm: heightText ? (system === 'imperial' ? inToCm(Number(heightText)) : Number(heightText)) : undefined, weightKg: weightText ? (system === 'imperial' ? lbToKg(Number(weightText)) : Number(weightText)) : undefined }) }}>Begin career →</button>}
        </footer>
      </div>
    </section>
  )
}
