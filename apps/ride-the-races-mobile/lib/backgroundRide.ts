import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'

export const RTR_BACKGROUND_LOCATION_TASK='rtr-background-location-v1'
const STORAGE_KEY='rtr-background-ride-state-v1'

type Coord={latitude:number;longitude:number;timestamp:number}
export type BackgroundRideState={
  active:boolean
  distanceMeters:number
  lastCoord:Coord|null
  updatedAt:string|null
}

const emptyState=():BackgroundRideState=>({active:false,distanceMeters:0,lastCoord:null,updatedAt:null})

function segmentMeters(a:Coord,b:Coord){
  const R=6371000
  const toRad=(n:number)=>n*Math.PI/180
  const dLat=toRad(b.latitude-a.latitude)
  const dLon=toRad(b.longitude-a.longitude)
  const lat1=toRad(a.latitude)
  const lat2=toRad(b.latitude)
  const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2
  return 2*R*Math.asin(Math.sqrt(h))
}

export async function readBackgroundRideState(){
  try{
    const raw=await AsyncStorage.getItem(STORAGE_KEY)
    return raw?JSON.parse(raw) as BackgroundRideState:emptyState()
  }catch{
    return emptyState()
  }
}

async function writeState(state:BackgroundRideState){
  await AsyncStorage.setItem(STORAGE_KEY,JSON.stringify(state))
}

TaskManager.defineTask(RTR_BACKGROUND_LOCATION_TASK,async({data,error})=>{
  if(error||!data)return
  const locations=(data as {locations?:Location.LocationObject[]}).locations??[]
  if(!locations.length)return
  const state=await readBackgroundRideState()
  if(!state.active)return
  let distance=state.distanceMeters
  let last=state.lastCoord
  for(const loc of locations){
    const next:Coord={latitude:loc.coords.latitude,longitude:loc.coords.longitude,timestamp:loc.timestamp}
    if(last){
      const segment=segmentMeters(last,next)
      if(segment>=0&&segment<100)distance+=segment
    }
    last=next
  }
  await writeState({...state,distanceMeters:distance,lastCoord:last,updatedAt:new Date().toISOString()})
})

export async function canUseBackgroundRideTracking(){
  try{return await Location.isBackgroundLocationAvailableAsync()}catch{return false}
}

export async function startBackgroundRideTracking(reset=false){
  if(reset)await writeState({...emptyState(),active:true,updatedAt:new Date().toISOString()})
  else{
    const current=await readBackgroundRideState()
    await writeState({...current,active:true,updatedAt:new Date().toISOString()})
  }
  const running=await Location.hasStartedLocationUpdatesAsync(RTR_BACKGROUND_LOCATION_TASK)
  if(!running){
    await Location.startLocationUpdatesAsync(RTR_BACKGROUND_LOCATION_TASK,{
      accuracy:Location.Accuracy.BestForNavigation,
      distanceInterval:5,
      activityType:Location.ActivityType.Fitness,
      pausesUpdatesAutomatically:false,
      showsBackgroundLocationIndicator:true,
      foregroundService:{
        notificationTitle:'Ride the Races',
        notificationBody:'Tracking your active ride',
      },
    })
  }
}

export async function pauseBackgroundRideTracking(){
  const running=await Location.hasStartedLocationUpdatesAsync(RTR_BACKGROUND_LOCATION_TASK)
  if(running)await Location.stopLocationUpdatesAsync(RTR_BACKGROUND_LOCATION_TASK)
  const current=await readBackgroundRideState()
  await writeState({...current,active:false,updatedAt:new Date().toISOString()})
}

export async function resetBackgroundRideTracking(){
  const running=await Location.hasStartedLocationUpdatesAsync(RTR_BACKGROUND_LOCATION_TASK)
  if(running)await Location.stopLocationUpdatesAsync(RTR_BACKGROUND_LOCATION_TASK)
  await writeState(emptyState())
}
