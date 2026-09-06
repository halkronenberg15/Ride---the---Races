import {createElement} from 'react'
const row=(label:string,seconds:number)=>createElement('span',{key:label},createElement('small',null,label),createElement('strong',null,`${Math.round(seconds/60)} min`))
export function WorkoutAllocation({totalSeconds,raceSeconds,cooldownSeconds}:{totalSeconds:number;raceSeconds:number;cooldownSeconds:number}){return createElement('div',{className:'dashboard-card workout-allocation','aria-label':'Selected workout allocation'},row('Total workout',totalSeconds),row('Rollout + KM0 + Race',raceSeconds),row('Cooldown',cooldownSeconds))}
