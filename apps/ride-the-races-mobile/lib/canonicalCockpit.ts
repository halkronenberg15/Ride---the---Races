import { Linking } from 'react-native'

export type CanonicalCockpitLaunch =
 | {kind:'training';workoutId:string;assignmentId?:string;environment?:'INDOOR'|'OUTDOOR'|'AUTO'}
 | {kind:'race';library:string;stageNumber:number;environment?:'INDOOR'|'OUTDOOR'|'AUTO'}

const RTR_WEB='https://ride-the-races.vercel.app'

export function canonicalCockpitUrl(launch:CanonicalCockpitLaunch){
 const params=new URLSearchParams()
 params.set('rtrLaunch','cockpit')
 params.set('kind',launch.kind)
 params.set('environment',launch.environment??'AUTO')
 if(launch.kind==='training'){
  params.set('workoutId',launch.workoutId)
  if(launch.assignmentId)params.set('assignmentId',launch.assignmentId)
 }else{
  params.set('library',launch.library)
  params.set('stage',String(launch.stageNumber))
 }
 return `${RTR_WEB}/?${params.toString()}`
}

export async function openCanonicalCockpit(launch:CanonicalCockpitLaunch){
 const url=canonicalCockpitUrl(launch)
 const supported=await Linking.canOpenURL(url)
 if(!supported)throw new Error('The canonical RtR cockpit could not be opened on this device.')
 await Linking.openURL(url)
 return url
}
