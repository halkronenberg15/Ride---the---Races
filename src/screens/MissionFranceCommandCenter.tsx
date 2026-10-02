import { useMemo, useState } from 'react'
import { missionFranceSnapshot } from '../engine/missionFrance2028.ts'
import { jimmyCoachContext, jimmyCoachOpeningLine } from '../engine/jimmyCoach.ts'
import { evaluateFueling } from '../engine/fuelingEngine.ts'
import { buildMenuHorizon, mealPlanForDay, type MealHorizon } from '../engine/mealPlanningEngine.ts'
import { useCareer } from '../state/CareerContext.tsx'
import type { NutritionEntry, NutritionMealTemplate, NutritionMealType } from '../types/career.ts'

type Props={
 onBack:()=>void
 onOpenHealth:()=>void
 onOpenRideData:()=>void
 onOpenOffSeason:()=>void
}

const miles=(km:number)=>km*0.621371
const today=()=>{const date=new Date();return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}

export default function MissionFranceCommandCenter({onBack,onOpenHealth,onOpenRideData,onOpenOffSeason}:Props){
 const {career,addNutritionEntry,importNutritionData,updateNutritionProfile}=useCareer()
 const snapshot=missionFranceSnapshot(career)
 const jimmyContext=jimmyCoachContext(career)
 const [jimmyOpen,setJimmyOpen]=useState(false)
 const powerToWeight=snapshot.ftp!==null&&snapshot.weightKg?snapshot.ftp/snapshot.weightKg:null
 const [mealType,setMealType]=useState<NutritionMealType>('Snack')
 const [name,setName]=useState('')
 const [calories,setCalories]=useState('')
 const [protein,setProtein]=useState('')
 const [carbs,setCarbs]=useState('')
 const [fluid,setFluid]=useState('')
 const [remember,setRemember]=useState(true)
 const [saved,setSaved]=useState('')
 const [importMessage,setImportMessage]=useState('')
 const [rideHistoryOpen,setRideHistoryOpen]=useState(false)
 const [menuHorizon,setMenuHorizon]=useState<MealHorizon>('DAY')
 const [goalLowLb,setGoalLowLb]=useState(career.nutrition.goalWeightLowKg?String(Math.round(career.nutrition.goalWeightLowKg*2.20462)):'')
 const [goalHighLb,setGoalHighLb]=useState(career.nutrition.goalWeightHighKg?String(Math.round(career.nutrition.goalWeightHighKg*2.20462)):'')
 const templates=useMemo(()=>[...career.nutrition.mealTemplates].sort((a,b)=>b.timesUsed-a.timesUsed||b.lastUsedAt.localeCompare(a.lastUsedAt)),[career.nutrition.mealTemplates])
 const todayKey=today(),tomorrowDate=new Date();tomorrowDate.setDate(tomorrowDate.getDate()+1);const tomorrowKey=[tomorrowDate.getFullYear(),String(tomorrowDate.getMonth()+1).padStart(2,'0'),String(tomorrowDate.getDate()).padStart(2,'0')].join('-')
 const assignments=career.alpha4025.trainingPlan?.weeks.flatMap(week=>week.assignments)??[]
 const activeToday=assignments.filter(item=>item.date===todayKey&&(item.status==='PLANNED'||item.status==='REPLACED')&&Number(item.durationMinutes??0)>0)
 const activeTomorrow=assignments.filter(item=>item.date===tomorrowKey&&(item.status==='PLANNED'||item.status==='REPLACED')&&Number(item.durationMinutes??0)>0)
 const trainingMinutes=activeToday.reduce((sum,item)=>sum+Number(item.durationMinutes??0),0)
 const rideMinutes=activeToday.filter(item=>item.type==='CYCLING'||item.type==='ASSESSMENT').reduce((sum,item)=>sum+Number(item.durationMinutes??0),0)
 const demanding=activeToday.some(item=>item.demandingCycling===true)
 const tomorrowMinutes=activeTomorrow.reduce((sum,item)=>sum+Number(item.durationMinutes??0),0)
 const todayEntries=career.nutrition.entries.filter(entry=>entry.date===today())
 const totals=todayEntries.reduce((sum,entry)=>({calories:sum.calories+(entry.calories??0),protein:sum.protein+(entry.proteinG??0),carbs:sum.carbs+(entry.carbsG??0),fluid:sum.fluid+(entry.fluidOz??0)}),{calories:0,protein:0,carbs:0,fluid:0})
 const fueling=evaluateFueling({weightKg:career.rider.weightKg,goalLowKg:career.nutrition.goalWeightLowKg,goalHighKg:career.nutrition.goalWeightHighKg,trainingMinutes,rideMinutes,demanding,tomorrowTrainingMinutes:tomorrowMinutes,loggedProteinG:totals.protein,loggedCarbsG:totals.carbs,loggedCalories:totals.calories})
 const plan=mealPlanForDay({dayClass:fueling.dayClass,favorites:career.nutrition.favoriteFoods,recentFoods:templates.slice(0,8).map(item=>item.name),avoidFoods:career.nutrition.avoidFoods,userRecipes:templates.map(item=>({id:item.id,name:item.name,mealType:item.mealType,proteinG:item.proteinG,carbsG:item.carbsG,calories:item.calories,tags:['user','saved'],source:'USER' as const}))})
 const menu=buildMenuHorizon(menuHorizon,plan)
 const saveWeightGoals=()=>updateNutritionProfile({goalWeightLowKg:goalLowLb?Number(goalLowLb)/2.20462:undefined,goalWeightHighKg:goalHighLb?Number(goalHighLb)/2.20462:undefined})
 const useTemplate=(id:string)=>{const template=templates.find(item=>item.id===id);if(!template)return;setMealType(template.mealType);setName(template.name);setCalories(template.calories?.toString()??'');setProtein(template.proteinG?.toString()??'');setCarbs(template.carbsG?.toString()??'');setFluid(template.fluidOz?.toString()??'');setSaved('')}
 const submit=(event:React.FormEvent)=>{event.preventDefault();const trimmed=name.trim();if(!trimmed)return;addNutritionEntry({id:crypto.randomUUID(),loggedAt:new Date().toISOString(),date:today(),mealType,name:trimmed,calories:calories===''?undefined:Number(calories),proteinG:protein===''?undefined:Number(protein),carbsG:carbs===''?undefined:Number(carbs),fluidOz:fluid===''?undefined:Number(fluid)},remember);setSaved(trimmed);setName('');setCalories('');setProtein('');setCarbs('');setFluid('')}
 const importHistory=async(event:React.ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text()) as {entries?:NutritionEntry[];mealTemplates?:NutritionMealTemplate[]};const entries=Array.isArray(parsed.entries)?parsed.entries:[],templates=Array.isArray(parsed.mealTemplates)?parsed.mealTemplates:[];importNutritionData(entries,templates);setImportMessage(`Imported ${entries.length} nutrition entries and ${templates.length} meal templates.`)}catch{setImportMessage('Could not import that nutrition file. Use the Mission France nutrition JSON export format.')}finally{event.target.value=''}}
 return <section className="mission-france-screen">
  <button type="button" className="back-button" onClick={onBack}>← Team HQ</button>
  <header className="mission-france-hero">
   <p className="eyebrow">MISSION FRANCE 2028</p>
   <h1>Build the rider for the mountains.</h1>
   <p>One place to connect training, recovery, body composition, fueling and mountain-readiness evidence. No invented readiness score. Every conclusion below comes from data already recorded in RtR.</p>
  </header>

  <section className="mission-today-grid" aria-label="Current Mission France evidence">
   <article className="dashboard-card mission-primary-card"><small>FTP</small><strong>{snapshot.ftp===null?'Not set':snapshot.ftp+' W'}</strong><span>{powerToWeight!==null?powerToWeight.toFixed(2)+' W/kg from current rider weight':'Add current weight to show power-to-weight'}</span></article>
   <article className="dashboard-card"><small>LAST 7 DAYS</small><strong>{snapshot.rides7} rides · {snapshot.minutes7} min</strong><span>{miles(snapshot.distance7Km).toFixed(1)} mi recorded</span></article>
   <article className="dashboard-card"><small>LONGEST RIDE</small><strong>{snapshot.longestMinutes?snapshot.longestMinutes+' min':'—'}</strong><span>Recorded RtR ride history</span></article>
   <article className="dashboard-card"><small>BEST RIDING STREAK</small><strong>{snapshot.backToBack?snapshot.backToBack+' days':'—'}</strong><span>Consecutive days with recorded rides</span></article>
  </section>

  <section className="dashboard-card mission-ride-history">
   <div className="section-title-row"><div><p className="eyebrow">RIDE HISTORY</p><h2>Your recorded rides</h2><p>{career.rideHistory.length} rides are stored in RtR.</p></div><button type="button" className="secondary-action" onClick={()=>setRideHistoryOpen(value=>!value)}>{rideHistoryOpen?'Hide rides':'View rides'}</button></div>
   {rideHistoryOpen&&<div className="mission-ride-list">{career.rideHistory.length===0?<p>No rides logged yet.</p>:career.rideHistory.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(ride=>{const value={...ride,...ride.correctedEntry};return <details key={ride.id} className="mission-ride-item"><summary><strong>{ride.stageName??ride.activityType??'Ride'}</strong><span>{new Date(ride.date).toLocaleDateString()} · {value.durationMinutes} min · {miles(value.distanceKm).toFixed(1)} mi</span></summary><div className="mission-ride-metrics"><span><strong>{value.averagePower??'—'}{value.averagePower?' W':''}</strong>Avg power</span><span><strong>{value.averageHeartRate??'—'}{value.averageHeartRate?' bpm':''}</strong>Avg HR</span><span><strong>{value.averageCadence??'—'}{value.averageCadence?' rpm':''}</strong>Cadence</span><span><strong>{value.totalOutputKj??'—'}{value.totalOutputKj?' kJ':''}</strong>Output</span></div>{value.notes&&<p>{value.notes}</p>}</details>})}<button type="button" className="secondary-action" onClick={onOpenRideData}>Open full ride data history</button></div>}
  </section>

  <section className="dashboard-card mission-daily-command">
   <div><p className="eyebrow">TODAY</p><h2>What should the Command Center know?</h2><p>Keep the inputs authoritative. Add what actually happened, then let RtR connect the dots.</p></div>
   <div className="mission-actions">
    <button type="button" onClick={onOpenHealth}>Update recovery</button>
    <button type="button" onClick={onOpenRideData}>Log / review ride data</button>
    <button type="button" onClick={onOpenOffSeason}>Open training plan</button>
   </div>
  </section>

  <section className="dashboard-card mission-nutrition">
   <div className="section-title-row"><div><p className="eyebrow">NUTRITION · FUELING ENGINE</p><h2>{fueling.question}</h2><p>Training demand sets the fueling floor. Weight loss happens around the work, not by starving the work.</p></div><div className="nutrition-totals"><strong>{Math.round(totals.protein)}g</strong><span>protein</span><strong>{Math.round(totals.carbs)}g</strong><span>carbs</span></div></div>
   <div className="nutrition-fuel-grid"><article><small>DAY CLASS</small><strong>{fueling.dayClass}</strong></article><article><small>PROTEIN</small><strong>{fueling.proteinStatus}</strong><span>{fueling.proteinTargetG?fueling.proteinTargetG.join('–')+' g target':'Add current weight'}</span></article><article><small>CARBS</small><strong>{fueling.carbStatus}</strong><span>{fueling.carbTargetG?fueling.carbTargetG.join('–')+' g target':'Add current weight'}</span></article><article><small>WEIGHT PHASE</small><strong>{fueling.weightPhase}</strong></article></div>
   <div className="nutrition-goal-row"><label>Goal low (lb)<input type="number" value={goalLowLb} onChange={event=>setGoalLowLb(event.target.value)}/></label><label>Goal high (lb)<input type="number" value={goalHighLb} onChange={event=>setGoalHighLb(event.target.value)}/></label><button type="button" onClick={saveWeightGoals}>Save goal range</button></div>
   <div className="fuel-guidance">{fueling.guidance.map(item=><p key={item}>{item}</p>)}</div>
   <div className="menu-horizon"><div>{(['HOUR','DAY','WEEK','MONTH'] as MealHorizon[]).map(item=><button type="button" key={item} className={menuHorizon===item?'active':''} onClick={()=>setMenuHorizon(item)}>{item}</button>)}</div>{menu.map(section=><article key={section.label}><h3>{section.label}</h3>{section.meals.map(meal=><div key={meal.id} className="planned-meal"><strong>{meal.time} · {meal.recipe.name}</strong><span>{meal.rationale}</span></div>)}</article>)}</div>
   {templates.length>0&&<div className="remembered-meals" aria-label="Remembered meals">{templates.slice(0,8).map(template=><button type="button" key={template.id} onClick={()=>useTemplate(template.id)}><strong>{template.name}</strong><small>{template.proteinG!==undefined?template.proteinG+'g P · ':''}{template.carbsG!==undefined?template.carbsG+'g C · ':''}{template.calories!==undefined?template.calories+' cal':''}</small></button>)}</div>}
   <form className="nutrition-quick-form" onSubmit={submit}>
    <label>Meal<select value={mealType} onChange={event=>setMealType(event.target.value as NutritionMealType)}><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option><option>Ride Fuel</option><option>Recovery</option></select></label>
    <label className="nutrition-name">What did you eat?<input value={name} onChange={event=>setName(event.target.value)} placeholder="e.g. Fajita bowl" /></label>
    <label>Calories<input type="number" min="0" value={calories} onChange={event=>setCalories(event.target.value)} /></label>
    <label>Protein g<input type="number" min="0" step="0.1" value={protein} onChange={event=>setProtein(event.target.value)} /></label>
    <label>Carbs g<input type="number" min="0" step="0.1" value={carbs} onChange={event=>setCarbs(event.target.value)} /></label>
    <label>Fluid oz<input type="number" min="0" step="0.1" value={fluid} onChange={event=>setFluid(event.target.value)} /></label>
    <label className="remember-meal"><input type="checkbox" checked={remember} onChange={event=>setRemember(event.target.checked)} /> Remember this meal for one-tap entry</label>
    <button type="submit" className="primary-cta">Log meal</button>
   </form>
   <div className="nutrition-import file-picker"><label htmlFor="nutrition-history-file"><strong>Import nutrition history</strong><small>Select the Mission France nutrition JSON file from Files.</small></label><input id="nutrition-history-file" type="file" accept=".json,application/json,text/json" onChange={importHistory} /></div>
   {importMessage&&<p className="success-message">{importMessage}</p>}
   {saved&&<p className="success-message">Logged {saved}. RtR {remember?'remembered it for next time.':'added it to today.'}</p>}
   {todayEntries.length>0&&<details className="today-food-log"><summary>Today’s food · {todayEntries.length} entries</summary>{todayEntries.map(entry=><div key={entry.id}><strong>{entry.name}</strong><small>{entry.mealType} · {entry.proteinG??'—'}g protein · {entry.carbsG??'—'}g carbs · {entry.calories??'—'} cal</small></div>)}</details>}
  </section>

  <section className="dashboard-card jimmy-coach-card">
   <div>
    <p className="eyebrow">JIMMY · AI COACH</p>
    <h2>Your coach in the team car.</h2>
    <p>{jimmyCoachOpeningLine(career)}</p>
   </div>
   <button type="button" className="primary-cta" onClick={()=>setJimmyOpen(value=>!value)}>{jimmyOpen?'Close Jimmy':'Ask Jimmy'}</button>
   {jimmyOpen&&<div className="jimmy-coach-panel">
    <p><strong>Jimmy can already see:</strong> FTP {jimmyContext.ftp??'not set'} W · {jimmyContext.recentRideCount} rides / {jimmyContext.recentMinutes} min in the last 7 days · recovery {jimmyContext.recoveryScore} · fatigue {jimmyContext.fatigue}% · {jimmyContext.nutritionEntriesToday} nutrition entries today.</p>
    <div className="jimmy-quick-prompts">
     <button type="button">What should I ride today?</button>
     <button type="button">How should I fuel today?</button>
     <button type="button">Strength or recovery?</button>
     <button type="button">Give me a Mission France pep talk</button>
    </div>
    <small>Live conversational AI connection is the next integration step. This preview exposes the context contract Jimmy will use so he does not start from zero.</small>
   </div>}
  </section>

  <section className="mission-pillars">
   <header><p className="eyebrow">FRANCE READINESS PILLARS</p><h2>Evidence, not a percentage</h2></header>
   <div className="mission-pillar-grid">{snapshot.pillars.map(pillar=><article className="dashboard-card mission-pillar" key={pillar.id}><small>{pillar.label}</small><strong>{pillar.state}</strong><p>{pillar.evidence}</p></article>)}</div>
  </section>
 </section>
}
