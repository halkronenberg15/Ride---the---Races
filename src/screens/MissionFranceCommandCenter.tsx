import { useMemo, useState } from 'react'
import { missionFranceSnapshot } from '../engine/missionFrance2028.ts'
import { useCareer } from '../state/CareerContext.tsx'
import type { NutritionMealType } from '../types/career.ts'

type Props={
 onBack:()=>void
 onOpenHealth:()=>void
 onOpenRideData:()=>void
 onOpenOffSeason:()=>void
}

const miles=(km:number)=>km*0.621371
const today=()=>{const date=new Date();return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}

export default function MissionFranceCommandCenter({onBack,onOpenHealth,onOpenRideData,onOpenOffSeason}:Props){
 const {career,addNutritionEntry}=useCareer()
 const snapshot=missionFranceSnapshot(career)
 const powerToWeight=snapshot.ftp!==null&&snapshot.weightKg?snapshot.ftp/snapshot.weightKg:null
 const [mealType,setMealType]=useState<NutritionMealType>('Snack')
 const [name,setName]=useState('')
 const [calories,setCalories]=useState('')
 const [protein,setProtein]=useState('')
 const [carbs,setCarbs]=useState('')
 const [fluid,setFluid]=useState('')
 const [remember,setRemember]=useState(true)
 const [saved,setSaved]=useState('')
 const templates=useMemo(()=>[...career.nutrition.mealTemplates].sort((a,b)=>b.timesUsed-a.timesUsed||b.lastUsedAt.localeCompare(a.lastUsedAt)),[career.nutrition.mealTemplates])
 const todayEntries=career.nutrition.entries.filter(entry=>entry.date===today())
 const totals=todayEntries.reduce((sum,entry)=>({calories:sum.calories+(entry.calories??0),protein:sum.protein+(entry.proteinG??0),carbs:sum.carbs+(entry.carbsG??0),fluid:sum.fluid+(entry.fluidOz??0)}),{calories:0,protein:0,carbs:0,fluid:0})
 const useTemplate=(id:string)=>{const template=templates.find(item=>item.id===id);if(!template)return;setMealType(template.mealType);setName(template.name);setCalories(template.calories?.toString()??'');setProtein(template.proteinG?.toString()??'');setCarbs(template.carbsG?.toString()??'');setFluid(template.fluidOz?.toString()??'');setSaved('')}
 const submit=(event:React.FormEvent)=>{event.preventDefault();const trimmed=name.trim();if(!trimmed)return;addNutritionEntry({id:crypto.randomUUID(),loggedAt:new Date().toISOString(),date:today(),mealType,name:trimmed,calories:calories===''?undefined:Number(calories),proteinG:protein===''?undefined:Number(protein),carbsG:carbs===''?undefined:Number(carbs),fluidOz:fluid===''?undefined:Number(fluid)},remember);setSaved(trimmed);setName('');setCalories('');setProtein('');setCarbs('');setFluid('')}
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

  <section className="dashboard-card mission-daily-command">
   <div><p className="eyebrow">TODAY</p><h2>What should the Command Center know?</h2><p>Keep the inputs authoritative. Add what actually happened, then let RtR connect the dots.</p></div>
   <div className="mission-actions">
    <button type="button" onClick={onOpenHealth}>Update recovery</button>
    <button type="button" onClick={onOpenRideData}>Log / review ride data</button>
    <button type="button" onClick={onOpenOffSeason}>Open training plan</button>
   </div>
  </section>

  <section className="dashboard-card mission-nutrition">
   <div className="section-title-row"><div><p className="eyebrow">NUTRITION · QUICK LOG</p><h2>Tell RtR what you ate.</h2><p>Save a meal once. Next time, tap it and log it in seconds.</p></div><div className="nutrition-totals"><strong>{Math.round(totals.protein)}g</strong><span>protein</span><strong>{Math.round(totals.carbs)}g</strong><span>carbs</span></div></div>
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
   {saved&&<p className="success-message">Logged {saved}. RtR {remember?'remembered it for next time.':'added it to today.'}</p>}
   {todayEntries.length>0&&<details className="today-food-log"><summary>Today’s food · {todayEntries.length} entries</summary>{todayEntries.map(entry=><div key={entry.id}><strong>{entry.name}</strong><small>{entry.mealType} · {entry.proteinG??'—'}g protein · {entry.carbsG??'—'}g carbs · {entry.calories??'—'} cal</small></div>)}</details>}
  </section>

  <section className="mission-pillars">
   <header><p className="eyebrow">FRANCE READINESS PILLARS</p><h2>Evidence, not a percentage</h2></header>
   <div className="mission-pillar-grid">{snapshot.pillars.map(pillar=><article className="dashboard-card mission-pillar" key={pillar.id}><small>{pillar.label}</small><strong>{pillar.state}</strong><p>{pillar.evidence}</p></article>)}</div>
  </section>
 </section>
}
