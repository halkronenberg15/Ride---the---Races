export type RaceStageShell = {
  number: number; date?: string; start: string; finish: string; distanceKm: number; type: string
  plannedDurationMinutes?: number; sections: unknown[]; climbs: unknown[]; intermediateSprints: unknown[]; komMarkers: unknown[]; finishMarker?: unknown; jeanObjectives: string[]
}
export type RaceSeries = { id: string; name: string; year: number; status: 'rideable' | 'calendar'; stages: RaceStageShell[]; restDays: { afterStage: number; label: string }[] }
const vueltaRows: Array<[string,string,string,number]> = [
['Monaco','Monaco','Individual time trial',9],['Monaco','Manosque','Hilly',215.2],['Gruissan - Aude','Font Romeu','Medium mountains',166.7],['Andorra la Vella','Andorra la Vella','Mountain',104.9],['Falset / Costa Daurada',"Roquetes / Terres de l'Ebre",'Hilly',171.1],['Alcossebre','Castelló','Medium mountains',176.8],["Vall d'Alba",'Aramón Valdelinares','Mountain',149.9],['Puçol','Xeraco','Flat',176.4],['La Vila Joiosa / Villajoyosa','Alto de Aitana / Costa Blanca','Mountain',187.5],['Alcaraz','Elche de la Sierra','Hilly',184.5],['Cartagena','Lorca','Flat',156.1],['Vera','Calar Alto','Mountain',166.5],['Almuñécar','Loja','Medium mountains',193.2],['Jaén','Sierra de La Pandera','Mountain',152.7],['Palma del Río','Córdoba','Medium mountains',181.2],['Cortegana','La Rábida / Palos de la Frontera','Hilly',186],['Dos Hermanas','Sevilla','Flat',189.2],['El Puerto de Santa María','Jerez de la Frontera','Individual time trial',32.5],['Vélez-Málaga','Peñas Blancas / Estepona','Hilly with uphill finish',205.1],['La Calahorra','Collado del Alguacil','Mountain',187],['Carrefour Granada','Granada','Flat',99.4]
]
export const vuelta2026: RaceSeries = { id:'vuelta-2026', name:'La Vuelta', year:2026, status:'calendar', restDays:[{afterStage:9,label:'Rest Day 1'},{afterStage:15,label:'Rest Day 2'}], stages:vueltaRows.map(([start,finish,type,distanceKm],i)=>({number:i+1,start,finish,type,distanceKm,sections:[],climbs:[],intermediateSprints:[],komMarkers:[],jeanObjectives:[]})) }
export type TrainingRide = { id:string; name:string; durationMinutes:number; purpose:string; difficulty:string; zones:string; jeanDescription:string }
export const trainingRides: TrainingRide[] = [
{id:'recovery-30',name:'Recovery Spin 30',durationMinutes:30,purpose:'Flush the legs and restore easy rhythm',difficulty:'Very easy',zones:'Z1–low Z2',jeanDescription:'Light cadence, low resistance, and plenty of radio silence.'},
{id:'recovery-45',name:'Recovery Spin 45',durationMinutes:45,purpose:'Progressive warm-up, steady recovery, cooldown',difficulty:'Easy',zones:'Z1–Z2',jeanDescription:'We finish fresher than we started.'},
{id:'opener-30',name:'Rest Day Leg Opener 30',durationMinutes:30,purpose:'Recovery with short controlled cadence pickups',difficulty:'Easy',zones:'Z1–Z2 pickups',jeanDescription:'A few sharp turns, never maximal.'},
{id:'opener-45',name:'Rest Day Leg Opener 45',durationMinutes:45,purpose:'Easy endurance with brief controlled openers',difficulty:'Easy',zones:'Z1–Z3 brief',jeanDescription:'Open the legs without leaving fatigue.'}
]
export const raceLibraries = [{id:'tour-2026',name:'Tour de France',status:'rideable' as const},{id:vuelta2026.id,name:vuelta2026.name,status:vuelta2026.status},{id:'training',name:'Training Rides',status:'rideable' as const}]
