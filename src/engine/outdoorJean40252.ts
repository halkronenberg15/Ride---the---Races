export type OutdoorJeanCue={id:string;atSeconds:number;text:string}
export const OUTDOOR_JEAN_CUES:OutdoorJeanCue[]=[
 {id:'start',atSeconds:0,text:'Ride started. Begin ten minutes easy at RPE two to three. Relax your shoulders and settle your breathing.'},
 {id:'warmup-check',atSeconds:300,text:'Five minutes into the warm-up. Keep it easy and let your cadence become comfortable.'},
 {id:'begin-endurance',atSeconds:600,text:'Warm-up complete. Begin seventy minutes of aerobic endurance at RPE three to four. Keep the effort conversational.'},
 {id:'technique',atSeconds:1200,text:'Hold a smooth, sustainable rhythm. Relax your grip and avoid pushing the climbs.'},
 {id:'hydration-30',atSeconds:1800,text:'Hydration check. Take a drink when it is safe.'},
 {id:'fuel-35',atSeconds:2100,text:'Fueling reminder. Begin taking carbohydrate if you have not already. Target thirty to forty-five grams per hour. Take it when safe.'},
 {id:'effort-45',atSeconds:2700,text:'Effort check. You should still be able to speak in full sentences. Ease off if breathing is becoming strained.'},
 {id:'hydration-posture-55',atSeconds:3300,text:'Take another drink when safe. Relax your shoulders, elbows, and hands.'},
 {id:'fuel-65',atSeconds:3900,text:'Fueling reminder. Take carbohydrate and continue drinking according to the heat and your sweat rate. Do so when safe.'},
 {id:'controlled-finish-70',atSeconds:4200,text:'Twenty minutes remain. Stay aerobic. Do not add threshold efforts or attack climbs.'},
 {id:'cooldown-80',atSeconds:4800,text:'Endurance work complete. Begin ten minutes easy at RPE two to three.'},
 {id:'recovery-85',atSeconds:5100,text:'Five minutes remain. Spin easily and let your breathing settle.'},
 {id:'finish-90',atSeconds:5400,text:'Workout complete. Stop somewhere safe before entering your ride measurements.'},
]
export function currentOutdoorJeanCue(elapsed:number){return OUTDOOR_JEAN_CUES.findLast(cue=>cue.atSeconds<=elapsed)??OUTDOOR_JEAN_CUES[0]}
/** Consumes every crossed cue and returns only the newest, preventing a speech backlog after suspension. */
export function nextOutdoorJeanCue(elapsed:number,delivered:string[]){const due=OUTDOOR_JEAN_CUES.filter(cue=>cue.atSeconds<=elapsed),undelivered=due.filter(cue=>!delivered.includes(cue.id));return {cue:undelivered.at(-1)??null,consumedIds:Array.from(new Set([...delivered,...due.map(cue=>cue.id)]))}}
export function outdoorResumeMessage(interval:string,totalRemainingSeconds:number,effort:string){const minutes=Math.ceil(totalRemainingSeconds/60);return `Ride resumed. Current interval: ${interval}. ${minutes} minutes remain in the workout. Target ${effort}.`}
export const OUTDOOR_PAUSE_MESSAGE='Ride paused. Resume when you are ready and it is safe.'
export const OUTDOOR_EARLY_END_MESSAGE='Ride ended early. Make sure you are safely stopped before recording measurements.'
