import { useMemo, useState } from 'react'
import { useCareer } from '../state/CareerContext.tsx'
import { addTrainingFuel, updateTrainingFeedback, type RiderTrainingFeedback } from '../../packages/training-journal/src/index.ts'

type Props={onBack:()=>void}
const pretty=(value:string|undefined)=>value?value.replaceAll('_',' ').toLowerCase():'Not recorded'

export default function TrainingJournalScreen({onBack}:Props){
  const {career,updateTrainingJournal}=useCareer()
  const [selectedId,setSelectedId]=useState(career.trainingJournal.entries[0]?.id??null)
  const selected=useMemo(()=>career.trainingJournal.entries.find(entry=>entry.id===selectedId)??career.trainingJournal.entries[0]??null,[career.trainingJournal.entries,selectedId])

  function saveFeedback(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault()
    if(!selected)return
    const data=new FormData(event.currentTarget)
    const feedback:Partial<RiderTrainingFeedback>={
      legsAfter:String(data.get('legsAfter')??'') as RiderTrainingFeedback['legsAfter'],
      workBlocks:String(data.get('workBlocks')??'') as RiderTrainingFeedback['workBlocks'],
      recoveryBetweenBlocks:String(data.get('recoveryBetweenBlocks')??'') as RiderTrainingFeedback['recoveryBetweenBlocks'],
      lateSession:String(data.get('lateSession')??'') as RiderTrainingFeedback['lateSession'],
      freeText:String(data.get('freeText')??'').trim()||undefined,
    }
    updateTrainingJournal(state=>updateTrainingFeedback(state,selected.id,feedback))
  }

  function saveFuel(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault()
    if(!selected)return
    const data=new FormData(event.currentTarget),minute=Number(data.get('minute')),carbs=Number(data.get('carbs')),calories=Number(data.get('calories')),sodium=Number(data.get('sodium')),name=String(data.get('label')??'').trim()
    if(!name)return
    updateTrainingJournal(state=>addTrainingFuel(state,selected.id,{
      id:crypto.randomUUID(),minute:Number.isFinite(minute)?minute:undefined,kind:'OTHER',label:name,
      carbohydrateGrams:Number.isFinite(carbs)?carbs:undefined,calories:Number.isFinite(calories)?calories:undefined,sodiumMg:Number.isFinite(sodium)?sodium:undefined,
    }))
    event.currentTarget.reset()
  }

  return <section className="data-screen">
    <button className="back-button" type="button" onClick={onBack}>← Team HQ</button>
    <header><p className="eyebrow">MISSION FRANCE CONTROL • TRAINING JOURNAL</p><h1>Training evidence</h1><p>Ride numbers, fueling, rider feedback and coaching interpretation stay together so future adaptations can reason from the full session instead of a single metric.</p></header>

    {career.trainingJournal.entries.length===0?<article className="dashboard-card"><h2>No journal entries yet</h2><p>Completed rides and imported device data will build this record over time.</p></article>:<div className="hq-dashboard-grid">
      <aside className="dashboard-card"><p className="eyebrow">SESSIONS</p>{career.trainingJournal.entries.map(entry=><button key={entry.id} type="button" className="secondary-action" onClick={()=>setSelectedId(entry.id)} aria-pressed={entry.id===selected?.id}><strong>{entry.date}</strong> · {entry.title}</button>)}</aside>
      {selected&&<article className="dashboard-card">
        <p className="eyebrow">{selected.date} • {selected.sources.join(' + ')}</p><h2>{selected.title}</h2>
        <div className="mini-metrics">
          <span><strong>{selected.stats.durationSeconds?Math.floor(selected.stats.durationSeconds/60)+':'+String(selected.stats.durationSeconds%60).padStart(2,'0'):'—'}</strong> Duration</span>
          <span><strong>{selected.stats.averagePowerWatts??'—'}{selected.stats.averagePowerWatts?' W':''}</strong> Avg power</span>
          <span><strong>{selected.stats.averageCadenceRpm??'—'}{selected.stats.averageCadenceRpm?' rpm':''}</strong> Cadence</span>
          <span><strong>{selected.stats.averageHeartRateBpm??'—'}{selected.stats.averageHeartRateBpm?' bpm':''}</strong> Avg HR</span>
          <span><strong>{selected.stats.totalOutputKj??'—'}{selected.stats.totalOutputKj?' kJ':''}</strong> Output</span>
          <span><strong>{selected.stats.ftpWatts??'—'}{selected.stats.ftpWatts?' W':''}</strong> FTP</span>
        </div>
        <h3>Rider response</h3>
        <p><strong>Legs after:</strong> {pretty(selected.feedback.legsAfter)}</p><p><strong>Work blocks:</strong> {pretty(selected.feedback.workBlocks)}</p><p><strong>Recovery:</strong> {pretty(selected.feedback.recoveryBetweenBlocks)}</p><p><strong>Late session:</strong> {pretty(selected.feedback.lateSession)}</p>
        {selected.feedback.cadenceIntent&&<p><strong>Cadence intent:</strong> {selected.feedback.cadenceIntent}</p>}{selected.feedback.resistanceIntent&&<p><strong>Resistance intent:</strong> {selected.feedback.resistanceIntent}</p>}{selected.feedback.freeText&&<p>{selected.feedback.freeText}</p>}
        {selected.strength&&<><h3>Strength work</h3><p><strong>{selected.strength.plan.replace('_',' ')}</strong> · {selected.strength.completedMainWork?'Main work completed':'Main work incomplete'}</p>{selected.strength.exercises.map(exercise=><p key={exercise.name}><strong>{exercise.name}</strong> · {exercise.status.toLowerCase()} · {exercise.setsCompleted}/{exercise.targetSets??exercise.setsCompleted} sets{exercise.reps?' · '+exercise.reps+' reps':''}{exercise.reason?' · '+exercise.reason:''}</p>)}</>}
        <h3>Fueling</h3>{selected.fueling.length?selected.fueling.map(item=><p key={item.id}><strong>{item.minute!==undefined?'Minute '+item.minute+': ':''}{item.label}</strong>{item.carbohydrateGrams!==undefined?' · '+item.carbohydrateGrams+' g carbs':''}{item.calories!==undefined?' · '+item.calories+' kcal':''}{item.sodiumMg!==undefined?' · '+item.sodiumMg+' mg sodium':''}</p>):<p>No fueling logged.</p>}
        {selected.coach&&<section className="sync"><p className="eyebrow">JIMMY COACH INTERPRETATION</p><h3>{selected.coach.summary}</h3><ul>{selected.coach.signals.map(signal=><li key={signal}>{signal}</li>)}</ul><p><strong>Progression evidence:</strong> {pretty(selected.coach.progressionEvidence)}</p><p><strong>Next:</strong> {selected.coach.nextAction}</p></section>}
      </article>}
    </div>}

    {selected&&<div className="hq-dashboard-grid">
      <form className="dashboard-card metric-form" onSubmit={saveFeedback}><p className="eyebrow">POST-RIDE FEEDBACK</p><h2>Tell the coach what the numbers missed</h2>
        <label>Legs after<select name="legsAfter" defaultValue={selected.feedback.legsAfter??''}><option value="">Choose…</option><option value="FRESH">Fresh</option><option value="GOOD">Good</option><option value="NOTICEABLE_FATIGUE">Noticeable fatigue</option><option value="HEAVY">Heavy</option><option value="VERY_HEAVY">Very heavy</option></select></label>
        <label>Work blocks<select name="workBlocks" defaultValue={selected.feedback.workBlocks??''}><option value="">Choose…</option><option value="EASY">Easy</option><option value="CONTROLLED">Controlled</option><option value="CHALLENGING_WITH_RESERVE">Challenging with reserve</option><option value="LIMIT">At limit</option><option value="FAILED">Could not complete</option></select></label>
        <label>Recovery between blocks<select name="recoveryBetweenBlocks" defaultValue={selected.feedback.recoveryBetweenBlocks??''}><option value="">Choose…</option><option value="FULLY_READY">Fully ready</option><option value="MOSTLY_READY">Mostly ready</option><option value="PARTIAL">Partial</option><option value="NOT_READY">Not ready</option></select></label>
        <label>Late session<select name="lateSession" defaultValue={selected.feedback.lateSession??''}><option value="">Choose…</option><option value="STRONGER">Stronger</option><option value="STEADY">Steady</option><option value="FADING">Fading</option><option value="FAILED">Failed</option></select></label>
        <label className="wide-field">Notes<textarea name="freeText" defaultValue={selected.feedback.freeText}/></label><button className="primary-button wide-field" type="submit">Save feedback</button>
      </form>
      <form className="dashboard-card metric-form" onSubmit={saveFuel}><p className="eyebrow">FUELING</p><h2>Add ride fuel</h2><label>Minute<input name="minute" type="number" min="0"/></label><label>Fuel / drink<input name="label" required placeholder="Gel, drink mix, banana…"/></label><label>Carbs (g)<input name="carbs" type="number" min="0" step="0.1"/></label><label>Calories<input name="calories" type="number" min="0"/></label><label>Sodium (mg)<input name="sodium" type="number" min="0"/></label><button className="primary-button wide-field" type="submit">Add fueling</button></form>
    </div>}
  </section>
}
