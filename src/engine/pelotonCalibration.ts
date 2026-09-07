import type { CalibrationSample, EquipmentInstance } from './manualBike.ts'

type WorkoutRow=Record<string,string>
const number=(row:WorkoutRow,names:string[])=>{for(const name of names){const value=Number(row[name]?.replace(/[^0-9.-]/g,''));if(Number.isFinite(value)&&value>0)return value}return null}
const field=(headers:string[],aliases:string[])=>headers.find(header=>aliases.some(alias=>header.toLowerCase().includes(alias)))

/** Imports rider/equipment evidence. Workout-level averages deliberately remain low-confidence aggregates. */
export function calibrationSamplesFromWorkoutCsv(csv:string,equipmentId:string):CalibrationSample[]{
 const lines=csv.trim().split(/\r?\n/).filter(Boolean);if(lines.length<2)return[]
 const headers=lines[0].split(',').map(value=>value.trim().replace(/^"|"$/g,''));const cadence=field(headers,['avg cadence','average cadence']),resistance=field(headers,['avg resistance','average resistance']),power=field(headers,['avg watts','average watts','avg output','average output','avg power']),date=field(headers,['date','created','start time','timestamp'])
 if(!cadence||!resistance||!power)return[]
 const samples:CalibrationSample[]=[]
 for(const line of lines.slice(1)){const values=line.match(/("[^"]*"|[^,]+)/g)?.map(value=>value.trim().replace(/^"|"$/g,''))??[];const row=Object.fromEntries(headers.map((header,index)=>[header,values[index]??'']));const c=number(row,[cadence]),r=number(row,[resistance]),p=number(row,[power]);if(c!==null&&r!==null&&p!==null)samples.push({cadence:c,resistance:r,power:p,sourceType:'imported-ride',confidence:'LOW',aggregate:true,equipmentId,observedAt:date?row[date]:undefined})}
 return samples.sort((a,b)=>Date.parse(b.observedAt??'')-Date.parse(a.observedAt??''))
}

export function withRiderCalibration(equipment:EquipmentInstance,samples:CalibrationSample[]):EquipmentInstance{return {...equipment,calibrationConfidence:samples.length?'PERSONALIZED':equipment.calibrationConfidence,calibrationSamples:[...(equipment.calibrationSamples??[]),...samples.filter(sample=>sample.equipmentId===equipment.id)]}}
