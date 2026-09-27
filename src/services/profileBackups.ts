import type { CareerState } from '../types/career.ts'

export type CareerProfileBackup={
 id:string
 createdAt:string
 appVersion:string
 schemaVersion:number|null
 storageKey:string
 careerRaw:string
 reason:'PRE_UPDATE'|'PRE_RESTORE'
}

const backupKey=(storageKey:string)=>`${storageKey}:backups:v1`
const releaseKey=(storageKey:string)=>`${storageKey}:last-app-version`
const MAX_BACKUPS=5

export function readProfileBackups(storage:Pick<Storage,'getItem'>,storageKey:string):CareerProfileBackup[]{
 try{
  const parsed=JSON.parse(storage.getItem(backupKey(storageKey))??'[]')
  return Array.isArray(parsed)?parsed:[]
 }catch{return []}
}

export function lastProfileAppVersion(storage:Pick<Storage,'getItem'>,storageKey:string){
 return storage.getItem(releaseKey(storageKey))
}

function makeBackup(storage:Pick<Storage,'getItem'|'setItem'>,storageKey:string,careerRaw:string,appVersion:string,reason:CareerProfileBackup['reason']){
 let schemaVersion:number|null=null
 const parsed=JSON.parse(careerRaw) as Partial<CareerState>
 schemaVersion=typeof parsed.schemaVersion==='number'?parsed.schemaVersion:null
 const backup:CareerProfileBackup={id:crypto.randomUUID(),createdAt:new Date().toISOString(),appVersion,schemaVersion,storageKey,careerRaw,reason}
 storage.setItem(backupKey(storageKey),JSON.stringify([backup,...readProfileBackups(storage,storageKey)].slice(0,MAX_BACKUPS)))
 return backup
}

export function snapshotBeforeAppUpdate(storage:Pick<Storage,'getItem'|'setItem'>,storageKey:string,careerRaw:string,appVersion:string){
 const priorVersion=lastProfileAppVersion(storage,storageKey)
 if(priorVersion===appVersion)return null
 try{return makeBackup(storage,storageKey,careerRaw,priorVersion??'unknown','PRE_UPDATE')}
 catch{throw new Error('Existing rider profile is not valid JSON; update was stopped before modifying profile data.')}
}

export function restoreProfileBackup(storage:Pick<Storage,'getItem'|'setItem'>,storageKey:string,backupId:string,currentAppVersion:string){
 const target=readProfileBackups(storage,storageKey).find(item=>item.id===backupId)
 if(!target)throw new Error('The selected automatic backup could not be found.')
 const current=storage.getItem(storageKey)
 if(current)makeBackup(storage,storageKey,current,currentAppVersion,'PRE_RESTORE')
 JSON.parse(target.careerRaw)
 storage.setItem(storageKey,target.careerRaw)
 storage.setItem(releaseKey(storageKey),'restore-pending')
 return target
}

export function markProfileAppVersion(storage:Pick<Storage,'setItem'>,storageKey:string,appVersion:string){
 storage.setItem(releaseKey(storageKey),appVersion)
}

export function validateRestoredCareer(career:CareerState){
 if(career.schemaVersion!==6)throw new Error(`Unsupported rider data schema: ${career.schemaVersion}`)
 if(!career.rider||typeof career.rider.name!=='string')throw new Error('Rider identity failed migration validation.')
 if(!Array.isArray(career.rideHistory))throw new Error('Ride history failed migration validation.')
 if(!Array.isArray(career.trainingHistory))throw new Error('Training history failed migration validation.')
 if(!career.alpha4025||!Array.isArray(career.alpha4025.strengthActivities)||!Array.isArray(career.alpha4025.outdoorActivities))throw new Error('Off-season history failed migration validation.')
 return career
}
