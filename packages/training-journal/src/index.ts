export type TrainingFuel={
  id:string
  minute?:number
  kind:'GEL'|'DRINK'|'FOOD'|'OTHER'
  label:string
  calories?:number
  carbohydrateGrams?:number
  sodiumMg?:number
  notes?:string
}

export type RiderTrainingFeedback={
  legsAfter?:'FRESH'|'GOOD'|'NOTICEABLE_FATIGUE'|'HEAVY'|'VERY_HEAVY'
  workBlocks?:'EASY'|'CONTROLLED'|'CHALLENGING_WITH_RESERVE'|'LIMIT'|'FAILED'
  recoveryBetweenBlocks?:'FULLY_READY'|'MOSTLY_READY'|'PARTIAL'|'NOT_READY'
  lateSession?:'STRONGER'|'STEADY'|'FADING'|'FAILED'
  cadenceIntent?:string
  resistanceIntent?:string
  freeText?:string
}

export type TrainingJournalStats={
  durationSeconds?:number
  distanceKm?:number
  totalOutputKj?:number
  averagePowerWatts?:number
  peakPowerWatts?:number
  averageCadenceRpm?:number
  averageResistancePercent?:number
  averageHeartRateBpm?:number
  maximumHeartRateBpm?:number
  calories?:number
  striveScore?:number
  ftpWatts?:number
}

export type CoachInterpretation={
  status:'PENDING_RESPONSE'|'POSITIVE'|'NEUTRAL'|'CAUTION'|'RECOVERY'
  summary:string
  signals:string[]
  progressionEvidence:'NONE'|'LOCAL'|'REPEATED'
  nextAction:string
  generatedAt:string
}

export type TrainingJournalEntry={
  schemaVersion:1
  id:string
  date:string
  title:string
  rideId?:string
  workoutId?:string
  assignmentId?:string
  sources:string[]
  stats:TrainingJournalStats
  fueling:TrainingFuel[]
  feedback:RiderTrainingFeedback
  coach?:CoachInterpretation
  createdAt:string
  updatedAt:string
}

export type TrainingJournalState={schemaVersion:1;entries:TrainingJournalEntry[]}

export const emptyTrainingJournal=():TrainingJournalState=>({schemaVersion:1,entries:[]})

export function upsertTrainingJournalEntry(state:TrainingJournalState,entry:TrainingJournalEntry):TrainingJournalState{
  const index=state.entries.findIndex(item=>item.id===entry.id)
  if(index<0)return {...state,entries:[entry,...state.entries].sort((a,b)=>b.date.localeCompare(a.date))}
  const entries=state.entries.slice()
  entries[index]={...entries[index],...entry,stats:{...entries[index].stats,...entry.stats},feedback:{...entries[index].feedback,...entry.feedback},fueling:entry.fueling.length?entry.fueling:entries[index].fueling,sources:Array.from(new Set([...entries[index].sources,...entry.sources])),updatedAt:entry.updatedAt}
  return {...state,entries:entries.sort((a,b)=>b.date.localeCompare(a.date))}
}

export function updateTrainingFeedback(state:TrainingJournalState,id:string,feedback:Partial<RiderTrainingFeedback>,updatedAt=new Date().toISOString()):TrainingJournalState{
  return {...state,entries:state.entries.map(entry=>entry.id===id?{...entry,feedback:{...entry.feedback,...feedback},updatedAt}:entry)}
}

export function addTrainingFuel(state:TrainingJournalState,id:string,fuel:TrainingFuel,updatedAt=new Date().toISOString()):TrainingJournalState{
  return {...state,entries:state.entries.map(entry=>entry.id===id?{...entry,fueling:[...entry.fueling.filter(item=>item.id!==fuel.id),fuel].sort((a,b)=>(a.minute??999)-(b.minute??999)),updatedAt}:entry)}
}

export function setCoachInterpretation(state:TrainingJournalState,id:string,coach:CoachInterpretation,updatedAt=new Date().toISOString()):TrainingJournalState{
  return {...state,entries:state.entries.map(entry=>entry.id===id?{...entry,coach,updatedAt}:entry)}
}

export const HAL_SEP30_CLIMB_JOURNAL:TrainingJournalEntry={
  schemaVersion:1,
  id:'hal-2026-09-30-climbing-endurance-75',
  date:'2026-09-30',
  title:'Climbing Endurance 75 · 3 × 10',
  workoutId:'tempo-climb-75',
  assignmentId:'w2-d3',
  sources:['Peloton screenshots','Rider feedback'],
  stats:{
    durationSeconds:4507,
    distanceKm:41.36,
    totalOutputKj:819,
    averagePowerWatts:182,
    peakPowerWatts:280,
    averageCadenceRpm:81,
    averageResistancePercent:49,
    averageHeartRateBpm:136,
    maximumHeartRateBpm:156,
    calories:1243,
    striveScore:90.8,
    ftpWatts:229,
  },
  fueling:[{id:'spring-strawberry-35',minute:35,kind:'GEL',label:'Spring Energy Strawberry Smoothie',calories:100,carbohydrateGrams:17,sodiumMg:60,notes:'Taken during the ride.'}],
  feedback:{
    legsAfter:'NOTICEABLE_FATIGUE',
    workBlocks:'CHALLENGING_WITH_RESERVE',
    recoveryBetweenBlocks:'FULLY_READY',
    lateSession:'STRONGER',
    cadenceIntent:'Held near the lower end of the prescribed climbing cadence to create a realistic climbing feel.',
    resistanceIntent:'Raised resistance enough to create climbing torque without the ride feeling like a mash-fest.',
    freeText:'Could have held the 10-minute climbing blocks longer, was recovered and ready for each next block, and felt fresh enough after the final climb to hold higher cadence at the top of the resistance range during the 15-minute endurance block.',
  },
  coach:{
    status:'POSITIVE',
    summary:'Successful climbing-endurance session with productive muscular fatigue, repeatable recovery between blocks, reserve during the work, and strong late-session durability.',
    signals:['3 × 10-minute climbing blocks completed with reserve','Fully recovered for each next block','Higher cadence and strong resistance maintained in the final 15-minute endurance block','Noticeable but appropriate post-ride leg fatigue','17 g on-bike carbohydrate at minute 35'],
    progressionEvidence:'LOCAL',
    nextAction:'Do not automatically increase the next session. Reassess next-day recovery; repeated sessions with this response can justify longer sustained climbing time before increasing intensity.',
    generatedAt:'2026-09-30T21:48:00-04:00',
  },
  createdAt:'2026-09-30T21:48:00-04:00',
  updatedAt:'2026-09-30T21:48:00-04:00',
}

export function ensureHalSep30TrainingJournal(state:TrainingJournalState){
  if(state.entries.some(entry=>entry.id===HAL_SEP30_CLIMB_JOURNAL.id))return state
  return upsertTrainingJournalEntry(state,HAL_SEP30_CLIMB_JOURNAL)
}
