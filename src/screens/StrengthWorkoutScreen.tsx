import { useMemo,useState } from 'react'
import { useCareer } from '../state/CareerContext.tsx'
import { completeStrengthAssignment,strengthSessionForAssignment } from '../engine/strengthTraining4026.ts'

export default function StrengthWorkoutScreen({assignmentId,onBack,onComplete}:{assignmentId:string;onBack:()=>void;onComplete:()=>void}){
 const {career,updateAlpha4025}=useCareer()
 const assignment=career.alpha4025.trainingPlan?.weeks.flatMap(week=>week.assignments).find(item=>item.id===assignmentId)
 const session=useMemo(()=>assignment?strengthSessionForAssignment(assignment):null,[assignment])
 const existing=career.alpha4025.strengthActivities.find(item=>item.assignmentId===assignmentId)
 const [completed,setCompleted]=useState<string[]>(()=>existing?.exercises.filter(item=>item.completed).map(item=>session?.exercises.find(ex=>ex.name===item.name)?.id).filter(Boolean) as string[]??[])
 const [loads,setLoads]=useState<Record<string,string>>(()=>Object.fromEntries((existing?.exercises??[]).map(item=>[session?.exercises.find(ex=>ex.name===item.name)?.id??item.name,item.load??''])))
 const [notes,setNotes]=useState('')
 if(!assignment||!session)return <section className="strength-workout-screen"><button type="button" onClick={onBack}>← Off-Season Training</button><h1>Strength session unavailable</h1></section>
 const toggle=(id:string)=>setCompleted(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id])
 const save=()=>{updateAlpha4025(old=>completeStrengthAssignment(old,assignmentId,{completedExerciseIds:completed,loads,notes,completedAt:new Date().toISOString()}));onComplete()}
 return <section className="strength-workout-screen"><button type="button" onClick={onBack}>← Off-Season Training</button><header><p className="eyebrow">RTR STRENGTH · {assignment.day.toUpperCase()}</p><h1>{session.title}</h1><p>{session.durationMinutes} min · {session.purpose}</p></header><article className="dashboard-card strength-warmup"><h2>Warm-up</h2>{session.warmup.map(item=><p key={item}>• {item}</p>)}</article><div className="strength-exercise-list">{session.exercises.map(exercise=><article className="dashboard-card strength-exercise" key={exercise.id}><label className="strength-check"><input type="checkbox" checked={completed.includes(exercise.id)} onChange={()=>toggle(exercise.id)}/><span><strong>{exercise.name}</strong><small>{exercise.sets} sets · {exercise.repLabel} · {exercise.restSeconds}s rest</small></span></label><p>{exercise.focus}</p><p><strong>Load:</strong> {exercise.loadGuidance}</p><label>Load used / note<input value={loads[exercise.id]??''} onChange={event=>setLoads({...loads,[exercise.id]:event.target.value})} placeholder="e.g. 25 lb dumbbell"/></label><details><summary>Substitution</summary><p>{exercise.substitution}</p></details></article>)}</div><article className="dashboard-card"><h2>Progression rule</h2><p>{session.progression}</p><h3>Cooldown</h3>{session.cooldown.map(item=><p key={item}>• {item}</p>)}<label>Session notes<textarea value={notes} onChange={event=>setNotes(event.target.value)} placeholder="Anything Jean should know for the next strength session?"/></label></article><button type="button" className="primary-cta strength-save" onClick={save}>Save Strength Session</button></section>
}
