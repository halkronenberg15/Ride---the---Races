import { useState } from 'react'
import { useCareer } from '../state/CareerContext'
import type { CareerState, ConnectionMethod, DeviceSource, ExperienceLevel, MeasurementSystem, RiderArchetype, SeasonGoal } from '../types/career'
import { cmToIn, inToCm, kgToLb, lbToKg } from '../utils/units'
import { advanceOnboarding, canAdvanceOnboarding } from '../engine/onboardingFlow'

const archetypes: RiderArchetype[] = ['GC Contender', 'Sprinter', 'Climber', 'Puncheur', 'Time Trial Specialist', 'All-Rounder', 'Domestique']
const experiences: ExperienceLevel[] = ['Beginner', 'Recreational', 'Intermediate', 'Advanced', 'Competitive']
const goals: SeasonGoal[] = ['Improve fitness', 'Increase FTP', 'Ride longer', 'Lose weight', 'Complete a Gran Fondo', 'Race stronger', 'Win the Tour']
const equipmentChoices:Array<{label:string;device:DeviceSource;description:string}>=[
  {label:'Peloton Bike / Bike+',device:'Peloton',description:'Live power, cadence, and Peloton resistance instructions. You adjust resistance manually; direct Peloton telemetry is not connected. Activates the Peloton BASELINE profile.'},
  {label:'Other manual bike',device:'Manual only',description:'Power and cadence guidance where available. Peloton-native resistance is hidden; exact resistance requires a supported bike-specific profile.'},
  {label:'Smart trainer / smart bike',device:'Wahoo',description:'Guidance is available, but automatic resistance control and a direct smart-equipment connection are planned—not currently operational.'},
]
const connectionChoices:Array<{id:ConnectionMethod;label:string;description:string}>=[
  {id:'manual-guidance',label:'Manual guidance',description:'Available now. Follow RtR targets and adjust the bike yourself.'},
  {id:'post-ride-import',label:'Post-ride import',description:'Available now. Record elsewhere and import the completed activity afterward.'},
]
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

  function selectEquipment(device:DeviceSource){patch({devices:[device]})}
  const selectedEquipment=equipmentChoices.find(choice=>rider.devices.includes(choice.device))
  const connectionMethod=rider.connectionMethod??'manual-guidance'

  const numbers={numberText,heightText,weightText,ftpText}
  const canContinue=canAdvanceOnboarding(step,rider,numbers)
  function submit(event:React.FormEvent){event.preventDefault();if(!canContinue)return;commitNumbers();setMeasurementSystem(system);if(step<stepTitles.length-1)setStep(current=>advanceOnboarding(current,rider,numbers));else completeOnboarding({ ...rider, number:Number(numberText),ftp:Number(ftpText)||0,heightCm:system==='imperial'?inToCm(Number(heightText)):Number(heightText),weightKg:system==='imperial'?lbToKg(Number(weightText)):Number(weightText) })}

  return (
    <section className="onboarding-screen">
      <form className="onboarding-shell" onSubmit={submit}>
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
            <div className="choice-grid">{experiences.map((experience) => <button type="button" className={rider.experience === experience ? 'selected' : ''} onClick={() => patch({ experience })} key={experience}>{experience}</button>)}</div>
            <div className="ftp-panel">
              <label><input type="checkbox" checked={!rider.ftpKnown} onChange={(event) => { patch({ ftpKnown: !event.target.checked }); if (event.target.checked) setFtpText('150') }} /> I do not know my FTP yet</label>
              <label>Current or estimated FTP<input inputMode="numeric" pattern="[0-9]*" value={ftpText} onChange={(event) => setFtpText(event.target.value.replace(/\D/g, ''))} onBlur={commitNumbers} /></label>
              <p>FTP sets the scale, not your worth. Every stage adapts to your current fitness.</p>
            </div>
          </>}
          {step === 2 && <><h2>What would make this season meaningful?</h2><div className="choice-grid goals">{goals.map((goal) => <button type="button" className={rider.seasonGoal === goal ? 'selected' : ''} onClick={() => patch({ seasonGoal: goal })} key={goal}>{goal}</button>)}</div></>}
          {step === 3 && <><h2>Choose your equipment</h2><p className="wizard-note">Equipment determines which live bike instructions RtR can provide. It is separate from how ride data reaches RtR.</p><div className="archetype-grid">{equipmentChoices.map(choice=><button type="button" className={rider.devices.includes(choice.device)?'selected':''} onClick={()=>selectEquipment(choice.device)} key={choice.label}><strong>{choice.label}</strong><span>{choice.description}</span></button>)}</div><h3>Connection method</h3><div className="choice-grid">{connectionChoices.map(choice=><button type="button" className={connectionMethod===choice.id?'selected':''} onClick={()=>patch({connectionMethod:choice.id})} key={choice.id}><strong>{choice.label}</strong><small>{choice.description}</small></button>)}</div><div className="wizard-note"><strong>Connected sensors:</strong> Coming later · <strong>Connected smart equipment:</strong> Coming later</div>{selectedEquipment&&<div className="rider-summary" aria-label="Your setup"><strong>Your setup:</strong><span>{selectedEquipment.label}</span><span>{selectedEquipment.device==='Peloton'?'Manual resistance control':selectedEquipment.device==='Manual only'?'Manual resistance control':'Automatic control: Not connected'}</span><span>{selectedEquipment.device==='Peloton'?'Peloton BASELINE calibration':selectedEquipment.device==='Manual only'?'Bike-specific calibration: Unavailable':'Smart control adapter: Planned'}</span><span>Live bike telemetry: Not connected</span><span>Connection: {connectionChoices.find(choice=>choice.id===connectionMethod)?.label}</span></div>}</>}
          {step === 4 && <><h2>Choose your role in the peloton</h2><div className="archetype-grid">{archetypes.map((archetype) => <button type="button" className={rider.archetype === archetype ? 'selected' : ''} onClick={() => patch({ archetype })} key={archetype}><strong>{archetype}</strong><span>{archetype === 'GC Contender' ? 'Climb, recover, and protect time across the whole race.' : archetype === 'Sprinter' ? 'Survive the road, then detonate in the final meters.' : archetype === 'Climber' ? 'Make steep roads your hunting ground.' : archetype === 'Puncheur' ? 'Attack short climbs and chaotic finales.' : archetype === 'Time Trial Specialist' ? 'Turn pacing and aerodynamics into seconds gained.' : archetype === 'Domestique' ? 'Serve the team and earn leadership through execution.' : 'Adapt to terrain and seize the day’s opportunity.'}</span></button>)}</div></>}
          {step === 5 && <div className="welcome-panel"><p className="eyebrow">JEAN MOREAU • DIRECTEUR SPORTIF</p><blockquote>“Welcome to Équipe Loriot, {rider.name.split(' ')[0]}. You are Rider #{numberText}. We will train at your level, race with purpose, and ask for a little more when the road allows.”</blockquote><div className="rider-summary"><span>{rider.archetype}</span><span>{rider.experience}</span><span>{rider.ftpKnown ? `${ftpText} W FTP` : 'FTP assessment pending'}</span><span>{rider.seasonGoal}</span></div></div>}
        </div>
        <footer className="wizard-actions">
          <button type="button" className="back-button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</button>
          {step < stepTitles.length - 1 ? <button type="submit" className="primary-button" disabled={!canContinue}>Continue →</button> : <button type="submit" className="primary-button" disabled={!canContinue}>Begin career →</button>}
        </footer>
      </form>
    </section>
  )
}
