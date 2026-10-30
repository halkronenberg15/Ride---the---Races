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

export type StrengthExerciseLog={
  name:string
  setsCompleted:number
  targetSets?:number
  reps?:string
  status:'COMPLETED'|'PARTIAL'|'SKIPPED'
  reason?:string
}

export type StrengthSessionLog={
  plan:'STRENGTH_A'|'STRENGTH_B'|'OTHER'
  exercises:StrengthExerciseLog[]
  completedMainWork:boolean
}

export type TrainingJournalEntry={
  schemaVersion:1
  sessionKind?:'CYCLING'|'STRENGTH'|'RECOVERY'|'OTHER'
  id:string
  date:string
  title:string
  rideId?:string
  workoutId?:string
  assignmentId?:string
  sources:string[]
  stats:TrainingJournalStats
  strength?:StrengthSessionLog
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

export const HAL_SEP29_ENDURANCE_JOURNAL:TrainingJournalEntry={
  schemaVersion:1,
  sessionKind:'CYCLING',
  id:'hal-2026-09-29-endurance-60',
  date:'2026-09-29',
  title:'Endurance Ride · 60 min',
  sources:['Peloton screenshots','WHOOP','Rider feedback'],
  stats:{
    durationSeconds:3624,
    distanceKm:32.49,
    totalOutputKj:611,
    averagePowerWatts:167,
    averageCadenceRpm:87,
    averageResistancePercent:44,
    averageHeartRateBpm:135,
    ftpWatts:229,
  },
  fueling:[],
  feedback:{
    legsAfter:'GOOD',
    workBlocks:'CONTROLLED',
    recoveryBetweenBlocks:'FULLY_READY',
    lateSession:'STEADY',
    freeText:'Ride completed before Strength A. Legs felt really good afterward. WHOOP recorded 1:06:29, 13.5 strain and 135 bpm average heart rate; Peloton remains the cleaner ride-duration and power record.',
  },
  coach:{
    status:'POSITIVE',
    summary:'Successful endurance session at about 73% of FTP with controlled cardiovascular load and good legs afterward.',
    signals:['60:24 completed','167 W average at 229 W FTP','87 rpm average cadence','135 bpm WHOOP average heart rate','Rider reported good legs after ride plus strength'],
    progressionEvidence:'LOCAL',
    nextAction:'Treat as positive evidence while preserving the planned training structure; combine with strength response and next-day recovery before progressing load.',
    generatedAt:'2026-09-29T21:30:00-04:00',
  },
  createdAt:'2026-09-29T21:30:00-04:00',
  updatedAt:'2026-09-29T21:30:00-04:00',
}

export const HAL_SEP29_STRENGTH_A_JOURNAL:TrainingJournalEntry={
  schemaVersion:1,
  sessionKind:'STRENGTH',
  id:'hal-2026-09-29-strength-a',
  date:'2026-09-29',
  title:'Strength A',
  sources:['Rider feedback','RtR strength plan'],
  stats:{},
  strength:{
    plan:'STRENGTH_A',
    completedMainWork:true,
    exercises:[
      {name:'Goblet squat',setsCompleted:3,targetSets:3,reps:'8',status:'COMPLETED'},
      {name:'Romanian deadlift',setsCompleted:3,targetSets:3,reps:'8',status:'COMPLETED'},
      {name:'Supported split squat',setsCompleted:2,targetSets:2,reps:'8/side',status:'COMPLETED'},
      {name:'One-arm row',setsCompleted:2,targetSets:2,reps:'10/side',status:'COMPLETED'},
      {name:'Pallof press',setsCompleted:0,targetSets:2,reps:'10/side',status:'SKIPPED',reason:'Garage access ended when Michelle needed the space; not fatigue-related.'},
      {name:'Dead bug',setsCompleted:0,targetSets:2,reps:'8/side',status:'SKIPPED',reason:'Garage access ended when Michelle needed the space; not fatigue-related.'},
    ],
  },
  fueling:[],
  feedback:{
    legsAfter:'GOOD',
    freeText:'Main strength work completed. Pallof press and dead bug were skipped for logistical reasons only, not because of fatigue. Legs felt really good after the combined ride and strength session.',
  },
  coach:{
    status:'POSITIVE',
    summary:'Strength A main work was completed successfully. Two core exercises were omitted for logistics and must not be interpreted as fatigue or failed completion.',
    signals:['Main lower-body and pulling work completed','Core omissions were logistical, not physiological','Rider reported good legs after combined endurance and strength workload'],
    progressionEvidence:'LOCAL',
    nextAction:'Count the session as successful strength exposure and do not penalize readiness for the skipped core work.',
    generatedAt:'2026-09-29T21:35:00-04:00',
  },
  createdAt:'2026-09-29T21:35:00-04:00',
  updatedAt:'2026-09-29T21:35:00-04:00',
}

export const HAL_SEP30_CLIMB_JOURNAL:TrainingJournalEntry={
  schemaVersion:1,
  sessionKind:'CYCLING',
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


export const HAL_SL8_JOURNAL_ENTRIES:TrainingJournalEntry[]=[
 {
  schemaVersion:1,sessionKind:'CYCLING',id:'hal-2026-10-24-sl8-test',date:'2026-10-24',title:'SL8 Test Ride · New Smyrna Beach',
  sources:['Strava screenshot','Rider feedback'],
  stats:{durationSeconds:2379,distanceKm:17.06,averagePowerWatts:125,ftpWatts:229},
  fueling:[],
  feedback:{workBlocks:'CONTROLLED',lateSession:'STEADY',freeText:'First test ride on the S-Works Tarmac SL8. 10.60 mi in 39:39 at 16.0 mph. Strava reported a fastest-ever 5-mile PR by 34 seconds. Strava initially showed the Secteur Sport equipment tag, but rider confirmed this was the new SL8.'},
  coach:{status:'POSITIVE',summary:'Useful short shakedown baseline for the new SL8.',signals:['10.60 mi','39:39 moving','16.0 mph average','First SL8 ride','Fastest-ever 5-mile Strava PR by 34 seconds'],progressionEvidence:'LOCAL',nextAction:'Use this as a shakedown baseline only; do not infer aerodynamic gain from one short ride.',generatedAt:'2026-10-24T12:30:00-04:00'},
  createdAt:'2026-10-24T12:30:00-04:00',updatedAt:'2026-10-24T12:30:00-04:00'
 },
 {
  schemaVersion:1,sessionKind:'CYCLING',id:'hal-2026-10-26-marathon-sl8',date:'2026-10-26',title:'Marathon Wind Ride · SL8',
  sources:['Garmin screenshots','Favero Assioma PRO RS-2','Rider feedback'],
  stats:{durationSeconds:4021,distanceKm:29.40,totalOutputKj:650,averagePowerWatts:147,peakPowerWatts:737,averageCadenceRpm:69,averageHeartRateBpm:140,maximumHeartRateBpm:168,ftpWatts:229},
  fueling:[],
  feedback:{legsAfter:'NOTICEABLE_FATIGUE',workBlocks:'CHALLENGING_WITH_RESERVE',lateSession:'STRONGER',freeText:'Strong head and crosswinds in Marathon. Rider intentionally sprinted to finish, producing the 737 W late peak. Garmin showed 187 W normalized power and 182 W best 20-minute power.'},
  coach:{status:'POSITIVE',summary:'Wind-loaded aerobic/high-aerobic ride with a distinct finishing sprint.',signals:['18.27 mi','147 W average','187 W NP','737 W finishing peak','140 bpm average HR','48/52 L/R'],progressionEvidence:'LOCAL',nextAction:'Separate the finishing sprint from endurance pacing when evaluating the ride.',generatedAt:'2026-10-26T18:00:00-04:00'},
  createdAt:'2026-10-26T18:00:00-04:00',updatedAt:'2026-10-26T18:00:00-04:00'
 },
 {
  schemaVersion:1,sessionKind:'CYCLING',id:'hal-2026-10-27-seven-mile-bridge',date:'2026-10-27',title:'Seven Mile Bridge Endurance · SL8',
  sources:['Garmin screenshots','Favero Assioma PRO RS-2','Rider feedback'],
  stats:{durationSeconds:6183,distanceKm:48.01,totalOutputKj:1017,averagePowerWatts:154,peakPowerWatts:650,averageCadenceRpm:71,averageHeartRateBpm:139,maximumHeartRateBpm:154,ftpWatts:229},
  fueling:[{id:'dry-brew-30',minute:30,kind:'OTHER',label:'Dry Brew caffeine bite',calories:35,carbohydrateGrams:4,notes:'100 mg caffeine. Rider initially thought this was a carb+caffeine gummy; treat as caffeine support, not meaningful carbohydrate fueling.'}],
  feedback:{workBlocks:'CONTROLLED',lateSession:'STEADY',freeText:'29.83 mi Seven Mile Bridge ride in 15-20 mph winds. Garmin showed 175 W NP and 190 W best 20-minute power. Intermittent hand numbness required shaking hands out several times.'},
  coach:{status:'CAUTION',summary:'Strong windy endurance benchmark with measured outdoor power, but hand numbness is now a fit signal to track.',signals:['29.83 mi','154 W average','175 W NP','139 bpm average HR','71 rpm cadence','15-20 mph winds','Intermittent hand numbness','Garmin saved FTP was 191 W; RtR uses 229 W'],progressionEvidence:'LOCAL',nextAction:'Continue fit observation and do not let Garmin 191 W FTP inflate training-load interpretation.',generatedAt:'2026-10-27T20:00:00-04:00'},
  createdAt:'2026-10-27T20:00:00-04:00',updatedAt:'2026-10-27T20:00:00-04:00'
 },
 {
  schemaVersion:1,sessionKind:'CYCLING',id:'hal-2026-10-30-bisaddle-baseline',date:'2026-10-30',title:'BiSaddle Baseline 001 · SL8',
  sources:['Garmin screenshots','Favero Assioma PRO RS-2','Rider feedback'],
  stats:{durationSeconds:5645,distanceKm:44.26,totalOutputKj:928,averagePowerWatts:155,peakPowerWatts:524,averageCadenceRpm:72,averageHeartRateBpm:134,maximumHeartRateBpm:163,ftpWatts:229},
  fueling:[],
  feedback:{workBlocks:'CONTROLLED',lateSession:'STEADY',freeText:'First ride on the BiSaddle EXT Sprint. Saddle felt nice overall but still needs adjustment. Intermittent right-hand numbness required shake-outs. Mild lower-back tightness appeared toward the end. Garmin data included 172 W NP, 179 W best 20-minute power, 48/52 L/R, left PCO +8 mm and right PCO +1 mm. Garmin FTP was corrected to 229 W after this ride.'},
  coach:{status:'CAUTION',summary:'Promising first BiSaddle ride with good aerobic efficiency, but long-distance comfort is not solved yet.',signals:['27.50 mi','155 W average','172 W NP','134 bpm average HR','72 rpm cadence','Right-hand numbness','Late lower-back tightness','Repeated L PCO +8 mm vs R +1 mm','BiSaddle felt good overall'],progressionEvidence:'REPEATED',nextAction:'Prioritize long-distance comfort. Adjust one saddle variable at a time, keep cockpit unchanged until saddle position stabilizes, and progress symptom-limited rides from 75-90 to 90-105 to 105-120 minutes before larger mileage increases.',generatedAt:'2026-10-30T17:30:00-04:00'},
  createdAt:'2026-10-30T17:30:00-04:00',updatedAt:'2026-10-30T17:30:00-04:00'
 }
]

export function ensureHalSep30TrainingJournal(state:TrainingJournalState){
  let next=state
  for(const entry of [HAL_SEP29_ENDURANCE_JOURNAL,HAL_SEP29_STRENGTH_A_JOURNAL,HAL_SEP30_CLIMB_JOURNAL,...HAL_SL8_JOURNAL_ENTRIES]){
    if(!next.entries.some(item=>item.id===entry.id))next=upsertTrainingJournalEntry(next,entry)
  }
  return next
}
