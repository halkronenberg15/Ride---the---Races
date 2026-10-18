import type { TrainingJournalEntry } from './index.ts'

export const HAL_OCT13_17_JOURNAL:TrainingJournalEntry[]=[
{
 schemaVersion:1,sessionKind:'CYCLING',id:'hal-2026-10-13-outdoor-endurance',date:'2026-10-13',title:'Outdoor Endurance · 30.4 mi',
 sources:['Strava','WHOOP','Specialized','Peloton app','Rider feedback'],
 stats:{durationSeconds:7549,distanceKm:48.91,averageHeartRateBpm:134,maximumHeartRateBpm:150,calories:1335,ftpWatts:229},
 fueling:[{id:'drink-30',minute:30,kind:'DRINK',label:'Carbohydrate drink',calories:200,carbohydrateGrams:51,sodiumMg:200},{id:'gel-60',minute:60,kind:'GEL',label:'Black gel',calories:160,carbohydrateGrams:40,sodiumMg:200},{id:'chews-90',minute:90,kind:'FOOD',label:'Skratch Energy Chews',calories:160,carbohydrateGrams:38,sodiumMg:70}],
 feedback:{legsAfter:'GOOD',lateSession:'STEADY',freeText:'Controlled outdoor endurance. WHOOP strain 15.5. Phone died near the end, creating small source timing differences.'},
 coach:{status:'POSITIVE',summary:'Two-hour outdoor endurance completed with controlled cardiovascular cost and strong fueling execution.',signals:['About 30.4 miles','Average HR 132–136 bpm across sources','129 g on-bike carbohydrate','WHOOP strain 15.5'],progressionEvidence:'REPEATED',nextAction:'Preserve aerobic progression while monitoring comfort and cumulative fatigue.',generatedAt:'2026-10-13T18:00:00-04:00'},
 createdAt:'2026-10-13T18:00:00-04:00',updatedAt:'2026-10-13T18:00:00-04:00'
},
{
 schemaVersion:1,sessionKind:'CYCLING',id:'hal-2026-10-14-calar-alto-75',date:'2026-10-14',title:'Vuelta Stage 12 · Calar Alto 75',
 workoutId:'vuelta-calar-alto-75',assignmentId:'w4-d3',sources:['Peloton screenshots','Rider feedback'],
 stats:{durationSeconds:4500,distanceKm:40.43,totalOutputKj:787,averagePowerWatts:175,peakPowerWatts:299,averageCadenceRpm:82,averageResistancePercent:47,averageHeartRateBpm:134,maximumHeartRateBpm:154,calories:1142,striveScore:76.5,ftpWatts:229},
 fueling:[{id:'waffle-5',minute:5,kind:'FOOD',label:'Honey Stinger Energy Waffle',calories:140,carbohydrateGrams:18,sodiumMg:80},{id:'gummies-40',minute:40,kind:'FOOD',label:'Honey Stinger gummies',calories:160,carbohydrateGrams:39,sodiumMg:65},{id:'lmnt-ride',kind:'DRINK',label:'32 oz LMNT',notes:'One packet in approximately 32 oz water during the ride.'}],
 feedback:{legsAfter:'GOOD',workBlocks:'CHALLENGING_WITH_RESERVE',recoveryBetweenBlocks:'FULLY_READY',lateSession:'STRONGER',freeText:'Legs took a little time to open up, then felt good. Third climb stayed strong without cadence collapse.'},
 coach:{status:'POSITIVE',summary:'Excellent 75-minute climbing progression with stable heart rate and strong late-session durability.',signals:['175 W average for 75 minutes','134 bpm average HR','Three sustained climbing blocks','Third block remained strong'],progressionEvidence:'REPEATED',nextAction:'Bank the progression; do not automatically increase the next climb session.',generatedAt:'2026-10-14T21:30:00-04:00'},
 createdAt:'2026-10-14T21:30:00-04:00',updatedAt:'2026-10-14T21:30:00-04:00'
},
{
 schemaVersion:1,sessionKind:'CYCLING',id:'hal-2026-10-15-indoor-aerobic-60',date:'2026-10-15',title:'Indoor Aerobic · 60 min',
 sources:['Peloton screenshots','Rider feedback'],
 stats:{durationSeconds:3600,distanceKm:30.21,totalOutputKj:518,averagePowerWatts:144,peakPowerWatts:190,averageCadenceRpm:85,averageResistancePercent:43,averageHeartRateBpm:131,maximumHeartRateBpm:140,calories:886,striveScore:57.4,ftpWatts:229},
 fueling:[{id:'lmnt-60',kind:'DRINK',label:'32 oz LMNT',notes:'Fasted ride; no caloric fuel on bike.'}],
 feedback:{legsAfter:'NOTICEABLE_FATIGUE',lateSession:'STEADY',freeText:'Started fasted. Legs took about 7–10 minutes to open up. Accumulated fatigue was noticeable, but cardiovascular response remained controlled.'},
 coach:{status:'CAUTION',summary:'Controlled aerobic work completed while accumulated fatigue became noticeable in the legs.',signals:['144 W average','131 bpm average HR','No time in upper HR zones','Delayed leg opening'],progressionEvidence:'LOCAL',nextAction:'Protect recovery and avoid bonus intensity.',generatedAt:'2026-10-15T10:00:00-04:00'},
 createdAt:'2026-10-15T10:00:00-04:00',updatedAt:'2026-10-15T10:00:00-04:00'
},
{
 schemaVersion:1,sessionKind:'RECOVERY',id:'hal-2026-10-16-rest',date:'2026-10-16',title:'Total Rest Day',
 sources:['Rider feedback'],stats:{},fueling:[],
 feedback:{legsAfter:'NOTICEABLE_FATIGUE',freeText:'Total rest day with only light walking.'},
 coach:{status:'RECOVERY',summary:'Appropriate full rest after accumulated training load.',signals:['No cycling','No strength','Only light walking'],progressionEvidence:'NONE',nextAction:'Use the rest to absorb the push-week workload.',generatedAt:'2026-10-16T19:40:00-04:00'},
 createdAt:'2026-10-16T19:40:00-04:00',updatedAt:'2026-10-16T19:40:00-04:00'
},
{
 schemaVersion:1,sessionKind:'CYCLING',id:'hal-2026-10-17-outdoor-endurance',date:'2026-10-17',title:'Outdoor Endurance · 35.5 mi',
 sources:['Strava','WHOOP','Specialized','Peloton app','Rider feedback'],
 stats:{durationSeconds:8276,distanceKm:56.50,averageHeartRateBpm:140,maximumHeartRateBpm:157,calories:2109,ftpWatts:229},
 fueling:[{id:'drink-40',minute:40,kind:'DRINK',label:'Carbohydrate drink mix',calories:200,carbohydrateGrams:50,sodiumMg:630},{id:'gel-70',minute:70,kind:'GEL',label:'40 g carbohydrate gel',calories:160,carbohydrateGrams:40},{id:'enervit-92',minute:92,kind:'FOOD',label:'Enervit chewable gel',calories:120,carbohydrateGrams:30,sodiumMg:50},{id:'fluids',kind:'DRINK',label:'Water + LMNT',notes:'24 oz plain water plus about 16 oz LMNT during ride; remaining LMNT finished post-ride. Two slices toast about 30 minutes pre-ride.'}],
 feedback:{legsAfter:'NOTICEABLE_FATIGUE',lateSession:'STEADY',freeText:'Legs felt okay but a little heavy. Headwind on return and rain late. New Specialized Power 143 saddle was firmer but better: essentially no foot numbness, only a few hand-position adjustments, no groin numbness, mild pressure appearing near the end.'},
 coach:{status:'POSITIVE',summary:'Longest outdoor ride of the block completed on accumulated fatigue with controlled heart rate and strong fueling.',signals:['About 35.5 miles','WHOOP strain 17.3','Average HR 138–140 bpm across sources','120 g on-bike carbohydrate','Improved saddle comfort'],progressionEvidence:'REPEATED',nextAction:'End the push week with recovery rather than additional training load.',generatedAt:'2026-10-17T14:00:00-04:00'},
 createdAt:'2026-10-17T14:00:00-04:00',updatedAt:'2026-10-17T14:00:00-04:00'
}
]
