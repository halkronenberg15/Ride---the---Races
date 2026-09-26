/* eslint-disable react-refresh/only-export-components */
import { createContext,useContext,useEffect,useMemo,useState } from 'react'
import { outdoorElapsed,outdoorRideStorageKey,pauseOutdoorRide,resumeOutdoorRide,startOutdoorRide,type ActiveOutdoorRide } from '../engine/outdoorRide40252.ts'
import { useAuth } from './AuthContext.tsx'

type Value={ride:ActiveOutdoorRide|null;elapsed:number;start:(assignmentId:string)=>void;pause:()=>void;resume:()=>void;setLocationEnabled:(enabled:boolean)=>void;requestCompletion:(endedEarly:boolean)=>void;clear:()=>void}
const Context=createContext<Value|null>(null)
export function OutdoorRideProvider({children}:{children:React.ReactNode}){
 const {account}=useAuth(),key=outdoorRideStorageKey(account?.id??'anonymous')
 const [ride,setRide]=useState<ActiveOutdoorRide|null>(()=>{try{const saved=JSON.parse(localStorage.getItem(key)??'null') as ActiveOutdoorRide|null;return saved?{...saved,id:saved.id??`outdoor-session:${saved.assignmentId}:${saved.startedAt}`}:null}catch{return null}}),[now,setNow]=useState(0)
 useEffect(()=>{localStorage.setItem(key,JSON.stringify(ride));if(!ride?.runningSince)return;const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer)},[key,ride])
 const value=useMemo<Value>(()=>({ride,elapsed:ride?outdoorElapsed(ride,now):0,start:assignmentId=>setRide(current=>current??startOutdoorRide(assignmentId,Date.now())),pause:()=>setRide(current=>current?pauseOutdoorRide(current,Date.now()):null),resume:()=>setRide(current=>current?resumeOutdoorRide(current,Date.now()):null),setLocationEnabled:enabled=>setRide(current=>current?{...current,locationEnabled:enabled}:null),requestCompletion:endedEarly=>setRide(current=>current?{...pauseOutdoorRide(current,Date.now()),completionRequested:endedEarly?'EARLY':'FULL',locationEnabled:false}:null),clear:()=>setRide(null)}),[now,ride])
 return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useOutdoorRide(){const value=useContext(Context);if(!value)throw new Error('useOutdoorRide must be used inside OutdoorRideProvider');return value}
