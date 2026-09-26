import type { Alpha4025State, CalendarAssignment, EffortLanguage, StrengthActivity } from './alpha4025.ts'

export type StrengthExercisePrescription={
 id:string
 name:string
 sets:number
 repetitions:number
 repLabel:string
 restSeconds:number
 loadGuidance:string
 focus:string
 substitution:string
}
export type StrengthSessionPrescription={
 id:'strength-a'|'strength-b'
 title:'Strength A'|'Strength B'
 durationMinutes:number
 purpose:string
 warmup:string[]
 exercises:StrengthExercisePrescription[]
 progression:string
 cooldown:string[]
}

const A:StrengthExercisePrescription[]=[
 {id:'goblet-squat',name:'Goblet squat',sets:3,repetitions:8,repLabel:'8 reps',restSeconds:75,loadGuidance:'RPE 6–7 · finish with 2–3 clean reps in reserve',focus:'Controlled lower-body force with a stable trunk.',substitution:'Box squat or bodyweight squat'},
 {id:'romanian-deadlift',name:'Romanian deadlift',sets:3,repetitions:8,repLabel:'8 reps',restSeconds:75,loadGuidance:'RPE 6–7 · slow 2–3 second lowering phase',focus:'Posterior-chain strength without grinding reps.',substitution:'Hip hinge with dumbbells or kettlebell'},
 {id:'split-squat',name:'Supported split squat',sets:2,repetitions:8,repLabel:'8 / side',restSeconds:60,loadGuidance:'Moderate load · steady balance and knee tracking',focus:'Single-leg strength and control.',substitution:'Reverse lunge or low step-up'},
 {id:'one-arm-row',name:'One-arm row',sets:2,repetitions:10,repLabel:'10 / side',restSeconds:60,loadGuidance:'RPE 6–7 · pause briefly at the top',focus:'Upper-back strength and riding posture support.',substitution:'Chest-supported row or band row'},
 {id:'pallof-press',name:'Pallof press',sets:2,repetitions:10,repLabel:'10 / side',restSeconds:45,loadGuidance:'Light to moderate resistance · no trunk rotation',focus:'Anti-rotation trunk stability.',substitution:'Tall-kneeling band hold'},
 {id:'dead-bug',name:'Dead bug',sets:2,repetitions:8,repLabel:'8 / side',restSeconds:30,loadGuidance:'Bodyweight · slow controlled breathing',focus:'Trunk control with relaxed shoulders.',substitution:'Heel taps'}
]

const B:StrengthExercisePrescription[]=[
 {id:'step-up',name:'Low step-up',sets:3,repetitions:8,repLabel:'8 / side',restSeconds:60,loadGuidance:'RPE 6 · drive smoothly through the working leg',focus:'Single-leg durability with low eccentric cost.',substitution:'Supported reverse lunge'},
 {id:'hip-thrust',name:'Hip thrust / glute bridge',sets:3,repetitions:10,repLabel:'10 reps',restSeconds:60,loadGuidance:'RPE 6–7 · full controlled lockout',focus:'Hip extension strength for sustained riding.',substitution:'Floor glute bridge'},
 {id:'calf-raise',name:'Standing calf raise',sets:2,repetitions:12,repLabel:'12 reps',restSeconds:45,loadGuidance:'Controlled full range · 1 second pause at top',focus:'Lower-leg durability and ankle control.',substitution:'Bodyweight calf raise'},
 {id:'incline-push',name:'Incline push-up / dumbbell press',sets:2,repetitions:10,repLabel:'8–12 reps',restSeconds:60,loadGuidance:'RPE 6–7 · stop before form slows',focus:'Upper-body support without excessive fatigue.',substitution:'Wall push-up or floor press'},
 {id:'side-plank',name:'Side plank',sets:2,repetitions:30,repLabel:'25–35 sec / side',restSeconds:30,loadGuidance:'Bodyweight · hips stacked and breathing steady',focus:'Lateral trunk stability.',substitution:'Bent-knee side plank'},
 {id:'bird-dog',name:'Bird dog',sets:2,repetitions:8,repLabel:'8 / side',restSeconds:30,loadGuidance:'Bodyweight · slow reach and controlled return',focus:'Spinal control and cross-body stability.',substitution:'Quadruped arm or leg reach'}
]

function scaledExercises(base:StrengthExercisePrescription[],minutes:number){
 if(minutes>=30)return base
 if(minutes>=25)return base.map((exercise,index)=>({...exercise,sets:index<2?3:2}))
 return base.map((exercise,index)=>({...exercise,sets:index<4?2:1}))
}

export function strengthSessionForAssignment(assignment:CalendarAssignment):StrengthSessionPrescription{
 if(assignment.type!=='STRENGTH')throw new Error('Strength prescription requires a strength assignment.')
 const isB=/strength b/i.test(assignment.title)||assignment.components?.some(item=>item.kind==='STRENGTH'&&/strength b/i.test(item.label))
 const strengthMinutes=assignment.components?.find(item=>item.kind==='STRENGTH')?.minutes??assignment.durationMinutes
 return {
  id:isB?'strength-b':'strength-a',
  title:isB?'Strength B':'Strength A',
  durationMinutes:strengthMinutes,
  purpose:isB?'Lighter durability strength, trunk stability and movement quality.':'Unilateral strength, posterior-chain strength and core stability.',
  warmup:['2 min easy movement: walk, march or very easy spin','6 bodyweight squats','6 hip hinges','6 alternating reverse lunges or supported split-stance bends'],
  exercises:scaledExercises(isB?B:A,strengthMinutes),
  progression:'Use loads that leave about 2–3 good reps in reserve. When every prescribed rep is clean for two sessions, add the smallest practical amount of load next time. Never chase failure during the off-season cycling build.',
  cooldown:['Easy walking or gentle spin for 2 minutes','Brief hip-flexor, glute and calf mobility if it feels useful']
 }
}

export type StrengthCompletionInput={
 completedExerciseIds:string[]
 loads:Record<string,string>
 notes:string
 completedAt:string
}

export function completeStrengthAssignment(state:Alpha4025State,assignmentId:string,input:StrengthCompletionInput):Alpha4025State{
 const plan=state.trainingPlan
 if(!plan)throw new Error('No off-season plan is available.')
 const assignment=plan.weeks.flatMap(week=>week.assignments).find(item=>item.id===assignmentId)
 if(!assignment||assignment.type!=='STRENGTH')throw new Error('Strength completion requires an existing strength assignment.')
 const session=strengthSessionForAssignment(assignment)
 const completed=new Set(input.completedExerciseIds)
 const allComplete=session.exercises.every(exercise=>completed.has(exercise.id))
 const hasCyclingComponent=Boolean(assignment.components?.some(item=>item.kind==='CYCLING'))
 const status=allComplete&&!hasCyclingComponent?'COMPLETED' as const:'PARTIAL' as const
 const completedSets=session.exercises.filter(exercise=>completed.has(exercise.id)).reduce((sum,exercise)=>sum+exercise.sets,0)
 const totalSets=session.exercises.reduce((sum,exercise)=>sum+exercise.sets,0)
 const activity:StrengthActivity={
  assignmentId,
  completedAt:input.completedAt,
  exercises:session.exercises.map(exercise=>({
   name:exercise.name,
   substitution:exercise.substitution,
   sets:exercise.sets,
   repetitions:exercise.repetitions,
   load:input.loads[exercise.id]?.trim()||exercise.loadGuidance,
   difficulty:'Comfortable' as EffortLanguage,
   completed:completed.has(exercise.id),
   notes:completed.has(exercise.id)?undefined:'Not completed'
  }))
 }
 const completionNotes=[
  `${session.title}: ${completedSets}/${totalSets} prescribed sets represented by completed exercises.`,
  hasCyclingComponent?'Strength portion recorded; cycling component remains part of the assignment.':'',
  input.notes.trim()
 ].filter(Boolean).join(' ')
 const updatedPlan={...plan,weeks:plan.weeks.map(week=>({...week,assignments:week.assignments.map(item=>item.id===assignmentId?{...item,status,completion:{completedAt:input.completedAt,durationMinutes:session.durationMinutes,notes:completionNotes},substitution:status==='PARTIAL'?{kind:'SHORTEN' as const,reason:hasCyclingComponent?'Strength portion completed; cycling component remains.':'Strength session was partially completed; original prescription is preserved.'}:item.substitution}:item)}))}
 return {...state,trainingPlan:updatedPlan,strengthActivities:[activity,...state.strengthActivities.filter(item=>item.assignmentId!==assignmentId)]}
}
